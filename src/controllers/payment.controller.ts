import { Controller, Post, Body, Get, Query, Res, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { MercadoPagoService } from '../services/mercadopago.service';
import { CreatePreferenceDto } from '../dto/create-preference.dto';

@Controller('payment')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private readonly mercadoPagoService: MercadoPagoService) {}

  @Post('create-preference')
  async createPreference(@Body() createPreferenceDto: CreatePreferenceDto) {
    try {
      this.logger.log('Recebida solicitação para criar preferência', createPreferenceDto);
      
      const preference = await this.mercadoPagoService.createPreference(createPreferenceDto);
      
      return {
        success: true,
        data: preference,
        message: 'Preferência criada com sucesso',
      };
    } catch (error) {
      this.logger.error('Erro ao criar preferência', error);
      return {
        success: false,
        error: error.message,
        message: 'Erro ao criar preferência de pagamento',
      };
    }
  }

  @Get('success')
  async paymentSuccess(
    @Query('collection_id') collectionId: string,
    @Query('collection_status') collectionStatus: string,
    @Query('payment_id') paymentId: string,
    @Query('status') status: string,
    @Query('external_reference') externalReference: string,
    @Query('payment_type') paymentType: string,
    @Query('merchant_order_id') merchantOrderId: string,
    @Query('preference_id') preferenceId: string,
    @Query('site_id') siteId: string,
    @Query('processing_mode') processingMode: string,
    @Query('merchant_account_id') merchantAccountId: string,
    @Res() res: Response,
  ) {
    try {
      this.logger.log('Pagamento realizado com sucesso', {
        paymentId,
        status,
        externalReference,
        collectionStatus,
      });

      // Aqui você pode implementar lógica adicional para o sucesso do pagamento
      // Por exemplo, redirecionar para uma página de sucesso personalizada

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Pagamento realizado com sucesso!',
        data: {
          paymentId,
          status,
          externalReference,
          collectionStatus,
          paymentType,
          merchantOrderId,
          preferenceId,
        },
      });
    } catch (error) {
      this.logger.error('Erro ao processar retorno de sucesso', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  }

  @Get('failure')
  async paymentFailure(
    @Query('collection_id') collectionId: string,
    @Query('collection_status') collectionStatus: string,
    @Query('payment_id') paymentId: string,
    @Query('status') status: string,
    @Query('external_reference') externalReference: string,
    @Query('payment_type') paymentType: string,
    @Query('merchant_order_id') merchantOrderId: string,
    @Query('preference_id') preferenceId: string,
    @Query('site_id') siteId: string,
    @Query('processing_mode') processingMode: string,
    @Query('merchant_account_id') merchantAccountId: string,
    @Res() res: Response,
  ) {
    try {
      this.logger.log('Pagamento falhou', {
        paymentId,
        status,
        externalReference,
        collectionStatus,
      });

      return res.status(HttpStatus.OK).json({
        success: false,
        message: 'Pagamento não foi aprovado',
        data: {
          paymentId,
          status,
          externalReference,
          collectionStatus,
          paymentType,
          merchantOrderId,
          preferenceId,
        },
      });
    } catch (error) {
      this.logger.error('Erro ao processar retorno de falha', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  }

  @Get('pending')
  async paymentPending(
    @Query('collection_id') collectionId: string,
    @Query('collection_status') collectionStatus: string,
    @Query('payment_id') paymentId: string,
    @Query('status') status: string,
    @Query('external_reference') externalReference: string,
    @Query('payment_type') paymentType: string,
    @Query('merchant_order_id') merchantOrderId: string,
    @Query('preference_id') preferenceId: string,
    @Query('site_id') siteId: string,
    @Query('processing_mode') processingMode: string,
    @Query('merchant_account_id') merchantAccountId: string,
    @Res() res: Response,
  ) {
    try {
      this.logger.log('Pagamento pendente', {
        paymentId,
        status,
        externalReference,
        collectionStatus,
      });

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Pagamento está pendente de aprovação',
        data: {
          paymentId,
          status,
          externalReference,
          collectionStatus,
          paymentType,
          merchantOrderId,
          preferenceId,
        },
      });
    } catch (error) {
      this.logger.error('Erro ao processar retorno de pendência', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  }

  @Get('status/:paymentId')
  async getPaymentStatus(@Query('paymentId') paymentId: string) {
    try {
      this.logger.log('Consultando status do pagamento', { paymentId });
      
      const payment = await this.mercadoPagoService.getPayment(paymentId);
      
      return {
        success: true,
        data: {
          id: payment.id,
          status: payment.status,
          status_detail: payment.status_detail,
          external_reference: payment.external_reference,
          transaction_amount: payment.transaction_amount,
          date_created: payment.date_created,
          date_approved: payment.date_approved,
          payer: payment.payer,
        },
        message: 'Status do pagamento consultado com sucesso',
      };
    } catch (error) {
      this.logger.error('Erro ao consultar status do pagamento', error);
      return {
        success: false,
        error: error.message,
        message: 'Erro ao consultar status do pagamento',
      };
    }
  }
}

