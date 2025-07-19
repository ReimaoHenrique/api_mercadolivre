import {
  Controller,
  Post,
  Body,
  Headers,
  Query,
  HttpStatus,
  HttpCode,
  Logger,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { MercadoPagoService } from '../services/mercadopago.service';
import { WebhookValidationService } from '../services/webhook-validation.service';
import {
  WebhookNotificationDto,
  WebhookQueryParamsDto,
} from '../dto/webhook-notification.dto';

@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly mercadoPagoService: MercadoPagoService,
    private readonly webhookValidationService: WebhookValidationService,
  ) {}

  @Post('mercadopago')
  @HttpCode(HttpStatus.OK)
  async handleMercadoPagoWebhook(
    @Body() body: WebhookNotificationDto,
    @Query() queryParams: WebhookQueryParamsDto,
    @Headers('x-signature') xSignature: string,
    @Headers('x-request-id') xRequestId: string,
  ) {
    try {
      this.logger.log('Webhook recebido do Mercado Pago', {
        body,
        queryParams,
        headers: {
          xSignature: xSignature ? 'presente' : 'ausente',
          xRequestId,
        },
      });

      // Validar se é uma notificação de pagamento
      if (body.type !== 'payment' || !body.data?.id) {
        this.logger.warn(
          'Webhook ignorado - não é uma notificação de pagamento',
          {
            type: body.type,
            dataId: body.data?.id,
          },
        );
        return {
          status: 'ignored',
          message: 'Não é uma notificação de pagamento',
        };
      }

      // Validação de assinatura desabilitada em desenvolvimento
      this.logger.log(
        'Validação de assinatura desabilitada em desenvolvimento',
      );

      // Em produção, você deve habilitar a validação:
      // const webhookSecret = this.mercadoPagoService.getWebhookSecret();
      // if (webhookSecret && xSignature && xRequestId) {
      //   const rawBody = JSON.stringify(body);
      //   const isSignatureValid = this.webhookValidationService.validateSignature(
      //     xSignature,
      //     xRequestId,
      //     queryParams['data.id'] || body.data.id,
      //     rawBody,
      //     webhookSecret,
      //   );
      //   if (!isSignatureValid) {
      //     throw new UnauthorizedException('Assinatura inválida');
      //   }
      // }

      let processingError: string | undefined;

      try {
        // Processar a notificação baseada na ação
        await this.processWebhookNotification(body);
      } catch (error) {
        processingError =
          error instanceof Error ? error.message : 'Erro desconhecido';
        this.logger.error('Erro ao processar webhook', {
          error: processingError,
        });
      }

      return {
        status: 'success',
        message: 'Webhook processado com sucesso',
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      const errorStack =
        error instanceof Error ? error.stack : 'Stack não disponível';
      this.logger.error('Erro ao processar webhook', {
        error: errorMessage,
        stack: errorStack,
        body,
        queryParams,
      });

      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      // Para outros erros, retornar 200 para evitar reenvios desnecessários
      return {
        status: 'error',
        message: 'Erro interno ao processar webhook',
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async processWebhookNotification(
    notification: WebhookNotificationDto,
  ): Promise<void> {
    const { action, data } = notification;

    this.logger.log('Processando notificação', {
      action,
      paymentId: data.id,
      liveMode: notification.live_mode,
    });

    try {
      switch (action) {
        case 'payment.created':
          await this.handlePaymentCreated(data.id);
          break;

        case 'payment.updated':
          await this.handlePaymentUpdated(data.id);
          break;

        default:
          this.logger.log('Ação de webhook não tratada', { action });
          break;
      }
    } catch (error) {
      this.logger.error('Erro ao processar ação do webhook', {
        action,
        paymentId: data.id,
        error: error.message,
      });
      throw error;
    }
  }

  private async handlePaymentCreated(paymentId: string): Promise<void> {
    this.logger.log('Processando pagamento criado', { paymentId });

    try {
      const payment = await this.mercadoPagoService.getPayment(paymentId);

      this.logger.log('Pagamento criado processado', {
        paymentId: payment.id,
        status: payment.status,
        externalReference: payment.external_reference,
        amount: payment.transaction_amount,
      });

      // Aqui você pode implementar lógica específica para pagamento criado
      // Por exemplo: registrar no banco de dados, enviar notificação, etc.
    } catch (error) {
      this.logger.error('Erro ao processar pagamento criado', {
        paymentId,
        error: error.message,
      });
      throw error;
    }
  }

  private async handlePaymentUpdated(paymentId: string): Promise<void> {
    this.logger.log('Processando atualização de pagamento', { paymentId });

    try {
      const payment = await this.mercadoPagoService.getPayment(paymentId);

      this.logger.log('Status do pagamento atualizado', {
        paymentId: payment.id,
        status: payment.status,
        statusDetail: payment.status_detail,
        externalReference: payment.external_reference,
        amount: payment.transaction_amount,
      });

      // Processar baseado no status do pagamento
      switch (payment.status) {
        case 'approved':
          await this.mercadoPagoService.processApprovedPayment(payment);
          break;

        case 'rejected':
          await this.handleRejectedPayment(payment);
          break;

        case 'cancelled':
          await this.handleCancelledPayment(payment);
          break;

        case 'refunded':
          await this.handleRefundedPayment(payment);
          break;

        case 'pending':
          await this.handlePendingPayment(payment);
          break;

        default:
          this.logger.log('Status de pagamento não tratado', {
            paymentId: payment.id,
            status: payment.status,
          });
          break;
      }
    } catch (error) {
      this.logger.error('Erro ao processar atualização de pagamento', {
        paymentId,
        error: error.message,
      });
      throw error;
    }
  }

  private async handleRejectedPayment(payment: any): Promise<void> {
    this.logger.log('Processando pagamento rejeitado', {
      paymentId: payment.id,
      statusDetail: payment.status_detail,
      externalReference: payment.external_reference,
    });

    // Implementar lógica para pagamento rejeitado
    // Por exemplo: notificar usuário, liberar estoque, etc.
  }

  private async handleCancelledPayment(payment: any): Promise<void> {
    this.logger.log('Processando pagamento cancelado', {
      paymentId: payment.id,
      externalReference: payment.external_reference,
    });

    // Implementar lógica para pagamento cancelado
  }

  private async handleRefundedPayment(payment: any): Promise<void> {
    this.logger.log('Processando pagamento estornado', {
      paymentId: payment.id,
      refundedAmount: payment.transaction_amount_refunded,
      externalReference: payment.external_reference,
    });

    // Implementar lógica para pagamento estornado
  }

  private async handlePendingPayment(payment: any): Promise<void> {
    this.logger.log('Processando pagamento pendente', {
      paymentId: payment.id,
      statusDetail: payment.status_detail,
      externalReference: payment.external_reference,
    });

    // Implementar lógica para pagamento pendente
    // Por exemplo: aguardar confirmação, notificar sobre pendência, etc.
  }
}
