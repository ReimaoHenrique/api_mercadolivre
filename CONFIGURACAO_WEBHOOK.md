# 🔧 Configuração Completa dos Webhooks - Mercado Pago

## 📋 Passo a Passo

### 1. **No Painel do Mercado Pago**

1. Acesse: https://www.mercadopago.com.br/developers
2. Vá em "Suas integrações" > sua aplicação
3. Clique em "Webhooks" > "Configurar notificações"

### 2. **Configurações Necessárias**

#### URL do Webhook:

```
https://koi-pretty-quietly.ngrok-free.app/webhook/mercadopago
```

#### Assinatura Secreta:

```
b4d5bf7ec70f6916544e6c338410ccaa86d234c211f0a9f173eddf57381cb063
```

#### Eventos Selecionados:

- ✅ **Pagamentos** (obrigatório)
- ✅ **Alertas de fraude** (opcional, mas recomendado)

### 3. **Configuração Local**

Crie um arquivo `.env` na raiz do projeto:

```env
# Mercado Pago Configuration
MERCADOPAGO_ACCESS_TOKEN=TEST-your-access-token-here
MERCADOPAGO_PUBLIC_KEY=TEST-your-public-key-here
MERCADOPAGO_WEBHOOK_SECRET=b4d5bf7ec70f6916544e6c338410ccaa86d234c211f0a9f173eddf57381cb063

# URLs Configuration
SUCCESS_URL=https://koi-pretty-quietly.ngrok-free.app/payment/success
FAILURE_URL=https://koi-pretty-quietly.ngrok-free.app/payment/failure
PENDING_URL=https://koi-pretty-quietly.ngrok-free.app/payment/pending
WEBHOOK_URL=https://koi-pretty-quietly.ngrok-free.app/webhook/mercadopago

# Eventos API Configuration
EVENTOS_API_TOKEN=d02f312c49a3e7b62daccf1f6e925b1872cf4e891ea13d26d4d52b86d1448579
EVENTOS_API_URL=https://koi-pretty-quietly.ngrok-free.app/api/eventos/convidados/status

# Environment
NODE_ENV=development
PORT=3000
```

### 4. **Teste da Configuração**

#### A. Simular no Mercado Pago:

1. No painel do Mercado Pago, clique em "Simular notificação"
2. Selecione o evento "payment.created"
3. Clique em "Enviar"

#### B. Verificar nos Logs:

```bash
# Inicie a aplicação
npm run start:dev

# Monitore os logs
tail -f logs/application.log
```

#### C. Testar via cURL:

```bash
# Testar webhook manualmente
curl -X POST http://localhost:3000/webhook/mercadopago \
  -H "Content-Type: application/json" \
  -H "x-signature: ts=1752861801,v1=a43456ecac8820c7f68264a77aa6845546a0208bc181c9d7efb3f3a8958c3245" \
  -H "x-request-id: test-request-id" \
  -d '{
    "action": "payment.created",
    "api_version": "v1",
    "data": {
      "id": "1339442809"
    },
    "date_created": "2025-07-18T23:46:02Z",
    "id": 123099280186,
    "live_mode": false,
    "type": "payment",
    "user_id": "159972839"
  }'
```

### 5. **Verificar Status por Referência**

Após receber um webhook, você pode verificar o status:

```bash
# Verificar se o pagamento foi aprovado
curl "http://localhost:3000/payment/status-by-reference/cmd2bcm64000dij6xripwo1st"
```

### 6. **Troubleshooting**

#### Problema: Assinatura inválida

- ✅ Verifique se a assinatura secreta está correta
- ✅ Em desenvolvimento, a validação é flexível
- ✅ Em produção, descomente a validação rigorosa

#### Problema: Webhook não recebido

- ✅ Verifique se a URL está acessível
- ✅ Confirme se o ngrok está rodando
- ✅ Verifique se a aplicação está no ar

#### Problema: Erro 401/403

- ✅ Verifique as credenciais do Mercado Pago
- ✅ Confirme se o token de acesso está válido

### 7. **Logs Importantes**

Procure por estes logs na aplicação:

```bash
# Logs de webhook recebido
grep "Webhook recebido" logs/application.log

# Logs de auditoria
grep "AUDIT_LOG" logs/application.log

# Logs de validação
grep "Assinatura" logs/application.log
```

### 8. **Próximos Passos**

1. ✅ Configure o webhook no Mercado Pago
2. ✅ Teste com simulação
3. ✅ Faça um pagamento real
4. ✅ Verifique o status por referência externa
5. ✅ Monitore os logs de auditoria

## 🎯 Resultado Esperado

Após a configuração, você deve ver:

1. **Webhook recebido** nos logs
2. **Logs de auditoria** com o evento `payment.approved.processing_completed`
3. **Status aprovado** ao verificar por referência externa
4. **Integração com API de eventos** funcionando

## 📞 Suporte

Se houver problemas:

1. Verifique os logs da aplicação
2. Confirme as configurações no Mercado Pago
3. Teste com o simulador
4. Use o endpoint de verificação por referência
