# Guia de Instalação Local do Catálogo

> Passo a passo para rodar o catálogo em ambiente local com banco de dados **PostgreSQL** (gerenciado via Supabase).

---

## Pré-requisitos

| Ferramenta       | Versão mínima | Link                                           |
|------------------|---------------|-------------------------------------------------|
| Node.js          | 18+           | https://nodejs.org                              |
| npm ou bun       | npm 9+ / bun  | Incluso com Node.js / https://bun.sh            |
| Git              | 2.30+         | https://git-scm.com                             |
| PostgreSQL       | 15+           | https://www.postgresql.org/download              |
| Supabase CLI     | 1.100+        | https://supabase.com/docs/guides/cli/getting-started (opcional) |
| Docker           | 20+           | https://www.docker.com (apenas se usar Supabase local) |

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

## 3. Configurar o Banco de Dados PostgreSQL

O catálogo utiliza **PostgreSQL** como banco de dados. Você tem três opções para configurá-lo:

### Opção A: Supabase Cloud (Recomendado — já inclui PostgreSQL gerenciado)

1. Crie um projeto em https://supabase.com/dashboard
2. Copie a **URL** e a **Anon Key** do projeto (Settings → API)
3. Crie o arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIs...
```

### Opção B: PostgreSQL Local + Supabase CLI (via Docker)

```bash
# Inicia PostgreSQL + Auth + Storage + Realtime localmente
supabase start

# O CLI exibirá as credenciais locais:
# API URL: http://localhost:54321
# DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# Anon Key: eyJ...
# Service Role Key: eyJ...
```

Crie o `.env`:
```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_PUBLISHABLE_KEY=<anon_key_exibida>
```

### Opção C: PostgreSQL Local Puro (sem Supabase CLI)

Se você já tem um PostgreSQL rodando localmente:

```bash
# Conectar ao PostgreSQL
psql -U postgres -h localhost -p 5432
```

> **Nota:** Sem o Supabase CLI, você precisará configurar manualmente a autenticação, storage e realtime. As tabelas e SQLs da seção 4 continuam válidos.

---

## 4. Criar o Banco de Dados

Execute os SQLs abaixo no **SQL Editor** do Supabase (Dashboard → SQL Editor) ou via CLI. **Execute na ordem apresentada.**

### 4.1 — Estrutura base (tabelas, funções, triggers e políticas RLS)

```sql
-- ============================================
-- ENUM E TABELA DE ROLES
-- ============================================
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para verificar roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ============================================
-- CATEGORIAS
-- ============================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PRODUTOS
-- ============================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT,
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
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Código do produto deve ser único
ALTER TABLE public.products ADD CONSTRAINT products_code_unique UNIQUE (code);

-- ============================================
-- CONFIGURAÇÕES DA LOJA
-- ============================================
CREATE TABLE public.store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL DEFAULT ''
);
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CONDIÇÕES DE PAGAMENTO
-- ============================================
CREATE TABLE public.payment_conditions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_conditions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- BANNERS (CARROSSEL)
-- ============================================
CREATE TABLE public.banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  link TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- ============================================
-- TRIGGER DE UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

### 4.2 — Políticas de Segurança (RLS)

```sql
-- ============================================
-- RLS: user_roles
-- ============================================
CREATE POLICY "Admins can view roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- RLS: categories
-- ============================================
CREATE POLICY "Anyone can view categories" ON public.categories
  FOR SELECT USING (true);
CREATE POLICY "Admins can insert categories" ON public.categories
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update categories" ON public.categories
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete categories" ON public.categories
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- RLS: products
-- ============================================
CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT USING (true);
CREATE POLICY "Admins can insert products" ON public.products
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update products" ON public.products
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete products" ON public.products
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- RLS: store_settings
-- ============================================
CREATE POLICY "Anyone can view settings" ON public.store_settings
  FOR SELECT USING (true);
CREATE POLICY "Admins can update settings" ON public.store_settings
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert settings" ON public.store_settings
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete settings" ON public.store_settings
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- RLS: payment_conditions
-- ============================================
CREATE POLICY "Anyone can view active payment conditions" ON public.payment_conditions
  FOR SELECT USING (true);
CREATE POLICY "Admins can insert payment conditions" ON public.payment_conditions
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update payment conditions" ON public.payment_conditions
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete payment conditions" ON public.payment_conditions
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- RLS: banners
-- ============================================
CREATE POLICY "Banners are publicly readable" ON public.banners
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage banners" ON public.banners
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));
```

### 4.3 — Storage (bucket de imagens)

```sql
-- Criar bucket público para imagens de produtos
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

-- Políticas de acesso ao storage
CREATE POLICY "Anyone can view product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Admins can upload product images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update product images" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete product images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
```

### 4.4 — Realtime

```sql
-- Habilitar realtime para atualizações em tempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.store_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
```

### 4.5 — Dados iniciais

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

## 5. Criar o Primeiro Usuário Admin

1. Acesse o painel do Supabase → **Authentication** → **Users**
2. Clique em **Add User** e crie um usuário com e-mail e senha
3. Copie o **UUID** do usuário criado
4. Execute no SQL Editor:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('<UUID_DO_USUARIO>', 'admin');
```

> **Alternativa:** Acesse `/admin` no catálogo e use o formulário de setup automático (requer a edge function `setup-admin`).

---

## 6. Rodar o Projeto

```bash
npm run dev
# ou
bun run dev
```

O catálogo estará disponível em: **http://localhost:8080**

| Rota           | Descrição                  |
|----------------|----------------------------|
| `/`            | Catálogo público           |
| `/admin`       | Painel administrativo      |
| `/produto/:slug` | Página de detalhe do produto |
| `/carrinho`    | Carrinho de compras        |
| `/checkout`    | Finalização do pedido      |

---

## 7. Variáveis de Ambiente

| Variável                          | Obrigatória | Descrição                          |
|-----------------------------------|-------------|-------------------------------------|
| `VITE_SUPABASE_URL`              | ✅ Sim       | URL do projeto Supabase             |
| `VITE_SUPABASE_PUBLISHABLE_KEY`  | ✅ Sim       | Anon Key do projeto Supabase        |

---

## Resumo da Estrutura do Banco

```
┌──────────────────┐     ┌──────────────────┐
│   user_roles     │     │   categories     │
│──────────────────│     │──────────────────│
│ id (PK)          │     │ id (PK)          │
│ user_id (FK)     │     │ name             │
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
│ payment_conditions│    │ description      │
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

Storage: bucket "product-images" (público)
```

---

## Solução de Problemas

| Problema                        | Solução                                                      |
|---------------------------------|--------------------------------------------------------------|
| Erro "relation does not exist"  | Execute os SQLs da seção 4 na ordem correta                 |
| Erro de permissão (RLS)         | Verifique se o usuário tem role `admin` na tabela `user_roles` |
| Imagens não aparecem            | Verifique se o bucket `product-images` foi criado e é público |
| Login não funciona              | Confirme que o `.env` tem as credenciais corretas            |
| Produtos não atualizam em tempo real | Execute os comandos da seção 4.4 (Realtime)            |

---

## Build para Produção

```bash
npm run build
# ou
bun run build
```

Os arquivos gerados estarão na pasta `dist/` e podem ser hospedados em qualquer servidor estático (Vercel, Netlify, Cloudflare Pages, etc.).
