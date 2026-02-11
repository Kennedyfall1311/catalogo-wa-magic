# Documentação de Integração ERP → Catálogo

> Guia técnico para integrar qualquer ERP externo (Bling, Tiny, Omie, Sankhya, etc.) com o catálogo.

---

## Visão Geral

A integração é feita via **API REST** hospedada como backend functions. O ERP pode:

1. **Enviar** produtos, preços e estoque → Catálogo (POST/PUT)
2. **Consultar** pedidos realizados no catálogo → ERP (GET)

**Base URL:** `https://rglmtxjqbvfqiqixlidx.supabase.co/functions/v1`

**Autenticação:** Todas as requisições devem incluir o header:
```
Authorization: Bearer <ERP_API_TOKEN>
```
O token é configurado no painel admin em **ERP → Token de autenticação**.

---

## Endpoints

### 1. Produtos

#### `POST /erp-sync/products` — Criar ou atualizar produtos em lote

Cria novos produtos ou atualiza existentes (upsert por `code`).

**Request:**
```json
{
  "products": [
    {
      "code": "SKU-001",
      "name": "Camiseta Básica Preta",
      "slug": "camiseta-basica-preta",
      "price": 79.90,
      "original_price": 99.90,
      "description": "Camiseta 100% algodão",
      "category_slug": "roupas",
      "image_url": "https://cdn.exemplo.com/img/sku001.jpg",
      "active": true
    },
    {
      "code": "SKU-002",
      "name": "Tênis Runner Pro",
      "slug": "tenis-runner-pro",
      "price": 299.90,
      "original_price": null,
      "description": "Tênis para corrida com amortecimento",
      "category_slug": "calcados",
      "image_url": "https://cdn.exemplo.com/img/sku002.jpg",
      "active": true
    }
  ]
}
```

**Campos:**

| Campo            | Tipo     | Obrigatório | Descrição                                      |
|------------------|----------|-------------|-------------------------------------------------|
| `code`           | string   | ✅ Sim       | Código único do produto no ERP (chave de upsert)|
| `name`           | string   | ✅ Sim       | Nome do produto                                 |
| `slug`           | string   | ✅ Sim       | URL amigável (sem espaços, lowercase)            |
| `price`          | number   | ✅ Sim       | Preço de venda atual                             |
| `original_price` | number   | ❌ Não       | Preço original (para mostrar desconto)           |
| `description`    | string   | ❌ Não       | Descrição do produto                             |
| `category_slug`  | string   | ❌ Não       | Slug da categoria (deve existir previamente)     |
| `image_url`      | string   | ❌ Não       | URL pública da imagem do produto                 |
| `active`         | boolean  | ❌ Não       | Se o produto está visível (default: `true`)      |

**Response (200):**
```json
{
  "success": true,
  "synced": 2,
  "errors": []
}
```

**Response com erros parciais (207):**
```json
{
  "success": false,
  "synced": 1,
  "errors": [
    { "code": "SKU-002", "error": "Categoria 'calcados' não encontrada" }
  ]
}
```

---

#### `GET /erp-sync/products` — Listar todos os produtos do catálogo

Retorna todos os produtos cadastrados no catálogo.

**Query params (opcionais):**

| Param      | Tipo    | Descrição                              |
|------------|---------|----------------------------------------|
| `active`   | boolean | Filtrar por status ativo/inativo       |
| `category` | string  | Filtrar por slug da categoria          |
| `page`     | number  | Página (default: 1)                    |
| `limit`    | number  | Itens por página (default: 100, max: 500) |

**Request:**
```
GET /erp-sync/products?active=true&limit=50
```

**Response (200):**
```json
{
  "products": [
    {
      "id": "uuid-...",
      "code": "SKU-001",
      "name": "Camiseta Básica Preta",
      "slug": "camiseta-basica-preta",
      "price": 79.90,
      "original_price": 99.90,
      "description": "Camiseta 100% algodão",
      "category_id": "uuid-...",
      "category_slug": "roupas",
      "image_url": "https://...",
      "active": true,
      "created_at": "2025-01-15T10:00:00Z",
      "updated_at": "2025-02-10T14:30:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 50
}
```

---

### 2. Estoque

#### `POST /erp-sync/stock` — Atualizar estoque em lote

Atualiza a quantidade em estoque dos produtos pelo código.

> **Nota:** Requer a coluna `stock_quantity` na tabela `products` (será criada na ativação do módulo de estoque).

**Request:**
```json
{
  "items": [
    { "code": "SKU-001", "quantity": 45 },
    { "code": "SKU-002", "quantity": 0 },
    { "code": "SKU-003", "quantity": 120 }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "updated": 3,
  "errors": []
}
```

---

### 3. Categorias

#### `GET /erp-sync/categories` — Listar categorias

**Response (200):**
```json
{
  "categories": [
    { "id": "uuid-...", "name": "Roupas", "slug": "roupas" },
    { "id": "uuid-...", "name": "Calçados", "slug": "calcados" },
    { "id": "uuid-...", "name": "Acessórios", "slug": "acessorios" }
  ]
}
```

#### `POST /erp-sync/categories` — Criar categorias

**Request:**
```json
{
  "categories": [
    { "name": "Eletrônicos", "slug": "eletronicos" },
    { "name": "Casa e Jardim", "slug": "casa-e-jardim" }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "created": 2
}
```

---

### 4. Pedidos

#### `GET /erp-sync/orders` — Consultar pedidos do catálogo

O ERP pode buscar os pedidos realizados no catálogo para processamento.

**Query params (opcionais):**

| Param    | Tipo   | Descrição                                  |
|----------|--------|--------------------------------------------|
| `status` | string | Filtrar por status (`pending`, `synced`)    |
| `since`  | string | Data ISO 8601 — pedidos a partir de        |
| `limit`  | number | Itens por página (default: 50, max: 200)   |

**Request:**
```
GET /erp-sync/orders?status=pending&since=2025-02-01T00:00:00Z
```

**Response (200):**
```json
{
  "orders": [
    {
      "id": "uuid-...",
      "created_at": "2025-02-10T18:30:00Z",
      "status": "pending",
      "customer": {
        "name": "João Silva",
        "phone": "5511999999999",
        "email": "joao@email.com"
      },
      "payment_condition": "Cartão 3x",
      "items": [
        {
          "product_code": "SKU-001",
          "product_name": "Camiseta Básica Preta",
          "quantity": 2,
          "unit_price": 79.90,
          "subtotal": 159.80
        }
      ],
      "total": 159.80,
      "notes": "Entregar no período da tarde"
    }
  ],
  "total": 12,
  "page": 1
}
```

#### `POST /erp-sync/orders/confirm` — Confirmar recebimento de pedidos

Após o ERP processar os pedidos, ele confirma o recebimento para que não sejam enviados novamente.

**Request:**
```json
{
  "order_ids": ["uuid-1", "uuid-2", "uuid-3"]
}
```

**Response (200):**
```json
{
  "success": true,
  "confirmed": 3
}
```

---

## Códigos de Erro

| Código | Significado                                  |
|--------|----------------------------------------------|
| 200    | Sucesso                                      |
| 201    | Criado com sucesso                           |
| 207    | Sucesso parcial (alguns itens com erro)      |
| 400    | Requisição inválida (campos faltando/errados)|
| 401    | Token inválido ou ausente                    |
| 404    | Recurso não encontrado                       |
| 429    | Muitas requisições (rate limit)              |
| 500    | Erro interno do servidor                     |

**Formato de erro:**
```json
{
  "error": "Token de autenticação inválido",
  "code": "UNAUTHORIZED"
}
```

---

## Fluxo Recomendado de Integração

```
┌─────────────┐          ┌──────────────────┐
│    ERP      │          │    Catálogo       │
│             │          │                   │
│  1. POST ───┼─────────▶│ /products (upsert)│
│  2. POST ───┼─────────▶│ /stock (update)   │
│  3. GET  ◀──┼──────────│ /orders (pending) │
│  4. POST ───┼─────────▶│ /orders/confirm   │
└─────────────┘          └──────────────────┘
```

**Frequência sugerida:**
- Produtos e preços: a cada **6 horas** ou sob demanda
- Estoque: a cada **30 minutos** (ou via webhook)
- Pedidos: a cada **5 minutos** ou via webhook

---

## Exemplo cURL

```bash
# Sincronizar produtos
curl -X POST https://rglmtxjqbvfqiqixlidx.supabase.co/functions/v1/erp-sync/products \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "products": [
      {
        "code": "SKU-001",
        "name": "Camiseta Preta",
        "slug": "camiseta-preta",
        "price": 79.90
      }
    ]
  }'

# Buscar pedidos pendentes
curl -X GET "https://rglmtxjqbvfqiqixlidx.supabase.co/functions/v1/erp-sync/orders?status=pending" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

---

## Próximos Passos

1. Configure a URL e o Token no painel admin (aba **ERP**)
2. Crie as categorias necessárias via API ou painel admin
3. Envie os produtos via `POST /erp-sync/products`
4. Ative o módulo de estoque se necessário
5. Configure a consulta periódica de pedidos no ERP
