# Histórico de Pagamentos - Mercado Pago API

Este documento explica como visualizar e gerenciar o histórico de pagamentos na API do Mercado Pago.

## 📊 Visão Geral

A API oferece três formas principais de visualizar o histórico de pagamentos:

1. **Logs de Auditoria** - Registros detalhados de todos os eventos
2. **Lista de Pagamentos** - Consulta paginada com filtros
3. **Histórico Resumido** - Estatísticas e resumo dos pagamentos

## 🔍 Métodos de Consulta

### 1. Logs de Auditoria (Já Implementado)

Todos os eventos de pagamento são registrados automaticamente no sistema de auditoria.

```bash
# Visualizar logs da aplicação
npm run start:dev

# Filtrar logs de auditoria
grep "AUDIT_LOG" logs/application.log

# Logs específicos de pagamentos
grep "payment" logs/application.log
```

**Estrutura dos Logs:**

`
"t``json
{imestamp": "2024-01-15T10:30:00Z",
"event": "payment.approved.processing_completed",
"paymentId": 123456,
"externalReference": "PRODUCT_123",
"amount": 100.0,
"payerEmail": "cliente@email.com",
"source": "webhook"
}

````

### 2. Listar Pagamentos (`GET /payment/list`)

Endpoint para consultar pagamentos com filtros e paginação.

**Parâmetros:**

- `status` - Status do pagamento (approved, pending, rejected, cancelled)
- `external_reference` - Referência externa do pagamento
- `payer_email` - Email do pagador
- `date_created_from` - Data inicial (YYYY-MM-DD)
- `date_created_to` - Data final (YYYY-MM-DD)
- `limit` - Quantidade de resultados (padrão: 50, máximo: 100)
- `offset` - Posição inicial (padrão: 0)

**Exemplos de Uso:**

```bash
# Listar todos os pagamentos
curl "http://localhost:3000/payment/list"

# Filtrar por status aprovado
curl "http://localhost:3000/payment/list?status=approved"

# Filtrar por referência externa
curl "http://localhost:3000/payment/list?external_reference=PRODUCT_123"

# Filtrar por email do pagador
curl "http://localhost:3000/payment/list?payer_email=cliente@email.com"

# Filtrar por período
curl "http://localhost:3000/payment/list?date_created_from=2024-01-01&date_created_to=2024-01-31"

# Com paginação
curl "http://localhost:3000/payment/list?limit=20&offset=40"
````

**Resposta:**

```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": 123456,
        "status": "approved",
        "status_detail": "accredited",
        "external_reference": "PRODUCT_123",
        "transaction_amount": 100.0,
        "date_created": "2024-01-15T10:30:00.000-03:00",
        "date_approved": "2024-01-15T10:31:00.000-03:00",
        "payer": {
          "email": "cliente@email.com",
          "first_name": "João",
          "last_name": "Silva"
        },
        "payment_method_id": "pix",
        "payment_type_id": "digital_currency"
      }
    ],
    "pagination": {
      "total": 150,
      "limit": 50,
      "offset": 0,
      "hasMore": true
    }
  },
  "message": "Lista de pagamentos obtida com sucesso"
}
```

### 3. Histórico Resumido (`GET /payment/history`)

Endpoint para gerar relatórios e estatísticas dos pagamentos.

**Parâmetros:**

- `start_date` - Data inicial (YYYY-MM-DD)
- `end_date` - Data final (YYYY-MM-DD)
- `status` - Status do pagamento
- `limit` - Quantidade de pagamentos (padrão: 100, máximo: 1000)

**Exemplos de Uso:**

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

**Resposta:**

```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": 123456,
        "status": "approved",
        "status_detail": "accredited",
        "external_reference": "PRODUCT_123",
        "transaction_amount": 100.0,
        "date_created": "2024-01-15T10:30:00.000-03:00",
        "date_approved": "2024-01-15T10:31:00.000-03:00",
        "payer": {
          "email": "cliente@email.com"
        },
        "payment_method_id": "pix",
        "payment_type_id": "digital_currency"
      }
    ],
    "summary": {
      "total": 150,
      "approved": 120,
      "pending": 20,
      "rejected": 10,
      "totalAmount": 15000.0,
      "averageAmount": 100.0
    }
  },
  "message": "Histórico de pagamentos gerado com sucesso"
}
```

### 4. Consultar Pagamento Específico (`GET /payment/status/:id`)

Endpoint para consultar detalhes de um pagamento específico.

```bash
curl "http://localhost:3000/payment/status/123456"
```

## 🎯 Casos de Uso Comuns

### Relatório Mensal de Vendas

```bash
# Obter histórico do mês atual
curl "http://localhost:3000/payment/history?start_date=2024-01-01&end_date=2024-01-31&status=approved"
```

### Análise de Conversão

```bash
# Comparar aprovados vs rejeitados
curl "http://localhost:3000/payment/history?start_date=2024-01-01&end_date=2024-01-31"
```

### Busca por Cliente

```bash
# Encontrar todos os pagamentos de um cliente
curl "http://localhost:3000/payment/list?payer_email=cliente@email.com"
```

### Análise de Produto

```bash
# Verificar vendas de um produto específico
curl "http://localhost:3000/payment/list?external_reference=PRODUCT_123"
```

## 📈 Métricas Importantes

### Taxa de Conversão

```
Taxa de Conversão = (Pagamentos Aprovados / Total de Pagamentos) × 100
```

### Valor Médio de Transação

```
Valor Médio = Valor Total / Número de Pagamentos Aprovados
```

### Análise Temporal

- Pagamentos por dia/semana/mês
- Horários de pico
- Sazonalidade

## 🔧 Interface Web

Use o arquivo `example-client.html` para testar os endpoints de forma visual:

1. Abra o arquivo no navegador
2. Configure a URL da API
3. Use as seções "Histórico de Pagamentos" e "Listar Pagamentos"
4. Visualize os resultados formatados

## ⚠️ Limitações e Considerações

### Rate Limiting

- A API do Mercado Pago tem limites de requisições
- Use paginação para grandes volumes
- Implemente cache quando possível

### Dados Sensíveis

- Emails e dados pessoais são retornados
- Implemente controle de acesso adequado
- Considere mascarar dados sensíveis em logs

### Performance

- Consultas com muitos filtros podem ser lentas
- Use índices adequados no banco de dados
- Considere implementar cache Redis

## 🚀 Próximos Passos

### Melhorias Sugeridas

1. **Dashboard Web**
   - Interface gráfica para visualização
   - Gráficos e estatísticas
   - Exportação de relatórios

2. **Notificações**
   - Alertas para eventos importantes
   - Relatórios automáticos por email
   - Webhooks para integrações

3. **Análise Avançada**
   - Machine Learning para detecção de fraude
   - Previsão de vendas
   - Segmentação de clientes

4. **Integração com BI**
   - Conexão com Power BI, Tableau
   - APIs para sistemas externos
   - Data warehouse

## 📞 Suporte

Para dúvidas sobre o histórico de pagamentos:

1. Verifique os logs da aplicação
2. Teste os endpoints com o cliente de exemplo
3. Consulte a documentação do Mercado Pago
4. Entre em contato com o suporte técnico
