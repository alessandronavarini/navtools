// ================================
// Stato e riferimenti pagina
// ================================

const elements = {
    loanAmount: document.getElementById("loanAmount"),
    annualRate: document.getElementById("annualRate"),
    durationYears: document.getElementById("durationYears"),
    resultValue: document.getElementById("resultValue"),
    resultMessage: document.getElementById("resultMessage"),
    principalValue: document.getElementById("principalValue"),
    installmentsCountValue: document.getElementById("installmentsCountValue"),
    appliedRateValue: document.getElementById("appliedRateValue"),
    totalInterestValue: document.getElementById("totalInterestValue"),
    totalRepaidValue: document.getElementById("totalRepaidValue"),
    interestPercentageValue: document.getElementById("interestPercentageValue"),
    amortizationTableBody: document.getElementById("amortizationTableBody")
};

function init() {
    bindEvents();
    updatePage();
}

function bindEvents() {
    document.querySelectorAll("input").forEach((input) => {
        input.addEventListener("input", updatePage);
        input.addEventListener("change", updatePage);
    });
}

function updatePage() {
    const values = readValues();
    const validationError = validate(values);

    if (validationError) {
        renderError(validationError);
        return;
    }

    const result = RataCalculator.calcola(values);
    renderResult(result);
}

function readValues() {
    return {
        importo: readNumber(elements.loanAmount),
        tassoAnnuo: readNumber(elements.annualRate),
        durataAnni: readNumber(elements.durationYears)
    };
}

function validate(values) {
    if (!Number.isFinite(values.importo) || values.importo <= 0) {
        return "Inserisci un importo del finanziamento maggiore di zero.";
    }

    if (!Number.isFinite(values.tassoAnnuo) || values.tassoAnnuo < 0) {
        return "Inserisci un tasso di interesse valido.";
    }

    if (!Number.isFinite(values.durataAnni) || values.durataAnni <= 0 || values.durataAnni > 50) {
        return "Inserisci una durata in anni compresa tra 1 e 50.";
    }

    return "";
}

function renderResult(result) {
    elements.resultMessage.textContent = "";
    elements.resultMessage.className = "";

    elements.resultValue.textContent = formatEuro(result.rataMensile);
    elements.principalValue.textContent = formatEuro(result.importo);
    elements.installmentsCountValue.textContent = formatInstallments(result.numeroRate);
    elements.appliedRateValue.textContent = formatPercent(result.tassoAnnuo);
    elements.totalInterestValue.textContent = formatEuro(result.totaleInteressi);
    elements.totalRepaidValue.textContent = formatEuro(result.totaleRimborsato);
    elements.interestPercentageValue.textContent = formatPercent(result.incidenzaInteressi);

    renderAmortizationTable(result.pianoAmmortamento);
}

function renderError(message) {
    elements.resultValue.textContent = "-";
    elements.resultMessage.textContent = message;
    elements.resultMessage.className = "error";
    elements.principalValue.textContent = "-";
    elements.installmentsCountValue.textContent = "-";
    elements.appliedRateValue.textContent = "-";
    elements.totalInterestValue.textContent = "-";
    elements.totalRepaidValue.textContent = "-";
    elements.interestPercentageValue.textContent = "-";
    if (elements.amortizationTableBody) {
        elements.amortizationTableBody.innerHTML = "";
    }
}

function renderAmortizationTable(piano) {
    if (!elements.amortizationTableBody) return;

    let html = "";
    piano.forEach((row) => {
        html += `
            <tr>
                <td>${row.mese}</td>
                <td>${formatEuro(row.rata)}</td>
                <td>${formatEuro(row.quotaCapitale)}</td>
                <td>${formatEuro(row.quotaInteressi)}</td>
                <td>${formatEuro(row.debitoResiduo)}</td>
            </tr>
        `;
    });
    elements.amortizationTableBody.innerHTML = html;
}

function readNumber(input) {
    if (!input || !input.value) return 0;
    return Number.parseFloat(input.value.replace(",", "."));
}

function formatInstallments(value) {
    if (!Number.isFinite(value)) {
        return "-";
    }

    return new Intl.NumberFormat("it-IT", {
        maximumFractionDigits: 0
    }).format(value);
}

init();
