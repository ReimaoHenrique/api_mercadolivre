# Mercado Pago Checkout Pro API

API NestJS para integração completa com Checkout Pro do Mercado Pago, incluindo webhooks, validação de assinaturas e processamento automático de pagamentos aprovados.

## 🚀 Funcionalidades

- ✅ Criação de preferências de pagamento
- ✅ Recebimento e validação de webhooks
- ✅ Processamento automático de pagamentos aprovados
- ✅ **Integração automática com API de eventos** (notificação quando pagamento é aprovado)
- ✅ **Monitoramento automático de arquivos de pagamento**
- ✅ **Sistema de reprocessamento manual e automático**
- ✅ Sistema de notificações (email/SMS)
- ✅ Logs de auditoria completos
- ✅ Validação de assinaturas de segurança
- ✅ Suporte a diferentes tipos de produtos/serviços

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no Mercado Pago (sandbox ou produção)
- Certificado SSL (para webhooks em produção)

## 🔧 Instalação

1. **Clone o repositório:**

```bash
git clone <repository-url>
cd mercadopago-api
```

2. **Instale as dependências:**

```bash
npm install
```

3. **Configure as variáveis de ambiente:**

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:

```env
MERCADOPAGO_ACCESS_TOKEN=your_access_token_here
MERCADOPAGO_PUBLIC_KEY=your_public_key_here
MERCADOPAGO_WEBHOOK_SECRET=your_webhook_secret_here
PORT=3000
```

4. **Compile e execute:**

```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run build
npm run start:prod
```

## 📚 Uso Básico

### Criar Preferência de Pagamento

```bash
curl -X POST http://localhost:3000/payment/create-preference \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Produto Exemplo",
    "quantity": 1,
    "unit_price": 100.00,
    "external_reference": "PRODUCT_123",
    "payer": {
      "email": "cliente@email.com"
    }
  }'
```

### Resposta:

```json
{
  "success": true,
  "data": {
    "id": "123456789",
    "init_point": "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=123456789"
  }
}
```

### Listar Pagamentos

```bash
# Listar todos os pagamentos
curl "http://localhost:3000/payment/list"

# Filtrar por status
curl "http://localhost:3000/payment/list?status=approved"

# Filtrar por referência externa
curl "http://localhost:3000/payment/list?external_reference=PRODUCT_123"

# Filtrar por email do pagador
curl "http://localhost:3000/payment/list?payer_email=cliente@email.com"

# Com paginação
curl "http://localhost:3000/payment/list?limit=20&offset=40"
```

### Gerar Histórico de Pagamentos

```bash
# Histórico completo
curl "http://localhost:3000/payment/history"

# Histórico por período
curl "http://localhost:3000/payment/history?start_date=2024-01-01&end_date=2024-12-31"

# Histórico por status
curl "http://localhost:3000/payment/history?status=approved"

# Histórico limitado
curl "http://localhost:3000/payment/history?limit=50"
```

### Visualizar Logs de Auditoria

```bash
# Todos os logs de auditoria
curl "http://localhost:3000/payment/audit-logs"

# Logs de evento específico (payment.approved.processing_completed)
curl "http://localhost:3000/payment/audit-logs?event=payment.approved.processing_completed"

# Logs por ID de pagamento
curl "http://localhost:3000/payment/audit-logs?paymentId=123456"

# Logs por referência externa
curl "http://localhost:3000/payment/audit-logs?externalReference=PRODUCT_123"

# Logs por período
curl "http://localhost:3000/payment/audit-logs?startDate=2024-01-01&endDate=2024-12-31"

# Logs por fonte
curl "http://localhost:3000/payment/audit-logs?source=webhook"

# Logs com limite
curl "http://localhost:3000/payment/audit-logs?limit=50"
```

### Verificar Status por Referência Externa

```bash
# Verificar se um pagamento foi aprovado por referência externa
curl "http://localhost:3000/payment/status-by-reference/PRODUCT_123"

# Verificar pagamento de curso
curl "http://localhost:3000/payment/status-by-reference/COURSE_456"

# Verificar pagamento de serviço
curl "http://localhost:3000/payment/status-by-reference/SERVICE_789"
```

### Visualizar Webhooks Salvos

```bash
# Listar todos os webhooks salvos
curl "http://localhost:3000/webhook/list"

# Filtrar por ação
curl "http://localhost:3000/webhook/list?action=payment.updated"

# Filtrar por status de processamento
curl "http://localhost:3000/webhook/list?processed=true"

# Limitar quantidade
curl "http://localhost:3000/webhook/list?limit=10"

# Ver estatísticas
curl "http://localhost:3000/webhook/stats"

# Buscar webhooks por payment ID
curl "http://localhost:3000/webhook/by-payment/123456"

# Buscar webhooks por referência externa
curl "http://localhost:3000/webhook/by-reference/PRODUCT_123"

# Limpar todos os webhooks
curl -X DELETE "http://localhost:3000/webhook/clear"
```

**Resposta de Sucesso:**

```json
{
  "success": true,
  "message": "Status do pagamento encontrado para referência: PRODUCT_123",
  "data": {
    "externalReference": "PRODUCT_123",
    "found": true,
    "status": "approved",
    "isSuccess": true,
    "paymentDetails": {
      "paymentId": 123456,
      "externalReference": "PRODUCT_123",
      "amount": 100.0,
      "payerEmail": "cliente@email.com",
      "status": "approved",
      "isSuccess": true,
      "timestamp": "2024-01-15T10:30:00Z",
      "dateCreated": "2024-01-15T10:25:00Z",
      "dateApproved": "2024-01-15T10:30:00Z",
      "paymentMethod": "pix",
      "statusDetail": "accredited",
      "source": "webhook",
      "processingCompleted": true,
      "notificationSent": true
    },
    "eventHistory": [
      {
        "event": "payment.approved.processing_started",
        "timestamp": "2024-01-15T09:15:00Z",
        "status": "approved"
      },
      {
        "event": "payment.approved.processing_completed",
        "timestamp": "2024-01-15T10:30:00Z",
        "status": "approved"
      }
    ],
    "summary": {
      "totalEvents": 2,
      "lastEvent": "payment.approved.processing_completed",
      "lastEventTime": "2024-01-15T10:30:00Z",
      "processingCompleted": true
    }
  }
}
```

### Consultar Status de Pagamento

```bash
curl "http://localhost:3000/payment/status/123456789"
```

## 🔗 Endpoints

| Método | Endpoint                                          | Descrição                                            |
| ------ | ------------------------------------------------- | ---------------------------------------------------- |
| POST   | `/payment/create-preference`                      | Criar preferência de pagamento                       |
| GET    | `/payment/success`                                | Retorno para pagamentos aprovados                    |
| GET    | `/payment/failure`                                | Retorno para pagamentos rejeitados                   |
| GET    | `/payment/pending`                                | Retorno para pagamentos pendentes                    |
| GET    | `/payment/status/:id`                             | Consultar status do pagamento                        |
| GET    | `/webhook/list`                                   | Lista todos os webhooks salvos com filtros           |
| GET    | `/webhook/stats`                                  | Mostra estatísticas dos webhooks                     |
| GET    | `/webhook/by-payment/:paymentId`                  | Busca webhooks por payment ID                        |
| GET    | `/webhook/by-reference/:externalReference`        | Busca webhooks por referência externa                |
| DELETE | `/webhook/clear`                                  | Remove todos os webhooks salvos                      |
| GET    | `/payment/list`                                   | Listar pagamentos com filtros                        |
| GET    | `/payment/history`                                | Gerar histórico de pagamentos                        |
| GET    | `/payment/audit-logs`                             | Visualizar logs de auditoria                         |
| GET    | `/payment/status-by-reference/:externalReference` | Verificar status por referência externa              |
| POST   | `/webhook/mercadopago`                            | Receber notificações do MP                           |
| POST   | `/payment-storage/test-approved-payment`          | Testar integração com API de eventos                 |
| POST   | `/payment-storage/test-specific-payment`          | Testar pagamento específico HR2bdx0e000fij6xqvjtley4 |
| GET    | `/payment-monitor/status`                         | Status do monitoramento de arquivos                  |
| POST   | `/payment-monitor/reprocess/:externalReference`   | Reprocessar pagamento específico                     |
| POST   | `/payment-monitor/reprocess-all`                  | Reprocessar todos os pagamentos aprovados            |

## 🔒 Configuração de Webhooks

1. Acesse o [painel do Mercado Pago](https://www.mercadopago.com.br/developers)
2. Vá em "Suas integrações" > sua aplicação
3. Configure a URL do webhook: `https://seu-dominio.com/webhook/mercadopago`
4. Selecione o evento "Pagamentos"
5. Salve e copie a chave secreta gerada

## 🏗️ Arquitetura

```
src/
├── controllers/          # Controladores REST
├── services/            # Lógica de negócio
├── dto/                 # Data Transfer Objects
├── config/              # Configurações
└── main.ts             # Ponto de entrada
```

### Principais Serviços

- **MercadoPagoService**: Integração com SDK oficial
- **WebhookValidationService**: Validação de assinaturas
- **NotificationService**: Envio de confirmações
- **AuditService**: Logs e auditoria

## 🎯 Tipos de Produtos Suportados

A API processa automaticamente diferentes tipos de produtos baseado na referência externa:

| Prefixo         | Tipo              | Ação                            |
| --------------- | ----------------- | ------------------------------- |
| `COURSE_`       | Cursos online     | Cria acesso e envia credenciais |
| `PRODUCT_`      | Produtos digitais | Gera link de download           |
| `SERVICE_`      | Serviços          | Ativa serviço específico        |
| `SUBSCRIPTION_` | Assinaturas       | Configura renovação automática  |

## 🔄 Integração com API de Eventos

Quando um pagamento é aprovado (status: "approved"), o sistema automaticamente notifica outro microserviço através da API de eventos.

### Configuração

Adicione as seguintes variáveis de ambiente:

```env
EVENTOS_API_TOKEN=seu_token_aqui
EVENTOS_API_URL=https://jvdpz4zf-3002.brs.devtunnels.ms/api/eventos/convidados/status/id/
```

### Formato da Notificação

O sistema envia um JSON no formato:

```json
{
  "id": "HR2bdx0e000fij6xqvjtley4",
  "status": "confirmado"
}
```

Onde:

- `id`: É o `externalReference` do pagamento
- `status`: É mapeado de "approved" para "confirmado"

### Mapeamento de Status

| Status Mercado Pago | Status API Eventos |
| ------------------- | ------------------ |
| approved            | confirmado         |
| pending             | pendente           |
| cancelled/rejected  | cancelado          |

### Testar a Integração

```bash
# Testar processamento de pagamento
curl -X POST http://localhost:3000/api/payment-storage/test-process \
  -H "Content-Type: application/json" \
  -d '{"externalReference": "HR2bdx0e000fij6xqvjtley4"}'

# Verificar status do monitor
curl http://localhost:3000/api/payment-monitor/status

# Reprocessar pagamento específico
curl -X POST http://localhost:3000/api/payment-monitor/reprocess \
  -H "Content-Type: application/json" \
  -d '{"externalReference": "HR2bdx0e000fij6xqvjtley4"}'
```

### Logs de Monitoramento

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

### Características

- **Método HTTP**: PUT
- **Timeout**: 10 segundos
- **Autenticação**: Bearer Token
- **Processamento Automático**: Via monitoramento de arquivos
- **Prevenção de Duplicatas**: Campo `monitoringTriggered`

Para mais detalhes, consulte o arquivo [INTEGRACAO_EVENTOS_API.md](INTEGRACAO_EVENTOS_API.md).

## 📁 Monitoramento de Arquivos

O sistema monitora automaticamente mudanças nos arquivos de pagamento e executa a lógica de negócio quando necessário.

### Como Funciona

1. **Monitoramento Automático**: O sistema observa o diretório `data/payments/` em tempo real
2. **Detecção de Mudanças**: Quando um arquivo é criado, modificado ou removido, o sistema detecta automaticamente
3. **Processamento Inteligente**: Se o pagamento tem status "approved", executa toda a lógica de negócio
4. **Prevenção de Duplicatas**: Evita processamento duplicado do mesmo arquivo

### Endpoints de Gerenciamento

```bash
# Verificar status do monitoramento
curl http://localhost:3000/api/payment-monitor/status

# Reprocessar pagamento específico
curl -X POST http://localhost:3000/api/payment-monitor/reprocess \
  -H "Content-Type: application/json" \
  -d '{"externalReference": "HR2bdx0e000fij6xqvjtley4"}'

# Reprocessar todos os pagamentos aprovados
curl -X POST http://localhost:3000/api/payment-monitor/reprocess-all
```

### Logs de Monitoramento

```
📁 ARQUIVO DETECTADO: {
  event: 'change',
  filename: 'HR2bdx0e000fij6xqvjtley4.json',
  externalReference: 'HR2bdx0e000fij6xqvjtley4',
  timestamp: '2025-01-19T10:30:00.000Z'
}

📋 DADOS DO PAGAMENTO CARREGADOS: {
  externalReference: 'HR2bdx0e000fij6xqvjtley4',
  status: 'approved',
  paymentId: '119125020252',
  amount: 1
}

🚀 PROCESSANDO PAGAMENTO APROVADO VIA MONITORAMENTO: HR2bdx0e000fij6xqvjtley4
✅ PAGAMENTO PROCESSADO COM SUCESSO VIA MONITORAMENTO: HR2bdx0e000fij6xqvjtley4
```

### Benefícios

- **Processamento Automático**: Não precisa de intervenção manual
- **Recuperação de Falhas**: Reprocessa pagamentos que falharam anteriormente
- **Consistência**: Garante que todos os pagamentos aprovados sejam processados
- **Monitoramento em Tempo Real**: Detecta mudanças instantaneamente

## 📊 Logs e Monitoramento

### Visualizar Logs

```bash
# Logs da aplicação
tail -f logs/application.log

# Logs de auditoria
grep "AUDIT_LOG" logs/application.log
```

### Métricas Importantes

- Taxa de conversão de pagamentos
- Tempo de processamento de webhooks
- Falhas de validação
- Volume de notificações

## 🧪 Testes

### Ambiente Sandbox

Use credenciais de teste do Mercado Pago:

```env
MERCADOPAGO_ACCESS_TOKEN=TEST-your-test-token
```

### Cartões de Teste

- **Aprovado**: 4509 9535 6623 3704
- **Rejeitado**: 4013 5406 8274 6260

### Simular Webhook

Use o simulador no painel do Mercado Pago para testar webhooks.

## 🚨 Troubleshooting

### Webhook não recebido

- ✅ URL acessível publicamente
- ✅ HTTPS configurado
- ✅ Porta 443 aberta

### Assinatura inválida

- ✅ Webhook secret correto
- ✅ Timestamp não expirado
- ✅ Body não modificado

### Logs de Debug

```typescript
// Habilitar logs detalhados
this.logger.debug('Debug info', { data });
```

## 📈 Próximos Passos

- [ ] Implementar banco de dados
- [ ] Adicionar testes automatizados
- [ ] Configurar CI/CD
- [ ] Implementar cache Redis
- [ ] Adicionar rate limiting

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Suporte

- 📖 [Documentação do Mercado Pago](https://www.mercadopago.com.br/developers)
- 🐛 [Reportar Bug](issues)
- 💬 [Discussões](discussions)

---

**Desenvolvido com ❤️ usando NestJS e TypeScript**
