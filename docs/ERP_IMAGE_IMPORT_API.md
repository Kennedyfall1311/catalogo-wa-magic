# Documentação de Importação de Imagens via API

> Guia técnico para enviar imagens de produtos em Base64 para o catálogo via API REST.

---

## Visão Geral

O catálogo permite a importação de imagens de produtos via API, utilizando o mesmo formato aceito pela importação manual (Excel/CSV). As imagens são enviadas codificadas em **Base64** e associadas aos produtos pelo **código do produto** (`code`).

**Base URL:** `https://rglmtxjqbvfqiqixlidx.supabase.co/functions/v1`

**Autenticação:** Todas as requisições devem incluir o header:
```
Authorization: Bearer <ERP_API_TOKEN>
```

---

## Endpoint

### `POST /erp-sync/images` — Importar imagens em lote

Faz upload de imagens Base64 e associa aos produtos existentes pelo código.

**Request:**
```json
{
  "images": [
    {
      "codigoproduto": "SKU-001",
      "imagem_base64": "/9j/4AAQSkZJRgABAQ..."
    },
    {
      "codigoproduto": "SKU-002",
      "imagem_base64": "iVBORw0KGgoAAAANSUhEUg..."
    }
  ]
}
```

**Campos:**

| Campo            | Tipo   | Obrigatório | Descrição                                                    |
|------------------|--------|-------------|--------------------------------------------------------------|
| `codigoproduto`  | string | ✅ Sim       | Código único do produto no ERP (deve existir no catálogo)    |
| `imagem_base64`  | string | ✅ Sim       | Imagem codificada em Base64 (JPEG, PNG, GIF ou WebP)         |

### Formato do Base64

A imagem pode ser enviada em dois formatos:

1. **Base64 puro** (sem prefixo):
```
/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBg...
```

2. **Data URI** (com prefixo):
```
data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBg...
```

Ambos são aceitos. O sistema remove o prefixo automaticamente.

### Detecção automática de formato

O sistema detecta o tipo da imagem automaticamente pelos primeiros bytes do Base64:

| Prefixo Base64 | Formato |
|----------------|---------|
| `/9j/`         | JPEG    |
| `iVBOR`        | PNG     |
| `R0lGO`        | GIF     |
| `UklGR`        | WebP    |

Se nenhum for reconhecido, assume **JPEG** como padrão.

---

## Respostas

### Sucesso total (200)
```json
{
  "success": true,
  "updated": 2,
  "skipped": 0,
  "errors": []
}
```

### Sucesso parcial (207)
```json
{
  "success": false,
  "updated": 1,
  "skipped": 1,
  "errors": [
    {
      "codigoproduto": "SKU-999",
      "error": "Produto com código 'SKU-999' não encontrado"
    }
  ]
}
```

### Erro de validação (400)
```json
{
  "error": "Campo 'images' é obrigatório e deve ser um array",
  "code": "VALIDATION_ERROR"
}
```

### Token inválido (401)
```json
{
  "error": "Token de autenticação inválido",
  "code": "UNAUTHORIZED"
}
```

---

## Fluxo de Processamento

```
┌───────────────┐        ┌──────────────────────────────────┐
│   ERP/Sistema │        │          Catálogo                 │
│               │        │                                   │
│  1. Envia     │───────▶│  Recebe Base64                    │
│     POST com  │        │  ↓                                │
│     código +  │        │  Busca produto pelo código        │
│     base64    │        │  ↓                                │
│               │        │  Decodifica Base64 → Blob         │
│               │        │  ↓                                │
│               │        │  Upload para Storage              │
│               │        │  ↓                                │
│               │◀───────│  Atualiza image_url do produto    │
│  2. Recebe    │        │  ↓                                │
│     resposta  │        │  Retorna resultado                │
└───────────────┘        └──────────────────────────────────┘
```

---

## Limites e Recomendações

| Item                      | Valor recomendado                        |
|---------------------------|------------------------------------------|
| Tamanho máximo por imagem | **5 MB** (Base64 encoded)                |
| Imagens por requisição    | Até **50** (para evitar timeout)         |
| Formatos aceitos          | JPEG, PNG, GIF, WebP                     |
| Resolução recomendada     | 800x800 a 1200x1200 px                  |
| Frequência de envio       | Sob demanda ou 1x ao dia                |

> **Dica:** Para grandes volumes (centenas de produtos), envie em lotes de 50 imagens por requisição com intervalo de 2 segundos entre chamadas.

---

## Nomes alternativos dos campos

Para compatibilidade com diferentes ERPs, os seguintes nomes de coluna são aceitos:

**Código do produto:**
- `codigoproduto`
- `codigo_produto`
- `codigo`
- `code`
- `sku`

**Imagem Base64:**
- `imagem_base64`
- `imagem`
- `image_base64`
- `image`
- `base64`

---

## Exemplo cURL

```bash
# Importar imagem de um produto
curl -X POST https://rglmtxjqbvfqiqixlidx.supabase.co/functions/v1/erp-sync/images \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "images": [
      {
        "codigoproduto": "SKU-001",
        "imagem_base64": "/9j/4AAQSkZJRgABAQAAAQABAAD..."
      }
    ]
  }'
```

---

## Exemplo em Python

```python
import base64
import requests

TOKEN = "SEU_TOKEN_AQUI"
URL = "https://rglmtxjqbvfqiqixlidx.supabase.co/functions/v1/erp-sync/images"

# Ler imagem local e converter para Base64
with open("produto.jpg", "rb") as f:
    img_base64 = base64.b64encode(f.read()).decode("utf-8")

response = requests.post(
    URL,
    headers={
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    },
    json={
        "images": [
            {
                "codigoproduto": "SKU-001",
                "imagem_base64": img_base64
            }
        ]
    }
)

print(response.json())
```

---

## Exemplo em Node.js

```javascript
const fs = require("fs");

const TOKEN = "SEU_TOKEN_AQUI";
const URL = "https://rglmtxjqbvfqiqixlidx.supabase.co/functions/v1/erp-sync/images";

const imgBase64 = fs.readFileSync("produto.jpg").toString("base64");

const response = await fetch(URL, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${TOKEN}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    images: [
      {
        codigoproduto: "SKU-001",
        imagem_base64: imgBase64
      }
    ]
  })
});

console.log(await response.json());
```

---

## Importação via Arquivo (Alternativa)

Além da API, o painel administrativo também aceita importação de imagens via **arquivo Excel (.xlsx) ou CSV** com as mesmas colunas:

| codigoproduto | imagem_base64                    |
|---------------|----------------------------------|
| SKU-001       | /9j/4AAQSkZJRg... (base64)      |
| SKU-002       | iVBORw0KGgoAAAA... (base64)     |

Acesse o painel admin → **Importar Imagens** para usar essa funcionalidade.
