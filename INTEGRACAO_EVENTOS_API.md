# Integração com API de Eventos - Mercado Pago

## Visão Geral

Esta integração permite que quando um pagamento for aprovado no Mercado Pago, o status do convidado seja automaticamente atualizado na API de eventos.

## Como Funciona

### 1. Fluxo de Pagamento

1. **Criação da Preferência**: Quando uma preferência de pagamento é criada, o `external_reference` é definido como o ID do convidado
2. **Pagamento**: O usuário realiza o pagamento no Mercado Pago
3. **Webhook**: O Mercado Pago envia um webhook para `/webhook/mercadopago` quando o status do pagamento muda
4. **Processamento**: O sistema processa o webhook e, se o pagamento for aprovado, atualiza o status do convidado

### 2. Mapeamento de Status

| Status Mercado Pago | Status Convidado | Descrição           |
| ------------------- | ---------------- | ------------------- |
| `approved`          | `confirmado`     | Pagamento aprovado  |
| `pending`           | `pendente`       | Pagamento pendente  |
| `cancelled`         | `cancelado`      | Pagamento cancelado |
| `rejected`          | `cancelado`      | Pagamento rejeitado |

### 3. Configuração

As seguintes variáveis de ambiente devem ser configuradas:

```env
# API de Eventos - Token para atualizar status do convidado
EVENTOS_API_TOKEN=d02f312c49a3e7b62daccf1f6e925b1872cf4e891ea13d26d4d52b86d1448579
EVENTOS_API_URL=https://koi-pretty-quietly.ngrok-free.app/api/eventos/convidados/status
```

### 4. Endpoint da API de Eventos

A API de eventos deve ter o seguinte endpoint:

```
PUT https://koi-pretty-quietly.ngrok-free.app/api/eventos/convidados/status/{id}
```

**Headers:**

```
Authorization: Bearer d02f312c49a3e7b62daccf1f6e925b1872cf4e891ea13d26d4d52b86d1448579
Content-Type: application/json
```

**Body:**

```json
{
  "id": "cmd27meh70003ijsdb58nfa6o",
  "status": "confirmado"
}
```

### 5. Teste da Integração

Para testar se a integração está funcionando, use o endpoint:

```
GET /payment/test-eventos-api?convidadoId=cmd27meh70003ijsdb58nfa6o
```

Este endpoint irá:

1. Testar a conectividade com a API de eventos
2. Tentar atualizar o status do convidado com dados de teste
3. Retornar o resultado da operação

### 6. Logs e Monitoramento

O sistema registra logs detalhados para monitorar a integração:

- **Sucesso**: Log quando o status do convidado é atualizado com sucesso
- **Erro**: Log detalhado quando há falha na atualização
- **Auditoria**: Todos os eventos são registrados no sistema de auditoria

### 7. Tratamento de Erros

O sistema trata os seguintes tipos de erro:

- **401**: Token de autorização inválido
- **404**: Convidado não encontrado
- **500+**: Erro interno na API de eventos
- **Timeout**: Timeout na chamada (10 segundos)

### 8. Exemplo de Uso

1. **Criar preferência de pagamento:**

```bash
POST /payment/preference
{
  "title": "Ingresso Evento",
  "description": "Ingresso para o evento",
  "quantity": 1,
  "unit_price": 100.00,
  "external_reference": "cmd27meh70003ijsdb58nfa6o",
  "payer": {
    "email": "usuario@email.com"
  }
}
```

2. **Usuário paga no Mercado Pago**

3. **Webhook é recebido automaticamente:**

```json
{
  "type": "payment",
  "action": "payment.updated",
  "data": {
    "id": "1234567890"
  }
}
```

4. **Status do convidado é atualizado automaticamente na API de eventos**

### 9. Segurança

- Token de autorização obrigatório para todas as chamadas
- Validação de assinatura do webhook do Mercado Pago
- Timeout de 10 segundos para evitar travamentos
- Logs detalhados para auditoria

### 10. Troubleshooting

**Problema**: Status do convidado não é atualizado
**Solução**: Verificar logs e testar conectividade com `/payment/test-eventos-api`

**Problema**: Erro 401 na API de eventos
**Solução**: Verificar se o `EVENTOS_API_TOKEN` está correto

**Problema**: Timeout na chamada
**Solução**: Verificar se a API de eventos está respondendo dentro de 10 segundos
