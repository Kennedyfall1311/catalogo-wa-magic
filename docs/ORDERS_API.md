# Documentação Técnica — Fluxo de Pedidos

> **Escopo:** Frontend (Vite/React) + Backend (API REST intermediária).  
> **Fora do escopo:** Banco de dados, ERP, regras fiscais e qualquer sistema legado.  
> **Objetivo:** Permitir que um desenvolvedor implemente o frontend e o backend de pedidos sem conhecer o ERP consumidor.

---

## Índice

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Frontend — Fluxo de Criação do Pedido](#2-frontend--fluxo-de-criação-do-pedido)
3. [Frontend — Estrutura do JSON Enviado](#3-frontend--estrutura-do-json-enviado)
4. [Frontend — Validações](#4-frontend--validações)
5. [Frontend — Tratamento de Respostas](#5-frontend--tratamento-de-respostas)
6. [Backend — Endpoints](#6-backend--endpoints)
7. [Backend — Contratos de Request/Response](#7-backend--contratos-de-requestresponse)
8. [Backend — Validações](#8-backend--validações)
9. [Backend — Autenticação](#9-backend--autenticação)
10. [Backend — Idempotência](#10-backend--idempotência)
11. [Backend — Códigos de Erro Padronizados](#11-backend--códigos-de-erro-padronizados)
12. [Backend — Logs e Rastreabilidade](#12-backend--logs-e-rastreabilidade)
13. [Comunicação — Fluxo Completo](#13-comunicação--fluxo-completo)
14. [Comunicação — Estados do Pedido](#14-comunicação--estados-do-pedido)
15. [Exemplos Reais de Payloads](#15-exemplos-reais-de-payloads)

---

## 1. Visão Geral da Arquitetura

```
┌─────────────────────┐         ┌────────────────────────┐         ┌──────────────┐
│      FRONTEND       │  HTTP   │        BACKEND         │  HTTP   │     ERP      │
│  (Vite / React)     │────────▶│    (API REST / Node)   │────────▶│  (caixa-preta│
│                     │◀────────│                        │◀────────│   legado)    │
│  Catálogo + Checkout│  JSON   │  Validação, Persistência│  JSON   │              │
└─────────────────────┘         │  Logs, Idempotência    │         └──────────────┘
                                └────────────────────────┘
```

**Responsabilidades:**

| Camada | Responsabilidade |
|--------|-----------------|
| **Frontend** | Coletar dados do cliente e itens do carrinho, validar no cliente, enviar JSON para a API |
| **Backend** | Receber o pedido, validar regras de negócio, persistir, gerar ID único, expor para consumo externo |
| **ERP** | Fora do escopo — consome os dados da API quando necessário |

---

## 2. Frontend — Fluxo de Criação do Pedido

### 2.1 — Fluxo do Usuário

```
┌──────────┐    ┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌───────────┐
│ Catálogo │───▶│ Carrinho │───▶│   Checkout   │───▶│  Envio API   │───▶│ Confirmação│
│ (browse) │    │ (review) │    │ (dados pessoais)│  │ + WhatsApp   │    │  (sucesso) │
└──────────┘    └──────────┘    └──────────────┘    └──────────────┘    └───────────┘
```

### 2.2 — Detalhamento por Etapa

| Etapa | Rota | Ação |
|-------|------|------|
| **1. Catálogo** | `/` | Usuário navega pelos produtos e adiciona itens ao carrinho |
| **2. Carrinho** | `/carrinho` | Revisão de itens, ajuste de quantidades, visualização de subtotal |
| **3. Checkout** | `/checkout` | Preenchimento do formulário com dados do cliente |
| **4. Envio** | — | Frontend chama `POST /api/orders`, abre WhatsApp, limpa carrinho |
| **5. Confirmação** | `/checkout` (estado interno) | Tela de sucesso com opção de reenviar WhatsApp |

### 2.3 — Quando o pedido é enviado para a API

O pedido é enviado para a API **no momento em que o cliente clica no botão "Enviar Pedido"**, **antes** de abrir a janela do WhatsApp. A sequência exata é:

```typescript
// 1. Persiste o pedido na API
await ordersApi.create(order, orderItems);

// 2. Abre o WhatsApp com o resumo formatado
window.open(whatsappUrl, "_blank");

// 3. Limpa o carrinho local
clearCart();

// 4. Altera estado para "submitted"
setSubmitted(true);
```

> **Importante:** O pedido é persistido **independentemente** do envio via WhatsApp. Mesmo que o usuário feche a janela do WhatsApp sem enviar a mensagem, o pedido já estará registrado na API.

### 2.4 — Gerenciamento de Estado do Carrinho

O carrinho é gerenciado em memória via React Context (`CartContext`). **Não há persistência local** (localStorage/sessionStorage). Se o usuário recarregar a página, o carrinho é perdido.

**Interface do item no carrinho:**

```typescript
interface CartItem {
  product: {
    id: string;        // UUID do produto
    name: string;      // Nome do produto
    code: string | null; // Código/SKU
    price: number;     // Preço unitário
    // ... demais campos do produto
  };
  quantity: number;    // Quantidade selecionada
}
```

---

## 3. Frontend — Estrutura do JSON Enviado

### 3.1 — Payload enviado ao `POST /api/orders`

O frontend envia um único objeto contendo o cabeçalho do pedido e a lista de itens:

```json
{
  "order": {
    "customer_name": "João Silva",
    "customer_phone": "(11) 99999-9999",
    "customer_cpf_cnpj": "123.456.789-00",
    "payment_method": "Cartão 3x",
    "notes": "Entregar no período da tarde",
    "subtotal": 459.70,
    "shipping_fee": 15.00,
    "total": 474.70,
    "status": "pending"
  },
  "items": [
    {
      "product_id": "550e8400-e29b-41d4-a716-446655440001",
      "product_name": "Camiseta Básica Preta",
      "product_code": "SKU-001",
      "quantity": 2,
      "unit_price": 79.90,
      "total_price": 159.80
    },
    {
      "product_id": "550e8400-e29b-41d4-a716-446655440002",
      "product_name": "Tênis Runner Pro",
      "product_code": null,
      "quantity": 1,
      "unit_price": 299.90,
      "total_price": 299.90
    }
  ]
}
```

### 3.2 — Dicionário de Campos — `order`

| Campo | Tipo | Obrigatório | Regra | Exemplo |
|-------|------|:-----------:|-------|---------|
| `customer_name` | string | ✅ | min 2 caracteres, max 100 | `"João Silva"` |
| `customer_phone` | string | ✅ | min 10 dígitos (sem máscara) | `"(11) 99999-9999"` |
| `customer_cpf_cnpj` | string \| null | ❌ | 11 dígitos (CPF) ou 14 (CNPJ) | `"123.456.789-00"` |
| `payment_method` | string \| null | condicional | Obrigatório se condições de pagamento estão ativas | `"Cartão 3x"` |
| `notes` | string \| null | ❌ | max 500 caracteres | `"Entregar de manhã"` |
| `subtotal` | number | ✅ | >= 0, soma dos `total_price` dos itens | `459.70` |
| `shipping_fee` | number | ✅ | >= 0, valor fixo configurado pela loja | `15.00` |
| `total` | number | ✅ | = subtotal + shipping_fee | `474.70` |
| `status` | string | ✅ | Sempre `"pending"` no envio | `"pending"` |

### 3.3 — Dicionário de Campos — `items[]`

| Campo | Tipo | Obrigatório | Regra | Exemplo |
|-------|------|:-----------:|-------|---------|
| `product_id` | string (UUID) | ✅ | UUID válido referenciando um produto | `"550e8400-..."` |
| `product_name` | string | ✅ | Snapshot do nome no momento da compra | `"Camiseta Preta"` |
| `product_code` | string \| null | ❌ | Código/SKU do produto (se existir) | `"SKU-001"` |
| `quantity` | integer | ✅ | >= 1 | `2` |
| `unit_price` | number | ✅ | >= 0, preço unitário no momento da compra | `79.90` |
| `total_price` | number | ✅ | = unit_price × quantity | `159.80` |

---

## 4. Frontend — Validações

### 4.1 — Regras de Validação no Cliente

O botão "Enviar Pedido" só é habilitado quando **todas** as condições são atendidas:

```typescript
const isValid =
  // 1. Nome com pelo menos 2 caracteres
  data.name.trim().length >= 2 &&
  
  // 2. Telefone com pelo menos 10 dígitos numéricos
  data.phone.replace(/\D/g, "").length >= 10 &&
  
  // 3. Condição de pagamento selecionada (se o módulo estiver ativo)
  (!paymentEnabled || !activeConditions.length || selectedPayment !== "") &&
  
  // 4. Pedido mínimo atendido (se configurado)
  !belowMinimum;
```

### 4.2 — Detalhamento das Validações

| Campo | Validação | Comportamento |
|-------|-----------|---------------|
| `name` | `trim().length >= 2` | Botão desabilitado se inválido |
| `phone` | `replace(/\D/g, "").length >= 10` | Máscara automática `(XX) XXXXX-XXXX` |
| `cpfCnpj` | Sem validação de dígito verificador | Máscara automática CPF/CNPJ, max 14 dígitos |
| `payment_method` | Obrigatório se módulo de pagamento ativo | Grid de botões, selecionar = obrigatório |
| `notes` | `maxLength={500}` | Textarea com limite |
| `items` | `items.length > 0` | Redireciona para catálogo se vazio |
| `subtotal` | `>= minimumOrderValue` (se configurado) | Mensagem de alerta, botão desabilitado |

### 4.3 — Formatações Automáticas

| Campo | Entrada do Usuário | Valor Formatado |
|-------|-------------------|-----------------|
| Telefone | `11999999999` | `(11) 99999-9999` |
| CPF | `12345678900` | `123.456.789-00` |
| CNPJ | `12345678000100` | `12.345.678/0001-00` |

> **Nota:** As máscaras são aplicadas em tempo real durante a digitação. O valor enviado à API é o texto com máscara (ex: `"(11) 99999-9999"`).

---

## 5. Frontend — Tratamento de Respostas

### 5.1 — Fluxo de Sucesso

```
POST /api/orders → 200/201
    ↓
Abre WhatsApp (window.open)
    ↓
Limpa carrinho (clearCart)
    ↓
Exibe tela de confirmação (setSubmitted(true))
```

Na tela de confirmação:
- ✅ Ícone de sucesso verde
- 📱 Botão "Reenviar Pedido pelo WhatsApp" (usando URL salva)
- 🏠 Botão "Voltar ao Catálogo"

### 5.2 — Fluxo de Erro

Atualmente, o frontend **não exibe feedback visual de erro** da API ao usuário. O `ordersApi.create()` retorna `{ error }` mas o resultado não é verificado no componente de checkout.

**Recomendação de implementação futura:**

```typescript
const { error } = await ordersApi.create(order, orderItems);

if (error) {
  toast({
    title: "Erro ao registrar pedido",
    description: "O pedido será enviado via WhatsApp, mas pode não constar no painel.",
    variant: "destructive",
  });
  // Continua com o envio do WhatsApp mesmo em caso de erro na API
}
```

> **Decisão arquitetural:** O WhatsApp é o canal primário de comunicação. A persistência na API é secundária — uma falha não deve impedir o envio do pedido ao vendedor.

### 5.3 — Respostas esperadas da API

| Cenário | Status HTTP | Ação do Frontend |
|---------|:-----------:|-----------------|
| Pedido criado | `200` ou `201` | Abre WhatsApp + tela de sucesso |
| Erro de validação | `400` | (futuro) Exibe toast de erro |
| Erro interno | `500` | (futuro) Exibe toast de erro |
| Rede indisponível | — | (futuro) Exibe toast de erro |

---

## 6. Backend — Endpoints

### 6.1 — Tabela de Endpoints de Pedidos

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|:------------:|
| `POST` | `/api/orders` | Criar novo pedido | ❌ Pública |
| `GET` | `/api/orders` | Listar todos os pedidos | ✅ Admin |
| `GET` | `/api/orders/:id/items` | Listar itens de um pedido | ✅ Admin |
| `PUT` | `/api/orders/:id` | Atualizar status do pedido | ✅ Admin |

### 6.2 — Notas de Autenticação por Endpoint

- **`POST /api/orders`** — Acesso público. Qualquer visitante do catálogo pode criar um pedido sem autenticação (checkout sem login).
- **Demais endpoints** — Restritos ao painel administrativo. No modo local (PostgreSQL), não há autenticação (admin aberto). No modo cloud, são protegidos por RLS com role `admin`.

---

## 7. Backend — Contratos de Request/Response

### 7.1 — `POST /api/orders` — Criar Pedido

**Request Body:**

```json
{
  "order": {
    "customer_name": "Maria Santos",
    "customer_phone": "(11) 98888-7777",
    "customer_cpf_cnpj": "12.345.678/0001-00",
    "payment_method": "Boleto",
    "notes": "Entregar no período da tarde",
    "subtotal": 239.70,
    "shipping_fee": 0,
    "total": 239.70,
    "status": "pending"
  },
  "items": [
    {
      "product_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "product_name": "Camiseta Básica Preta",
      "product_code": "SKU-001",
      "quantity": 3,
      "unit_price": 79.90,
      "total_price": 239.70
    }
  ]
}
```

**Response — Sucesso (200):**

```json
{
  "success": true,
  "order_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
}
```

**Response — Erro de Validação (400):**

```json
{
  "error": "customer_name is required",
  "code": "VALIDATION_ERROR"
}
```

**Response — Erro Interno (500):**

```json
{
  "error": "Internal server error",
  "code": "INTERNAL_ERROR"
}
```

---

### 7.2 — `GET /api/orders` — Listar Pedidos

**Request:** Sem body. Query params opcionais.

| Param | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `status` | string | — | Filtrar por status (`pending`, `confirmed`, etc.) |
| `since` | string (ISO 8601) | — | Pedidos a partir desta data |
| `limit` | number | 50 | Máx. de resultados |

**Response (200):**

```json
[
  {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "customer_name": "Maria Santos",
    "customer_phone": "(11) 98888-7777",
    "customer_cpf_cnpj": "12.345.678/0001-00",
    "payment_method": "Boleto",
    "notes": "Entregar no período da tarde",
    "subtotal": 239.70,
    "shipping_fee": 0,
    "total": 239.70,
    "status": "pending",
    "created_at": "2026-02-12T14:30:00Z",
    "updated_at": "2026-02-12T14:30:00Z"
  }
]
```

---

### 7.3 — `GET /api/orders/:id/items` — Itens do Pedido

**Response (200):**

```json
[
  {
    "id": "item-uuid-001",
    "order_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "product_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "product_name": "Camiseta Básica Preta",
    "product_code": "SKU-001",
    "quantity": 3,
    "unit_price": 79.90,
    "total_price": 239.70,
    "created_at": "2026-02-12T14:30:00Z"
  }
]
```

---

### 7.4 — `PUT /api/orders/:id` — Atualizar Status

**Request Body:**

```json
{
  "status": "confirmed"
}
```

**Response (200):**

```json
{
  "id": "f47ac10b-...",
  "status": "confirmed",
  "updated_at": "2026-02-12T15:00:00Z"
}
```

---

## 8. Backend — Validações

### 8.1 — Validações no `POST /api/orders`

| Campo | Regra | Código de Erro |
|-------|-------|---------------|
| `order` | Objeto obrigatório | `VALIDATION_ERROR` |
| `order.customer_name` | String, não vazia, 2-100 caracteres | `VALIDATION_ERROR` |
| `order.customer_phone` | String, não vazia, mín. 10 dígitos numéricos | `VALIDATION_ERROR` |
| `order.customer_cpf_cnpj` | String ou null, se presente: 11 ou 14 dígitos | `VALIDATION_ERROR` |
| `order.subtotal` | Número >= 0 | `VALIDATION_ERROR` |
| `order.shipping_fee` | Número >= 0 | `VALIDATION_ERROR` |
| `order.total` | Número >= 0, deve ser = subtotal + shipping_fee | `VALIDATION_ERROR` |
| `order.status` | Se fornecido, deve ser `"pending"` | `VALIDATION_ERROR` |
| `items` | Array não vazio | `VALIDATION_ERROR` |
| `items[].product_name` | String, não vazia | `VALIDATION_ERROR` |
| `items[].quantity` | Inteiro >= 1 | `VALIDATION_ERROR` |
| `items[].unit_price` | Número >= 0 | `VALIDATION_ERROR` |
| `items[].total_price` | Número >= 0 | `VALIDATION_ERROR` |

### 8.2 — Exemplo de schema Zod (recomendado)

```typescript
import { z } from "zod";

const OrderItemSchema = z.object({
  product_id: z.string().uuid().nullable(),
  product_name: z.string().trim().min(1).max(255),
  product_code: z.string().max(100).nullable(),
  quantity: z.number().int().min(1),
  unit_price: z.number().nonnegative(),
  total_price: z.number().nonnegative(),
});

const CreateOrderSchema = z.object({
  order: z.object({
    customer_name: z.string().trim().min(2).max(100),
    customer_phone: z.string().trim().min(10).max(20),
    customer_cpf_cnpj: z.string().max(20).nullable(),
    payment_method: z.string().max(100).nullable(),
    notes: z.string().max(500).nullable(),
    subtotal: z.number().nonnegative(),
    shipping_fee: z.number().nonnegative(),
    total: z.number().nonnegative(),
    status: z.literal("pending").default("pending"),
  }),
  items: z.array(OrderItemSchema).min(1),
});
```

---

## 9. Backend — Autenticação

### 9.1 — Modelo de Autenticação por Modo

| Modo | Endpoint Público | Endpoints Admin | Mecanismo |
|------|:----------------:|:---------------:|-----------|
| **PostgreSQL local** | Sem auth | Sem auth (admin aberto) | Nenhum |
| **Cloud (Supabase)** | Sem auth | JWT via Supabase Auth | RLS policies |

### 9.2 — Detalhamento

**Criação de pedido (`POST /api/orders`):**
- Sempre **público** (sem autenticação)
- Justificativa: clientes finalizam pedidos como visitantes, sem necessidade de cadastro

**Consulta e gestão (`GET`, `PUT`):**
- No modo local: acesso direto, sem proteção
- No modo cloud: protegido por Row-Level Security com role `admin`

### 9.3 — Consumo Externo (ERP)

Para que o ERP consuma os pedidos da API, o modelo de autenticação recomendado é **API Key via header**:

```
Authorization: Bearer <API_TOKEN>
```

O token é configurado no painel admin (aba ERP) e armazenado na tabela `store_settings` com a chave `erp_api_token`.

---

## 10. Backend — Idempotência

### 10.1 — Estratégia Atual

Atualmente, **não há idempotência** implementada no `POST /api/orders`. Cada chamada cria um novo pedido com um UUID gerado automaticamente pelo banco.

### 10.2 — Recomendação de Implementação

Para evitar pedidos duplicados (ex: usuário clicou duas vezes no botão):

**Frontend — Desabilitar botão após primeiro clique:**

```typescript
const [submitting, setSubmitting] = useState(false);

const handleSubmit = async () => {
  if (submitting) return;  // Guard clause
  setSubmitting(true);
  // ... lógica de envio
};
```

**Backend — Chave de idempotência via header:**

```
X-Idempotency-Key: <uuid-gerado-pelo-frontend>
```

| Cenário | Comportamento |
|---------|--------------|
| Primeira chamada com chave X | Cria pedido, retorna `201` |
| Segunda chamada com mesma chave X | Retorna pedido existente, `200` |
| Chamada sem chave | Cria novo pedido (comportamento atual) |

> **Status atual:** Não implementado. O frontend depende apenas do `disabled` do botão para evitar duplicatas.

---

## 11. Backend — Códigos de Erro Padronizados

### 11.1 — Tabela de Códigos HTTP

| Código HTTP | Código Interno | Significado | Quando Ocorre |
|:-----------:|---------------|-------------|---------------|
| `200` | — | Sucesso | Pedido criado / consulta OK |
| `201` | — | Criado | Pedido criado (alternativo) |
| `400` | `VALIDATION_ERROR` | Dados inválidos | Campos obrigatórios ausentes ou fora do formato |
| `401` | `UNAUTHORIZED` | Não autorizado | Token ausente ou inválido (endpoints admin) |
| `404` | `NOT_FOUND` | Não encontrado | Pedido com ID inexistente |
| `409` | `DUPLICATE` | Duplicado | Chave de idempotência já processada |
| `422` | `BUSINESS_RULE` | Regra de negócio | Pedido abaixo do mínimo, produto inativo, etc. |
| `500` | `INTERNAL_ERROR` | Erro interno | Falha inesperada no servidor |

### 11.2 — Formato Padrão de Erro

```json
{
  "error": "Mensagem descritiva legível por humanos",
  "code": "VALIDATION_ERROR",
  "details": [
    { "field": "customer_name", "message": "Required" },
    { "field": "items", "message": "Must contain at least 1 item" }
  ]
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|:-----------:|-----------|
| `error` | string | ✅ | Mensagem principal de erro |
| `code` | string | ✅ | Código máquina para tratamento programático |
| `details` | array | ❌ | Lista de erros por campo (para validação) |

---

## 12. Backend — Logs e Rastreabilidade

### 12.1 — Informações que Devem Ser Logadas

| Evento | Nível | Dados Logados |
|--------|-------|---------------|
| Pedido recebido | `INFO` | `order_id`, `customer_name`, `total`, `items_count`, timestamp |
| Pedido criado com sucesso | `INFO` | `order_id`, timestamp |
| Erro de validação | `WARN` | campos inválidos, payload parcial (sem dados sensíveis) |
| Erro interno | `ERROR` | stack trace, `order_id` (se disponível) |
| Status atualizado | `INFO` | `order_id`, `old_status`, `new_status` |

### 12.2 — Formato de Log Recomendado

```json
{
  "timestamp": "2026-02-12T14:30:00.123Z",
  "level": "INFO",
  "event": "ORDER_CREATED",
  "order_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "customer_name": "Maria Santos",
  "total": 239.70,
  "items_count": 1,
  "source": "web_checkout"
}
```

### 12.3 — Dados que NÃO devem ser logados

- CPF / CNPJ completo (mascarar: `***.***.789-00`)
- Telefone completo (mascarar: `(**) *****-7777`)
- Tokens de autenticação

### 12.4 — Rastreabilidade

Cada pedido recebe um `id` (UUID v4) gerado automaticamente no momento da persistência. Este ID é o identificador principal para:

- Correlação entre `orders` e `order_items`
- Referência para o ERP ao consumir pedidos
- Logs e auditoria
- Atualização de status

---

## 13. Comunicação — Fluxo Completo

### 13.1 — Diagrama de Sequência

```
┌──────────┐       ┌──────────┐       ┌──────────┐       ┌──────────┐
│ Usuário  │       │ Frontend │       │ Backend  │       │ WhatsApp │
│ (browser)│       │  (Vite)  │       │(API REST)│       │  (ext.)  │
└────┬─────┘       └────┬─────┘       └────┬─────┘       └────┬─────┘
     │                  │                  │                   │
     │  1. Preenche     │                  │                   │
     │  formulário      │                  │                   │
     │─────────────────▶│                  │                   │
     │                  │                  │                   │
     │                  │  2. POST /orders │                   │
     │                  │─────────────────▶│                   │
     │                  │                  │                   │
     │                  │                  │ 3. Valida dados   │
     │                  │                  │ 4. Gera UUID      │
     │                  │                  │ 5. Persiste       │
     │                  │                  │                   │
     │                  │  6. { order_id } │                   │
     │                  │◀─────────────────│                   │
     │                  │                  │                   │
     │                  │  7. window.open  │                   │
     │                  │─────────────────────────────────────▶│
     │                  │                  │                   │
     │                  │  8. clearCart()   │                   │
     │                  │  9. Tela sucesso │                   │
     │  10. Confirmação │                  │                   │
     │◀─────────────────│                  │                   │
     │                  │                  │                   │
```

### 13.2 — Descrição dos Passos

| # | Ator | Ação | Detalhes |
|:-:|------|------|---------|
| 1 | Usuário | Preenche formulário | Nome, telefone, CPF/CNPJ, pagamento, observações |
| 2 | Frontend | Envia pedido | `POST /api/orders` com JSON completo |
| 3 | Backend | Valida dados | Schema validation (campos obrigatórios, tipos, limites) |
| 4 | Backend | Gera UUID | `gen_random_uuid()` para o pedido |
| 5 | Backend | Persiste | Insere em `orders` + `order_items` |
| 6 | Backend | Retorna resposta | `{ success: true, order_id: "..." }` |
| 7 | Frontend | Abre WhatsApp | `window.open("https://wa.me/...")` com mensagem formatada |
| 8 | Frontend | Limpa carrinho | `clearCart()` — remove todos os itens da memória |
| 9 | Frontend | Exibe confirmação | Tela com ícone de sucesso e botão de reenvio |
| 10 | Usuário | Visualiza resultado | Pode reenviar WhatsApp ou voltar ao catálogo |

---

## 14. Comunicação — Estados do Pedido

### 14.1 — Máquina de Estados

```
                    ┌───────────┐
                    │  pending   │ ← Estado inicial (criado pelo checkout)
                    └─────┬─────┘
                          │
                   ┌──────┴──────┐
                   ▼             ▼
            ┌───────────┐  ┌───────────┐
            │ confirmed │  │ cancelled │
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
            │ delivered │
            └───────────┘
```

### 14.2 — Detalhamento dos Estados

| Estado | Descrição | Quem Altera | Como |
|--------|-----------|-------------|------|
| `pending` | Pedido criado, aguardando processamento | Sistema (automático) | Criação via checkout |
| `confirmed` | Pedido aceito e validado | Admin ou ERP | `PUT /api/orders/:id` |
| `processing` | Em separação / preparação | Admin ou ERP | `PUT /api/orders/:id` |
| `shipped` | Enviado / despachado | Admin ou ERP | `PUT /api/orders/:id` |
| `delivered` | Entregue ao cliente | Admin ou ERP | `PUT /api/orders/:id` |
| `cancelled` | Pedido cancelado | Admin | `PUT /api/orders/:id` |

### 14.3 — Transições Válidas

| De → Para | Permitido | Observação |
|-----------|:---------:|------------|
| `pending` → `confirmed` | ✅ | Fluxo normal |
| `pending` → `cancelled` | ✅ | Cancelamento antes de processar |
| `confirmed` → `processing` | ✅ | Início da separação |
| `confirmed` → `cancelled` | ✅ | Cancelamento após confirmação |
| `processing` → `shipped` | ✅ | Despacho |
| `shipped` → `delivered` | ✅ | Entrega finalizada |
| `delivered` → qualquer | ❌ | Estado final |
| `cancelled` → qualquer | ❌ | Estado final |

> **Nota:** Atualmente o backend **não valida transições de estado** — aceita qualquer valor no `PUT`. A validação de transições é recomendada mas não implementada.

---

## 15. Exemplos Reais de Payloads

### 15.1 — Pedido Simples (sem frete, sem pagamento)

**Request:**
```json
{
  "order": {
    "customer_name": "Ana Costa",
    "customer_phone": "(21) 97777-6666",
    "customer_cpf_cnpj": null,
    "payment_method": null,
    "notes": null,
    "subtotal": 79.90,
    "shipping_fee": 0,
    "total": 79.90,
    "status": "pending"
  },
  "items": [
    {
      "product_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "product_name": "Camiseta Básica Branca",
      "product_code": "CAM-001",
      "quantity": 1,
      "unit_price": 79.90,
      "total_price": 79.90
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "order_id": "d4e5f6a7-b8c9-0123-def4-567890123456"
}
```

---

### 15.2 — Pedido Completo (frete + pagamento + CNPJ + múltiplos itens)

**Request:**
```json
{
  "order": {
    "customer_name": "Distribuidora ABC Ltda",
    "customer_phone": "(11) 3333-4444",
    "customer_cpf_cnpj": "12.345.678/0001-90",
    "payment_method": "Boleto 30/60/90",
    "notes": "Entregar no depósito. Portão 3. Horário comercial.",
    "subtotal": 1897.40,
    "shipping_fee": 25.00,
    "total": 1922.40,
    "status": "pending"
  },
  "items": [
    {
      "product_id": "a1b2c3d4-0001-0000-0000-000000000001",
      "product_name": "Torneira Monocomando Cromada",
      "product_code": "TORN-MC-001",
      "quantity": 5,
      "unit_price": 189.90,
      "total_price": 949.50
    },
    {
      "product_id": "a1b2c3d4-0001-0000-0000-000000000002",
      "product_name": "Sifão Flexível Universal",
      "product_code": "SIF-FLEX-002",
      "quantity": 10,
      "unit_price": 34.90,
      "total_price": 349.00
    },
    {
      "product_id": "a1b2c3d4-0001-0000-0000-000000000003",
      "product_name": "Registro de Pressão 3/4\"",
      "product_code": "REG-P34-003",
      "quantity": 20,
      "unit_price": 29.95,
      "total_price": 599.00
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "order_id": "e5f6a7b8-c9d0-1234-ef56-789012345678"
}
```

---

### 15.3 — Erro de Validação

**Request (sem nome do cliente):**
```json
{
  "order": {
    "customer_name": "",
    "customer_phone": "(11) 99999-9999",
    "subtotal": 100,
    "shipping_fee": 0,
    "total": 100,
    "status": "pending"
  },
  "items": [
    {
      "product_id": "a1b2c3d4-0001-0000-0000-000000000001",
      "product_name": "Produto X",
      "product_code": null,
      "quantity": 1,
      "unit_price": 100,
      "total_price": 100
    }
  ]
}
```

**Response (400):**
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "order.customer_name",
      "message": "String must contain at least 2 character(s)"
    }
  ]
}
```

---

### 15.4 — Consulta de Pedidos (pelo ERP ou Admin)

**Request:**
```
GET /api/orders?status=pending
Authorization: Bearer <TOKEN>
```

**Response (200):**
```json
[
  {
    "id": "d4e5f6a7-b8c9-0123-def4-567890123456",
    "customer_name": "Ana Costa",
    "customer_phone": "(21) 97777-6666",
    "customer_cpf_cnpj": null,
    "payment_method": null,
    "notes": null,
    "subtotal": 79.90,
    "shipping_fee": 0,
    "total": 79.90,
    "status": "pending",
    "created_at": "2026-02-12T14:30:00Z",
    "updated_at": "2026-02-12T14:30:00Z"
  },
  {
    "id": "e5f6a7b8-c9d0-1234-ef56-789012345678",
    "customer_name": "Distribuidora ABC Ltda",
    "customer_phone": "(11) 3333-4444",
    "customer_cpf_cnpj": "12.345.678/0001-90",
    "payment_method": "Boleto 30/60/90",
    "notes": "Entregar no depósito. Portão 3.",
    "subtotal": 1897.40,
    "shipping_fee": 25.00,
    "total": 1922.40,
    "status": "pending",
    "created_at": "2026-02-12T15:45:00Z",
    "updated_at": "2026-02-12T15:45:00Z"
  }
]
```

---

### 15.5 — Atualização de Status (pelo ERP ou Admin)

**Request:**
```
PUT /api/orders/d4e5f6a7-b8c9-0123-def4-567890123456
Content-Type: application/json
Authorization: Bearer <TOKEN>

{
  "status": "confirmed"
}
```

**Response (200):**
```json
{
  "id": "d4e5f6a7-b8c9-0123-def4-567890123456",
  "customer_name": "Ana Costa",
  "status": "confirmed",
  "updated_at": "2026-02-12T16:00:00Z"
}
```

---

## Apêndice — Resumo para o Desenvolvedor ERP

Para consumir os pedidos desta API, o ERP precisa:

1. **Consultar pedidos pendentes:** `GET /api/orders?status=pending`
2. **Buscar itens do pedido:** `GET /api/orders/:id/items`
3. **Confirmar processamento:** `PUT /api/orders/:id` com `{ "status": "confirmed" }`
4. **Atualizar progresso:** `PUT /api/orders/:id` com status apropriado

O ERP é tratado como uma **caixa-preta** — esta documentação não prescreve como os dados devem ser processados internamente. O contrato se limita aos JSONs de request/response descritos acima.
