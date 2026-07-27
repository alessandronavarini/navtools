// =======================================================
// NavTools - Interessi Conto Deposito / Certificato di Deposito
// Logica di interazione e rendering dell'interfaccia utente
// =======================================================

// Riferimenti agli elementi della pagina
const elements = {
    // Inputs
    importoInvestito: document.getElementById("importoInvestito"),
    tassoAnnuo: document.getElementById("tassoAnnuo"),
    durataMesi: document.getElementById("durataMesi"),

    // Outputs
    couponTableBody: document.getElementById("couponTableBody"),
    resultValue: document.getElementById("resultValue"),
    resultMessage: document.getElementById("resultMessage"),
    totaleLordoValue: document.getElementById("totaleLordoValue"),
    ritenutaFiscaleValue: document.getElementById("ritenutaFiscaleValue"),
    bolloMassimoValue: document.getElementById("bolloMassimoValue")
};

function init() {
    bindEvents();
    updatePage();
}

function bindEvents() {
    // Registra gestori eventi per gli input
    elements.importoInvestito.addEventListener("input", updatePage);
    elements.tassoAnnuo.addEventListener("input", updatePage);
    elements.durataMesi.addEventListener("change", updatePage);
}

function updatePage() {
    const inputs = readValues();
    const validationError = validate(inputs);

    if (validationError) {
        renderError(validationError);
        return;
    }

    // Esegui calcoli
    const results = ContoDepositoCalculator.calcola(inputs);
    renderResults(results);
}

function readValues() {
    return {
        importoInvestito: readNumber(elements.importoInvestito),
        tassoAnnuo: readNumber(elements.tassoAnnuo),
        durataMesi: parseInt(elements.durataMesi.value, 10)
    };
}

function validate(inputs) {
    if (!Number.isFinite(inputs.importoInvestito) || inputs.importoInvestito <= 0) {
        return "Inserisci un importo investito valido maggiore di zero.";
    }
    if (!Number.isFinite(inputs.tassoAnnuo) || inputs.tassoAnnuo < 0) {
        return "Inserisci un tasso annuo valido maggiore o uguale a zero.";
    }
    if (!Number.isFinite(inputs.durataMesi) || inputs.durataMesi <= 0) {
        return "Seleziona una durata valida dell'investimento.";
    }
    return "";
}

function renderResults(results) {
    // Cancella messaggi di errore
    if (elements.resultMessage) {
        elements.resultMessage.textContent = "";
        elements.resultMessage.className = "";
    }

    // 1. Rendering della tabella delle frequenze cedolari
    elements.couponTableBody.innerHTML = "";
    results.righeTabella.forEach(riga => {
        const tr = document.createElement("tr");
        
        if (!riga.applicabile) {
            tr.className = "non-applicabile";
            tr.innerHTML = `
                <td>${riga.frequenza}</td>
                <td>–</td>
                <td>–</td>
                <td>–</td>
                <td>–</td>
            `;
        } else {
            tr.innerHTML = `
                <td>${riga.frequenza}</td>
                <td>${formatPercent(riga.tassoLordo)}</td>
                <td>${formatEuro(riga.cedolaLorda)}</td>
                <td>${formatPercent(riga.tassoNetto)}</td>
                <td>${formatEuro(riga.cedolaNetta)}</td>
            `;
        }
        elements.couponTableBody.appendChild(tr);
    });

    // 2. Rendering dei totali
    elements.resultValue.textContent = formatEuro(results.totaleNettoInteressi);
    elements.totaleLordoValue.textContent = formatEuro(results.totaleLordoInteressi);
    
    const ritenuta = results.totaleLordoInteressi - results.totaleNettoInteressi;
    elements.ritenutaFiscaleValue.textContent = "– " + formatEuro(ritenuta);

    // 3. Rendering dell'imposta di bollo massima
    elements.bolloMassimoValue.textContent = formatEuro(results.impostaBolloMassimaAnnuale);
}

function renderError(message) {
    if (elements.resultMessage) {
        elements.resultMessage.textContent = message;
        elements.resultMessage.className = "error";
    }

    const placeholder = "–";
    elements.resultValue.textContent = placeholder;
    elements.totaleLordoValue.textContent = placeholder;
    elements.ritenutaFiscaleValue.textContent = placeholder;
    elements.bolloMassimoValue.textContent = placeholder;

    // Svuota tabella frequenze con trattini
    elements.couponTableBody.innerHTML = `
        <tr class="non-applicabile">
            <td>Trimestrale</td>
            <td>–</td>
            <td>–</td>
            <td>–</td>
            <td>–</td>
        </tr>
        <tr class="non-applicabile">
            <td>Semestrale</td>
            <td>–</td>
            <td>–</td>
            <td>–</td>
            <td>–</td>
        </tr>
        <tr class="non-applicabile">
            <td>Annuale</td>
            <td>–</td>
            <td>–</td>
            <td>–</td>
            <td>–</td>
        </tr>
        <tr class="non-applicabile">
            <td>Zero Coupon (a scadenza)</td>
            <td>–</td>
            <td>–</td>
            <td>–</td>
            <td>–</td>
        </tr>
    `;
}

// Lettura e conversione dell'input numerico
function readNumber(input) {
    if (!input || !input.value) return 0;
    return Number.parseFloat(input.value.replace(",", "."));
}

// Formattazione in Euro
function formatEuro(value) {
    if (!Number.isFinite(value)) return "–";
    return "€ " + value.toLocaleString("it-IT", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Formattazione in Percentuale
function formatPercent(value) {
    if (!Number.isFinite(value)) return "–";
    return value.toLocaleString("it-IT", {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3
    }) + "%";
}

// Avvio
init();
