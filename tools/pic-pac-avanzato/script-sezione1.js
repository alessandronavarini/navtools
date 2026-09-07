// =======================================================
// NavTools - Modulo 1: Confronto Deterministico PIC vs PAC
// Logica di interazione e rendering dell'interfaccia utente
// Versione 1.2.0
// =======================================================

const elements = {
    capitaleInvestire: document.getElementById("capitaleInvestire"),
    orizzonteTemporale: document.getElementById("orizzonteTemporale"),
    durataPAC: document.getElementById("durataPAC"),
    rendimentoAnnuale: document.getElementById("rendimentoAnnuale"),
    rataMensileCalculated: document.getElementById("rataMensileCalculated"),

    resultMessage: document.getElementById("resultMessage"),
    montantePicSummary: document.getElementById("montantePicSummary"),
    montantePacSummary: document.getElementById("montantePacSummary"),
    differenzaSummaryText: document.getElementById("differenzaSummaryText"),
    picPacChart: document.getElementById("picPacChart")
};

function init() {
    bindEvents();
    updatePage();
}

function bindEvents() {
    [elements.capitaleInvestire, elements.orizzonteTemporale, elements.durataPAC, elements.rendimentoAnnuale].forEach(input => {
        if (input) {
            input.addEventListener("input", updatePage);
            input.addEventListener("change", updatePage);
        }
    });
}

function updatePage() {
    const values = readValues();

    if (Number.isFinite(values.capitaleInvestire) && Number.isFinite(values.durataPAC) && values.durataPAC > 0) {
        const rata = values.capitaleInvestire / values.durataPAC;
        elements.rataMensileCalculated.textContent = formatEuro(rata) + " / mese";
    } else {
        elements.rataMensileCalculated.textContent = "–";
    }

    const validationError = validate(values);
    if (validationError) {
        renderError(validationError);
        return;
    }

    const result = PicPacAvanzatoCalculator.calcolaDeterministico(values);
    renderResult(result);
}

function readValues() {
    return {
        capitaleInvestire: readNumber(elements.capitaleInvestire),
        orizzonteTemporale: readNumber(elements.orizzonteTemporale),
        durataPAC: readNumber(elements.durataPAC),
        rendimentoAnnuale: readNumber(elements.rendimentoAnnuale)
    };
}

function validate(v) {
    if (!Number.isFinite(v.capitaleInvestire) || v.capitaleInvestire <= 0) {
        return "Inserisci un capitale totale da investire valido (> 0 €).";
    }
    if (!Number.isFinite(v.orizzonteTemporale) || v.orizzonteTemporale < 1 || v.orizzonteTemporale > 50) {
        return "Inserisci un orizzonte temporale valido compreso tra 1 e 50 anni.";
    }
    if (!Number.isFinite(v.durataPAC) || v.durataPAC < 1 || v.durataPAC > v.orizzonteTemporale * 12) {
        return `Inserisci un numero di rate mensili del PAC compreso tra 1 e ${v.orizzonteTemporale * 12} (${v.orizzonteTemporale} anni).`;
    }
    if (!Number.isFinite(v.rendimentoAnnuale) || v.rendimentoAnnuale < -99 || v.rendimentoAnnuale > 500) {
        return "Inserisci un tasso di rendimento annuo valido.";
    }
    return "";
}

function renderResult(r) {
    if (elements.resultMessage) {
        elements.resultMessage.textContent = "";
        elements.resultMessage.className = "";
    }

    elements.montantePicSummary.textContent = formatEuro(r.montanteFinalePIC);
    elements.montantePacSummary.textContent = formatEuro(r.montanteFinalePAC);

    const diffEuro = formatEuro(Math.abs(r.differenzaMontante));
    const diffPct = Math.abs(r.percentualeDifferenza).toLocaleString("it-IT", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    if (r.differenzaMontante > 0) {
        elements.differenzaSummaryText.textContent = `Vantaggio PIC rispetto al PAC: +${diffEuro} (+${diffPct}%)`;
        elements.differenzaSummaryText.style.color = "var(--primary)";
    } else if (r.differenzaMontante < 0) {
        elements.differenzaSummaryText.textContent = `Vantaggio PAC rispetto al PIC: +${diffEuro} (+${diffPct}%)`;
        elements.differenzaSummaryText.style.color = "var(--accent)";
    } else {
        elements.differenzaSummaryText.textContent = "I due risultati finali coincidono perfettamente.";
        elements.differenzaSummaryText.style.color = "var(--text)";
    }

    renderSVGChart(r.serieTemporale);
}

function renderError(message) {
    if (elements.resultMessage) {
        elements.resultMessage.textContent = message;
        elements.resultMessage.className = "error";
    }

    const placeholder = "–";
    elements.montantePicSummary.textContent = placeholder;
    elements.montantePacSummary.textContent = placeholder;
    elements.differenzaSummaryText.textContent = "Differenza PIC vs PAC: –";

    elements.picPacChart.innerHTML = "";
}

// -------------------------------------------------------
// Algoritmo per la scala dell'asse Y (multipli di 100, 250, 500...)
// -------------------------------------------------------
function calculateNiceYAxis(maxDataVal) {
    if (!Number.isFinite(maxDataVal) || maxDataVal <= 0) {
        maxDataVal = 1000;
    }

    const targetTicks = 5;
    const rawStep = maxDataVal / targetTicks;

    const exponent = Math.floor(Math.log10(rawStep));
    const magnitude = Math.pow(10, exponent);

    const fraction = rawStep / magnitude;

    let niceFraction;
    if (fraction <= 1.4) {
        niceFraction = 1;
    } else if (fraction <= 3.2) {
        niceFraction = 2.5;
    } else if (fraction <= 7.0) {
        niceFraction = 5;
    } else {
        niceFraction = 10;
    }

    let step = niceFraction * magnitude;

    if (step < 100 && maxDataVal >= 200) {
        step = 100;
    }

    let yMax = Math.ceil(maxDataVal / step) * step;

    if (yMax - maxDataVal < step * 0.1) {
        yMax += step;
    }

    const ticks = [];
    for (let val = 0; val <= yMax + step * 0.001; val += step) {
        ticks.push(Math.round(val * 100) / 100);
    }

    return { yMax, step, ticks };
}

// -------------------------------------------------------
// Rendering Grafico SVG Dinamico
// -------------------------------------------------------
function renderSVGChart(serie) {
    const svg = elements.picPacChart;
    svg.innerHTML = "";

    if (!serie || serie.length === 0) return;

    const width = 600;
    const height = 340;
    const paddingLeft = 80;
    const paddingRight = 25;
    const paddingTop = 25;
    const paddingBottom = 55;

    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;

    let maxDataVal = 0;
    serie.forEach(d => {
        if (d.montantePIC > maxDataVal) maxDataVal = d.montantePIC;
        if (d.montantePAC > maxDataVal) maxDataVal = d.montantePAC;
    });

    const { yMax, ticks } = calculateNiceYAxis(maxDataVal);
    const numAnni = serie.length - 1;

    const getX = (anno) => paddingLeft + (anno / numAnni) * plotWidth;
    const getY = (valore) => paddingTop + plotHeight - (valore / yMax) * plotHeight;

    // Griglia Y ed Etichette Asse Y
    ticks.forEach(valTick => {
        const yPos = getY(valTick);

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", paddingLeft);
        line.setAttribute("y1", yPos);
        line.setAttribute("x2", width - paddingRight);
        line.setAttribute("y2", yPos);
        line.setAttribute("class", "chart-grid-line");
        svg.appendChild(line);

        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", paddingLeft - 10);
        text.setAttribute("y", yPos + 4);
        text.setAttribute("text-anchor", "end");
        text.setAttribute("class", "chart-axis-label");
        text.textContent = formatAxisEuro(valTick);
        svg.appendChild(text);
    });

    // Griglia ed Etichette Asse X
    let stepAnni = 1;
    if (numAnni > 30) stepAnni = 5;
    else if (numAnni > 15) stepAnni = 2;

    for (let a = 0; a <= numAnni; a += stepAnni) {
        const xPos = getX(a);

        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", xPos);
        text.setAttribute("y", height - paddingBottom + 18);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("class", "chart-axis-label");
        text.textContent = a;
        svg.appendChild(text);
    }

    const xAxisTitle = document.createElementNS("http://www.w3.org/2000/svg", "text");
    xAxisTitle.setAttribute("x", paddingLeft + plotWidth / 2);
    xAxisTitle.setAttribute("y", height - paddingBottom + 38);
    xAxisTitle.setAttribute("text-anchor", "middle");
    xAxisTitle.setAttribute("class", "chart-axis-label chart-axis-title");
    xAxisTitle.textContent = "Anno";
    svg.appendChild(xAxisTitle);

    const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    xAxis.setAttribute("x1", paddingLeft);
    xAxis.setAttribute("y1", height - paddingBottom);
    xAxis.setAttribute("x2", width - paddingRight);
    xAxis.setAttribute("y2", height - paddingBottom);
    xAxis.setAttribute("class", "chart-axis-line");
    svg.appendChild(xAxis);

    const yAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    yAxis.setAttribute("x1", paddingLeft);
    yAxis.setAttribute("y1", paddingTop);
    yAxis.setAttribute("x2", paddingLeft);
    yAxis.setAttribute("y2", height - paddingBottom);
    yAxis.setAttribute("class", "chart-axis-line");
    svg.appendChild(yAxis);

    let dPIC = "";
    let dPAC = "";
    let dPACPort = "";

    serie.forEach((d, idx) => {
        const x = getX(d.anno);
        const yPic = getY(d.montantePIC);
        const yPac = getY(d.montantePAC);
        const yPacPort = getY(d.portafoglioPAC);

        const prefix = idx === 0 ? "M" : "L";
        dPIC += `${prefix} ${x.toFixed(1)} ${yPic.toFixed(1)} `;
        dPAC += `${prefix} ${x.toFixed(1)} ${yPac.toFixed(1)} `;
        dPACPort += `${prefix} ${x.toFixed(1)} ${yPacPort.toFixed(1)} `;
    });

    const pathPacPort = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathPacPort.setAttribute("d", dPACPort);
    pathPacPort.setAttribute("class", "chart-path-pac-port");
    svg.appendChild(pathPacPort);

    const pathPac = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathPac.setAttribute("d", dPAC);
    pathPac.setAttribute("class", "chart-path-pac");
    svg.appendChild(pathPac);

    const pathPic = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathPic.setAttribute("d", dPIC);
    pathPic.setAttribute("class", "chart-path-pic");
    svg.appendChild(pathPic);

    serie.forEach(d => {
        const x = getX(d.anno);
        const yPic = getY(d.montantePIC);

        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", x);
        circle.setAttribute("cy", yPic);
        circle.setAttribute("r", 4);
        circle.setAttribute("fill", "#0f4c81");
        circle.setAttribute("class", "chart-point");

        const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
        title.textContent = `Anno ${d.anno}\nMontante PIC: ${formatEuro(d.montantePIC)}\nMontante PAC Totale: ${formatEuro(d.montantePAC)}\n(di cui in portafoglio: ${formatEuro(d.portafoglioPAC)}, in liquidità: ${formatEuro(d.liquiditaPAC)})`;
        circle.appendChild(title);

        svg.appendChild(circle);
    });
}

function readNumber(input) {
    if (!input || input.value === "") return NaN;
    return parseFloat(input.value.replace(",", "."));
}

function formatEuro(value) {
    if (!Number.isFinite(value)) return "–";

    const sign = value < 0 ? "-" : "";
    const parts = Math.abs(value).toFixed(2).split(".");
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const decimalPart = parts[1];

    return sign + "€\u00a0" + integerPart + "," + decimalPart;
}

function formatAxisEuro(value) {
    if (!Number.isFinite(value)) return "–";
    const rounded = Math.round(value);
    const sign = rounded < 0 ? "-" : "";
    const integerPart = Math.abs(rounded).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    return sign + "€\u00a0" + integerPart;
}

init();
