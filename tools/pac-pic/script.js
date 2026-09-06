// =======================================================
// NavTools - Calcolatore PAC / PIC
// Logica di interazione e rendering dell'interfaccia utente
// =======================================================

const elements = {
    // Mode Radios
    modePAC: document.querySelector('input[name="simulationMode"][value="PAC"]'),
    modePIC: document.querySelector('input[name="simulationMode"][value="PIC"]'),

    // Input fields
    durataAnni: document.getElementById("durataAnni"),
    versamentoMensileBox: document.getElementById("versamentoMensileBox"),
    versamentoMensile: document.getElementById("versamentoMensile"),
    versamentoIniziale: document.getElementById("versamentoIniziale"),
    versamentoInizialeNote: document.getElementById("versamentoInizialeNote"),
    rendimentoAnnuoLordo: document.getElementById("rendimentoAnnuoLordo"),
    aliquotaTasse: document.getElementById("aliquotaTasse"),

    // Output Summary
    resultValue: document.getElementById("resultValue"),
    resultMessage: document.getElementById("resultMessage"),
    capitaleInvestitoSummary: document.getElementById("capitaleInvestitoSummary"),
    controvaloreLordoSummary: document.getElementById("controvaloreLordoSummary"),
    guadagnoNettoSummary: document.getElementById("guadagnoNettoSummary"),
    imposteSummary: document.getElementById("imposteSummary"),

    // Chart SVG
    simulationChart: document.getElementById("simulationChart")
};

let previousMode = "PAC";

function init() {
    bindEvents();
    updateModeUI();
    updatePage();
}

function bindEvents() {
    document.querySelectorAll('input[name="simulationMode"]').forEach(radio => {
        radio.addEventListener("change", handleModeChange);
    });

    document.querySelectorAll("input").forEach(input => {
        input.addEventListener("input", updatePage);
        input.addEventListener("change", updatePage);
    });
}

function handleModeChange() {
    const isPAC = elements.modePAC.checked;
    const currentMode = isPAC ? "PAC" : "PIC";

    if (currentMode !== previousMode) {
        // Se l'utente passa da PAC a PIC o viceversa, impostiamo i default richiesti
        if (currentMode === "PIC") {
            elements.versamentoIniziale.value = "10000";
        } else {
            elements.versamentoIniziale.value = "1000";
            elements.versamentoMensile.value = "100";
        }
        previousMode = currentMode;
    }

    updateModeUI();
    updatePage();
}

function updateModeUI() {
    const isPAC = elements.modePAC.checked;

    if (isPAC) {
        elements.versamentoMensileBox.hidden = false;
        elements.versamentoMensile.disabled = false;
        elements.versamentoInizialeNote.textContent = "Capitale iniziale versato al tempo zero.";
    } else {
        elements.versamentoMensileBox.hidden = true;
        elements.versamentoMensile.disabled = true;
        elements.versamentoInizialeNote.textContent = "Capitale totale versato al tempo zero in unica soluzione.";
    }
}

function updatePage() {
    updateModeUI();
    const values = readValues();
    const validationError = validate(values);

    if (validationError) {
        renderError(validationError);
        return;
    }

    const result = PacPicCalculator.calcola(values);
    renderResult(result);
}

function readValues() {
    const isPAC = elements.modePAC.checked;
    return {
        modalita: isPAC ? "PAC" : "PIC",
        durataAnni: readNumber(elements.durataAnni),
        versamentoMensile: isPAC ? readNumber(elements.versamentoMensile) : 0,
        versamentoIniziale: readNumber(elements.versamentoIniziale),
        rendimentoAnnuoLordo: readNumber(elements.rendimentoAnnuoLordo),
        aliquotaTasse: readNumber(elements.aliquotaTasse)
    };
}

function validate(v) {
    if (!Number.isFinite(v.durataAnni) || v.durataAnni < 1 || v.durataAnni > 50) {
        return "Inserisci una durata valida compresa tra 1 e 50 anni.";
    }
    if (!Number.isFinite(v.versamentoIniziale) || v.versamentoIniziale < 0) {
        return "Inserisci un versamento iniziale valido (≥ 0 €).";
    }
    if (v.modalita === "PAC" && (!Number.isFinite(v.versamentoMensile) || v.versamentoMensile < 0)) {
        return "Inserisci un versamento mensile valido (≥ 0 €).";
    }
    if (!Number.isFinite(v.rendimentoAnnuoLordo) || v.rendimentoAnnuoLordo < -99 || v.rendimentoAnnuoLordo > 500) {
        return "Inserisci un tasso di rendimento annuo valido.";
    }
    if (!Number.isFinite(v.aliquotaTasse) || v.aliquotaTasse < 0 || v.aliquotaTasse > 100) {
        return "Inserisci un'aliquota fiscale compresa tra 0% e 100%.";
    }
    return "";
}

function renderResult(r) {
    if (elements.resultMessage) {
        elements.resultMessage.textContent = "";
        elements.resultMessage.className = "";
    }

    // Output sintetici
    elements.resultValue.textContent = formatEuro(r.controvaloreNettoFinale);
    elements.capitaleInvestitoSummary.textContent = formatEuro(r.capitaleInvestitoFinale);
    elements.controvaloreLordoSummary.textContent = formatEuro(r.controvaloreLordoFinale);
    elements.guadagnoNettoSummary.textContent = formatEuro(r.guadagnoNettoFinale);
    elements.imposteSummary.textContent = formatEuro(r.imposteFinali);

    // Rendering del grafico SVG
    renderSVGChart(r.serieTemporale);
}

function renderError(message) {
    if (elements.resultMessage) {
        elements.resultMessage.textContent = message;
        elements.resultMessage.className = "error";
    }

    const placeholder = "–";
    elements.resultValue.textContent = placeholder;
    elements.capitaleInvestitoSummary.textContent = placeholder;
    elements.controvaloreLordoSummary.textContent = placeholder;
    elements.guadagnoNettoSummary.textContent = placeholder;
    elements.imposteSummary.textContent = placeholder;

    // Pulisci grafico
    elements.simulationChart.innerHTML = "";
}

// -------------------------------------------------------
// Algoritmo per la scala dell'asse Y (multipli di 100, 250, 500...)
// -------------------------------------------------------
function calculateNiceYAxis(maxDataVal) {
    if (!Number.isFinite(maxDataVal) || maxDataVal <= 0) {
        maxDataVal = 1000;
    }

    // Puntiamo a circa 4-6 intervalli per leggibilità
    const targetTicks = 5;
    const rawStep = maxDataVal / targetTicks;

    // Ordine di grandezza (potenza di 10)
    const exponent = Math.floor(Math.log10(rawStep));
    const magnitude = Math.pow(10, exponent);

    // Frazione compresa tra 1 e 10
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

    // Garanzia di passo minimo 100 per importi sopra 200€
    if (step < 100 && maxDataVal >= 200) {
        step = 100;
    }

    // yMax come multiplo esatto di step che supera maxDataVal
    let yMax = Math.ceil(maxDataVal / step) * step;

    // Se yMax è troppo vicino al valore massimo, aggiungiamo un passo extra per margine visivo
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
    const svg = elements.simulationChart;
    svg.innerHTML = "";

    if (!serie || serie.length === 0) return;

    // Dimensioni canvas SVG
    const width = 600;
    const height = 340;
    const paddingLeft = 80;
    const paddingRight = 25;
    const paddingTop = 25;
    const paddingBottom = 55;

    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;

    // Troviamo il valore massimo effettivo dai dati
    let maxDataVal = 0;
    serie.forEach(d => {
        if (d.controvaloreLordo > maxDataVal) maxDataVal = d.controvaloreLordo;
        if (d.capitaleInvestito > maxDataVal) maxDataVal = d.capitaleInvestito;
    });

    // Calcolo della scala dell'asse Y (passi naturali multipli di 100, 250, 500...)
    const { yMax, ticks } = calculateNiceYAxis(maxDataVal);
    const numAnni = serie.length - 1;

    // Funzioni di proiezione coordinate
    const getX = (anno) => paddingLeft + (anno / numAnni) * plotWidth;
    const getY = (valore) => paddingTop + plotHeight - (valore / yMax) * plotHeight;

    // 1. Griglia Y e Etichette Asse Y
    ticks.forEach(valTick => {
        const yPos = getY(valTick);

        // Linea di griglia
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", paddingLeft);
        line.setAttribute("y1", yPos);
        line.setAttribute("x2", width - paddingRight);
        line.setAttribute("y2", yPos);
        line.setAttribute("class", "chart-grid-line");
        svg.appendChild(line);

        // Etichetta Asse Y
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", paddingLeft - 10);
        text.setAttribute("y", yPos + 4);
        text.setAttribute("text-anchor", "end");
        text.setAttribute("class", "chart-axis-label");
        text.textContent = formatAxisEuro(valTick);
        svg.appendChild(text);
    });

    // 2. Griglia e Etichette Asse X (Anni)
    let stepAnni = 1;
    if (numAnni > 30) stepAnni = 5;
    else if (numAnni > 15) stepAnni = 2;

    for (let a = 0; a <= numAnni; a += stepAnni) {
        const xPos = getX(a);

        // Etichetta numerica su Asse X (senza la parola "Anno" ripetuta)
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", xPos);
        text.setAttribute("y", height - paddingBottom + 18);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("class", "chart-axis-label");
        text.textContent = a;
        svg.appendChild(text);
    }

    // Titolo dell'Asse X ("Anno") posizionato al centro sotto i numeri
    const xAxisTitle = document.createElementNS("http://www.w3.org/2000/svg", "text");
    xAxisTitle.setAttribute("x", paddingLeft + plotWidth / 2);
    xAxisTitle.setAttribute("y", height - paddingBottom + 38);
    xAxisTitle.setAttribute("text-anchor", "middle");
    xAxisTitle.setAttribute("class", "chart-axis-label chart-axis-title");
    xAxisTitle.textContent = "Anno";
    svg.appendChild(xAxisTitle);

    // Assi principali (linee ortogonali)
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

    // 3. Generazione Path (Polilinee)
    let dInvestito = "";
    let dLordo = "";
    let dNetto = "";

    serie.forEach((d, idx) => {
        const x = getX(d.anno);
        const yInv = getY(d.capitaleInvestito);
        const yLor = getY(d.controvaloreLordo);
        const yNet = getY(d.controvaloreNetto);

        const prefix = idx === 0 ? "M" : "L";
        dInvestito += `${prefix} ${x.toFixed(1)} ${yInv.toFixed(1)} `;
        dLordo += `${prefix} ${x.toFixed(1)} ${yLor.toFixed(1)} `;
        dNetto += `${prefix} ${x.toFixed(1)} ${yNet.toFixed(1)} `;
    });

    // Path Capitale Investito
    const pathInvested = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathInvested.setAttribute("d", dInvestito);
    pathInvested.setAttribute("class", "chart-path-invested");
    svg.appendChild(pathInvested);

    // Path Controvalore Netto
    const pathNet = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathNet.setAttribute("d", dNetto);
    pathNet.setAttribute("class", "chart-path-net");
    svg.appendChild(pathNet);

    // Path Controvalore Lordo
    const pathGross = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathGross.setAttribute("d", dLordo);
    pathGross.setAttribute("class", "chart-path-gross");
    svg.appendChild(pathGross);

    // 4. Punti interattivi con tooltip nativo (title)
    serie.forEach(d => {
        const x = getX(d.anno);
        const yLor = getY(d.controvaloreLordo);

        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", x);
        circle.setAttribute("cy", yLor);
        circle.setAttribute("r", 4);
        circle.setAttribute("fill", "#237a4b");
        circle.setAttribute("class", "chart-point");

        const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
        title.textContent = `Anno ${d.anno}\nCapitale Investito: ${formatEuro(d.capitaleInvestito)}\nControvalore Lordo: ${formatEuro(d.controvaloreLordo)}\nControvalore Netto: ${formatEuro(d.controvaloreNetto)}`;
        circle.appendChild(title);

        svg.appendChild(circle);
    });
}

// -------------------------------------------------------
// Formattazione
// -------------------------------------------------------
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

// -------------------------------------------------------
// Avvio
// -------------------------------------------------------
init();
