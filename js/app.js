/**
 * NF-e Web Parser - Client Side Engine
 * Processa XMLs de Nota Fiscal Eletrônica diretamente no navegador
 */

document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('drop-zone');
  const fileUpload = document.getElementById('file-upload');
  const btnSample = document.getElementById('btn-sample');
  const resultContainer = document.getElementById('result-container');
  const btnClear = document.getElementById('btn-clear');
  const btnExport = document.getElementById('btn-export');
  const btnPrint = document.getElementById('btn-print');

  let currentParsedData = null;

  // Eventos de Drag and Drop
  dropZone.addEventListener('click', (e) => {
    if (e.target.closest('#btn-sample')) return;
    fileUpload.click();
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.name.toLowerCase().endsWith('.xml')) {
      readAndProcessXMLFile(file);
    } else {
      alert('Por favor, selecione um arquivo XML válido de NF-e.');
    }
  });

  fileUpload.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      readAndProcessXMLFile(e.target.files[0]);
    }
  });

  // Botão Carregar Exemplo
  btnSample.addEventListener('click', (e) => {
    e.stopPropagation();
    fetch('sample-nfe.xml')
      .then(res => {
        if (!res.ok) throw new Error('Não foi possível carregar o arquivo de exemplo.');
        return res.text();
      })
      .then(xmlContent => {
        processXMLString(xmlContent, 'sample-nfe.xml');
      })
      .catch(err => {
        alert('Erro ao carregar exemplo: ' + err.message);
      });
  });

  // Limpar resultados
  btnClear?.addEventListener('click', () => {
    resultContainer.style.display = 'none';
    fileUpload.value = '';
    currentParsedData = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Exportar CSV
  btnExport?.addEventListener('click', () => {
    if (!currentParsedData) return;
    exportToCSV(currentParsedData);
  });

  // Imprimir / Salvar PDF
  btnPrint?.addEventListener('click', () => {
    window.print();
  });

  /**
   * Lê o arquivo retornado pelo input do usuário
   */
  function readAndProcessXMLFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      processXMLString(e.target.result, file.name);
    };
    reader.onerror = () => {
      alert('Erro ao ler o arquivo selecionado.');
    };
    reader.readAsText(file);
  }

  /**
   * Interpreta o XML utilizando DOMParser nativo do browser
   */
  function processXMLString(xmlText, fileName) {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

      // Verifica erro de parse no XML
      const parserError = xmlDoc.getElementsByTagName('parsererror');
      if (parserError.length > 0) {
        alert('Formato de XML inválido. Verifique o arquivo.');
        return;
      }

      // Extrai Dados Principais
      const emitElem = getFirstElement(xmlDoc, 'emit');
      const destElem = getFirstElement(xmlDoc, 'dest');
      const ideElem = getFirstElement(xmlDoc, 'ide');
      const totalElem = getFirstElement(xmlDoc, 'ICMSTot') || getFirstElement(xmlDoc, 'total');

      const fornecedorNome = getTagText(emitElem, 'xNome', 'Fornecedor não identificado');
      const fornecedorCNPJ = getTagText(emitElem, 'CNPJ', getTagText(emitElem, 'CPF', '-'));

      const clienteNome = getTagText(destElem, 'xNome', 'Cliente não identificado');
      const clienteCNPJ = getTagText(destElem, 'CNPJ', getTagText(destElem, 'CPF', '-'));

      const nNF = getTagText(ideElem, 'nNF', '-');
      const serie = getTagText(ideElem, 'serie', '-');
      const dhEmi = getTagText(ideElem, 'dhEmi', getTagText(ideElem, 'dEmi', '-'));

      const vNF = parseFloat(getTagText(totalElem, 'vNF', '0'));

      // Processa Itens (<det>)
      const detElements = getElementsList(xmlDoc, 'det');
      if (detElements.length === 0) {
        alert('Nenhum item (<det>) encontrado nesta NF-e.');
        return;
      }

      let totalGeralCalculado = 0;
      const itensResultado = [];

      detElements.forEach((det, index) => {
        const prod = getFirstElement(det, 'prod');
        const imposto = getFirstElement(det, 'imposto');
        const icmsElem = getFirstElement(imposto, 'ICMS');

        const nItem = String(index + 1).padStart(2, '0');
        const descricao = getTagText(prod, 'xProd', 'Item sem descrição');
        const qCom = parseFloat(getTagText(prod, 'qCom', '1'));
        const vProd = parseFloat(getTagText(prod, 'vProd', '0'));
        const vDesc = parseFloat(getTagText(prod, 'vDesc', '0'));
        const vFrete = parseFloat(getTagText(prod, 'vFrete', '0'));
        const vICMSST = parseFloat(getTagText(icmsElem, 'vICMSST', '0'));

        const valorTotalItem = vProd - vDesc + vFrete + vICMSST;
        const valorUnitario = qCom > 0 ? (valorTotalItem / qCom) : 0;

        totalGeralCalculado += valorTotalItem;

        itensResultado.push({
          nItem,
          descricao,
          qCom,
          vProd,
          vDesc,
          vFrete,
          vICMSST,
          valorUnitario,
          valorTotalItem
        });
      });

      const diferenca = Math.abs(totalGeralCalculado - vNF);
      const bate = diferenca <= 0.01;

      currentParsedData = {
        fileName,
        fornecedor: { nome: fornecedorNome, cnpj: fornecedorCNPJ },
        cliente: { nome: clienteNome, cnpj: clienteCNPJ },
        nota: { nNF, serie, dhEmi },
        vnf: vNF,
        totalGeral: totalGeralCalculado,
        diferenca: diferenca,
        bate: bate,
        itens: itensResultado
      };

      renderResults(currentParsedData);

    } catch (err) {
      console.error(err);
      alert('Ocorreu um erro ao processar o arquivo XML: ' + err.message);
    }
  }

  /**
   * Renderiza os resultados na tela
   */
  function renderResults(data) {
    // Atualiza Fornecedor e Nota
    document.getElementById('res-fornecedor-nome').textContent = data.fornecedor.nome;
    document.getElementById('res-fornecedor-cnpj').textContent = formatCNPJ(data.fornecedor.cnpj);
    document.getElementById('res-nota-info').textContent = `Nº ${data.nota.nNF} (Série ${data.nota.serie})`;
    document.getElementById('res-emissao-info').textContent = formatDate(data.nota.dhEmi);

    // Totais Financeiros
    document.getElementById('res-vnf').textContent = formatCurrency(data.vnf);
    document.getElementById('res-total-geral').textContent = formatCurrency(data.totalGeral);

    // Badge de status
    const statusContainer = document.getElementById('res-status-badge');
    if (data.bate) {
      statusContainer.className = 'badge-status badge-match';
      statusContainer.innerHTML = `<i class="bi bi-check-circle-fill"></i> O total calculado bate perfeitamente com a NF-e!`;
    } else {
      statusContainer.className = 'badge-status badge-diff';
      statusContainer.innerHTML = `<i class="bi bi-exclamation-triangle-fill"></i> Divergência identificada: ${formatCurrency(data.diferenca)}`;
    }

    // Tabela de Itens
    const tbody = document.getElementById('res-table-body');
    tbody.innerHTML = '';

    data.itens.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="text-center font-monospace fw-bold">${item.nItem}</td>
        <td>
          <div class="fw-semibold">${escapeHTML(item.descricao)}</div>
          <small class="text-muted">Prod: ${formatCurrency(item.vProd)} | Frete: ${formatCurrency(item.vFrete)} | Desc: ${formatCurrency(item.vDesc)} | ST: ${formatCurrency(item.vICMSST)}</small>
        </td>
        <td class="text-center fw-semibold">${formatNumber(item.qCom)}</td>
        <td class="text-end font-monospace text-primary fw-bold">${formatCurrency(item.valorUnitario)}</td>
        <td class="text-end font-monospace fw-bold">${formatCurrency(item.valorTotalItem)}</td>
      `;
      tbody.appendChild(tr);
    });

    resultContainer.style.display = 'block';
    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // --- Funções Auxiliares de XML ---

  function getFirstElement(parent, tagName) {
    if (!parent) return null;
    const elements = getElementsList(parent, tagName);
    return elements.length > 0 ? elements[0] : null;
  }

  function getElementsList(parent, tagName) {
    if (!parent) return [];
    const results = [];
    const children = parent.getElementsByTagName('*');
    for (let i = 0; i < children.length; i++) {
      if (children[i].localName === tagName) {
        results.push(children[i]);
      }
    }
    return results;
  }

  function getTagText(parent, tagName, defaultValue = '-') {
    if (!parent) return defaultValue;
    const elem = getFirstElement(parent, tagName);
    if (elem) {
      const txt = elem.textContent.trim();
      return txt !== '' ? txt : defaultValue;
    }
    return defaultValue;
  }

  // --- Formatadores ---

  function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  }

  function formatNumber(value) {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4
    }).format(value || 0);
  }

  function formatCNPJ(cnpj) {
    const clean = cnpj.replace(/\D/g, '');
    if (clean.length === 14) {
      return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    }
    return cnpj;
  }

  function formatDate(isoStr) {
    if (!isoStr || isoStr === '-') return '-';
    try {
      const date = new Date(isoStr);
      if (isNaN(date.getTime())) return isoStr;
      return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoStr;
    }
  }

  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  // --- Exportar CSV ---

  function exportToCSV(data) {
    const headers = ['Item', 'Descricao', 'Quantidade', 'Valor_Produtos', 'Frete', 'Desconto', 'ICMS_ST', 'Valor_Unitario_Calculado', 'Valor_Total_Item'];
    const rows = data.itens.map(item => [
      item.nItem,
      `"${item.descricao.replace(/"/g, '""')}"`,
      item.qCom.toString().replace('.', ','),
      item.vProd.toFixed(2).replace('.', ','),
      item.vFrete.toFixed(2).replace('.', ','),
      item.vDesc.toFixed(2).replace('.', ','),
      item.vICMSST.toFixed(2).replace('.', ','),
      item.valorUnitario.toFixed(4).replace('.', ','),
      item.valorTotalItem.toFixed(2).replace('.', ',')
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nfe_${data.nota.nNF || 'export'}_calculada.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
});
