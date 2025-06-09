# Consulta de NF-e por XML
Aplicação web desenvolvida em Flask para análise e validação de arquivos XML de Notas Fiscais Eletrônicas (NF-e).

## Funcionalidades
- Upload de arquivos XML via drag-and-drop ou seleção manual
- Validação automática de arquivos XML
- Cálculo e comparação de valores totais
- Exibição detalhada dos itens da nota
- Interface responsiva e moderna
## Tecnologias Utilizadas
- Python 3.12
- Flask
- Bootstrap 5.3.2
- XML ElementTree
- Animate.css
## Requisitos
- Python 3.12 ou superior
- pip (gerenciador de pacotes Python)
## Instalação
1. Clone o repositório:
```
git clone https://github.com/jheanDevs/
nfe-flask-app.git
cd nfe-flask-app
```
2. Crie e ative um ambiente virtual:
```
python -m venv venv
venv\Scripts\activate
```
3. Instale as dependências:
```
pip install -r requirements.txt
```
## Executando a Aplicação
1. Ative o ambiente virtual (se ainda não estiver ativo):
```
venv\Scripts\activate
```
2. Inicie o servidor Flask:
```
python -m flask run
```
3. 3. Acesse a aplicação em seu navegador:
```
http://127.0.0.1:5000
```
## Uso
1. Acesse a aplicação através do navegador
2. Arraste um arquivo XML de NF-e para a área indicada ou clique para selecionar
3. O sistema processará automaticamente o arquivo e exibirá:
   - Valor total da nota
   - Soma dos itens
   - Comparação entre valores
   - Lista detalhada dos itens
## Contribuição
1. Faça um Fork do projeto
2. Crie uma branch para sua feature ( git checkout -b feature/AmazingFeature )
3. Commit suas mudanças ( git commit -m 'Add some AmazingFeature' )
4. Push para a branch ( git push origin feature/AmazingFeature )
5. Abra um Pull Request
## Licença
Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## Contato
Jhean Devs - GitHub

Link do Projeto: https://github.com/jheanDevs/nfe-flask-app
