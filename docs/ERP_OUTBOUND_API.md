# Documentação: Catálogo → ERP (Envio de Dados)

> Guia técnico dos dados que o catálogo envia (POST) para o ERP externo.

---

## Visão Geral

Quando o módulo **"Enviar pedidos"** está ativo no painel admin, o catálogo faz requisições **POST** para a URL base configurada no painel, enviando pedidos finalizados pelos clientes.

**URL base:** configurada em Admin → ERP → "URL base da API"

**Autenticação:** Todas as requisições incluem o header:
```
Authorization: Bearer <TOKEN_CONFIGURADO_NO_ADMIN>
Content-Type: application/json
```

---

## Endpoints que o ERP deve implementar

### 1. Receber Pedidos

#### `POST {URL_BASE}/orders`

O catálogo envia cada pedido finalizado para este endpoint.

**Request enviada pelo catálogo:**
```json
{
  "order": {
    "id": "uuid-do-pedido",
    "created_at": "2025-02-10T18:30:00Z",
    "customer": {
      "name": "João Silva",
      "phone": "5511999999999",
      "email": "joao@email.com"
    },
    "payment_condition": "Cartão 3x",
    "items": [
      {
        "code": "SKU-001",
        "name": "Camiseta Básica Preta",
        "quantity": 2,
        "unit_price": 79.90,
        "subtotal": 159.80
      },
      {
        "code": "SKU-002",
        "name": "Tênis Runner Pro",
        "quantity": 1,
        "unit_price": 299.90,
        "subtotal": 299.90
      }
    ],
    "total": 459.70,
    "notes": "Entregar no período da tarde"
  }
}
```

**Campos enviados:**

| Campo                    | Tipo     | Descrição                                  |
|--------------------------|----------|--------------------------------------------|
| `order.id`               | string   | UUID único do pedido no catálogo           |
| `order.created_at`       | string   | Data/hora ISO 8601 da criação              |
| `order.customer.name`    | string   | Nome do cliente                            |
| `order.customer.phone`   | string   | Telefone (formato: 55DDDNNNNNNNNN)        |
| `order.customer.email`   | string   | E-mail do cliente (pode ser vazio)         |
| `order.payment_condition`| string   | Condição de pagamento selecionada          |
| `order.items[].code`     | string   | Código do produto (SKU do ERP)             |
| `order.items[].name`     | string   | Nome do produto                            |
| `order.items[].quantity` | number   | Quantidade                                 |
| `order.items[].unit_price`| number  | Preço unitário                             |
| `order.items[].subtotal` | number   | Subtotal do item (quantity × unit_price)   |
| `order.total`            | number   | Valor total do pedido                      |
| `order.notes`            | string   | Observações do cliente (pode ser vazio)    |

**Response esperada do ERP (200):**
```json
{
  "success": true,
  "erp_order_id": "PED-2025-001"
}
```

| Campo          | Tipo    | Obrigatório | Descrição                            |
|----------------|---------|-------------|--------------------------------------|
| `success`      | boolean | ✅ Sim       | Se o pedido foi recebido com sucesso |
| `erp_order_id` | string  | ❌ Não       | ID do pedido gerado no ERP           |

**Response de erro (4xx/5xx):**
```json
{
  "success": false,
  "error": "Produto SKU-002 não encontrado no ERP"
}
```

> O catálogo tentará reenviar pedidos com falha automaticamente a cada 5 minutos (máximo 5 tentativas).

---

### 2. Atualizar Status do Pedido (Webhook do ERP → Catálogo)

#### `POST {CATALOGO_URL}/erp-sync/orders/status`

O ERP pode notificar o catálogo sobre mudanças de status.

**Request que o ERP deve enviar:**
```json
{
  "order_id": "uuid-do-pedido",
  "status": "confirmed",
  "erp_order_id": "PED-2025-001",
  "message": "Pedido aprovado e em separação"
}
```

**Status aceitos:**

| Status       | Descrição                        |
|--------------|----------------------------------|
| `confirmed`  | Pedido confirmado pelo ERP       |
| `processing` | Em separação/produção            |
| `shipped`    | Enviado/despachado               |
| `delivered`  | Entregue                         |
| `cancelled`  | Cancelado                        |

**Response (200):**
```json
{
  "success": true
}
```

---

## Fluxo Completo

```
┌──────────────┐                    ┌─────────────┐
│   Catálogo   │                    │     ERP     │
│              │                    │             │
│ Cliente faz  │   POST /orders     │             │
│ pedido ──────┼───────────────────▶│ Recebe e    │
│              │                    │ processa    │
│              │   POST /status     │             │
│ Atualiza  ◀──┼────────────────────│ Envia status│
│ status       │                    │             │
└──────────────┘                    └─────────────┘
```

---

## Exemplo cURL (simulando o que o catálogo envia)

```bash
# Simular envio de pedido do catálogo para o ERP
curl -X POST https://api.meuerp.com/v1/orders \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "order": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "created_at": "2025-02-10T18:30:00Z",
      "customer": {
        "name": "Maria Santos",
        "phone": "5511988887777",
        "email": "maria@email.com"
      },
      "payment_condition": "Boleto",
      "items": [
        {
          "code": "SKU-001",
          "name": "Camiseta Preta",
          "quantity": 3,
          "unit_price": 79.90,
          "subtotal": 239.70
        }
      ],
      "total": 239.70,
      "notes": ""
    }
  }'
```

---

## Checklist para o ERP

- [ ] Implementar endpoint `POST /orders` para receber pedidos
- [ ] Retornar `{ "success": true }` com status 200 em caso de sucesso
- [ ] Retornar `{ "success": false, "error": "..." }` em caso de falha
- [ ] (Opcional) Implementar webhook de status para `POST /erp-sync/orders/status`
- [ ] (Opcional) Retornar `erp_order_id` na resposta para rastreamento
