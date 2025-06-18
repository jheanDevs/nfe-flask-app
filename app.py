from flask import Flask, request, render_template, redirect, session, url_for
from functools import wraps
from pymongo import MongoClient
import xml.etree.ElementTree as ET
from datetime import datetime
from dotenv import load_dotenv
import os

# Carrega variáveis do .env
load_dotenv()

app = Flask(__name__)
app.secret_key = 'sua_chave_secreta_segura'

# Conexão com MongoDB Atlas via .env
mongo_uri = os.getenv("MONGO_URI")
client = MongoClient(mongo_uri)
db = client["db-nfe-web"]
usuarios = db["usuarios"]

# DECORADOR PARA VERIFICAR SE O USUARIO ESTA LOGADO
def login_requerido(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "usuario" not in session:
            return redirect(url_for("login"))
        return f(*args, **kwargs)
    return decorated_function

@app.context_processor
def inject_user():
    return dict(usuario_logado=session.get("usuario"))

@app.route("/", methods=["GET"])
def landing():
    return render_template("landing.html", year=datetime.now().year)

@app.route("/login", methods=["GET", "POST"])
def login():
    erro = None
    if request.method == "POST":
        entrada = request.form["usuario"].strip()
        senha = request.form["senha"].strip()

        user = usuarios.find_one({
            "$or": [{"email": entrada}, {"usuario": entrada}],
            "senha": senha
        })

        if user:
            session["usuario"] = user["usuario"]
            return redirect(url_for("dashboard"))
        else:
            erro = "Usuário ou senha inválidos."

    return render_template("login.html", erro=erro)

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))

@app.route("/cadastro", methods=["GET", "POST"])
@login_requerido
def cadastro():
    if session["usuario"] != "CH2155":
        return redirect(url_for("dashboard"))

    erro = None
    if request.method == "POST":
        novo_email = request.form["email"].strip()
        novo_usuario = request.form["usuario"].strip()
        nova_senha = request.form["senha"].strip()
        nome = request.form.get("name", "").strip()

        if usuarios.find_one({"usuario": novo_usuario}):
            erro = "Usuário já existe!"
        else:
            usuarios.insert_one({
                "email": novo_email,
                "usuario": novo_usuario,
                "senha": nova_senha,
                "name": nome
            })
            return redirect(url_for("admin"))

    return render_template("cadastro.html", erro=erro)

@app.route("/admin")
@login_requerido
def admin():
    if session["usuario"] != "CH2155":
        return redirect(url_for("dashboard"))

    todos = list(usuarios.find({}, {"_id": 0}))
    return render_template("admin.html", usuarios=todos)

@app.route("/editar-usuario", methods=["POST"])
@login_requerido
def editar_usuario():
    if session["usuario"] != "CH2155":
        return redirect(url_for("dashboard"))

    usuario = request.form["usuario"]
    email = request.form["email"]
    senha = request.form["senha"]
    name = request.form.get("name", "")

    usuarios.update_one({"usuario": usuario}, {
        "$set": {"email": email, "senha": senha, "name": name}
    })
    return redirect(url_for("admin"))

@app.route("/excluir-usuario/<usuario>")
@login_requerido
def excluir_usuario(usuario):
    if session["usuario"] != "CH2155":
        return redirect(url_for("dashboard"))

    usuarios.delete_one({"usuario": usuario})
    return redirect(url_for("admin"))

@app.route("/dashboard", methods=["GET", "POST"])
@login_requerido
def dashboard():
    ns = {'nfe': 'http://www.portalfiscal.inf.br/nfe'}
    resultado = None

    # Busca o nome do usuário logado
    usuario_atual = usuarios.find_one({"usuario": session["usuario"]})
    nome_usuario = usuario_atual.get("name", session["usuario"])

    if request.method == "POST":
        file = request.files["xml_file"]
        tree = ET.parse(file)
        root = tree.getroot()

        emit = root.find('.//nfe:emit', ns)
        nome_fornecedor = emit.findtext('nfe:xNome', default='-', namespaces=ns)
        cnpj_fornecedor = emit.findtext('nfe:CNPJ', default='-', namespaces=ns)

        itens = root.findall('.//nfe:det', ns)
        total = root.find('.//nfe:ICMSTot', ns)
        vnf = float(total.findtext('nfe:vNF', default='0', namespaces=ns))

        total_geral = 0
        itens_resultado = []

        for index, item in enumerate(itens, start=1):
            prod = item.find('nfe:prod', ns)
            imposto = item.find('nfe:imposto', ns)
            icms_tag = next((child for child in imposto.find('nfe:ICMS', ns)
                             if child.tag.startswith(f"{{{ns['nfe']}}}ICMS")), None)

            nItem = str(index).zfill(2)
            descricao = prod.findtext('nfe:xProd', default='-', namespaces=ns)
            qCom = float(prod.findtext('nfe:qCom', default='1', namespaces=ns))
            vProd = float(prod.findtext('nfe:vProd', default='0', namespaces=ns))
            vDesc = float(prod.findtext('nfe:vDesc', default='0', namespaces=ns))
            vFrete = float(prod.findtext('nfe:vFrete', default='0', namespaces=ns))
            vICMSST = float(icms_tag.findtext('nfe:vICMSST', default='0', namespaces=ns)) if icms_tag is not None else 0

            valor_total_item = vProd - vDesc + vFrete + vICMSST
            valor_unitario = round(valor_total_item / qCom, 2)
            total_geral += valor_total_item

            itens_resultado.append({
                "nItem": nItem,
                "descricao": descricao,
                "qCom": qCom,
                "valor_unitario": f"{valor_unitario:.2f}",
                "valor_total": f"{valor_total_item:.2f}"
            })

        diferenca = abs(total_geral - vnf)
        resultado = {
            "fornecedor": {"nome": nome_fornecedor, "cnpj": cnpj_fornecedor},
            "vnf": f"{vnf:.2f}",
            "total_geral": f"{total_geral:.2f}",
            "diferenca": f"{diferenca:.2f}",
            "bate": diferenca <= 0.01,
            "itens": itens_resultado
        }

    return render_template("index.html", resultado=resultado, nome_usuario=nome_usuario)

if __name__ == "__main__":
    app.run(debug=True)
