import { Injectable, Logger } from '@nestjs/common';
import { PaymentDetailDto } from '../dto/webhook-notification.dto';

export interface AuditLogEntry {
  timestamp: string;
  event: string;
  paymentId: number;
  externalReference?: string;
  status?: string;
  amount?: number;
  payerEmail?: string;
  details?: Record<string, any>;
  source: 'webhook' | 'api' | 'manual';
  userId?: string;
  ipAddress?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  async logPaymentEvent(
    event: string,
    payment: PaymentDetailDto,
    source: 'webhook' | 'api' | 'manual' = 'webhook',
    additionalDetails?: Record<string, any>,
    userId?: string,
    ipAddress?: string,
  ): Promise<void> {
    try {
      const auditEntry: AuditLogEntry = {
        timestamp: new Date().toISOString(),
        event,
        paymentId: payment.id,
        externalReference: payment.external_reference,
        status: payment.status,
        amount: payment.transaction_amount,
        payerEmail: payment.payer?.email,
        details: {
          statusDetail: payment.status_detail,
          paymentMethodId: payment.payment_method_id,
          paymentTypeId: payment.payment_type_id,
          dateCreated: payment.date_created,
          dateApproved: payment.date_approved,
          ...additionalDetails,
        },
        source,
        userId,
        ipAddress,
      };

      // Log estruturado para análise
      this.logger.log('Evento de pagamento auditado', auditEntry);

      // Aqui você pode implementar persistência em banco de dados
      await this.persistAuditLog(auditEntry);

      // Alertas para eventos críticos
      await this.checkForCriticalEvents(auditEntry);

    } catch (error) {
      this.logger.error('Erro ao registrar log de auditoria', {
        event,
        paymentId: payment.id,
        error: error.message,
      });
    }
  }

  async logWebhookEvent(
    event: string,
    paymentId: string,
    webhookData: any,
    processingResult: 'success' | 'error' | 'ignored',
    errorMessage?: string,
  ): Promise<void> {
    try {
      const auditEntry = {
        timestamp: new Date().toISOString(),
        event: `webhook.${event}`,
        paymentId,
        processingResult,
        webhookData: {
          action: webhookData.action,
          type: webhookData.type,
          liveMode: webhookData.live_mode,
          userId: webhookData.user_id,
        },
        errorMessage,
        source: 'webhook' as const,
      };

      this.logger.log('Evento de webhook auditado', auditEntry);
      await this.persistAuditLog(auditEntry);

    } catch (error) {
      this.logger.error('Erro ao registrar log de webhook', {
        event,
        paymentId,
        error: error.message,
      });
    }
  }

  async logPreferenceCreation(
    preferenceData: any,
    result: any,
    userId?: string,
    ipAddress?: string,
  ): Promise<void> {
    try {
      const auditEntry = {
        timestamp: new Date().toISOString(),
        event: 'preference.created',
        preferenceId: result.id,
        externalReference: preferenceData.external_reference,
        amount: preferenceData.items?.[0]?.unit_price,
        details: {
          title: preferenceData.items?.[0]?.title,
          quantity: preferenceData.items?.[0]?.quantity,
          payerEmail: preferenceData.payer?.email,
          backUrls: preferenceData.back_urls,
          notificationUrl: preferenceData.notification_url,
        },
        source: 'api' as const,
        userId,
        ipAddress,
      };

      this.logger.log('Criação de preferência auditada', auditEntry);
      await this.persistAuditLog(auditEntry);

    } catch (error) {
      this.logger.error('Erro ao registrar criação de preferência', {
        preferenceId: result?.id,
        error: error.message,
      });
    }
  }

  private async persistAuditLog(auditEntry: any): Promise<void> {
    try {
      // Aqui você implementaria a persistência em banco de dados
      // Exemplos:
      
      // 1. Banco de dados relacional (PostgreSQL, MySQL)
      // await this.auditRepository.save(auditEntry);
      
      // 2. Banco NoSQL (MongoDB)
      // await this.auditCollection.insertOne(auditEntry);
      
      // 3. Sistema de logs centralizado (Elasticsearch, CloudWatch)
      // await this.logService.index('audit-logs', auditEntry);
      
      // 4. Arquivo de log estruturado (para desenvolvimento)
      // fs.appendFileSync('audit.log', JSON.stringify(auditEntry) + '\n');

      // Por enquanto, apenas log no console com estrutura específica
      console.log('AUDIT_LOG:', JSON.stringify(auditEntry));

    } catch (error) {
      this.logger.error('Erro ao persistir log de auditoria', {
        error: error.message,
        auditEntry,
      });
    }
  }

  private async checkForCriticalEvents(auditEntry: AuditLogEntry): Promise<void> {
    try {
      // Verificar eventos que requerem atenção especial
      const criticalEvents = [
        'payment.approved.high_value',
        'payment.rejected.fraud_suspected',
        'payment.refunded',
        'payment.chargeback',
      ];

      if (criticalEvents.includes(auditEntry.event)) {
        await this.sendCriticalEventAlert(auditEntry);
      }

      // Verificar valores altos
      if (auditEntry.amount && auditEntry.amount > 10000) {
        await this.sendHighValueAlert(auditEntry);
      }

      // Verificar múltiplas tentativas de pagamento
      if (auditEntry.event === 'payment.rejected') {
        await this.checkForMultipleRejections(auditEntry);
      }

    } catch (error) {
      this.logger.error('Erro ao verificar eventos críticos', {
        auditEntry,
        error: error.message,
      });
    }
  }

  private async sendCriticalEventAlert(auditEntry: AuditLogEntry): Promise<void> {
    this.logger.warn('Evento crítico detectado', auditEntry);
    
    // Aqui você implementaria alertas
    // Exemplos: email, Slack, SMS, webhook para sistema de monitoramento
  }

  private async sendHighValueAlert(auditEntry: AuditLogEntry): Promise<void> {
    this.logger.warn('Pagamento de alto valor detectado', {
      paymentId: auditEntry.paymentId,
      amount: auditEntry.amount,
      payerEmail: auditEntry.payerEmail,
    });
  }

  private async checkForMultipleRejections(auditEntry: AuditLogEntry): Promise<void> {
    // Implementar lógica para detectar múltiplas rejeições
    // Pode indicar tentativa de fraude ou problemas técnicos
    this.logger.warn('Pagamento rejeitado - verificar padrão', {
      paymentId: auditEntry.paymentId,
      payerEmail: auditEntry.payerEmail,
      details: auditEntry.details,
    });
  }

  async generateAuditReport(
    startDate: Date,
    endDate: Date,
    filters?: {
      event?: string;
      status?: string;
      payerEmail?: string;
      externalReference?: string;
    },
  ): Promise<any> {
    try {
      // Implementar geração de relatórios de auditoria
      // Retornar dados agregados para análise
      
      this.logger.log('Gerando relatório de auditoria', {
        startDate,
        endDate,
        filters,
      });

      // Aqui você consultaria o banco de dados e geraria estatísticas
      return {
        period: { startDate, endDate },
        filters,
        summary: {
          totalEvents: 0,
          paymentsByStatus: {},
          totalAmount: 0,
          averageAmount: 0,
        },
        events: [],
      };

    } catch (error) {
      this.logger.error('Erro ao gerar relatório de auditoria', {
        startDate,
        endDate,
        filters,
        error: error.message,
      });
      throw error;
    }
  }
}

