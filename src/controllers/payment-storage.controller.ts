import {
  Controller,
  Get,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PaymentStorageService } from '../services/payment-storage.service';

@Controller('payment-storage')
export class PaymentStorageController {
  private readonly logger = new Logger(PaymentStorageController.name);

  constructor(private readonly paymentStorageService: PaymentStorageService) {}

  @Get('all')
  @HttpCode(HttpStatus.OK)
  async getAllPayments() {
    try {
      const payments = await this.paymentStorageService.getAllPayments();

      return {
        success: true,
        message: 'Pagamentos obtidos com sucesso',
        data: {
          payments,
          count: payments.length,
        },
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro ao buscar pagamentos', { error: errorMessage });
      throw new BadRequestException('Erro ao buscar pagamentos');
    }
  }

  @Get('by-reference/:externalReference')
  @HttpCode(HttpStatus.OK)
  async getPaymentByReference(
    @Param('externalReference') externalReference: string,
  ) {
    try {
      const payment =
        await this.paymentStorageService.getPayment(externalReference);

      if (!payment) {
        return {
          success: false,
          message: 'Pagamento não encontrado',
          data: null,
        };
      }

      return {
        success: true,
        message: 'Pagamento encontrado com sucesso',
        data: payment,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro ao buscar pagamento por referência', {
        externalReference,
        error: errorMessage,
      });
      throw new BadRequestException('Erro ao buscar pagamento');
    }
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  async getPaymentStats() {
    try {
      const stats = await this.paymentStorageService.getPaymentStats();

      return {
        success: true,
        message: 'Estatísticas obtidas com sucesso',
        data: stats,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro ao buscar estatísticas', { error: errorMessage });
      throw new BadRequestException('Erro ao buscar estatísticas');
    }
  }

  @Delete('by-reference/:externalReference')
  @HttpCode(HttpStatus.OK)
  async deletePayment(@Param('externalReference') externalReference: string) {
    try {
      const deleted =
        await this.paymentStorageService.deletePayment(externalReference);

      if (!deleted) {
        return {
          success: false,
          message: 'Pagamento não encontrado para deletar',
          data: null,
        };
      }

      return {
        success: true,
        message: 'Pagamento deletado com sucesso',
        data: { externalReference },
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro ao deletar pagamento', {
        externalReference,
        error: errorMessage,
      });
      throw new BadRequestException('Erro ao deletar pagamento');
    }
  }

  @Delete('clear')
  @HttpCode(HttpStatus.OK)
  async clearAllPayments() {
    try {
      await this.paymentStorageService.clearAllPayments();

      return {
        success: true,
        message: 'Todos os pagamentos foram deletados com sucesso',
        data: null,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro ao deletar todos os pagamentos', {
        error: errorMessage,
      });
      throw new BadRequestException('Erro ao deletar pagamentos');
    }
  }
}
