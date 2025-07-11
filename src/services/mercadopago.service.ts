import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { CreatePreferenceDto } from '../dto/create-preference.dto';
import { PaymentDetailDto } from '../dto/webhook-notification.dto';
import { NotificationService } from './notification.service';
import { AuditService } from './audit.service';

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private client: MercadoPagoConfig;
  private preference: Preference;
  private payment: Payment;

  constructor(
    private configService: ConfigService,
    private notificationService: NotificationService,
    private auditService: AuditService,
  ) {
    const accessToken = this.configService.get<string>('mercadoPago.accessToken');
    
    if (!accessToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado');
    }

    this.client = new MercadoPagoConfig({
      accessToken: accessToken,
      options: {
        timeout: 5000,
        idempotencyKey: 'abc'
      }
    });

    this.preference = new Preference(this.client);
    this.payment = new Payment(this.client);
  }

  async createPreference(data: CreatePreferenceDto, userId?: string, ipAddress?: string) {
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
          }
        ],
        payer: data.payer,
        external_reference: data.external_reference,
        notification_url: data.notification_url || this.configService.get<string>('urls.webhook'),
        back_urls: {
          success: data.back_urls?.success || this.configService.get<string>('urls.success'),
          failure: data.back_urls?.failure || this.configService.get<string>('urls.failure'),
          pending: data.back_urls?.pending || this.configService.get<string>('urls.pending'),
        },
        auto_return: data.auto_return || 'approved',
        payment_methods: data.payment_methods,
      };

      this.logger.log('Criando preferência de pagamento', { preferenceData });
      
      const response = await this.preference.create({ body: preferenceData });
      
      this.logger.log('Preferência criada com sucesso', { 
        id: response.id, 
        init_point: response.init_point 
      });

      // Registrar auditoria da criação da preferência
      await this.auditService.logPreferenceCreation(preferenceData, response, userId, ipAddress);

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
        external_reference: response.external_reference 
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

      // Registrar evento de auditoria
      await this.auditService.logPaymentEvent(
        'payment.approved.processing_started',
        payment,
        'webhook',
        { processingStartedAt: new Date().toISOString() }
      );

      // Implementar lógica específica do negócio baseada na referência externa
      await this.executeBusinessLogic(payment);

      // Enviar confirmação/link de pagamento
      await this.notificationService.sendPaymentConfirmation(payment);

      // Registrar conclusão do processamento
      await this.auditService.logPaymentEvent(
        'payment.approved.processing_completed',
        payment,
        'webhook',
        { 
          processingCompletedAt: new Date().toISOString(),
          notificationSent: true,
        }
      );

      this.logger.log('Pagamento processado com sucesso', {
        paymentId: payment.id,
        status: payment.status,
        processedAt: new Date().toISOString(),
      });

    } catch (error) {
      // Registrar erro na auditoria
      await this.auditService.logPaymentEvent(
        'payment.approved.processing_failed',
        payment,
        'webhook',
        { 
          error: error.message,
          failedAt: new Date().toISOString(),
        }
      );

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
        this.logger.warn('Pagamento sem referência externa', { paymentId: payment.id });
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
        this.logger.log('Referência externa não reconhecida, aplicando lógica padrão', {
          paymentId: payment.id,
          externalReference: externalRef,
        });
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

  private async activateCourseAccess(payment: PaymentDetailDto, courseRef: string): Promise<void> {
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

    await this.auditService.logPaymentEvent(
      'course.access_activated',
      payment,
      'webhook',
      { courseReference: courseRef }
    );
  }

  private async enableProductDownload(payment: PaymentDetailDto, productRef: string): Promise<void> {
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

    await this.auditService.logPaymentEvent(
      'product.download_enabled',
      payment,
      'webhook',
      { productReference: productRef }
    );
  }

  private async activateService(payment: PaymentDetailDto, serviceRef: string): Promise<void> {
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

    await this.auditService.logPaymentEvent(
      'service.activated',
      payment,
      'webhook',
      { serviceReference: serviceRef }
    );
  }

  private async activateSubscription(payment: PaymentDetailDto, subscriptionRef: string): Promise<void> {
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

    await this.auditService.logPaymentEvent(
      'subscription.activated',
      payment,
      'webhook',
      { subscriptionReference: subscriptionRef }
    );
  }

  private async defaultBusinessLogic(payment: PaymentDetailDto): Promise<void> {
    this.logger.log('Executando lógica padrão de negócio', {
      paymentId: payment.id,
      externalReference: payment.external_reference,
    });

    // Lógica padrão para pagamentos sem categoria específica
    // Por exemplo: apenas registrar o pagamento e enviar confirmação

    await this.auditService.logPaymentEvent(
      'payment.default_processing',
      payment,
      'webhook',
      { processedWithDefaultLogic: true }
    );
  }

  getWebhookSecret(): string {
    return this.configService.get<string>('mercadoPago.webhookSecret') || '';
  }
}

