// ================================
// Stato e riferimenti pagina
// ================================

const elements = {
    marketValue: document.getElementById("marketValue"),
    gainPercent: document.getElementById("gainPercent"),
    gainEuro: document.getElementById("gainEuro"),
    tax: document.getElementById("tax"),
    sgr: document.getElementById("sgr"),
    operationValue: document.getElementById("operationValue"),
    operationLabel: document.getElementById("operationLabel"),
    gainPercentBox: document.getElementById("gainPercentBox"),
    gainEuroBox: document.getElementById("gainEuroBox"),
    resultTitle: document.getElementById("resultTitle"),
    resultValue: document.getElementById("resultValue"),
    resultMessage: document.getElementById("resultMessage"),
    taxValue: document.getElementById("taxValue"),
    commissionValue: document.getElementById("commissionValue"),
    maxNetValue: document.getElementById("maxNetValue")
};

function init() {
    populateSgrOptions();
    bindEvents();
    updatePage();
}

function populateSgrOptions() {
    Object.entries(Calculator.commissioni).forEach(([name, commission]) => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name + " - " + formatEuro(commission);
        elements.sgr.appendChild(option);
    });
}

function bindEvents() {
    document.querySelectorAll("input, select").forEach((input) => {
        input.addEventListener("input", updatePage);
        input.addEventListener("change", updatePage);
    });
}

function updatePage() {
    updateVisibleInputs();

    const values = readValues();
    const validationError = validate(values);

    if (validationError) {
        renderError(validationError, values);
        return;
    }

    const result = calculate(values);
    renderResult(result, values);
}

function updateVisibleInputs() {
    const gainMode = getSelectedValue("gainMode");
    const mode = getSelectedValue("mode");

    elements.gainPercentBox.hidden = gainMode !== "percent";
    elements.gainEuroBox.hidden = gainMode !== "euro";

    if (mode === "lordo") {
        elements.operationLabel.textContent = "Importo netto desiderato (EUR)";
        elements.resultTitle.textContent = "Lordo da disinvestire";
    } else {
        elements.operationLabel.textContent = "Importo lordo da disinvestire (EUR)";
        elements.resultTitle.textContent = "Netto ottenibile";
    }
}

function readValues() {
    const valoreMercato = readNumber(elements.marketValue);
    const gainMode = getSelectedValue("gainMode");
    const plusvalenza = readNumber(elements.gainEuro);
    const gainPercent = gainMode === "percent"
        ? readNumber(elements.gainPercent)
        : Calculator.gainPercentDaPlusvalenza(valoreMercato, plusvalenza);

    return {
        mode: getSelectedValue("mode"),
        gainMode,
        valoreMercato,
        plusvalenza,
        gainPercent,
        aliquota: readNumber(elements.tax),
        sgr: elements.sgr.value,
        commissione: Calculator.commissioni[elements.sgr.value] ?? 0,
        operationValue: readNumber(elements.operationValue)
    };
}

function validate(values) {
    if (!isPositive(values.valoreMercato)) {
        return "Inserisci un valore di mercato maggiore di zero.";
    }

    if (!Number.isFinite(values.gainPercent)) {
        return "Inserisci una plusvalenza compatibile con il valore di mercato.";
    }

    if (values.gainPercent <= -100) {
        return "Il guadagno deve essere superiore a -100%.";
    }

    if (!Number.isFinite(values.aliquota) || values.aliquota < 0 || values.aliquota > 100) {
        return "Inserisci un'aliquota compresa tra 0% e 100%.";
    }

    if (!Number.isFinite(values.operationValue) || values.operationValue < 0) {
        return "Inserisci un importo valido per l'operazione.";
    }

    return "";
}

function calculate(values) {
    if (values.mode === "lordo") {
        return Calculator.lordoDaNetto({
            valoreMercato: values.valoreMercato,
            gainPercent: values.gainPercent,
            aliquota: values.aliquota,
            commissione: values.commissione,
            netto: values.operationValue
        });
    }

    return Calculator.nettoDaLordo({
        valoreMercato: values.valoreMercato,
        gainPercent: values.gainPercent,
        aliquota: values.aliquota,
        commissione: values.commissione,
        lordo: values.operationValue
    });
}

function renderResult(result, values) {
    resetMessage();

    elements.commissionValue.textContent = formatEuro(values.commissione);

    if (!result.success) {
        renderError(result.message, values);

        if (Number.isFinite(result.nettoMassimo)) {
            elements.maxNetValue.textContent = formatEuro(result.nettoMassimo);
        }

        return;
    }

    if (values.mode === "lordo") {
        elements.resultValue.textContent = formatEuro(result.lordo);
    } else {
        elements.resultValue.textContent = formatEuro(result.netto);
    }

    elements.taxValue.textContent = formatEuro(result.imposta);
    elements.maxNetValue.textContent = formatEuro(result.nettoMassimo);
}

function renderError(message, values = {}) {
    elements.resultValue.textContent = "-";
    elements.resultMessage.textContent = message;
    elements.resultMessage.className = "error";
    elements.taxValue.textContent = "-";
    elements.commissionValue.textContent = Number.isFinite(values.commissione) ? formatEuro(values.commissione) : "-";
    elements.maxNetValue.textContent = "-";
}

function resetMessage() {
    elements.resultMessage.textContent = "";
    elements.resultMessage.className = "";
}

function readNumber(input) {
    return Number.parseFloat(input.value.replace(",", "."));
}

function isPositive(value) {
    return Number.isFinite(value) && value > 0;
}

function getSelectedValue(name) {
    return document.querySelector('input[name="' + name + '"]:checked').value;
}

init();
