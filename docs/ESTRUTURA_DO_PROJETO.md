# 📁 Documentação Completa da Estrutura do Projeto

> Catálogo digital de produtos com envio de pedidos via WhatsApp, painel administrativo, sistema de vendedores, Modo TV e arquitetura dual-mode (Supabase / PostgreSQL local).

---

## 📌 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura Dual-Mode](#arquitetura-dual-mode)
3. [src/main.tsx — Ponto de Entrada](#srcmaintsx)
4. [src/App.tsx — Roteamento](#srcapptsx)
5. [src/index.css — Design System](#srcindexcss)
6. [src/assets/ — Imagens Estáticas](#srcassets)
7. [src/pages/ — Páginas da Aplicação](#srcpages)
8. [src/components/ — Componentes Públicos](#srccomponents)
9. [src/components/admin/ — Painel Administrativo](#srccomponentsadmin)
10. [src/components/ui/ — Biblioteca de UI (shadcn)](#srccomponentsui)
11. [src/contexts/ — Contextos React](#srccontexts)
12. [src/hooks/ — Hooks Customizados](#srchooks)
13. [src/lib/ — Utilitários e Camada de API](#srclib)
14. [src/integrations/ — Integração Supabase](#srcintegrations)
15. [server/ — Backend Express.js (Modo PostgreSQL)](#server)
16. [supabase/ — Configuração Cloud](#supabase)
17. [docs/ — Documentação Técnica](#docs)
18. [Arquivos de Configuração (raiz)](#arquivos-de-configuração)
19. [Sistema de Vendedores](#sistema-de-vendedores)
20. [Modo TV](#modo-tv)
21. [Fluxo de Dados Resumido](#fluxo-de-dados-resumido)

---

## Visão Geral

O projeto é um **catálogo digital de produtos** construído com:

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Estilização | Tailwind CSS + shadcn/ui |
| Estado Global | React Context (Carrinho, Vendedor) + React Query |
| Backend (Cloud) | Supabase (Auth, Database, Storage, Realtime) |
| Backend (Local) | Express.js + PostgreSQL 15+ |
| Pedidos | Persistidos no banco → enviados via WhatsApp |

**Funcionalidades principais:**
- Catálogo público responsivo com busca, filtros e categorias
- Sacola de compras com checkout e envio via WhatsApp
- Sistema de vendedores com links personalizados (`/v/:slug`)
- Modo TV para vitrines digitais em TVs/monitores (`/tv`)
- Painel administrativo completo com dashboard de vendas
- Gestão de estoque com controle de quantidade
- Importação de produtos via Excel/CSV e imagens em lote
- Integração com sistemas ERP via API REST
- Arquitetura dual-mode (Supabase Cloud ou PostgreSQL local)

---

## Arquitetura Dual-Mode

O sistema opera em dois modos, controlado pela variável `VITE_API_MODE`:

```
┌─────────────────────────────────────────────────────┐
│                    Frontend React                    │
│                                                      │
│  Hooks → api-client.ts → Supabase OU REST (Express) │
└──────────────┬──────────────────────┬────────────────┘
               │ (default)            │ (VITE_API_MODE=postgres)
               ▼                      ▼
        ┌──────────┐          ┌──────────────┐
        │ Supabase │          │ Express.js   │
        │ Cloud    │          │ + PostgreSQL │
        └──────────┘          └──────────────┘
```

A camada `src/lib/api-client.ts` abstrai essa decisão. Todos os hooks chamam o api-client, **nunca** o Supabase ou fetch diretamente.

---

## src/main.tsx

**O que faz:** Ponto de entrada da aplicação. Monta o componente `<App />` na DOM.

```
createRoot → #root → <App />
```

Também importa `index.css` que contém todo o design system (variáveis CSS, temas claro/escuro).

---

## src/App.tsx

**O que faz:** Define o roteamento da aplicação e os providers globais.

| Rota | Página | Descrição |
|---|---|---|
| `/` | `Index` | Catálogo público de produtos |
| `/produto/:slug` | `ProductDetail` | Detalhe de um produto |
| `/sacola` | `Cart` | Sacola de compras |
| `/checkout` | `Checkout` | Finalização do pedido |
| `/v/:sellerSlug/*` | `CatalogRoutes` | Catálogo com vendedor vinculado |
| `/admin` | `Admin` | Painel administrativo |
| `/tv` | `TvMode` | Modo TV (vitrine digital) |
| `*` | `NotFound` | Página 404 |

**Providers empilhados:**
1. `QueryClientProvider` — cache de dados (React Query)
2. `TooltipProvider` — tooltips globais
3. `CartProvider` — estado do carrinho de compras
4. `Toaster` / `Sonner` — notificações toast

**Roteamento de vendedores:**
A rota `/v/:sellerSlug/*` envolve o catálogo com `SellerProvider`, que identifica o vendedor pela URL e persiste a atribuição durante toda a navegação. As rotas internas (`/`, `/produto/:slug`, `/checkout`, `/sacola`) funcionam normalmente dentro do contexto do vendedor.

---

## src/index.css

**O que faz:** Define o design system completo da aplicação com variáveis CSS HSL. Inclui temas claro e escuro, cores semânticas (`--primary`, `--background`, `--destructive`, etc.), e estilos de componentes como o WhatsApp button e badges de promoção.

---

## src/assets/

**O que faz:** Armazena imagens estáticas importadas via ES6 modules no código.

| Arquivo | Uso |
|---|---|
| `product-bag.jpg` | Imagem placeholder de bolsa |
| `product-cap.jpg` | Imagem placeholder de boné |
| `product-jacket.jpg` | Imagem placeholder de jaqueta |
| `product-running.jpg` | Imagem placeholder de tênis corrida |
| `product-sneaker.jpg` | Imagem placeholder de tênis |
| `product-watch.jpg` | Imagem placeholder de relógio |

> Essas imagens são usadas apenas como demonstração. Produtos reais usam URLs armazenadas no banco.

---

## src/pages/

### `Index.tsx` — Página Principal (Catálogo)

**O que faz:** Exibe o catálogo público com:
- Header com logo, nome da loja e informações da empresa
- Carrossel de banners promocionais (proporção responsiva: 16:5 mobile, 19:5 desktop)
- Filtros: categoria, marca, busca textual, filtros rápidos (promoção, custom1, custom2)
- Ordenação por preço e nome
- Grid responsivo de produtos (2→5 colunas) com paginação "Carregar mais" (40 itens por vez)
- Modos de exibição da primeira página: `default`, `featured` (destaques primeiro), `random` (aleatório)
- Footer com redes sociais

### `ProductDetail.tsx` — Detalhe do Produto

**O que faz:** Exibe a página individual de um produto com:
- Imagem em tamanho grande
- Nome, código, descrição, referência, código do fabricante, unidade de medida
- Preço com suporte a desconto (preço original riscado + badge "OFERTA")
- Parcelamento configurável
- Botão "Comprar" que abre o `AddToCartDialog`
- Botão "Compartilhar produto" (copia link)
- Todas as informações exibidas são controladas pelas configurações do admin

### `Cart.tsx` — Sacola de Compras

**O que faz:** Lista os itens adicionados ao carrinho com:
- Imagem, nome e preço de cada item
- Controles de quantidade (−/+) por item
- Botão de remover item
- Total calculado automaticamente
- Botão "Prosseguir" para o Checkout
- Botão "Limpar sacola"

### `Checkout.tsx` — Finalização do Pedido

**O que faz:** Coleta dados do cliente e envia o pedido:
- Resumo do pedido com todos os itens e valores
- Formulário: Nome*, WhatsApp* (com máscara), CPF/CNPJ (com máscara), E-mail, Endereço (com busca por CEP via ViaCEP)
- Seleção de forma de pagamento (configurável pelo admin)
- Validação de pedido mínimo (configurável)
- Cálculo de frete fixo (configurável)
- Campos configuráveis: CPF, e-mail, endereço e observações podem ser ativados/desativados e definidos como obrigatórios pelo admin
- Persiste pedido no banco (`orders` + `order_items`) com chave de idempotência
- **Vendedor:** Se acessado via link de vendedor (`/v/:slug`), o pedido registra `seller_id` e `seller_name`, e a mensagem WhatsApp é enviada para o número do vendedor (se configurado)
- Gera mensagem formatada e abre WhatsApp
- Tela de confirmação com botão para reenviar pelo WhatsApp

### `Admin.tsx` — Painel Administrativo

**O que faz:** Interface de administração com navegação por abas (ícones):

| Aba | Componente | Descrição |
|---|---|---|
| Vendas | `SalesDashboard` | Dashboard de pedidos com filtros, status e impressão |
| Produtos | `ProductManager` | CRUD completo de produtos |
| Categorias | `CategoryManager` | Gerenciamento de categorias |
| Vendedores | `SellerManager` | CRUD de vendedores com links personalizados |
| Estoque | `StockManager` | Controle de quantidade e ocultação de esgotados |
| Modo TV | `TvModeSettings` | Configuração da vitrine digital |
| Importar | `ExcelImport` + `ImageImport` | Importação via Excel/CSV e imagens em lote |
| Catálogo | `CatalogCustomization` | Customização visual (cores, filtros, layout) |
| Config | `SettingsPanel` | Configurações gerais (branding, logística, WhatsApp) |
| ERP | `IntegrationPanel` | Painel de integração com sistemas externos |

Protegido por autenticação: exibe `AdminLogin` se não logado, tela de "Acesso negado" se não admin.

### `TvMode.tsx` — Modo TV (Vitrine Digital)

**O que faz:** Slideshow fullscreen para exibição de produtos em TVs/monitores (`/tv`):
- Rotação automática de produtos com fade transition (intervalo configurável)
- **Navbar opcional** no topo com logo, nome da loja e subtítulo (cores configuráveis)
- **Banners** exibidos fixamente abaixo da navbar, com rotação independente dos produtos
- Barra de progresso e contador de slides (opcionais)
- Três fontes de produtos: Últimos cadastrados, Destaques ou Seleção Manual
- Três tamanhos de exibição: Pequeno, Médio, Grande
- Cores configuráveis: fundo, texto, preço, navbar
- Elementos visíveis configuráveis: código, marca, desconto, logo, barra de progresso, contador
- Cursor oculto e select desabilitado (modo kiosk)
- Proteções: `useRef` para evitar memory leaks, cleanup de timers, safe index bounds

### `NotFound.tsx` — Página 404

**O que faz:** Exibe mensagem de erro quando uma rota não existe.

---

## src/components/

### Componentes Públicos (Catálogo)

| Componente | O que faz |
|---|---|
| **`CatalogHeader.tsx`** | Header do catálogo com logo, nome da loja, subtítulo, texto de boas-vindas e drawer com informações da empresa (telefone, email, endereço, horário) |
| **`BannerCarousel.tsx`** | Carrossel de banners promocionais usando Embla Carousel. Proporção responsiva (16:5 mobile, 19:5 desktop), lazy loading, autoplay configurável. Desativa scroll em banner único |
| **`CategoryFilter.tsx`** | Barra de filtros do catálogo: busca textual, seleção de categoria, filtros rápidos customizáveis, ordenação por preço/nome e filtro por marca |
| **`ProductCard.tsx`** | Card de produto no grid do catálogo. Exibe imagem, nome, código, marca, preço (com desconto), badge de promoção. Botão "Comprar" que abre o `AddToCartDialog` |
| **`AddToCartDialog.tsx`** | Dialog/modal para adicionar produto ao carrinho. Exibe imagem, nome, preço e campo de quantidade editável (input numérico + botões −/+). Confirma adição com toast |
| **`CartFloating.tsx`** | Botão flutuante da sacola que aparece quando há itens no carrinho. Mostra quantidade de itens e navega para `/sacola` |
| **`WhatsAppFloating.tsx`** | Botão flutuante do WhatsApp no canto inferior. Abre conversa com mensagem pré-formatada usando o número configurado nas settings |
| **`CatalogFooter.tsx`** | Footer do catálogo com nome da loja, links para redes sociais (Instagram, Facebook, TikTok, YouTube, Website) e créditos |
| **`CompanyInfoDrawer.tsx`** | Drawer lateral com informações da empresa: telefone, email, endereço, horário de funcionamento e descrição |
| **`NavLink.tsx`** | Componente utilitário de link de navegação com estilo ativo |

---

## src/components/admin/

### Componentes do Painel Administrativo

| Componente | O que faz |
|---|---|
| **`AdminLogin.tsx`** | Tela de login/cadastro do administrador. Formulário com email e senha, alternância entre login e signup, botão "Tornar admin" para primeiro acesso |
| **`SalesDashboard.tsx`** | Dashboard de vendas com lista de pedidos, filtros por período, visualização de itens do pedido, atualização de status e impressão formatada |
| **`ProductManager.tsx`** | Interface unificada de gerenciamento de produtos. Inclui busca, filtro por categoria, paginação de 50 itens, atualização de categoria em lote (bulk), diagnóstico de produtos sem foto, e slot para o formulário de edição |
| **`ProductForm.tsx`** | Formulário de criação/edição de produto. Campos: nome, código, slug (auto-gerado), preço, preço original, categoria, marca, descrição, referência, código fabricante, unidade de medida, quantidade, imagem (upload), ativo, destaque |
| **`ProductList.tsx`** | Componente de listagem de produtos em formato tabular. Usado internamente pelo ProductManager |
| **`ProductsWithoutPhoto.tsx`** | Ferramenta de diagnóstico que lista produtos sem imagem. Permite upload direto de foto na listagem para correção rápida |
| **`CategoryManager.tsx`** | CRUD de categorias. Adicionar, editar nome/slug e excluir categorias |
| **`SellerManager.tsx`** | CRUD de vendedores. Criar, editar, ativar/desativar e excluir vendedores. Gera slug automático, valida duplicidade de slug, exibe preview do link, formatação de WhatsApp. Preserva slug original ao editar se o nome não mudou |
| **`StockManager.tsx`** | Gerenciamento de estoque. Edição de quantidade por produto, toggle para ocultar produtos esgotados do catálogo |
| **`ExcelImport.tsx`** | Importação de produtos via planilha Excel/CSV. Mapeia colunas do arquivo para campos do produto, cria categorias automaticamente, e faz upsert por código |
| **`ImageImport.tsx`** | Importação de imagens em lote. Associa imagens a produtos pelo código do arquivo (nome do arquivo = código do produto) |
| **`BannerManager.tsx`** | CRUD de banners. Upload de imagem, link opcional, ordenação por drag, ativar/desativar |
| **`TvModeSettings.tsx`** | Configuração do Modo TV: fonte de produtos, tamanho de exibição, cores (fundo, texto, preço, navbar), intervalo de rotação, banners (ativar/intervalo), elementos visíveis (código, marca, desconto, progresso, contador, navbar, logo). Inclui preview ao vivo |
| **`TvProductSelector.tsx`** | Seletor de produtos para o Modo TV no modo manual. Busca, seleção individual e reordenação de itens |
| **`CatalogCustomization.tsx`** | Personalização visual do catálogo: cores (header, botões, preço, texto, footer), modo de exibição da primeira página (padrão, destaques, aleatório), filtros rápidos (rótulo, cores, tipo), visibilidade de campos, gerenciamento de destaques e seletor de filtros rápidos |
| **`FeaturedProductsManager.tsx`** | Gerenciamento de produtos em destaque. Selecionar produtos, definir ordem de exibição |
| **`QuickFilterProductSelector.tsx`** | Seletor de produtos para os filtros rápidos custom1 e custom2. Marca/desmarca produtos individualmente |
| **`SettingsPanel.tsx`** | Configurações gerais: nome da loja, subtítulo, logo, WhatsApp, frete (ativar/valor), pedido mínimo, formas de pagamento, campos do checkout, redes sociais, informações da empresa |
| **`PaymentConditionsManager.tsx`** | CRUD de condições de pagamento: adicionar, renomear, ativar/desativar, reordenar, excluir |
| **`IntegrationPanel.tsx`** | Painel de integração com ERP. Exibe chave de API, URL do endpoint e documentação das rotas de sincronização |

---

## src/components/ui/

**O que faz:** Biblioteca de componentes de UI baseada no **shadcn/ui**. Componentes pré-estilizados e acessíveis usando Radix UI + Tailwind CSS.

Inclui 40+ componentes: `accordion`, `alert`, `alert-dialog`, `aspect-ratio`, `avatar`, `badge`, `breadcrumb`, `button`, `calendar`, `card`, `carousel`, `chart`, `checkbox`, `collapsible`, `command`, `context-menu`, `dialog`, `drawer`, `dropdown-menu`, `form`, `hover-card`, `input`, `input-otp`, `label`, `menubar`, `navigation-menu`, `pagination`, `popover`, `progress`, `radio-group`, `resizable`, `scroll-area`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `slider`, `sonner`, `switch`, `table`, `tabs`, `textarea`, `toast`, `toaster`, `toggle`, `toggle-group`, `tooltip`.

---

## src/contexts/

### `CartContext.tsx` — Contexto do Carrinho

**O que faz:** Gerencia o estado global do carrinho de compras.

**Estado:**
- `items: CartItem[]` — lista de produtos + quantidade

**Ações:**
- `addItem(product, quantity)` — adiciona produto ou incrementa quantidade se já existir
- `removeItem(productId)` — remove produto do carrinho
- `updateQuantity(productId, quantity)` — altera quantidade (remove se ≤ 0)
- `clearCart()` — esvazia o carrinho

**Valores computados:**
- `totalItems` — soma de todas as quantidades
- `totalPrice` — soma de (preço × quantidade) de todos os itens

**Uso:** `useCart()` — hook que acessa o contexto (erro se usado fora do `CartProvider`).

### `SellerContext.tsx` — Contexto do Vendedor

**O que faz:** Identifica o vendedor pela URL (`/v/:sellerSlug`) e persiste a atribuição durante toda a navegação do cliente.

**Estado:**
- `seller: Seller | null` — dados do vendedor (id, name, slug, whatsapp, active)
- `loading: boolean` — carregando dados do vendedor

**Comportamento:**
- Busca o vendedor por slug via `sellersApi.fetchBySlug()` no mount
- Se não houver `sellerSlug` no URL, `seller` é `null` (acesso normal sem vendedor)
- Tratamento de erros de rede com cleanup via flag `cancelled`
- Usado no `Checkout.tsx` para vincular o pedido ao vendedor e redirecionar WhatsApp

**Uso:** `useSeller()` — hook que acessa o contexto.

---

## src/hooks/

### Hooks Customizados

| Hook | O que faz |
|---|---|
| **`useDbProducts.ts`** | Hook principal de dados. Carrega produtos e categorias do banco via `api-client`. Fornece funções de CRUD (`addProduct`, `updateProduct`, `removeProduct`, `toggleActive`, `upsertProducts`), upload de imagem e estado de loading/error. Assina realtime para atualização automática |
| **`useAuth.ts`** | Gerencia autenticação. Detecta modo postgres (admin automático) ou Supabase (login real). Verifica role admin na tabela `user_roles`. Separa busca de sessão do listener `onAuthStateChange` para evitar race conditions. Expõe `signIn`, `signUp`, `signOut`, `user`, `isAdmin`, `loading` |
| **`useStoreSettings.ts`** | Carrega e gerencia configurações da loja (tabela `store_settings`). Retorna `settings` como mapa key→value, `updateSetting(key, value)` e assina realtime |
| **`useBanners.ts`** | CRUD de banners com estado local. `addBanner`, `updateBanner`, `removeBanner`. Filtra `activeBanners` para exibição pública |
| **`useOrders.ts`** | Carrega pedidos da tabela `orders` com realtime. `updateStatus(id, status)`, `fetchItems(orderId)` para carregar itens do pedido |
| **`usePaymentConditions.ts`** | CRUD de condições de pagamento. `addCondition`, `updateCondition`, `removeCondition` com realtime |
| **`useProductBySlug.ts`** | Busca um produto individual pelo slug (URL amigável). Usado na página `ProductDetail`. Busca direta no Supabase para performance |
| **`useSellerPrefix.ts`** | Gera prefixo de URL baseado no vendedor ativo. `prefix` retorna `/v/:slug` ou `""`. `buildPath(path)` concatena o prefixo com qualquer caminho |
| **`use-mobile.tsx`** | Detecta se a tela é mobile (< 768px) via `matchMedia`. Retorna boolean |
| **`use-toast.ts`** | Hook do sistema de notificações toast. Gerencia fila de toasts com auto-dismiss |

---

## src/lib/

### Utilitários e Camada de API

| Arquivo | O que faz |
|---|---|
| **`api-client.ts`** | **Camada de abstração central.** Decide entre Supabase e REST/Express baseado em `VITE_API_MODE`. Contém todas as APIs: `productsApi`, `categoriesApi`, `settingsApi`, `bannersApi`, `paymentConditionsApi`, `storageApi`, `authApi`, `ordersApi`, `sellersApi`, `realtimeApi`. Inclui timeout de 15s e retry automático (2 tentativas) para falhas de rede |
| **`utils.ts`** | Função utilitária `cn()` que combina `clsx` + `tailwind-merge` para merge inteligente de classes CSS |
| **`whatsapp.ts`** | Gera links do WhatsApp com mensagens pré-formatadas. `getWhatsAppLink(product, price, url)` para produto específico e `getWhatsAppGeneralLink()` para contato geral |

### Detalhamento do `api-client.ts`

Este é o **arquivo mais importante da arquitetura**. Ele abstrai completamente o backend:

```
api-client.ts
├── Configuração
│   ├── API_MODE (supabase | postgres)
│   ├── API_URL (URL do Express)
│   ├── Timeout: 15 segundos
│   └── Retry: até 2 tentativas
├── Helpers REST
│   ├── fetchWithTimeout() — fetch com AbortController
│   ├── withRetry() — retry em falhas de rede
│   ├── restGet() / restPost() / restPut() / restDelete()
├── APIs de Domínio
│   ├── productsApi — fetchAll, findBySlug, findByCode, insert, update, remove, upsert
│   ├── categoriesApi — fetchAll, insert, insertBatch, update, remove
│   ├── settingsApi — fetchAll, update
│   ├── bannersApi — fetchAll, insert, update, remove
│   ├── paymentConditionsApi — fetchAll, insert, update, remove
│   ├── storageApi — uploadFile (File), uploadBase64 (string)
│   ├── authApi — getSession, checkAdmin, signIn, signUp, signOut, onAuthStateChange, setupAdmin
│   ├── ordersApi — fetchAll, fetchItems, create (com idempotência), updateStatus
│   ├── sellersApi — fetchAll, fetchBySlug, insert, update, remove
│   └── realtimeApi — subscribeToTable (Supabase channels ou polling 5s)
```

---

## src/integrations/

### `supabase/client.ts`

**O que faz:** Cria e exporta a instância do cliente Supabase configurada com URL e chave anônima. **Arquivo auto-gerado — NÃO editar.**

```typescript
import { supabase } from "@/integrations/supabase/client";
```

### `supabase/types.ts`

**O que faz:** Tipos TypeScript auto-gerados do schema do banco Supabase. Define tipos para todas as tabelas, suas operações (Row, Insert, Update) e relacionamentos. **Arquivo auto-gerado — NÃO editar.**

**Tabelas tipadas:**
- `banners` — imagens promocionais com ordenação e ativação
- `catalog_tabs` — abas customizáveis do catálogo (filter_type, filter_value)
- `categories` — categorias de produtos (name, slug)
- `order_items` — itens de um pedido (FK → orders, products)
- `orders` — pedidos com dados do cliente, vendedor, totais e status
- `payment_conditions` — formas de pagamento (name, sort_order, active)
- `products` — produtos com todos os campos (preço, imagem, marca, filtros rápidos, quantidade, referência, código fabricante, unidade medida)
- `sellers` — vendedores (name, slug, whatsapp, active)
- `store_settings` — configurações key/value da loja
- `user_roles` — roles de usuário (enum: "admin")

---

## server/

### Backend Express.js (Modo PostgreSQL Local)

> Ativado quando `VITE_API_MODE=postgres`. Usado para deploy em VPS sem Supabase.

| Arquivo | O que faz |
|---|---|
| **`index.ts`** | Servidor Express principal. Configura CORS, JSON (50MB), servir uploads estáticos, registra todas as rotas da API e health check. Roda na porta 3001 |
| **`db.ts`** | Pool de conexão PostgreSQL via `pg`. Usa `DATABASE_URL` ou fallback para localhost. Loga erros de pool |

### `server/routes/`

| Rota | Arquivo | Endpoints |
|---|---|---|
| `/api/products` | `products.ts` | GET `/` — listar todos; GET `/slug/:slug` — buscar por slug; GET `/code/:code` — buscar por código; POST `/` — criar; PUT `/:id` — atualizar; DELETE `/:id` — excluir; POST `/upsert` — upsert em lote |
| `/api/categories` | `categories.ts` | GET `/` — listar; POST `/` — criar; POST `/batch` — criar em lote; PUT `/:id` — atualizar; DELETE `/:id` — excluir |
| `/api/settings` | `settings.ts` | GET `/` — listar todas; PUT `/:key` — atualizar valor |
| `/api/banners` | `banners.ts` | GET `/` — listar; POST `/` — criar; PUT `/:id` — atualizar; DELETE `/:id` — excluir |
| `/api/payment-conditions` | `payment-conditions.ts` | GET `/` — listar; POST `/` — criar; PUT `/:id` — atualizar; DELETE `/:id` — excluir |
| `/api/upload` | `upload.ts` | POST `/image` — upload de arquivo (Multer → disco); POST `/base64` — upload de imagem base64 |
| `/api/auth` | `auth.ts` | Rotas de autenticação (no modo postgres, admin é automático) |

---

## supabase/

| Arquivo | O que faz |
|---|---|
| `config.toml` | Configuração do projeto Supabase (auto-gerado, NÃO editar) |
| `functions/setup-admin/index.ts` | Edge Function que configura o primeiro usuário admin na tabela `user_roles` |

---

## docs/

### Documentação Técnica

| Documento | O que faz |
|---|---|
| **`ESTRUTURA_DO_PROJETO.md`** | Este documento — mapa completo do projeto |
| **`INSTALACAO_LOCAL.md`** | Guia completo de instalação em VPS com PostgreSQL local. Inclui schema SQL, configuração do Express, PM2, Nginx, SSL, backup e troubleshooting |
| **`ERP_INTEGRATION_API.md`** | API de integração com ERP para sincronização de produtos (entrada) |
| **`ERP_OUTBOUND_API.md`** | API de saída para enviar dados do catálogo para o ERP |
| **`ERP_IMAGE_IMPORT_API.md`** | API de importação de imagens via ERP |
| **`IMAGE_SYNC_API.md`** | Sincronização de imagens entre sistemas (Base64, hashes SHA-256) |
| **`PRODUCT_SYNC_API.md`** | Sincronização de produtos entre catálogo e ERP (lógica de upsert) |
| **`ORDERS_API.md`** | API de pedidos para consulta e atualização de status |

---

## Arquivos de Configuração

| Arquivo | O que faz |
|---|---|
| `vite.config.ts` | Configuração do Vite (bundler). Define alias `@/`, plugins React, porta de dev |
| `tailwind.config.ts` | Configuração do Tailwind CSS. Define cores customizadas, breakpoints, animações |
| `tsconfig.json` | Configuração TypeScript raiz |
| `tsconfig.app.json` | Configuração TypeScript para o código da aplicação (src/) |
| `tsconfig.node.json` | Configuração TypeScript para scripts Node (vite.config, etc.) |
| `postcss.config.js` | Configuração PostCSS (plugins: Tailwind, Autoprefixer) |
| `eslint.config.js` | Configuração do ESLint para qualidade de código |
| `vitest.config.ts` | Configuração do Vitest para testes unitários |
| `components.json` | Configuração do shadcn/ui (estilo, aliases, paths) |
| `index.html` | HTML raiz da SPA. Monta o `<div id="root">` |
| `.env` | Variáveis de ambiente (auto-gerado: SUPABASE_URL, SUPABASE_KEY, API_MODE, API_URL) |
| `public/robots.txt` | Configuração para crawlers/SEO |
| `public/placeholder.svg` | Imagem placeholder padrão para produtos sem foto |

---

## Sistema de Vendedores

### Arquitetura

```
Vendedor criado no Admin (SellerManager)
  → Gera slug único (ex: "joao-silva")
  → Link: https://dominio.com/v/joao-silva

Cliente acessa /v/joao-silva
  → App.tsx rota /v/:sellerSlug/* → CatalogRoutes
    → SellerProvider busca vendedor por slug
      → SellerContext.seller = { id, name, slug, whatsapp }

Cliente navega normalmente (catálogo, produto, sacola)
  → useSellerPrefix().buildPath("/sacola") → "/v/joao-silva/sacola"

Cliente finaliza pedido (Checkout)
  → order.seller_id = seller.id
  → order.seller_name = seller.name
  → WhatsApp enviado para seller.whatsapp (ou fallback para loja)
```

### Tabela `sellers`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | PK auto-gerado |
| `name` | text | Nome do vendedor |
| `slug` | text | Slug único para URL |
| `whatsapp` | text (nullable) | Número WhatsApp do vendedor |
| `active` | boolean | Se o vendedor está ativo |
| `created_at` | timestamp | Data de criação |

### Configurações do Modo TV (store_settings)

| Chave | Tipo | Default | Descrição |
|---|---|---|---|
| `tv_bg_color` | string | `#000000` | Cor de fundo |
| `tv_text_color` | string | `#ffffff` | Cor do texto |
| `tv_price_color` | string | `#22c55e` | Cor do preço |
| `tv_navbar_color` | string | `#111111` | Cor da navbar |
| `tv_navbar_text_color` | string | `#ffffff` | Cor do texto da navbar |
| `tv_show_logo` | bool | `true` | Exibir logo (quando navbar off) |
| `tv_show_code` | bool | `true` | Exibir código do produto |
| `tv_show_brand` | bool | `true` | Exibir marca |
| `tv_show_progress` | bool | `true` | Exibir barra de progresso |
| `tv_show_counter` | bool | `true` | Exibir contador (1/5) |
| `tv_show_discount` | bool | `true` | Exibir preço riscado |
| `tv_show_navbar` | bool | `true` | Exibir navbar no topo |
| `tv_show_banners` | bool | `true` | Exibir banners |
| `tv_product_source` | string | `latest` | Fonte: `latest`, `featured`, `manual` |
| `tv_product_size` | string | `medium` | Tamanho: `small`, `medium`, `large` |
| `tv_product_ids` | JSON | `[]` | IDs dos produtos (modo manual) |
| `tv_mode_interval` | number | `5` | Segundos entre produtos |
| `tv_banner_interval` | number | `5` | Segundos entre banners |

---

## Modo TV

### Arquitetura

```
Admin configura Modo TV (TvModeSettings)
  → Salva 18 chaves em store_settings
  → Ativa/desativa banners, seleciona produtos, cores, intervalos

TV/Monitor acessa /tv (TvMode.tsx)
  → Carrega produtos via useDbProducts()
  → Carrega banners via useBanners()
  → Carrega settings via useStoreSettings()
  → Filtra produtos por fonte (latest/featured/manual)
  → Inicia rotação automática com fade transition
  → Banner rotaciona independentemente abaixo da navbar
  → Tela fullscreen, cursor oculto, sem scrollbars
```

### Proteções de Performance

- `useRef(mountedRef)` — evita setState em componente desmontado
- `fadeTimerRef` — cleanup de timer de fade antes de criar novo
- Safe index bounds — previne acesso a índice fora do array
- Banner index reset — mantém consistência quando banners mudam
- `useMemo` para filtrar e ordenar produtos apenas quando necessário

---

## Fluxo de Dados Resumido

```
Usuário navega no catálogo
  → Index.tsx carrega produtos via useDbProducts()
    → useDbProducts() chama productsApi.fetchAll()
      → api-client.ts decide:
        → Supabase: supabase.from("products").select("*")
        → Postgres: GET http://localhost:3001/api/products

Usuário acessa via link de vendedor (/v/joao)
  → SellerProvider busca vendedor → SellerContext preenchido
  → Navegação usa useSellerPrefix() para manter o prefixo

Usuário adiciona ao carrinho
  → ProductCard → AddToCartDialog → useCart().addItem()
    → CartContext atualiza estado global

Usuário finaliza pedido
  → Checkout.tsx coleta dados + vendedor (se houver)
    → ordersApi.create(order, items) → persiste no banco
    → Gera mensagem formatada → abre WhatsApp (vendedor ou loja)
    → clearCart() → tela de confirmação

TV exibe produtos (/tv)
  → TvMode.tsx carrega dados + settings
    → Rotação automática de produtos + banners independentes
    → Fullscreen, cursor oculto, modo kiosk
```

---

## Banco de Dados — Schema Completo

### Tabelas

| Tabela | Descrição | RLS |
|---|---|---|
| `products` | Produtos do catálogo | Leitura pública, CRUD admin |
| `categories` | Categorias de produtos | Leitura pública, CRUD admin |
| `orders` | Pedidos de clientes | INSERT público, leitura/update/delete admin |
| `order_items` | Itens de cada pedido | INSERT público, leitura/delete admin |
| `banners` | Banners promocionais | Leitura pública, CRUD admin |
| `sellers` | Vendedores | Leitura pública, CRUD admin |
| `store_settings` | Configurações key/value | Leitura pública, CRUD admin |
| `payment_conditions` | Formas de pagamento | Leitura pública, CRUD admin |
| `catalog_tabs` | Abas do catálogo | Leitura pública, CRUD admin |
| `user_roles` | Roles (admin) | Leitura/insert/delete admin |

### Storage

| Bucket | Público | Descrição |
|---|---|---|
| `product-images` | Sim | Imagens de produtos |

### Functions

| Função | Descrição |
|---|---|
| `has_role(user_id, role)` | Verifica se usuário tem a role especificada |
| `update_updated_at_column()` | Trigger para atualizar `updated_at` automaticamente |

---

*Documentação atualizada em 17/02/2026.*
