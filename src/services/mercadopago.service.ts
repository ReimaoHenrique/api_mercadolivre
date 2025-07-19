import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import * as fs from 'fs';
import * as path from 'path';
import { CreatePreferenceDto } from '../dto/create-preference.dto';
import { PaymentDetailDto } from '../dto/webhook-notification.dto';
import { NotificationService } from './notification.service';
import { EventosApiService } from './eventos-api.service';
import { PaymentStorageService, PaymentData } from './payment-storage.service';

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private client: MercadoPagoConfig;
  private preference: Preference;
  private payment: Payment;

  constructor(
    private configService: ConfigService,
    private notificationService: NotificationService,
    private eventosApiService: EventosApiService,
    private paymentStorageService: PaymentStorageService,
  ) {
    const accessToken = this.configService.get<string>(
      'mercadoPago.accessToken',
    );

    if (!accessToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado');
    }

    this.client = new MercadoPagoConfig({
      accessToken: accessToken,
      options: {
        timeout: 5000,
        idempotencyKey: 'abc',
      },
    });

    this.preference = new Preference(this.client);
    this.payment = new Payment(this.client);
  }

  async createPreference(
    data: CreatePreferenceDto,
    userId?: string,
    ipAddress?: string,
  ) {
    try {
      const preferenceData = {
        items: [
          {
            id: `item_${Date.now()}`,
            title: data.title,
            description: data.description,
            quantity: data.quantity,
            unit_price: data.unit_price,
            currency_id: data.currency_id || 'BRL',
          },
        ],
        payer: data.payer,
        external_reference: data.external_reference,
        notification_url:
          data.notification_url ||
          this.configService.get<string>('urls.webhook'),
        back_urls: {
          success:
            data.back_urls?.success ||
            this.configService.get<string>('urls.success'),
          failure:
            data.back_urls?.failure ||
            this.configService.get<string>('urls.failure'),
          pending:
            data.back_urls?.pending ||
            this.configService.get<string>('urls.pending'),
        },
        auto_return: data.auto_return || 'approved',
        payment_methods: data.payment_methods,
      };

      this.logger.log('Criando preferência de pagamento', { preferenceData });

      const response = await this.preference.create({ body: preferenceData });

      this.logger.log('Preferência criada com sucesso', {
        id: response.id,
        init_point: response.init_point,
      });

      // Criar estrutura de pastas para o pagamento
      if (preferenceData.external_reference) {
        await this.createPaymentFolders(preferenceData.external_reference);
      }

      return {
        id: response.id,
        init_point: response.init_point,
        sandbox_init_point: response.sandbox_init_point,
        client_id: response.client_id,
        collector_id: response.collector_id,
        operation_type: response.operation_type,
        additional_info: response.additional_info,
        external_reference: response.external_reference,
        date_created: response.date_created,
        payer: data.payer, // Incluir dados do pagador na resposta
      };
    } catch (error) {
      this.logger.error('Erro ao criar preferência de pagamento', error);
      throw new Error(`Erro ao criar preferência: ${error.message}`);
    }
  }

  async getPayment(paymentId: string): Promise<PaymentDetailDto> {
    try {
      this.logger.log('Buscando detalhes do pagamento', { paymentId });

      const response = await this.payment.get({ id: paymentId });

      this.logger.log('Detalhes do pagamento obtidos', {
        id: response.id,
        status: response.status,
        external_reference: response.external_reference,
      });

      return response as any;
    } catch (error) {
      this.logger.error('Erro ao buscar pagamento', { paymentId, error });
      throw new Error(`Erro ao buscar pagamento: ${error.message}`);
    }
  }

  async processApprovedPayment(payment: PaymentDetailDto): Promise<void> {
    try {
      this.logger.log('Processando pagamento aprovado', {
        paymentId: payment.id,
        externalReference: payment.external_reference,
        amount: payment.transaction_amount,
        payerEmail: payment.payer?.email,
      });

      // Salvar dados do pagamento em arquivo JSON
      await this.savePaymentData(payment);

      // Implementar lógica específica do negócio baseada na referência externa
      await this.executeBusinessLogic(payment);

      // Atualizar status do convidado na API de eventos
      if (payment.external_reference) {
        const success =
          await this.eventosApiService.updateConvidadoStatusFromPayment(
            payment.external_reference,
            payment,
          );

        if (success) {
          this.logger.log('Status do convidado atualizado com sucesso', {
            externalReference: payment.external_reference,
            paymentId: payment.id,
          });
        } else {
          this.logger.error('Falha ao atualizar status do convidado', {
            externalReference: payment.external_reference,
            paymentId: payment.id,
          });
        }
      }

      // Enviar confirmação/link de pagamento
      await this.notificationService.sendPaymentConfirmation(payment);

      this.logger.log('Pagamento processado com sucesso', {
        paymentId: payment.id,
        status: payment.status,
        processedAt: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('Erro ao processar pagamento aprovado', {
        paymentId: payment.id,
        error: error.message,
      });
      throw error;
    }
  }

  private async executeBusinessLogic(payment: PaymentDetailDto): Promise<void> {
    try {
      const externalRef = payment.external_reference;

      if (!externalRef) {
        this.logger.warn('Pagamento sem referência externa', {
          paymentId: payment.id,
        });
        return;
      }

      // Lógica específica baseada no tipo de produto/serviço
      if (externalRef.startsWith('COURSE_')) {
        await this.activateCourseAccess(payment, externalRef);
      } else if (externalRef.startsWith('PRODUCT_')) {
        await this.enableProductDownload(payment, externalRef);
      } else if (externalRef.startsWith('SERVICE_')) {
        await this.activateService(payment, externalRef);
      } else if (externalRef.startsWith('SUBSCRIPTION_')) {
        await this.activateSubscription(payment, externalRef);
      } else {
        this.logger.log(
          'Referência externa não reconhecida, aplicando lógica padrão',
          {
            paymentId: payment.id,
            externalReference: externalRef,
          },
        );
        await this.defaultBusinessLogic(payment);
      }
    } catch (error) {
      this.logger.error('Erro ao executar lógica de negócio', {
        paymentId: payment.id,
        externalReference: payment.external_reference,
        error: error.message,
      });
      throw error;
    }
  }

  private async activateCourseAccess(
    payment: PaymentDetailDto,
    courseRef: string,
  ): Promise<void> {
    this.logger.log('Ativando acesso ao curso', {
      paymentId: payment.id,
      courseRef,
      payerEmail: payment.payer?.email,
    });

    // Implementar:
    // 1. Criar usuário no sistema de cursos
    // 2. Matricular no curso específico
    // 3. Enviar credenciais de acesso
    // 4. Configurar período de acesso
  }

  private async enableProductDownload(
    payment: PaymentDetailDto,
    productRef: string,
  ): Promise<void> {
    this.logger.log('Habilitando download do produto', {
      paymentId: payment.id,
      productRef,
      payerEmail: payment.payer?.email,
    });

    // Implementar:
    // 1. Gerar link de download temporário
    // 2. Configurar expiração do link
    // 3. Registrar download permitido
    // 4. Enviar link por email
  }

  private async activateService(
    payment: PaymentDetailDto,
    serviceRef: string,
  ): Promise<void> {
    this.logger.log('Ativando serviço', {
      paymentId: payment.id,
      serviceRef,
      payerEmail: payment.payer?.email,
    });

    // Implementar:
    // 1. Ativar serviço específico
    // 2. Configurar período de validade
    // 3. Criar conta de acesso se necessário
    // 4. Notificar equipe de atendimento
  }

  private async activateSubscription(
    payment: PaymentDetailDto,
    subscriptionRef: string,
  ): Promise<void> {
    this.logger.log('Ativando assinatura', {
      paymentId: payment.id,
      subscriptionRef,
      payerEmail: payment.payer?.email,
    });

    // Implementar:
    // 1. Ativar assinatura
    // 2. Configurar renovação automática
    // 3. Definir data de vencimento
    // 4. Enviar boas-vindas
  }

  private async defaultBusinessLogic(payment: PaymentDetailDto): Promise<void> {
    this.logger.log('Executando lógica padrão de negócio', {
      paymentId: payment.id,
      externalReference: payment.external_reference,
    });

    // Lógica padrão para pagamentos sem categoria específica
    // Por exemplo: apenas registrar o pagamento e enviar confirmação
  }

  getWebhookSecret(): string {
    return this.configService.get<string>('mercadoPago.webhookSecret') || '';
  }

  async getPaymentHistory(
    startDate?: string,
    endDate?: string,
    status?: string,
    limit: number = 100,
  ): Promise<{
    payments: PaymentDetailDto[];
    summary: {
      total: number;
      approved: number;
      pending: number;
      rejected: number;
      totalAmount: number;
      averageAmount: number;
    };
  }> {
    try {
      this.logger.log('Gerando histórico de pagamentos', {
        startDate,
        endDate,
        status,
        limit,
      });

      const filters: any = {
        limit,
        offset: 0,
      };

      if (startDate) {
        filters.date_created_from = startDate;
      }

      if (endDate) {
        filters.date_created_to = endDate;
      }

      if (status) {
        filters.status = status;
      }

      // Retornar dados vazios já que removemos a busca de pagamentos
      const summary = {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        totalAmount: 0,
        averageAmount: 0,
      };

      this.logger.log('Histórico de pagamentos gerado', { summary });

      return {
        payments: [],
        summary,
      };
    } catch (error) {
      this.logger.error('Erro ao gerar histórico de pagamentos', {
        startDate,
        endDate,
        status,
        error,
      });
      throw new Error(`Erro ao gerar histórico: ${error.message}`);
    }
  }

  private async savePaymentData(payment: PaymentDetailDto): Promise<void> {
    try {
      if (!payment.external_reference) {
        this.logger.warn('Pagamento sem external_reference, não será salvo', {
          paymentId: payment.id,
        });
        return;
      }

      const paymentData: PaymentData = {
        externalReference: payment.external_reference,
        paymentId: payment.id.toString(),
        status: payment.status,
        amount: payment.transaction_amount,
        currency: payment.currency_id,
        payerEmail: payment.payer?.email || '',
        paymentMethodId: payment.payment_method_id,
        paymentTypeId: payment.payment_type_id,
        statusDetail: payment.status_detail,
        dateCreated: payment.date_created,
        dateApproved: payment.date_approved,
        dateLastUpdated: new Date().toISOString(),
        liveMode: payment.live_mode,
        userId: payment.collector_id?.toString() || '',
        webhookData: payment,
        processingDetails: {
          processingStartedAt: new Date().toISOString(),
        },
        businessLogic: {
          processedWithDefaultLogic: true,
        },
      };

      await this.paymentStorageService.savePayment(paymentData);

      this.logger.log('Dados do pagamento salvos com sucesso', {
        externalReference: payment.external_reference,
        paymentId: payment.id,
        status: payment.status,
        payerEmail: payment.payer?.email,
      });
    } catch (error) {
      this.logger.error('Erro ao salvar dados do pagamento', {
        paymentId: payment.id,
        externalReference: payment.external_reference,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }

  private async createPaymentFolders(externalReference: string): Promise<void> {
    try {
      if (!externalReference) {
        this.logger.warn(
          'External reference não fornecida, não criando pastas',
        );
        return;
      }

      const baseDir = path.join(process.cwd(), 'data');
      const paymentDir = path.join(baseDir, 'payments');

      // Criar diretórios se não existirem
      const dirs = [baseDir, paymentDir];

      for (const dir of dirs) {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          this.logger.log('Diretório criado', { path: dir });
        }
      }

      // Criar arquivo de placeholder para o pagamento
      const paymentFile = path.join(paymentDir, `${externalReference}.json`);
      if (!fs.existsSync(paymentFile)) {
        const placeholderData = {
          externalReference,
          status: 'preference_created',
          dateCreated: new Date().toISOString(),
          preferenceCreatedAt: new Date().toISOString(),
          message: 'Preferência de pagamento criada - aguardando pagamento',
        };

        fs.writeFileSync(paymentFile, JSON.stringify(placeholderData, null, 2));
        this.logger.log('Arquivo de placeholder criado para pagamento', {
          externalReference,
          filepath: paymentFile,
        });
      }

      this.logger.log('Estrutura de pastas criada com sucesso', {
        externalReference,
        baseDir,
      });
    } catch (error) {
      this.logger.error('Erro ao criar estrutura de pastas', {
        externalReference,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }
}
