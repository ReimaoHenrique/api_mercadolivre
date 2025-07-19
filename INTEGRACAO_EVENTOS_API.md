# 📋 Documentação - Integração com API de Eventos

## 🎯 Visão Geral

Este sistema integra pagamentos do Mercado Pago com uma API de eventos externa, enviando atualizações de status de convidados quando pagamentos são aprovados.

## 🔧 Configuração

### Variáveis de Ambiente

Adicione estas variáveis ao seu arquivo `.env`:

```env
# API de Eventos
EVENTOS_API_TOKEN=seu_token_aqui
EVENTOS_API_URL=https://jvdpz4zf-3002.brs.devtunnels.ms/api/eventos/convidados/status/id/
```

### Estrutura de Dados

#### Pagamento (JSON)

```json
{
  "id": 123456789,
  "status": "approved",
  "external_reference": "HR2bdx0e000fij6xqvjtley4",
  "transaction_amount": 100.0,
  "date_approved": "2025-07-18T21:22:39.000-04:00",
  "date_created": "2025-07-18T21:21:51.000-04:00"
}
```

#### Payload para API de Eventos

```json
{
  "id": "HR2bdx0e000fij6xqvjtley4",
  "status": "confirmado"
}
```

## 🚀 Funcionalidades

### 1. Monitoramento Automático de Arquivos

O sistema monitora automaticamente a pasta `data/payments/` e processa pagamentos quando:

- Arquivos são modificados
- Status é "approved"
- Não foi processado anteriormente

### 2. Mapeamento de Status

| Status Mercado Pago | Status Eventos API |
| ------------------- | ------------------ |
| `approved`          | `confirmado`       |
| `pending`           | `pendente`         |
| `cancelled`         | `cancelado`        |
| `rejected`          | `cancelado`        |

### 3. Endpoints de Teste

#### Testar Processamento de Pagamento

```bash
POST /api/payment-storage/test-process
Content-Type: application/json

{
  "externalReference": "HR2bdx0e000fij6xqvjtley4"
}
```

#### Verificar Status do Monitor

```bash
GET /api/payment-monitor/status
```

#### Reprocessar Pagamento Específico

```bash
POST /api/payment-monitor/reprocess
Content-Type: application/json

{
  "externalReference": "HR2bdx0e000fij6xqvjtley4"
}
```

#### Reprocessar Todos os Pagamentos Aprovados

```bash
POST /api/payment-monitor/reprocess-all
```

## 📁 Estrutura de Arquivos

```
src/
├── services/
│   ├── eventos-api.service.ts      # Comunicação com API de Eventos
│   ├── payment-monitor.service.ts  # Monitoramento de arquivos
│   └── payment-storage.service.ts  # Armazenamento de pagamentos
├── controllers/
│   ├── payment-monitor.controller.ts    # Endpoints de monitoramento
│   └── payment-storage.controller.ts    # Endpoints de teste
└── config/
    └── configuration.ts            # Configurações da aplicação
```

## 🔄 Fluxo de Processamento

### 1. Detecção de Mudança

```typescript
// payment-monitor.service.ts
fs.watch(paymentsDir, (eventType, filename) => {
  if (filename && filename.endsWith('.json')) {
    this.processPaymentFile(filename);
  }
});
```

### 2. Validação de Pagamento

```typescript
// Verifica se o pagamento é válido para processamento
if (paymentData.status === 'approved' && !paymentData.monitoringTriggered) {
  // Processa pagamento
}
```

### 3. Envio para API de Eventos

```typescript
// eventos-api.service.ts
const payload = {
  id: externalReference,
  status: 'confirmado',
};

await fetch(url, {
  method: 'PUT',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload),
});
```

## 📊 Logs e Monitoramento

### Logs de Sucesso

```
🚀 ENVIANDO REQUISIÇÃO PARA API DE EVENTOS:
📍 URL: https://jvdpz4zf-3002.brs.devtunnels.ms/api/eventos/convidados/status/id/
📋 Payload: {
  "id": "HR2bdx0e000fij6xqvjtley4",
  "status": "confirmado"
}
🔑 Token: Configurado
⏰ Timestamp: 2025-01-19T11:05:01.000Z

✅ RESPOSTA DA API DE EVENTOS - SUCESSO:
📊 Status Code: 200
🆔 Convidado ID: HR2bdx0e000fij6xqvjtley4
📝 Status Enviado: confirmado
⏰ Timestamp: 2025-01-19T11:05:01.000Z
```

### Logs de Erro

```
❌ RESPOSTA DA API DE EVENTOS - ERRO:
📊 Status Code: 404
🆔 Convidado ID: HR2bdx0e000fij6xqvjtley4
📝 Status Enviado: confirmado
📄 Response Data: Convidado não encontrado
⏰ Timestamp: 2025-01-19T11:05:01.000Z
```

## 🛠️ Como Usar

### 1. Iniciar o Sistema

```bash
npm run start:dev
```

### 2. Testar Manualmente

```bash
# Testar processamento de um pagamento
curl -X POST http://localhost:3000/api/payment-storage/test-process \
  -H "Content-Type: application/json" \
  -d '{"externalReference": "HR2bdx0e000fij6xqvjtley4"}'

# Verificar status do monitor
curl http://localhost:3000/api/payment-monitor/status
```

### 3. Modificar Arquivo de Pagamento

Para testar o monitoramento automático, modifique qualquer campo em um arquivo JSON na pasta `data/payments/`:

```bash
# Exemplo: modificar dataLastUpdated
echo '{"dateLastUpdated": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"}' > temp.json
jq -s '.[0] * .[1]' data/payments/HR2bdx0e000fij6xqvjtley4.json temp.json > data/payments/HR2bdx0e000fij6xqvjtley4.json
rm temp.json
```

## 🔒 Segurança

### Autenticação

- Token Bearer obrigatório para todas as requisições
- Timeout de 10 segundos para evitar travamentos
- Validação de configurações na inicialização

### Prevenção de Duplicação

- Campo `monitoringTriggered` evita processamento duplicado
- Timestamp de processamento para auditoria
- Logs detalhados para rastreamento

## 🚨 Tratamento de Erros

### Tipos de Erro

1. **401 Unauthorized**: Token inválido
2. **404 Not Found**: Convidado não encontrado
3. **500 Internal Server Error**: Erro interno da API
4. **Timeout**: Requisição excedeu 10 segundos

### Recuperação

- Sistema continua funcionando mesmo com erros
- Logs detalhados para debugging
- Endpoints de reprocessamento manual
- Retry automático não implementado (pode ser adicionado)

## 📈 Monitoramento

### Métricas Disponíveis

- Total de pagamentos processados
- Sucessos vs falhas
- Tempo de resposta da API
- Status do monitor de arquivos

### Endpoints de Status

```bash
GET /api/payment-monitor/status
# Retorna: { "isMonitoring": true, "processedCount": 5, "lastProcessed": "..." }
```

## 🔧 Manutenção

### Limpeza de Logs

Os logs são mantidos em memória durante a execução. Para persistência, considere:

- Implementar banco de dados
- Usar sistema de logs externo
- Rotação de arquivos de log

### Backup de Dados

- Arquivos de pagamento em `data/payments/`
- Logs de auditoria em `data/audit-logs/`
- Configurações em `.env`

## 📞 Suporte

### Debugging

1. Verifique as variáveis de ambiente
2. Confirme se a API de eventos está acessível
3. Analise os logs detalhados
4. Use os endpoints de teste

### Contatos

- Desenvolvedor: [Seu Nome]
- API de Eventos: [Contato da API]
- Documentação: Este arquivo

---

**Última atualização**: 19/01/2025
**Versão**: 1.0.0
