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
Baixe o instalador em https://www.postgresql.org/download/windows/ e siga o assistente. Durante a instalação, defina a senha do usuário `postgres`.

### 3.2 — Configurar acesso e portas

O PostgreSQL roda na porta **5432** por padrão.

**Verificar se está rodando:**
```bash
# Linux
sudo systemctl status postgresql

# macOS
brew services list | grep postgresql

# Windows — verificar no "Serviços" do Windows
```

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

Localize o arquivo:
```bash
# Linux: /etc/postgresql/15/main/pg_hba.conf
# macOS: /opt/homebrew/var/postgresql@15/pg_hba.conf
# Windows: C:\Program Files\PostgreSQL\15\data\pg_hba.conf
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

**Definir senha do usuário postgres:**
```bash
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'sua_senha_aqui';"
```

**Testar conexão:**
```bash
psql -U postgres -h localhost -p 5432
# Se conectar com sucesso: postgres=#
```

### 3.3 — Criar o banco de dados

```bash
psql -U postgres -h localhost -p 5432
```

```sql
CREATE DATABASE catalogo;
\c catalogo
```

### 3.4 — Criar as tabelas

Execute dentro do banco `catalogo`:

```sql
-- Extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum de roles
CREATE TYPE public.app_role AS ENUM ('admin');

-- Tabela de roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Categorias
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
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Função: atualizar updated_at automaticamente
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

-- Função: verificar role do usuário
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

### 3.5 — Inserir dados iniciais

```sql
INSERT INTO public.store_settings (key, value) VALUES
  ('whatsapp_number', '5511999999999'),
  ('store_name', 'Catálogo'),
  ('store_subtitle', 'Distribuidora'),
  ('payment_conditions_enabled', 'false')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.categories (name, slug) VALUES
  ('Roupas', 'roupas'),
  ('Calçados', 'calcados'),
  ('Acessórios', 'acessorios'),
  ('Promoções', 'promocoes')
ON CONFLICT (slug) DO NOTHING;
```

---

## 4. Configurar Variáveis de Ambiente

Crie o arquivo `.env` na raiz do projeto:

```env
# Modo de operação: "postgres" para PostgreSQL direto, ou deixe vazio para usar Supabase
VITE_API_MODE=postgres

# URL da API Express backend
VITE_API_URL=http://localhost:3001/api

# Conexão com o banco PostgreSQL (usado pelo servidor Express)
DATABASE_URL=postgresql://postgres:sua_senha@localhost:5432/catalogo
```

> **Importante:** Substitua `sua_senha` pela senha real do usuário `postgres`.

---

## 5. Rodar o Servidor Backend (Express)

O catálogo utiliza um servidor Express que conecta diretamente ao PostgreSQL.

```bash
# Iniciar o servidor backend (porta 3001)
npx tsx server/index.ts
```

O servidor ficará disponível em: **http://localhost:3001**

Endpoints disponíveis:

| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/products` | GET | Listar produtos |
| `/api/products` | POST | Criar produto |
| `/api/products/:id` | PUT | Atualizar produto |
| `/api/products/:id` | DELETE | Remover produto |
| `/api/products/upsert` | POST | Upsert em lote |
| `/api/categories` | GET/POST | Listar/criar categorias |
| `/api/categories/:id` | PUT/DELETE | Atualizar/remover |
| `/api/settings` | GET | Listar configurações |
| `/api/settings/:key` | PUT | Atualizar configuração |
| `/api/banners` | GET/POST | Listar/criar banners |
| `/api/banners/:id` | PUT/DELETE | Atualizar/remover |
| `/api/payment-conditions` | GET/POST | Condições de pagamento |
| `/api/upload/image` | POST | Upload de imagem (multipart) |
| `/api/upload/base64` | POST | Upload de imagem base64 |
| `/api/health` | GET | Health check |

---

## 6. Rodar o Frontend

Em outro terminal:

```bash
npm run dev
# ou
bun run dev
```

O catálogo estará disponível em: **http://localhost:8080**

| Rota | Descrição |
|------|-----------|
| `/` | Catálogo público |
| `/admin` | Painel administrativo (aberto, sem login) |
| `/produto/:slug` | Detalhe do produto |
| `/carrinho` | Carrinho de compras |
| `/checkout` | Finalização do pedido |

> **Nota:** No modo PostgreSQL, o painel admin é aberto (sem autenticação). Para protegê-lo em produção, configure um proxy reverso (Nginx) com autenticação básica.

---

## 7. Upload de Imagens

No modo PostgreSQL, as imagens são salvas localmente na pasta `public/uploads/`. O servidor Express serve esses arquivos automaticamente.

```
public/
  uploads/
    abc123.jpg    ← imagens de produtos
    banner-1.png  ← imagens de banners
    logo-1.png    ← logo da loja
```

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

## Arquitetura Dual Mode

O catálogo suporta dois modos de operação:

| | **Modo PostgreSQL** | **Modo Supabase** |
|---|---|---|
| Variável | `VITE_API_MODE=postgres` | (padrão, sem variável) |
| Backend | Express.js local | Supabase Cloud |
| Banco | PostgreSQL direto | PostgreSQL gerenciado |
| Auth | Sem autenticação (admin aberto) | Supabase Auth (email/senha) |
| Storage | Pasta `public/uploads/` | Supabase Storage |
| Realtime | Polling (5s) | WebSocket nativo |

Para alternar entre os modos, basta mudar a variável `VITE_API_MODE` no `.env`.

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

# Backup do banco
pg_dump -U postgres catalogo > backup_catalogo.sql

# Restaurar backup
psql -U postgres catalogo < backup_catalogo.sql
```

---

## Solução de Problemas

| Problema | Solução |
|----------|---------|
| `relation does not exist` | Execute os SQLs da seção 3.4 na ordem correta |
| `role "postgres" does not exist` | Crie o role: `createuser -s postgres` |
| `connection refused` (PostgreSQL) | Verifique: `sudo systemctl status postgresql` |
| `connection refused` (Express) | Verifique se o backend está rodando: `npx tsx server/index.ts` |
| Imagens não aparecem | Verifique se a pasta `public/uploads/` existe |
| Produtos não aparecem | Verifique se existem produtos com `active = true` |
| CORS errors | O Express já inclui CORS. Verifique se `VITE_API_URL` aponta para o endereço correto |

---

## Build para Produção

```bash
npm run build
```

Os arquivos do frontend estarão na pasta `dist/`. Para produção com PostgreSQL:

1. Sirva a pasta `dist/` com Nginx ou outro servidor estático
2. Rode o backend: `npx tsx server/index.ts`
3. Configure um proxy reverso para `/api` apontar para o Express
4. Configure variáveis de ambiente no servidor

Exemplo de configuração Nginx:
```nginx
server {
    listen 80;
    server_name catalogo.exemplo.com;

    # Frontend estático
    root /var/www/catalogo/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy para API Express
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Imagens uploadadas
    location /uploads/ {
        alias /var/www/catalogo/public/uploads/;
    }
}
```
