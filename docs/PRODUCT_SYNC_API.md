# Sincronização de Produtos — Documentação Técnica

> Guia completo para integrar a sincronização de produtos entre um ERP externo e o Site Web via API REST intermediária.

---

## 1. Visão Geral da Arquitetura

```
┌──────────────┐        ┌──────────────────┐        ┌──────────────────┐
│              │  HTTP   │                  │  HTTP   │                  │
│     ERP      │───────▶│   API REST       │◀───────│   Site Web       │
│  (Firebird)  │  POST  │  (Intermediária) │  GET    │   (Vite/React)   │
│              │        │                  │        │                  │
└──────────────┘        └──────────────────┘        └──────────────────┘
   Fonte da              Recebe, valida e            Consome e exibe
   verdade               persiste produtos           o catálogo
```

### Princípios

| Princípio | Descrição |
|-----------|-----------|
| **Fonte da verdade** | O ERP é a origem de todos os dados de produto |
| **Desacoplamento** | O Site Web nunca acessa o ERP diretamente |
| **Idempotência** | Reenviar o mesmo produto não gera duplicação |
| **Upsert por código** | O campo `code` é a chave única de identificação externa |
| **API agnóstica** | A API não conhece regras internas do ERP |

---

## 2. BACKEND — API REST

### 2.1 Base URL

```
# Produção (Lovable Cloud)
https://<project-id>.supabase.co/functions/v1/erp-sync

# Desenvolvimento local (Express)
http://localhost:3001/api
```

### 2.2 Autenticação

Todas as requisições do ERP devem incluir:

```
Authorization: Bearer <ERP_API_TOKEN>
```

O token é configurado no painel administrativo em **Configurações → ERP → Token de autenticação**.

---

### 2.3 Contrato do Produto

#### Estrutura JSON completa

```json
{
  "code": "SKU-001",
  "name": "Camiseta Básica Preta",
  "slug": "camiseta-basica-preta",
  "price": 79.90,
  "original_price": 99.90,
  "description": "Camiseta 100% algodão",
  "category_slug": "roupas",
  "image_url": "https://cdn.exemplo.com/img/sku001.jpg",
  "active": true,
  "brand": "Marca X",
  "reference": "REF-2025-001",
  "manufacturer_code": "MFR-001",
  "unit_of_measure": "UN",
  "quantity": 150
}
```

#### Campos

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|:-----------:|-----------|
| `code` | `string` | ✅ | Código único do produto no ERP. **Chave de upsert.** |
| `name` | `string` | ✅ | Nome de exibição do produto |
| `slug` | `string` | ✅ | URL amigável (lowercase, sem espaços, hifenizado) |
| `price` | `number` | ✅ | Preço de venda atual (> 0) |
| `original_price` | `number` | ❌ | Preço anterior (para exibir desconto). `null` se não aplicável |
| `description` | `string` | ❌ | Descrição do produto. Default: `""` |
| `category_slug` | `string` | ❌ | Slug da categoria. Deve existir previamente |
| `image_url` | `string` | ❌ | URL pública da imagem. Default: placeholder |
| `active` | `boolean` | ❌ | Se o produto é visível no catálogo. Default: `true` |
| `brand` | `string` | ❌ | Marca do produto |
| `reference` | `string` | ❌ | Código de referência auxiliar |
| `manufacturer_code` | `string` | ❌ | Código do fabricante |
| `unit_of_measure` | `string` | ❌ | Unidade de medida (UN, KG, CX, etc.) |
| `quantity` | `number` | ❌ | Quantidade em estoque |

---

### 2.4 Endpoints

#### `POST /products/upsert` — Criar ou atualizar produtos em lote

Este é o **endpoint principal** de sincronização. Realiza upsert baseado no campo `code`.

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
      "active": true,
      "brand": "Marca X",
      "reference": "REF-001",
      "manufacturer_code": "MFR-001",
      "unit_of_measure": "UN",
      "quantity": 50
    }
  ]
}
```

**Response — Sucesso (200):**

```json
{
  "success": true
}
```

**Response — Erro (400):**

```json
{
  "error": "products array required"
}
```

**Response — Erro interno (500):**

```json
{
  "error": "duplicate key value violates unique constraint..."
}
```

##### Regras de upsert

| Cenário | Comportamento |
|---------|---------------|
| Produto com `code` não existe | Cria novo registro |
| Produto com `code` já existe | Atualiza todos os campos enviados |
| `image_url` = `/placeholder.svg` | **Preserva** a imagem atual (não sobrescreve com placeholder) |
| Campo opcional com `null` | **Preserva** o valor atual via `COALESCE` |

---

#### `GET /products` — Listar todos os produtos

Retorna todos os produtos ordenados por data de criação (mais recentes primeiro).

**Response (200):**

```json
[
  {
    "id": "uuid-...",
    "code": "SKU-001",
    "name": "Camiseta Básica Preta",
    "slug": "camiseta-basica-preta",
    "price": 79.90,
    "original_price": 99.90,
    "description": "Camiseta 100% algodão",
    "image_url": "https://...",
    "category_id": "uuid-...",
    "active": true,
    "brand": "Marca X",
    "reference": "REF-001",
    "manufacturer_code": "MFR-001",
    "unit_of_measure": "UN",
    "quantity": 50,
    "featured": false,
    "featured_order": 0,
    "quick_filter_1": false,
    "quick_filter_2": false,
    "created_at": "2025-01-15T10:00:00Z",
    "updated_at": "2025-02-10T14:30:00Z"
  }
]
```

---

#### `GET /products/slug/:slug` — Buscar produto por slug

Retorna um único produto ativo pelo slug. Usado para a página de detalhe.

**Response (200):**

```json
{
  "id": "uuid-...",
  "code": "SKU-001",
  "name": "Camiseta Básica Preta",
  "slug": "camiseta-basica-preta",
  "price": 79.90,
  "active": true
}
```

**Response — Não encontrado (200):**

```json
null
```

---

#### `GET /products/code/:code` — Verificar existência por código

Verifica se um produto com determinado código ERP já existe.

**Response (200):**

```json
[
  { "id": "uuid-..." }
]
```

Array vazio se não encontrado: `[]`

---

#### `POST /products` — Criar produto individual

Cria um único produto. Para sincronização em lote, prefira o endpoint `/products/upsert`.

**Request:** Corpo com os campos do produto (mesma estrutura do contrato).

**Response (200):** Retorna o produto criado completo.

---

#### `PUT /products/:id` — Atualizar produto por ID

Atualiza campos específicos de um produto existente.

**Request:** Apenas os campos a serem alterados:

```json
{
  "price": 89.90,
  "active": false
}
```

**Response (200):** Retorna o produto atualizado.

---

#### `DELETE /products/:id` — Remover produto

Remove permanentemente um produto pelo ID interno.

> ⚠️ **Recomendação:** Prefira inativar (`active: false`) em vez de deletar, para manter rastreabilidade.

---

### 2.5 Idempotência

A idempotência é garantida pelo campo `code` com constraint `UNIQUE` no banco de dados:

```
Constraint: products_code_unique
Tipo: UNIQUE INDEX na coluna "code"
```

| Operação | Comportamento |
|----------|---------------|
| `POST /products/upsert` com `code` novo | Insere o produto |
| `POST /products/upsert` com `code` existente | Atualiza o produto |
| Envio duplicado acidental | Resultado idêntico (idempotente) |

**Isso significa que o ERP pode reenviar os mesmos produtos quantas vezes quiser sem risco de duplicação.**

---

### 2.6 Códigos de Erro Padronizados

| Código HTTP | Cenário | Corpo |
|:-----------:|---------|-------|
| `200` | Sucesso | `{ "success": true }` |
| `400` | Validação falhou | `{ "error": "products array required" }` |
| `400` | Campos obrigatórios ausentes | `{ "error": "No fields to update" }` |
| `401` | Token ausente/inválido | `{ "error": "Unauthorized" }` |
| `500` | Erro interno do servidor | `{ "error": "<mensagem técnica>" }` |

---

### 2.7 Validações do Backend

| Regra | Endpoint | Descrição |
|-------|----------|-----------|
| `products` deve ser array | `POST /upsert` | Retorna 400 se não for array |
| `code` obrigatório | `POST /upsert` | Usado como chave de upsert |
| `name` obrigatório | `POST /upsert` | Nome de exibição |
| `slug` obrigatório | `POST /upsert` | URL amigável |
| `price` obrigatório | `POST /upsert` | Deve ser > 0 |
| `image_url` placeholder | `POST /upsert` | Não sobrescreve imagem existente |
| Campos opcionais `null` | `POST /upsert` | Preserva valor atual via COALESCE |

---

### 2.8 Logs e Rastreabilidade

| Mecanismo | Descrição |
|-----------|-----------|
| `created_at` | Timestamp de criação (automático, imutável) |
| `updated_at` | Timestamp da última atualização (automático) |
| `code` | Identificador externo do ERP — permite rastrear origem |
| Logs do servidor | Erros 500 são logados com stack trace no stdout |

---

## 3. FRONTEND — Site Web (Vite/React)

### 3.1 Consumo do Catálogo

O frontend utiliza uma **camada de abstração** (`src/lib/api-client.ts`) que decide entre Supabase (Cloud) ou REST (local) com base na variável `VITE_API_MODE`.

#### API Client — Funções disponíveis

```typescript
import { productsApi } from "@/lib/api-client";

// Listar todos os produtos
const products = await productsApi.fetchAll();

// Buscar por slug (página de detalhe)
const product = await productsApi.findBySlug("camiseta-basica-preta");

// Verificar existência por código ERP
const exists = await productsApi.findByCode("SKU-001");
```

#### Hook de dados — `useDbProducts`

```typescript
import { useDbProducts } from "@/hooks/useDbProducts";

function ProductList() {
  const { products, categories, loading } = useDbProducts();

  if (loading) return <Skeleton />;

  return products
    .filter(p => p.active)
    .map(p => <ProductCard key={p.id} product={p} />);
}
```

#### Hook de detalhe — `useProductBySlug`

```typescript
import { useProductBySlug } from "@/hooks/useProductBySlug";

function ProductDetail({ slug }: { slug: string }) {
  const { product, loading } = useProductBySlug(slug);

  if (loading) return <Skeleton />;
  if (!product) return <NotFound />;

  return <ProductView product={product} />;
}
```

---

### 3.2 Estratégia de Atualização

| Mecanismo | Modo Supabase (Cloud) | Modo PostgreSQL (Local) |
|-----------|:---------------------:|:----------------------:|
| **Carga inicial** | `SELECT *` via Supabase client | `GET /api/products` via REST |
| **Atualização automática** | Realtime (WebSocket) | Polling na re-abertura da tela |
| **Granularidade** | Por tabela (`products`, `categories`) | Refetch completo |

#### Realtime (modo Cloud)

```typescript
// Em useDbProducts.ts — inscrição automática
const unsubProducts = realtimeApi.subscribeToTable("products", () => fetchProducts());
const unsubCategories = realtimeApi.subscribeToTable("categories", () => fetchCategories());
```

Quando o ERP envia um produto via API, o frontend recebe a atualização **automaticamente** via WebSocket, sem necessidade de refresh.

---

### 3.3 Tratamento de Produto Inativo

| Cenário | Comportamento do Frontend |
|---------|---------------------------|
| `active = true` | Produto visível no catálogo |
| `active = false` | Produto **oculto** da listagem pública |
| `active = false` + acesso direto via URL | Retorna `null` → exibe página 404 |
| Produto deletado | Não aparece em nenhuma listagem |

Filtro aplicado na listagem:

```typescript
const visibleProducts = products.filter(p => p.active);
```

A busca por slug já filtra por `active = true`:

```sql
SELECT * FROM products WHERE slug = $1 AND active = true LIMIT 1
```

---

### 3.4 Estados de Carregamento e Erro

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  loading    │────▶│   success    │     │    error     │
│  (skeleton) │     │  (produtos)  │     │  (toast msg) │
└─────────────┘     └──────────────┘     └──────────────┘
       │                                        ▲
       └────────────────────────────────────────┘
                    (falha na requisição)
```

| Estado | Componente | Comportamento |
|--------|------------|---------------|
| **Carregando** | `Skeleton` / Spinner | Exibido enquanto `loading = true` |
| **Sucesso** | Grid de produtos | Renderiza cards com dados reais |
| **Erro** | Toast notification | Mensagem de erro via `sonner` |
| **Vazio** | Mensagem informativa | "Nenhum produto encontrado" |

---

## 4. Fluxo Completo de Sincronização

### 4.1 Carga Inicial (primeira sincronização)

```
┌──────────────┐                    ┌──────────────────┐
│              │  1. POST /products │                  │
│     ERP      │───/upsert──────────▶│   API REST       │
│              │  (todos os itens)  │                  │
│              │                    │  2. Valida e     │
│              │                    │     persiste     │
│              │                    │     (INSERT)     │
│              │◀───────────────────│                  │
│              │  3. { success }    │                  │
└──────────────┘                    └────────┬─────────┘
                                             │
                                   4. Realtime / GET
                                             │
                                    ┌────────▼─────────┐
                                    │   Site Web       │
                                    │  (atualiza grid) │
                                    └──────────────────┘
```

**Exemplo — Envio de carga completa:**

```bash
curl -X POST http://localhost:3001/api/products/upsert \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "products": [
      {
        "code": "SKU-001",
        "name": "Camiseta Preta",
        "slug": "camiseta-preta",
        "price": 79.90,
        "brand": "Marca X",
        "active": true
      },
      {
        "code": "SKU-002",
        "name": "Tênis Runner",
        "slug": "tenis-runner",
        "price": 299.90,
        "original_price": 349.90,
        "brand": "Marca Y",
        "unit_of_measure": "PAR",
        "quantity": 25,
        "active": true
      },
      {
        "code": "SKU-003",
        "name": "Bolsa Couro",
        "slug": "bolsa-couro",
        "price": 179.90,
        "active": true
      }
    ]
  }'
```

---

### 4.2 Sincronização Incremental (atualizações)

```
┌──────────────┐                    ┌──────────────────┐
│              │  1. POST /products │                  │
│     ERP      │───/upsert──────────▶│   API REST       │
│              │  (itens alterados) │                  │
│              │                    │  2. Valida       │
│              │                    │     UPSERT       │
│              │                    │     (UPDATE)     │
│              │◀───────────────────│                  │
│              │  3. { success }    │                  │
└──────────────┘                    └────────┬─────────┘
                                             │
                                   4. Realtime notifica
                                             │
                                    ┌────────▼─────────┐
                                    │   Site Web       │
                                    │  (atualiza card) │
                                    └──────────────────┘
```

**Exemplo — Atualizar preço e inativar produto:**

```bash
curl -X POST http://localhost:3001/api/products/upsert \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "products": [
      {
        "code": "SKU-001",
        "name": "Camiseta Preta",
        "slug": "camiseta-preta",
        "price": 69.90,
        "active": true
      },
      {
        "code": "SKU-003",
        "name": "Bolsa Couro",
        "slug": "bolsa-couro",
        "price": 179.90,
        "active": false
      }
    ]
  }'
```

Resultado:
- `SKU-001`: preço atualizado de R$ 79,90 → R$ 69,90
- `SKU-003`: produto **inativado** (desaparece do catálogo)

---

### 4.3 Estados do Produto

```
                 ┌──────────────┐
    POST upsert  │              │
   ──────────────▶    ATIVO     │
                 │ (active=true)│
                 └──────┬───────┘
                        │
          POST upsert   │   POST upsert
         active=false   │   active=true
                        ▼
                 ┌──────────────┐
                 │              │
                 │   INATIVO    │
                 │(active=false)│
                 └──────┬───────┘
                        │
              DELETE /:id│
                        ▼
                 ┌──────────────┐
                 │              │
                 │   REMOVIDO   │
                 │ (permanente) │
                 └──────────────┘
```

| Estado | `active` | Visível no catálogo | Acessível por slug | Reversível |
|--------|:--------:|:-------------------:|:------------------:|:----------:|
| **Ativo** | `true` | ✅ Sim | ✅ Sim | — |
| **Inativo** | `false` | ❌ Não | ❌ Não (404) | ✅ Sim |
| **Removido** | — | ❌ Não | ❌ Não | ❌ Não |

---

## 5. Categorias

Produtos podem ser associados a categorias via `category_slug`. As categorias devem existir previamente.

#### `GET /categories` — Listar categorias

```json
[
  { "id": "uuid-...", "name": "Roupas", "slug": "roupas", "created_at": "..." },
  { "id": "uuid-...", "name": "Calçados", "slug": "calcados", "created_at": "..." }
]
```

#### `POST /categories/batch` — Criar categorias em lote

```json
{
  "categories": [
    { "name": "Eletrônicos", "slug": "eletronicos" },
    { "name": "Casa e Jardim", "slug": "casa-e-jardim" }
  ]
}
```

Categorias com `slug` duplicado são ignoradas automaticamente (`ON CONFLICT DO NOTHING`).

---

## 6. Frequência Recomendada

| Tipo de sincronização | Frequência | Cenário |
|----------------------|------------|---------|
| **Carga completa** | 1x (inicial) ou sob demanda | Setup, migração, reset |
| **Incremental — preços** | A cada 1–6 horas | Alterações de tabela de preço |
| **Incremental — estoque** | A cada 15–30 minutos | Movimentações frequentes |
| **Incremental — ativação** | Sob demanda (evento) | Lançamento/retirada de produto |
| **Categorias** | Sob demanda | Raramente muda |

---

## 7. Resumo dos Endpoints

| Método | Endpoint | Descrição | Uso principal |
|--------|----------|-----------|---------------|
| `POST` | `/products/upsert` | Criar/atualizar em lote | **ERP → API** |
| `GET` | `/products` | Listar todos | Frontend |
| `GET` | `/products/slug/:slug` | Buscar por slug | Frontend (detalhe) |
| `GET` | `/products/code/:code` | Verificar por código | ERP (consulta) |
| `POST` | `/products` | Criar individual | Admin |
| `PUT` | `/products/:id` | Atualizar por ID | Admin |
| `DELETE` | `/products/:id` | Remover permanente | Admin |
| `GET` | `/categories` | Listar categorias | Frontend / ERP |
| `POST` | `/categories/batch` | Criar categorias | ERP |

---

## 8. Checklist de Implementação

### Para o time do ERP:

- [ ] Configurar o token de autenticação no painel admin
- [ ] Criar as categorias necessárias via `POST /categories/batch`
- [ ] Implementar carga inicial via `POST /products/upsert`
- [ ] Implementar sincronização incremental (produtos alterados)
- [ ] Testar idempotência (reenviar mesmos dados e verificar que não duplica)
- [ ] Implementar controle de ativação/inativação via campo `active`
- [ ] Monitorar responses 400/500 para tratamento de erros

### Para o time do Frontend:

- [ ] Verificar que `useDbProducts` carrega e filtra produtos ativos
- [ ] Verificar que a página de detalhe trata produto `null` (404)
- [ ] Confirmar que Realtime atualiza a listagem sem refresh manual
- [ ] Testar estados de loading, erro e catálogo vazio
