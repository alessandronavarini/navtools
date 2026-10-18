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
    maxNetValue: document.getElementById("maxNetValue"),
    chartCard: document.getElementById("chartCard"),
    pieChart: document.getElementById("pieChart"),
    pieLegend: document.getElementById("pieLegend")
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

    if (values.gainPercent < 0) {
        return "Il guadagno deve essere superiore a 0%.";
    }

    if (!Number.isFinite(values.aliquota) || values.aliquota < 12.5 || values.aliquota > 26) {
        return "Inserisci un'aliquota compresa tra 12,5% e 26%.";
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

    if (result.lordo > 0 && result.netto > 0) {
        renderPieChart(result.netto, result.imposta, result.commissione, result.lordo);
    } else if (elements.chartCard) {
        elements.chartCard.hidden = true;
    }
}

function renderError(message, values = {}) {
    elements.resultValue.textContent = "-";
    elements.resultMessage.textContent = message;
    elements.resultMessage.className = "error";
    elements.taxValue.textContent = "-";
    elements.commissionValue.textContent = Number.isFinite(values.commissione) ? formatEuro(values.commissione) : "-";
    elements.maxNetValue.textContent = "-";
    if (elements.chartCard) {
        elements.chartCard.hidden = true;
    }
}

function renderPieChart(netto, imposta, commissione, lordo) {
    const svg = elements.pieChart;
    const legend = elements.pieLegend;
    if (!svg || !legend) return;

    svg.innerHTML = "";
    legend.innerHTML = "";

    const totale = netto + imposta + commissione;
    if (!Number.isFinite(totale) || totale <= 0) {
        if (elements.chartCard) elements.chartCard.hidden = true;
        return;
    }
    if (elements.chartCard) elements.chartCard.hidden = false;

    const items = [
        { key: "netto", label: "Netto ottenuto", value: Math.max(0, netto), color: "#237a4b" },
        { key: "imposta", label: "Tasse pagate", value: Math.max(0, imposta), color: "#c0392b" },
        { key: "commissione", label: "Commissioni", value: Math.max(0, commissione), color: "#0f4c81" }
    ];

    items.forEach(item => {
        item.percent = (item.value / totale) * 100;
    });

    const validItems = items.filter(item => item.value > 0);
    const cx = 120;
    const cy = 120;
    const r = 85;

    if (validItems.length === 1) {
        const item = validItems[0];
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", cx);
        circle.setAttribute("cy", cy);
        circle.setAttribute("r", r);
        circle.setAttribute("fill", item.color);
        circle.setAttribute("class", "pie-slice");

        const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
        title.textContent = `${item.label}: 100,0%`;
        circle.appendChild(title);
        svg.appendChild(circle);

        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", cx);
        text.setAttribute("y", cy);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("dominant-baseline", "central");
        text.setAttribute("class", "pie-slice-label");
        text.textContent = "100,0%";
        svg.appendChild(text);
    } else if (validItems.length > 1) {
        let currentAngle = 0;

        validItems.forEach(item => {
            const sliceAngle = (item.value / totale) * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + sliceAngle;
            currentAngle = endAngle;

            const startRad = (startAngle - 90) * Math.PI / 180;
            const endRad = (endAngle - 90) * Math.PI / 180;

            const x1 = cx + r * Math.cos(startRad);
            const y1 = cy + r * Math.sin(startRad);
            const x2 = cx + r * Math.cos(endRad);
            const y2 = cy + r * Math.sin(endRad);

            const largeArcFlag = sliceAngle > 180 ? 1 : 0;

            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            const d = `M ${cx} ${cy} L ${x1.toFixed(3)} ${y1.toFixed(3)} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2.toFixed(3)} ${y2.toFixed(3)} Z`;
            path.setAttribute("d", d);
            path.setAttribute("fill", item.color);
            path.setAttribute("class", "pie-slice");

            const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
            title.textContent = `${item.label}: ${formatChartPercent(item.percent)}`;
            path.appendChild(title);
            svg.appendChild(path);

            // Se la fetta è abbastanza ampia (>= 6%), mostriamo la percentuale direttamente sopra
            if (item.percent >= 6) {
                const midAngle = startAngle + sliceAngle / 2;
                const midRad = (midAngle - 90) * Math.PI / 180;
                const labelRadius = r * 0.65;
                const lx = cx + labelRadius * Math.cos(midRad);
                const ly = cy + labelRadius * Math.sin(midRad);

                const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
                text.setAttribute("x", lx.toFixed(3));
                text.setAttribute("y", ly.toFixed(3));
                text.setAttribute("text-anchor", "middle");
                text.setAttribute("dominant-baseline", "central");
                text.setAttribute("class", "pie-slice-label");
                text.textContent = formatChartPercent(item.percent);
                svg.appendChild(text);
            }
        });
    }

    // Popola la legenda con le voci e le relative percentuali
    items.forEach(item => {
        const legendItem = document.createElement("div");
        legendItem.className = "pie-legend-item";

        const left = document.createElement("div");
        left.className = "pie-legend-left";

        const colorDot = document.createElement("span");
        colorDot.className = "pie-legend-color";
        colorDot.style.backgroundColor = item.color;

        const labelSpan = document.createElement("span");
        labelSpan.textContent = item.label;

        left.appendChild(colorDot);
        left.appendChild(labelSpan);

        const percentSpan = document.createElement("span");
        percentSpan.className = "pie-legend-percent";
        percentSpan.textContent = formatChartPercent(item.percent);

        legendItem.appendChild(left);
        legendItem.appendChild(percentSpan);
        legend.appendChild(legendItem);
    });
}

function formatChartPercent(val) {
    if (!Number.isFinite(val) || val <= 0) return "0,0%";
    if (val < 0.1) {
        return val.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";
    }
    return val.toLocaleString("it-IT", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";
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
