# Tutorial: Importação Manual de Cadastros e Imagens

Este guia mostra como importar produtos (cadastros) e fotos manualmente pelo painel `/admin`, e explica como o sistema evita duplicar produtos quando você reimporta a mesma planilha.

---

## 1. Acessar o painel

1. Abra `/admin` no navegador.
2. Faça login com o usuário administrador.
3. Vá até a aba **Produtos** → blocos **Importar Produtos por Excel** e **Importar Imagens**.

---

## 2. Importar cadastros (planilha Excel/CSV)

### 2.1 Baixar o modelo
No bloco "Importar Produtos por Excel" clique em **Baixar Modelo**. Ele gera `modelo-produtos.xlsx` já com os cabeçalhos corretos.

### 2.2 Colunas aceitas

| Coluna | Obrigatória | Descrição |
|---|---|---|
| `nome` | Sim | Nome do produto |
| `codigo` | Recomendado | Código/SKU único — é a chave usada para atualizar em vez de duplicar |
| `preco` | Sim | Preço de venda (ex: 99.90) |
| `preco_original` | Não | Preço "de" (riscado) |
| `descricao` | Não | Texto descritivo |
| `imagem_url` | Não | URL da foto (deixe vazio se for importar imagens depois) |
| `categoria` | Não | Nome da categoria (criada automaticamente se não existir) |
| `marca` | Não | Marca do produto |
| `referencia` | Não | Referência interna |
| `codigo_fabricante` | Não | Código do fabricante |
| `unidade_medida` | Não | UN, CX, KG... |
| `estoque` | Não | Saldo disponível |
| `quantidade_embalagem` | Não | Itens por caixa/embalagem |

Dicas:
- Use ponto como separador decimal (`99.90`). CSV com `;` é convertido automaticamente.
- A primeira linha **precisa** ser o cabeçalho.
- Os nomes das colunas aceitam variações (`nome`/`name`/`produto`, `codigo`/`code`/`sku` etc.).

### 2.3 Importar
1. Clique em **Importar Arquivo** e selecione o `.xlsx`, `.xls` ou `.csv`.
2. O progresso aparece abaixo do botão (lotes de 500 itens).
3. Ao final é exibido o total importado e quantas linhas foram ignoradas por erro de validação.

---

## 3. Atualizando sem duplicar (como funciona)

Ao reimportar a mesma planilha (ou uma versão corrigida), o sistema **atualiza** os produtos existentes em vez de criar cópias:

1. Antes de gravar, o sistema lê a lista atual de produtos.
2. Cada linha da planilha é comparada com o catálogo:
   - primeiro pelo **código** (`codigo`), ignorando maiúsculas/minúsculas e espaços;
   - se a linha não tiver código, pela **slug gerada a partir do nome**.
3. Se houver correspondência → o produto é **atualizado** (mesmo ID, mesmo histórico).
4. Se não houver → o produto é **criado**.
5. Linhas repetidas dentro do próprio arquivo são unificadas antes do envio (vence a última ocorrência), evitando erro de conflito e cópias.
6. Se a coluna `imagem_url` estiver vazia (ou com `/placeholder.svg`), a **foto atual é preservada** — reimportar a planilha nunca apaga imagens já enviadas.

Boas práticas:
- Sempre preencha `codigo`. É a forma mais segura de garantir atualização.
- Não mude o `codigo` de um produto existente; isso cria um novo cadastro.
- Se mudar o `nome` de um produto **sem código**, ele será tratado como novo produto.

---

## 4. Importar imagens

Há duas formas.

### 4.1 Imagem individual (produto a produto)
1. Aba **Produtos** → editar o produto.
2. No campo de imagem, envie o arquivo (JPG/PNG, recomendado 800x800 px, fundo branco).
3. Salve.

### 4.2 Importação em massa por planilha (Base64)
No bloco **Importar Imagens**:

1. Monte uma planilha com duas colunas:

| Coluna | Descrição |
|---|---|
| `codigo_produto` | Código do produto já cadastrado (aceita `codigo`, `code`, `sku`) |
| `imagem_base64` | Conteúdo da imagem em Base64 (com ou sem prefixo `data:image/...;base64,`) |

2. Envie o arquivo. Para cada linha o sistema:
   - procura o produto pelo código;
   - se não encontrar, registra o erro na linha e continua;
   - se encontrar, faz upload da imagem e **substitui** o `image_url` daquele produto.
3. Arquivos grandes são processados em blocos para não travar o navegador.

Observações:
- A imagem sempre sobrescreve a anterior do mesmo código — não gera produto novo nem duplicado.
- Formatos: JPG ou PNG, quadrada (1:1), até ~1 MB por imagem para melhor desempenho.
- Produtos sem foto ficam listados em **Produtos sem Foto**, útil para conferir o que faltou.

---

## 5. Ordem recomendada de trabalho

1. Importar a planilha de **cadastros** (com `codigo` preenchido).
2. Conferir categorias criadas automaticamente.
3. Importar a planilha de **imagens** por código.
4. Verificar em **Produtos sem Foto** o que ficou pendente.
5. Para atualizações futuras: repetir o passo 1 com a planilha atualizada — o catálogo é atualizado, não duplicado.

---

## 6. Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Produtos duplicados | Linhas sem `codigo` e com nome alterado | Preencher `codigo` e excluir a cópia |
| "Arquivo vazio ou formato inválido" | Cabeçalho ausente na primeira linha | Ajustar a planilha / usar o modelo |
| Preço zerado | Vírgula usada como decimal em CSV | Usar ponto (`99.90`) |
| Foto sumiu após reimportar | Não acontece mais: coluna vazia preserva a imagem | Verifique se enviou `imagem_url` inválida |
| "produto com código X não encontrado" | Importou imagens antes dos cadastros | Importar cadastros primeiro |
