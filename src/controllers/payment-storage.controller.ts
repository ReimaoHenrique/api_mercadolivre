import {
  Controller,
  Get,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Logger,
  Body,
  Post,
} from '@nestjs/common';
import { PaymentStorageService } from '../services/payment-storage.service';
import { MercadoPagoService } from '../services/mercadopago.service';

@Controller('payment-storage')
export class PaymentStorageController {
  private readonly logger = new Logger(PaymentStorageController.name);

  constructor(
    private readonly paymentStorageService: PaymentStorageService,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

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

  @Post('test-approved-payment')
  async testApprovedPayment(@Body() testData: { externalReference: string }) {
    try {
      this.logger.log('Testando pagamento aprovado', {
        externalReference: testData.externalReference,
      });

      // Simular dados de pagamento aprovado
      const mockPayment = {
        id: '123456789',
        status: 'approved',
        external_reference: testData.externalReference,
        transaction_amount: 100,
        currency_id: 'BRL',
        payer: {
          email: 'teste@exemplo.com',
        },
        payment_method_id: 'pix',
        payment_type_id: 'bank_transfer',
        status_detail: 'accredited',
        date_created: new Date().toISOString(),
        date_approved: new Date().toISOString(),
        date_last_updated: new Date().toISOString(),
        live_mode: false,
        collector_id: '123456',
        operation_type: 'regular_payment',
        taxes_amount: 0,
        shipping_amount: 0,
        transaction_amount_refunded: 0,
        installments: 1,
        description: 'Teste de pagamento',
        statement_descriptor: null,
        notification_url: null,
        callback_url: null,
        processing_mode: 'aggregator',
        binary_mode: false,
        captured: true,
        captured_amount: 100,
        money_release_date: new Date().toISOString(),
        money_release_status: 'released',
        payment_method: {
          id: 'pix',
          type: 'bank_transfer',
        },
        transaction_details: {
          net_received_amount: 99,
          total_paid_amount: 100,
          overpaid_amount: 0,
          installment_amount: 0,
        },
      };

      // Processar o pagamento aprovado
      await this.mercadoPagoService.processApprovedPayment(mockPayment as any);

      return {
        success: true,
        message: 'Pagamento aprovado processado com sucesso',
        externalReference: testData.externalReference,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Erro ao testar pagamento aprovado', {
        externalReference: testData.externalReference,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });

      return {
        success: false,
        message: 'Erro ao processar pagamento aprovado',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post('test-specific-payment')
  async testSpecificPayment() {
    try {
      const externalReference = 'HR2bdx0e000fij6xqvjtley4';

      console.log('🎯 TESTANDO PAGAMENTO ESPECÍFICO:', externalReference);
      console.log('⏰ Timestamp:', new Date().toISOString());

      // Carregar dados reais do pagamento
      const paymentData =
        await this.paymentStorageService.getPayment(externalReference);

      if (!paymentData) {
        console.log('❌ PAGAMENTO NÃO ENCONTRADO:', externalReference);
        return {
          success: false,
          message: 'Pagamento não encontrado',
          externalReference,
        };
      }

      console.log('📋 DADOS DO PAGAMENTO CARREGADOS:');
      console.log('Status:', paymentData.status);
      console.log('Payment ID:', paymentData.paymentId);
      console.log('Amount:', paymentData.amount);

      // Criar objeto de pagamento no formato esperado pelo MercadoPagoService
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
        description: 'Pagamento real',
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

      console.log('🚀 PROCESSANDO PAGAMENTO APROVADO...');

      // Processar o pagamento aprovado
      await this.mercadoPagoService.processApprovedPayment(
        paymentObject as any,
      );

      console.log('✅ PAGAMENTO PROCESSADO COM SUCESSO!');

      return {
        success: true,
        message: 'Pagamento específico processado com sucesso',
        externalReference,
        paymentStatus: paymentData.status,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.log('💥 ERRO AO PROCESSAR PAGAMENTO ESPECÍFICO:');
      console.log(
        'Erro:',
        error instanceof Error ? error.message : 'Erro desconhecido',
      );

      this.logger.error('Erro ao testar pagamento específico', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });

      return {
        success: false,
        message: 'Erro ao processar pagamento específico',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('test-monitoring')
  async testMonitoring() {
    try {
      console.log('🔍 TESTANDO MONITORAMENTO DE ARQUIVOS...');

      // Simular detecção de arquivo
      const externalReference = 'HR2bdx0e000fij6xqvjtley4';

      console.log('📁 SIMULANDO DETECÇÃO DE ARQUIVO:', externalReference);

      // Carregar dados do pagamento
      const paymentData =
        await this.paymentStorageService.getPayment(externalReference);

      if (!paymentData) {
        return {
          success: false,
          message: 'Pagamento não encontrado',
          externalReference,
        };
      }

      console.log('📋 DADOS DO PAGAMENTO CARREGADOS:');
      console.log('Status:', paymentData.status);
      console.log('Payment ID:', paymentData.paymentId);
      console.log('Amount:', paymentData.amount);

      if (paymentData.status === 'approved') {
        console.log('🚀 PAGAMENTO APROVADO - PROCESSANDO...');

        // Criar objeto de pagamento
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

        console.log('✅ PAGAMENTO PROCESSADO COM SUCESSO VIA MONITORAMENTO!');

        return {
          success: true,
          message: 'Monitoramento testado com sucesso - pagamento processado',
          externalReference,
          paymentStatus: paymentData.status,
          timestamp: new Date().toISOString(),
        };
      } else {
        console.log('⏸️ PAGAMENTO NÃO APROVADO:', paymentData.status);

        return {
          success: false,
          message: 'Pagamento não está aprovado',
          externalReference,
          paymentStatus: paymentData.status,
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.log('💥 ERRO AO TESTAR MONITORAMENTO:');
      console.log(
        'Erro:',
        error instanceof Error ? error.message : 'Erro desconhecido',
      );

      return {
        success: false,
        message: 'Erro ao testar monitoramento',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
