# DireitoMobile — interface Cloudflare Pages

Este repositório continua sendo o **acervo legislativo**. A interface web está isolada em `site/`, e os arquivos originais `.md` não são alterados.

## Publicação

No Cloudflare Pages, selecione o repositório `socrateslever1/leis` com:

- **Branch de produção:** `main`
- **Diretório raiz:** `/` (raiz do repositório; deixe em branco no painel)
- **Comando de compilação:** `npm run build`
- **Diretório de saída:** `dist`
- **Versão Node.js:** 18 ou superior

O comando executa `scripts/build-direitomobile.mjs`, que copia a interface para `dist/index.html` e gera `dist/catalogo.json` com um **subconjunto** de legislação federal e do Amazonas. Não há dependências externas para instalar.

## Como funciona

O navegador recebe um índice de metadados pequeno. Quando o usuário abre uma lei, o leitor carrega o arquivo Markdown correspondente do repositório `socrateslever1/leis` sob demanda, sem copiar centenas de milhares de documentos para o deploy.

## Limitações atuais

- Busca por título, ementa, número e ano **somente nas normas indexadas**. A busca integral em artigos e em todo o acervo requer API e índice textual dedicado.
- A interface depende de conexão para ler documentos. PWA/offline e armazenamento em cache ainda não foram implementados.
- Markdown renderizado de maneira básica, com suporte a títulos, parágrafos, links e destaque; tabelas e elementos complexos exigem parser mais completo.
- O clone do repositório é volumoso e pode demorar vários minutos. Para produção de longo prazo, o ideal é hospedar o frontend em repositório leve e alimentar a busca por pipeline de indexação incremental.
- Textos do repositório devem ser conferidos com fontes oficiais antes de uso jurídico.

## Validação

Execute `npm run build` em um clone local. Confirme `dist/index.html` e `dist/catalogo.json`. No Cloudflare, verifique se a implantação publica `index.html` a partir de `dist`.
