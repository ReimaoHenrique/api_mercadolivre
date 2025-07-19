import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { MercadoPagoService } from './mercadopago.service';
import { PaymentStorageService, PaymentData } from './payment-storage.service';
import { EventosApiService } from './eventos-api.service';

export interface PaymentFileChange {
  filename: string;
  externalReference: string;
  event: 'change' | 'add' | 'unlink';
  timestamp: Date;
}

@Injectable()
export class PaymentMonitorService implements OnModuleInit {
  private readonly logger = new Logger(PaymentMonitorService.name);
  private readonly paymentsDir: string;
  private fileWatcher: fs.FSWatcher | null = null;
  private processedFiles = new Set<string>();
  private isProcessing = false;

  constructor(
    private readonly mercadoPagoService: MercadoPagoService,
    private readonly paymentStorageService: PaymentStorageService,
    private readonly eventosApiService: EventosApiService,
  ) {
    this.paymentsDir = path.join(process.cwd(), 'data', 'payments');
  }

  async onModuleInit() {
    await this.startMonitoring();
  }

  async startMonitoring() {
    try {
      // Garantir que o diretório existe
      if (!fs.existsSync(this.paymentsDir)) {
        fs.mkdirSync(this.paymentsDir, { recursive: true });
        this.logger.log('Diretório de pagamentos criado', {
          path: this.paymentsDir,
        });
      }

      // Iniciar monitoramento
      this.fileWatcher = fs.watch(
        this.paymentsDir,
        { recursive: false },
        (eventType, filename) => {
          if (!filename) return;

          const externalReference = filename.replace('.json', '');

          console.log('📁 ARQUIVO DETECTADO:', {
            event: eventType,
            filename,
            externalReference,
            timestamp: new Date().toISOString(),
          });

          // Processar mudança (sem await para evitar erro de Promise)
          this.handleFileChange({
            filename,
            externalReference,
            event: eventType as 'change' | 'add' | 'unlink',
            timestamp: new Date(),
          }).catch((error: unknown) => {
            this.logger.error('Erro ao processar mudança de arquivo', {
              error:
                error instanceof Error ? error.message : 'Erro desconhecido',
            });
          });
        },
      );

      this.logger.log('Monitoramento de arquivos de pagamento iniciado', {
        directory: this.paymentsDir,
      });

      // Processar arquivos existentes que podem não ter sido processados
      await this.processExistingFiles();
    } catch (error) {
      this.logger.error('Erro ao iniciar monitoramento de arquivos', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }

  private async handleFileChange(change: PaymentFileChange) {
    try {
      // Evitar processamento duplicado
      const fileKey = `${change.filename}-${change.event}`;
      if (this.processedFiles.has(fileKey)) {
        console.log('🔄 ARQUIVO JÁ PROCESSADO:', fileKey);
        return;
      }

      // Adicionar à lista de processados
      this.processedFiles.add(fileKey);

      // Limpar da lista após 5 segundos para evitar acúmulo
      setTimeout(() => {
        this.processedFiles.delete(fileKey);
      }, 5000);

      if (change.event === 'unlink') {
        console.log('🗑️ ARQUIVO REMOVIDO:', change.filename);
        return;
      }

      // Aguardar um pouco para garantir que o arquivo foi completamente escrito
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Verificar se o arquivo existe
      const filePath = path.join(this.paymentsDir, change.filename);
      if (!fs.existsSync(filePath)) {
        console.log('❌ ARQUIVO NÃO ENCONTRADO APÓS CRIAÇÃO:', change.filename);
        return;
      }

      // Carregar dados do pagamento
      const paymentData = await this.paymentStorageService.getPayment(
        change.externalReference,
      );
      if (!paymentData) {
        console.log(
          '❌ DADOS DO PAGAMENTO NÃO ENCONTRADOS:',
          change.externalReference,
        );
        return;
      }

      console.log('📋 DADOS DO PAGAMENTO CARREGADOS:', {
        externalReference: change.externalReference,
        status: paymentData.status,
        paymentId: paymentData.paymentId,
        amount: paymentData.amount,
      });

      // Verificar se o pagamento foi aprovado e ainda não foi processado
      if (paymentData.status === 'approved') {
        await this.processApprovedPayment(paymentData);
      } else {
        console.log('⏸️ PAGAMENTO NÃO APROVADO:', {
          externalReference: change.externalReference,
          status: paymentData.status,
        });
      }
    } catch (error) {
      this.logger.error('Erro ao processar mudança de arquivo', {
        change,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }

  private async processApprovedPayment(paymentData: PaymentData) {
    try {
      // Verificar se já foi processado
      if (paymentData.processingDetails?.apiUpdateSuccess) {
        console.log(
          '✅ PAGAMENTO JÁ PROCESSADO ANTERIORMENTE:',
          paymentData.externalReference,
        );
        return;
      }

      console.log(
        '🚀 PROCESSANDO PAGAMENTO APROVADO VIA MONITORAMENTO:',
        paymentData.externalReference,
      );

      // Criar objeto de pagamento no formato esperado
      const paymentObject = {
        id: paymentData.paymentId,
        status: paymentData.status,
        external_reference: paymentData.externalReference,
        transaction_amount: paymentData.amount,
        currency_id: paymentData.currency,
        payer: {
          email: paymentData.payerEmail,
        },
        payment_method_id: paymentData.paymentMethodId,
        payment_type_id: paymentData.paymentTypeId,
        status_detail: paymentData.statusDetail,
        date_created: paymentData.dateCreated,
        date_approved: paymentData.dateApproved,
        date_last_updated: paymentData.dateLastUpdated,
        live_mode: paymentData.liveMode,
        collector_id: paymentData.userId,
        operation_type: 'regular_payment',
        taxes_amount: 0,
        shipping_amount: 0,
        transaction_amount_refunded: 0,
        installments: 1,
        description: 'Pagamento processado via monitoramento',
        statement_descriptor: null,
        notification_url: null,
        callback_url: null,
        processing_mode: 'aggregator',
        binary_mode: false,
        captured: true,
        captured_amount: paymentData.amount,
        money_release_date: paymentData.dateApproved,
        money_release_status: 'released',
        payment_method: {
          id: paymentData.paymentMethodId,
          type: paymentData.paymentTypeId,
        },
        transaction_details: {
          net_received_amount: paymentData.amount * 0.99,
          total_paid_amount: paymentData.amount,
          overpaid_amount: 0,
          installment_amount: 0,
        },
      };

      // Processar o pagamento
      await this.mercadoPagoService.processApprovedPayment(
        paymentObject as any,
      );

      console.log(
        '✅ PAGAMENTO PROCESSADO COM SUCESSO VIA MONITORAMENTO:',
        paymentData.externalReference,
      );
    } catch (error) {
      console.log('💥 ERRO AO PROCESSAR PAGAMENTO VIA MONITORAMENTO:', {
        externalReference: paymentData.externalReference,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });

      this.logger.error('Erro ao processar pagamento via monitoramento', {
        externalReference: paymentData.externalReference,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }

  private async processExistingFiles() {
    try {
      console.log('🔍 PROCESSANDO ARQUIVOS EXISTENTES...');

      const files = fs.readdirSync(this.paymentsDir);
      const jsonFiles = files.filter((file) => file.endsWith('.json'));

      console.log(`📁 ENCONTRADOS ${jsonFiles.length} ARQUIVOS DE PAGAMENTO`);

      for (const filename of jsonFiles) {
        const externalReference = filename.replace('.json', '');

        try {
          const paymentData =
            await this.paymentStorageService.getPayment(externalReference);

          if (paymentData && paymentData.status === 'approved') {
            console.log(
              '🔄 PROCESSANDO ARQUIVO EXISTENTE APROVADO:',
              externalReference,
            );
            await this.processApprovedPayment(paymentData);
          }
        } catch (error) {
          console.log('❌ ERRO AO PROCESSAR ARQUIVO EXISTENTE:', {
            filename,
            error: error instanceof Error ? error.message : 'Erro desconhecido',
          });
        }
      }

      console.log('✅ PROCESSAMENTO DE ARQUIVOS EXISTENTES CONCLUÍDO');
    } catch (error) {
      this.logger.error('Erro ao processar arquivos existentes', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }

  stopMonitoring() {
    if (this.fileWatcher) {
      this.fileWatcher.close();
      this.fileWatcher = null;
      this.logger.log('Monitoramento de arquivos de pagamento parado');
    }
  }

  // Método para forçar reprocessamento de um pagamento específico
  async reprocessPayment(externalReference: string) {
    try {
      console.log('🔄 FORÇANDO REPROCESSAMENTO:', externalReference);

      const paymentData =
        await this.paymentStorageService.getPayment(externalReference);
      if (!paymentData) {
        throw new Error('Pagamento não encontrado');
      }

      await this.processApprovedPayment(paymentData);

      return {
        success: true,
        message: 'Pagamento reprocessado com sucesso',
        externalReference,
      };
    } catch (error) {
      this.logger.error('Erro ao reprocessar pagamento', {
        externalReference,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });

      return {
        success: false,
        message: 'Erro ao reprocessar pagamento',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  // Método para obter status do monitoramento
  getMonitoringStatus() {
    return {
      isActive: this.fileWatcher !== null,
      directory: this.paymentsDir,
      processedFilesCount: this.processedFiles.size,
      isProcessing: this.isProcessing,
    };
  }
}
