# Documentação de Importação de Imagens via API

> Guia técnico completo para enviar imagens de produtos em Base64 para o catálogo via API REST.

---

## Sumário

1. [Visão Geral](#visão-geral)
2. [Autenticação](#autenticação)
3. [Endpoint Principal](#endpoint)
4. [Formatos de Imagem](#formato-do-base64)
5. [Aliases de Campos](#nomes-alternativos-dos-campos)
6. [Respostas da API](#respostas)
7. [Fluxo de Processamento](#fluxo-de-processamento)
8. [Limites e Recomendações](#limites-e-recomendações)
9. [Exemplos Completos](#exemplos-completos)
10. [Importação via Arquivo](#importação-via-arquivo-alternativa)
11. [Troubleshooting](#troubleshooting)

---

## Visão Geral

O catálogo permite a importação de imagens de produtos via API REST, utilizando codificação **Base64**. As imagens são associadas aos produtos pelo **código do produto** (`code`), que deve existir previamente no catálogo.

### Pré-requisitos

| Requisito | Detalhes |
|-----------|----------|
| **Produto cadastrado** | O produto deve existir no catálogo antes de enviar a imagem |
| **Token de autenticação** | Configurado no painel admin (ERP → Token) |
| **Imagem válida** | JPEG, PNG, GIF ou WebP, até 5MB por imagem |

### Como funciona

```
1. ERP lê imagem do disco/banco interno
2. Converte para Base64
3. Envia POST com código do produto + Base64
4. API decodifica, valida e salva no storage
5. Atualiza image_url do produto automaticamente
6. Frontend exibe a nova imagem via Realtime
```

---

## Autenticação

Todas as requisições devem incluir o header:

```http
Authorization: Bearer <ERP_API_TOKEN>
Content-Type: application/json
```

O token é o mesmo configurado para a integração ERP no painel admin.

| Cenário | Status | Resposta |
|---------|:------:|----------|
| Token ausente | `401` | `{ "error": "Token de autenticação ausente", "code": "UNAUTHORIZED" }` |
| Token inválido | `401` | `{ "error": "Token de autenticação inválido", "code": "UNAUTHORIZED" }` |

---

## Endpoint

### `POST /erp-sync/images` — Importar imagens em lote

Faz upload de imagens Base64 e associa aos produtos existentes pelo código.

**URL:**
```
POST https://rglmtxjqbvfqiqixlidx.supabase.co/functions/v1/erp-sync/images
```

**Headers:**
```http
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json
```

**Request Body:**
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

**Campos detalhados:**

| Campo | Tipo | Obrigatório | Tamanho máx. | Descrição | Exemplo |
|-------|------|:-----------:|:------------:|-----------|---------|
| `codigoproduto` | string | ✅ Sim | 100 chars | Código único do produto no ERP. Deve existir no catálogo. Case-sensitive. | `"SKU-001"` |
| `imagem_base64` | string | ✅ Sim | ~6.7MB (5MB decoded) | Imagem codificada em Base64. Aceita com ou sem prefixo data URI. | `"/9j/4AAQSkZ..."` |

---

## Formato do Base64

### Formatos aceitos

A imagem pode ser enviada em **dois formatos**:

#### 1. Base64 puro (sem prefixo) — **recomendado**
```
/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBg...
```

#### 2. Data URI (com prefixo)
```
data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBg...
```

Ambos são aceitos. O sistema **remove o prefixo automaticamente** antes de processar.

### Detecção automática de formato

O sistema detecta o tipo da imagem automaticamente pelos **primeiros bytes** do Base64:

| Prefixo Base64 | Formato detectado | MIME Type | Extensão |
|----------------|:-----------------:|-----------|:--------:|
| `/9j/` | JPEG | `image/jpeg` | `.jpg` |
| `iVBOR` | PNG | `image/png` | `.png` |
| `R0lGO` | GIF | `image/gif` | `.gif` |
| `UklGR` | WebP | `image/webp` | `.webp` |
| Outro | JPEG (fallback) | `image/jpeg` | `.jpg` |

> **Nota:** Se nenhum padrão for reconhecido, o sistema assume **JPEG** como padrão. Isso funciona corretamente para a maioria dos casos, mas para garantir precisão, use o prefixo data URI.

### Como converter imagem para Base64

#### Em Python:
```python
import base64

with open("produto.jpg", "rb") as f:
    img_base64 = base64.b64encode(f.read()).decode("utf-8")
# Resultado: "/9j/4AAQSkZJRg..."
```

#### Em Node.js:
```javascript
const fs = require("fs");
const imgBase64 = fs.readFileSync("produto.jpg").toString("base64");
// Resultado: "/9j/4AAQSkZJRg..."
```

#### Em Bash:
```bash
base64 produto.jpg | tr -d '\n'
# Resultado: "/9j/4AAQSkZJRg..."
```

#### Em C#:
```csharp
byte[] imageBytes = File.ReadAllBytes("produto.jpg");
string imgBase64 = Convert.ToBase64String(imageBytes);
```

#### Em PHP:
```php
$imgBase64 = base64_encode(file_get_contents("produto.jpg"));
```

---

## Nomes alternativos dos campos

Para compatibilidade com diferentes ERPs e planilhas, os seguintes nomes de campo são aceitos como **aliases**:

### Código do produto (qualquer um é aceito):

| Alias | Exemplo |
|-------|---------|
| `codigoproduto` | `{ "codigoproduto": "SKU-001" }` |
| `codigo_produto` | `{ "codigo_produto": "SKU-001" }` |
| `codigo` | `{ "codigo": "SKU-001" }` |
| `code` | `{ "code": "SKU-001" }` |
| `sku` | `{ "sku": "SKU-001" }` |

### Imagem Base64 (qualquer um é aceito):

| Alias | Exemplo |
|-------|---------|
| `imagem_base64` | `{ "imagem_base64": "/9j/4AAQ..." }` |
| `imagem` | `{ "imagem": "/9j/4AAQ..." }` |
| `image_base64` | `{ "image_base64": "/9j/4AAQ..." }` |
| `image` | `{ "image": "/9j/4AAQ..." }` |
| `base64` | `{ "base64": "/9j/4AAQ..." }` |

> **Exemplo com aliases misturados** (funciona):
> ```json
> {
>   "images": [
>     { "sku": "SKU-001", "imagem": "/9j/4AAQ..." },
>     { "code": "SKU-002", "image_base64": "iVBOR..." }
>   ]
> }
> ```

---

## Respostas

### Sucesso total (200)

Todas as imagens foram processadas com sucesso.

```json
{
  "success": true,
  "updated": 2,
  "skipped": 0,
  "errors": []
}
```

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `success` | boolean | `true` quando todas as imagens foram processadas |
| `updated` | number | Quantidade de imagens atualizadas com sucesso |
| `skipped` | number | Quantidade de imagens ignoradas (produto não encontrado) |
| `errors` | array | Lista vazia quando não há erros |

### Sucesso parcial (207)

Algumas imagens foram processadas, outras falharam.

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

| Campo em `errors[]` | Tipo | Descrição |
|---------------------|------|-----------|
| `codigoproduto` | string | Código do produto que falhou |
| `error` | string | Descrição do erro |

### Erro de validação (400)

Payload inválido ou campos obrigatórios ausentes.

```json
{
  "error": "Campo 'images' é obrigatório e deve ser um array",
  "code": "VALIDATION_ERROR"
}
```

**Possíveis erros de validação:**

| Mensagem | Causa |
|----------|-------|
| `"Campo 'images' é obrigatório e deve ser um array"` | Payload sem campo `images` ou campo não é array |
| `"Array 'images' está vazio"` | Array `images` enviado vazio |
| `"Código do produto é obrigatório no item X"` | Item sem nenhum alias de código |
| `"Imagem Base64 é obrigatória no item X"` | Item sem nenhum alias de imagem |
| `"Dados Base64 inválidos ou corrompidos no item X"` | Base64 malformado |

### Token inválido (401)

```json
{
  "error": "Token de autenticação inválido",
  "code": "UNAUTHORIZED"
}
```

---

## Fluxo de Processamento

### Diagrama detalhado

```
┌───────────────┐        ┌──────────────────────────────────────────┐
│   ERP/Sistema │        │              Catálogo (API)               │
│               │        │                                           │
│  1. Lê imagem │        │                                           │
│     do disco  │        │                                           │
│               │        │                                           │
│  2. Converte  │        │                                           │
│     para      │        │                                           │
│     Base64    │        │                                           │
│               │        │                                           │
│  3. Envia     │───────▶│  4. Valida token de autenticação          │
│     POST com  │        │     ↓                                     │
│     código +  │        │  5. Valida payload (campos obrigatórios)  │
│     base64    │        │     ↓                                     │
│               │        │  6. Para cada imagem no array:            │
│               │        │     a. Busca produto pelo código           │
│               │        │     b. Se não encontrado → adiciona erro   │
│               │        │     c. Se encontrado:                      │
│               │        │        - Remove prefixo data URI           │
│               │        │        - Detecta formato (JPEG/PNG/etc)    │
│               │        │        - Decodifica Base64 → binário       │
│               │        │        - Gera nome único (UUID.ext)        │
│               │        │        - Upload para Storage               │
│               │        │        - Obtém URL pública                 │
│               │        │        - Atualiza image_url do produto     │
│               │        │     ↓                                     │
│               │◀───────│  7. Retorna resultado consolidado          │
│  8. Recebe    │        │                                           │
│     resposta  │        │  9. Evento Realtime notifica frontend      │
│               │        │     (produto atualizado com nova imagem)   │
└───────────────┘        └──────────────────────────────────────────┘
```

### Ciclo de vida da imagem

```
Imagem no ERP → Base64 → POST API → Decodifica → Storage → URL pública → Produto atualizado → Frontend exibe
```

---

## Limites e Recomendações

### Limites técnicos

| Item | Valor | Observação |
|------|-------|------------|
| Tamanho máximo por imagem | **5 MB** (Base64 encoded ≈ 6.7MB) | Imagens maiores são rejeitadas |
| Imagens por requisição | Até **50** | Para evitar timeout de 30s |
| Tamanho máximo do payload | **50 MB** | Limite do servidor |
| Formatos aceitos | JPEG, PNG, GIF, WebP | Outros formatos são rejeitados |
| Resolução recomendada | **800×800** a **1200×1200** px | Maior que 1200px é redimensionável mas não otimizado |
| Frequência de envio | Sob demanda ou **1x ao dia** | Evitar chamadas a cada minuto |
| Timeout da requisição | **30 segundos** | Lotes grandes podem exceder |

### Boas práticas

| Prática | Motivo |
|---------|--------|
| **Sincronize produtos antes das imagens** | O produto deve existir para receber imagem |
| **Envie em lotes de 20-50 imagens** | Evita timeout e garante performance |
| **Intervalo de 2s entre lotes** | Respeita rate limit e evita sobrecarga |
| **Comprima JPEGs para 80-85% de qualidade** | Reduz tamanho sem perda visual significativa |
| **Redimensione para ≤ 1200px** | Melhora tempo de carregamento no frontend |
| **Use formato JPEG para fotos** | Melhor compressão para fotografias |
| **Use formato PNG para logos/ícones** | Preserva transparência e detalhes nítidos |
| **Verifique o código antes de enviar** | Evita erros "produto não encontrado" |

### Cálculo de tamanho

```
Tamanho Base64 ≈ Tamanho original × 1.37

Exemplos:
- Imagem de 500 KB → Base64 de ~685 KB
- Imagem de 2 MB → Base64 de ~2.74 MB
- Imagem de 5 MB → Base64 de ~6.85 MB (LIMITE)
```

---

## Exemplos Completos

### Exemplo cURL

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

### Exemplo Python — Lote de imagens

```python
import base64
import requests
import os
import time

TOKEN = "SEU_TOKEN_AQUI"
URL = "https://rglmtxjqbvfqiqixlidx.supabase.co/functions/v1/erp-sync/images"
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

def import_images(image_list):
    """
    image_list: lista de dicts com 'code' e 'file_path'
    Exemplo: [{"code": "SKU-001", "file_path": "/fotos/sku001.jpg"}]
    """
    batch_size = 50
    total_updated = 0
    total_errors = []
    
    for i in range(0, len(image_list), batch_size):
        batch = image_list[i:i + batch_size]
        images = []
        
        for item in batch:
            try:
                with open(item["file_path"], "rb") as f:
                    img_base64 = base64.b64encode(f.read()).decode("utf-8")
                
                # Verificar tamanho (5MB = 5 * 1024 * 1024 bytes)
                if len(img_base64) > 6_850_000:  # ~5MB encoded
                    print(f"⚠️ {item['code']}: imagem muito grande, pulando")
                    continue
                
                images.append({
                    "codigoproduto": item["code"],
                    "imagem_base64": img_base64
                })
            except FileNotFoundError:
                print(f"❌ {item['code']}: arquivo não encontrado: {item['file_path']}")
                continue
        
        if not images:
            continue
        
        # Enviar lote
        response = requests.post(URL, headers=HEADERS, json={"images": images}, timeout=30)
        result = response.json()
        
        updated = result.get("updated", 0)
        errors = result.get("errors", [])
        total_updated += updated
        total_errors.extend(errors)
        
        print(f"Lote {i // batch_size + 1}: "
              f"✅ {updated} atualizadas, "
              f"❌ {len(errors)} erros")
        
        for err in errors:
            print(f"  → {err.get('codigoproduto')}: {err.get('error')}")
        
        # Intervalo entre lotes
        if i + batch_size < len(image_list):
            time.sleep(2)
    
    print(f"\n📊 Resultado final: {total_updated} atualizadas, {len(total_errors)} erros")
    return {"updated": total_updated, "errors": total_errors}

# Uso
if __name__ == "__main__":
    images = [
        {"code": "SKU-001", "file_path": "/fotos/produto1.jpg"},
        {"code": "SKU-002", "file_path": "/fotos/produto2.jpg"},
        {"code": "SKU-003", "file_path": "/fotos/produto3.png"},
    ]
    import_images(images)
```

### Exemplo Node.js — Lote de imagens

```javascript
const fs = require("fs");
const path = require("path");

const TOKEN = "SEU_TOKEN_AQUI";
const URL = "https://rglmtxjqbvfqiqixlidx.supabase.co/functions/v1/erp-sync/images";

async function importImages(imageList) {
  const batchSize = 50;
  let totalUpdated = 0;
  const allErrors = [];

  for (let i = 0; i < imageList.length; i += batchSize) {
    const batch = imageList.slice(i, i + batchSize);
    const images = [];

    for (const item of batch) {
      try {
        const buffer = fs.readFileSync(item.filePath);
        const base64 = buffer.toString("base64");

        // Verificar tamanho (~5MB encoded)
        if (base64.length > 6_850_000) {
          console.log(`⚠️ ${item.code}: imagem muito grande, pulando`);
          continue;
        }

        images.push({
          codigoproduto: item.code,
          imagem_base64: base64
        });
      } catch (err) {
        console.log(`❌ ${item.code}: ${err.message}`);
      }
    }

    if (images.length === 0) continue;

    const response = await fetch(URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ images })
    });

    const result = await response.json();
    totalUpdated += result.updated || 0;
    allErrors.push(...(result.errors || []));

    console.log(`Lote ${Math.floor(i / batchSize) + 1}: ` +
      `✅ ${result.updated} atualizadas, ` +
      `❌ ${(result.errors || []).length} erros`);

    // Intervalo entre lotes
    if (i + batchSize < imageList.length) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log(`\n📊 Total: ${totalUpdated} atualizadas, ${allErrors.length} erros`);
  return { updated: totalUpdated, errors: allErrors };
}

// Uso
(async () => {
  await importImages([
    { code: "SKU-001", filePath: "./fotos/produto1.jpg" },
    { code: "SKU-002", filePath: "./fotos/produto2.jpg" },
  ]);
})();
```

### Exemplo C# (.NET)

```csharp
using System;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Text.Json;

class ImageImporter
{
    private static readonly string TOKEN = "SEU_TOKEN_AQUI";
    private static readonly string URL = 
        "https://rglmtxjqbvfqiqixlidx.supabase.co/functions/v1/erp-sync/images";

    static async Task Main()
    {
        var client = new HttpClient();
        client.DefaultRequestHeaders.Add("Authorization", $"Bearer {TOKEN}");

        var images = new[]
        {
            new { codigoproduto = "SKU-001", filePath = @"C:\fotos\produto1.jpg" },
            new { codigoproduto = "SKU-002", filePath = @"C:\fotos\produto2.jpg" }
        };

        var payload = new
        {
            images = images.Select(img => new
            {
                codigoproduto = img.codigoproduto,
                imagem_base64 = Convert.ToBase64String(File.ReadAllBytes(img.filePath))
            }).ToArray()
        };

        var json = JsonSerializer.Serialize(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await client.PostAsync(URL, content);
        var result = await response.Content.ReadAsStringAsync();

        Console.WriteLine(result);
    }
}
```

### Exemplo PHP

```php
<?php

$TOKEN = "SEU_TOKEN_AQUI";
$URL = "https://rglmtxjqbvfqiqixlidx.supabase.co/functions/v1/erp-sync/images";

$images = [
    [
        "codigoproduto" => "SKU-001",
        "imagem_base64" => base64_encode(file_get_contents("/fotos/produto1.jpg"))
    ],
    [
        "codigoproduto" => "SKU-002",
        "imagem_base64" => base64_encode(file_get_contents("/fotos/produto2.jpg"))
    ]
];

$payload = json_encode(["images" => $images]);

$ch = curl_init($URL);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer $TOKEN",
    "Content-Type: application/json"
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "Status: $httpCode\n";
echo "Resposta: $response\n";
?>
```

---

## Importação via Arquivo (Alternativa)

Além da API, o painel administrativo também aceita importação de imagens via **arquivo Excel (.xlsx) ou CSV** com as mesmas colunas:

### Formato da planilha

| codigoproduto | imagem_base64 |
|---------------|---------------|
| SKU-001 | /9j/4AAQSkZJRg... (base64 completo) |
| SKU-002 | iVBORw0KGgoAAAA... (base64 completo) |

### Como acessar

1. Acesse o painel admin → aba **Importar**
2. Selecione a aba **Importar Imagens**
3. Arraste o arquivo Excel/CSV ou clique para selecionar
4. Acompanhe o progresso em tempo real

### Características do importador via arquivo

| Recurso | Detalhes |
|---------|----------|
| Formatos aceitos | `.xlsx` (Excel), `.csv` |
| Processamento | Em chunks de 4MB para economia de memória |
| Feedback | Barra de progresso em tempo real |
| Tamanho máximo do arquivo | Sem limite rígido (testado com ~1GB) |
| Detecção automática | Delimitadores (`,` `;` `\t` `|`), codificação (UTF-8, UTF-16LE) |
| Campos entre aspas | Tratados corretamente, inclusive com quebras de linha |

---

## Troubleshooting

### Problemas comuns

| Problema | Causa provável | Solução |
|----------|---------------|---------|
| `"Produto não encontrado"` | Código do produto não existe no catálogo | Sincronizar produtos antes das imagens |
| `"Token inválido"` | Token errado ou expirado | Verificar token no painel admin |
| Timeout na requisição | Lote muito grande (> 50 imagens) | Reduzir tamanho do lote |
| Imagem não aparece no catálogo | Cache do navegador | Forçar refresh (Ctrl+Shift+R) |
| `"Base64 inválido"` | String Base64 corrompida ou truncada | Verificar codificação e integridade |
| Imagem distorcida | Formato não suportado enviado como JPEG | Usar prefixo data URI para formato correto |
| Erro 413 (Payload Too Large) | Payload total excede 50MB | Dividir em lotes menores |

### Verificação de integridade do Base64

```bash
# Verificar se o Base64 é válido (Linux/Mac)
echo "SEU_BASE64_AQUI" | base64 --decode > /dev/null 2>&1 && echo "✅ Válido" || echo "❌ Inválido"

# Verificar tamanho do Base64 encoded
echo -n "SEU_BASE64_AQUI" | wc -c
# Se > 6850000 (~5MB encoded), a imagem será rejeitada
```
