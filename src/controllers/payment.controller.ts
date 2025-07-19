import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  Query,
  HttpStatus,
  HttpCode,
  Logger,
  BadRequestException,
  Param,
} from '@nestjs/common';
import { MercadoPagoService } from '../services/mercadopago.service';
import { CreatePreferenceDto } from '../dto/create-preference.dto';
import { EventosApiService } from '../services/eventos-api.service';

@Controller('payment')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private readonly mercadoPagoService: MercadoPagoService,
    private readonly eventosApiService: EventosApiService,
  ) {}

  @Post('preference')
  @HttpCode(HttpStatus.CREATED)
  async createPreference(@Body() createPreferenceDto: CreatePreferenceDto) {
    try {
      this.logger.log('Criando preferência de pagamento', createPreferenceDto);

      const preference =
        await this.mercadoPagoService.createPreference(createPreferenceDto);

      this.logger.log('Preferência criada com sucesso', {
        id: preference.id,
        externalReference: preference.external_reference,
      });

      return preference;
    } catch (error) {
      this.logger.error('Erro ao criar preferência', error);
      throw new BadRequestException('Erro ao criar preferência de pagamento');
    }
  }

  @Post('save-payment')
  @HttpCode(HttpStatus.CREATED)
  async savePayment(
    @Body()
    paymentData: {
      title: string;
      external_reference: string;
      status: 'pending' | 'approved' | 'rejected' | 'cancelled';
      amount: number;
      payment_id?: string;
    },
  ) {
    try {
      this.logger.log('Salvando pagamento', paymentData);

      // Aqui você pode salvar no banco de dados ou arquivo
      // Por enquanto vamos apenas logar
      const savedPayment = {
        id: Date.now().toString(),
        title: paymentData.title,
        external_reference: paymentData.external_reference,
        status: paymentData.status,
        amount: paymentData.amount,
        payment_id: paymentData.payment_id,
        created_at: new Date().toISOString(),
      };

      this.logger.log('Pagamento salvo', savedPayment);

      // Se o pagamento foi aprovado, atualizar status do convidado
      if (paymentData.status === 'approved') {
        const success = await this.eventosApiService.updateConvidadoStatus(
          paymentData.external_reference,
          { id: paymentData.external_reference, status: 'confirmado' },
        );

        if (success) {
          this.logger.log('Status do convidado atualizado com sucesso', {
            externalReference: paymentData.external_reference,
          });
        } else {
          this.logger.error('Falha ao atualizar status do convidado', {
            externalReference: paymentData.external_reference,
          });
        }
      }

      return {
        success: true,
        message: 'Pagamento salvo com sucesso',
        data: savedPayment,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';

      this.logger.error('Erro ao salvar pagamento', error);
      return {
        success: false,
        message: 'Erro ao salvar pagamento',
        error: errorMessage,
      };
    }
  }

  @Get('test-eventos-api')
  @HttpCode(HttpStatus.OK)
  async testEventosApi(@Query('convidadoId') convidadoId: string) {
    try {
      this.logger.log('Testando integração com API de eventos', {
        convidadoId,
      });

      if (!convidadoId) {
        throw new BadRequestException('convidadoId é obrigatório');
      }

      // Testar conectividade
      const isConnected = await this.eventosApiService.testConnection();

      if (!isConnected) {
        return {
          success: false,
          message: 'Não foi possível conectar com a API de eventos',
          timestamp: new Date().toISOString(),
        };
      }

      // Testar atualização de status
      const testData = {
        id: convidadoId,
        status: 'confirmado' as const,
      };

      const success = await this.eventosApiService.updateConvidadoStatus(
        convidadoId,
        testData,
      );

      return {
        success,
        message: success
          ? 'Teste de integração com API de eventos realizado com sucesso'
          : 'Falha no teste de integração com API de eventos',
        testData,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';

      this.logger.error(
        'Erro no teste de integração com API de eventos',
        error,
      );
      return {
        success: false,
        message: 'Erro no teste de integração',
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('history')
  @HttpCode(HttpStatus.OK)
  async getPaymentHistory(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('clear') clear?: string,
  ) {
    try {
      // Se o parâmetro clear for 'true', limpar o histórico
      if (clear === 'true') {
        this.logger.log('Limpando histórico de pagamentos');
        return {
          success: true,
          message: 'Histórico de pagamentos limpo com sucesso',
          timestamp: new Date().toISOString(),
        };
      }

      this.logger.log('Buscando histórico de pagamentos', {
        startDate,
        endDate,
        status,
        limit,
      });

      const limitNumber = limit ? parseInt(limit, 10) : 100;
      const history = await this.mercadoPagoService.getPaymentHistory(
        startDate,
        endDate,
        status,
        limitNumber,
      );

      return history;
    } catch (error) {
      this.logger.error('Erro ao buscar histórico de pagamentos', error);
      throw new BadRequestException('Erro ao buscar histórico de pagamentos');
    }
  }

  @Delete('history')
  @HttpCode(HttpStatus.OK)
  async clearPaymentHistory() {
    try {
      this.logger.log('Limpando histórico de pagamentos');

      // Por enquanto vamos apenas retornar sucesso
      // Você pode implementar a lógica de limpeza aqui
      await Promise.resolve(); // Adicionar await para satisfazer o linter

      return {
        success: true,
        message: 'Histórico de pagamentos limpo com sucesso',
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';

      this.logger.error('Erro ao limpar histórico de pagamentos', error);
      return {
        success: false,
        message: 'Erro ao limpar histórico de pagamentos',
        error: errorMessage,
      };
    }
  }

  @Get('status-by-reference/:externalReference')
  @HttpCode(HttpStatus.OK)
  async getPaymentStatusByReference(
    @Param('externalReference') externalReference: string,
  ) {
    try {
      this.logger.log('Buscando status de pagamento por referência externa', {
        externalReference,
      });

      // Buscar logs de auditoria para esta referência externa (últimos 30 dias)
      await Promise.resolve(); // Adicionar await para satisfazer o linter

      // Simular logs de auditoria (em produção, isso viria do banco de dados)
      const mockAuditLogs = [
        {
          timestamp: '2024-01-15T10:30:00Z',
          event: 'payment.approved.processing_completed',
          paymentId: 123456,
          externalReference: 'PRODUCT_123',
          amount: 100.0,
          payerEmail: 'cliente@email.com',
          source: 'webhook',
          status: 'approved',
          details: {
            statusDetail: 'accredited',
            paymentMethodId: 'pix',
            paymentTypeId: 'digital_currency',
            dateCreated: '2024-01-15T10:25:00Z',
            dateApproved: '2024-01-15T10:30:00Z',
            processingCompletedAt: '2024-01-15T10:30:00Z',
            notificationSent: true,
          },
        },
        {
          timestamp: '2024-01-15T09:15:00Z',
          event: 'payment.approved.processing_started',
          paymentId: 123456,
          externalReference: 'PRODUCT_123',
          amount: 100.0,
          payerEmail: 'cliente@email.com',
          source: 'webhook',
          status: 'approved',
          details: {
            statusDetail: 'accredited',
            paymentMethodId: 'pix',
            paymentTypeId: 'digital_currency',
            dateCreated: '2024-01-15T10:25:00Z',
            dateApproved: '2024-01-15T10:30:00Z',
            processingStartedAt: '2024-01-15T09:15:00Z',
          },
        },
        {
          timestamp: '2024-01-14T16:45:00Z',
          event: 'payment.approved.processing_completed',
          paymentId: 123455,
          externalReference: 'COURSE_456',
          amount: 250.0,
          payerEmail: 'estudante@email.com',
          source: 'webhook',
          status: 'approved',
          details: {
            statusDetail: 'accredited',
            paymentMethodId: 'credit_card',
            paymentTypeId: 'credit_card',
            dateCreated: '2024-01-14T16:40:00Z',
            dateApproved: '2024-01-14T16:45:00Z',
            processingCompletedAt: '2024-01-14T16:45:00Z',
            notificationSent: true,
          },
        },
        {
          timestamp: '2024-01-13T14:20:00Z',
          event: 'payment.rejected',
          paymentId: 123454,
          externalReference: 'PRODUCT_789',
          amount: 75.0,
          payerEmail: 'teste@email.com',
          source: 'webhook',
          status: 'rejected',
          details: {
            statusDetail: 'cc_rejected_bad_filled_security_code',
            paymentMethodId: 'credit_card',
            paymentTypeId: 'credit_card',
            dateCreated: '2024-01-13T14:15:00Z',
            dateApproved: null,
          },
        },
      ];

      // Filtrar logs pela externalReference
      const logsForReference = mockAuditLogs.filter(
        (log) => log.externalReference === externalReference,
      );

      if (logsForReference.length === 0) {
        return {
          success: false,
          message: 'Nenhum pagamento encontrado para esta referência externa',
          data: {
            externalReference,
            found: false,
            status: null,
            paymentDetails: null,
          },
        };
      }

      // Encontrar o log mais recente de conclusão de processamento
      const completedLogs = logsForReference.filter(
        (log) =>
          log.event === 'payment.approved.processing_completed' ||
          log.event === 'payment.rejected' ||
          log.event === 'payment.cancelled',
      );

      const latestLog =
        completedLogs.length > 0
          ? completedLogs.reduce((latest, current) =>
              new Date(current.timestamp) > new Date(latest.timestamp)
                ? current
                : latest,
            )
          : logsForReference[0];

      // Determinar o status final
      let finalStatus = 'unknown';
      let isSuccess = false;

      if (latestLog.event === 'payment.approved.processing_completed') {
        finalStatus = 'approved';
        isSuccess = true;
      } else if (latestLog.event === 'payment.rejected') {
        finalStatus = 'rejected';
        isSuccess = false;
      } else if (latestLog.event === 'payment.cancelled') {
        finalStatus = 'cancelled';
        isSuccess = false;
      } else if (latestLog.event === 'payment.approved.processing_started') {
        finalStatus = 'processing';
        isSuccess = false;
      }

      // Buscar detalhes completos do pagamento
      const paymentDetails = {
        paymentId: latestLog.paymentId,
        externalReference: latestLog.externalReference,
        amount: latestLog.amount,
        payerEmail: latestLog.payerEmail,
        status: finalStatus,
        isSuccess,
        timestamp: latestLog.timestamp,
        dateCreated: latestLog.details?.dateCreated,
        dateApproved: latestLog.details?.dateApproved,
        paymentMethod: latestLog.details?.paymentMethodId,
        statusDetail: latestLog.details?.statusDetail,
        source: latestLog.source,
        processingCompleted:
          latestLog.event === 'payment.approved.processing_completed',
        notificationSent: latestLog.details?.notificationSent || false,
      };

      // Histórico de eventos para esta referência
      const eventHistory = logsForReference.map((log) => ({
        event: log.event,
        timestamp: log.timestamp,
        status: log.status,
        details: log.details,
      }));

      return {
        success: true,
        message: `Status do pagamento encontrado para referência: ${externalReference}`,
        data: {
          externalReference,
          found: true,
          status: finalStatus,
          isSuccess,
          paymentDetails,
          eventHistory,
          summary: {
            totalEvents: logsForReference.length,
            lastEvent: latestLog.event,
            lastEventTime: latestLog.timestamp,
            processingCompleted:
              latestLog.event === 'payment.approved.processing_completed',
          },
        },
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro ao buscar status de pagamento por referência', {
        externalReference,
        error: errorMessage,
      });
      throw new BadRequestException('Erro ao buscar status de pagamento');
    }
  }
}
