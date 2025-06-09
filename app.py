from flask import Flask, request, render_template
import xml.etree.ElementTree as ET

app = Flask(__name__)
ns = {'nfe': 'http://www.portalfiscal.inf.br/nfe'}

@app.route("/", methods=["GET", "POST"])
def index():
    resultado = None
    if request.method == "POST":
        file = request.files["xml_file"]
        tree = ET.parse(file)
        root = tree.getroot()

        itens = root.findall('.//nfe:det', ns)
        total = root.find('.//nfe:ICMSTot', ns)
        vnf = float(total.findtext('nfe:vNF', default='0', namespaces=ns))

        total_geral = 0
        itens_resultado = []

        for index, item in enumerate(itens, start=1):
            prod = item.find('nfe:prod', ns)
            imposto = item.find('nfe:imposto', ns)
            icms_tag = next((child for child in imposto.find('nfe:ICMS', ns) if child.tag.startswith(f"{{{ns['nfe']}}}ICMS")), None)

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
            "vnf": f"{vnf:.2f}",
            "total_geral": f"{total_geral:.2f}",
            "diferenca": f"{diferenca:.2f}",
            "bate": diferenca <= 0.01,
            "itens": itens_resultado
        }

    return render_template("index.html", resultado=resultado)

if __name__ == "__main__":
    app.run(debug=True)
