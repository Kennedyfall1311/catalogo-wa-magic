# Documentação de Integração ERP → Catálogo

> Guia técnico completo para integrar qualquer ERP externo (Bling, Tiny, Omie, Sankhya, TOTVS, SAP, etc.) com o catálogo via API REST.

---

## Sumário

1. [Visão Geral](#visão-geral)
2. [Arquitetura e Fluxo de Dados](#arquitetura-e-fluxo-de-dados)
3. [Autenticação](#autenticação)
4. [Endpoints de Produtos](#1-produtos)
5. [Endpoints de Estoque](#2-estoque)
6. [Endpoints de Categorias](#3-categorias)
7. [Endpoints de Pedidos](#4-pedidos)
8. [Códigos de Erro](#códigos-de-erro)
9. [Rate Limiting e Limites](#rate-limiting-e-limites)
10. [Fluxo Recomendado de Integração](#fluxo-recomendado-de-integração)
11. [Exemplos Completos](#exemplos-completos)
12. [Glossário](#glossário)
13. [FAQ — Perguntas Frequentes](#faq--perguntas-frequentes)
14. [Checklist de Implementação](#checklist-de-implementação)

---

## Visão Geral

A integração é feita via **API REST** hospedada como backend functions. O ERP pode:

1. **Enviar** produtos, preços e estoque → Catálogo (POST/PUT)
2. **Consultar** pedidos realizados no catálogo → ERP (GET)
3. **Enviar** imagens de produtos → Catálogo (POST)
4. **Gerenciar** categorias → Catálogo (POST/GET)

**Base URL:**

| Ambiente | URL |
|----------|-----|
| **Produção (Cloud)** | `https://rglmtxjqbvfqiqixlidx.supabase.co/functions/v1` |
| **Desenvolvimento (Local)** | `http://localhost:3001/api` |

**Autenticação:** Todas as requisições devem incluir o header:
```
Authorization: Bearer <ERP_API_TOKEN>
Content-Type: application/json
```
O token é configurado no painel admin em **ERP → Token de autenticação**.

### Compatibilidade com ERPs

| ERP | Status | Observações |
|-----|:------:|-------------|
| **Bling** | ✅ Compatível | Usar webhook de produtos para disparo automático |
| **Tiny** | ✅ Compatível | Suporta exportação JSON nativa |
| **Omie** | ✅ Compatível | Configurar via API de integração do Omie |
| **Sankhya** | ✅ Compatível | Requer middleware para conversão de formatos |
| **TOTVS Protheus** | ✅ Compatível | Usar Web Services REST |
| **SAP Business One** | ✅ Compatível | Via Service Layer REST |
| **Firebird customizado** | ✅ Compatível | Requer script de extração personalizado |
| **Outro ERP** | ✅ Compatível | Qualquer sistema que faça HTTP POST com JSON |

> **Princípio:** A API é **agnóstica** — não conhece e não depende de nenhum ERP específico. Qualquer sistema que envie JSON via HTTP é compatível.

---

## Arquitetura e Fluxo de Dados

### Diagrama de arquitetura

```
┌─────────────────────────────┐
│          ERP EXTERNO         │
│  (Bling, Tiny, Omie, etc.)  │
│                             │
│  ┌────────────────────────┐ │
│  │ Script de sincronização│ │
│  │ (cron / webhook / manual│ │
│  └──────────┬─────────────┘ │
└─────────────┼───────────────┘
              │
              │  HTTP POST/GET
              │  (JSON + Bearer Token)
              │
              ▼
┌─────────────────────────────┐
│       API REST (Backend)     │
│                             │
│  ┌─────────────────────────┐│
│  │ Validação de Token      ││
│  │ Validação de Payload    ││
│  │ Upsert no Banco         ││
│  │ Resposta padronizada    ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │ PostgreSQL (dados)      ││
│  │ Storage (imagens)       ││
│  └─────────────────────────┘│
└─────────────┬───────────────┘
              │
              │  Realtime (WebSocket)
              │  ou Polling (REST)
              │
              ▼
┌─────────────────────────────┐
│       SITE WEB (Frontend)    │
│   React + Vite + Tailwind    │
│                             │
│  Exibe catálogo atualizado   │
│  automaticamente             │
└─────────────────────────────┘
```

### Fluxo de comunicação detalhado

| Passo | Origem | Destino | Ação | Protocolo |
|:-----:|--------|---------|------|-----------|
| 1 | ERP | API | Envia produtos/preços/estoque | HTTP POST (JSON) |
| 2 | API | Banco | Valida e persiste dados | SQL (upsert) |
| 3 | Banco | Frontend | Notifica alteração | WebSocket (Realtime) |
| 4 | Frontend | — | Re-renderiza catálogo | Automático |
| 5 | ERP | API | Consulta pedidos | HTTP GET |
| 6 | ERP | API | Confirma processamento | HTTP POST |

---

## Autenticação

### Configuração do Token

1. Acesse o painel administrativo do catálogo
2. Navegue até a aba **ERP**
3. No campo **Token de autenticação**, insira um token seguro
4. Clique em **Salvar**

### Formato do Header

```http
GET /erp-sync/products HTTP/1.1
Host: rglmtxjqbvfqiqixlidx.supabase.co
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
Accept: application/json
```

### Erros de Autenticação

| Cenário | Status | Resposta |
|---------|:------:|----------|
| Token ausente | `401` | `{ "error": "Token de autenticação ausente", "code": "UNAUTHORIZED" }` |
| Token inválido | `401` | `{ "error": "Token de autenticação inválido", "code": "UNAUTHORIZED" }` |
| Token expirado | `401` | `{ "error": "Token de autenticação expirado", "code": "TOKEN_EXPIRED" }` |

### Boas práticas de segurança

- Use tokens com pelo menos **32 caracteres** alfanuméricos
- **Não compartilhe** o token em repositórios públicos
- **Rotacione** o token periodicamente (a cada 90 dias recomendado)
- Armazene o token em **variáveis de ambiente** no ERP, nunca no código-fonte
- Use **HTTPS** em produção (obrigatório)

---

## Endpoints

### 1. Produtos

#### `POST /erp-sync/products` — Criar ou atualizar produtos em lote

Cria novos produtos ou atualiza existentes (upsert por `code`). Este é o **endpoint principal** de sincronização.

**Comportamento de upsert:**
- Se o `code` **não existe** no catálogo → **cria** o produto
- Se o `code` **já existe** → **atualiza** os campos enviados
- Campos opcionais com `null` → **preserva** o valor atual (não sobrescreve)
- `image_url` com valor `/placeholder.svg` → **preserva** a imagem atual

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
      "description": "Camiseta 100% algodão, gola redonda, disponível em P, M, G, GG.",
      "category_slug": "roupas",
      "image_url": "https://cdn.exemplo.com/img/sku001.jpg",
      "active": true,
      "brand": "Marca Premium",
      "reference": "REF-2025-001",
      "manufacturer_code": "MFR-CAM-001",
      "unit_of_measure": "UN",
      "quantity": 150
    },
    {
      "code": "SKU-002",
      "name": "Tênis Runner Pro",
      "slug": "tenis-runner-pro",
      "price": 299.90,
      "original_price": null,
      "description": "Tênis para corrida com amortecimento em gel, cabedal em mesh respirável.",
      "category_slug": "calcados",
      "image_url": "https://cdn.exemplo.com/img/sku002.jpg",
      "active": true,
      "brand": "SportLine",
      "reference": "REF-2025-002",
      "manufacturer_code": "MFR-TEN-002",
      "unit_of_measure": "PAR",
      "quantity": 35
    }
  ]
}
```

**Campos detalhados:**

| Campo | Tipo | Obrigatório | Tamanho máx. | Descrição | Exemplo |
|-------|------|:-----------:|:------------:|-----------|---------|
| `code` | string | ✅ Sim | 100 chars | Código único do produto no ERP. **Chave de upsert.** Não pode conter espaços no início/fim. | `"SKU-001"` |
| `name` | string | ✅ Sim | 255 chars | Nome de exibição do produto no catálogo | `"Camiseta Básica Preta"` |
| `slug` | string | ✅ Sim | 255 chars | URL amigável. Lowercase, sem espaços, hifenizado. Deve ser único. | `"camiseta-basica-preta"` |
| `price` | number | ✅ Sim | — | Preço de venda atual em reais (BRL). Deve ser > 0. Até 2 casas decimais. | `79.90` |
| `original_price` | number \| null | ❌ Não | — | Preço original/anterior. Quando preenchido, o frontend exibe o desconto. `null` para produtos sem promoção. | `99.90` |
| `description` | string | ❌ Não | 5000 chars | Descrição do produto. Aceita texto simples. Default: `""` (vazio) | `"Camiseta 100% algodão"` |
| `category_slug` | string | ❌ Não | 100 chars | Slug da categoria. A categoria **deve existir previamente** no catálogo. Se não existir, o produto é criado sem categoria. | `"roupas"` |
| `image_url` | string | ❌ Não | 2048 chars | URL pública e acessível da imagem do produto. Formatos: JPEG, PNG, WebP, GIF. Default: placeholder SVG. | `"https://cdn.exemplo.com/img/sku001.jpg"` |
| `active` | boolean | ❌ Não | — | Define se o produto é visível no catálogo público. Default: `true`. Use `false` para ocultar temporariamente. | `true` |
| `brand` | string \| null | ❌ Não | 100 chars | Marca/fabricante do produto. Usado no filtro de marcas do catálogo. | `"Marca Premium"` |
| `reference` | string \| null | ❌ Não | 100 chars | Código de referência auxiliar (referência interna, NCM, etc.) | `"REF-2025-001"` |
| `manufacturer_code` | string \| null | ❌ Não | 100 chars | Código do produto no fabricante/fornecedor | `"MFR-CAM-001"` |
| `unit_of_measure` | string \| null | ❌ Não | 20 chars | Unidade de medida: UN (unidade), KG (quilo), CX (caixa), PAR, MT (metro), LT (litro), etc. | `"UN"` |
| `quantity` | number \| null | ❌ Não | — | Quantidade em estoque. `null` = estoque não controlado. `0` = sem estoque (mas produto visível). | `150` |

**Geração automática de slug:**

Se o ERP não gera slugs, use esta lógica:
```
Nome: "Camiseta Básica Preta 100% Algodão"
Slug: "camiseta-basica-preta-100-algodao"

Regras:
1. Converter para minúsculas
2. Remover acentos (á→a, ê→e, ç→c)
3. Substituir espaços e caracteres especiais por hífens
4. Remover hífens duplicados
5. Remover hífens no início e fim
```

**Response — Sucesso total (200):**
```json
{
  "success": true,
  "synced": 2,
  "errors": []
}
```

**Response — Sucesso parcial (207):**
```json
{
  "success": false,
  "synced": 1,
  "errors": [
    {
      "code": "SKU-002",
      "error": "Categoria 'calcados' não encontrada",
      "field": "category_slug"
    }
  ]
}
```

**Response — Erro de validação (400):**
```json
{
  "error": "O campo 'products' é obrigatório e deve ser um array não vazio",
  "code": "VALIDATION_ERROR"
}
```

---

#### `GET /erp-sync/products` — Listar todos os produtos do catálogo

Retorna todos os produtos cadastrados no catálogo com paginação.

**Query params (opcionais):**

| Param | Tipo | Default | Descrição | Exemplo |
|-------|------|---------|-----------|---------|
| `active` | boolean | — | Filtrar por status ativo/inativo | `?active=true` |
| `category` | string | — | Filtrar por slug da categoria | `?category=roupas` |
| `brand` | string | — | Filtrar por marca | `?brand=Marca%20Premium` |
| `search` | string | — | Busca textual por nome ou código | `?search=camiseta` |
| `page` | number | 1 | Número da página (1-indexed) | `?page=2` |
| `limit` | number | 100 | Itens por página (máx: 500) | `?limit=50` |
| `updated_since` | string (ISO 8601) | — | Produtos atualizados desde a data informada | `?updated_since=2025-02-01T00:00:00Z` |

**Request:**
```http
GET /erp-sync/products?active=true&limit=50&page=1
Authorization: Bearer SEU_TOKEN
```

**Response (200):**
```json
{
  "products": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "code": "SKU-001",
      "name": "Camiseta Básica Preta",
      "slug": "camiseta-basica-preta",
      "price": 79.90,
      "original_price": 99.90,
      "description": "Camiseta 100% algodão",
      "category_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "category_slug": "roupas",
      "image_url": "https://storage.exemplo.com/uploads/a1b2c3d4.jpg",
      "active": true,
      "brand": "Marca Premium",
      "reference": "REF-2025-001",
      "manufacturer_code": "MFR-CAM-001",
      "unit_of_measure": "UN",
      "quantity": 150,
      "created_at": "2025-01-15T10:00:00Z",
      "updated_at": "2025-02-10T14:30:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 50,
  "total_pages": 3
}
```

---

### 2. Estoque

#### `POST /erp-sync/stock` — Atualizar estoque em lote

Atualiza a quantidade em estoque dos produtos pelo código. Ideal para sincronizações frequentes (a cada 15-30 min).

> **Nota:** Requer a coluna `quantity` na tabela `products` (já existente por padrão).

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

**Campos:**

| Campo | Tipo | Obrigatório | Descrição | Exemplo |
|-------|------|:-----------:|-----------|---------|
| `code` | string | ✅ Sim | Código do produto no ERP | `"SKU-001"` |
| `quantity` | number | ✅ Sim | Quantidade em estoque. `0` = sem estoque. Valores negativos não são aceitos. | `45` |

**Response — Sucesso (200):**
```json
{
  "success": true,
  "updated": 3,
  "errors": []
}
```

**Response — Sucesso parcial (207):**
```json
{
  "success": false,
  "updated": 2,
  "errors": [
    {
      "code": "SKU-999",
      "error": "Produto não encontrado"
    }
  ]
}
```

**Comportamento com quantidade zero:**

| Quantidade | Comportamento no catálogo |
|:----------:|--------------------------|
| `> 0` | Produto visível normalmente |
| `= 0` | Produto visível, mas pode exibir "Sem estoque" (configurável) |
| `null` | Estoque não controlado — produto sempre visível |

---

### 3. Categorias

#### `GET /erp-sync/categories` — Listar categorias

Retorna todas as categorias cadastradas no catálogo.

**Response (200):**
```json
{
  "categories": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Roupas",
      "slug": "roupas",
      "created_at": "2025-01-10T08:00:00Z"
    },
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "name": "Calçados",
      "slug": "calcados",
      "created_at": "2025-01-10T08:00:00Z"
    },
    {
      "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
      "name": "Acessórios",
      "slug": "acessorios",
      "created_at": "2025-01-10T08:00:00Z"
    }
  ]
}
```

#### `POST /erp-sync/categories` — Criar categorias em lote

Cria novas categorias. Categorias com `slug` duplicado são ignoradas automaticamente.

**Request:**
```json
{
  "categories": [
    { "name": "Eletrônicos", "slug": "eletronicos" },
    { "name": "Casa e Jardim", "slug": "casa-e-jardim" }
  ]
}
```

**Campos:**

| Campo | Tipo | Obrigatório | Descrição | Exemplo |
|-------|------|:-----------:|-----------|---------|
| `name` | string | ✅ Sim | Nome de exibição da categoria | `"Eletrônicos"` |
| `slug` | string | ✅ Sim | Identificador URL-friendly. Unique. Lowercase, sem espaços, hifenizado. | `"eletronicos"` |

**Response — Sucesso (201):**
```json
{
  "success": true,
  "created": 2,
  "skipped": 0
}
```

**Response — Com duplicatas (200):**
```json
{
  "success": true,
  "created": 1,
  "skipped": 1,
  "skipped_slugs": ["eletronicos"]
}
```

---

### 4. Pedidos

#### `GET /erp-sync/orders` — Consultar pedidos do catálogo

O ERP pode buscar os pedidos realizados no catálogo para processamento interno.

**Query params (opcionais):**

| Param | Tipo | Default | Descrição | Exemplo |
|-------|------|---------|-----------|---------|
| `status` | string | — | Filtrar por status: `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled` | `?status=pending` |
| `since` | string (ISO 8601) | — | Pedidos criados a partir desta data | `?since=2025-02-01T00:00:00Z` |
| `until` | string (ISO 8601) | — | Pedidos criados até esta data | `?until=2025-02-28T23:59:59Z` |
| `limit` | number | 50 | Itens por página (máx: 200) | `?limit=100` |
| `page` | number | 1 | Número da página | `?page=2` |

**Request:**
```http
GET /erp-sync/orders?status=pending&since=2025-02-01T00:00:00Z
Authorization: Bearer SEU_TOKEN
```

**Response (200):**
```json
{
  "orders": [
    {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "created_at": "2025-02-10T18:30:00Z",
      "updated_at": "2025-02-10T18:30:00Z",
      "status": "pending",
      "customer": {
        "name": "João Silva",
        "phone": "5511999999999",
        "email": "joao@email.com",
        "cpf_cnpj": "123.456.789-00"
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
      "subtotal": 159.80,
      "shipping_fee": 15.00,
      "total": 174.80,
      "notes": "Entregar no período da tarde"
    }
  ],
  "total": 12,
  "page": 1,
  "total_pages": 1
}
```

**Campos do pedido:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | string (UUID) | Identificador único do pedido |
| `created_at` | string (ISO 8601) | Data/hora de criação do pedido |
| `updated_at` | string (ISO 8601) | Data/hora da última atualização |
| `status` | string | Status atual: `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled` |
| `customer.name` | string | Nome completo do cliente |
| `customer.phone` | string | Telefone com DDD |
| `customer.email` | string | E-mail (pode ser vazio) |
| `customer.cpf_cnpj` | string \| null | CPF ou CNPJ formatado |
| `payment_condition` | string \| null | Condição de pagamento selecionada |
| `items[].product_code` | string | Código do produto no ERP |
| `items[].product_name` | string | Nome do produto (snapshot no momento da compra) |
| `items[].quantity` | number | Quantidade comprada |
| `items[].unit_price` | number | Preço unitário no momento da compra |
| `items[].subtotal` | number | Subtotal da linha (quantity × unit_price) |
| `subtotal` | number | Soma dos subtotais dos itens |
| `shipping_fee` | number | Taxa de frete |
| `total` | number | Valor total do pedido (subtotal + shipping_fee) |
| `notes` | string \| null | Observações do cliente |

#### `POST /erp-sync/orders/confirm` — Confirmar recebimento de pedidos

Após o ERP processar os pedidos, ele confirma o recebimento para que o status seja atualizado e não sejam enviados novamente como `pending`.

**Request:**
```json
{
  "order_ids": [
    "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "b2c3d4e5-f6a7-8901-bcde-f12345678901"
  ]
}
```

**Response — Sucesso (200):**
```json
{
  "success": true,
  "confirmed": 3
}
```

**Response — Parcial (207):**
```json
{
  "success": false,
  "confirmed": 2,
  "errors": [
    {
      "order_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "error": "Pedido não encontrado"
    }
  ]
}
```

---

## Códigos de Erro

### Tabela completa de códigos HTTP

| Código | Significado | Quando ocorre | Ação recomendada |
|:------:|-------------|---------------|------------------|
| `200` | Sucesso | Operação realizada com sucesso | Prosseguir normalmente |
| `201` | Criado | Recurso(s) criado(s) com sucesso | Prosseguir normalmente |
| `207` | Sucesso parcial | Alguns itens do lote falharam | Verificar campo `errors` e reenviar itens com falha |
| `400` | Requisição inválida | Campos faltando, formato errado, payload inválido | Corrigir o payload e reenviar |
| `401` | Não autorizado | Token ausente, inválido ou expirado | Verificar token no painel admin |
| `404` | Não encontrado | Recurso solicitado não existe | Verificar IDs e códigos |
| `413` | Payload muito grande | Lote excede o limite de tamanho | Dividir em lotes menores |
| `429` | Muitas requisições | Rate limit excedido | Aguardar e reenviar com backoff |
| `500` | Erro interno | Falha inesperada no servidor | Reportar ao suporte; reenviar após 5 min |

### Formato padrão de erro

```json
{
  "error": "Mensagem descritiva legível por humanos",
  "code": "VALIDATION_ERROR",
  "timestamp": "2025-02-10T14:30:00Z",
  "details": [
    {
      "field": "products[0].price",
      "message": "Deve ser um número maior que 0"
    }
  ]
}
```

### Códigos de erro internos

| Código interno | Descrição |
|---------------|-----------|
| `VALIDATION_ERROR` | Dados do payload inválidos ou incompletos |
| `UNAUTHORIZED` | Falha na autenticação |
| `TOKEN_EXPIRED` | Token de autenticação expirado |
| `NOT_FOUND` | Recurso solicitado não existe |
| `DUPLICATE_CODE` | Código de produto duplicado em conflito |
| `CATEGORY_NOT_FOUND` | Categoria referenciada não existe |
| `PRODUCT_NOT_FOUND` | Produto referenciado não existe |
| `RATE_LIMITED` | Excedeu o limite de requisições |
| `PAYLOAD_TOO_LARGE` | Payload excede o tamanho máximo |
| `INTERNAL_ERROR` | Erro interno inesperado |

---

## Rate Limiting e Limites

### Limites de requisição

| Recurso | Limite | Observação |
|---------|--------|------------|
| Requisições por minuto | **60** | Por token de autenticação |
| Produtos por lote (`POST /products`) | **500** | Recomendado: 100-200 para melhor performance |
| Itens de estoque por lote (`POST /stock`) | **1000** | Payload leve, aceita mais itens |
| Imagens por lote (`POST /images`) | **50** | Limitado pelo tamanho do payload |
| Tamanho máximo do payload | **50 MB** | Principalmente relevante para imagens Base64 |
| Timeout por requisição | **30 segundos** | Lotes muito grandes podem exceder |

### Estratégia de retry recomendada

```
Tentativa 1: imediata
Tentativa 2: aguardar 2 segundos
Tentativa 3: aguardar 5 segundos
Tentativa 4: aguardar 15 segundos
Tentativa 5: aguardar 60 segundos
Após 5 tentativas: logar erro e alertar operador
```

### Headers de rate limit na resposta

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1707580800
```

---

## Fluxo Recomendado de Integração

### Diagrama do fluxo

```
┌─────────────┐          ┌──────────────────┐
│    ERP      │          │    Catálogo       │
│             │          │                   │
│  1. POST ───┼─────────▶│ /categories       │  ← Criar categorias primeiro
│  2. POST ───┼─────────▶│ /products (upsert)│  ← Depois os produtos
│  3. POST ───┼─────────▶│ /images/sync      │  ← Depois as imagens
│  4. POST ───┼─────────▶│ /stock (update)   │  ← Estoque separado (mais frequente)
│  5. GET  ◀──┼──────────│ /orders (pending) │  ← Consultar pedidos
│  6. POST ───┼─────────▶│ /orders/confirm   │  ← Confirmar processamento
└─────────────┘          └──────────────────┘
```

### Sequência obrigatória na primeira sincronização

| Ordem | Endpoint | Motivo |
|:-----:|----------|--------|
| 1º | `POST /categories` | Categorias devem existir antes dos produtos |
| 2º | `POST /products` | Produtos devem existir antes das imagens |
| 3º | `POST /images/sync` | Imagens são associadas via código do produto |
| 4º | `POST /stock` | (Opcional) Pode ser enviado junto com o produto |

### Frequência sugerida por tipo de dado

| Dado | Frequência | Método | Justificativa |
|------|-----------|--------|---------------|
| **Categorias** | Sob demanda | Manual/webhook | Raramente muda |
| **Produtos e preços** | A cada **1–6 horas** | Cron/scheduler | Equilibra atualização e carga |
| **Estoque** | A cada **15–30 minutos** | Cron/webhook | Movimentações frequentes |
| **Imagens** | Sob demanda ou **1x ao dia** | Cron/manual | Volumes grandes, mudanças raras |
| **Pedidos (consulta)** | A cada **5 minutos** | Cron/polling | Agilidade no processamento |

---

## Exemplos Completos

### Exemplo 1: Sincronização completa (Bash/cURL)

```bash
#!/bin/bash
# Script de sincronização completa ERP → Catálogo

BASE_URL="https://rglmtxjqbvfqiqixlidx.supabase.co/functions/v1"
TOKEN="SEU_TOKEN_AQUI"
HEADERS=(-H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json")

echo "=== 1. Criando categorias ==="
curl -s -X POST "$BASE_URL/erp-sync/categories" \
  "${HEADERS[@]}" \
  -d '{
    "categories": [
      { "name": "Roupas", "slug": "roupas" },
      { "name": "Calçados", "slug": "calcados" },
      { "name": "Acessórios", "slug": "acessorios" }
    ]
  }' | jq .

echo ""
echo "=== 2. Sincronizando produtos ==="
curl -s -X POST "$BASE_URL/erp-sync/products" \
  "${HEADERS[@]}" \
  -d '{
    "products": [
      {
        "code": "SKU-001",
        "name": "Camiseta Preta",
        "slug": "camiseta-preta",
        "price": 79.90,
        "original_price": 99.90,
        "category_slug": "roupas",
        "brand": "Marca X",
        "active": true
      },
      {
        "code": "SKU-002",
        "name": "Tênis Runner Pro",
        "slug": "tenis-runner-pro",
        "price": 299.90,
        "category_slug": "calcados",
        "brand": "SportLine",
        "unit_of_measure": "PAR",
        "quantity": 25,
        "active": true
      }
    ]
  }' | jq .

echo ""
echo "=== 3. Buscando pedidos pendentes ==="
curl -s -X GET "$BASE_URL/erp-sync/orders?status=pending" \
  "${HEADERS[@]}" | jq .
```

### Exemplo 2: Sincronização em Python

```python
import requests
import json
from datetime import datetime

BASE_URL = "https://rglmtxjqbvfqiqixlidx.supabase.co/functions/v1"
TOKEN = "SEU_TOKEN_AQUI"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

def sync_products(products: list):
    """Sincroniza produtos em lotes de 200"""
    batch_size = 200
    total_synced = 0
    total_errors = []
    
    for i in range(0, len(products), batch_size):
        batch = products[i:i + batch_size]
        
        response = requests.post(
            f"{BASE_URL}/erp-sync/products",
            headers=headers,
            json={"products": batch},
            timeout=30
        )
        
        result = response.json()
        total_synced += result.get("synced", 0)
        total_errors.extend(result.get("errors", []))
        
        print(f"Lote {i // batch_size + 1}: "
              f"sincronizados={result.get('synced', 0)}, "
              f"erros={len(result.get('errors', []))}")
    
    return {"synced": total_synced, "errors": total_errors}

def fetch_pending_orders():
    """Busca pedidos pendentes"""
    response = requests.get(
        f"{BASE_URL}/erp-sync/orders",
        headers=headers,
        params={"status": "pending"},
        timeout=15
    )
    return response.json().get("orders", [])

def confirm_orders(order_ids: list):
    """Confirma processamento dos pedidos"""
    response = requests.post(
        f"{BASE_URL}/erp-sync/orders/confirm",
        headers=headers,
        json={"order_ids": order_ids},
        timeout=15
    )
    return response.json()

# Uso
if __name__ == "__main__":
    # 1. Sincronizar produtos
    products = [
        {
            "code": "SKU-001",
            "name": "Camiseta Preta",
            "slug": "camiseta-preta",
            "price": 79.90,
            "active": True
        }
    ]
    result = sync_products(products)
    print(f"Total sincronizado: {result['synced']}")
    
    # 2. Buscar pedidos
    orders = fetch_pending_orders()
    print(f"Pedidos pendentes: {len(orders)}")
    
    # 3. Confirmar pedidos
    if orders:
        ids = [o["id"] for o in orders]
        confirm_orders(ids)
        print(f"Pedidos confirmados: {len(ids)}")
```

### Exemplo 3: Sincronização em Node.js

```javascript
const BASE_URL = "https://rglmtxjqbvfqiqixlidx.supabase.co/functions/v1";
const TOKEN = "SEU_TOKEN_AQUI";

const headers = {
  "Authorization": `Bearer ${TOKEN}`,
  "Content-Type": "application/json"
};

async function syncProducts(products) {
  const batchSize = 200;
  let totalSynced = 0;
  const allErrors = [];

  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    
    const response = await fetch(`${BASE_URL}/erp-sync/products`, {
      method: "POST",
      headers,
      body: JSON.stringify({ products: batch })
    });

    const result = await response.json();
    totalSynced += result.synced || 0;
    allErrors.push(...(result.errors || []));
    
    console.log(`Lote ${Math.floor(i / batchSize) + 1}: ` +
      `sync=${result.synced}, erros=${(result.errors || []).length}`);
    
    // Intervalo entre lotes
    await new Promise(r => setTimeout(r, 1000));
  }

  return { synced: totalSynced, errors: allErrors };
}

async function fetchPendingOrders() {
  const response = await fetch(
    `${BASE_URL}/erp-sync/orders?status=pending`,
    { headers }
  );
  const data = await response.json();
  return data.orders || [];
}

async function confirmOrders(orderIds) {
  const response = await fetch(`${BASE_URL}/erp-sync/orders/confirm`, {
    method: "POST",
    headers,
    body: JSON.stringify({ order_ids: orderIds })
  });
  return response.json();
}

// Uso
(async () => {
  const result = await syncProducts([
    { code: "SKU-001", name: "Camiseta", slug: "camiseta", price: 79.90 }
  ]);
  console.log("Sincronizado:", result.synced);
  
  const orders = await fetchPendingOrders();
  console.log("Pedidos pendentes:", orders.length);
  
  if (orders.length > 0) {
    await confirmOrders(orders.map(o => o.id));
  }
})();
```

---

## Glossário

| Termo | Definição |
|-------|-----------|
| **Upsert** | Operação que insere um registro se ele não existe ou atualiza se já existe (INSERT + UPDATE) |
| **Slug** | Versão URL-friendly de um texto. Ex: "Camiseta Preta" → `camiseta-preta` |
| **Idempotência** | Propriedade que garante que reenviar a mesma requisição produz o mesmo resultado sem efeitos colaterais |
| **Code** | Código único do produto no ERP, usado como chave de identificação para upsert |
| **Realtime** | Tecnologia WebSocket que notifica o frontend automaticamente quando dados mudam no banco |
| **Polling** | Alternativa ao Realtime: o frontend consulta a API em intervalos regulares para detectar mudanças |
| **Rate limit** | Limite de requisições por minuto para proteger o servidor contra sobrecarga |
| **Payload** | Corpo (body) da requisição HTTP contendo os dados em formato JSON |
| **Snapshot** | Cópia do dado no momento da operação (ex: nome do produto no momento da venda) |
| **Bearer Token** | Método de autenticação via header HTTP `Authorization: Bearer <token>` |

---

## FAQ — Perguntas Frequentes

### 1. O que acontece se eu enviar o mesmo produto duas vezes?

O sistema faz **upsert** pelo campo `code`. Se o produto já existe, ele é atualizado. Se não existe, é criado. Não há duplicação.

### 2. Posso enviar produtos sem categoria?

Sim. O campo `category_slug` é opcional. Produtos sem categoria aparecem em "Todos" no catálogo.

### 3. O que acontece se envio um `category_slug` que não existe?

O produto é criado/atualizado normalmente, mas sem associação com categoria. O campo `category_id` fica como `null`. A resposta incluirá um aviso no array `errors`.

### 4. Posso atualizar apenas o preço sem reenviar todos os campos?

Sim, no endpoint de **upsert**. Os campos opcionais com `null` são preservados via `COALESCE`, então enviar apenas `code`, `name`, `slug` e `price` atualiza somente esses campos.

### 5. Como sei se um produto foi atualizado com sucesso?

Verifique o campo `synced` na resposta. Se for igual ao número de produtos enviados e `errors` estiver vazio, todos foram processados com sucesso.

### 6. Preciso criar um usuário/conta para usar a API?

Não. A autenticação é feita via **token** configurado no painel admin. Não há conceito de "conta de usuário" para a API de integração.

### 7. A API suporta webhooks?

Atualmente, a API opera por **polling** (o ERP consulta periodicamente). Webhooks push (API → ERP) podem ser configurados no futuro via o módulo de envio de pedidos. Veja `docs/ERP_OUTBOUND_API.md`.

### 8. Qual o tamanho máximo de um lote?

500 produtos por requisição. Para volumes maiores, divida em lotes com intervalo de 1-2 segundos entre eles.

### 9. As imagens são enviadas junto com os produtos?

Não. A sincronização de imagens é feita em um **endpoint separado** (`POST /erp-sync/images`). Veja `docs/ERP_IMAGE_IMPORT_API.md` e `docs/IMAGE_SYNC_API.md`.

### 10. Posso deletar um produto pela API?

Recomendamos **inativar** (`active: false`) em vez de deletar. Isso mantém a rastreabilidade e permite reativar futuramente. A deleção permanente está disponível apenas no painel admin.

---

## Checklist de Implementação

### Para o time do ERP:

- [ ] Obter e armazenar o token de autenticação em variável de ambiente
- [ ] Criar as categorias necessárias via `POST /erp-sync/categories`
- [ ] Implementar script de carga inicial via `POST /erp-sync/products`
- [ ] Implementar sincronização incremental (produtos alterados)
- [ ] Implementar sincronização de estoque (se aplicável)
- [ ] Implementar consulta periódica de pedidos via `GET /erp-sync/orders`
- [ ] Implementar confirmação de pedidos via `POST /erp-sync/orders/confirm`
- [ ] Implementar tratamento de erros (retry com backoff exponencial)
- [ ] Testar idempotência (reenviar mesmos dados e verificar que não duplica)
- [ ] Implementar logging das respostas da API para auditoria
- [ ] Configurar alertas para erros 500 ou taxa de erro > 10%

### Configuração no painel admin:

- [ ] Definir URL base da API no campo correspondente
- [ ] Gerar e configurar token de autenticação seguro (≥ 32 chars)
- [ ] Ativar módulos desejados (produtos, estoque, pedidos)
- [ ] Configurar frequência de sincronização
- [ ] Criar categorias base manualmente (se não feito via API)
