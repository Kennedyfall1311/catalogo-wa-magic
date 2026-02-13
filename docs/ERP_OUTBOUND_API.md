# Documentação: Catálogo → ERP (Envio de Dados)

> Guia técnico completo dos dados que o catálogo envia (POST) para o ERP externo quando pedidos são finalizados.

---

## Sumário

1. [Visão Geral](#visão-geral)
2. [Configuração no Painel Admin](#configuração-no-painel-admin)
3. [Endpoint 1: Receber Pedidos](#1-receber-pedidos)
4. [Endpoint 2: Atualizar Status (Webhook)](#2-atualizar-status-do-pedido-webhook-do-erp--catálogo)
5. [Segurança e Autenticação](#segurança-e-autenticação)
6. [Tratamento de Erros e Retry](#tratamento-de-erros-e-retry)
7. [Fluxo Completo](#fluxo-completo)
8. [Exemplos Completos](#exemplos-completos)
9. [Troubleshooting](#troubleshooting)
10. [Checklist para o ERP](#checklist-para-o-erp)

---

## Visão Geral

Quando o módulo **"Enviar pedidos"** está ativo no painel admin, o catálogo faz requisições **POST** para a URL base configurada no painel, enviando pedidos finalizados pelos clientes automaticamente.

### Como funciona

1. Cliente finaliza um pedido no catálogo (checkout)
2. Pedido é persistido no banco de dados do catálogo
3. O catálogo **envia automaticamente** o pedido para o ERP via POST
4. O ERP processa e opcionalmente retorna o ID gerado internamente
5. O ERP pode enviar atualizações de status de volta ao catálogo

### Pré-requisitos

| Requisito | Detalhes |
|-----------|----------|
| Módulo ativo | "Enviar pedidos" ativado em Admin → ERP |
| URL base | URL do ERP configurada no painel (ex: `https://api.meuerp.com/v1`) |
| Token | Token de autenticação configurado no painel |
| Endpoint | O ERP deve implementar `POST /orders` |
| HTTPS | Recomendado para produção |

---

## Configuração no Painel Admin

### Campos de configuração

| Campo | Localização | Descrição | Exemplo |
|-------|------------|-----------|---------|
| **URL base da API** | Admin → ERP | URL base do endpoint do ERP (sem `/orders`) | `https://api.meuerp.com/v1` |
| **Token de autenticação** | Admin → ERP | Token Bearer enviado no header de todas as requisições | `eyJhbGciOiJIUzI1NiJ9...` |
| **Enviar pedidos** | Admin → ERP | Toggle para ativar/desativar o envio automático | ✅ Ativado |

### Validação da configuração

Antes de ativar, verifique:
1. A URL base termina **sem** barra (`/`) final
2. O token é válido e tem permissão para criar pedidos no ERP
3. O endpoint `POST {URL_BASE}/orders` está acessível e retorna 200

---

## Endpoints que o ERP deve implementar

### 1. Receber Pedidos

#### `POST {URL_BASE}/orders`

O catálogo envia cada pedido finalizado para este endpoint **imediatamente** após a criação.

**Headers enviados pelo catálogo:**
```http
POST https://api.meuerp.com/v1/orders HTTP/1.1
Authorization: Bearer SEU_TOKEN_CONFIGURADO
Content-Type: application/json
Accept: application/json
X-Catalog-Version: 1.0
X-Request-Id: req_550e8400-e29b-41d4
```

**Request Body completo:**
```json
{
  "order": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "created_at": "2025-02-10T18:30:00Z",
    "customer": {
      "name": "João Silva",
      "phone": "5511999999999",
      "email": "joao@email.com",
      "cpf_cnpj": "123.456.789-00"
    },
    "payment_condition": "Cartão 3x",
    "items": [
      {
        "code": "SKU-001",
        "name": "Camiseta Básica Preta",
        "quantity": 2,
        "unit_price": 79.90,
        "subtotal": 159.80,
        "unit_of_measure": "UN",
        "brand": "Marca X"
      },
      {
        "code": "SKU-002",
        "name": "Tênis Runner Pro",
        "quantity": 1,
        "unit_price": 299.90,
        "subtotal": 299.90,
        "unit_of_measure": "PAR",
        "brand": "SportLine"
      }
    ],
    "subtotal": 459.70,
    "shipping_fee": 15.00,
    "total": 474.70,
    "notes": "Entregar no período da tarde"
  }
}
```

**Campos enviados — Detalhamento completo:**

#### Dados do Pedido (`order`)

| Campo | Tipo | Sempre presente | Descrição | Exemplo |
|-------|------|:---------------:|-----------|---------|
| `id` | string (UUID) | ✅ Sim | UUID único do pedido no catálogo. Pode ser usado como referência cruzada. | `"550e8400-e29b-41d4-a716-446655440000"` |
| `created_at` | string (ISO 8601) | ✅ Sim | Data/hora da criação no fuso UTC | `"2025-02-10T18:30:00Z"` |
| `subtotal` | number | ✅ Sim | Soma dos subtotais dos itens (sem frete) | `459.70` |
| `shipping_fee` | number | ✅ Sim | Valor do frete. `0` quando frete não está configurado. | `15.00` |
| `total` | number | ✅ Sim | Valor total do pedido (subtotal + shipping_fee) | `474.70` |
| `notes` | string | ⚠️ Pode ser vazio | Observações do cliente. String vazia se não preenchido. | `"Entregar de manhã"` |
| `payment_condition` | string \| null | ⚠️ Condicional | Condição de pagamento. `null` se módulo de pagamento desativado. | `"Cartão 3x"` |

#### Dados do Cliente (`order.customer`)

| Campo | Tipo | Sempre presente | Descrição | Formato |
|-------|------|:---------------:|-----------|---------|
| `name` | string | ✅ Sim | Nome completo do cliente (min. 2 caracteres) | Texto livre |
| `phone` | string | ✅ Sim | Telefone com código do país e DDD | `55DDDNNNNNNNNN` (ex: `5511999999999`) |
| `email` | string | ⚠️ Pode ser vazio | E-mail do cliente. String vazia se não informado. | `usuario@dominio.com` |
| `cpf_cnpj` | string \| null | ⚠️ Opcional | CPF (11 dígitos) ou CNPJ (14 dígitos) formatado. `null` se não informado. | `"123.456.789-00"` ou `"12.345.678/0001-90"` |

#### Itens do Pedido (`order.items[]`)

| Campo | Tipo | Sempre presente | Descrição | Exemplo |
|-------|------|:---------------:|-----------|---------|
| `code` | string | ✅ Sim | Código do produto no ERP (SKU). **Use este campo para associar ao produto no ERP.** | `"SKU-001"` |
| `name` | string | ✅ Sim | Nome do produto (snapshot no momento da compra) | `"Camiseta Básica Preta"` |
| `quantity` | number (int) | ✅ Sim | Quantidade comprada (≥ 1) | `2` |
| `unit_price` | number | ✅ Sim | Preço unitário no momento da compra (em BRL) | `79.90` |
| `subtotal` | number | ✅ Sim | Subtotal do item (quantity × unit_price) | `159.80` |
| `unit_of_measure` | string \| null | ⚠️ Opcional | Unidade de medida (UN, KG, CX, PAR, etc.) | `"UN"` |
| `brand` | string \| null | ⚠️ Opcional | Marca do produto | `"Marca X"` |

**Response esperada do ERP — Sucesso (200):**
```json
{
  "success": true,
  "erp_order_id": "PED-2025-001",
  "message": "Pedido recebido com sucesso"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|:-----------:|-----------|
| `success` | boolean | ✅ Sim | Se o pedido foi recebido e processado com sucesso |
| `erp_order_id` | string | ❌ Não | ID do pedido gerado no ERP (para rastreamento cruzado) |
| `message` | string | ❌ Não | Mensagem informativa adicional |

**Response de erro (4xx/5xx):**
```json
{
  "success": false,
  "error": "Produto SKU-002 não encontrado no cadastro",
  "error_code": "PRODUCT_NOT_FOUND",
  "details": [
    {
      "item_code": "SKU-002",
      "message": "Produto não cadastrado no ERP"
    }
  ]
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|:-----------:|-----------|
| `success` | boolean | ✅ Sim | Deve ser `false` em caso de erro |
| `error` | string | ✅ Sim | Mensagem descritiva do erro |
| `error_code` | string | ❌ Não | Código máquina do erro |
| `details` | array | ❌ Não | Detalhes granulares por item |

---

### 2. Atualizar Status do Pedido (Webhook do ERP → Catálogo)

#### `POST {CATALOGO_URL}/erp-sync/orders/status`

O ERP pode notificar o catálogo sobre mudanças de status dos pedidos. Este endpoint é **opcional** mas recomendado para manter o dashboard administrativo atualizado.

**Headers que o ERP deve enviar:**
```http
POST https://catalogo.exemplo.com/erp-sync/orders/status HTTP/1.1
Authorization: Bearer TOKEN_DO_CATALOGO
Content-Type: application/json
```

**Request Body:**
```json
{
  "order_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "confirmed",
  "erp_order_id": "PED-2025-001",
  "message": "Pedido aprovado e em separação",
  "updated_at": "2025-02-10T19:00:00Z"
}
```

**Campos:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|:-----------:|-----------|
| `order_id` | string (UUID) | ✅ Sim | UUID do pedido no catálogo (recebido no envio original) |
| `status` | string | ✅ Sim | Novo status do pedido (ver tabela abaixo) |
| `erp_order_id` | string | ❌ Não | ID do pedido no ERP |
| `message` | string | ❌ Não | Mensagem descritiva sobre a atualização |
| `updated_at` | string (ISO 8601) | ❌ Não | Data/hora da atualização no ERP |

**Status aceitos e significados:**

| Status | Descrição | Visível no dashboard admin | Transição válida de |
|--------|-----------|:-------------------------:|---------------------|
| `confirmed` | Pedido confirmado e aceito pelo ERP | ✅ Sim | `pending` |
| `processing` | Em separação, produção ou preparação | ✅ Sim | `confirmed` |
| `shipped` | Enviado, despachado ou em trânsito | ✅ Sim | `processing` |
| `delivered` | Entregue ao cliente final | ✅ Sim | `shipped` |
| `cancelled` | Pedido cancelado | ✅ Sim | `pending`, `confirmed` |

**Diagrama de estados:**
```
              ┌───────────┐
              │  pending   │ ← Estado inicial (criação no catálogo)
              └─────┬─────┘
                    │
             ┌──────┴──────┐
             ▼             ▼
       ┌───────────┐  ┌───────────┐
       │ confirmed │  │ cancelled │ ← Estado final
       └─────┬─────┘  └───────────┘
             │
             ▼
       ┌───────────┐
       │ processing│
       └─────┬─────┘
             │
             ▼
       ┌───────────┐
       │  shipped  │
       └─────┬─────┘
             │
             ▼
       ┌───────────┐
       │ delivered │ ← Estado final
       └───────────┘
```

**Response esperada (200):**
```json
{
  "success": true
}
```

**Response de erro (404):**
```json
{
  "success": false,
  "error": "Pedido não encontrado",
  "code": "ORDER_NOT_FOUND"
}
```

---

## Segurança e Autenticação

### Requisitos de segurança

| Aspecto | Recomendação | Obrigatório |
|---------|-------------|:-----------:|
| **HTTPS** | Usar HTTPS em produção para criptografar dados em trânsito | ✅ Sim |
| **Token** | Token de autenticação com ≥ 32 caracteres | ✅ Sim |
| **Validação de IP** | Whitelist de IPs do catálogo (se possível) | ❌ Recomendado |
| **Timeout** | Responder em ≤ 10 segundos | ✅ Sim |
| **Idempotência** | Tratar `order.id` como chave única para evitar duplicatas | ✅ Sim |

### Validação do token no ERP

O ERP deve validar o token recebido no header `Authorization`:

```python
# Exemplo em Python
def validate_token(request):
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return False, "Token ausente"
    
    token = auth_header.replace("Bearer ", "")
    expected_token = os.environ.get("CATALOG_API_TOKEN")
    
    if token != expected_token:
        return False, "Token inválido"
    
    return True, None
```

---

## Tratamento de Erros e Retry

### Política de retry automático

O catálogo implementa retry automático para pedidos com falha:

| Tentativa | Intervalo | Comportamento |
|:---------:|:---------:|---------------|
| 1ª | Imediata | Envio original |
| 2ª | 5 minutos | Primeira reatentativa |
| 3ª | 15 minutos | Segunda reatentativa |
| 4ª | 30 minutos | Terceira reatentativa |
| 5ª | 60 minutos | Última tentativa |
| — | — | Marca como `failed` e alerta o admin |

### Códigos de resposta e comportamento

| Código HTTP | Significado | Retry? | Ação do catálogo |
|:-----------:|-------------|:------:|-------------------|
| `200` / `201` | Sucesso | ❌ | Marca como sincronizado |
| `400` | Erro no payload | ❌ | Marca como erro permanente (não reenvia) |
| `401` | Token inválido | ❌ | Marca como erro de configuração |
| `404` | Endpoint não encontrado | ❌ | Marca como erro de configuração |
| `408` | Timeout | ✅ | Agenda retry |
| `429` | Rate limit | ✅ | Agenda retry com backoff |
| `500` | Erro interno | ✅ | Agenda retry |
| `502` / `503` / `504` | Indisponibilidade | ✅ | Agenda retry |
| Sem resposta (rede) | Conexão falhou | ✅ | Agenda retry |

### Idempotência no ERP

O ERP **deve** usar o campo `order.id` (UUID) como chave de idempotência:

```sql
-- Exemplo: verificar se pedido já foi processado
SELECT id FROM erp_orders WHERE catalog_order_id = '550e8400-e29b-41d4-a716-446655440000';

-- Se já existe, retornar sucesso sem reprocessar
-- Se não existe, processar normalmente
```

---

## Fluxo Completo

### Diagrama de sequência detalhado

```
┌──────────┐       ┌──────────┐       ┌──────────┐       ┌──────────┐
│ Cliente  │       │ Catálogo │       │  API do  │       │   ERP    │
│ (browser)│       │ (backend)│       │  catálogo│       │ (externo)│
└────┬─────┘       └────┬─────┘       └────┬─────┘       └────┬─────┘
     │                  │                  │                   │
     │ 1. Finaliza      │                  │                   │
     │    pedido        │                  │                   │
     │─────────────────▶│                  │                   │
     │                  │                  │                   │
     │                  │ 2. Persiste      │                   │
     │                  │    no banco      │                   │
     │                  │─────────────────▶│                   │
     │                  │                  │                   │
     │                  │                  │ 3. POST /orders   │
     │                  │                  │──────────────────▶│
     │                  │                  │                   │
     │                  │                  │                   │ 4. Processa
     │                  │                  │                   │    pedido
     │                  │                  │                   │
     │                  │                  │ 5. { success,     │
     │                  │                  │    erp_order_id } │
     │                  │                  │◀──────────────────│
     │                  │                  │                   │
     │                  │ 6. Atualiza      │                   │
     │                  │    status        │                   │
     │                  │◀─────────────────│                   │
     │                  │                  │                   │
     │ 7. Confirmação   │                  │                   │
     │◀─────────────────│                  │                   │
     │ + WhatsApp       │                  │                   │
     │                  │                  │                   │
     │                  │                  │ 8. POST /status   │
     │                  │                  │◀──────────────────│
     │                  │                  │ (webhook opcional)│
     │                  │                  │                   │
```

### Descrição dos passos

| # | Ator | Ação | Detalhes |
|:-:|------|------|---------|
| 1 | Cliente | Finaliza pedido | Clica em "Enviar Pedido" no checkout |
| 2 | Catálogo | Persiste pedido | Insere em `orders` + `order_items` no banco |
| 3 | Catálogo | Envia ao ERP | `POST {URL_BASE}/orders` com JSON do pedido |
| 4 | ERP | Processa | Valida, registra no sistema interno |
| 5 | ERP | Responde | Retorna sucesso + ID interno (opcional) |
| 6 | Catálogo | Atualiza registro | Salva `erp_order_id` e marca como sincronizado |
| 7 | Catálogo | Confirma ao cliente | Exibe tela de sucesso + abre WhatsApp |
| 8 | ERP | Webhook (opcional) | Notifica mudanças de status |

---

## Exemplos Completos

### Exemplo cURL — Simular envio do catálogo

```bash
# Simular o envio de pedido que o catálogo faz ao ERP
curl -X POST https://api.meuerp.com/v1/orders \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -H "X-Request-Id: req_$(uuidgen)" \
  -d '{
    "order": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "created_at": "2025-02-10T18:30:00Z",
      "customer": {
        "name": "Maria Santos",
        "phone": "5511988887777",
        "email": "maria@email.com",
        "cpf_cnpj": "123.456.789-00"
      },
      "payment_condition": "Boleto",
      "items": [
        {
          "code": "SKU-001",
          "name": "Camiseta Preta",
          "quantity": 3,
          "unit_price": 79.90,
          "subtotal": 239.70,
          "unit_of_measure": "UN",
          "brand": "Marca X"
        }
      ],
      "subtotal": 239.70,
      "shipping_fee": 0,
      "total": 239.70,
      "notes": ""
    }
  }'
```

### Exemplo Python — Implementar endpoint receptor no ERP

```python
from flask import Flask, request, jsonify
import os

app = Flask(__name__)
EXPECTED_TOKEN = os.environ.get("CATALOG_API_TOKEN", "meu_token_seguro")

@app.route("/v1/orders", methods=["POST"])
def receive_order():
    # 1. Validar token
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer ") or auth[7:] != EXPECTED_TOKEN:
        return jsonify({
            "success": False,
            "error": "Token de autenticação inválido"
        }), 401
    
    # 2. Extrair dados
    data = request.get_json()
    order = data.get("order", {})
    
    # 3. Validar campos obrigatórios
    if not order.get("id"):
        return jsonify({
            "success": False,
            "error": "Campo order.id é obrigatório"
        }), 400
    
    # 4. Verificar idempotência (evitar duplicatas)
    existing = db.query(
        "SELECT erp_id FROM pedidos WHERE catalog_id = %s",
        [order["id"]]
    )
    if existing:
        return jsonify({
            "success": True,
            "erp_order_id": existing["erp_id"],
            "message": "Pedido já processado anteriormente"
        }), 200
    
    # 5. Processar pedido
    try:
        erp_order_id = process_order(order)
        
        return jsonify({
            "success": True,
            "erp_order_id": erp_order_id,
            "message": "Pedido recebido com sucesso"
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

def process_order(order):
    """Lógica de processamento do pedido no ERP"""
    # Inserir no banco do ERP
    erp_id = db.insert("pedidos", {
        "catalog_id": order["id"],
        "cliente_nome": order["customer"]["name"],
        "cliente_telefone": order["customer"]["phone"],
        "cliente_cpf_cnpj": order["customer"].get("cpf_cnpj"),
        "total": order["total"],
        "observacoes": order.get("notes", ""),
        "data_pedido": order["created_at"],
    })
    
    # Inserir itens
    for item in order["items"]:
        db.insert("pedido_itens", {
            "pedido_id": erp_id,
            "codigo_produto": item["code"],
            "nome": item["name"],
            "quantidade": item["quantity"],
            "preco_unitario": item["unit_price"],
            "subtotal": item["subtotal"],
        })
    
    return f"PED-{erp_id}"

if __name__ == "__main__":
    app.run(port=5000)
```

### Exemplo Node.js — Implementar endpoint receptor

```javascript
const express = require("express");
const app = express();
app.use(express.json());

const EXPECTED_TOKEN = process.env.CATALOG_API_TOKEN || "meu_token_seguro";

app.post("/v1/orders", async (req, res) => {
  // 1. Validar token
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ") || auth.slice(7) !== EXPECTED_TOKEN) {
    return res.status(401).json({
      success: false,
      error: "Token de autenticação inválido"
    });
  }

  const { order } = req.body;

  // 2. Validar campos obrigatórios
  if (!order?.id) {
    return res.status(400).json({
      success: false,
      error: "Campo order.id é obrigatório"
    });
  }

  // 3. Verificar idempotência
  const existing = await db.query(
    "SELECT erp_id FROM pedidos WHERE catalog_id = $1",
    [order.id]
  );
  
  if (existing.rows.length > 0) {
    return res.json({
      success: true,
      erp_order_id: existing.rows[0].erp_id,
      message: "Pedido já processado anteriormente"
    });
  }

  // 4. Processar
  try {
    const erpOrderId = await processOrder(order);
    
    res.json({
      success: true,
      erp_order_id: erpOrderId,
      message: "Pedido recebido com sucesso"
    });
  } catch (err) {
    console.error("Erro ao processar pedido:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.listen(5000, () => console.log("ERP receptor rodando na porta 5000"));
```

---

## Troubleshooting

### Problemas comuns

| Problema | Causa provável | Solução |
|----------|---------------|---------|
| Pedidos não chegam ao ERP | Módulo "Enviar pedidos" desativado | Ativar em Admin → ERP |
| Erro 401 constante | Token errado ou expirado | Verificar token no painel admin e no ERP |
| Timeout nas requisições | ERP demora > 10s para responder | Otimizar processamento no ERP ou aumentar timeout |
| Pedidos duplicados | ERP não valida `order.id` | Implementar verificação de idempotência |
| Itens sem código | Produto cadastrado sem `code` no catálogo | Preencher código dos produtos |
| Campo `cpf_cnpj` como `null` | Cliente não preencheu CPF/CNPJ | Tratar `null` no ERP |
| `payment_condition` como `null` | Módulo de pagamento desativado | Tratar `null` no ERP |

### Logs e diagnóstico

O catálogo registra logs de cada tentativa de envio:

```
[INFO]  2025-02-10T18:30:01Z  Enviando pedido 550e8400... para https://api.meuerp.com/v1/orders
[INFO]  2025-02-10T18:30:02Z  Pedido 550e8400... enviado com sucesso (erp_id: PED-2025-001)
[ERROR] 2025-02-10T18:35:01Z  Falha ao enviar pedido abc12345...: HTTP 500 - Internal Server Error
[WARN]  2025-02-10T18:40:01Z  Retry 1/5 para pedido abc12345...
```

---

## Checklist para o ERP

### Implementação obrigatória

- [ ] Implementar endpoint `POST /orders` para receber pedidos
- [ ] Validar token de autenticação (`Authorization: Bearer <token>`)
- [ ] Retornar `{ "success": true }` com status HTTP 200 em caso de sucesso
- [ ] Retornar `{ "success": false, "error": "..." }` em caso de falha
- [ ] Implementar verificação de idempotência usando `order.id` como chave
- [ ] Tratar campos opcionais que podem ser `null` (`cpf_cnpj`, `payment_condition`, `notes`, `brand`, etc.)
- [ ] Responder em menos de 10 segundos

### Implementação recomendada

- [ ] Retornar `erp_order_id` na resposta para rastreamento cruzado
- [ ] Implementar webhook de status (`POST /erp-sync/orders/status`)
- [ ] Registrar logs de todos os pedidos recebidos
- [ ] Configurar alertas para falhas de recebimento
- [ ] Testar com pedidos de diferentes cenários (com/sem frete, CPF/CNPJ, etc.)
- [ ] Implementar HTTPS no endpoint receptor
