# Mercado Pago Checkout Pro API

API NestJS para integração completa com Checkout Pro do Mercado Pago, incluindo webhooks, validação de assinaturas e processamento automático de pagamentos aprovados.

## 🚀 Funcionalidades

- ✅ Criação de preferências de pagamento
- ✅ Recebimento e validação de webhooks
- ✅ Processamento automático de pagamentos aprovados
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

## 🔗 Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/payment/create-preference` | Criar preferência de pagamento |
| GET | `/payment/success` | Retorno para pagamentos aprovados |
| GET | `/payment/failure` | Retorno para pagamentos rejeitados |
| GET | `/payment/pending` | Retorno para pagamentos pendentes |
| GET | `/payment/status/:id` | Consultar status do pagamento |
| POST | `/webhook/mercadopago` | Receber notificações do MP |

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

| Prefixo | Tipo | Ação |
|---------|------|------|
| `COURSE_` | Cursos online | Cria acesso e envia credenciais |
| `PRODUCT_` | Produtos digitais | Gera link de download |
| `SERVICE_` | Serviços | Ativa serviço específico |
| `SUBSCRIPTION_` | Assinaturas | Configura renovação automática |

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

