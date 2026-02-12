# Documentação Técnica — Sincronização de Imagens de Produtos

> Especificação completa do fluxo **ERP → API REST → Site Web** para sincronização de imagens de produtos.

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura e Fluxo](#2-arquitetura-e-fluxo)
3. [Backend — API REST](#3-backend--api-rest)
   - 3.1 [Autenticação](#31-autenticação)
   - 3.2 [Endpoints](#32-endpoints)
   - 3.3 [Contratos JSON](#33-contratos-json)
   - 3.4 [Regras de Negócio](#34-regras-de-negócio)
   - 3.5 [Idempotência](#35-idempotência)
   - 3.6 [Códigos de Erro](#36-códigos-de-erro)
   - 3.7 [Logs e Rastreabilidade](#37-logs-e-rastreabilidade)
4. [Frontend — Vite/React](#4-frontend--vitereact)
   - 4.1 [Consumo de URLs](#41-consumo-de-urls)
   - 4.2 [Estratégia de Cache](#42-estratégia-de-cache)
   - 4.3 [Fallback e Estados](#43-fallback-e-estados)
   - 4.4 [Galeria de Imagens](#44-galeria-de-imagens)
5. [Sincronização — Cenários](#5-sincronização--cenários)
   - 5.1 [Carga Inicial](#51-carga-inicial)
   - 5.2 [Sincronização Incremental](#52-sincronização-incremental)
   - 5.3 [Substituição de Imagem](#53-substituição-de-imagem)
   - 5.4 [Remoção de Imagem](#54-remoção-de-imagem)
6. [Estados de uma Imagem](#6-estados-de-uma-imagem)
7. [Limites e Recomendações](#7-limites-e-recomendações)

---

## 1. Visão Geral

```
┌─────────────────┐       ┌──────────────────┐       ┌────────────────┐
│                 │       │                  │       │                │
│   ERP (Fonte)   │──────▶│   API REST       │──────▶│   Site Web     │
│                 │       │   (Intermediária) │       │   (Vite/React) │
│  Extrai imagens │       │                  │       │                │
│  do PostgreSQL  │       │  Recebe, valida, │       │  Consome URLs  │
│  interno e      │       │  armazena e      │       │  públicas das  │
│  envia para     │       │  associa ao      │       │  imagens       │
│  a API          │       │  produto         │       │                │
│                 │       │                  │       │                │
└─────────────────┘       └──────────────────┘       └────────────────┘
      FORA DO                  ESCOPO DESTA              ESCOPO DESTA
      ESCOPO                   DOCUMENTAÇÃO              DOCUMENTAÇÃO
```

**Princípios:**
- O ERP é a **fonte da verdade**. Toda imagem se origina lá.
- A API **nunca** acessa o PostgreSQL do ERP.
- O frontend **nunca** faz upload de imagens.
- O ERP **nunca** acessa o storage da Web diretamente.
- A imagem é associada ao produto pelo seu **código no ERP** (`code`).
- O produto **deve existir** na API antes de receber imagens.

---

## 2. Arquitetura e Fluxo

### Fluxo completo de envio

```
ERP                          API REST                         Storage              Produto
 │                              │                                │                    │
 │  1. Extrai imagem do         │                                │                    │
 │     PostgreSQL interno       │                                │                    │
 │                              │                                │                    │
 │  2. POST /images/sync        │                                │                    │
 │     { code, base64, hash }   │                                │                    │
 │ ────────────────────────────▶│                                │                    │
 │                              │  3. Valida produto existe      │                    │
 │                              │ ──────────────────────────────▶│                    │
 │                              │                                │                    │
 │                              │  4. Verifica hash (idempot.)   │                    │
 │                              │                                │                    │
 │                              │  5. Decodifica base64 → blob   │                    │
 │                              │                                │                    │
 │                              │  6. Upload para storage        │                    │
 │                              │ ──────────────────────────────▶│                    │
 │                              │                                │                    │
 │                              │  7. Recebe URL pública         │                    │
 │                              │ ◀──────────────────────────────│                    │
 │                              │                                │                    │
 │                              │  8. Atualiza image_url         │                    │
 │                              │ ──────────────────────────────────────────────────▶ │
 │                              │                                │                    │
 │  9. Recebe resposta          │                                │                    │
 │ ◀────────────────────────────│                                │                    │
 │                              │                                │                    │
 │                              │ 10. Evento Realtime            │                    │
 │                              │     notifica frontend          │                    │
```

### Métodos de envio suportados

| Método | Quando usar | Formato |
|--------|-------------|---------|
| **Base64** | Lotes programáticos (recomendado para ERP) | JSON com campo `image_base64` |
| **Multipart** | Upload manual pelo painel admin | `multipart/form-data` com campo `file` |
| **URL pública** | Imagem já hospedada externamente | JSON com campo `image_url` |

---

## 3. Backend — API REST

### 3.1 Autenticação

Todas as requisições de sincronização exigem autenticação via header:

```
Authorization: Bearer <TOKEN>
```

O token é configurado pelo administrador no painel da loja (Configurações → Integração → Token API).

Requisições sem token ou com token inválido retornam `401 Unauthorized`.

---

### 3.2 Endpoints

#### `POST /images/sync` — Sincronizar imagens em lote (Base64)

Endpoint principal para sincronização programática via ERP.

**Headers:**
```
Authorization: Bearer <TOKEN>
Content-Type: application/json
X-Idempotency-Key: <uuid> (opcional, recomendado)
```

**Request Body:**
```json
{
  "images": [
    {
      "code": "SKU-001",
      "image_base64": "/9j/4AAQSkZJRgABAQ...",
      "hash": "sha256:a1b2c3d4e5f6...",
      "position": 0,
      "is_primary": true,
      "external_id": "img-erp-001"
    },
    {
      "code": "SKU-002",
      "image_base64": "iVBORw0KGgoAAAANSUhEUg...",
      "hash": "sha256:f6e5d4c3b2a1...",
      "position": 0,
      "is_primary": true,
      "external_id": "img-erp-002"
    }
  ]
}
```

---

#### `POST /images/sync/url` — Sincronizar via URL pública

Para imagens já hospedadas em um servidor acessível publicamente.

**Request Body:**
```json
{
  "images": [
    {
      "code": "SKU-001",
      "image_url": "https://cdn.erp.local/produtos/SKU-001.jpg",
      "hash": "sha256:a1b2c3d4e5f6...",
      "position": 0,
      "is_primary": true,
      "external_id": "img-erp-001"
    }
  ]
}
```

---

#### `POST /images/upload` — Upload multipart (painel admin)

Usado apenas pelo painel administrativo para upload manual.

**Headers:**
```
Content-Type: multipart/form-data
```

**Form fields:**
- `file` — arquivo da imagem (JPEG, PNG, GIF, WebP)
- `code` — código do produto (opcional, usado para associação direta)

**Response:**
```json
{
  "url": "https://storage.example.com/uploads/a1b2c3d4.jpg"
}
```

---

#### `DELETE /images/sync` — Remover imagens por código

Remove logicamente imagens associadas a produtos.

**Request Body:**
```json
{
  "removals": [
    {
      "code": "SKU-001",
      "external_id": "img-erp-001"
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "removed": 1,
  "errors": []
}
```

---

### 3.3 Contratos JSON

#### Objeto `ImageSync` (request)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `code` | `string` | ✅ | Código do produto no ERP. Deve existir na base. |
| `image_base64` | `string` | ✅* | Imagem em Base64 (puro ou com prefixo `data:image/...`). |
| `image_url` | `string` | ✅* | URL pública da imagem (alternativa ao Base64). |
| `hash` | `string` | Recomendado | Hash da imagem (ex: `sha256:abc123`). Para idempotência. |
| `position` | `number` | Não | Posição na galeria (0 = primeira). Default: `0`. |
| `is_primary` | `boolean` | Não | Se é a imagem principal do produto. Default: `true`. |
| `external_id` | `string` | Recomendado | Identificador único da imagem no ERP. Para rastreabilidade. |

> \* É obrigatório enviar **`image_base64`** ou **`image_url`**, nunca ambos.

#### Aliases de campos aceitos

Para compatibilidade com diferentes ERPs, os seguintes aliases são aceitos:

**Código do produto:**
- `code`, `codigo`, `codigoproduto`, `codigo_produto`, `sku`

**Imagem Base64:**
- `image_base64`, `imagem_base64`, `imagem`, `image`, `base64`

**Imagem URL:**
- `image_url`, `imagem_url`, `url`

#### Objeto `ImageSyncResponse` (response)

**Sucesso total (200):**
```json
{
  "success": true,
  "processed": 5,
  "updated": 5,
  "skipped": 0,
  "errors": []
}
```

**Sucesso parcial (207 Multi-Status):**
```json
{
  "success": false,
  "processed": 5,
  "updated": 3,
  "skipped": 2,
  "errors": [
    {
      "code": "SKU-999",
      "external_id": "img-erp-999",
      "error": "PRODUCT_NOT_FOUND",
      "message": "Produto com código 'SKU-999' não encontrado"
    },
    {
      "code": "SKU-888",
      "external_id": "img-erp-888",
      "error": "INVALID_IMAGE",
      "message": "Dados Base64 inválidos ou corrompidos"
    }
  ]
}
```

---

### 3.4 Regras de Negócio

#### Pré-requisito: produto deve existir

A API **rejeita** imagens cujo `code` não corresponda a nenhum produto cadastrado. O produto deve ser sincronizado **antes** de suas imagens.

```
Sequência obrigatória:
1. POST /products/upsert   → cria/atualiza o produto
2. POST /images/sync        → associa imagem ao produto
```

#### Imagem principal (`is_primary`)

- Cada produto possui **uma** imagem principal, armazenada no campo `image_url` do produto.
- Ao enviar `is_primary: true`, a API atualiza o campo `image_url` do produto.
- Se nenhuma imagem for marcada como primária, a **primeira** imagem do lote é usada.

#### Ordenação (`position`)

- A posição define a ordem de exibição na galeria.
- `position: 0` é a primeira imagem (geralmente a principal).
- A API ordena automaticamente por `position` crescente.

#### Substituição de imagem

Quando uma imagem com o mesmo `hash` ou `external_id` já existe:
- Se o `hash` for **igual**: a imagem é **ignorada** (idempotência).
- Se o `hash` for **diferente**: a imagem antiga é **substituída** pela nova.

#### Detecção automática de formato

O formato da imagem é detectado automaticamente pelos bytes iniciais do Base64:

| Prefixo Base64 | Formato | MIME Type |
|----------------|---------|-----------|
| `/9j/` | JPEG | `image/jpeg` |
| `iVBOR` | PNG | `image/png` |
| `R0lGO` | GIF | `image/gif` |
| `UklGR` | WebP | `image/webp` |

Se nenhum padrão for reconhecido, assume **JPEG** como padrão.

#### Remoção de Base64 prefix

O sistema aceita ambos os formatos e remove automaticamente o prefixo:

```
✅ /9j/4AAQSkZJRgABAQAAAQ...        (puro)
✅ data:image/jpeg;base64,/9j/4AAQ... (com prefixo)
```

---

### 3.5 Idempotência

A API utiliza **duas estratégias** complementares para garantir idempotência:

#### Estratégia 1: Hash da imagem

| Cenário | Comportamento |
|---------|---------------|
| `hash` enviado e **não existe** no produto | Upload + atualização |
| `hash` enviado e **já existe** no produto | Imagem ignorada (skip) |
| `hash` não enviado | Upload sempre executado |

#### Estratégia 2: Header `X-Idempotency-Key`

```
X-Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
```

| Cenário | Comportamento |
|---------|---------------|
| Key inédita | Processa normalmente, armazena resultado |
| Key já processada (últimas 24h) | Retorna resposta armazenada sem reprocessar |

#### Recomendação

Para maior segurança, **envie ambos**:

```json
{
  "images": [{
    "code": "SKU-001",
    "image_base64": "...",
    "hash": "sha256:a1b2c3..."
  }]
}
```
```
X-Idempotency-Key: <uuid-do-lote>
```

---

### 3.6 Códigos de Erro

#### Erros HTTP

| Código | Significado | Quando ocorre |
|--------|-------------|---------------|
| `200` | Sucesso total | Todas as imagens processadas |
| `207` | Sucesso parcial | Algumas imagens falharam |
| `400` | Erro de validação | Payload inválido ou ausente |
| `401` | Não autorizado | Token ausente ou inválido |
| `413` | Payload grande demais | Lote excede 50 imagens ou 50MB |
| `429` | Rate limit | Muitas requisições por minuto |
| `500` | Erro interno | Falha inesperada no servidor |

#### Códigos de erro por imagem

| Código | Descrição |
|--------|-----------|
| `PRODUCT_NOT_FOUND` | Produto com o código informado não existe |
| `INVALID_IMAGE` | Dados Base64 corrompidos ou formato não suportado |
| `IMAGE_TOO_LARGE` | Imagem excede 5MB (encoded) |
| `UPLOAD_FAILED` | Falha ao salvar no storage |
| `DUPLICATE_HASH` | Imagem com mesmo hash já existe (skip) |

#### Formato padrão de erro

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Campo 'images' é obrigatório e deve ser um array",
  "timestamp": "2025-01-15T10:30:00Z",
  "request_id": "req_abc123"
}
```

---

### 3.7 Logs e Rastreabilidade

Toda requisição gera um registro com:

| Campo | Exemplo | Descrição |
|-------|---------|-----------|
| `request_id` | `req_abc123` | ID único da requisição |
| `timestamp` | `2025-01-15T10:30:00Z` | Momento da operação |
| `method` | `POST` | Método HTTP |
| `endpoint` | `/images/sync` | Rota chamada |
| `images_received` | `5` | Quantidade de imagens no lote |
| `images_updated` | `3` | Imagens processadas com sucesso |
| `images_skipped` | `2` | Imagens ignoradas (hash duplicado) |
| `errors` | `[{code, error}]` | Detalhes dos erros individuais |
| `idempotency_key` | `uuid` | Key de idempotência (se enviada) |
| `duration_ms` | `1250` | Tempo total de processamento |

---

## 4. Frontend — Vite/React

### 4.1 Consumo de URLs

O frontend **nunca** recebe imagens em Base64. Ele consome exclusivamente **URLs públicas** armazenadas no campo `image_url` do produto.

```tsx
// ProductCard.tsx — Exibição da imagem
<img
  src={product.image_url || "/placeholder.svg"}
  alt={product.name}
  className="h-full w-full object-contain"
  loading="lazy"
/>
```

```tsx
// ProductDetail.tsx — Página de detalhe
<img
  src={product.image_url || "/placeholder.svg"}
  alt={product.name}
  className="h-full w-full object-cover"
/>
```

**Regra:** o campo `image_url` contém a URL da imagem principal. Essa URL é mantida pela API durante a sincronização.

---

### 4.2 Estratégia de Cache

#### Atualização em tempo real (Realtime)

O frontend utiliza **Realtime** (WebSocket) para receber notificações automáticas quando um produto é alterado:

```tsx
// useDbProducts.ts — Subscription automática
const unsubProducts = realtimeApi.subscribeToTable("products", () => fetchProducts());
```

Quando a API atualiza o `image_url` de um produto, o evento Realtime dispara `fetchProducts()`, e o componente re-renderiza automaticamente com a nova imagem.

#### Cache busting

Como as URLs de imagem incluem nomes de arquivo únicos (UUID), o cache do navegador é **naturalmente invalidado** quando a imagem muda:

```
Antes:  https://storage.example.com/uploads/a1b2c3d4.jpg
Depois: https://storage.example.com/uploads/e5f6g7h8.jpg
```

O navegador trata como um recurso novo e carrega a imagem atualizada.

#### Fallback em modo polling (PostgreSQL local)

Quando Realtime não está disponível (modo PostgreSQL), o sistema usa polling a cada 5 segundos:

```tsx
// api-client.ts — Fallback
if (isPostgresMode()) {
  const interval = setInterval(callback, 5000);
  return () => clearInterval(interval);
}
```

---

### 4.3 Fallback e Estados

#### Imagem não disponível

Quando `image_url` é `null`, vazio ou a imagem não carrega:

```tsx
<img
  src={product.image_url || "/placeholder.svg"}
  alt={product.name}
  onError={(e) => {
    e.currentTarget.src = "/placeholder.svg";
  }}
/>
```

#### Placeholder padrão

O arquivo `/placeholder.svg` é exibido em todos os casos de ausência:

| Situação | Comportamento |
|----------|---------------|
| `image_url` é `null` | Mostra placeholder |
| `image_url` é `""` (vazio) | Mostra placeholder |
| `image_url` aponta para recurso inexistente | `onError` troca para placeholder |
| Produto sem imagem sincronizada | Mostra placeholder |

#### Configuração "Ocultar produtos sem foto"

O administrador pode ativar a opção para ocultar produtos sem imagem no catálogo público:

```tsx
// Filtro aplicado no catálogo
const visibleProducts = products.filter(p => {
  if (hideWithoutPhoto) {
    return p.image_url && p.image_url !== "" && p.image_url !== "/placeholder.svg";
  }
  return true;
});
```

---

### 4.4 Galeria de Imagens

#### Estrutura atual (imagem única)

Na versão atual, cada produto possui **uma imagem principal** (`image_url`). O frontend exibe essa imagem em:

- **Card do catálogo** — `ProductCard.tsx` (aspecto quadrado, `object-contain`)
- **Página de detalhe** — `ProductDetail.tsx` (aspecto quadrado, `object-cover`)

#### Preparação para galeria múltipla (futuro)

Quando o sistema de galeria for implementado, o contrato de sincronização já está preparado:

```json
{
  "images": [
    { "code": "SKU-001", "image_base64": "...", "position": 0, "is_primary": true },
    { "code": "SKU-001", "image_base64": "...", "position": 1, "is_primary": false },
    { "code": "SKU-001", "image_base64": "...", "position": 2, "is_primary": false }
  ]
}
```

A imagem com `is_primary: true` continua alimentando `image_url`. As demais serão armazenadas em uma tabela separada (`product_images`) quando a galeria for implementada.

---

## 5. Sincronização — Cenários

### 5.1 Carga Inicial

Envio de todas as imagens dos produtos na primeira sincronização.

**Pré-requisitos:**
1. Todos os produtos já devem estar cadastrados via `POST /products/upsert`
2. Enviar imagens em lotes de até **50** por requisição

**Fluxo:**
```
ERP:
  1. Consulta todas as imagens no PostgreSQL interno
  2. Para cada lote de 50 produtos:
     a. Extrai imagens como Base64
     b. Calcula hash SHA-256 de cada imagem
     c. POST /images/sync com o lote
     d. Aguarda resposta
     e. Intervalo de 2 segundos antes do próximo lote
```

**Exemplo — cURL:**
```bash
curl -X POST https://api.exemplo.com/images/sync \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: batch-001-2025-01-15" \
  -d '{
    "images": [
      {
        "code": "SKU-001",
        "image_base64": "/9j/4AAQSkZJRgABAQAAAQ...",
        "hash": "sha256:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
        "position": 0,
        "is_primary": true,
        "external_id": "img-001"
      },
      {
        "code": "SKU-002",
        "image_base64": "iVBORw0KGgoAAAANSUhEUg...",
        "hash": "sha256:f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3",
        "position": 0,
        "is_primary": true,
        "external_id": "img-002"
      }
    ]
  }'
```

**Resposta:**
```json
{
  "success": true,
  "processed": 2,
  "updated": 2,
  "skipped": 0,
  "errors": []
}
```

---

### 5.2 Sincronização Incremental

Apenas imagens novas ou alteradas desde a última sincronização.

**Estratégia no ERP:**
```
1. Manter registro da última sincronização (timestamp)
2. Consultar imagens alteradas desde esse timestamp
3. Calcular hash SHA-256
4. Enviar apenas as imagens cujo hash difere
```

**Exemplo — apenas uma imagem atualizada:**
```bash
curl -X POST https://api.exemplo.com/images/sync \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "images": [
      {
        "code": "SKU-001",
        "image_base64": "/9j/NOVO_CONTEUDO_BASE64...",
        "hash": "sha256:novo_hash_diferente_do_anterior",
        "position": 0,
        "is_primary": true,
        "external_id": "img-001"
      }
    ]
  }'
```

**Resposta (hash diferente → atualizada):**
```json
{
  "success": true,
  "processed": 1,
  "updated": 1,
  "skipped": 0,
  "errors": []
}
```

**Resposta (hash igual → ignorada):**
```json
{
  "success": true,
  "processed": 1,
  "updated": 0,
  "skipped": 1,
  "errors": []
}
```

---

### 5.3 Substituição de Imagem

Quando o ERP envia uma nova versão da imagem para o mesmo produto:

```
┌──────────────┐       ┌────────────────┐       ┌──────────────┐
│ ERP          │       │ API            │       │ Storage      │
│              │       │                │       │              │
│ Nova imagem  │──────▶│ Compara hash   │       │              │
│ hash: xyz    │       │                │       │              │
│              │       │ Hash diferente │       │              │
│              │       │ do armazenado? │       │              │
│              │       │                │       │              │
│              │       │ SIM → Upload   │──────▶│ Salva novo   │
│              │       │       novo     │       │ arquivo      │
│              │       │                │       │              │
│              │       │ Atualiza URL   │       │              │
│              │       │ e hash no      │       │              │
│              │       │ produto        │       │              │
│              │       │                │       │              │
│ Recebe 200   │◀──────│ updated: 1     │       │              │
└──────────────┘       └────────────────┘       └──────────────┘
```

---

### 5.4 Remoção de Imagem

Quando o ERP precisa remover a imagem de um produto:

```bash
curl -X DELETE https://api.exemplo.com/images/sync \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "removals": [
      {
        "code": "SKU-001",
        "external_id": "img-001"
      }
    ]
  }'
```

**Comportamento:**
1. O campo `image_url` do produto é definido como `null`
2. O frontend exibe automaticamente o placeholder
3. Se "Ocultar produtos sem foto" estiver ativo, o produto desaparece do catálogo

---

## 6. Estados de uma Imagem

```
                    ┌─────────────┐
                    │  PENDENTE   │
                    │ (sem imagem)│
                    └──────┬──────┘
                           │
                    POST /images/sync
                    (base64 ou url)
                           │
                           ▼
                    ┌─────────────┐
            ┌──────│   ATIVA     │◀─────┐
            │      │ (image_url  │      │
            │      │  preenchida)│      │
            │      └──────┬──────┘      │
            │             │             │
    POST /images/sync     │      POST /images/sync
    (hash diferente)      │      (nova imagem)
            │             │             │
            ▼             │             │
     ┌─────────────┐      │      ┌──────┴──────┐
     │ ATUALIZADA  │──────┘      │ SUBSTITUÍDA │
     │ (nova URL)  │             │ (nova URL)  │
     └─────────────┘             └─────────────┘
                           │
                    DELETE /images/sync
                           │
                           ▼
                    ┌─────────────┐
                    │  REMOVIDA   │
                    │ (image_url  │
                    │  = null)    │
                    └─────────────┘
```

| Estado | `image_url` | Visível no catálogo | Condição |
|--------|-------------|---------------------|----------|
| **Pendente** | `null` | Depende da config | Produto sem imagem sincronizada |
| **Ativa** | URL válida | ✅ Sim | Imagem sincronizada e disponível |
| **Atualizada** | Nova URL | ✅ Sim | Imagem substituída com hash diferente |
| **Removida** | `null` | Depende da config | Imagem removida via API |

---

## 7. Limites e Recomendações

### Limites técnicos

| Item | Valor |
|------|-------|
| Tamanho máximo por imagem (Base64 encoded) | **5 MB** |
| Imagens por requisição | **50** |
| Tamanho máximo do payload | **50 MB** |
| Formatos aceitos | JPEG, PNG, GIF, WebP |
| Resolução recomendada | 800×800 a 1200×1200 px |
| Rate limit | 60 requisições/minuto |
| Retenção de idempotency key | 24 horas |

### Boas práticas

| Prática | Motivo |
|---------|--------|
| Sincronize produtos **antes** das imagens | Evita erro `PRODUCT_NOT_FOUND` |
| Envie **hash SHA-256** em toda requisição | Garante idempotência e evita uploads desnecessários |
| Use **lotes de 50** com intervalo de 2s | Evita timeout e respeita rate limit |
| Envie **`external_id`** único por imagem | Facilita rastreabilidade e debug |
| Redimensione imagens para ≤ 1200px | Melhora performance do site e reduz tráfego |
| Comprima JPEGs para qualidade 80-85% | Balanceia qualidade visual e tamanho |
| Use **`X-Idempotency-Key`** por lote | Protege contra reenvios acidentais |

### Exemplo de rotina de sincronização no ERP

```
Rotina diária (ou sob demanda):
  1. SELECT imagens alteradas desde última_sync
  2. Para cada grupo de 50 imagens:
     a. Extrair blob do PostgreSQL interno
     b. Converter para Base64
     c. Calcular SHA-256
     d. POST /images/sync
     e. Registrar resultado (updated/skipped/errors)
     f. Aguardar 2 segundos
  3. Atualizar timestamp de última_sync
```

> **Nota:** Os passos 1 e 2a (acesso ao PostgreSQL do ERP) estão **fora do escopo** desta documentação. A responsabilidade de extrair e enviar as imagens é do time do ERP.
