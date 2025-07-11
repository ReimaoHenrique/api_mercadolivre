import { Injectable, Logger } from '@nestjs/common';
import { createHmac } from 'crypto';

@Injectable()
export class WebhookValidationService {
  private readonly logger = new Logger(WebhookValidationService.name);

  validateSignature(
    xSignature: string,
    xRequestId: string,
    dataId: string,
    rawBody: string,
    secret: string,
  ): boolean {
    try {
      // Extrair timestamp e assinatura do header x-signature
      const parts = xSignature.split(',');
      let ts: string | undefined;
      let v1: string | undefined;

      for (const part of parts) {
        const [key, value] = part.split('=');
        if (key === 'ts') {
          ts = value;
        } else if (key === 'v1') {
          v1 = value;
        }
      }

      if (!ts || !v1) {
        this.logger.error('Timestamp ou assinatura não encontrados no header x-signature');
        return false;
      }

      // Criar o template conforme documentação do Mercado Pago
      const template = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
      
      this.logger.debug('Template para validação', { template });

      // Gerar HMAC SHA256
      const hmac = createHmac('sha256', secret);
      hmac.update(template);
      const generatedSignature = hmac.digest('hex');

      this.logger.debug('Assinaturas para comparação', {
        received: v1,
        generated: generatedSignature,
      });

      // Comparar assinaturas
      const isValid = generatedSignature === v1;
      
      if (isValid) {
        this.logger.log('Assinatura do webhook validada com sucesso');
      } else {
        this.logger.warn('Assinatura do webhook inválida');
      }

      return isValid;
    } catch (error) {
      this.logger.error('Erro ao validar assinatura do webhook', error);
      return false;
    }
  }

  validateTimestamp(xSignature: string, toleranceInSeconds: number = 300): boolean {
    try {
      const parts = xSignature.split(',');
      let ts: string | undefined;

      for (const part of parts) {
        const [key, value] = part.split('=');
        if (key === 'ts') {
          ts = value;
          break;
        }
      }

      if (!ts) {
        this.logger.error('Timestamp não encontrado no header x-signature');
        return false;
      }

      const webhookTimestamp = parseInt(ts, 10);
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const timeDifference = Math.abs(currentTimestamp - webhookTimestamp);

      const isValid = timeDifference <= toleranceInSeconds;

      if (isValid) {
        this.logger.log('Timestamp do webhook válido', {
          webhookTimestamp,
          currentTimestamp,
          timeDifference,
        });
      } else {
        this.logger.warn('Timestamp do webhook expirado', {
          webhookTimestamp,
          currentTimestamp,
          timeDifference,
          tolerance: toleranceInSeconds,
        });
      }

      return isValid;
    } catch (error) {
      this.logger.error('Erro ao validar timestamp do webhook', error);
      return false;
    }
  }
}

