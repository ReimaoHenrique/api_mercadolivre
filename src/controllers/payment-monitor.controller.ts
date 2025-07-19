import { Controller, Get, Post, Param, Logger } from '@nestjs/common';
import { PaymentMonitorService } from '../services/payment-monitor.service';

@Controller('payment-monitor')
export class PaymentMonitorController {
  private readonly logger = new Logger(PaymentMonitorController.name);

  constructor(private readonly paymentMonitorService: PaymentMonitorService) {}

  @Get('status')
  getMonitoringStatus() {
    try {
      const status = this.paymentMonitorService.getMonitoringStatus();

      console.log('📊 STATUS DO MONITORAMENTO:', status);

      return {
        success: true,
        data: status,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Erro ao obter status do monitoramento', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });

      return {
        success: false,
        message: 'Erro ao obter status do monitoramento',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post('reprocess/:externalReference')
  async reprocessPayment(
    @Param('externalReference') externalReference: string,
  ) {
    try {
      console.log('🔄 SOLICITANDO REPROCESSAMENTO:', externalReference);

      const result =
        await this.paymentMonitorService.reprocessPayment(externalReference);

      console.log('✅ RESULTADO DO REPROCESSAMENTO:', result);

      return {
        ...result,
        timestamp: new Date().toISOString(),
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
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post('reprocess-all')
  async reprocessAllApprovedPayments() {
    try {
      console.log(
        '🔄 SOLICITANDO REPROCESSAMENTO DE TODOS OS PAGAMENTOS APROVADOS',
      );

      // Obter todos os pagamentos
      const payments =
        await this.paymentMonitorService[
          'paymentStorageService'
        ].getAllPayments();
      const approvedPayments = payments.filter((p) => p.status === 'approved');

      console.log(
        `📁 ENCONTRADOS ${approvedPayments.length} PAGAMENTOS APROVADOS`,
      );

      const results: Array<{
        externalReference: string;
        success: boolean;
        message: string;
      }> = [];

      for (const payment of approvedPayments) {
        try {
          console.log(`🔄 REPROCESSANDO: ${payment.externalReference}`);
          const result = await this.paymentMonitorService.reprocessPayment(
            payment.externalReference,
          );
          results.push({
            externalReference: payment.externalReference,
            success: result.success,
            message: result.message,
          });
        } catch (error) {
          results.push({
            externalReference: payment.externalReference,
            success: false,
            message:
              error instanceof Error ? error.message : 'Erro desconhecido',
          });
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const errorCount = results.filter((r) => !r.success).length;

      console.log(
        `✅ REPROCESSAMENTO CONCLUÍDO: ${successCount} sucessos, ${errorCount} erros`,
      );

      return {
        success: true,
        message: `Reprocessamento concluído: ${successCount} sucessos, ${errorCount} erros`,
        data: {
          total: approvedPayments.length,
          success: successCount,
          errors: errorCount,
          results,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Erro ao reprocessar todos os pagamentos', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });

      return {
        success: false,
        message: 'Erro ao reprocessar todos os pagamentos',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
