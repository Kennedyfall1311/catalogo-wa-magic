# 🚀 Tutorial Atualizado — Instalação Local + Senha do Admin

> Atualizado em **agosto/2026**. Este guia é para rodar o catálogo **no seu computador** (Windows, macOS ou Linux) usando **PostgreSQL local**.
> Para publicar em servidor/VPS com Nginx e SSL, use o guia completo: [`INSTALACAO_LOCAL.md`](./INSTALACAO_LOCAL.md).

---

## 📌 O que você vai ter no final

- Catálogo rodando em `http://localhost:8080`
- API (backend Express) rodando em `http://localhost:3001`
- Banco PostgreSQL local com todas as tabelas
- Painel admin em `http://localhost:8080/admin` **protegido por e-mail e senha**

---

## 1. Pré-requisitos

| Programa | Versão mínima | Como verificar |
|---|---|---|
| Node.js | 18+ (recomendado 20) | `node -v` |
| npm | 9+ | `npm -v` |
| PostgreSQL | 15+ | `psql --version` |
| Git | qualquer | `git --version` |

Downloads: [nodejs.org](https://nodejs.org) · [postgresql.org/download](https://www.postgresql.org/download/)

---

## 2. Baixar o projeto e instalar dependências

```bash
git clone <URL_DO_SEU_REPOSITORIO> catalogo
cd catalogo
npm install
```

---

## 3. Criar o banco de dados

```bash
# Criar o banco
psql -U postgres -c "CREATE DATABASE catalogo;"

# Conectar nele
psql -U postgres -h localhost -d catalogo
```

Dentro do `psql`, cole o **bloco SQL completo do schema** que está em
[`INSTALACAO_LOCAL.md` → Etapa 4.2](./INSTALACAO_LOCAL.md) (10 tabelas + triggers + dados iniciais).

Verifique se deu certo:

```sql
\dt
-- deve listar: banners, catalog_tabs, categories, order_items, orders,
-- payment_conditions, products, sellers, store_settings, user_roles
\q
```

---

## 4. Criar o arquivo `.env`

Na **raiz do projeto**, crie um arquivo chamado `.env`:

```env
# ══════════════════════════════════════════════
# FRONTEND (prefixo VITE_) — aplicado no build/dev
# ══════════════════════════════════════════════
VITE_API_MODE=postgres
VITE_API_URL=http://localhost:3001/api

# ══════════════════════════════════════════════
# BACKEND (sem prefixo) — aplicado ao reiniciar a API
# ══════════════════════════════════════════════
DATABASE_URL=postgresql://postgres:SUA_SENHA_DO_POSTGRES@localhost:5432/catalogo
PORT=3001

# ── ACESSO AO PAINEL ADMIN ──
ADMIN_EMAIL=admin@local
ADMIN_PASSWORD=TrocarEssaSenha123!

# (opcional) chave fixa para integrações/ERP
# ADMIN_API_KEY=cole_aqui_uma_chave_longa_aleatoria
```

> ⚠️ **`VITE_API_MODE=postgres` é obrigatório.** Sem ele o app tenta usar o backend em nuvem e falha.
> ⚠️ Nunca coloque a senha do admin em variáveis `VITE_*` — elas vão para dentro do JavaScript público.

---

## 5. Rodar o projeto

Abra **dois terminais** na pasta do projeto.

**Terminal 1 — backend (API):**

```bash
npx tsx server/index.ts
```

Esperado: `🚀 Servidor backend rodando em http://localhost:3001`

**Terminal 2 — frontend:**

```bash
npm run dev
```

Acesse: <http://localhost:8080>

Teste rápido da API:

```bash
curl http://localhost:3001/api/health
# {"status":"ok","mode":"postgres"}
```

---

## 6. 🔐 Configurar a SENHA DO ADMIN

O painel admin no modo local agora exige **login com e-mail e senha**.

### 6.1 Definir a senha

No `.env`, na seção do backend:

```env
ADMIN_EMAIL=seuemail@suaempresa.com
ADMIN_PASSWORD=UmaSenhaForte#2026
```

Reinicie o backend (Ctrl+C no Terminal 1 e rode de novo):

```bash
npx tsx server/index.ts
```

> A senha só vale depois de **reiniciar o backend**. Mudar o `.env` sem reiniciar não tem efeito.

### 6.2 Entrar no painel

1. Acesse <http://localhost:8080/admin>
2. Digite o **e-mail** e a **senha** definidos acima
3. Pronto — a sessão dura **12 horas** e depois pede login de novo

### 6.3 Trocar a senha

1. Edite `ADMIN_PASSWORD` no `.env`
2. Reinicie o backend
3. Todas as sessões antigas continuam válidas até expirar; para derrubar todo mundo na hora, basta reiniciar o backend (as sessões ficam em memória e são apagadas no restart)

### 6.4 Gerar uma senha forte

```bash
# Linux / macOS
openssl rand -base64 24

# Windows (PowerShell)
[Convert]::ToBase64String((1..18 | ForEach-Object { Get-Random -Max 256 }))
```

### 6.5 Chave de API para integrações (opcional)

Se um ERP ou script precisa gravar dados sem fazer login, defina também:

```env
ADMIN_API_KEY=chave_longa_e_aleatoria
```

E envie em cada requisição:

```bash
curl -X POST http://localhost:3001/api/products \
  -H "Authorization: Bearer chave_longa_e_aleatoria" \
  -H "Content-Type: application/json" \
  -d '{"name":"Produto Teste","price":10}'
```

> 🚫 **Não** use `VITE_ADMIN_API_KEY` no `.env`. Essa variável é embutida no site e qualquer visitante consegue lê-la. O login por senha substituiu esse mecanismo no navegador.

### 6.6 Como a proteção funciona

```
Navegador                    Backend Express
   │  POST /api/auth/login
   │  { email, password }  ─────────►  compara com ADMIN_EMAIL / ADMIN_PASSWORD
   │                       ◄─────────  { token }  (sessão de 12h, na memória)
   │
   │  POST /api/products
   │  Authorization: Bearer <token> ─►  requireAdmin valida token OU ADMIN_API_KEY
   │                                    ✅ grava   |   ❌ 401/403
```

Rotas de leitura (catálogo, produtos, banners) continuam públicas. Criar, editar, excluir e fazer upload exigem token.

---

## 7. Modo em nuvem (Lovable Cloud) — senha do admin

Se você **não** usar PostgreSQL local (ou seja, sem `VITE_API_MODE=postgres`), o acesso é por conta de usuário:

1. Acesse `/admin` e clique em **Criar nova conta** — defina e-mail e senha
2. Confirme o e-mail (se a confirmação estiver ativa)
3. No **primeiro acesso**, clique em **“Tornar minha conta Admin (primeiro acesso)”** — isso só funciona enquanto não existir nenhum admin
4. Para trocar a senha depois, use o fluxo de recuperação por e-mail

---

## 8. Problemas comuns

| Sintoma | Causa | Solução |
|---|---|---|
| Tela de login não aceita a senha | Backend sem `ADMIN_PASSWORD` ou não reiniciado | Defina no `.env` e reinicie `npx tsx server/index.ts` |
| “ADMIN_PASSWORD não configurada” | Variável ausente | Adicione ao `.env` (sem prefixo `VITE_`) |
| Erro `supabaseUrl is required` | Faltou `VITE_API_MODE=postgres` | Adicione e reinicie `npm run dev` (ou refaça o `npm run build`) |
| `ECONNREFUSED 5432` | PostgreSQL parado ou senha errada | Verifique o serviço e a `DATABASE_URL` |
| Catálogo abre mas sem produtos | Backend fora do ar | Confira `curl http://localhost:3001/api/health` |
| Imagens não salvam | Pasta de upload inexistente | `mkdir -p public/uploads` e garanta permissão de escrita |
| 403 nas ações do admin | Sessão expirou (12h) | Faça login novamente em `/admin` |

---

## 9. Resumo dos comandos

```bash
git clone <REPO> catalogo && cd catalogo
npm install
psql -U postgres -c "CREATE DATABASE catalogo;"
psql -U postgres -d catalogo            # colar o schema SQL
nano .env                               # configurar variáveis + senha do admin
npx tsx server/index.ts                 # terminal 1
npm run dev                             # terminal 2
```

---

## 10. 🛒 Vendas 100% internas (site/app + banco próprio)

A partir desta versão **nenhuma venda passa por API externa**. Todo o ciclo do pedido
(carrinho → checkout → pedido gravado → status → dashboard) roda no seu próprio backend
Express + PostgreSQL local (ou no Lovable Cloud, se você usar o modo em nuvem).

### 10.1 Tabelas usadas pelas vendas

Já estão no schema completo (Etapa 4.2 do [`INSTALACAO_LOCAL.md`](./INSTALACAO_LOCAL.md)):

| Tabela | Para quê |
|---|---|
| `orders` | Cabeçalho do pedido: cliente, telefone, CPF/CNPJ, pagamento, frete, total, status, vendedor |
| `order_items` | Itens do pedido: produto, código, quantidade, preço unitário e total |
| `sellers` | Vendedor vinculado ao pedido (opcional, via link `/v/:slug`) |

Se você criou o banco antes, confira/rode:

```sql
\dt
-- precisa listar orders e order_items

-- índices recomendados para o dashboard de vendas
CREATE INDEX IF NOT EXISTS idx_orders_status     ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
```

> A baixa de estoque é feita **pelo próprio backend** dentro da transação do pedido
> (`UPDATE products SET quantity = quantity - qtd`). Não é preciso criar trigger no modo local.

### 10.2 Rotas internas de vendas (`server/routes/orders.ts`)

| Método | Rota | Acesso | O que faz |
|---|---|---|---|
| `GET` | `/api/orders` | público* | Lista pedidos. Filtros: `?status=`, `?seller_id=`, `?from=`, `?to=` |
| `GET` | `/api/orders/stats/summary` | público* | Total de pedidos, faturamento, ticket médio, pendentes, pedidos de hoje |
| `GET` | `/api/orders/:id` | público* | Pedido + itens |
| `GET` | `/api/orders/:id/items` | público* | Somente os itens |
| `POST` | `/api/orders` | público | Cria pedido + itens em **transação** e dá baixa no estoque |
| `PUT` | `/api/orders/:id` | **admin** | Atualiza status e demais campos permitidos |
| `DELETE` | `/api/orders/:id` | **admin** | Exclui o pedido (itens saem em cascata) |

\* leitura fica atrás do painel admin no navegador; para expor na internet, coloque o backend
atrás de Nginx com acesso restrito ou proteja também as rotas de leitura.

**Criar um pedido (exemplo):**

```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: 6f1c2d10-teste-0001" \
  -d '{
    "order": {
      "customer_name": "João da Silva",
      "customer_phone": "11999999999",
      "payment_method": "PIX",
      "subtotal": 250, "shipping_fee": 20, "total": 270
    },
    "items": [
      { "product_name": "Camiseta Branca", "product_code": "CAM001",
        "quantity": 2, "unit_price": 125, "total_price": 250 }
    ]
  }'
```

**Mudar o status (precisa de login admin):**

```bash
curl -X PUT http://localhost:3001/api/orders/<ID_DO_PEDIDO> \
  -H "Authorization: Bearer <token-do-login>" \
  -H "Content-Type: application/json" \
  -d '{"status":"completed"}'
```

### 10.3 Proteção contra pedido duplicado

O checkout envia o header `X-Idempotency-Key`. Se a mesma chave chegar de novo
(duplo clique, reenvio, queda de rede), o backend **devolve o pedido já criado**
em vez de gravar outro. A chave vale por 24 horas.

### 10.4 O que foi desativado

- O módulo **“Enviar pedidos ao ERP”** saiu do painel (Admin → Integração).
- A integração ERP continua disponível apenas para **produtos, preços e estoque**.
- Nenhuma requisição de venda sai do seu servidor.

### 10.5 Conferindo se está tudo interno

```bash
curl http://localhost:3001/api/health              # {"status":"ok","mode":"postgres"}
curl http://localhost:3001/api/orders/stats/summary
psql -U postgres -d catalogo -c "SELECT id, customer_name, total, status FROM orders ORDER BY created_at DESC LIMIT 5;"
```

Depois abra <http://localhost:8080/admin> → aba **Vendas** e veja o pedido no dashboard.
