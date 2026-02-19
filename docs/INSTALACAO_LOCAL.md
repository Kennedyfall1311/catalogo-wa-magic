# 📦 Guia Completo de Instalação em VPS — Catálogo

> Documentação completa e atualizada para instalar e rodar o catálogo em uma **VPS** (Ubuntu/Debian) com **PostgreSQL**, **Express.js**, **Nginx** e **domínio próprio com SSL**.

---

## 📋 Índice

1. [Requisitos da VPS](#1-requisitos-da-vps)
2. [Preparar o Servidor](#2-preparar-o-servidor)
3. [Instalar Node.js e PM2](#3-instalar-nodejs-e-pm2)
4. [Instalar e Configurar PostgreSQL](#4-instalar-e-configurar-postgresql)
5. [Criar o Banco e Todas as Tabelas](#5-criar-o-banco-e-todas-as-tabelas)
6. [Clonar e Configurar o Projeto](#6-clonar-e-configurar-o-projeto)
7. [Criar Rotas do Backend que Faltam](#7-criar-rotas-do-backend-que-faltam)
8. [Liberar Portas no Firewall](#8-liberar-portas-no-firewall)
9. [Iniciar o Backend com PM2](#9-iniciar-o-backend-com-pm2)
10. [Build do Frontend](#10-build-do-frontend)
11. [Configurar Nginx](#11-configurar-nginx)
12. [Domínio Próprio e DNS](#12-domínio-próprio-e-dns)
13. [SSL com Let's Encrypt (HTTPS)](#13-ssl-com-lets-encrypt-https)
14. [Verificar se Tudo Funciona](#14-verificar-se-tudo-funciona)
15. [Estrutura de Arquivos na VPS](#15-estrutura-de-arquivos-na-vps)
16. [Todas as Tabelas do Banco — Referência](#16-todas-as-tabelas-do-banco--referência)
17. [Todas as Configurações (store_settings)](#17-todas-as-configurações-store_settings)
18. [API REST — Referência Completa](#18-api-rest--referência-completa)
19. [Comandos Úteis](#19-comandos-úteis)
20. [Solução de Problemas](#20-solução-de-problemas)
21. [Backup Automático](#21-backup-automático)
22. [Resumo Rápido — Copiar e Colar](#22-resumo-rápido--copiar-e-colar)

---

## 1. Requisitos da VPS

| Recurso | Mínimo | Recomendado |
|---------|--------|-------------|
| **RAM** | 1 GB | 2 GB+ |
| **CPU** | 1 vCPU | 2 vCPU |
| **Disco** | 20 GB SSD | 40 GB+ SSD |
| **SO** | Ubuntu 22.04+ / Debian 12+ | Ubuntu 24.04 LTS |
| **Acesso** | SSH root ou sudo | — |

Provedores populares: **Contabo**, **Hetzner**, **DigitalOcean**, **Vultr**, **Oracle Cloud** (free tier).

### Dependências do sistema

| Pacote | Versão | Função |
|--------|--------|--------|
| **Node.js** | 20 LTS+ | Runtime do backend Express.js |
| **npm** | 10+ | Gerenciador de pacotes |
| **PM2** | latest | Gerenciador de processos (mantém o backend rodando) |
| **PostgreSQL** | 15+ | Banco de dados |
| **Nginx** | latest | Servidor web / proxy reverso |
| **Certbot** | latest | SSL gratuito (Let's Encrypt) |
| **UFW** | built-in | Firewall |
| **Git** | latest | Clonar o repositório |
| **build-essential** | — | Compilação de dependências nativas (node-gyp) |

### Dependências do projeto (npm)

| Pacote | Função no Backend |
|--------|------------------|
| `express` | Framework HTTP do servidor |
| `pg` | Driver PostgreSQL para Node.js |
| `cors` | Middleware CORS (cross-origin) |
| `multer` | Upload de arquivos (multipart/form-data) |
| `tsx` | Executa TypeScript diretamente (sem build do server) |
| `xlsx` | Importação de planilhas Excel |

> Todas essas dependências já estão no `package.json` e serão instaladas com `npm install`.

---

## 2. Preparar o Servidor

Conecte à VPS via SSH e atualize tudo:

```bash
ssh root@SEU_IP_DA_VPS

# Atualizar pacotes
apt update && apt upgrade -y

# Instalar utilitários essenciais
apt install -y curl git build-essential ufw nginx
```

---

## 3. Instalar Node.js e PM2

```bash
# Instalar Node.js 20 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verificar instalação
node -v    # v20.x.x
npm -v     # 10.x.x

# Instalar PM2 globalmente (gerenciador de processos)
npm install -g pm2
```

---

## 4. Instalar e Configurar PostgreSQL

### 4.1 — Instalar

```bash
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql
```

### 4.2 — Definir senha do usuário postgres

```bash
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'SUA_SENHA_FORTE_AQUI';"
```

> ⚠️ **ANOTE ESTA SENHA** — você vai usá-la na `DATABASE_URL`.

### 4.3 — Verificar se está rodando

```bash
systemctl status postgresql
# Deve mostrar: active (running)
```

### 4.4 — Configurar acesso local

Edite o arquivo `pg_hba.conf`:

```bash
# Encontrar o arquivo
find /etc/postgresql -name pg_hba.conf
# Geralmente: /etc/postgresql/16/main/pg_hba.conf

nano /etc/postgresql/16/main/pg_hba.conf
```

Certifique-se de que estas linhas existam:
```
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                md5
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
```

Reinicie após alterar:
```bash
systemctl restart postgresql
```

### 4.5 — Testar conexão

```bash
psql -U postgres -h localhost -p 5432
# Se pedir senha, digite a que você definiu
# Se conectar com sucesso: postgres=#
# Para sair: \q
```

---

## 5. Criar o Banco e Todas as Tabelas

### 5.1 — Criar o banco de dados

```bash
sudo -u postgres psql -c "CREATE DATABASE catalogo;"
```

### 5.2 — Executar o schema completo

Conecte ao banco e execute **todo** o SQL abaixo:

```bash
psql -U postgres -h localhost -d catalogo
```

```sql
-- ═══════════════════════════════════════════════════════════
-- SCHEMA COMPLETO DO CATÁLOGO — VPS
-- Última atualização: 2026-02
-- Execute este bloco inteiro de uma vez
-- ═══════════════════════════════════════════════════════════

-- Extensões
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tipos customizados
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════════
-- TABELA 1: user_roles (compatibilidade com sistema de auth)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- ═══════════════════════════════════════════════════════════
-- TABELA 2: categories (categorias de produto)
-- Dependências: nenhuma
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- TABELA 3: products (produtos do catálogo)
-- Dependências: categories (category_id)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.products (
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

-- ═══════════════════════════════════════════════════════════
-- TABELA 4: sellers (vendedores com links personalizados)
-- Dependências: nenhuma
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  whatsapp TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- TABELA 5: orders (pedidos realizados via catálogo)
-- Dependências: sellers (seller_id) — opcional
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.orders (
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
  seller_id UUID REFERENCES public.sellers(id) ON DELETE SET NULL,
  seller_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- TABELA 6: order_items (itens de cada pedido)
-- Dependências: orders (order_id), products (product_id)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.order_items (
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

-- ═══════════════════════════════════════════════════════════
-- TABELA 7: store_settings (configurações da loja)
-- Dependências: nenhuma
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL DEFAULT ''
);

-- ═══════════════════════════════════════════════════════════
-- TABELA 8: payment_conditions (formas de pagamento)
-- Dependências: nenhuma
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.payment_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- TABELA 9: banners (carrossel de imagens)
-- Dependências: nenhuma
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  link TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- TABELA 10: catalog_tabs (abas de filtro rápido)
-- Dependências: nenhuma
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.catalog_tabs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  filter_type TEXT NOT NULL DEFAULT 'all',
  filter_value TEXT,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- FUNÇÕES E TRIGGERS
-- ═══════════════════════════════════════════════════════════

-- Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para products
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para orders
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função de verificação de role (compatibilidade com Supabase)
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

-- ═══════════════════════════════════════════════════════════
-- ÍNDICES PARA PERFORMANCE
-- ═══════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_code ON public.products(code);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_sellers_slug ON public.sellers(slug);
CREATE INDEX IF NOT EXISTS idx_sellers_active ON public.sellers(active);
CREATE INDEX IF NOT EXISTS idx_settings_key ON public.store_settings(key);

-- ═══════════════════════════════════════════════════════════
-- DADOS INICIAIS
-- ═══════════════════════════════════════════════════════════

INSERT INTO public.store_settings (key, value) VALUES
  -- Geral
  ('store_name', 'Meu Catálogo'),
  ('store_subtitle', 'Distribuidora'),
  ('whatsapp_number', '5511999999999'),
  -- Frete e pedido mínimo
  ('shipping_enabled', 'false'),
  ('shipping_fee', '0'),
  ('minimum_order_enabled', 'false'),
  ('minimum_order_value', '0'),
  -- Condições de pagamento
  ('payment_conditions_enabled', 'false'),
  -- Exibição do catálogo
  ('catalog_first_page_mode', 'default'),
  ('hide_products_without_photo', 'false'),
  ('show_quick_filters_mobile', 'true'),
  ('show_brand_filter_mobile', 'true'),
  -- Filtros rápidos (nomes customizáveis)
  ('quick_filter_1_name', 'Destaque 1'),
  ('quick_filter_2_name', 'Destaque 2'),
  -- Modo TV
  ('tv_background_color', '#1a1a2e'),
  ('tv_text_color', '#ffffff'),
  ('tv_interval', '5000'),
  ('tv_source', 'featured'),
  ('tv_category_id', ''),
  ('tv_show_price', 'true'),
  ('tv_show_name', 'true'),
  ('tv_show_brand', 'false'),
  ('tv_show_code', 'false'),
  ('tv_transition_effect', 'fade'),
  ('tv_layout', 'single'),
  ('tv_selected_products', '[]'),
  -- Logo
  ('logo_url', ''),
  -- Informações da empresa
  ('company_name', ''),
  ('company_cnpj', ''),
  ('company_address', ''),
  ('company_phone', ''),
  ('company_email', ''),
  ('company_info_enabled', 'false')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.categories (name, slug) VALUES
  ('Roupas', 'roupas'),
  ('Calçados', 'calcados'),
  ('Acessórios', 'acessorios'),
  ('Promoções', 'promocoes')
ON CONFLICT (slug) DO NOTHING;
```

### 5.3 — Verificar se as tabelas foram criadas

```bash
psql -U postgres -h localhost -d catalogo -c "\dt"
```

Resultado esperado (10 tabelas):
```
 Schema |        Name        | Type  |  Owner
--------+--------------------+-------+----------
 public | banners            | table | postgres
 public | catalog_tabs       | table | postgres
 public | categories         | table | postgres
 public | order_items        | table | postgres
 public | orders             | table | postgres
 public | payment_conditions | table | postgres
 public | products           | table | postgres
 public | sellers            | table | postgres
 public | store_settings     | table | postgres
 public | user_roles         | table | postgres
```

---

## 6. Clonar e Configurar o Projeto

### 6.1 — Clonar o repositório

```bash
mkdir -p /var/www
cd /var/www
git clone <URL_DO_REPOSITORIO> catalogo
cd catalogo
```

### 6.2 — Instalar dependências

```bash
npm install
```

### 6.3 — Criar a pasta de uploads

```bash
mkdir -p public/uploads
chmod 755 public/uploads
```

### 6.4 — Configurar variáveis de ambiente

Crie o arquivo `.env` na raiz do projeto:

```bash
cat > .env << 'EOF'
# ═══════════════════════════════════════════════════
# MODO DE OPERAÇÃO — OBRIGATÓRIO para VPS
# ═══════════════════════════════════════════════════
VITE_API_MODE=postgres

# ═══════════════════════════════════════════════════
# URL DA API (será proxiada pelo Nginx)
# ═══════════════════════════════════════════════════
# Use seu domínio se tiver, ou o IP da VPS:
VITE_API_URL=https://SEU_DOMINIO/api

# ═══════════════════════════════════════════════════
# BANCO DE DADOS
# ═══════════════════════════════════════════════════
DATABASE_URL=postgresql://postgres:SUA_SENHA@localhost:5432/catalogo

# ═══════════════════════════════════════════════════
# PORTA DO BACKEND (padrão: 3001)
# ═══════════════════════════════════════════════════
PORT=3001

# ═══════════════════════════════════════════════════
# BASE URL PARA UPLOADS (usado pelo backend para gerar URLs de imagens)
# ═══════════════════════════════════════════════════
API_BASE_URL=https://SEU_DOMINIO

# ═══════════════════════════════════════════════════
# CHAVE DE ADMIN — OBRIGATÓRIA em produção
# Protege todas as operações de escrita (produtos, categorias, config, etc.)
# Gere uma chave segura, ex: openssl rand -hex 32
# ═══════════════════════════════════════════════════
ADMIN_API_KEY=SUA_CHAVE_SECRETA_AQUI

# ═══════════════════════════════════════════════════
# CHAVE DE ADMIN PARA O FRONTEND
# Deve ser IGUAL à ADMIN_API_KEY acima
# O frontend envia esta chave no header Authorization
# para que as operações de admin (salvar config, etc.) funcionem
# ═══════════════════════════════════════════════════
VITE_ADMIN_API_KEY=SUA_CHAVE_SECRETA_AQUI
EOF
```

> ⚠️ **SUBSTITUA:**
> - `SUA_SENHA` → senha que você definiu no passo 4.2
> - `SEU_DOMINIO` → seu domínio (ex: `catalogo.meusite.com`) ou IP público
> - `SUA_CHAVE_SECRETA_AQUI` → uma chave secreta forte (use `openssl rand -hex 32` para gerar)

> 🔑 **IMPORTANTE — Configuração de Admin:**
> - `ADMIN_API_KEY` e `VITE_ADMIN_API_KEY` devem ter **o mesmo valor**
> - `ADMIN_API_KEY` é usada pelo **backend** (servidor Express) para validar requisições
> - `VITE_ADMIN_API_KEY` é usada pelo **frontend** para enviar a chave nas requisições de escrita
> - **Sem essas chaves**, as configurações (nome da loja, frete, modo TV, etc.) **não serão salvas** — o servidor rejeita as requisições com erro 401
> - Em **desenvolvimento local sem a chave**, o acesso é liberado automaticamente para facilitar testes
> - Em **produção**, a chave é **obrigatória** — todas as operações de escrita (PUT, POST, DELETE) serão bloqueadas sem ela

---

## 7. Criar Rotas do Backend que Faltam

O repositório base já inclui rotas para produtos, categorias, banners, configurações, pagamentos e upload. Porém, as rotas de **vendedores** e **pedidos** precisam ser criadas para o modo PostgreSQL.

### 7.1 — Criar `server/routes/sellers.ts`

```bash
cat > server/routes/sellers.ts << 'TYPESCRIPT'
import { Router } from "express";
import pool from "../db";

export const sellersRouter = Router();

// GET all sellers
sellersRouter.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM sellers ORDER BY name");
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET seller by slug
sellersRouter.get("/slug/:slug", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM sellers WHERE slug = $1 AND active = true LIMIT 1",
      [req.params.slug]
    );
    res.json(rows[0] || null);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST create seller
sellersRouter.post("/", async (req, res) => {
  try {
    const { name, slug, whatsapp } = req.body;
    const { rows } = await pool.query(
      "INSERT INTO sellers (name, slug, whatsapp) VALUES ($1, $2, $3) RETURNING *",
      [name, slug, whatsapp || null]
    );
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update seller
sellersRouter.put("/:id", async (req, res) => {
  try {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(req.body)) {
      if (key === "id" || key === "created_at") continue;
      fields.push(`${key} = $${idx}`);
      values.push(value);
      idx++;
    }

    if (fields.length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }

    values.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE sellers SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE seller
sellersRouter.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM sellers WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
TYPESCRIPT
```

### 7.2 — Criar `server/routes/orders.ts`

```bash
cat > server/routes/orders.ts << 'TYPESCRIPT'
import { Router } from "express";
import pool from "../db";

export const ordersRouter = Router();

// GET all orders
ordersRouter.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM orders ORDER BY created_at DESC");
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET order items
ordersRouter.get("/:id/items", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM order_items WHERE order_id = $1",
      [req.params.id]
    );
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST create order with items
ordersRouter.post("/", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { order, items } = req.body;
    const { rows } = await client.query(
      `INSERT INTO orders (customer_name, customer_phone, customer_cpf_cnpj, payment_method, notes, subtotal, shipping_fee, total, seller_id, seller_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        order.customer_name, order.customer_phone,
        order.customer_cpf_cnpj || null, order.payment_method || null,
        order.notes || null, order.subtotal || 0,
        order.shipping_fee || 0, order.total || 0,
        order.seller_id || null, order.seller_name || null
      ]
    );

    const createdOrder = rows[0];

    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_code, unit_price, quantity, total_price)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          createdOrder.id, item.product_id || null,
          item.product_name, item.product_code || null,
          item.unit_price, item.quantity || 1, item.total_price
        ]
      );
    }

    await client.query("COMMIT");
    res.json(createdOrder);
  } catch (err: any) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// PUT update order (status, etc.)
ordersRouter.put("/:id", async (req, res) => {
  try {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(req.body)) {
      if (key === "id" || key === "created_at") continue;
      fields.push(`${key} = $${idx}`);
      values.push(value);
      idx++;
    }

    values.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE orders SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE order
ordersRouter.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM orders WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
TYPESCRIPT
```

### 7.3 — Registrar as novas rotas no `server/index.ts`

Edite o arquivo `server/index.ts` e adicione as importações e registros:

```typescript
// Adicione estas importações no topo:
import { sellersRouter } from "./routes/sellers";
import { ordersRouter } from "./routes/orders";

// Adicione estas linhas junto com as outras rotas:
app.use("/api/sellers", sellersRouter);
app.use("/api/orders", ordersRouter);
```

O arquivo `server/index.ts` completo deve ficar assim:

```typescript
import express from "express";
import cors from "cors";
import path from "path";
import { productsRouter } from "./routes/products";
import { categoriesRouter } from "./routes/categories";
import { settingsRouter } from "./routes/settings";
import { bannersRouter } from "./routes/banners";
import { paymentConditionsRouter } from "./routes/payment-conditions";
import { uploadRouter } from "./routes/upload";
import { authRouter } from "./routes/auth";
import { sellersRouter } from "./routes/sellers";
import { ordersRouter } from "./routes/orders";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Serve uploaded images
app.use("/uploads", express.static(path.join(process.cwd(), "public/uploads")));

// API routes
app.use("/api/products", productsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/banners", bannersRouter);
app.use("/api/payment-conditions", paymentConditionsRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/auth", authRouter);
app.use("/api/sellers", sellersRouter);
app.use("/api/orders", ordersRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", mode: "postgres" });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend rodando em http://localhost:${PORT}`);
  console.log(`📦 Modo: PostgreSQL direto`);
});
```

---

## 8. Liberar Portas no Firewall

| Porta | Serviço | Acesso |
|-------|---------|--------|
| **22** | SSH | Remoto (você) |
| **80** | HTTP (Nginx) | Público |
| **443** | HTTPS (Nginx + SSL) | Público |
| **3001** | Backend Express | Apenas local (via Nginx proxy) |
| **5432** | PostgreSQL | Apenas local |

```bash
# IMPORTANTE: libere SSH PRIMEIRO para não perder acesso!
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Verificar regras
ufw status verbose
```

> 🔒 **Segurança:** As portas 3001 (Express) e 5432 (PostgreSQL) ficam **fechadas** para acesso externo. O Nginx faz o proxy.

---

## 9. Iniciar o Backend com PM2

```bash
cd /var/www/catalogo

# Iniciar o backend
pm2 start "npx tsx server/index.ts" --name catalogo-api --cwd /var/www/catalogo

# Verificar se está rodando
pm2 status

# Ver logs em tempo real
pm2 logs catalogo-api

# Testar localmente
curl http://localhost:3001/api/health
# Resposta: {"status":"ok","mode":"postgres"}

# Configurar para iniciar automaticamente no boot
pm2 startup
pm2 save
```

### Comandos PM2 úteis

```bash
pm2 restart catalogo-api    # Reiniciar
pm2 stop catalogo-api       # Parar
pm2 delete catalogo-api     # Remover
pm2 logs catalogo-api       # Ver logs
pm2 monit                   # Monitor em tempo real
```

---

## 10. Build do Frontend

```bash
cd /var/www/catalogo

# Compilar o frontend para produção
npm run build

# Os arquivos estáticos serão gerados em dist/
ls dist/
# Deve conter: index.html, assets/, etc.
```

---

## 11. Configurar Nginx

### 11.1 — Criar a configuração do site

```bash
nano /etc/nginx/sites-available/catalogo
```

Cole o conteúdo abaixo:

```nginx
server {
    listen 80;
    server_name SEU_DOMINIO www.SEU_DOMINIO;

    # Tamanho máximo de upload (50MB para imagens)
    client_max_body_size 50M;

    # ─── Frontend estático (React build) ───
    root /var/www/catalogo/dist;
    index index.html;

    # SPA — todas as rotas redirecionam para index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # ─── Proxy reverso para API Express ───
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
    }

    # ─── Imagens uploadadas ───
    location /uploads/ {
        alias /var/www/catalogo/public/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # ─── Cache para assets estáticos ───
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

> ⚠️ **Substitua `SEU_DOMINIO`** pelo seu domínio. Se usar apenas IP, coloque `server_name SEU_IP;`.

### 11.2 — Ativar o site e reiniciar Nginx

```bash
# Ativar o site
ln -sf /etc/nginx/sites-available/catalogo /etc/nginx/sites-enabled/

# Remover configuração padrão
rm -f /etc/nginx/sites-enabled/default

# Testar configuração
nginx -t

# Reiniciar Nginx
systemctl restart nginx
systemctl enable nginx
```

---

## 12. Domínio Próprio e DNS

### 12.1 — Registrar um domínio

Registre um domínio em qualquer registrador: **Registro.br**, **Cloudflare**, **Namecheap**, **GoDaddy**, etc.

### 12.2 — Configurar DNS

Acesse o painel de DNS do seu registrador e crie os seguintes registros:

| Tipo | Nome | Valor | TTL |
|------|------|-------|-----|
| **A** | `@` (raiz) | `IP_DA_SUA_VPS` | 300 |
| **A** | `www` | `IP_DA_SUA_VPS` | 300 |

Exemplo para domínio `meusite.com.br` com VPS IP `203.0.113.50`:

| Tipo | Nome | Valor |
|------|------|-------|
| A | @ | 203.0.113.50 |
| A | www | 203.0.113.50 |

### 12.3 — Usar subdomínio (ex: catalogo.meusite.com.br)

Se preferir usar um subdomínio em vez do domínio raiz:

| Tipo | Nome | Valor |
|------|------|-------|
| A | catalogo | `IP_DA_SUA_VPS` |

E no Nginx, use:
```nginx
server_name catalogo.meusite.com.br;
```

### 12.4 — Aguardar propagação DNS

A propagação pode levar de **5 minutos a 72 horas**. Verifique com:

```bash
# Verificar se o DNS está apontando para sua VPS
dig +short SEU_DOMINIO
# Deve retornar o IP da sua VPS

# Ou use:
nslookup SEU_DOMINIO
```

Você também pode verificar em: [https://dnschecker.org](https://dnschecker.org)

### 12.5 — Redirecionar www para domínio principal (opcional)

Adicione um bloco extra no Nginx:

```nginx
server {
    listen 80;
    server_name www.SEU_DOMINIO;
    return 301 https://SEU_DOMINIO$request_uri;
}
```

---

## 13. SSL com Let's Encrypt (HTTPS)

> 📌 **Requer domínio** — se estiver usando apenas IP, pule esta etapa.

```bash
# Instalar Certbot
apt install -y certbot python3-certbot-nginx

# Gerar certificado SSL (com www)
certbot --nginx -d SEU_DOMINIO -d www.SEU_DOMINIO

# Se usar subdomínio:
# certbot --nginx -d catalogo.meusite.com.br

# Seguir as instruções interativas (email, aceitar termos)
# O Certbot configurará o Nginx automaticamente para HTTPS

# Testar renovação automática:
certbot renew --dry-run
```

Após o SSL, atualize o `.env` e faça rebuild:

```bash
# Atualizar .env
sed -i 's|VITE_API_URL=http://|VITE_API_URL=https://|' /var/www/catalogo/.env
sed -i 's|API_BASE_URL=http://|API_BASE_URL=https://|' /var/www/catalogo/.env

# Rebuild do frontend
cd /var/www/catalogo
npm run build

# Reiniciar backend (para pegar novo API_BASE_URL nas URLs de upload)
pm2 restart catalogo-api
```

### Renovação automática do certificado

O Certbot já configura um cron/timer para renovação. Verifique:

```bash
systemctl list-timers | grep certbot
```

---

## 14. Verificar se Tudo Funciona

### Checklist completo

```bash
# 1. PostgreSQL rodando?
systemctl status postgresql

# 2. Todas as 10 tabelas existem?
psql -U postgres -h localhost -d catalogo -c "\dt"

# 3. Backend rodando?
pm2 status
curl http://localhost:3001/api/health
# Resposta: {"status":"ok","mode":"postgres"}

# 4. Nginx rodando?
systemctl status nginx

# 5. DNS apontando corretamente?
dig +short SEU_DOMINIO

# 6. SSL funcionando?
curl -I https://SEU_DOMINIO
# Deve retornar HTTP/2 200

# 7. Testar APIs:
curl https://SEU_DOMINIO/api/products
curl https://SEU_DOMINIO/api/categories
curl https://SEU_DOMINIO/api/sellers
curl https://SEU_DOMINIO/api/settings
curl https://SEU_DOMINIO/api/banners
curl https://SEU_DOMINIO/api/payment-conditions

# 8. Testar criação de produto:
curl -X POST https://SEU_DOMINIO/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Produto Teste",
    "code": "TST001",
    "slug": "produto-teste",
    "price": 29.90,
    "active": true
  }'

# 9. Testar criação de vendedor:
curl -X POST https://SEU_DOMINIO/api/sellers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "slug": "joao-silva",
    "whatsapp": "5511999999999"
  }'

# 10. Acessar pelo navegador:
#    https://SEU_DOMINIO          → Catálogo público
#    https://SEU_DOMINIO/admin    → Painel administrativo
#    https://SEU_DOMINIO/v/joao-silva → Link do vendedor
```

---

## 15. Estrutura de Arquivos na VPS

```
/var/www/catalogo/
├── dist/                          # Frontend compilado (servido pelo Nginx)
├── server/                        # Backend Express.js
│   ├── index.ts                   # Servidor principal (porta 3001)
│   ├── db.ts                      # Pool de conexão PostgreSQL
│   └── routes/
│       ├── products.ts            # CRUD de produtos + upsert em lote
│       ├── categories.ts          # CRUD de categorias + batch insert
│       ├── sellers.ts             # CRUD de vendedores + busca por slug
│       ├── orders.ts              # CRUD de pedidos + itens (transação)
│       ├── settings.ts            # Configurações da loja (key/value)
│       ├── banners.ts             # CRUD de banners do carrossel
│       ├── payment-conditions.ts  # Condições de pagamento
│       ├── upload.ts              # Upload de imagens (multipart + base64)
│       └── auth.ts                # Autenticação mock (admin aberto)
├── public/
│   └── uploads/                   # Imagens uploadadas (produtos, banners, logo)
├── src/                           # Código fonte React (só para desenvolvimento)
│   ├── lib/
│   │   └── api-client.ts          # Camada de abstração (Supabase ↔ PostgreSQL)
│   ├── contexts/
│   │   ├── CartContext.tsx         # Carrinho de compras
│   │   └── SellerContext.tsx       # Contexto do vendedor ativo
│   ├── hooks/                     # Hooks customizados
│   ├── pages/                     # Páginas (Index, Admin, Cart, Checkout, TvMode)
│   └── components/                # Componentes React
├── .env                           # Variáveis de ambiente
└── package.json                   # Dependências
```

---

## 16. Todas as Tabelas do Banco — Referência

### Mapa de dependências

```
categories ─────────┐
                     ├──→ products
sellers ─────────────┤
                     ├──→ orders ──→ order_items
                     │
(independentes)      │
├── store_settings   │
├── payment_conditions
├── banners
├── catalog_tabs
└── user_roles
```

### Resumo de cada tabela

| # | Tabela | Colunas-chave | Função |
|---|--------|---------------|--------|
| 1 | `categories` | name, slug | Categorias de produtos (Roupas, Calçados, etc.) |
| 2 | `products` | name, code, slug, price, category_id, active, featured | Produtos do catálogo |
| 3 | `sellers` | name, slug, whatsapp, active | Vendedores com links personalizados `/v/:slug` |
| 4 | `orders` | customer_name, customer_phone, total, status, seller_id | Pedidos realizados |
| 5 | `order_items` | order_id, product_name, quantity, unit_price, total_price | Itens de cada pedido |
| 6 | `store_settings` | key, value | Configurações da loja (key-value) |
| 7 | `payment_conditions` | name, active, sort_order | Formas de pagamento customizáveis |
| 8 | `banners` | image_url, link, sort_order, active | Banners do carrossel |
| 9 | `catalog_tabs` | name, filter_type, filter_value, icon | Abas de filtro rápido no catálogo |
| 10 | `user_roles` | user_id, role | Compatibilidade com auth Supabase |

---

## 17. Todas as Configurações (store_settings)

Cada configuração é um par `key` → `value` (texto). Valores booleanos usam `"true"` / `"false"`.

### Configurações Gerais

| Key | Padrão | Descrição |
|-----|--------|-----------|
| `store_name` | `Meu Catálogo` | Nome exibido no topo do catálogo |
| `store_subtitle` | `Distribuidora` | Subtítulo / tagline |
| `whatsapp_number` | `5511999999999` | Número do WhatsApp principal (com DDI+DDD) |
| `logo_url` | (vazio) | URL do logotipo da loja |

### Informações da Empresa

| Key | Padrão | Descrição |
|-----|--------|-----------|
| `company_info_enabled` | `false` | Exibir ícone "Sobre" no catálogo |
| `company_name` | (vazio) | Razão social |
| `company_cnpj` | (vazio) | CNPJ |
| `company_address` | (vazio) | Endereço completo |
| `company_phone` | (vazio) | Telefone fixo |
| `company_email` | (vazio) | E-mail comercial |

### Frete e Pedido Mínimo

| Key | Padrão | Descrição |
|-----|--------|-----------|
| `shipping_enabled` | `false` | Cobrar taxa de entrega |
| `shipping_fee` | `0` | Valor da taxa de entrega (em reais) |
| `minimum_order_enabled` | `false` | Exigir valor mínimo de pedido |
| `minimum_order_value` | `0` | Valor mínimo (em reais) |

### Condições de Pagamento

| Key | Padrão | Descrição |
|-----|--------|-----------|
| `payment_conditions_enabled` | `false` | Habilitar seleção de forma de pagamento no checkout |

### Exibição do Catálogo

| Key | Padrão | Descrição |
|-----|--------|-----------|
| `catalog_first_page_mode` | `default` | Modo da primeira página: `default`, `featured`, `banners` |
| `hide_products_without_photo` | `false` | Ocultar produtos sem imagem do catálogo público |
| `show_quick_filters_mobile` | `true` | Exibir filtros rápidos no mobile |
| `show_brand_filter_mobile` | `true` | Exibir filtro de marca no mobile |
| `quick_filter_1_name` | `Destaque 1` | Nome customizável do filtro rápido 1 |
| `quick_filter_2_name` | `Destaque 2` | Nome customizável do filtro rápido 2 |

### Modo TV (Digital Signage)

| Key | Padrão | Descrição |
|-----|--------|-----------|
| `tv_background_color` | `#1a1a2e` | Cor de fundo da tela |
| `tv_text_color` | `#ffffff` | Cor do texto |
| `tv_interval` | `5000` | Intervalo de rotação em ms (5s padrão) |
| `tv_source` | `featured` | Fonte: `featured`, `category`, `selected` |
| `tv_category_id` | (vazio) | ID da categoria (quando source=category) |
| `tv_show_price` | `true` | Exibir preço na TV |
| `tv_show_name` | `true` | Exibir nome do produto |
| `tv_show_brand` | `false` | Exibir marca |
| `tv_show_code` | `false` | Exibir código/SKU |
| `tv_transition_effect` | `fade` | Efeito de transição |
| `tv_layout` | `single` | Layout: `single` (1 produto) |
| `tv_selected_products` | `[]` | JSON array de IDs (quando source=selected) |

---

## 18. API REST — Referência Completa

Base URL: `https://SEU_DOMINIO/api`

### Produtos (`/api/products`)

| Método | Rota | Descrição | Body |
|--------|------|-----------|------|
| `GET` | `/products` | Listar todos | — |
| `GET` | `/products/slug/:slug` | Buscar por slug | — |
| `GET` | `/products/code/:code` | Buscar por código | — |
| `POST` | `/products` | Criar produto | `{ name, code, slug, price, ... }` |
| `PUT` | `/products/:id` | Atualizar | `{ campo: valor, ... }` |
| `DELETE` | `/products/:id` | Remover | — |
| `POST` | `/products/upsert` | Importação em lote | `{ products: [...] }` |

**Exemplo — criar produto:**
```bash
curl -X POST https://SEU_DOMINIO/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Camiseta Básica",
    "code": "CAM001",
    "slug": "camiseta-basica",
    "price": 49.90,
    "original_price": 69.90,
    "description": "Camiseta de algodão",
    "category_id": null,
    "active": true,
    "brand": "Marca X",
    "unit_of_measure": "UN",
    "quantity": 100
  }'
```

**Exemplo — upsert em lote (sincronização ERP):**
```bash
curl -X POST https://SEU_DOMINIO/api/products/upsert \
  -H "Content-Type: application/json" \
  -d '{
    "products": [
      { "name": "Produto A", "code": "A001", "slug": "produto-a", "price": 10.00 },
      { "name": "Produto B", "code": "B002", "slug": "produto-b", "price": 20.00 }
    ]
  }'
```

### Categorias (`/api/categories`)

| Método | Rota | Descrição | Body |
|--------|------|-----------|------|
| `GET` | `/categories` | Listar | — |
| `POST` | `/categories` | Criar | `{ name, slug }` |
| `POST` | `/categories/batch` | Criar em lote | `{ categories: [{ name, slug }] }` |
| `PUT` | `/categories/:id` | Atualizar | `{ name, slug }` |
| `DELETE` | `/categories/:id` | Remover | — |

### Vendedores (`/api/sellers`)

| Método | Rota | Descrição | Body |
|--------|------|-----------|------|
| `GET` | `/sellers` | Listar todos | — |
| `GET` | `/sellers/slug/:slug` | Buscar por slug | — |
| `POST` | `/sellers` | Criar | `{ name, slug, whatsapp? }` |
| `PUT` | `/sellers/:id` | Atualizar | `{ campo: valor }` |
| `DELETE` | `/sellers/:id` | Remover | — |

**Exemplo — criar vendedor:**
```bash
curl -X POST https://SEU_DOMINIO/api/sellers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Maria Santos",
    "slug": "maria-santos",
    "whatsapp": "5511988887777"
  }'
```

> O link do vendedor ficará: `https://SEU_DOMINIO/v/maria-santos`

### Pedidos (`/api/orders`)

| Método | Rota | Descrição | Body |
|--------|------|-----------|------|
| `GET` | `/orders` | Listar todos | — |
| `GET` | `/orders/:id/items` | Listar itens do pedido | — |
| `POST` | `/orders` | Criar pedido com itens | `{ order: {...}, items: [...] }` |
| `PUT` | `/orders/:id` | Atualizar (status) | `{ status: "confirmed" }` |
| `DELETE` | `/orders/:id` | Remover | — |

**Exemplo — criar pedido:**
```bash
curl -X POST https://SEU_DOMINIO/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "order": {
      "customer_name": "Cliente Teste",
      "customer_phone": "5511999998888",
      "subtotal": 99.80,
      "total": 99.80,
      "seller_id": null,
      "seller_name": null,
      "payment_method": "PIX"
    },
    "items": [
      {
        "product_name": "Camiseta Básica",
        "product_code": "CAM001",
        "unit_price": 49.90,
        "quantity": 2,
        "total_price": 99.80
      }
    ]
  }'
```

### Configurações (`/api/settings`)

| Método | Rota | Descrição | Body |
|--------|------|-----------|------|
| `GET` | `/settings` | Listar todas | — |
| `PUT` | `/settings/:key` | Atualizar | `{ value: "..." }` |

**Exemplo:**
```bash
curl -X PUT https://SEU_DOMINIO/api/settings/store_name \
  -H "Content-Type: application/json" \
  -d '{ "value": "Minha Loja" }'
```

### Banners (`/api/banners`)

| Método | Rota | Descrição | Body |
|--------|------|-----------|------|
| `GET` | `/banners` | Listar | — |
| `POST` | `/banners` | Criar | `{ image_url, link?, sort_order }` |
| `PUT` | `/banners/:id` | Atualizar | `{ campo: valor }` |
| `DELETE` | `/banners/:id` | Remover | — |

### Condições de Pagamento (`/api/payment-conditions`)

| Método | Rota | Descrição | Body |
|--------|------|-----------|------|
| `GET` | `/payment-conditions` | Listar | — |
| `POST` | `/payment-conditions` | Criar | `{ name, sort_order }` |
| `PUT` | `/payment-conditions/:id` | Atualizar | `{ campo: valor }` |
| `DELETE` | `/payment-conditions/:id` | Remover | — |

### Upload de Imagens (`/api/upload`)

| Método | Rota | Content-Type | Body |
|--------|------|-------------|------|
| `POST` | `/upload/image` | `multipart/form-data` | campo `file` |
| `POST` | `/upload/base64` | `application/json` | `{ base64, filename? }` |

**Resposta:** `{ url: "https://SEU_DOMINIO/uploads/uuid.jpg" }`

**Exemplo — upload via cURL:**
```bash
curl -X POST https://SEU_DOMINIO/api/upload/image \
  -F "file=@/caminho/para/imagem.jpg"
```

### Autenticação (`/api/auth`) — Modo VPS

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/auth/session` | Retorna sessão admin mock |
| `POST` | `/auth/login` | Login mock (sempre aceita) |
| `POST` | `/auth/logout` | Logout mock |

> ⚠️ No modo VPS, o admin é **aberto** (sem autenticação real). Para proteger, use **Basic Auth no Nginx** (veja seção 20).

### Health Check

| Método | Rota | Resposta |
|--------|------|---------|
| `GET` | `/health` | `{ "status": "ok", "mode": "postgres" }` |

---

## 19. Comandos Úteis

### PostgreSQL

```bash
# Conectar ao banco
psql -U postgres -h localhost -d catalogo

# Listar tabelas
\dt

# Ver estrutura de uma tabela
\d products
\d sellers
\d orders

# Contar registros
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM sellers;
SELECT COUNT(*) FROM orders;

# Ver produtos sem imagem
SELECT name, code FROM products
WHERE image_url = '/placeholder.svg' OR image_url IS NULL;

# Ver pedidos recentes
SELECT id, customer_name, total, status, seller_name, created_at
FROM orders ORDER BY created_at DESC LIMIT 10;

# Ver vendedores ativos
SELECT name, slug, whatsapp, active FROM sellers ORDER BY name;

# Backup do banco
pg_dump -U postgres catalogo > /root/backup_catalogo_$(date +%Y%m%d).sql

# Restaurar backup
psql -U postgres catalogo < backup_catalogo.sql
```

### Projeto

```bash
# Atualizar código (git pull + rebuild)
cd /var/www/catalogo
git pull
npm install
npm run build
pm2 restart catalogo-api

# Ver logs do backend
pm2 logs catalogo-api --lines 50

# Verificar uso de disco das imagens
du -sh /var/www/catalogo/public/uploads/

# Ver todas as configurações da loja
psql -U postgres -h localhost -d catalogo -c "SELECT key, value FROM store_settings ORDER BY key;"
```

---

## 20. Solução de Problemas

| Problema | Causa provável | Solução |
|----------|----------------|---------|
| `relation "products" does not exist` | Tabelas não criadas | Execute o SQL da seção 5.2 |
| `relation "sellers" does not exist` | Tabela sellers faltando | Execute o CREATE TABLE de sellers (seção 5.2) |
| `connection refused` (5432) | PostgreSQL parado | `systemctl start postgresql` |
| `connection refused` (3001) | Backend parado | `pm2 restart catalogo-api` |
| Site não carrega pelo domínio | DNS não propagou | Aguarde ou verifique em dnschecker.org |
| `502 Bad Gateway` | Backend offline | `pm2 status` → reinicie se offline |
| `413 Request Entity Too Large` | Nginx limitando upload | Verifique `client_max_body_size 50M;` no Nginx |
| Imagens não aparecem | Pasta uploads inexistente | `mkdir -p /var/www/catalogo/public/uploads` |
| Imagens com URL localhost | `API_BASE_URL` incorreta no `.env` | Defina como `https://SEU_DOMINIO` |
| CORS error no navegador | `VITE_API_URL` incorreta | Deve apontar para o domínio público, não localhost |
| Admin não salva produto | Erro no backend | `pm2 logs catalogo-api` |
| Frontend desatualizado | Build antigo | `npm run build` + Ctrl+Shift+R no navegador |
| SSL não funciona | DNS não propagou ainda | Verifique `dig +short SEU_DOMINIO` |
| Certificado expirado | Certbot não renovou | `certbot renew && systemctl restart nginx` |
| Vendedor não aparece pelo link | Slug incorreto ou inativo | Verifique: `SELECT slug, active FROM sellers;` |
| Pedido sem vendedor | SellerContext não persistiu | Verifique se o link `/v/:slug` foi acessado |
| `ECONNREFUSED` no api-client | Backend offline ou porta errada | Verifique `PORT` no `.env` e `pm2 status` |

### Proteger o Admin com Autenticação Básica (Nginx)

```bash
# Instalar htpasswd
apt install -y apache2-utils

# Criar usuário admin
htpasswd -c /etc/nginx/.htpasswd admin
# Digitar a senha quando solicitado
```

Adicione no bloco do Nginx (`/etc/nginx/sites-available/catalogo`):

```nginx
# Dentro do bloco server {}:
location /admin {
    auth_basic "Área Administrativa";
    auth_basic_user_file /etc/nginx/.htpasswd;
    try_files $uri $uri/ /index.html;
}
```

```bash
# Reiniciar Nginx
nginx -t && systemctl restart nginx
```

---

## 21. Backup Automático

### Criar script de backup

```bash
cat > /root/backup-catalogo.sh << 'SCRIPT'
#!/bin/bash
BACKUP_DIR="/root/backups"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M)

# Backup do banco
pg_dump -U postgres catalogo > $BACKUP_DIR/db_$DATE.sql

# Backup das imagens
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C /var/www/catalogo/public uploads/

# Remover backups com mais de 30 dias
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup concluído: $DATE"
SCRIPT

chmod +x /root/backup-catalogo.sh
```

### Agendar via cron (diário às 3h da manhã)

```bash
crontab -e
# Adicionar a linha:
0 3 * * * /root/backup-catalogo.sh >> /var/log/backup-catalogo.log 2>&1
```

---

## 22. Resumo Rápido — Copiar e Colar

```bash
# ═══════════════════════════════════════════════════
# INSTALAÇÃO COMPLETA EM UMA VPS UBUNTU
# ═══════════════════════════════════════════════════

# 1. Preparar servidor
apt update && apt upgrade -y
apt install -y curl git build-essential ufw nginx postgresql postgresql-contrib

# 2. Node.js + PM2
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g pm2

# 3. PostgreSQL
systemctl start postgresql && systemctl enable postgresql
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'MINHA_SENHA';"
sudo -u postgres psql -c "CREATE DATABASE catalogo;"

# 4. Criar TODAS as tabelas (copie o SQL da seção 5.2):
psql -U postgres -h localhost -d catalogo
# → Cole todo o SQL (10 tabelas + triggers + índices + dados iniciais)
# → \q para sair

# 5. Clonar projeto
cd /var/www
git clone <URL_DO_REPOSITORIO> catalogo
cd catalogo
npm install
mkdir -p public/uploads

# 6. Criar rotas do backend que faltam (seção 7):
# → Criar server/routes/sellers.ts
# → Criar server/routes/orders.ts
# → Atualizar server/index.ts com as importações

# 7. Configurar .env
cat > .env << EOF
VITE_API_MODE=postgres
VITE_API_URL=https://MEU_DOMINIO/api
DATABASE_URL=postgresql://postgres:MINHA_SENHA@localhost:5432/catalogo
PORT=3001
API_BASE_URL=https://MEU_DOMINIO
EOF

# 8. Build frontend
npm run build

# 9. Iniciar backend
pm2 start "npx tsx server/index.ts" --name catalogo-api --cwd /var/www/catalogo
pm2 startup && pm2 save

# 10. Firewall
ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw enable

# 11. DNS: Aponte A @ e A www para o IP da VPS

# 12. Nginx (crie /etc/nginx/sites-available/catalogo conforme seção 11)
ln -sf /etc/nginx/sites-available/catalogo /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# 13. SSL
apt install -y certbot python3-certbot-nginx
certbot --nginx -d MEU_DOMINIO -d www.MEU_DOMINIO

# 14. Pronto! Acesse:
#     https://MEU_DOMINIO          → Catálogo público
#     https://MEU_DOMINIO/admin    → Admin
#     https://MEU_DOMINIO/v/slug   → Link de vendedor
#     https://MEU_DOMINIO/tv       → Modo TV
```
