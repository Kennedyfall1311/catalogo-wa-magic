# 📦 Guia Completo de Instalação em VPS — Catálogo Digital

> **Objetivo:** Instalar o catálogo digital de produtos em uma VPS (servidor próprio) usando PostgreSQL, Express.js, Nginx e domínio próprio com HTTPS.
>
> ⏱️ **Tempo estimado:** 30–60 minutos (depende da experiência).

---

## 🗺️ Visão Geral do que Vamos Fazer

Antes de começar, entenda o que será feito em cada etapa:

```
┌──────────────────────────────────────────────────────────────┐
│                      SUA VPS (SERVIDOR)                       │
│                                                               │
│  ┌─────────────┐     ┌──────────────┐     ┌──────────────┐   │
│  │   Nginx     │────▶│  Express.js  │────▶│ PostgreSQL   │   │
│  │ (porta 80/  │     │  (porta 3001)│     │ (porta 5432) │   │
│  │  443 HTTPS) │     │  Backend API │     │ Banco de dados│  │
│  └──────┬──────┘     └──────────────┘     └──────────────┘   │
│         │                                                     │
│         ├──▶ /api/*       → Proxy para Express.js             │
│         ├──▶ /uploads/*   → Imagens salvas no disco           │
│         └──▶ /*           → Frontend React (arquivos estáticos)│
│                                                               │
│  ┌──────────────┐                                             │
│  │     PM2      │ ← Mantém o backend sempre rodando           │
│  └──────────────┘                                             │
└──────────────────────────────────────────────────────────────┘
```

**Resumo:** O Nginx recebe todas as requisições do navegador. Ele serve os arquivos do frontend (HTML, CSS, JS) e redireciona chamadas da API para o Express.js, que por sua vez consulta o PostgreSQL.

---

## ✅ Checklist — O que Você Precisa Antes de Começar

Confirme que você tem tudo pronto:

- [ ] Uma **VPS** com Ubuntu 22.04+ ou Debian 12+ (mínimo 1 GB RAM, 20 GB SSD)
- [ ] **Acesso SSH** à VPS como root (ou com sudo)
- [ ] Um **domínio** registrado (opcional, mas recomendado para HTTPS)
- [ ] O **link do repositório Git** do projeto (URL do GitHub/GitLab)
- [ ] Saber usar o terminal (copiar/colar comandos)

> 💡 **Provedores populares de VPS:** Contabo, Hetzner, DigitalOcean, Vultr, Oracle Cloud (free tier).

---

## 📋 Índice (Clique para Navegar)

| # | Etapa | Tempo |
|---|-------|-------|
| 1 | [Conectar na VPS e Atualizar](#etapa-1--conectar-na-vps-e-atualizar) | 2 min |
| 2 | [Instalar Node.js e PM2](#etapa-2--instalar-nodejs-e-pm2) | 3 min |
| 3 | [Instalar e Configurar PostgreSQL](#etapa-3--instalar-e-configurar-postgresql) | 5 min |
| 4 | [Criar o Banco de Dados e as Tabelas](#etapa-4--criar-o-banco-de-dados-e-as-tabelas) | 5 min |
| 5 | [Baixar o Projeto e Configurar](#etapa-5--baixar-o-projeto-e-configurar) | 5 min |
| 6 | [Criar Rotas do Backend (Vendedores e Pedidos)](#etapa-6--criar-rotas-do-backend-vendedores-e-pedidos) | 5 min |
| 7 | [Iniciar o Backend com PM2](#etapa-7--iniciar-o-backend-com-pm2) | 3 min |
| 8 | [Compilar o Frontend](#etapa-8--compilar-o-frontend) | 3 min |
| 9 | [Configurar o Nginx](#etapa-9--configurar-o-nginx) | 5 min |
| 10 | [Configurar Domínio e DNS](#etapa-10--configurar-domínio-e-dns) | 5 min |
| 11 | [Instalar SSL (HTTPS)](#etapa-11--instalar-ssl-https) | 3 min |
| 12 | [Verificar se Tudo Funciona](#etapa-12--verificar-se-tudo-funciona) | 5 min |
| — | [Referência: Tabelas do Banco](#referência-tabelas-do-banco) | — |
| — | [Referência: Configurações da Loja](#referência-configurações-da-loja-store_settings) | — |
| — | [Referência: API REST Completa](#referência-api-rest-completa) | — |
| — | [Comandos Úteis do Dia a Dia](#comandos-úteis-do-dia-a-dia) | — |
| — | [Solução de Problemas](#solução-de-problemas) | — |
| — | [Backup Automático](#backup-automático) | — |
| — | [Resumo Rápido — Copiar e Colar](#resumo-rápido--copiar-e-colar) | — |

---

## Etapa 1 — Conectar na VPS e Atualizar

### O que fazer:

Abra o terminal do seu computador e conecte na VPS via SSH:

```bash
ssh root@SEU_IP_DA_VPS
```

> 📝 **Substitua** `SEU_IP_DA_VPS` pelo IP real da sua VPS (ex: `203.0.113.50`).
> 
> 💡 **Onde encontro o IP?** No painel do provedor (Contabo, DigitalOcean, etc.), na seção "Servidor" ou "Droplet".

Depois de conectar, atualize os pacotes e instale os utilitários:

```bash
apt update && apt upgrade -y
apt install -y curl git build-essential ufw nginx
```

### ✅ Resultado esperado:

Você deve estar conectado à VPS e todos os pacotes foram instalados sem erro.

---

## Etapa 2 — Instalar Node.js e PM2

### O que fazer:

```bash
# 1. Instalar Node.js 20 (versão LTS estável)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

### Verificar se funcionou:

```bash
node -v
# ✅ Deve mostrar: v20.x.x (qualquer versão 20)

npm -v
# ✅ Deve mostrar: 10.x.x
```

> ❌ **Se `node -v` não funcionar:** Feche o terminal, abra novamente e tente outra vez.

Agora instale o **PM2** (ele mantém o backend rodando 24/7, mesmo após reiniciar a VPS):

```bash
npm install -g pm2
```

### ✅ Resultado esperado:

Os comandos `node -v`, `npm -v` e `pm2 -v` funcionam sem erro.

---

## Etapa 3 — Instalar e Configurar PostgreSQL

### 3.1 — Instalar o PostgreSQL

```bash
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql
```

### 3.2 — Definir a senha do banco

> ⚠️ **IMPORTANTE:** Escolha uma senha forte e **anote-a**. Você vai usar essa senha no próximo passo.

```bash
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'COLOQUE_SUA_SENHA_AQUI';"
```

> 📝 **Substitua** `COLOQUE_SUA_SENHA_AQUI` pela senha que você escolher.
>
> 💡 **Exemplo de senha forte:** `M1nh@S3nh4!Forte2026`

### 3.3 — Verificar se está rodando

```bash
systemctl status postgresql
```

### ✅ Resultado esperado:

Deve aparecer **`active (running)`** em verde. Se aparecer "inactive" ou "failed", execute:
```bash
systemctl restart postgresql
```

### 3.4 — Configurar acesso local

Este passo garante que o backend consiga se conectar ao banco:

```bash
# Encontrar o arquivo de configuração
find /etc/postgresql -name pg_hba.conf
# Geralmente fica em: /etc/postgresql/16/main/pg_hba.conf
```

Abra o arquivo para editar:

```bash
nano /etc/postgresql/16/main/pg_hba.conf
```

> 📝 Se a versão do PostgreSQL for diferente (ex: 15 ou 17), ajuste o número no caminho.

Procure as linhas que começam com `local` e `host` e certifique-se de que estejam assim:

```
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                md5
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
```

> 💡 **Como editar no `nano`:**
> - Use as setas do teclado para navegar
> - Edite o texto normalmente
> - Para salvar: pressione `Ctrl + O` e depois `Enter`
> - Para sair: pressione `Ctrl + X`

Depois de salvar, reinicie o PostgreSQL:

```bash
systemctl restart postgresql
```

### 3.5 — Testar a conexão

```bash
psql -U postgres -h localhost -p 5432
```

> Vai pedir a senha que você definiu no passo 3.2. Digite-a.

### ✅ Resultado esperado:

Você deve ver o prompt `postgres=#`. Para sair, digite `\q` e pressione Enter.

> ❌ **Se der erro `FATAL: authentication failed`:** A senha está errada. Repita o passo 3.2 com a senha correta.

---

## Etapa 4 — Criar o Banco de Dados e as Tabelas

### 4.1 — Criar o banco chamado "catalogo"

```bash
sudo -u postgres psql -c "CREATE DATABASE catalogo;"
```

### ✅ Resultado esperado:

Deve aparecer `CREATE DATABASE`.

> ❌ **Se aparecer `database "catalogo" already exists`:** Tudo bem, o banco já foi criado antes. Continue normalmente.

### 4.2 — Conectar ao banco e criar as tabelas

Conecte ao banco:

```bash
psql -U postgres -h localhost -d catalogo
```

> Vai pedir a senha. Digite a mesma do passo 3.2.

Agora **copie TODO o bloco SQL abaixo** e cole no terminal de uma vez:

```sql
-- ═══════════════════════════════════════════════════════════
-- SCHEMA COMPLETO DO CATÁLOGO — VPS
-- Última atualização: 2026-02
-- COPIE TUDO de uma vez e cole no terminal
-- ═══════════════════════════════════════════════════════════

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tipo customizado para roles de usuário
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════════
-- TABELA 1 de 10: user_roles
-- Para quê: Controle de permissões (compatibilidade com auth)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- ═══════════════════════════════════════════════════════════
-- TABELA 2 de 10: categories
-- Para quê: Agrupar produtos (ex: Roupas, Calçados)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- TABELA 3 de 10: products
-- Para quê: Todos os produtos do catálogo
-- Depende de: categories (campo category_id)
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
  package_quantity NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- TABELA 4 de 10: sellers
-- Para quê: Vendedores com links personalizados (ex: /v/joao)
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
-- TABELA 5 de 10: orders
-- Para quê: Pedidos realizados pelos clientes
-- Depende de: sellers (campo seller_id, opcional)
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
-- TABELA 6 de 10: order_items
-- Para quê: Itens dentro de cada pedido
-- Depende de: orders (obrigatório), products (opcional)
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
-- TABELA 7 de 10: store_settings
-- Para quê: Todas as configurações da loja (nome, cores, frete, etc.)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL DEFAULT ''
);

-- ═══════════════════════════════════════════════════════════
-- TABELA 8 de 10: payment_conditions
-- Para quê: Formas de pagamento exibidas no checkout
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.payment_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- TABELA 9 de 10: banners
-- Para quê: Imagens promocionais no carrossel do catálogo
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
-- TABELA 10 de 10: catalog_tabs
-- Para quê: Abas de filtro rápido no catálogo
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
-- FUNÇÕES AUTOMÁTICAS (Triggers)
-- ═══════════════════════════════════════════════════════════

-- Função que atualiza o campo "updated_at" automaticamente quando um registro é editado
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar nos products
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Aplicar nos orders
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função de verificação de role
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
-- ÍNDICES (melhoram a velocidade das buscas)
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
-- DADOS INICIAIS (configurações padrão e categorias de exemplo)
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
  -- Filtros rápidos
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

> 💡 **Dica:** No terminal do `psql`, cole tudo de uma vez e pressione Enter. Pode demorar 1–2 segundos.

### 4.3 — Verificar se as 10 tabelas foram criadas

Ainda dentro do `psql`, digite:

```bash
\dt
```

### ✅ Resultado esperado (10 tabelas):

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

> ❌ **Se alguma tabela estiver faltando:** Cole o SQL da seção 4.2 novamente — as tabelas existentes serão ignoradas e as faltantes serão criadas.

Para sair do psql:

```bash
\q
```

---

## Etapa 5 — Baixar o Projeto e Configurar

### 5.1 — Baixar (clonar) o projeto

```bash
mkdir -p /var/www
cd /var/www
git clone <URL_DO_SEU_REPOSITORIO> catalogo
cd catalogo
```

> 📝 **Substitua** `<URL_DO_SEU_REPOSITORIO>` pela URL real do GitHub/GitLab.
>
> **Exemplo:** `git clone https://github.com/usuario/catalogo.git catalogo`

### 5.2 — Instalar dependências

```bash
npm install
```

> ⏱️ Isso pode levar 1–3 minutos. Aguarde.

### ✅ Resultado esperado:

Deve terminar sem erros graves. Warnings são normais e podem ser ignorados.

### 5.3 — Criar a pasta de uploads de imagens

```bash
mkdir -p public/uploads
chmod 755 public/uploads
```

### 5.4 — Criar o arquivo de configuração (.env)

Este é o arquivo mais importante. Ele diz ao sistema como se conectar ao banco e como funcionar.

**Execute o comando abaixo para criar o arquivo:**

```bash
cat > .env << 'EOF'
# ═══════════════════════════════════════════════════
# MODO DE OPERAÇÃO
# "postgres" = usar banco local (obrigatório na VPS)
# ═══════════════════════════════════════════════════
VITE_API_MODE=postgres

# ═══════════════════════════════════════════════════
# URL DA API
# Coloque seu domínio. Se não tiver domínio, use o IP.
# Exemplos:
#   https://catalogo.meusite.com.br/api
#   http://203.0.113.50/api
# ═══════════════════════════════════════════════════
VITE_API_URL=https://SEU_DOMINIO/api

# ═══════════════════════════════════════════════════
# CONEXÃO COM O BANCO DE DADOS
# Formato: postgresql://USUARIO:SENHA@HOST:PORTA/NOME_DO_BANCO
# ═══════════════════════════════════════════════════
DATABASE_URL=postgresql://postgres:SUA_SENHA_DO_PASSO_3@localhost:5432/catalogo

# ═══════════════════════════════════════════════════
# PORTA DO BACKEND (não precisa mudar)
# ═══════════════════════════════════════════════════
PORT=3001

# ═══════════════════════════════════════════════════
# URL BASE PARA IMAGENS
# Mesmo domínio/IP usado acima, mas SEM o /api
# ═══════════════════════════════════════════════════
API_BASE_URL=https://SEU_DOMINIO

# ═══════════════════════════════════════════════════
# CHAVE DE SEGURANÇA DO ADMIN
# Protege as operações de escrita (criar produto, mudar config, etc.)
#
# 🔑 COMO GERAR UMA CHAVE:
#    Execute no terminal: openssl rand -hex 32
#    Copie o resultado e cole aqui.
#
# ⚠️ As DUAS variáveis abaixo DEVEM ter O MESMO valor!
# ═══════════════════════════════════════════════════
ADMIN_API_KEY=SUA_CHAVE_SECRETA
VITE_ADMIN_API_KEY=SUA_CHAVE_SECRETA
EOF
```

### 5.5 — Editar o .env com seus dados reais

Abra o arquivo para editar:

```bash
nano .env
```

**Substitua os valores:**

| Valor no arquivo | Substitua por | Exemplo |
|---|---|---|
| `SEU_DOMINIO` | Seu domínio real ou IP da VPS | `catalogo.meusite.com.br` ou `203.0.113.50` |
| `SUA_SENHA_DO_PASSO_3` | A senha do PostgreSQL (passo 3.2) | `M1nh@S3nh4!Forte2026` |
| `SUA_CHAVE_SECRETA` | Chave gerada (veja abaixo) | `a1b2c3d4e5f6...` |

**Para gerar a chave de segurança:**

```bash
openssl rand -hex 32
```

> 📝 Copie o resultado (uma sequência de letras e números) e cole nos dois campos: `ADMIN_API_KEY` e `VITE_ADMIN_API_KEY`.

Salve e saia do nano (`Ctrl+O`, `Enter`, `Ctrl+X`).

> ⚠️ **MUITO IMPORTANTE:**
> - `ADMIN_API_KEY` e `VITE_ADMIN_API_KEY` devem ter **exatamente o mesmo valor**
> - Sem essas chaves, **nenhuma configuração será salva** no painel admin (o servidor rejeita com erro 401)
> - A primeira chave é usada pelo **backend** para validar; a segunda é usada pelo **frontend** para enviar

---

## Etapa 6 — Criar Rotas do Backend (Vendedores e Pedidos)

O projeto já vem com rotas para produtos, categorias, banners e configurações. Mas as rotas de **vendedores** e **pedidos** precisam ser criadas manualmente para o modo VPS.

### 6.1 — Criar o arquivo de vendedores

Execute o comando abaixo (ele cria o arquivo automaticamente):

```bash
cat > server/routes/sellers.ts << 'TYPESCRIPT'
import { Router } from "express";
import pool from "../db";

export const sellersRouter = Router();

// Listar todos os vendedores
sellersRouter.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM sellers ORDER BY name");
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Buscar vendedor pelo slug (ex: /sellers/slug/joao-silva)
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

// Criar novo vendedor
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

// Atualizar vendedor
sellersRouter.put("/:id", async (req, res) => {
  try {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(req.body)) {
      if (key === "id" || key === "created_at") continue;
      fields.push(\`\${key} = $\${idx}\`);
      values.push(value);
      idx++;
    }

    if (fields.length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }

    values.push(req.params.id);
    const { rows } = await pool.query(
      \`UPDATE sellers SET \${fields.join(", ")} WHERE id = $\${idx} RETURNING *\`,
      values
    );
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Excluir vendedor
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

### 6.2 — Criar o arquivo de pedidos

```bash
cat > server/routes/orders.ts << 'TYPESCRIPT'
import { Router } from "express";
import pool from "../db";

export const ordersRouter = Router();

// Listar todos os pedidos
ordersRouter.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM orders ORDER BY created_at DESC");
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Listar itens de um pedido específico
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

// Criar pedido com seus itens (tudo numa transação)
ordersRouter.post("/", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { order, items } = req.body;
    const { rows } = await client.query(
      \`INSERT INTO orders (customer_name, customer_phone, customer_cpf_cnpj, payment_method, notes, subtotal, shipping_fee, total, seller_id, seller_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *\`,
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
        \`INSERT INTO order_items (order_id, product_id, product_name, product_code, unit_price, quantity, total_price)
         VALUES ($1, $2, $3, $4, $5, $6, $7)\`,
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

// Atualizar pedido (ex: mudar status)
ordersRouter.put("/:id", async (req, res) => {
  try {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(req.body)) {
      if (key === "id" || key === "created_at") continue;
      fields.push(\`\${key} = $\${idx}\`);
      values.push(value);
      idx++;
    }

    values.push(req.params.id);
    const { rows } = await pool.query(
      \`UPDATE orders SET \${fields.join(", ")} WHERE id = $\${idx} RETURNING *\`,
      values
    );
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Excluir pedido
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

### 6.3 — Registrar as novas rotas no servidor

Abra o arquivo principal do servidor:

```bash
nano server/index.ts
```

**O arquivo deve ficar assim** (adicione as linhas marcadas com `// ← ADICIONAR`):

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
import { sellersRouter } from "./routes/sellers";       // ← ADICIONAR
import { ordersRouter } from "./routes/orders";          // ← ADICIONAR

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
app.use("/api/sellers", sellersRouter);                  // ← ADICIONAR
app.use("/api/orders", ordersRouter);                    // ← ADICIONAR

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", mode: "postgres" });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend rodando em http://localhost:${PORT}`);
  console.log(`📦 Modo: PostgreSQL direto`);
});
```

Salve e saia (`Ctrl+O`, Enter, `Ctrl+X`).

---

## Etapa 7 — Iniciar o Backend com PM2

### 7.1 — Iniciar o servidor

```bash
cd /var/www/catalogo
pm2 start "npx tsx server/index.ts" --name catalogo-api --cwd /var/www/catalogo
```

### 7.2 — Verificar se está rodando

```bash
pm2 status
```

### ✅ Resultado esperado:

Deve aparecer `catalogo-api` com status **`online`**.

> ❌ **Se aparecer `errored` ou `stopped`:** Veja os logs para entender o erro:
> ```bash
> pm2 logs catalogo-api --lines 30
> ```
> Causas mais comuns: senha do banco errada no `.env`, arquivo `sellers.ts` ou `orders.ts` com erro de sintaxe.

### 7.3 — Testar se o backend responde

```bash
curl http://localhost:3001/api/health
```

### ✅ Resultado esperado:

```json
{"status":"ok","mode":"postgres"}
```

### 7.4 — Configurar para iniciar automaticamente no boot da VPS

```bash
pm2 startup
pm2 save
```

> Isso garante que o backend reinicie sozinho se a VPS reiniciar.

### Comandos PM2 que você vai usar no dia a dia:

| Comando | O que faz |
|---------|-----------|
| `pm2 status` | Ver se o backend está rodando |
| `pm2 logs catalogo-api` | Ver logs em tempo real |
| `pm2 restart catalogo-api` | Reiniciar o backend |
| `pm2 stop catalogo-api` | Parar o backend |

---

## Etapa 8 — Compilar o Frontend

### O que fazer:

```bash
cd /var/www/catalogo
npm run build
```

> ⏱️ Leva 30–60 segundos.

### ✅ Resultado esperado:

Deve terminar sem erros e criar a pasta `dist/`:

```bash
ls dist/
# Deve conter: index.html, assets/
```

> ❌ **Se der erro de memória (`FATAL ERROR: heap`):** A VPS tem pouca RAM. Solução:
> ```bash
> # Criar swap temporário
> fallocate -l 2G /swapfile
> chmod 600 /swapfile
> mkswap /swapfile
> swapon /swapfile
> # Tentar novamente
> npm run build
> ```

---

## Etapa 9 — Configurar o Nginx

O Nginx serve o frontend e redireciona as chamadas de API para o Express.js.

### 9.1 — Criar o arquivo de configuração

```bash
nano /etc/nginx/sites-available/catalogo
```

**Cole o conteúdo abaixo** (substitua `SEU_DOMINIO`):

```nginx
server {
    listen 80;
    server_name SEU_DOMINIO www.SEU_DOMINIO;

    # Tamanho máximo de upload (50MB para imagens)
    client_max_body_size 50M;

    # ─── Frontend (arquivos estáticos do React) ───
    root /var/www/catalogo/dist;
    index index.html;

    # Todas as rotas do frontend redirecionam para index.html
    # (necessário porque é uma SPA - Single Page Application)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # ─── API (redireciona para o Express.js na porta 3001) ───
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

    # ─── Cache para arquivos estáticos (JS, CSS, imagens) ───
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

> 📝 **Substitua** `SEU_DOMINIO` pelo seu domínio real.
>
> **Se não tiver domínio e quiser usar apenas o IP:**
> Troque a linha `server_name` por:
> ```nginx
> server_name 203.0.113.50;   # Coloque o IP da sua VPS
> ```

Salve e saia (`Ctrl+O`, Enter, `Ctrl+X`).

### 9.2 — Ativar a configuração

```bash
# Criar link simbólico para ativar o site
ln -sf /etc/nginx/sites-available/catalogo /etc/nginx/sites-enabled/

# Remover a configuração padrão do Nginx
rm -f /etc/nginx/sites-enabled/default

# Testar se a configuração está correta
nginx -t
```

### ✅ Resultado esperado:

```
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

> ❌ **Se der erro:** Revise o arquivo `/etc/nginx/sites-available/catalogo` — provavelmente tem um erro de digitação.

### 9.3 — Reiniciar o Nginx

```bash
systemctl restart nginx
systemctl enable nginx
```

### 9.4 — Liberar portas no firewall

```bash
# IMPORTANTE: libere SSH PRIMEIRO para não perder acesso!
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

> Quando perguntar `Command may disrupt existing SSH connections. Proceed with operation?`, digite `y`.

### ✅ Resultado esperado:

```bash
ufw status verbose
# Deve mostrar as portas 22, 80 e 443 como ALLOW
```

> 🔒 **Segurança:** As portas 3001 (Express) e 5432 (PostgreSQL) ficam **fechadas** para acesso externo. Apenas o Nginx acessa internamente.

---

## Etapa 10 — Configurar Domínio e DNS

> ⚡ **Se não tiver domínio:** Pule para a [Etapa 12](#etapa-12--verificar-se-tudo-funciona). O site ficará acessível pelo IP (sem HTTPS).

### 10.1 — Registrar um domínio

Se ainda não tem, registre em: **Registro.br**, **Cloudflare**, **Namecheap**, **GoDaddy**, etc.

### 10.2 — Configurar os registros DNS

Acesse o **painel de DNS** do seu registrador e crie estes registros:

| Tipo | Nome | Valor | TTL |
|------|------|-------|-----|
| **A** | `@` (raiz) | `IP_DA_SUA_VPS` | 300 |
| **A** | `www` | `IP_DA_SUA_VPS` | 300 |

**Exemplo concreto** para `meucatalogo.com.br` com VPS IP `203.0.113.50`:

| Tipo | Nome | Valor |
|------|------|-------|
| A | @ | 203.0.113.50 |
| A | www | 203.0.113.50 |

> 💡 **Se quiser usar subdomínio** (ex: `loja.meusite.com.br`):
>
> | Tipo | Nome | Valor |
> |------|------|-------|
> | A | loja | `IP_DA_SUA_VPS` |
>
> E no Nginx, use: `server_name loja.meusite.com.br;`

### 10.3 — Aguardar propagação DNS

A propagação pode levar de **5 minutos a 72 horas** (geralmente 5–30 minutos). Verifique:

```bash
dig +short SEU_DOMINIO
# Deve retornar o IP da sua VPS
```

Você também pode verificar em: [https://dnschecker.org](https://dnschecker.org)

---

## Etapa 11 — Instalar SSL (HTTPS)

> ⚡ **Pré-requisito:** O domínio deve estar apontando para a VPS (etapa 10). Se estiver usando apenas IP, pule esta etapa.

```bash
# Instalar o Certbot
apt install -y certbot python3-certbot-nginx

# Gerar o certificado SSL
certbot --nginx -d SEU_DOMINIO -d www.SEU_DOMINIO
```

> 📝 O Certbot vai pedir:
> 1. Seu e-mail (para avisos de expiração)
> 2. Aceitar os termos de uso (digite `y`)
> 3. Compartilhar e-mail com EFF (opcional, pode digitar `n`)

### ✅ Resultado esperado:

```
Successfully received certificate.
```

### 11.1 — Atualizar o .env para usar HTTPS

```bash
# Atualizar URLs para HTTPS
sed -i 's|VITE_API_URL=http://|VITE_API_URL=https://|' /var/www/catalogo/.env
sed -i 's|API_BASE_URL=http://|API_BASE_URL=https://|' /var/www/catalogo/.env

# Recompilar o frontend (para usar as novas URLs)
cd /var/www/catalogo
npm run build

# Reiniciar o backend
pm2 restart catalogo-api
```

### 11.2 — Verificar renovação automática

O certificado SSL expira a cada 90 dias, mas o Certbot renova automaticamente:

```bash
certbot renew --dry-run
```

---

## Etapa 12 — Verificar se Tudo Funciona

### Checklist final — teste cada item:

```bash
# 1. PostgreSQL rodando?
systemctl status postgresql
# ✅ Deve mostrar: active (running)

# 2. Backend rodando?
pm2 status
# ✅ catalogo-api deve estar "online"

# 3. API respondendo localmente?
curl http://localhost:3001/api/health
# ✅ Deve retornar: {"status":"ok","mode":"postgres"}

# 4. Nginx rodando?
systemctl status nginx
# ✅ Deve mostrar: active (running)
```

### Testar pelo navegador:

| URL | O que deve aparecer |
|-----|---------------------|
| `https://SEU_DOMINIO` | Página do catálogo (pode estar vazia, sem produtos ainda) |
| `https://SEU_DOMINIO/admin` | Painel administrativo |
| `https://SEU_DOMINIO/tv` | Modo TV (tela preta se não tiver produtos) |

### Testar as APIs:

```bash
# Listar produtos (deve retornar [] se estiver vazio)
curl https://SEU_DOMINIO/api/products

# Listar categorias (deve retornar as 4 categorias iniciais)
curl https://SEU_DOMINIO/api/categories

# Listar configurações
curl https://SEU_DOMINIO/api/settings

# Criar um produto de teste
curl -X POST https://SEU_DOMINIO/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SUA_CHAVE_ADMIN" \
  -d '{
    "name": "Produto Teste",
    "code": "TST001",
    "slug": "produto-teste",
    "price": 29.90,
    "active": true
  }'
```

> 📝 **Substitua** `SUA_CHAVE_ADMIN` pela chave que você definiu no `.env` (campo `ADMIN_API_KEY`).

### 🎉 Pronto! Seu catálogo está no ar!

Acesse pelo navegador:
- **Catálogo público:** `https://SEU_DOMINIO`
- **Painel admin:** `https://SEU_DOMINIO/admin`
- **Link de vendedor:** `https://SEU_DOMINIO/v/slug-do-vendedor`
- **Modo TV:** `https://SEU_DOMINIO/tv`

---

# 📚 Seções de Referência

As seções abaixo são para **consulta**. Não é necessário ler agora — volte quando precisar.

---

## Referência: Tabelas do Banco

### Diagrama de relacionamento

```
categories ────────────┐
                        ├──→ products
sellers ────────────────┤
                        ├──→ orders ──→ order_items
                        │
(tabelas independentes) │
├── store_settings      │
├── payment_conditions  │
├── banners             │
├── catalog_tabs        │
└── user_roles          │
```

### Resumo de cada tabela

| # | Tabela | Para que serve | Colunas principais |
|---|--------|----------------|-------------------|
| 1 | `categories` | Categorias de produtos | name, slug |
| 2 | `products` | Todos os produtos do catálogo | name, code, slug, price, category_id, active, featured, quantity, package_quantity |
| 3 | `sellers` | Vendedores com links personalizados | name, slug, whatsapp, active |
| 4 | `orders` | Pedidos dos clientes | customer_name, customer_phone, total, status, seller_id |
| 5 | `order_items` | Itens de cada pedido | order_id, product_name, quantity, unit_price, total_price |
| 6 | `store_settings` | Configurações da loja (chave/valor) | key, value |
| 7 | `payment_conditions` | Formas de pagamento | name, active, sort_order |
| 8 | `banners` | Imagens do carrossel | image_url, link, sort_order, active |
| 9 | `catalog_tabs` | Abas de filtro rápido | name, filter_type, filter_value |
| 10 | `user_roles` | Controle de permissões | user_id, role |

---

## Referência: Configurações da Loja (store_settings)

Cada configuração é um par `key` → `value` (texto). Booleanos usam `"true"` / `"false"`.

### Geral

| Chave | Padrão | O que faz |
|-------|--------|-----------|
| `store_name` | `Meu Catálogo` | Nome da loja exibido no topo |
| `store_subtitle` | `Distribuidora` | Subtítulo abaixo do nome |
| `whatsapp_number` | `5511999999999` | WhatsApp principal (com DDI+DDD, sem +) |
| `logo_url` | (vazio) | URL do logo da loja |

### Informações da Empresa

| Chave | Padrão | O que faz |
|-------|--------|-----------|
| `company_info_enabled` | `false` | Exibir botão "Sobre" no catálogo |
| `company_name` | (vazio) | Razão social |
| `company_cnpj` | (vazio) | CNPJ |
| `company_address` | (vazio) | Endereço |
| `company_phone` | (vazio) | Telefone fixo |
| `company_email` | (vazio) | E-mail comercial |

### Frete e Pedido Mínimo

| Chave | Padrão | O que faz |
|-------|--------|-----------|
| `shipping_enabled` | `false` | Cobrar taxa de entrega |
| `shipping_fee` | `0` | Valor da taxa (R$) |
| `minimum_order_enabled` | `false` | Exigir valor mínimo |
| `minimum_order_value` | `0` | Valor mínimo (R$) |

### Exibição do Catálogo

| Chave | Padrão | O que faz |
|-------|--------|-----------|
| `catalog_first_page_mode` | `default` | Modo: `default`, `featured`, `banners` |
| `hide_products_without_photo` | `false` | Ocultar produtos sem foto |
| `show_quick_filters_mobile` | `true` | Filtros rápidos no mobile |
| `show_brand_filter_mobile` | `true` | Filtro de marca no mobile |
| `quick_filter_1_name` | `Destaque 1` | Nome do filtro rápido 1 |
| `quick_filter_2_name` | `Destaque 2` | Nome do filtro rápido 2 |
| `payment_conditions_enabled` | `false` | Seleção de pagamento no checkout |

### Modo TV

| Chave | Padrão | O que faz |
|-------|--------|-----------|
| `tv_background_color` | `#1a1a2e` | Cor de fundo |
| `tv_text_color` | `#ffffff` | Cor do texto |
| `tv_interval` | `5000` | Tempo entre slides (ms) |
| `tv_source` | `featured` | Fonte: `featured`, `category`, `selected` |
| `tv_show_price` | `true` | Exibir preço |
| `tv_show_name` | `true` | Exibir nome |
| `tv_show_brand` | `false` | Exibir marca |
| `tv_show_code` | `false` | Exibir código |

---

## Referência: API REST Completa

**Base URL:** `https://SEU_DOMINIO/api`

> ⚠️ Todas as operações de escrita (POST, PUT, DELETE) exigem o header:
> ```
> Authorization: Bearer SUA_CHAVE_ADMIN
> ```

### Produtos — `/api/products`

| Método | Rota | O que faz |
|--------|------|-----------|
| `GET` | `/products` | Listar todos |
| `GET` | `/products/slug/:slug` | Buscar por slug |
| `GET` | `/products/code/:code` | Buscar por código |
| `POST` | `/products` | Criar produto |
| `PUT` | `/products/:id` | Atualizar produto |
| `DELETE` | `/products/:id` | Excluir produto |
| `POST` | `/products/upsert` | Importar em lote |

**Exemplo — criar produto:**
```bash
curl -X POST https://SEU_DOMINIO/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SUA_CHAVE" \
  -d '{
    "name": "Camiseta Básica",
    "code": "CAM001",
    "slug": "camiseta-basica",
    "price": 49.90,
    "active": true
  }'
```

### Categorias — `/api/categories`

| Método | Rota | O que faz |
|--------|------|-----------|
| `GET` | `/categories` | Listar |
| `POST` | `/categories` | Criar |
| `POST` | `/categories/batch` | Criar em lote |
| `PUT` | `/categories/:id` | Atualizar |
| `DELETE` | `/categories/:id` | Excluir |

### Vendedores — `/api/sellers`

| Método | Rota | O que faz |
|--------|------|-----------|
| `GET` | `/sellers` | Listar todos |
| `GET` | `/sellers/slug/:slug` | Buscar por slug |
| `POST` | `/sellers` | Criar |
| `PUT` | `/sellers/:id` | Atualizar |
| `DELETE` | `/sellers/:id` | Excluir |

**Exemplo — criar vendedor:**
```bash
curl -X POST https://SEU_DOMINIO/api/sellers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SUA_CHAVE" \
  -d '{
    "name": "Maria Santos",
    "slug": "maria-santos",
    "whatsapp": "5511988887777"
  }'
```

> 💡 Link do vendedor ficará: `https://SEU_DOMINIO/v/maria-santos`

### Pedidos — `/api/orders`

| Método | Rota | O que faz |
|--------|------|-----------|
| `GET` | `/orders` | Listar todos |
| `GET` | `/orders/:id/items` | Itens do pedido |
| `POST` | `/orders` | Criar pedido |
| `PUT` | `/orders/:id` | Atualizar status |
| `DELETE` | `/orders/:id` | Excluir |

### Configurações — `/api/settings`

| Método | Rota | O que faz |
|--------|------|-----------|
| `GET` | `/settings` | Listar todas |
| `PUT` | `/settings/:key` | Atualizar valor |

**Exemplo:**
```bash
curl -X PUT https://SEU_DOMINIO/api/settings/store_name \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SUA_CHAVE" \
  -d '{ "value": "Minha Loja" }'
```

### Banners — `/api/banners`

| Método | Rota | O que faz |
|--------|------|-----------|
| `GET` | `/banners` | Listar |
| `POST` | `/banners` | Criar |
| `PUT` | `/banners/:id` | Atualizar |
| `DELETE` | `/banners/:id` | Excluir |

### Pagamentos — `/api/payment-conditions`

| Método | Rota | O que faz |
|--------|------|-----------|
| `GET` | `/payment-conditions` | Listar |
| `POST` | `/payment-conditions` | Criar |
| `PUT` | `/payment-conditions/:id` | Atualizar |
| `DELETE` | `/payment-conditions/:id` | Excluir |

### Upload de Imagens — `/api/upload`

| Método | Rota | Content-Type | Body |
|--------|------|-------------|------|
| `POST` | `/upload/image` | `multipart/form-data` | campo `file` |
| `POST` | `/upload/base64` | `application/json` | `{ base64, filename? }` |

**Exemplo:**
```bash
curl -X POST https://SEU_DOMINIO/api/upload/image \
  -H "Authorization: Bearer SUA_CHAVE" \
  -F "file=@/caminho/para/imagem.jpg"
# Resposta: { "url": "https://SEU_DOMINIO/uploads/uuid.jpg" }
```

### Health Check

```bash
curl https://SEU_DOMINIO/api/health
# Resposta: {"status":"ok","mode":"postgres"}
```

---

## Comandos Úteis do Dia a Dia

### Atualizar o catálogo (quando fizer mudanças no código)

```bash
cd /var/www/catalogo
git pull                      # Baixar atualizações
npm install                   # Instalar novas dependências (se houver)
npm run build                 # Recompilar frontend
pm2 restart catalogo-api      # Reiniciar backend
```

### PostgreSQL

```bash
# Conectar ao banco
psql -U postgres -h localhost -d catalogo

# Comandos dentro do psql:
\dt                          # Listar tabelas
\d products                  # Ver colunas da tabela products
SELECT COUNT(*) FROM products;  # Contar produtos
SELECT COUNT(*) FROM orders;    # Contar pedidos

# Backup manual
pg_dump -U postgres catalogo > /root/backup_$(date +%Y%m%d).sql

# Restaurar backup
psql -U postgres catalogo < backup_20260223.sql
```

### PM2

```bash
pm2 status                    # Ver status do backend
pm2 logs catalogo-api         # Ver logs em tempo real
pm2 restart catalogo-api      # Reiniciar
pm2 monit                     # Monitor interativo
```

### Nginx

```bash
nginx -t                      # Testar configuração
systemctl restart nginx       # Reiniciar
systemctl status nginx        # Ver status
```

### Consultas úteis

```bash
# Ver produtos sem foto
psql -U postgres -h localhost -d catalogo -c \
  "SELECT name, code FROM products WHERE image_url = '/placeholder.svg' OR image_url IS NULL;"

# Ver pedidos recentes
psql -U postgres -h localhost -d catalogo -c \
  "SELECT customer_name, total, status, created_at FROM orders ORDER BY created_at DESC LIMIT 10;"

# Ver configurações da loja
psql -U postgres -h localhost -d catalogo -c \
  "SELECT key, value FROM store_settings ORDER BY key;"

# Ver espaço usado por imagens
du -sh /var/www/catalogo/public/uploads/
```

---

## Solução de Problemas

### Erros mais comuns e como resolver

| Problema | Causa | Solução |
|----------|-------|---------|
| `relation "products" does not exist` | Tabelas não foram criadas | Execute o SQL da Etapa 4.2 |
| `connection refused` (porta 5432) | PostgreSQL parado | `systemctl start postgresql` |
| `connection refused` (porta 3001) | Backend parado | `pm2 restart catalogo-api` |
| `502 Bad Gateway` | Backend offline | `pm2 status` → reinicie se offline |
| Site não carrega pelo domínio | DNS não propagou | Aguarde ou verifique em dnschecker.org |
| `413 Request Entity Too Large` | Upload grande demais | Verifique `client_max_body_size 50M;` no Nginx |
| Imagens não aparecem | Pasta uploads não existe | `mkdir -p /var/www/catalogo/public/uploads` |
| Imagens com URL localhost | `API_BASE_URL` errada | Edite `.env` → `API_BASE_URL=https://SEU_DOMINIO` |
| CORS error no navegador | `VITE_API_URL` errada | Deve apontar para o domínio, não localhost |
| Admin não salva nada (erro 401) | Chave admin não configurada | Verifique `ADMIN_API_KEY` e `VITE_ADMIN_API_KEY` no `.env` |
| Frontend desatualizado | Build antigo | `npm run build` + Ctrl+Shift+R no navegador |
| SSL não funciona | DNS não propagou | `dig +short SEU_DOMINIO` deve retornar o IP |
| Certificado expirado | Certbot não renovou | `certbot renew && systemctl restart nginx` |
| Vendedor não aparece pelo link | Slug errado ou inativo | `SELECT slug, active FROM sellers;` |
| `ECONNREFUSED` | Backend offline ou porta errada | Verifique `PORT` no `.env` e `pm2 status` |

### Proteger o Admin com senha no Nginx (opcional)

Se quiser uma camada extra de segurança no `/admin`:

```bash
# Instalar htpasswd
apt install -y apache2-utils

# Criar usuário (vai pedir para definir uma senha)
htpasswd -c /etc/nginx/.htpasswd admin
```

Adicione no arquivo `/etc/nginx/sites-available/catalogo`, dentro do bloco `server { }`:

```nginx
location /admin {
    auth_basic "Área Administrativa";
    auth_basic_user_file /etc/nginx/.htpasswd;
    try_files $uri $uri/ /index.html;
}
```

```bash
nginx -t && systemctl restart nginx
```

---

## Backup Automático

### Criar script de backup

```bash
cat > /root/backup-catalogo.sh << 'SCRIPT'
#!/bin/bash
BACKUP_DIR="/root/backups"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M)

# Backup do banco de dados
pg_dump -U postgres catalogo > $BACKUP_DIR/db_$DATE.sql

# Backup das imagens uploadadas
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C /var/www/catalogo/public uploads/

# Remover backups com mais de 30 dias
find $BACKUP_DIR -type f -mtime +30 -delete

echo "✅ Backup concluído: $DATE"
SCRIPT

chmod +x /root/backup-catalogo.sh
```

### Agendar backup diário (3h da manhã)

```bash
crontab -e
```

Adicione esta linha no final do arquivo:

```
0 3 * * * /root/backup-catalogo.sh >> /var/log/backup-catalogo.log 2>&1
```

Salve e saia.

---

## Resumo Rápido — Copiar e Colar

Para quem já tem experiência, aqui está a instalação resumida:

```bash
# ═══════════════════════════════════════════════════
# INSTALAÇÃO RÁPIDA EM VPS UBUNTU
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

# 4. Criar tabelas (copie o SQL completo da Etapa 4.2)
psql -U postgres -h localhost -d catalogo
# → Cole TODO o SQL
# → \q para sair

# 5. Baixar projeto
cd /var/www
git clone <URL_DO_REPOSITORIO> catalogo
cd catalogo
npm install
mkdir -p public/uploads

# 6. Criar rotas (seção 6: sellers.ts, orders.ts, atualizar index.ts)

# 7. Configurar .env
cat > .env << EOF
VITE_API_MODE=postgres
VITE_API_URL=https://MEU_DOMINIO/api
DATABASE_URL=postgresql://postgres:MINHA_SENHA@localhost:5432/catalogo
PORT=3001
API_BASE_URL=https://MEU_DOMINIO
ADMIN_API_KEY=MINHA_CHAVE
VITE_ADMIN_API_KEY=MINHA_CHAVE
EOF

# 8. Build + Backend
npm run build
pm2 start "npx tsx server/index.ts" --name catalogo-api --cwd /var/www/catalogo
pm2 startup && pm2 save

# 9. Firewall
ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw enable

# 10. Nginx (crie /etc/nginx/sites-available/catalogo conforme Etapa 9)
ln -sf /etc/nginx/sites-available/catalogo /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# 11. SSL
apt install -y certbot python3-certbot-nginx
certbot --nginx -d MEU_DOMINIO -d www.MEU_DOMINIO

# 12. Pronto!
#     https://MEU_DOMINIO          → Catálogo
#     https://MEU_DOMINIO/admin    → Admin
#     https://MEU_DOMINIO/v/slug   → Vendedor
#     https://MEU_DOMINIO/tv       → Modo TV
```

---

## Estrutura de Arquivos na VPS

```
/var/www/catalogo/
├── .env                           ← Suas configurações (senhas, domínio, chave admin)
├── dist/                          ← Frontend compilado (Nginx serve daqui)
│   ├── index.html
│   └── assets/
├── server/                        ← Backend Express.js
│   ├── index.ts                   ← Servidor principal (porta 3001)
│   ├── db.ts                      ← Conexão com PostgreSQL
│   ├── middleware/
│   │   └── auth.ts                ← Validação da chave admin
│   └── routes/
│       ├── products.ts            ← CRUD de produtos
│       ├── categories.ts          ← CRUD de categorias
│       ├── sellers.ts             ← CRUD de vendedores (criado na etapa 6)
│       ├── orders.ts              ← CRUD de pedidos (criado na etapa 6)
│       ├── settings.ts            ← Configurações da loja
│       ├── banners.ts             ← Banners do carrossel
│       ├── payment-conditions.ts  ← Formas de pagamento
│       ├── upload.ts              ← Upload de imagens
│       └── auth.ts                ← Autenticação (admin aberto na VPS)
├── public/
│   └── uploads/                   ← Imagens de produtos, banners, logo
└── package.json
```

---

*Documentação atualizada em 23/02/2026.*
