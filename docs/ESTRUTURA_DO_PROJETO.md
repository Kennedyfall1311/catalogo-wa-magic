# 📁 Documentação da Estrutura do Projeto — Catálogo Digital

> Guia completo de como o projeto está organizado, o que cada arquivo faz e como os dados fluem pela aplicação.

---

## 📌 O que é este projeto?

Um **catálogo digital de produtos** com envio de pedidos via WhatsApp. Inclui:

- ✅ Catálogo público responsivo com busca, filtros e categorias
- ✅ Sacola de compras com checkout via WhatsApp
- ✅ Sistema de vendedores com links personalizados (`/v/joao-silva`)
- ✅ Modo TV para vitrines digitais em monitores (`/tv`)
- ✅ Painel administrativo completo com dashboard de vendas
- ✅ Gestão de estoque e importação via Excel
- ✅ Integração com sistemas ERP via API REST
- ✅ Funciona tanto na nuvem (Lovable Cloud) quanto em VPS própria

---

## 🏗️ Tecnologias Utilizadas

| Camada | Tecnologia | Para quê |
|--------|-----------|----------|
| **Frontend** | React 18 + TypeScript + Vite | Interface do usuário |
| **Estilização** | Tailwind CSS + shadcn/ui | Visual e componentes |
| **Estado** | React Context + React Query | Gerenciar dados e cache |
| **Backend (Nuvem)** | Lovable Cloud (Supabase) | Auth, banco, storage |
| **Backend (VPS)** | Express.js + PostgreSQL 15+ | Servidor próprio |
| **Pedidos** | Banco de dados → WhatsApp | Persistência e envio |

---

## 🔀 Como o Sistema Decide qual Backend Usar

O projeto funciona em **dois modos**, controlado pela variável `VITE_API_MODE`:

```
┌──────────────────────────────────────────────────────────┐
│                    Frontend React                         │
│                                                           │
│  Hooks → api-client.ts → Escolhe automaticamente:        │
│                                                           │
│           Padrão (sem config)      VITE_API_MODE=postgres │
│                │                          │               │
│                ▼                          ▼               │
│         ┌──────────┐            ┌──────────────┐          │
│         │ Lovable  │            │ Express.js   │          │
│         │ Cloud    │            │ + PostgreSQL │          │
│         └──────────┘            └──────────────┘          │
└──────────────────────────────────────────────────────────┘
```

O arquivo `src/lib/api-client.ts` é quem faz essa decisão. **Todos os hooks usam o api-client — nunca acessam o banco diretamente.**

---

## 📂 Organização de Pastas

```
projeto/
├── src/                        ← Código fonte do frontend
│   ├── main.tsx                ← Ponto de entrada
│   ├── App.tsx                 ← Rotas e providers
│   ├── index.css               ← Design system (cores, temas)
│   ├── assets/                 ← Imagens estáticas (placeholders)
│   ├── pages/                  ← Páginas da aplicação
│   ├── components/             ← Componentes do catálogo público
│   │   ├── admin/              ← Componentes do painel admin
│   │   └── ui/                 ← Componentes shadcn/ui (40+)
│   ├── contexts/               ← Estado global (carrinho, vendedor)
│   ├── hooks/                  ← Hooks customizados (dados, auth, etc.)
│   ├── lib/                    ← Utilitários e camada de API
│   └── integrations/           ← Cliente Lovable Cloud (auto-gerado)
├── server/                     ← Backend Express.js (modo VPS)
│   ├── index.ts                ← Servidor principal
│   ├── db.ts                   ← Conexão PostgreSQL
│   ├── middleware/             ← Middleware de autenticação
│   └── routes/                 ← Rotas da API REST
├── supabase/                   ← Configuração Cloud (auto-gerado)
│   └── functions/              ← Edge Functions
├── docs/                       ← Documentação técnica
├── .env                        ← Variáveis de ambiente
└── package.json                ← Dependências
```

---

## 🗺️ Rotas da Aplicação (URLs)

Definidas em `src/App.tsx`:

| URL | Página | O que exibe |
|-----|--------|-------------|
| `/` | `Index` | Catálogo público de produtos |
| `/produto/:slug` | `ProductDetail` | Detalhe de um produto |
| `/sacola` | `Cart` | Sacola de compras |
| `/checkout` | `Checkout` | Finalização do pedido |
| `/v/:sellerSlug/*` | Catálogo com vendedor | Mesmo catálogo, mas vinculado a um vendedor |
| `/admin` | `Admin` | Painel administrativo |
| `/tv` | `TvMode` | Modo TV (vitrine digital fullscreen) |
| `*` | `NotFound` | Página 404 |

**Providers globais** (envolvem todas as rotas):
1. `QueryClientProvider` — cache de dados (React Query)
2. `TooltipProvider` — tooltips
3. `CartProvider` — estado do carrinho
4. `Toaster` / `Sonner` — notificações

---

## 📄 Páginas (src/pages/)

### `Index.tsx` — Catálogo Público

A página principal. Exibe:
- Header com logo, nome da loja e informações da empresa
- Carrossel de banners promocionais
- Barra de filtros (categoria, marca, busca, filtros rápidos, ordenação)
- Grid de produtos (2→5 colunas, responsivo) com "Carregar mais" (40 por vez)
- Footer com redes sociais

### `ProductDetail.tsx` — Detalhe do Produto

Página individual de um produto com imagem grande, nome, código, descrição, preço (com desconto se houver), parcelamento e botão "Comprar".

### `Cart.tsx` — Sacola de Compras

Lista os itens no carrinho com imagem, nome, preço, controles de quantidade (−/+), botão remover e total calculado.

### `Checkout.tsx` — Finalização do Pedido

Coleta dados do cliente (nome, WhatsApp, CPF/CNPJ, endereço com busca por CEP), forma de pagamento, salva o pedido no banco e abre o WhatsApp com mensagem formatada. Se acessado via link de vendedor, vincula o pedido ao vendedor.

### `Admin.tsx` — Painel Administrativo

Interface com abas para gerenciar tudo:

| Aba | O que faz |
|-----|-----------|
| 📊 Vendas | Dashboard de pedidos com filtros e status |
| 📦 Produtos | CRUD completo de produtos |
| 🏷️ Categorias | Gerenciar categorias |
| 👥 Vendedores | CRUD de vendedores com links |
| 📋 Estoque | Controle de quantidade |
| 📺 Modo TV | Configurar vitrine digital |
| 📥 Importar | Excel/CSV e imagens em lote |
| 🎨 Catálogo | Customização visual |
| ⚙️ Config | Configurações gerais |
| 🔗 ERP | Integração com sistemas externos |

Protegido por autenticação: exige login e permissão de admin.

### `TvMode.tsx` — Modo TV

Slideshow fullscreen para TVs/monitores:
- Rotação automática de produtos com fade
- Navbar opcional com logo e nome da loja
- Banners com rotação independente
- Cores, intervalo e elementos configuráveis pelo admin
- Cursor oculto (modo kiosk)

---

## 🧩 Componentes Públicos (src/components/)

| Componente | O que faz |
|------------|-----------|
| `CatalogHeader` | Header com logo, nome, subtítulo e drawer de informações da empresa |
| `BannerCarousel` | Carrossel de banners com Embla Carousel, lazy loading e autoplay |
| `CategoryFilter` | Barra de filtros: busca, categoria, filtros rápidos, ordenação, marca |
| `ProductCard` | Card do produto no grid (imagem, nome, preço, badge de oferta, botão comprar) |
| `AddToCartDialog` | Modal para escolher quantidade e adicionar ao carrinho |
| `CartFloating` | Botão flutuante da sacola (mostra quantidade de itens) |
| `WhatsAppFloating` | Botão flutuante do WhatsApp |
| `CatalogFooter` | Footer com nome da loja, redes sociais e créditos |
| `CompanyInfoDrawer` | Drawer com informações da empresa (telefone, email, endereço, horário) |

---

## 🛠️ Componentes Admin (src/components/admin/)

| Componente | O que faz |
|------------|-----------|
| `AdminLogin` | Tela de login/cadastro com email e senha |
| `SalesDashboard` | Dashboard de vendas com lista de pedidos, filtros e impressão |
| `ProductManager` | Gerenciamento de produtos com busca, paginação e bulk actions |
| `ProductForm` | Formulário de criar/editar produto (todos os campos) |
| `ProductList` | Lista tabular de produtos |
| `ProductsWithoutPhoto` | Diagnóstico: lista produtos sem foto com upload direto |
| `CategoryManager` | CRUD de categorias |
| `SellerManager` | CRUD de vendedores com slug automático e preview de link |
| `StockManager` | Edição de estoque por produto |
| `ExcelImport` | Importação de produtos via Excel/CSV com mapeamento de colunas |
| `ImageImport` | Importação de imagens em lote (nome do arquivo = código do produto) |
| `BannerManager` | CRUD de banners com upload e ordenação |
| `TvModeSettings` | Configuração completa do Modo TV com preview ao vivo |
| `TvProductSelector` | Seletor de produtos para o Modo TV (modo manual) |
| `CatalogCustomization` | Cores, layout, filtros rápidos, destaques |
| `FeaturedProductsManager` | Seleção e ordenação de produtos em destaque |
| `QuickFilterProductSelector` | Seletor de produtos para filtros rápidos |
| `SettingsPanel` | Configurações gerais (nome, logo, WhatsApp, frete, checkout, redes sociais) |
| `PaymentConditionsManager` | CRUD de formas de pagamento |
| `IntegrationPanel` | Painel de integração com ERP |

---

## 🪝 Hooks Customizados (src/hooks/)

| Hook | O que faz |
|------|-----------|
| `useDbProducts` | **Principal.** Carrega produtos e categorias. CRUD completo, upload de imagem, realtime |
| `useAuth` | Autenticação. Detecta modo (Cloud/VPS), verifica admin, login/logout |
| `useStoreSettings` | Carrega e atualiza configurações da loja (key→value) com realtime |
| `useBanners` | CRUD de banners com estado local e filtro de ativos |
| `useOrders` | Carrega pedidos com realtime. Atualiza status, busca itens |
| `usePaymentConditions` | CRUD de formas de pagamento com realtime |
| `useProductBySlug` | Busca um produto pelo slug (para a página de detalhe) |
| `useSellerPrefix` | Gera prefixo de URL do vendedor ativo (`/v/:slug` ou vazio) |
| `use-mobile` | Detecta tela mobile (< 768px) |
| `use-toast` | Sistema de notificações toast |

---

## 📚 Utilitários (src/lib/)

### `api-client.ts` — **O arquivo mais importante**

Abstrai completamente o backend. Decide entre Cloud e VPS e expõe:

```
api-client.ts
├── productsApi     → fetchAll, findBySlug, findByCode, insert, update, remove, upsert
├── categoriesApi   → fetchAll, insert, insertBatch, update, remove
├── settingsApi     → fetchAll, update
├── bannersApi      → fetchAll, insert, update, remove
├── paymentConditionsApi → fetchAll, insert, update, remove
├── storageApi      → uploadFile, uploadBase64
├── authApi         → getSession, checkAdmin, signIn, signUp, signOut, onAuthStateChange
├── ordersApi       → fetchAll, fetchItems, create (com idempotência), updateStatus
├── sellersApi      → fetchAll, fetchBySlug, insert, update, remove
└── realtimeApi     → subscribeToTable (realtime ou polling 5s)
```

**Características:** Timeout de 15s, retry automático (2 tentativas), injeção automática de chave admin.

### `utils.ts`

Função `cn()` — combina `clsx` + `tailwind-merge` para classes CSS.

### `whatsapp.ts`

Gera links do WhatsApp com mensagens formatadas.

---

## 🔄 Contextos React (src/contexts/)

### `CartContext.tsx` — Carrinho de Compras

| O que faz | Detalhes |
|-----------|----------|
| Estado | `items: CartItem[]` — produtos + quantidade |
| `addItem(product, qty)` | Adiciona ou incrementa quantidade |
| `removeItem(id)` | Remove do carrinho |
| `updateQuantity(id, qty)` | Altera quantidade |
| `clearCart()` | Esvazia tudo |
| `totalItems` | Soma das quantidades |
| `totalPrice` | Soma dos preços × quantidades |

Acesso: `const { items, addItem, totalPrice } = useCart();`

### `SellerContext.tsx` — Vendedor Ativo

Identifica o vendedor pela URL (`/v/:slug`). Se não houver vendedor na URL, `seller` é `null`.

Usado no Checkout para vincular o pedido ao vendedor e enviar WhatsApp para o número dele.

Acesso: `const { seller } = useSeller();`

---

## 🖥️ Backend Express.js (server/)

> Ativo quando `VITE_API_MODE=postgres` (modo VPS).

| Arquivo | O que faz |
|---------|-----------|
| `index.ts` | Servidor principal. CORS, JSON 50MB, rotas, health check. Porta 3001 |
| `db.ts` | Pool de conexão PostgreSQL |
| `middleware/auth.ts` | Valida chave admin (`Authorization: Bearer`) |

### Rotas da API (server/routes/)

| Rota | Endpoints |
|------|-----------|
| `/api/products` | GET, POST, PUT, DELETE, POST /upsert |
| `/api/categories` | GET, POST, POST /batch, PUT, DELETE |
| `/api/sellers` | GET, GET /slug/:slug, POST, PUT, DELETE |
| `/api/orders` | GET, GET /:id/items, POST, PUT, DELETE |
| `/api/settings` | GET, PUT /:key |
| `/api/banners` | GET, POST, PUT, DELETE |
| `/api/payment-conditions` | GET, POST, PUT, DELETE |
| `/api/upload` | POST /image (multipart), POST /base64 |
| `/api/auth` | GET /session, POST /login, POST /logout (admin aberto) |
| `/api/health` | GET → `{"status":"ok","mode":"postgres"}` |

---

## 👤 Sistema de Vendedores

```
1. Admin cria vendedor (nome: "João Silva", slug: "joao-silva", WhatsApp)
   → Link gerado: https://dominio.com/v/joao-silva

2. Cliente acessa /v/joao-silva
   → SellerProvider busca vendedor pelo slug
   → SellerContext.seller = { id, name, slug, whatsapp }

3. Cliente navega normalmente (catálogo, produto, sacola)
   → URLs mantêm prefixo: /v/joao-silva/sacola

4. Cliente finaliza pedido
   → Pedido registrado com seller_id e seller_name
   → WhatsApp enviado para o número do vendedor
```

---

## 📺 Modo TV

```
1. Admin configura em /admin → aba "Modo TV"
   → Cores, intervalo, fonte de produtos, elementos visíveis

2. TV/Monitor acessa /tv
   → Carrega produtos, banners e configurações
   → Inicia rotação automática em fullscreen
   → Cursor oculto, sem scrollbars (modo kiosk)
```

**Configurações disponíveis:** cor de fundo, cor do texto, cor do preço, intervalo, fonte (últimos/destaques/manual), tamanho, mostrar/ocultar código/marca/desconto/logo/navbar/progresso/contador.

---

## 🔄 Fluxo de Dados (como tudo se conecta)

```
Cliente navega no catálogo
  → Index.tsx → useDbProducts() → productsApi.fetchAll()
    → api-client.ts decide:
      → Cloud: supabase.from("products").select("*")
      → VPS:   GET http://localhost:3001/api/products

Cliente acessa via link de vendedor
  → /v/joao-silva → SellerProvider identifica vendedor

Cliente adiciona ao carrinho
  → ProductCard → AddToCartDialog → useCart().addItem()
  → CartContext atualiza estado global

Cliente finaliza pedido
  → Checkout coleta dados + vendedor
  → ordersApi.create() salva no banco
  → Gera mensagem → abre WhatsApp
  → clearCart() → tela de confirmação

TV exibe produtos
  → TvMode.tsx carrega dados + settings
  → Rotação automática com fade
```

---

## 🗄️ Banco de Dados

### Tabelas (10 no total)

| Tabela | Para quê | Acesso público |
|--------|----------|---------------|
| `products` | Produtos do catálogo | Leitura pública, CRUD admin |
| `categories` | Categorias | Leitura pública, CRUD admin |
| `orders` | Pedidos | INSERT público, resto admin |
| `order_items` | Itens dos pedidos | INSERT público, resto admin |
| `banners` | Banners do carrossel | Leitura pública, CRUD admin |
| `sellers` | Vendedores | Leitura pública, CRUD admin |
| `store_settings` | Configurações | Leitura pública, CRUD admin |
| `payment_conditions` | Formas de pagamento | Leitura pública, CRUD admin |
| `catalog_tabs` | Abas de filtro | Leitura pública, CRUD admin |
| `user_roles` | Permissões | Somente admin |

### Storage

| Bucket | Público | Para quê |
|--------|---------|----------|
| `product-images` | Sim | Imagens de produtos |

### Funções do Banco

| Função | Para quê |
|--------|----------|
| `has_role(user_id, role)` | Verifica se o usuário tem a permissão |
| `update_updated_at_column()` | Atualiza `updated_at` automaticamente |

---

## 📖 Documentação Técnica (docs/)

| Documento | O que contém |
|-----------|-------------|
| `ESTRUTURA_DO_PROJETO.md` | Este documento |
| `INSTALACAO_LOCAL.md` | Guia completo de instalação em VPS |
| `ERP_INTEGRATION_API.md` | API de integração ERP (entrada) |
| `ERP_OUTBOUND_API.md` | API de saída para ERP |
| `ERP_IMAGE_IMPORT_API.md` | Importação de imagens via ERP |
| `IMAGE_SYNC_API.md` | Sincronização de imagens (Base64, SHA-256) |
| `PRODUCT_SYNC_API.md` | Sincronização de produtos (upsert) |
| `ORDERS_API.md` | API de pedidos (consulta e status) |

---

## ⚙️ Arquivos de Configuração (raiz)

| Arquivo | Para quê |
|---------|----------|
| `vite.config.ts` | Configuração do bundler (alias `@/`, plugins) |
| `tailwind.config.ts` | Cores, breakpoints, animações |
| `tsconfig.json` | TypeScript |
| `postcss.config.js` | PostCSS (Tailwind + Autoprefixer) |
| `eslint.config.js` | Qualidade de código |
| `vitest.config.ts` | Testes unitários |
| `components.json` | shadcn/ui |
| `index.html` | HTML raiz da SPA |
| `.env` | Variáveis de ambiente (auto-gerado) |

---

*Documentação atualizada em 23/02/2026.*
