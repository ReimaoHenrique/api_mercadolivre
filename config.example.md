# Configuração do Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

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

## Configuração no Mercado Pago

### 1. URL do Webhook

```
https://koi-pretty-quietly.ngrok-free.app/webhook/mercadopago
```

### 2. Assinatura Secreta

```
b4d5bf7ec70f6916544e6c338410ccaa86d234c211f0a9f173eddf57381cb063
```

### 3. Eventos Selecionados

- ✅ Pagamentos
- ✅ Alertas de fraude (opcional)

### 4. Teste

Após configurar, use o botão "Simular notificação" no painel do Mercado Pago para testar.
