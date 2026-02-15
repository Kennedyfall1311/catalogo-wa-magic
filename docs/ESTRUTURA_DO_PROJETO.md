# 📁 Documentação Completa da Estrutura do Projeto

> Catálogo digital de produtos com envio de pedidos via WhatsApp, painel administrativo e arquitetura dual-mode (Supabase / PostgreSQL local).

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

---

## Visão Geral

O projeto é um **catálogo digital de produtos** construído com:

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Estilização | Tailwind CSS + shadcn/ui |
| Estado Global | React Context (Carrinho) + React Query |
| Backend (Cloud) | Supabase (Auth, Database, Storage, Realtime) |
| Backend (Local) | Express.js + PostgreSQL 15+ |
| Pedidos | Persistidos no banco → enviados via WhatsApp |

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
| `/admin` | `Admin` | Painel administrativo |
| `*` | `NotFound` | Página 404 |

**Providers empilhados:**
1. `QueryClientProvider` — cache de dados (React Query)
2. `TooltipProvider` — tooltips globais
3. `CartProvider` — estado do carrinho de compras
4. `Toaster` / `Sonner` — notificações toast

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
- Carrossel de banners promocionais
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
- Formulário: Nome*, WhatsApp* (com máscara), CPF/CNPJ (com máscara), Observações
- Seleção de forma de pagamento (configurável pelo admin)
- Validação de pedido mínimo (configurável)
- Cálculo de frete fixo (configurável)
- Persiste pedido no banco (`orders` + `order_items`) com chave de idempotência
- Gera mensagem formatada e abre WhatsApp
- Tela de confirmação com botão para reenviar pelo WhatsApp

### `Admin.tsx` — Painel Administrativo

**O que faz:** Interface de administração com navegação por abas:
- **Vendas** — Dashboard de pedidos
- **Produtos** — CRUD completo de produtos
- **Categorias** — Gerenciamento de categorias
- **Importar** — Importação via Excel/CSV e imagens em lote
- **Catálogo** — Customização visual (cores, filtros, layout)
- **Config** — Configurações gerais (branding, logística, WhatsApp)
- **ERP** — Painel de integração com sistemas externos

Protegido por autenticação: exibe `AdminLogin` se não logado, tela de "Acesso negado" se não admin.

### `NotFound.tsx` — Página 404

**O que faz:** Exibe mensagem de erro quando uma rota não existe. Loga o caminho tentado no console.

---

## src/components/

### Componentes Públicos (Catálogo)

| Componente | O que faz |
|---|---|
| **`CatalogHeader.tsx`** | Header do catálogo com logo, nome da loja, subtítulo, texto de boas-vindas e drawer com informações da empresa (telefone, email, endereço, horário) |
| **`BannerCarousel.tsx`** | Carrossel de banners promocionais usando Embla Carousel. Exibe imagens com links opcionais, autoplay e indicadores de navegação |
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
| **`AdminLogin.tsx`** | Tela de login/cadastro do administrador. Formulário com email e senha, alternância entre login e signup |
| **`SalesDashboard.tsx`** | Dashboard de vendas com lista de pedidos, filtros por período, visualização de itens do pedido, atualização de status e impressão formatada |
| **`ProductManager.tsx`** | Interface unificada de gerenciamento de produtos. Inclui busca, filtro por categoria, paginação de 50 itens, atualização de categoria em lote (bulk), diagnóstico de produtos sem foto, e slot para o formulário de edição |
| **`ProductForm.tsx`** | Formulário de criação/edição de produto. Campos: nome, código, slug (auto-gerado), preço, preço original, categoria, marca, descrição, referência, código fabricante, unidade de medida, quantidade, imagem (upload), ativo, destaque |
| **`ProductList.tsx`** | Componente de listagem de produtos em formato tabular. Usado internamente pelo ProductManager |
| **`ProductsWithoutPhoto.tsx`** | Ferramenta de diagnóstico que lista produtos sem imagem. Permite upload direto de foto na listagem para correção rápida |
| **`CategoryManager.tsx`** | CRUD de categorias. Adicionar, editar nome/slug e excluir categorias |
| **`ExcelImport.tsx`** | Importação de produtos via planilha Excel/CSV. Mapeia colunas do arquivo para campos do produto, cria categorias automaticamente, e faz upsert por código |
| **`ImageImport.tsx`** | Importação de imagens em lote. Associa imagens a produtos pelo código do arquivo (nome do arquivo = código do produto) |
| **`BannerManager.tsx`** | CRUD de banners. Upload de imagem, link opcional, ordenação por drag, ativar/desativar |
| **`CatalogCustomization.tsx`** | Personalização visual do catálogo: cores (header, botões, preço, texto, footer), modo de exibição da primeira página (padrão, destaques, aleatório), filtros rápidos (rótulo, cores, tipo), visibilidade de campos (descrição, referência, parcelamento, etc.), gerenciamento de produtos em destaque e seletor de produtos para filtros rápidos |
| **`FeaturedProductsManager.tsx`** | Gerenciamento de produtos em destaque. Selecionar produtos, definir ordem de exibição |
| **`QuickFilterProductSelector.tsx`** | Seletor de produtos para os filtros rápidos custom1 e custom2. Marca/desmarca produtos individualmente |
| **`SettingsPanel.tsx`** | Configurações gerais: nome da loja, subtítulo, logo, WhatsApp, frete (ativar/valor), pedido mínimo, formas de pagamento, redes sociais, informações da empresa |
| **`PaymentConditionsManager.tsx`** | CRUD de condições de pagamento: adicionar, renomear, ativar/desativar, reordenar, excluir |
| **`IntegrationPanel.tsx`** | Painel de integração com ERP. Exibe chave de API, URL do endpoint e documentação das rotas de sincronização |

---

## src/components/ui/

**O que faz:** Biblioteca de componentes de UI baseada no **shadcn/ui**. Componentes pré-estilizados e acessíveis usando Radix UI + Tailwind CSS.

| Componente | Descrição |
|---|---|
| `accordion.tsx` | Acordeão expansível/recolhível |
| `alert.tsx` | Caixa de alerta estilizada |
| `alert-dialog.tsx` | Dialog de confirmação modal |
| `aspect-ratio.tsx` | Container com proporção fixa |
| `avatar.tsx` | Avatar circular com fallback |
| `badge.tsx` | Badge/etiqueta de texto |
| `breadcrumb.tsx` | Trilha de navegação |
| `button.tsx` | Botão com variantes (default, destructive, outline, secondary, ghost, link) |
| `calendar.tsx` | Calendário seletor de data |
| `card.tsx` | Card container com header, content, footer |
| `carousel.tsx` | Carrossel de conteúdo (Embla) |
| `chart.tsx` | Container para gráficos (Recharts) |
| `checkbox.tsx` | Checkbox acessível |
| `collapsible.tsx` | Conteúdo expansível |
| `command.tsx` | Command palette / busca |
| `context-menu.tsx` | Menu de contexto (clique direito) |
| `dialog.tsx` | Modal/dialog |
| `drawer.tsx` | Drawer lateral (Vaul) |
| `dropdown-menu.tsx` | Menu dropdown |
| `form.tsx` | Integração React Hook Form + Zod |
| `hover-card.tsx` | Card exibido no hover |
| `input.tsx` | Campo de input estilizado |
| `input-otp.tsx` | Input para código OTP |
| `label.tsx` | Label de formulário |
| `menubar.tsx` | Barra de menu horizontal |
| `navigation-menu.tsx` | Menu de navegação com submenu |
| `pagination.tsx` | Controles de paginação |
| `popover.tsx` | Popover flutuante |
| `progress.tsx` | Barra de progresso |
| `radio-group.tsx` | Grupo de radio buttons |
| `resizable.tsx` | Painéis redimensionáveis |
| `scroll-area.tsx` | Área de scroll customizada |
| `select.tsx` | Select/dropdown nativo estilizado |
| `separator.tsx` | Linha separadora |
| `sheet.tsx` | Painel lateral deslizante |
| `sidebar.tsx` | Sidebar de navegação |
| `skeleton.tsx` | Placeholder de carregamento |
| `slider.tsx` | Slider de valor |
| `sonner.tsx` | Notificações toast (Sonner) |
| `switch.tsx` | Toggle switch on/off |
| `table.tsx` | Tabela estilizada |
| `tabs.tsx` | Abas de navegação |
| `textarea.tsx` | Campo de texto multilinha |
| `toast.tsx` | Componente toast (Radix) |
| `toaster.tsx` | Container de toasts |
| `toggle.tsx` | Botão toggle |
| `toggle-group.tsx` | Grupo de toggles |
| `tooltip.tsx` | Tooltip no hover |
| `use-toast.ts` | Re-exporta hook de toast |

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

---

## src/hooks/

### Hooks Customizados

| Hook | O que faz |
|---|---|
| **`useDbProducts.ts`** | Hook principal de dados. Carrega produtos e categorias do banco via `api-client`. Fornece funções de CRUD (`addProduct`, `updateProduct`, `removeProduct`, `toggleActive`, `upsertProducts`), upload de imagem e estado de loading/error. Assina realtime para atualização automática |
| **`useAuth.ts`** | Gerencia autenticação. Detecta modo postgres (admin automático) ou Supabase (login real). Verifica role admin na tabela `user_roles`. Expõe `signIn`, `signUp`, `signOut`, `user`, `isAdmin`, `loading` |
| **`useStoreSettings.ts`** | Carrega e gerencia configurações da loja (tabela `store_settings`). Retorna `settings` como mapa key→value, `updateSetting(key, value)` e assina realtime |
| **`useBanners.ts`** | CRUD de banners com estado local. `addBanner`, `updateBanner`, `removeBanner`. Filtra `activeBanners` para exibição pública |
| **`useOrders.ts`** | Carrega pedidos da tabela `orders` com realtime. `updateStatus(id, status)`, `fetchItems(orderId)` para carregar itens do pedido |
| **`usePaymentConditions.ts`** | CRUD de condições de pagamento. `addCondition`, `updateCondition`, `removeCondition` com realtime |
| **`useProductBySlug.ts`** | Busca um produto individual pelo slug (URL amigável). Usado na página `ProductDetail` |
| **`use-mobile.tsx`** | Detecta se a tela é mobile (< 768px) via `matchMedia`. Retorna boolean |
| **`use-toast.ts`** | Hook do sistema de notificações toast. Gerencia fila de toasts com auto-dismiss |

---

## src/lib/

### Utilitários e Camada de API

| Arquivo | O que faz |
|---|---|
| **`api-client.ts`** | **Camada de abstração central.** Decide entre Supabase e REST/Express baseado em `VITE_API_MODE`. Contém todas as APIs: `productsApi`, `categoriesApi`, `settingsApi`, `bannersApi`, `paymentConditionsApi`, `storageApi`, `authApi`, `ordersApi`, `realtimeApi`. Inclui timeout de 15s e retry automático (2 tentativas) para falhas de rede |
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

**O que faz:** Tipos TypeScript auto-gerados do schema do banco Supabase. Define tipos para todas as tabelas (`products`, `categories`, `orders`, `banners`, etc.), suas operações (Row, Insert, Update) e relacionamentos. **Arquivo auto-gerado — NÃO editar.**

**Tabelas tipadas:**
- `banners` — imagens promocionais com ordenação
- `catalog_tabs` — abas customizáveis do catálogo
- `categories` — categorias de produtos
- `order_items` — itens de um pedido (FK → orders, products)
- `orders` — pedidos com dados do cliente e totais
- `payment_conditions` — formas de pagamento
- `products` — produtos com todos os campos (preço, imagem, marca, filtros rápidos, etc.)
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
| **`INSTALACAO_LOCAL.md`** | Guia completo de instalação em VPS com PostgreSQL local. Inclui schema SQL, configuração do Express, PM2, Nginx, SSL, backup e troubleshooting |
| **`ERP_INTEGRATION_API.md`** | Documentação da API de integração com ERP para sincronização de produtos (entrada) |
| **`ERP_OUTBOUND_API.md`** | Documentação da API de saída para enviar dados do catálogo para o ERP |
| **`ERP_IMAGE_IMPORT_API.md`** | Documentação da API de importação de imagens via ERP |
| **`IMAGE_SYNC_API.md`** | Documentação da sincronização de imagens entre sistemas |
| **`PRODUCT_SYNC_API.md`** | Documentação da sincronização de produtos entre catálogo e ERP |
| **`ORDERS_API.md`** | Documentação da API de pedidos para consulta e atualização de status |

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

## Fluxo de Dados Resumido

```
Usuário navega no catálogo
  → Index.tsx carrega produtos via useDbProducts()
    → useDbProducts() chama productsApi.fetchAll()
      → api-client.ts decide:
        → Supabase: supabase.from("products").select("*")
        → Postgres: GET http://localhost:3001/api/products

Usuário adiciona ao carrinho
  → ProductCard → AddToCartDialog → useCart().addItem()
    → CartContext atualiza estado global

Usuário finaliza pedido
  → Checkout.tsx coleta dados
    → ordersApi.create(order, items) → persiste no banco
    → Gera mensagem formatada → abre WhatsApp
    → clearCart() → tela de confirmação
```

---

*Documentação gerada em 15/02/2026. Atualizar conforme novas funcionalidades forem adicionadas.*
