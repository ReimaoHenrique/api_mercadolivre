import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface PaymentData {
  externalReference: string;
  paymentId: string;
  status: string;
  amount: number;
  currency: string;
  payerEmail: string;
  paymentMethodId: string;
  paymentTypeId: string;
  statusDetail: string;
  dateCreated: string;
  dateApproved?: string;
  dateLastUpdated: string;
  liveMode: boolean;
  userId: string;
  // Dados do webhook
  webhookData?: any;
  // Dados de auditoria
  auditLogs?: any[];
  // Dados de processamento
  processingDetails?: {
    processingStartedAt?: string;
    processingCompletedAt?: string;
    notificationSent?: boolean;
    apiUpdateAttempted?: boolean;
    apiUpdateSuccess?: boolean;
    apiUpdateError?: string;
  };
  // Dados de negócio
  businessLogic?: {
    referenceType?: string;
    processedWithDefaultLogic?: boolean;
    customProcessingApplied?: boolean;
  };
}

@Injectable()
export class PaymentStorageService {
  private readonly logger = new Logger(PaymentStorageService.name);
  private readonly dataDir = path.join(process.cwd(), 'data', 'payments');

  constructor() {
    this.ensureDataDirectory();
  }

  private ensureDataDirectory(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
      this.logger.log('Diretório de pagamentos criado', { path: this.dataDir });
    }
  }

  async savePayment(paymentData: PaymentData): Promise<void> {
    try {
      const filename = `${paymentData.externalReference}.json`;
      const filepath = path.join(this.dataDir, filename);

      // Se o arquivo já existe, carregar e mesclar dados
      let existingData: PaymentData | null = null;
      if (fs.existsSync(filepath)) {
        const fileContent = fs.readFileSync(filepath, 'utf8');
        existingData = JSON.parse(fileContent);
        this.logger.log('Dados existentes carregados', {
          externalReference: paymentData.externalReference,
        });
      }

      // Mesclar dados existentes com novos dados
      const mergedData: PaymentData = {
        ...existingData,
        ...paymentData,
        dateLastUpdated: new Date().toISOString(),
        // Mesclar arrays
        auditLogs: [
          ...(existingData?.auditLogs || []),
          ...(paymentData.auditLogs || []),
        ],
        // Mesclar detalhes de processamento
        processingDetails: {
          ...existingData?.processingDetails,
          ...paymentData.processingDetails,
        },
        // Mesclar lógica de negócio
        businessLogic: {
          ...existingData?.businessLogic,
          ...paymentData.businessLogic,
        },
      };

      // Salvar arquivo
      fs.writeFileSync(filepath, JSON.stringify(mergedData, null, 2));

      this.logger.log('Pagamento salvo com sucesso', {
        externalReference: paymentData.externalReference,
        paymentId: paymentData.paymentId,
        status: paymentData.status,
        filepath,
      });
    } catch (error) {
      this.logger.error('Erro ao salvar pagamento', {
        externalReference: paymentData.externalReference,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }

  async getPayment(externalReference: string): Promise<PaymentData | null> {
    try {
      const filename = `${externalReference}.json`;
      const filepath = path.join(this.dataDir, filename);

      if (!fs.existsSync(filepath)) {
        return null;
      }

      const fileContent = fs.readFileSync(filepath, 'utf8');
      const paymentData: PaymentData = JSON.parse(fileContent);

      this.logger.log('Pagamento carregado com sucesso', {
        externalReference,
        paymentId: paymentData.paymentId,
        status: paymentData.status,
      });

      return paymentData;
    } catch (error) {
      this.logger.error('Erro ao carregar pagamento', {
        externalReference,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
      return null;
    }
  }

  async getAllPayments(): Promise<PaymentData[]> {
    try {
      const payments: PaymentData[] = [];

      if (!fs.existsSync(this.dataDir)) {
        return payments;
      }

      const files = fs.readdirSync(this.dataDir);
      const jsonFiles = files.filter((file) => file.endsWith('.json'));

      for (const file of jsonFiles) {
        const filepath = path.join(this.dataDir, file);
        const fileContent = fs.readFileSync(filepath, 'utf8');
        const paymentData: PaymentData = JSON.parse(fileContent);
        payments.push(paymentData);
      }

      // Ordenar por data de última atualização (mais recente primeiro)
      payments.sort(
        (a, b) =>
          new Date(b.dateLastUpdated).getTime() -
          new Date(a.dateLastUpdated).getTime(),
      );

      this.logger.log('Todos os pagamentos carregados', {
        count: payments.length,
      });

      return payments;
    } catch (error) {
      this.logger.error('Erro ao carregar todos os pagamentos', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
      return [];
    }
  }

  async deletePayment(externalReference: string): Promise<boolean> {
    try {
      const filename = `${externalReference}.json`;
      const filepath = path.join(this.dataDir, filename);

      if (!fs.existsSync(filepath)) {
        return false;
      }

      fs.unlinkSync(filepath);

      this.logger.log('Pagamento deletado com sucesso', {
        externalReference,
      });

      return true;
    } catch (error) {
      this.logger.error('Erro ao deletar pagamento', {
        externalReference,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
      return false;
    }
  }

  async clearAllPayments(): Promise<void> {
    try {
      if (!fs.existsSync(this.dataDir)) {
        return;
      }

      const files = fs.readdirSync(this.dataDir);
      const jsonFiles = files.filter((file) => file.endsWith('.json'));

      for (const file of jsonFiles) {
        const filepath = path.join(this.dataDir, file);
        fs.unlinkSync(filepath);
      }

      this.logger.log('Todos os pagamentos deletados', {
        count: jsonFiles.length,
      });
    } catch (error) {
      this.logger.error('Erro ao deletar todos os pagamentos', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }

  async getPaymentStats(): Promise<{
    totalPayments: number;
    byStatus: Record<string, number>;
    byPaymentMethod: Record<string, number>;
    totalAmount: number;
    lastUpdated: string;
  }> {
    try {
      const payments = await this.getAllPayments();

      const stats = {
        totalPayments: payments.length,
        byStatus: {} as Record<string, number>,
        byPaymentMethod: {} as Record<string, number>,
        totalAmount: 0,
        lastUpdated: new Date().toISOString(),
      };

      for (const payment of payments) {
        // Contar por status
        stats.byStatus[payment.status] =
          (stats.byStatus[payment.status] || 0) + 1;

        // Contar por método de pagamento
        stats.byPaymentMethod[payment.paymentMethodId] =
          (stats.byPaymentMethod[payment.paymentMethodId] || 0) + 1;

        // Somar valores
        stats.totalAmount += payment.amount;
      }

      return stats;
    } catch (error) {
      this.logger.error('Erro ao gerar estatísticas', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });

      return {
        totalPayments: 0,
        byStatus: {},
        byPaymentMethod: {},
        totalAmount: 0,
        lastUpdated: new Date().toISOString(),
      };
    }
  }
}
