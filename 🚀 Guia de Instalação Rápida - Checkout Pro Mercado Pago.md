# 🚀 Guia de Instalação Rápida - Checkout Pro Mercado Pago

## ⚡ Instalação em 5 Minutos

### 1. Pré-requisitos
- Node.js 18+ instalado
- Conta no Mercado Pago (sandbox ou produção)
- Editor de código (VS Code recomendado)

### 2. Configuração Inicial

```bash
# 1. Navegue até o diretório do projeto
cd mercadopago-checkout-pro/mercadopago-api

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
```

### 3. Configurar Credenciais

Edite o arquivo `.env` com suas credenciais do Mercado Pago:

```env
# Para SANDBOX (testes)
MERCADOPAGO_ACCESS_TOKEN=TEST-1234567890-123456-abcdef1234567890abcdef1234567890-123456789
MERCADOPAGO_PUBLIC_KEY=TEST-abcdef12-3456-7890-abcd-ef1234567890
MERCADOPAGO_WEBHOOK_SECRET=sua_chave_secreta_aqui

# Para PRODUÇÃO
# MERCADOPAGO_ACCESS_TOKEN=APP_USR-1234567890-123456-abcdef1234567890abcdef1234567890-123456789
# MERCADOPAGO_PUBLIC_KEY=APP_USR-abcdef12-3456-7890-abcd-ef1234567890
```

### 4. Executar a Aplicação

```bash
# Desenvolvimento (com hot reload)
npm run start:dev

# Produção
npm run build
npm run start:prod
```

### 5. Testar a API

Abra o arquivo `example-client.html` no navegador para testar a integração.

## 🔧 Configuração de Webhooks

### No Painel do Mercado Pago:

1. Acesse: https://www.mercadopago.com.br/developers
2. Vá em "Suas integrações" > sua aplicação
3. Clique em "Webhooks" > "Configurar notificações"
4. Configure:
   - **URL**: `https://seu-dominio.com/webhook/mercadopago`
   - **Eventos**: Selecione "Pagamentos"
5. Salve e copie a **chave secreta** gerada
6. Cole a chave no arquivo `.env` na variável `MERCADOPAGO_WEBHOOK_SECRET`

### Para Desenvolvimento Local:

Use um serviço como ngrok para expor sua aplicação local:

```bash
# Instalar ngrok
npm install -g ngrok

# Expor porta 3000
ngrok http 3000

# Use a URL gerada (ex: https://abc123.ngrok.io/webhook/mercadopago)
```

## 📋 Checklist de Configuração

- [ ] Node.js 18+ instalado
- [ ] Dependências instaladas (`npm install`)
- [ ] Arquivo `.env` configurado com credenciais
- [ ] Aplicação rodando (`npm run start:dev`)
- [ ] Webhook configurado no painel do Mercado Pago
- [ ] Teste realizado com `example-client.html`

## 🧪 Teste Rápido

### 1. Criar Preferência de Pagamento

```bash
curl -X POST http://localhost:3000/payment/create-preference \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Produto Teste",
    "quantity": 1,
    "unit_price": 10.00,
    "external_reference": "TEST_123",
    "payer": {
      "email": "test@email.com"
    }
  }'
```

### 2. Resposta Esperada

```json
{
  "success": true,
  "data": {
    "id": "123456789",
    "init_point": "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=123456789"
  }
}
```

### 3. Testar Webhook

Use o simulador no painel do Mercado Pago:
1. Vá em "Webhooks" > "Simular"
2. Selecione "payment.updated"
3. Informe um ID de pagamento de teste
4. Clique em "Enviar teste"

## 🎯 Cartões de Teste

Para testes no ambiente sandbox:

| Status | Cartão | CVV | Vencimento |
|--------|--------|-----|------------|
| ✅ Aprovado | 4509 9535 6623 3704 | 123 | 11/25 |
| ❌ Rejeitado | 4013 5406 8274 6260 | 123 | 11/25 |
| ⏳ Pendente | 4389 3540 6624 0648 | 123 | 11/25 |

## 🚨 Problemas Comuns

### API não inicia
```bash
# Verificar se a porta 3000 está livre
lsof -i :3000

# Matar processo se necessário
kill -9 <PID>
```

### Webhook não recebe notificações
- ✅ URL acessível publicamente (use ngrok para desenvolvimento)
- ✅ HTTPS configurado
- ✅ Chave secreta correta no `.env`

### Erro de compilação TypeScript
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📞 Suporte

- 📖 [Documentação Completa](mercadopago-checkout-pro-documentation.md)
- 🐛 Verifique os logs da aplicação
- 💬 Use o simulador de webhooks do Mercado Pago

## 🎉 Próximos Passos

Após a configuração básica:

1. **Personalizar Lógica de Negócio**: Edite `src/services/mercadopago.service.ts`
2. **Configurar Notificações**: Integre com seu provedor de email/SMS
3. **Implementar Banco de Dados**: Para persistir logs de auditoria
4. **Deploy em Produção**: Configure HTTPS e domínio próprio

---

**🎯 Meta**: Ter a API funcionando em menos de 5 minutos!

**✅ Sucesso**: Quando conseguir criar uma preferência e receber webhooks.

