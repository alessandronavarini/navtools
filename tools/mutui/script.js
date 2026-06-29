// ================================
// Stato e riferimenti pagina
// ================================

const elements = {
    monthlyIncome: document.getElementById("monthlyIncome"),
    debtRatio: document.getElementById("debtRatio"),
    existingPayments: document.getElementById("existingPayments"),
    annualRate: document.getElementById("annualRate"),
    durationYears: document.getElementById("durationYears"),
    resultValue: document.getElementById("resultValue"),
    resultMessage: document.getElementById("resultMessage"),
    availableIncomeValue: document.getElementById("availableIncomeValue"),
    availablePaymentValue: document.getElementById("availablePaymentValue"),
    installmentsValue: document.getElementById("installmentsValue"),
    paymentValue: document.getElementById("paymentValue")
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

    const result = MortgageCalculator.calcola(values);
    renderResult(result);
}

function readValues() {
    return {
        redditoMensile: readNumber(elements.monthlyIncome),
        percentualeDestinabile: readNumber(elements.debtRatio),
        rateInCorso: readNumber(elements.existingPayments),
        tassoAnnuo: readNumber(elements.annualRate),
        durataAnni: readNumber(elements.durationYears)
    };
}

function validate(values) {
    if (!Number.isFinite(values.redditoMensile) || values.redditoMensile <= 0) {
        return "Inserisci un reddito mensile maggiore di zero.";
    }

    if (!Number.isFinite(values.percentualeDestinabile) || values.percentualeDestinabile < 0 || values.percentualeDestinabile > 100) {
        return "Inserisci una percentuale di reddito tra 0% e 100%.";
    }

    if (!Number.isFinite(values.rateInCorso) || values.rateInCorso < 0) {
        return "Inserisci un importo valido per le rate già in corso.";
    }

    if (!Number.isFinite(values.tassoAnnuo) || values.tassoAnnuo < 0) {
        return "Inserisci un tasso di interesse valido.";
    }

    if (!Number.isFinite(values.durataAnni) || values.durataAnni <= 0) {
        return "Inserisci una durata maggiore di zero.";
    }

    return "";
}

function renderResult(result) {
    elements.resultMessage.textContent = "";
    elements.resultMessage.className = "";

    elements.resultValue.textContent = formatEuro(result.importoMassimo);
    elements.availableIncomeValue.textContent = formatEuro(result.quotaReddito);
    elements.availablePaymentValue.textContent = formatEuro(result.rataMassima);
    elements.installmentsValue.textContent = formatInstallments(result.numeroRate);
    elements.paymentValue.textContent = formatEuro(result.rataMassima);

    if (result.rataMassima <= 0) {
        elements.resultMessage.textContent = "Le rate già in corso assorbono tutta la quota destinabile.";
        elements.resultMessage.className = "error";
    }
}

function renderError(message) {
    elements.resultValue.textContent = "-";
    elements.resultMessage.textContent = message;
    elements.resultMessage.className = "error";
    elements.availableIncomeValue.textContent = "-";
    elements.availablePaymentValue.textContent = "-";
    elements.installmentsValue.textContent = "-";
    elements.paymentValue.textContent = "-";
}

function readNumber(input) {
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
