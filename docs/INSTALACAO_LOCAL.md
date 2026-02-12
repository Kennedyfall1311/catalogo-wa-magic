# 📦 Guia de Instalação Local do Catálogo

> Documentação completa para rodar o catálogo em ambiente local com banco de dados **PostgreSQL** e servidor **Express.js**.

---

## 📋 Índice

1. [Pré-requisitos](#1-pré-requisitos)
2. [Clonar o Repositório](#2-clonar-o-repositório)
3. [Instalar Dependências do Projeto](#3-instalar-dependências-do-projeto)
4. [Instalar e Configurar o PostgreSQL](#4-instalar-e-configurar-o-postgresql)
5. [Configurar Variáveis de Ambiente](#5-configurar-variáveis-de-ambiente)
6. [Iniciar o Backend (Express.js)](#6-iniciar-o-backend-expressjs)
7. [Iniciar o Frontend (React + Vite)](#7-iniciar-o-frontend-react--vite)
8. [Upload de Imagens](#8-upload-de-imagens)
9. [Estrutura do Projeto](#9-estrutura-do-projeto)
10. [Estrutura do Banco de Dados](#10-estrutura-do-banco-de-dados)
11. [API REST — Referência Completa](#11-api-rest--referência-completa)
12. [Arquitetura Dual Mode](#12-arquitetura-dual-mode)
13. [Comandos Úteis](#13-comandos-úteis)
14. [Build para Produção](#14-build-para-produção)
15. [Solução de Problemas](#15-solução-de-problemas)

---

## 1. Pré-requisitos

| Ferramenta | Versão mínima | Link de download |
|------------|---------------|------------------|
| **Node.js** | 18+ | https://nodejs.org |
| **npm** ou **bun** | npm 9+ / bun 1+ | Incluso com Node.js / https://bun.sh |
| **Git** | 2.30+ | https://git-scm.com |
| **PostgreSQL** | 15+ | https://www.postgresql.org/download |

> 💡 **Dica:** Recomendamos o uso do **bun** para instalação mais rápida das dependências.

---

## 2. Clonar o Repositório

```bash
git clone <URL_DO_REPOSITORIO>
cd catalogo
```

---

## 3. Instalar Dependências do Projeto

```bash
# Com npm
npm install

# Ou com bun (mais rápido)
bun install
```

As principais dependências do projeto são:

| Pacote | Função |
|--------|--------|
| `react` + `react-dom` | Framework da interface |
| `vite` | Build tool e dev server |
| `tailwindcss` | Estilização CSS utility-first |
| `express` | Servidor backend REST |
| `pg` | Driver PostgreSQL para Node.js |
| `tsx` | Executor de TypeScript para o servidor |
| `multer` | Middleware para upload de arquivos |
| `xlsx` | Leitura/escrita de planilhas Excel |
| `zod` | Validação de schemas |
| `@supabase/supabase-js` | Cliente Supabase (usado no modo cloud) |

---

## 4. Instalar e Configurar o PostgreSQL

### 4.1 — Instalar o PostgreSQL

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS (Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Windows:**
Baixe o instalador em https://www.postgresql.org/download/windows/ e siga o assistente.
Durante a instalação, **anote a senha** que definir para o usuário `postgres`.

### 4.2 — Verificar se está rodando

```bash
# Linux
sudo systemctl status postgresql

# macOS
brew services list | grep postgresql

# Windows — verificar no "Serviços" do Windows (services.msc)
```

### 4.3 — Configurar acesso à rede

O PostgreSQL roda na porta **5432** por padrão.

**Liberar porta no firewall (se necessário):**
```bash
# Linux (UFW)
sudo ufw allow 5432/tcp

# Linux (firewalld)
sudo firewall-cmd --add-port=5432/tcp --permanent
sudo firewall-cmd --reload

# Windows — crie regra de entrada para porta 5432 no Firewall do Windows
```

**Configurar autenticação — `pg_hba.conf`:**

Localize o arquivo conforme seu sistema:
```
Linux:   /etc/postgresql/15/main/pg_hba.conf
macOS:   /opt/homebrew/var/postgresql@15/pg_hba.conf
Windows: C:\Program Files\PostgreSQL\15\data\pg_hba.conf
```

Certifique-se de que estas linhas existam:
```
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                md5
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
```

**Configurar escuta — `postgresql.conf`:**

No mesmo diretório do `pg_hba.conf`:
```
listen_addresses = 'localhost'
port = 5432
```

**Reiniciar após alterações:**
```bash
# Linux
sudo systemctl restart postgresql

# macOS
brew services restart postgresql@15
```

### 4.4 — Definir senha do usuário postgres

```bash
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'sua_senha_aqui';"
```

> ⚠️ **Importante:** Guarde esta senha — ela será usada na variável `DATABASE_URL`.

### 4.5 — Testar conexão

```bash
psql -U postgres -h localhost -p 5432
# Se conectar com sucesso, você verá: postgres=#
# Para sair: \q
```

### 4.6 — Criar o banco de dados

```bash
psql -U postgres -h localhost -p 5432
```

```sql
CREATE DATABASE catalogo;
\c catalogo
```

### 4.7 — Criar as tabelas

Execute o SQL abaixo **dentro do banco `catalogo`**:

```sql
-- ═══════════════════════════════════════════════════
-- EXTENSÕES
-- ═══════════════════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ═══════════════════════════════════════════════════
-- TIPOS CUSTOMIZADOS
-- ═══════════════════════════════════════════════════
CREATE TYPE public.app_role AS ENUM ('admin');

-- ═══════════════════════════════════════════════════
-- TABELAS
-- ═══════════════════════════════════════════════════

-- Roles de usuário (usado no modo Supabase)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Categorias de produto
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Produtos
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  slug TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2),
  description TEXT DEFAULT '',
  image_url TEXT DEFAULT '/placeholder.svg',
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  featured BOOLEAN NOT NULL DEFAULT false,
  featured_order INTEGER NOT NULL DEFAULT 0,
  quick_filter_1 BOOLEAN NOT NULL DEFAULT false,
  quick_filter_2 BOOLEAN NOT NULL DEFAULT false,
  brand TEXT,
  reference TEXT,
  manufacturer_code TEXT,
  unit_of_measure TEXT,
  quantity NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Configurações da loja
CREATE TABLE public.store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL DEFAULT ''
);

-- Condições de pagamento
CREATE TABLE public.payment_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Banners (carrossel)
CREATE TABLE public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  link TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Abas do catálogo (filtros rápidos customizáveis)
CREATE TABLE public.catalog_tabs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  filter_type TEXT NOT NULL DEFAULT 'all',
  filter_value TEXT,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pedidos
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_cpf_cnpj TEXT,
  payment_method TEXT,
  notes TEXT,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  shipping_fee NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Itens do pedido
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_code TEXT,
  unit_price NUMERIC NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════
-- FUNÇÕES E TRIGGERS
-- ═══════════════════════════════════════════════════

-- Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Verificar role do usuário (compatibilidade com Supabase)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
```

### 4.8 — Inserir dados iniciais

```sql
INSERT INTO public.store_settings (key, value) VALUES
  ('whatsapp_number', '5511999999999'),
  ('store_name', 'Catálogo'),
  ('store_subtitle', 'Distribuidora'),
  ('payment_conditions_enabled', 'false'),
  ('shipping_enabled', 'false'),
  ('shipping_fee', '0'),
  ('minimum_order_enabled', 'false'),
  ('minimum_order_value', '0'),
  ('hide_products_without_photo', 'false'),
  ('catalog_first_page_mode', 'default'),
  ('show_quick_filters_mobile', 'true'),
  ('show_brand_filter_mobile', 'true')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.categories (name, slug) VALUES
  ('Roupas', 'roupas'),
  ('Calçados', 'calcados'),
  ('Acessórios', 'acessorios'),
  ('Promoções', 'promocoes')
ON CONFLICT (slug) DO NOTHING;
```

---

## 5. Configurar Variáveis de Ambiente

Crie o arquivo `.env` na **raiz** do projeto:

```env
# ═══════════════════════════════════════════════════
# MODO DE OPERAÇÃO
# ═══════════════════════════════════════════════════
# "postgres" = usa PostgreSQL local com Express.js
# Deixe vazio ou remova para usar o Supabase Cloud
VITE_API_MODE=postgres

# ═══════════════════════════════════════════════════
# BACKEND EXPRESS
# ═══════════════════════════════════════════════════
# URL base da API Express (usada pelo frontend)
VITE_API_URL=http://localhost:3001/api

# ═══════════════════════════════════════════════════
# BANCO DE DADOS
# ═══════════════════════════════════════════════════
# Formato: postgresql://USUARIO:SENHA@HOST:PORTA/BANCO
DATABASE_URL=postgresql://postgres:sua_senha@localhost:5432/catalogo
```

> ⚠️ **Substitua `sua_senha` pela senha real** que você definiu no passo 4.4.

---

## 6. Iniciar o Backend (Express.js)

O backend é um servidor Express.js que se conecta diretamente ao PostgreSQL.

```bash
npx tsx server/index.ts
```

Saída esperada:
```
🚀 Servidor backend rodando em http://localhost:3001
📦 Modo: PostgreSQL direto
```

**Verificar se está funcionando:**
```bash
curl http://localhost:3001/api/health
# Resposta: {"status":"ok","mode":"postgres"}
```

### Arquivos do Backend

```
server/
├── index.ts              # Ponto de entrada — configura Express, CORS, rotas
├── db.ts                 # Pool de conexão PostgreSQL (usa DATABASE_URL)
└── routes/
    ├── products.ts       # CRUD de produtos + upsert em lote
    ├── categories.ts     # CRUD de categorias
    ├── settings.ts       # Leitura/escrita de configurações da loja
    ├── banners.ts        # CRUD de banners do carrossel
    ├── payment-conditions.ts  # CRUD de condições de pagamento
    ├── upload.ts         # Upload de imagens (multipart + base64)
    └── auth.ts           # Mock de autenticação (admin sempre aberto)
```

### Detalhes Técnicos do Backend

- **Porta:** 3001 (configurável via variável `PORT`)
- **CORS:** Habilitado para todas as origens
- **Body limit:** 50MB (para suportar uploads base64)
- **Imagens:** Salvas em `public/uploads/` e servidas via `/uploads/`
- **Autenticação:** Desativada — o painel admin é aberto no modo local

---

## 7. Iniciar o Frontend (React + Vite)

Em **outro terminal** (o backend precisa continuar rodando):

```bash
# Com npm
npm run dev

# Ou com bun
bun run dev
```

Saída esperada:
```
VITE v5.x.x  ready in XXXms

➜  Local:   http://localhost:8080/
➜  Network: http://X.X.X.X:8080/
```

### Rotas do Frontend

| Rota | Descrição |
|------|-----------|
| `/` | 🏪 Catálogo público — vitrine de produtos |
| `/produto/:slug` | 📦 Página de detalhe do produto |
| `/carrinho` | 🛒 Carrinho de compras |
| `/checkout` | 💳 Finalização do pedido |
| `/admin` | ⚙️ Painel administrativo |

### Abas do Painel Administrativo

| Aba | Descrição |
|-----|-----------|
| **Vendas** | Dashboard com métricas, filtro por período, lista de pedidos com impressão |
| **Produtos** | CRUD completo, filtros, seleção em lote, upload rápido de fotos |
| **Categorias** | Gerenciamento de categorias com criação e remoção |
| **Importar** | Importação em lote via Excel/CSV + importação de imagens Base64 |
| **Catálogo** | Customização visual: cores, campos visíveis, botões rápidos, destaques, mobile |
| **Config** | Loja, aparência, banners, empresa, redes sociais, frete, pedido mínimo, pagamento |
| **ERP** | Configuração de integração com sistemas ERP externos |

> 💡 No modo PostgreSQL local, o painel admin é aberto (sem autenticação).
> Para protegê-lo em produção, configure um proxy reverso (Nginx) com autenticação básica.

---

## 8. Upload de Imagens

No modo PostgreSQL, as imagens são salvas **localmente** na pasta `public/uploads/`.

```
public/
  uploads/
    abc123.jpg        ← imagens de produtos
    banner-xyz.png    ← imagens de banners
    logo-abc.png      ← logo da loja
```

O servidor Express serve esses arquivos automaticamente via `/uploads/`.

**Formatos de upload suportados:**
- **Multipart** (`POST /api/upload/image`) — usado pelo formulário de produto e banners
- **Base64** (`POST /api/upload/base64`) — usado pela importação de imagens em lote

---

## 9. Estrutura do Projeto

```
catalogo/
├── docs/                          # Documentação
│   ├── INSTALACAO_LOCAL.md        # Este guia
│   ├── ERP_INTEGRATION_API.md     # Especificação da API de integração ERP
│   ├── ERP_IMAGE_IMPORT_API.md    # API de importação de imagens
│   └── ERP_OUTBOUND_API.md        # API de pedidos (outbound)
│
├── server/                        # Backend Express.js (modo local)
│   ├── index.ts                   # Servidor principal
│   ├── db.ts                      # Conexão PostgreSQL
│   └── routes/                    # Rotas REST
│
├── src/                           # Frontend React
│   ├── main.tsx                   # Ponto de entrada React
│   ├── App.tsx                    # Router principal
│   ├── index.css                  # Tokens de design (CSS variables)
│   ├── pages/                     # Páginas da aplicação
│   │   ├── Index.tsx              # Catálogo público
│   │   ├── Admin.tsx              # Painel administrativo
│   │   ├── ProductDetail.tsx      # Detalhe do produto
│   │   ├── Cart.tsx               # Carrinho
│   │   ├── Checkout.tsx           # Checkout
│   │   └── NotFound.tsx           # 404
│   ├── components/                # Componentes React
│   │   ├── admin/                 # Componentes do painel admin
│   │   └── ui/                    # Componentes base (shadcn/ui)
│   ├── hooks/                     # React hooks customizados
│   ├── lib/                       # Utilitários e API client
│   ├── contexts/                  # React contexts (carrinho)
│   ├── types/                     # Tipos TypeScript
│   └── integrations/              # Integração Supabase (modo cloud)
│
├── public/                        # Arquivos estáticos
│   └── uploads/                   # Imagens uploadadas (modo local)
│
├── supabase/                      # Configuração Supabase (modo cloud)
│   ├── config.toml
│   └── functions/                 # Edge functions
│
├── .env                           # Variáveis de ambiente
├── vite.config.ts                 # Configuração Vite
├── tailwind.config.ts             # Configuração Tailwind CSS
├── tsconfig.json                  # Configuração TypeScript
└── package.json                   # Dependências do projeto
```

---

## 10. Estrutura do Banco de Dados

### Tabela `products` — Produtos

| Coluna | Tipo | Obrigatório | Padrão | Descrição |
|--------|------|-------------|--------|-----------|
| `id` | UUID | ✅ | auto | Identificador único |
| `name` | TEXT | ✅ | — | Nome do produto |
| `code` | TEXT | ❌ | null | Código/SKU (único) |
| `slug` | TEXT | ✅ | — | URL amigável |
| `price` | NUMERIC(10,2) | ✅ | — | Preço atual |
| `original_price` | NUMERIC(10,2) | ❌ | null | Preço original (promoção) |
| `description` | TEXT | ❌ | '' | Descrição do produto |
| `image_url` | TEXT | ❌ | '/placeholder.svg' | URL da imagem |
| `category_id` | UUID (FK) | ❌ | null | Referência à categoria |
| `active` | BOOLEAN | ✅ | true | Produto visível no catálogo |
| `featured` | BOOLEAN | ✅ | false | Produto em destaque |
| `featured_order` | INTEGER | ✅ | 0 | Ordem de exibição dos destaques |
| `quick_filter_1` | BOOLEAN | ✅ | false | Filtro rápido personalizado 1 |
| `quick_filter_2` | BOOLEAN | ✅ | false | Filtro rápido personalizado 2 |
| `brand` | TEXT | ❌ | null | Marca do produto |
| `reference` | TEXT | ❌ | null | Referência interna |
| `manufacturer_code` | TEXT | ❌ | null | Código do fabricante |
| `unit_of_measure` | TEXT | ❌ | null | Unidade de medida (UN, KG, etc.) |
| `quantity` | NUMERIC | ❌ | null | Quantidade em estoque |
| `created_at` | TIMESTAMPTZ | ✅ | now() | Data de criação |
| `updated_at` | TIMESTAMPTZ | ✅ | now() | Data de atualização (auto) |

### Tabela `categories` — Categorias

| Coluna | Tipo | Obrigatório | Padrão | Descrição |
|--------|------|-------------|--------|-----------|
| `id` | UUID | ✅ | auto | Identificador único |
| `name` | TEXT | ✅ | — | Nome da categoria |
| `slug` | TEXT | ✅ | — | URL amigável (único) |
| `created_at` | TIMESTAMPTZ | ✅ | now() | Data de criação |

### Tabela `orders` — Pedidos

| Coluna | Tipo | Obrigatório | Padrão | Descrição |
|--------|------|-------------|--------|-----------|
| `id` | UUID | ✅ | auto | Identificador único |
| `customer_name` | TEXT | ✅ | — | Nome do cliente |
| `customer_phone` | TEXT | ✅ | — | Telefone do cliente |
| `customer_cpf_cnpj` | TEXT | ❌ | null | CPF ou CNPJ |
| `payment_method` | TEXT | ❌ | null | Forma de pagamento |
| `notes` | TEXT | ❌ | null | Observações |
| `subtotal` | NUMERIC | ✅ | 0 | Subtotal dos itens |
| `shipping_fee` | NUMERIC | ✅ | 0 | Taxa de frete |
| `total` | NUMERIC | ✅ | 0 | Total do pedido |
| `status` | TEXT | ✅ | 'pending' | Status: pending, confirmed, etc. |
| `created_at` | TIMESTAMPTZ | ✅ | now() | Data do pedido |
| `updated_at` | TIMESTAMPTZ | ✅ | now() | Última atualização |

### Tabela `order_items` — Itens do Pedido

| Coluna | Tipo | Obrigatório | Padrão | Descrição |
|--------|------|-------------|--------|-----------|
| `id` | UUID | ✅ | auto | Identificador único |
| `order_id` | UUID (FK) | ✅ | — | Referência ao pedido |
| `product_id` | UUID (FK) | ❌ | null | Referência ao produto |
| `product_name` | TEXT | ✅ | — | Nome (snapshot) |
| `product_code` | TEXT | ❌ | null | Código (snapshot) |
| `unit_price` | NUMERIC | ✅ | — | Preço unitário |
| `quantity` | INTEGER | ✅ | 1 | Quantidade |
| `total_price` | NUMERIC | ✅ | — | Preço total da linha |
| `created_at` | TIMESTAMPTZ | ✅ | now() | Data de criação |

### Tabelas adicionais

| Tabela | Descrição |
|--------|-----------|
| `store_settings` | Configurações chave-valor da loja (WhatsApp, cores, frete, etc.) |
| `banners` | Imagens do carrossel da página inicial |
| `payment_conditions` | Condições de pagamento configuráveis |
| `catalog_tabs` | Abas de filtro customizáveis do catálogo |
| `user_roles` | Roles de usuário (usado no modo Supabase) |

### Diagrama de Relacionamentos

```
┌──────────────────┐
│   categories     │
│──────────────────│
│ id (PK)          │◄─────────────┐
│ name             │              │ category_id (FK)
│ slug (unique)    │              │
│ created_at       │     ┌────────┴─────────┐
└──────────────────┘     │    products       │
                         │──────────────────│
                         │ id (PK)          │◄──────────┐
                         │ name             │           │
                         │ code (unique)    │           │
                         │ slug             │           │
                         │ price            │           │
                         │ original_price   │           │
                         │ description      │           │ product_id (FK)
                         │ image_url        │           │
                         │ brand            │           │
                         │ reference        │  ┌────────┴─────────┐
                         │ manufacturer_code│  │  order_items      │
                         │ unit_of_measure  │  │──────────────────│
                         │ quantity         │  │ id (PK)          │
                         │ active           │  │ order_id (FK)    │──┐
                         │ featured         │  │ product_id (FK)  │  │
                         │ quick_filter_1   │  │ product_name     │  │
                         │ quick_filter_2   │  │ product_code     │  │
                         │ created_at       │  │ unit_price       │  │
                         │ updated_at       │  │ quantity         │  │
                         └──────────────────┘  │ total_price      │  │
                                               │ created_at       │  │
┌──────────────────┐                           └──────────────────┘  │
│  store_settings  │                                                 │
│──────────────────│     ┌──────────────────┐                        │
│ id (PK)          │     │    orders         │◄───────────────────────┘
│ key (unique)     │     │──────────────────│
│ value            │     │ id (PK)          │
└──────────────────┘     │ customer_name    │
                         │ customer_phone   │
┌──────────────────┐     │ customer_cpf_cnpj│
│payment_conditions│     │ payment_method   │
│──────────────────│     │ notes            │
│ id (PK)          │     │ subtotal         │
│ name             │     │ shipping_fee     │
│ active           │     │ total            │
│ sort_order       │     │ status           │
│ created_at       │     │ created_at       │
└──────────────────┘     │ updated_at       │
                         └──────────────────┘
┌──────────────────┐
│    banners       │     ┌──────────────────┐
│──────────────────│     │  catalog_tabs    │
│ id (PK)          │     │──────────────────│
│ image_url        │     │ id (PK)          │
│ link             │     │ name             │
│ sort_order       │     │ filter_type      │
│ active           │     │ filter_value     │
│ created_at       │     │ icon             │
└──────────────────┘     │ sort_order       │
                         │ active           │
                         │ created_at       │
                         └──────────────────┘
```

---

## 11. API REST — Referência Completa

Base URL: `http://localhost:3001/api`

### Produtos

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/products` | Listar todos os produtos |
| `GET` | `/products/slug/:slug` | Buscar produto por slug |
| `GET` | `/products/code/:code` | Buscar produto por código |
| `POST` | `/products` | Criar um novo produto |
| `PUT` | `/products/:id` | Atualizar produto existente |
| `DELETE` | `/products/:id` | Remover produto |
| `POST` | `/products/upsert` | Upsert em lote (importação) |

**Campos aceitos no POST/PUT de produto:**

```json
{
  "name": "Camiseta Básica",
  "code": "CAM001",
  "slug": "camiseta-basica",
  "price": 49.90,
  "original_price": 69.90,
  "description": "Camiseta de algodão",
  "image_url": "/uploads/cam001.jpg",
  "category_id": "uuid-da-categoria",
  "active": true,
  "brand": "Marca X",
  "reference": "REF-001",
  "manufacturer_code": "FAB-001",
  "unit_of_measure": "UN",
  "quantity": 100
}
```

### Categorias

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/categories` | Listar categorias |
| `POST` | `/categories` | Criar categoria |
| `PUT` | `/categories/:id` | Atualizar categoria |
| `DELETE` | `/categories/:id` | Remover categoria |

### Configurações

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/settings` | Listar todas as configurações |
| `PUT` | `/settings/:key` | Atualizar uma configuração |

### Banners

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/banners` | Listar banners |
| `POST` | `/banners` | Criar banner |
| `PUT` | `/banners/:id` | Atualizar banner |
| `DELETE` | `/banners/:id` | Remover banner |

### Condições de Pagamento

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/payment-conditions` | Listar condições |
| `POST` | `/payment-conditions` | Criar condição |
| `PUT` | `/payment-conditions/:id` | Atualizar |
| `DELETE` | `/payment-conditions/:id` | Remover |

### Upload

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/upload/image` | Upload multipart (form-data, campo `image`) |
| `POST` | `/upload/base64` | Upload base64 (`{ data, filename }`) |

### Autenticação

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/auth/session` | Retorna sessão mock (admin sempre logado) |
| `POST` | `/auth/login` | Login mock |
| `POST` | `/auth/logout` | Logout mock |

### Health Check

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/health` | Verifica se o servidor está rodando |

---

## 12. Arquitetura Dual Mode

O catálogo suporta dois modos de operação, alternados pela variável `VITE_API_MODE`:

| | **Modo PostgreSQL (local)** | **Modo Supabase (cloud)** |
|---|---|---|
| **Variável** | `VITE_API_MODE=postgres` | (padrão, sem variável) |
| **Backend** | Express.js local (porta 3001) | Supabase Cloud gerenciado |
| **Banco** | PostgreSQL direto | PostgreSQL gerenciado |
| **Auth** | Desativada (admin aberto) | Supabase Auth (email/senha) |
| **Storage** | Pasta `public/uploads/` | Supabase Storage (buckets) |
| **Realtime** | Polling (5s) | WebSocket nativo |
| **Upload** | Multer → disco local | Supabase Storage API |
| **Deploy** | Manual (Nginx + Node.js) | Automático via Lovable |

Para alternar, basta mudar a variável `VITE_API_MODE` no `.env` e reiniciar o frontend.

---

## 13. Comandos Úteis

### PostgreSQL

```bash
# Conectar ao banco
psql -U postgres -d catalogo

# Listar tabelas
\dt

# Descrever estrutura de uma tabela
\d products

# Contar registros
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM orders;

# Ver produtos sem imagem
SELECT name, code FROM products WHERE image_url = '/placeholder.svg' OR image_url IS NULL;

# Backup do banco
pg_dump -U postgres catalogo > backup_catalogo.sql

# Restaurar backup
psql -U postgres catalogo < backup_catalogo.sql
```

### Projeto

```bash
# Instalar dependências
npm install

# Iniciar backend (terminal 1)
npx tsx server/index.ts

# Iniciar frontend (terminal 2)
npm run dev

# Build para produção
npm run build

# Verificar tipos TypeScript
npx tsc --noEmit
```

---

## 14. Build para Produção

### Compilar o Frontend

```bash
npm run build
```

Os arquivos estáticos serão gerados na pasta `dist/`.

### Configuração do Servidor de Produção

1. **Sirva a pasta `dist/`** com Nginx ou outro servidor de arquivos estáticos
2. **Rode o backend:** `npx tsx server/index.ts` (ou use PM2 para manter rodando)
3. **Configure proxy reverso** para `/api` apontar para o Express
4. **Configure variáveis de ambiente** no servidor

### Usando PM2 (recomendado)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar o backend com PM2
pm2 start "npx tsx server/index.ts" --name catalogo-api

# Verificar status
pm2 status

# Ver logs
pm2 logs catalogo-api

# Reiniciar
pm2 restart catalogo-api

# Configurar para iniciar no boot
pm2 startup
pm2 save
```

### Exemplo de Configuração Nginx

```nginx
server {
    listen 80;
    server_name catalogo.exemplo.com;

    # Frontend estático
    root /var/www/catalogo/dist;
    index index.html;

    # SPA — redireciona todas as rotas para index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy para API Express
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Imagens uploadadas
    location /uploads/ {
        alias /var/www/catalogo/public/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 15. Resiliência e Boas Práticas

### Timeout e Retry (api-client.ts)

O frontend implementa mecanismos de resiliência em todas as chamadas REST:

| Configuração | Valor | Descrição |
|-------------|-------|-----------|
| **Timeout** | 15 segundos | Requisições são canceladas via `AbortController` após 15s |
| **Retry** | 2 tentativas | Erros de rede (`Failed to fetch`, `AbortError`) são reenviados automaticamente |
| **Backoff** | Incremental | 1s na 1ª tentativa, 2s na 2ª |

Erros de negócio (4xx) **não** são reenviados — apenas falhas de rede.

### Idempotência de Pedidos (Checkout)

O checkout gera um `X-Idempotency-Key` (UUID) antes de enviar o pedido:

- O botão "Enviar Pedido" é **desabilitado** imediatamente após o clique
- Se a API retornar erro, o carrinho **não é limpo** e o erro é exibido
- O cliente pode tentar novamente com a mesma key sem risco de duplicação

### Estados de Erro

Todos os hooks principais (`useDbProducts`, `useStoreSettings`) expõem um campo `error`:

- Se a API falhar, o catálogo exibe mensagem amigável com botão "Tentar novamente"
- O loading não fica infinito — o erro é capturado e exibido

### Fallback de Imagens

Todas as tags `<img>` possuem handler `onError` que substitui imagens quebradas pelo placeholder:

```tsx
<img
  src={product.image_url || "/placeholder.svg"}
  onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
/>
```

---

## 16. Solução de Problemas

| Problema | Causa provável | Solução |
|----------|----------------|---------|
| `relation "products" does not exist` | Tabelas não foram criadas | Execute o SQL da seção 4.7 |
| `role "postgres" does not exist` | PostgreSQL sem role padrão | Crie: `createuser -s postgres` |
| `connection refused` (porta 5432) | PostgreSQL não está rodando | `sudo systemctl start postgresql` |
| `connection refused` (porta 3001) | Backend não está rodando | `npx tsx server/index.ts` |
| `CORS error` no navegador | VITE_API_URL incorreta | Verifique o `.env` — deve ser `http://localhost:3001/api` |
| Imagens não aparecem | Pasta não existe | Crie: `mkdir -p public/uploads` |
| Produtos não aparecem | Nenhum produto ativo | Verifique: `SELECT * FROM products WHERE active = true LIMIT 5;` |
| `column "brand" does not exist` | Schema desatualizado | Execute o SQL da seção 4.7 novamente (cria as colunas novas) |
| Importação não traz marca/referência | Planilha sem cabeçalhos corretos | Use os nomes: `marca`, `referencia`, `codigo_fabricante`, `unidade_medida`, `quantidade` |
| Frontend mostra tela em branco | Erros no console | Abra DevTools (F12) e verifique os erros |
| Pedidos não aparecem no dashboard | Nenhum pedido criado | Faça um pedido de teste pelo catálogo |
| Pedido duplicado | Reenvio sem idempotency key | O frontend agora envia `X-Idempotency-Key` automaticamente |
| Loading infinito no catálogo | API indisponível | O frontend agora exibe erro após timeout de 15s com retry |

---

## Resumo Rápido

```bash
# 1. Clonar e instalar
git clone <URL> && cd catalogo && npm install

# 2. Criar banco
psql -U postgres -c "CREATE DATABASE catalogo;"
psql -U postgres -d catalogo -f schema.sql  # ou cole o SQL da seção 4.7

# 3. Configurar .env
echo 'VITE_API_MODE=postgres' > .env
echo 'VITE_API_URL=http://localhost:3001/api' >> .env
echo 'DATABASE_URL=postgresql://postgres:senha@localhost:5432/catalogo' >> .env

# 4. Iniciar (2 terminais)
npx tsx server/index.ts    # Terminal 1: Backend
npm run dev                # Terminal 2: Frontend

# 5. Acessar
# Catálogo: http://localhost:8080
# Admin:    http://localhost:8080/admin
```
