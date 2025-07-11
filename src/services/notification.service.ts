import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentDetailDto } from '../dto/webhook-notification.dto';

export interface PaymentConfirmationData {
  paymentId: number;
  externalReference?: string;
  amount: number;
  payerEmail?: string;
  payerName?: string;
  status: string;
  approvedAt?: string;
  paymentLink?: string;
  downloadLink?: string;
  accessCredentials?: {
    username?: string;
    password?: string;
    accessUrl?: string;
  };
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private configService: ConfigService) {}

  async sendPaymentConfirmation(payment: PaymentDetailDto): Promise<void> {
    try {
      const confirmationData: PaymentConfirmationData = {
        paymentId: payment.id,
        externalReference: payment.external_reference,
        amount: payment.transaction_amount,
        payerEmail: payment.payer?.email,
        payerName: `${payment.payer?.first_name || ''} ${payment.payer?.last_name || ''}`.trim(),
        status: payment.status,
        approvedAt: payment.date_approved,
      };

      // Gerar link de acesso ou confirmação baseado na referência externa
      const accessInfo = await this.generateAccessInfo(payment);
      confirmationData.paymentLink = accessInfo.paymentLink;
      confirmationData.downloadLink = accessInfo.downloadLink;
      confirmationData.accessCredentials = accessInfo.accessCredentials;

      // Enviar email de confirmação
      if (payment.payer?.email) {
        await this.sendEmailConfirmation(confirmationData);
      }

      // Enviar SMS se houver telefone
      if (payment.payer?.phone?.number) {
        await this.sendSmsConfirmation(confirmationData, payment.payer.phone);
      }

      // Notificar sistemas externos
      await this.notifyExternalSystems(confirmationData);

      this.logger.log('Confirmação de pagamento enviada com sucesso', {
        paymentId: payment.id,
        payerEmail: payment.payer?.email,
        externalReference: payment.external_reference,
      });

    } catch (error) {
      this.logger.error('Erro ao enviar confirmação de pagamento', {
        paymentId: payment.id,
        error: error.message,
      });
      // Não relançar o erro para não falhar o processamento principal
    }
  }

  private async generateAccessInfo(payment: PaymentDetailDto): Promise<{
    paymentLink?: string;
    downloadLink?: string;
    accessCredentials?: {
      username?: string;
      password?: string;
      accessUrl?: string;
    };
  }> {
    try {
      // Aqui você implementa a lógica específica do seu negócio
      // Exemplos baseados na referência externa:

      const externalRef = payment.external_reference;
      const baseUrl = this.configService.get<string>('urls.success')?.replace('/success', '') || 'http://localhost:3000';

      if (externalRef?.startsWith('COURSE_')) {
        // Para cursos online
        return {
          paymentLink: `${baseUrl}/course/access/${externalRef}`,
          accessCredentials: {
            username: payment.payer?.email,
            password: this.generateRandomPassword(),
            accessUrl: `${baseUrl}/course/login`,
          },
        };
      } else if (externalRef?.startsWith('PRODUCT_')) {
        // Para produtos digitais
        return {
          downloadLink: `${baseUrl}/download/${externalRef}?token=${this.generateDownloadToken(payment)}`,
        };
      } else if (externalRef?.startsWith('SERVICE_')) {
        // Para serviços
        return {
          paymentLink: `${baseUrl}/service/activate/${externalRef}`,
        };
      } else {
        // Link genérico de confirmação
        return {
          paymentLink: `${baseUrl}/payment/confirmation/${payment.id}`,
        };
      }
    } catch (error) {
      this.logger.error('Erro ao gerar informações de acesso', {
        paymentId: payment.id,
        error: error.message,
      });
      return {};
    }
  }

  private async sendEmailConfirmation(data: PaymentConfirmationData): Promise<void> {
    try {
      this.logger.log('Enviando email de confirmação', {
        paymentId: data.paymentId,
        email: data.payerEmail,
      });

      // Aqui você integraria com seu provedor de email
      // Exemplos: SendGrid, AWS SES, Nodemailer, etc.
      
      const emailContent = this.buildEmailContent(data);
      
      // Exemplo de integração (substitua pela sua implementação):
      // await this.emailProvider.send({
      //   to: data.payerEmail,
      //   subject: 'Pagamento Aprovado - Acesso Liberado',
      //   html: emailContent,
      // });

      this.logger.log('Email de confirmação enviado', {
        paymentId: data.paymentId,
        email: data.payerEmail,
      });

    } catch (error) {
      this.logger.error('Erro ao enviar email de confirmação', {
        paymentId: data.paymentId,
        error: error.message,
      });
    }
  }

  private async sendSmsConfirmation(
    data: PaymentConfirmationData, 
    phone: { area_code?: string; number?: string }
  ): Promise<void> {
    try {
      const phoneNumber = `${phone.area_code || ''}${phone.number}`;
      
      this.logger.log('Enviando SMS de confirmação', {
        paymentId: data.paymentId,
        phone: phoneNumber,
      });

      // Aqui você integraria com seu provedor de SMS
      // Exemplos: Twilio, AWS SNS, etc.
      
      const smsMessage = this.buildSmsContent(data);
      
      // Exemplo de integração (substitua pela sua implementação):
      // await this.smsProvider.send({
      //   to: phoneNumber,
      //   message: smsMessage,
      // });

      this.logger.log('SMS de confirmação enviado', {
        paymentId: data.paymentId,
        phone: phoneNumber,
      });

    } catch (error) {
      this.logger.error('Erro ao enviar SMS de confirmação', {
        paymentId: data.paymentId,
        error: error.message,
      });
    }
  }

  private async notifyExternalSystems(data: PaymentConfirmationData): Promise<void> {
    try {
      this.logger.log('Notificando sistemas externos', {
        paymentId: data.paymentId,
        externalReference: data.externalReference,
      });

      // Aqui você pode notificar outros sistemas
      // Exemplos: CRM, ERP, sistemas de entrega, etc.
      
      // Exemplo de webhook para sistema externo:
      // await this.httpService.post('https://external-system.com/webhook', {
      //   event: 'payment.approved',
      //   data: data,
      // });

      this.logger.log('Sistemas externos notificados', {
        paymentId: data.paymentId,
      });

    } catch (error) {
      this.logger.error('Erro ao notificar sistemas externos', {
        paymentId: data.paymentId,
        error: error.message,
      });
    }
  }

  private buildEmailContent(data: PaymentConfirmationData): string {
    return `
      <html>
        <body>
          <h2>Pagamento Aprovado!</h2>
          <p>Olá ${data.payerName || 'Cliente'},</p>
          <p>Seu pagamento foi aprovado com sucesso!</p>
          
          <h3>Detalhes do Pagamento:</h3>
          <ul>
            <li><strong>ID do Pagamento:</strong> ${data.paymentId}</li>
            <li><strong>Valor:</strong> R$ ${data.amount.toFixed(2)}</li>
            <li><strong>Status:</strong> ${data.status}</li>
            ${data.externalReference ? `<li><strong>Referência:</strong> ${data.externalReference}</li>` : ''}
          </ul>

          ${data.paymentLink ? `
            <h3>Acesso ao Produto/Serviço:</h3>
            <p><a href="${data.paymentLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Acessar Agora</a></p>
          ` : ''}

          ${data.downloadLink ? `
            <h3>Download do Produto:</h3>
            <p><a href="${data.downloadLink}" style="background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Fazer Download</a></p>
          ` : ''}

          ${data.accessCredentials ? `
            <h3>Credenciais de Acesso:</h3>
            <ul>
              <li><strong>Usuário:</strong> ${data.accessCredentials.username}</li>
              <li><strong>Senha:</strong> ${data.accessCredentials.password}</li>
              <li><strong>URL de Acesso:</strong> <a href="${data.accessCredentials.accessUrl}">${data.accessCredentials.accessUrl}</a></li>
            </ul>
          ` : ''}

          <p>Obrigado pela sua compra!</p>
        </body>
      </html>
    `;
  }

  private buildSmsContent(data: PaymentConfirmationData): string {
    let message = `Pagamento aprovado! ID: ${data.paymentId}, Valor: R$ ${data.amount.toFixed(2)}`;
    
    if (data.paymentLink) {
      message += `. Acesse: ${data.paymentLink}`;
    }
    
    return message;
  }

  private generateRandomPassword(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private generateDownloadToken(payment: PaymentDetailDto): string {
    // Gerar token seguro para download
    const data = `${payment.id}-${payment.external_reference}-${Date.now()}`;
    return Buffer.from(data).toString('base64url');
  }
}

