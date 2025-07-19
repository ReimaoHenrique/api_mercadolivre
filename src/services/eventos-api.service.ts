import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ConvidadoStatusUpdate {
  id: string;
  status: 'pendente' | 'confirmado' | 'cancelado';
}

@Injectable()
export class EventosApiService {
  private readonly logger = new Logger(EventosApiService.name);
  private readonly apiToken: string | undefined;
  private readonly apiBaseUrl: string | undefined;

  constructor(private configService: ConfigService) {
    this.apiToken = this.configService.get<string>('eventosApi.token');
    this.apiBaseUrl = this.configService.get<string>('eventosApi.url');

    if (!this.apiToken) {
      this.logger.warn('EVENTOS_API_TOKEN não configurado');
    }

    if (!this.apiBaseUrl) {
      this.logger.warn('EVENTOS_API_URL não configurado');
    }
  }

  async updateConvidadoStatus(
    convidadoId: string,
    statusData: ConvidadoStatusUpdate,
  ): Promise<boolean> {
    try {
      if (!this.apiToken || !this.apiBaseUrl) {
        console.log('⚠️ CONFIGURAÇÕES DA API DE EVENTOS NÃO ENCONTRADAS:');
        console.log(
          '🔑 Token:',
          this.apiToken ? 'Configurado' : 'NÃO CONFIGURADO',
        );
        console.log('📍 URL:', this.apiBaseUrl || 'NÃO CONFIGURADA');
        console.log('⏰ Timestamp:', new Date().toISOString());

        this.logger.error('Configurações da API de eventos não encontradas');
        return false;
      }

      this.logger.log('Atualizando status do convidado', {
        convidadoId,
        status: statusData.status,
      });

      // Enviar JSON no formato especificado: { "id": "externalReference", "status": "confirmado" }
      const payload = {
        id: convidadoId,
        status: statusData.status,
      };

      // URL correta: usar apenas a baseUrl (que já deve incluir /id/)
      const url = this.apiBaseUrl;

      // Console log para debug
      console.log('🚀 ENVIANDO REQUISIÇÃO PARA API DE EVENTOS:');
      console.log('📍 URL:', url);
      console.log('📋 Payload:', JSON.stringify(payload, null, 2));
      console.log(
        '🔑 Token:',
        this.apiToken ? 'Configurado' : 'NÃO CONFIGURADO',
      );
      console.log('⏰ Timestamp:', new Date().toISOString());

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos

      try {
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.status === 200 || response.status === 204) {
          console.log('✅ RESPOSTA DA API DE EVENTOS - SUCESSO:');
          console.log('📊 Status Code:', response.status);
          console.log('🆔 Convidado ID:', convidadoId);
          console.log('📝 Status Enviado:', statusData.status);
          console.log('⏰ Timestamp:', new Date().toISOString());

          this.logger.log('Status do convidado atualizado com sucesso', {
            convidadoId,
            status: statusData.status,
            responseStatus: response.status,
          });
          return true;
        } else {
          const responseData = await response.text();
          console.log('❌ RESPOSTA DA API DE EVENTOS - ERRO:');
          console.log('📊 Status Code:', response.status);
          console.log('🆔 Convidado ID:', convidadoId);
          console.log('📝 Status Enviado:', statusData.status);
          console.log('📄 Response Data:', responseData);
          console.log('⏰ Timestamp:', new Date().toISOString());

          this.logger.warn('Resposta inesperada da API de eventos', {
            convidadoId,
            status: statusData.status,
            responseStatus: response.status,
            responseData,
          });
          return false;
        }
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';

      console.log('💥 ERRO NA REQUISIÇÃO PARA API DE EVENTOS:');
      console.log('🆔 Convidado ID:', convidadoId);
      console.log('📝 Status Tentado:', statusData.status);
      console.log('❌ Erro:', errorMessage);
      console.log('⏰ Timestamp:', new Date().toISOString());

      this.logger.error('Erro ao atualizar status do convidado', {
        convidadoId,
        status: statusData.status,
        error: errorMessage,
      });

      // Log específico para diferentes tipos de erro
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          this.logger.error('Timeout na chamada para API de eventos');
        } else if (error.message.includes('401')) {
          this.logger.error(
            'Token de autorização inválido para API de eventos',
          );
        } else if (error.message.includes('404')) {
          this.logger.error('Convidado não encontrado na API de eventos', {
            convidadoId,
          });
        } else if (error.message.includes('500')) {
          this.logger.error('Erro interno na API de eventos');
        }
      }

      return false;
    }
  }

  async updateConvidadoStatusFromPayment(
    externalReference: string,
    paymentData: {
      status: string;
      id: string | number;
      transaction_amount?: number;
      date_approved?: string;
      date_created?: string;
    },
  ): Promise<boolean> {
    try {
      // Extrair o ID do convidado da referência externa
      // Exemplo: external_reference: "cmd27meh70003ijsdb58nfa6o"
      const convidadoId = externalReference;

      // Mapear status do Mercado Pago para status do convidado
      let status: ConvidadoStatusUpdate['status'];

      switch (paymentData.status) {
        case 'approved':
          status = 'confirmado';
          break;
        case 'pending':
          status = 'pendente';
          break;
        case 'cancelled':
        case 'rejected':
          status = 'cancelado';
          break;
        default:
          this.logger.warn('Status de pagamento não mapeado', {
            paymentStatus: paymentData.status,
            externalReference,
          });
          return false;
      }

      const statusData: ConvidadoStatusUpdate = {
        id: convidadoId,
        status,
      };

      return await this.updateConvidadoStatus(convidadoId, statusData);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';

      this.logger.error(
        'Erro ao processar atualização de status do convidado',
        {
          externalReference,
          paymentId: paymentData?.id,
          error: errorMessage,
        },
      );
      return false;
    }
  }

  // Método para testar a conectividade com a API
  async testConnection(): Promise<boolean> {
    try {
      if (!this.apiToken || !this.apiBaseUrl) {
        return false;
      }

      // Fazer uma chamada simples para testar a conectividade
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(
          this.apiBaseUrl.replace('/status', '/health'), // Assumindo que existe um endpoint de health
          {
            headers: {
              Authorization: `Bearer ${this.apiToken}`,
            },
            signal: controller.signal,
          },
        );

        clearTimeout(timeoutId);
        return response.status === 200;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';

      this.logger.warn('Teste de conectividade com API de eventos falhou', {
        error: errorMessage,
      });
      return false;
    }
  }
}
