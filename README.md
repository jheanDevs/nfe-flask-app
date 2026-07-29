# 📑 NF-e Web Parser (Static Client-Side & Netlify)

Aplicação web estática, didática e 100% gratuita para leitura, cálculo de valor unitário e conciliação de arquivos XML de Notas Fiscais Eletrônicas (NF-e).

> 💡 **Migração Concluída**: O sistema foi migrado de Python/Flask para **HTML5, CSS3 e JavaScript puro (DOMParser)**. Não há mais dependência de servidores backend, banco de dados ou autenticação. O processamento é realizado de forma instantânea e 100% privada diretamente no navegador do usuário.

---

## 🚀 Funcionalidades

- **Landing Page Interativa (`index.html`)**: Apresentação visual da plataforma com navegação direta para a calculadora.
- **Leitor e Calculadora (`app.html`)**:
  - **Upload via Drag & Drop**: Arraste e solte o arquivo XML ou selecione no seu dispositivo.
  - **Exemplo Didático 1-Clique**: Teste a ferramenta instantaneamente com um arquivo XML pré-carregado (`sample-nfe.xml`).
  - **Extração & Cálculo SEFAZ**:
    - Extração automática do Emitente (Razão Social e CNPJ), Destinatário e dados da NF-e.
    - Leitura dos itens (`<det>`) com cálculo do valor unitário real:
      $$\text{Valor Unitário} = \frac{\text{vProd} - \text{vDesc} + \text{vFrete} + \text{vICMSST}}{\text{qCom}}$$
    - Conciliação automática com o valor total da nota (`vNF`) e destaque de divergências.
- **Exportação & Relatórios**: Baixe a tabela de itens calculados em **CSV/Excel** ou salve em **PDF**.
- **Privacidade Garantida**: Nenhum arquivo XML é enviado para servidores externos.

---

## 💻 Como Executar Localmente

Como a aplicação é 100% estática, basta abrir o arquivo `index.html` em qualquer navegador:

1. Clone o repositório:
```bash
git clone https://github.com/jheanDevs/nfe-flask-app.git
cd nfe-flask-app
```
2. Dê um duplo clique no arquivo `index.html` ou abra com o seu navegador favorito.

---

## 🌐 Deploy Gratuito no Netlify

### Opção 1: Conectando com GitHub (Recomendado)
1. Suba as alterações para o seu repositório no GitHub.
2. Acesse [Netlify](https://www.netlify.com/) e faça login.
3. Clique em **"Add new site"** > **"Import an existing project"**.
4. Selecione o repositório `nfe-flask-app`.
5. Deixe o diretório de publicação como `.` e clique em **Deploy**.

### Opção 2: Netlify Drop (Sem Git)
1. Acesse [app.netlify.com/drop](https://app.netlify.com/drop).
2. Arraste toda a pasta do projeto para a tela do navegador.

---

## 📄 Licença
Este projeto é didático e está sob a licença MIT.
