# Guia de Instalação Local do Catálogo

> Passo a passo para rodar o catálogo em ambiente local com banco de dados **PostgreSQL**.

---

## Pré-requisitos

| Ferramenta | Versão mínima | Link |
|------------|---------------|------|
| Node.js | 18+ | https://nodejs.org |
| npm ou bun | npm 9+ / bun | Incluso com Node.js / https://bun.sh |
| Git | 2.30+ | https://git-scm.com |
| PostgreSQL | 15+ | https://www.postgresql.org/download |

---

## 1. Clonar o Repositório

```bash
git clone <URL_DO_REPOSITORIO>
cd catalogo
```

---

## 2. Instalar Dependências

```bash
npm install
# ou
bun install
```

---

## 3. Instalar e Configurar o PostgreSQL

### 3.1 — Instalar o PostgreSQL

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
Baixe o instalador em https://www.postgresql.org/download/windows/ e siga o assistente de instalação.

### 3.2 — Criar o banco de dados

```bash
# Conectar ao PostgreSQL
psql -U postgres -h localhost -p 5432

# Criar o banco
CREATE DATABASE catalogo;

# Conectar ao banco criado
\c catalogo
```

### 3.3 — Criar as tabelas

Execute os SQLs abaixo na ordem apresentada dentro do banco `catalogo`:

```sql
-- ============================================
-- EXTENSÃO PARA GERAR UUIDs
-- ============================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUM DE ROLES
-- ============================================
CREATE TYPE public.app_role AS ENUM ('admin');

-- ============================================
-- TABELA DE ROLES (permissões de usuário)
-- ============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- ============================================
-- CATEGORIAS
-- ============================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- PRODUTOS
-- ============================================
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- CONFIGURAÇÕES DA LOJA
-- ============================================
CREATE TABLE public.store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL DEFAULT ''
);

-- ============================================
-- CONDIÇÕES DE PAGAMENTO
-- ============================================
CREATE TABLE public.payment_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- BANNERS (CARROSSEL)
-- ============================================
CREATE TABLE public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  link TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- FUNÇÃO: ATUALIZAR updated_at AUTOMATICAMENTE
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: ATUALIZAR updated_at EM PRODUCTS
-- ============================================
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- FUNÇÃO: VERIFICAR ROLE DO USUÁRIO
-- ============================================
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

### 3.4 — Inserir dados iniciais

```sql
-- Configurações padrão da loja
INSERT INTO public.store_settings (key, value) VALUES
  ('whatsapp_number', '5511999999999'),
  ('store_name', 'Catálogo'),
  ('store_subtitle', 'Distribuidora'),
  ('payment_conditions_enabled', 'false')
ON CONFLICT (key) DO NOTHING;

-- Categorias padrão
INSERT INTO public.categories (name, slug) VALUES
  ('Roupas', 'roupas'),
  ('Calçados', 'calcados'),
  ('Acessórios', 'acessorios'),
  ('Promoções', 'promocoes')
ON CONFLICT (slug) DO NOTHING;
```

---

## 4. Configurar Variáveis de Ambiente

Crie o arquivo `.env` na raiz do projeto com a conexão ao banco PostgreSQL:

```env
DATABASE_URL=postgresql://postgres:sua_senha@localhost:5432/catalogo
```

---

## 5. Criar o Primeiro Usuário Admin

Insira um registro na tabela `user_roles` com o UUID do usuário administrador:

```sql
-- Gerar um UUID para o admin
INSERT INTO public.user_roles (user_id, role)
VALUES (gen_random_uuid(), 'admin')
RETURNING user_id;
```

Anote o `user_id` retornado — ele será usado para autenticação no painel administrativo.

---

## 6. Rodar o Projeto

```bash
npm run dev
# ou
bun run dev
```

O catálogo estará disponível em: **http://localhost:8080**

| Rota | Descrição |
|------|-----------|
| `/` | Catálogo público |
| `/admin` | Painel administrativo |
| `/produto/:slug` | Detalhe do produto |
| `/carrinho` | Carrinho de compras |
| `/checkout` | Finalização do pedido |

---

## Estrutura do Banco de Dados

```
┌──────────────────┐     ┌──────────────────┐
│   user_roles     │     │   categories     │
│──────────────────│     │──────────────────│
│ id (PK)          │     │ id (PK)          │
│ user_id          │     │ name             │
│ role (enum)      │     │ slug (unique)    │
│ created_at       │     │ created_at       │
└──────────────────┘     └────────┬─────────┘
                                  │
                                  │ category_id (FK)
                                  ▼
┌──────────────────┐     ┌──────────────────┐
│ store_settings   │     │    products      │
│──────────────────│     │──────────────────│
│ id (PK)          │     │ id (PK)          │
│ key (unique)     │     │ name             │
│ value            │     │ code (unique)    │
└──────────────────┘     │ slug             │
                         │ price            │
┌──────────────────┐     │ original_price   │
│payment_conditions│     │ description      │
│──────────────────│     │ image_url        │
│ id (PK)          │     │ category_id (FK) │
│ name             │     │ active           │
│ active           │     │ created_at       │
│ sort_order       │     │ updated_at       │
│ created_at       │     └──────────────────┘
└──────────────────┘
                         ┌──────────────────┐
                         │    banners       │
                         │──────────────────│
                         │ id (PK)          │
                         │ image_url        │
                         │ link             │
                         │ sort_order       │
                         │ active           │
                         │ created_at       │
                         └──────────────────┘
```

---

## Comandos Úteis do PostgreSQL

```bash
# Conectar ao banco
psql -U postgres -d catalogo

# Listar tabelas
\dt

# Descrever uma tabela
\d products

# Contar produtos
SELECT COUNT(*) FROM products;

# Ver categorias
SELECT * FROM categories;

# Backup do banco
pg_dump -U postgres catalogo > backup_catalogo.sql

# Restaurar backup
psql -U postgres catalogo < backup_catalogo.sql
```

---

## Solução de Problemas

| Problema | Solução |
|----------|---------|
| `relation does not exist` | Execute os SQLs da seção 3.3 na ordem correta |
| `role "postgres" does not exist` | Crie o role: `createuser -s postgres` |
| `connection refused` | Verifique se o PostgreSQL está rodando: `sudo systemctl status postgresql` |
| Erro de permissão | Verifique se o usuário tem role `admin` em `user_roles` |
| Produtos não aparecem | Verifique se existem produtos com `active = true` |

---

## Build para Produção

```bash
npm run build
```

Os arquivos gerados estarão na pasta `dist/` e podem ser hospedados em qualquer servidor estático (Nginx, Apache, etc.).
