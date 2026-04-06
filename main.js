let dadosCnpj = [];
let lote = [];
let editIndex = null;

const $ = (id) => document.getElementById(id);

const cnpjSelect = $("cnpj");
const localidadeSelect = $("localidade");
const osSelect = $("os");

const contrato = $("contrato");
const pedido = $("pedido");
const frs = $("frs");
const nl = $("nl");
const icj = $("icj");
const periodoInicio = $("periodoInicio");
const periodoFim = $("periodoFim");
const valorBruto = $("valorBruto");
const pdfOriginal = $("pdfOriginal");

fetch("data/cnpjs.json")
.then(res => {
    if (!res.ok) throw new Error("Sem JSON");
    return res.json();
})
.then(data => {
    dadosCnpj = data;
    carregarCnpjs();
})
.catch(() => {
    // fallback: habilita digitação manual
    habilitarCamposManuais();
});

function habilitarCamposManuais() {
    // troca selects por inputs
    trocarSelectPorInput("cnpj", "Digite o CNPJ");
    trocarSelectPorInput("localidade", "Digite a localidade");
    trocarSelectPorInput("os", "Digite a OS");
}

function trocarSelectPorInput(id, placeholder) {
    const el = document.getElementById(id);
    const input = document.createElement("input");
    input.type = "text";
    input.id = id;
    input.placeholder = placeholder;
    input.required = true;
    el.replaceWith(input);
}

function carregarCnpjs() {
    dadosCnpj.forEach(item => {
        const opt = document.createElement("option");
        opt.value = item.cnpj;
        opt.textContent = `${item.cnpj} - ${item.nome}`;
        cnpjSelect.appendChild(opt);
    });
}

cnpjSelect.addEventListener("change", () => {
    localidadeSelect.innerHTML = `<option value="">Selecione a localidade</option>`;
    osSelect.innerHTML = `<option value="">Selecione a OS</option>`;
    localidadeSelect.disabled = true;
    osSelect.disabled = true;

    const cnpj = cnpjSelect.value;
    if(!cnpj) return;

    const registro = dadosCnpj.find(d => d.cnpj === cnpj);
    registro.localidades.forEach(loc => {
        const opt = document.createElement("option");
        opt.value = loc.nome;
        opt.textContent = loc.nome;
        localidadeSelect.appendChild(opt);
    });

    localidadeSelect.disabled = false;
});

localidadeSelect.addEventListener("change", () => {
    osSelect.innerHTML = `<option value="">Selecione a OS</option>`;
    osSelect.disabled = true;

    const cnpj = cnpjSelect.value;
    const localidade = localidadeSelect.value;
    if (!localidade) return;

    const registro = dadosCnpj.find(d => d.cnpj === cnpj);
    const loc = registro.localidades.find(l => l.nome === localidade);

    loc.os.forEach(os => {
        const opt = document.createElement("option");
        opt.value = os;
        opt.textContent = os;
        osSelect.appendChild(opt);
    });

    osSelect.disabled = false;
});

// --------- Util -----------
function formatBRL(n) {
    const v = Number(n || 0);
    return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2});
}
function formatPeriodo(inicio, fim) {
    // input date vem yyyy-mm-dd
    const br = (d) => {
        if (!d) return "";
        const [y, m, day] = d.split("-");
        return `${day}/${m}/${y}`;
    };
    return `${br(inicio)} a ${br(fim)}`;
}
function validarFormulario() {
    if (!cnpjSelect.value) return "Selecione o CNPJ.";
    if (!localidadeSelect.value) return "Selecione a Localidade.";
    if (!osSelect.value) return "Selecione a OS.";
    if (!icj.value.trim()) return "Informe o ICJ.";
    if (!contrato.value.trim()) return "Informe o contrato.";
    if (!pedido.value.trim()) return "Informe o pedido.";
    if (!frs.value.trim()) return "Informe o FRS.";
    if (!nl.value.trim()) return "Informe o NL.";
    if (!periodoInicio.value) return "Informe o início do período.";
    if (!periodoFim.value) return "Informe o fim do período.";
    if (periodoInicio.value > periodoFim.value) return "Período inválido.";
    const vb = Number(valorBruto.value);
    if (!Number.isFinite(vb) || vb <= 0) return "Informe um valor bruto maior que zero.";
    return null;
}
function limparFormulario() {
    $("medicaoForm").reset();
    localidadeSelect.innerHTML = `<option value="">Selecione a localidade</option>`;
    osSelect.innerHTML = `<option value="">Selecione a OS</option`;
    localidadeSelect.disabled = true;
    osSelect.disabled = true;
    editIndex = null;
    $("adicionarLote").textContent = "Adicionar ao lote";
}

// ----------- Lote ------------
$("adicionarLote").addEventListener("click", () => {
    const erro = validarFormulario();
    if (erro) {
        alert(erro);
        return;
    }

    const item = {
        cnpj: cnpj.value,
        localidade: localidadeSelect.value,
        os: osSelect.value,
        contrato: contrato.value.trim(),
        pedido: pedido.value.trim(),
        frs: frs.value.trim(),
        nl: nl.value.trim(),
        icj: icj.value.trim(),
        periodoInicio: periodoInicio.value,
        periodoFim: periodoFim.value,
        valorBruto: Number(valorBruto.value),
        pdfNome: pdfOriginal.files?.[0]?.name || ""
    };

    if (editIndex !== null) {
        lote[editIndex] = item;
    } else {
        lote.push(item);
    }

    renderTabela();
    limparFormulario();
});

$("limparFormulario").addEventListener("click", () => {
    if (!confirm("Tem certeza que deseja limpar todo o lote?")) return;
    lote = [];
    renderTabela();
});

function renderTabela() {
    const tbody = $("tabelaLote").querySelector("tbody");
    tbody.innerHTML = "";

    let total = 0;

    lote.forEach((item, idx) => {
        total += item.valorBruto;

        const tr = document.createElement("tr");
        tr.innerHTML = `
        <td>${idx + 1}</td>
        <td>${item.cnpj}</td>
        <td>${item.localidade}</td>
        <td>${item.os}</td>
        <td>${item.contrato}</td>
        <td>${item.pedido}</td>
        <td>${item.frs}</td>
        <td>${item.nl}</td>
        <td>${item.icj}</td>
        <td>${formatPeriodo(item.periodoInicio, item.periodoFim)}</td>
        <td>${formatBRL(item.valorBruto)}</td>
        <td class="row-actions">
        <button type="button" data-action="edit" data-idx="${idx}">Editar</button>
        <button type="button" data-action="remove" data-idx="${idx}">Remover</button>
        </td>
        `;
        tbody.appendChild(tr);
    });
    $("totalItens").textContent = String(lote.length);
    $("totalValor").textContent = formatBRL(total);
}

$("tabelaLote").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const idx = Number(btn.dataset.idx);
    const action = btn.dataset.action;

    if (action === "remove") {
        lote.splice(idx, 1);
        renderTabela();
        return;
    }

    if (action === "edit") {
        const item = lote[idx];
        editIndex = idx;

        // preencher formulário
        cnpjSelect.value = item.cnpj;
        cnpjSelect.dispatchEvent(new Event("change"));

        // aguarda localidades carregarem
        setTimeout(() => {
            localidadeSelect.value = item.localidade;
            localidadeSelect.dispatchEvent(new Event("change"));

            setTimeout(() => {
              osSelect.value = item.os;  
            }, 0);
        }, 0);

        contrato.value = item.contrato;
        pedido.value = item.pedido;
        frs.value = item.frs;
        nl.value = item.nl;
        icj.value = item.icj;
        periodoInicio.value = item.periodoInicio;
        periodoFim.value = item.periodoFim;
        valorBruto.value = String(item.valorBruto);

        $("adicionarLote").textContent = "Salvar alteração no lote";
    }
});

// ------------- e-mail do lote --------------
$("copiarEmailLote").addEventListener("click", () => {
    if (lote.length === 0) {
        alert("O lote está vazio.");
        return;
    }

    const total = lote.reduce((acc, it) => acc + it.valorBruto, 0);
    const hoje = new Date();
    const dataBR = hoje.toLocaleDateString("pt-BR");

    // assunto do e-mail
    const assunto = `[PB LOEP] Faturamento`;

    // corpo do e-mail
    const linhas = lote.map((it, i) => {
        return [
            `${i + 1}. CNPJ: ${it.cnpj}`,
            `   Localidade: ${it.localidade} | OS: ${it.os}`,
            `   ICJ: ${it.icj} | Contrato: ${it.contrato} | Pedido: ${it.pedido} | FRS: ${it.frs} | NL: ${it.nl},`
            `   Período: ${formatPeriodo(it.periodoInicio, it.periodoFim)} | Valor bruto: R$ ${formatBRL(it.valorBruto)}`
        ].join("\n");
    }).join("\n\n");

    const corpo = `
    Fulano,
    bom dia!
    
    Favor, solicito emissão da nota fiscal para o cliente tal, conforme dados abaixo:
    
    ${linhas}
    
    Resumo do lote:
    -Quantidade de medições: ${lote.length}
    -Valor bruto total: R$ ${formatBRL(total)}
    
    Anexos: relatórios de medição (PDF) correspondentes a cada item do lote.
    `.trim();

        const textoFinal = `ASSUNTO:\n${assunto}\n\nCORPO:\N${corpo}\n`;

        navigator.clipboard.writeText(textoFinal);
        alert("Assunto e corpo do e-mail do lote foram copiados!");
});