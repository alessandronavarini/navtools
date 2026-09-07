// =======================================================
// NavTools - Modellazione Avanzata PIC vs PAC
// Logica di interazione e rendering dell'interfaccia utente
// Versione 1.1.0
// =======================================================

const elements = {
    // Inputs Sezione 1 (Deterministico)
    capitaleInvestire: document.getElementById("capitaleInvestire"),
    orizzonteTemporale: document.getElementById("orizzonteTemporale"),
    durataPAC: document.getElementById("durataPAC"),
    rendimentoAnnuale: document.getElementById("rendimentoAnnuale"),
    rataMensileCalculated: document.getElementById("rataMensileCalculated"),

    // Outputs Sezione 1
    resultMessage: document.getElementById("resultMessage"),
    montantePicSummary: document.getElementById("montantePicSummary"),
    montantePacSummary: document.getElementById("montantePacSummary"),
    differenzaSummaryText: document.getElementById("differenzaSummaryText"),
    picPacChart: document.getElementById("picPacChart"),

    // Inputs Sezione 2 (Monte Carlo Normale)
    capitaleInvestireMC2: document.getElementById("capitaleInvestireMC2"),
    orizzonteTemporaleMC2: document.getElementById("orizzonteTemporaleMC2"),
    durataPACMC2: document.getElementById("durataPACMC2"),
    rataMensileCalculatedMC2: document.getElementById("rataMensileCalculatedMC2"),
    rendimentoAttesoMC2: document.getElementById("rendimentoAttesoMC2"),
    volatilitaAnnuaMC2: document.getElementById("volatilitaAnnuaMC2"),

    // Controlli Sezione 2
    btnRunMonteCarlo2: document.getElementById("btnRunMonteCarlo2"),
    progressBarBox2: document.getElementById("progressBarBox2"),
    progressBarFill2: document.getElementById("progressBarFill2"),
    progressBarText2: document.getElementById("progressBarText2"),

    // Outputs Sezione 2
    probPicWinValue: document.getElementById("probPicWinValue"),
    probPacWinValue: document.getElementById("probPacWinValue"),
    picP50Val: document.getElementById("picP50Val"),
    pacP50Val: document.getElementById("pacP50Val"),
    diffP50Val: document.getElementById("diffP50Val"),
    picP10Val: document.getElementById("picP10Val"),
    pacP10Val: document.getElementById("pacP10Val"),
    diffP10Val: document.getElementById("diffP10Val"),
    picP90Val: document.getElementById("picP90Val"),
    pacP90Val: document.getElementById("pacP90Val"),
    diffP90Val: document.getElementById("diffP90Val"),
    mcDensityChart: document.getElementById("mcDensityChart")
};

function init() {
    bindEvents();
    updatePageSection1();
    updateRataMC2UI();
}

function bindEvents() {
    // Input Sezione 1
    [elements.capitaleInvestire, elements.orizzonteTemporale, elements.durataPAC, elements.rendimentoAnnuale].forEach(input => {
        if (input) {
            input.addEventListener("input", updatePageSection1);
            input.addEventListener("change", updatePageSection1);
        }
    });

    // Input Sezione 2
    [elements.capitaleInvestireMC2, elements.orizzonteTemporaleMC2, elements.durataPACMC2, elements.rendimentoAttesoMC2, elements.volatilitaAnnuaMC2].forEach(input => {
        if (input) {
            input.addEventListener("input", updateRataMC2UI);
            input.addEventListener("change", updateRataMC2UI);
        }
    });

    // Tasto Avvio Monte Carlo Sezione 2
    if (elements.btnRunMonteCarlo2) {
        elements.btnRunMonteCarlo2.addEventListener("click", runMonteCarloSection2);
    }
}

// -------------------------------------------------------
// SEZIONE 1: CALCOLO DETERMINISTICO
// -------------------------------------------------------
function updatePageSection1() {
    const values = readValuesSection1();

    if (Number.isFinite(values.capitaleInvestire) && Number.isFinite(values.durataPAC) && values.durataPAC > 0) {
        const rata = values.capitaleInvestire / values.durataPAC;
        elements.rataMensileCalculated.textContent = formatEuro(rata) + " / mese";
    } else {
        elements.rataMensileCalculated.textContent = "–";
    }

    const validationError = validateSection1(values);
    if (validationError) {
        renderErrorSection1(validationError);
        return;
    }

    const result = PicPacAvanzatoCalculator.calcolaDeterministico(values);
    renderResultSection1(result);
}

function readValuesSection1() {
    return {
        capitaleInvestire: readNumber(elements.capitaleInvestire),
        orizzonteTemporale: readNumber(elements.orizzonteTemporale),
        durataPAC: readNumber(elements.durataPAC),
        rendimentoAnnuale: readNumber(elements.rendimentoAnnuale)
    };
}

function validateSection1(v) {
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

function renderResultSection1(r) {
    if (elements.resultMessage) {
        elements.resultMessage.textContent = "";
        elements.resultMessage.className = "";
    }

    // Output riepilogo in evidenza (senza valore gigante in alto)
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

    renderSVGChartSection1(r.serieTemporale);
}

function renderErrorSection1(message) {
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
// SEZIONE 2: MONTE CARLO (DISTRIBUZIONE NORMALE)
// -------------------------------------------------------
function updateRataMC2UI() {
    const cTot = readNumber(elements.capitaleInvestireMC2);
    const ratePAC = readNumber(elements.durataPACMC2);

    if (Number.isFinite(cTot) && Number.isFinite(ratePAC) && ratePAC > 0) {
        const rata = cTot / ratePAC;
        elements.rataMensileCalculatedMC2.textContent = formatEuro(rata) + " / mese";
    } else {
        elements.rataMensileCalculatedMC2.textContent = "–";
    }
}

function readValuesSection2() {
    return {
        capitaleInvestire: readNumber(elements.capitaleInvestireMC2),
        orizzonteTemporale: readNumber(elements.orizzonteTemporaleMC2),
        durataPAC: readNumber(elements.durataPACMC2),
        rendimentoAtteso: readNumber(elements.rendimentoAttesoMC2),
        volatilitaAnnua: readNumber(elements.volatilitaAnnuaMC2)
    };
}

function validateSection2(v) {
    if (!Number.isFinite(v.capitaleInvestire) || v.capitaleInvestire <= 0) {
        alert("Inserisci un capitale totale da investire valido (> 0 €).");
        return false;
    }
    if (!Number.isFinite(v.orizzonteTemporale) || v.orizzonteTemporale < 1 || v.orizzonteTemporale > 50) {
        alert("Inserisci un orizzonte temporale valido compreso tra 1 e 50 anni.");
        return false;
    }
    if (!Number.isFinite(v.durataPAC) || v.durataPAC < 1 || v.durataPAC > v.orizzonteTemporale * 12) {
        alert(`Inserisci un numero di rate mensili del PAC compreso tra 1 e ${v.orizzonteTemporale * 12}.`);
        return false;
    }
    if (!Number.isFinite(v.rendimentoAtteso) || v.rendimentoAtteso < -99 || v.rendimentoAtteso > 500) {
        alert("Inserisci un rendimento atteso valido.");
        return false;
    }
    if (!Number.isFinite(v.volatilitaAnnua) || v.volatilitaAnnua <= 0 || v.volatilitaAnnua > 200) {
        alert("Inserisci una volatilità annua valida (> 0%).");
        return false;
    }
    return true;
}

function runMonteCarloSection2() {
    const v = readValuesSection2();
    if (!validateSection2(v)) return;

    // Disabilita tasto e mostra barra di avanzamento
    elements.btnRunMonteCarlo2.disabled = true;
    elements.progressBarBox2.hidden = false;
    elements.progressBarFill2.style.width = "0%";
    elements.progressBarText2.textContent = "Preparazione simulazione Monte Carlo...";

    const totalRuns = 10000;
    const batchSize = 1000;
    let runsCompleted = 0;

    const picResults = new Float64Array(totalRuns);
    const pacResults = new Float64Array(totalRuns);

    const cTot = v.capitaleInvestire;
    const anni = v.orizzonteTemporale;
    const ratePAC = v.durataPAC;
    const rataMensilePAC = cTot / ratePAC;
    const totaleMesi = anni * 12;

    const muAnnuo = v.rendimentoAtteso / 100;
    const sigmaAnnua = v.volatilitaAnnua / 100;

    const muMensile = Math.pow(1 + muAnnuo, 1 / 12) - 1;
    const sigmaMensile = sigmaAnnua / Math.sqrt(12);

    const simParams = {
        cTot,
        totaleMesi,
        ratePAC,
        rataMensilePAC,
        muMensile,
        sigmaMensile
    };

    function processBatch() {
        const start = runsCompleted;
        const end = Math.min(totalRuns, start + batchSize);

        for (let i = start; i < end; i++) {
            const { picFinal, pacFinal } = PicPacAvanzatoCalculator.simulaSingoloMonteCarloNormale(simParams);
            picResults[i] = picFinal;
            pacResults[i] = pacFinal;
        }

        runsCompleted = end;
        const progressPct = (runsCompleted / totalRuns) * 100;
        elements.progressBarFill2.style.width = progressPct + "%";
        elements.progressBarText2.textContent = `Calcolo in corso... ${runsCompleted.toLocaleString("it-IT")} / 10.000 simulazioni (${Math.round(progressPct)}%)`;

        if (runsCompleted < totalRuns) {
            setTimeout(processBatch, 0);
        } else {
            setTimeout(() => {
                elements.progressBarBox2.hidden = true;
                elements.btnRunMonteCarlo2.disabled = false;

                const stats = PicPacAvanzatoCalculator.elaboraStatisticheMonteCarlo(picResults, pacResults);
                renderResultsSection2(stats, picResults, pacResults);
            }, 60);
        }
    }

    setTimeout(processBatch, 20);
}

function renderResultsSection2(stats, picArray, pacArray) {
    // 1. Probabilità di vittoria
    elements.probPicWinValue.textContent = stats.probVittoriaPIC.toLocaleString("it-IT", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";
    elements.probPacWinValue.textContent = stats.probVittoriaPAC.toLocaleString("it-IT", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";

    // 2. Tabella Percentili
    elements.picP50Val.textContent = formatEuro(stats.picMediana);
    elements.pacP50Val.textContent = formatEuro(stats.pacMediana);
    elements.diffP50Val.textContent = (stats.diffMediana >= 0 ? "+" : "") + formatEuro(stats.diffMediana);

    elements.picP10Val.textContent = formatEuro(stats.picP10);
    elements.pacP10Val.textContent = formatEuro(stats.pacP10);
    elements.diffP10Val.textContent = (stats.diffP10 >= 0 ? "+" : "") + formatEuro(stats.diffP10);

    elements.picP90Val.textContent = formatEuro(stats.picP90);
    elements.pacP90Val.textContent = formatEuro(stats.pacP90);
    elements.diffP90Val.textContent = (stats.diffP90 >= 0 ? "+" : "") + formatEuro(stats.diffP90);

    // 3. Render grafico della Densità di Probabilità
    renderMCDensityChart(picArray, pacArray);
}

// -------------------------------------------------------
// GRAFICO DENSITÀ DI PROBABILITÀ (MONTE CARLO SEZIONE 2)
// -------------------------------------------------------
function renderMCDensityChart(picArray, pacArray) {
    const svg = elements.mcDensityChart;
    svg.innerHTML = "";

    if (!picArray || !pacArray) return;

    const width = 600;
    const height = 340;
    const paddingLeft = 80;
    const paddingRight = 25;
    const paddingTop = 25;
    const paddingBottom = 55;

    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;

    // Troviamo i percentili 1° e 99° per evitare che estremi isolati schiaccino il grafico
    const getPct = (arr, p) => arr[Math.min(arr.length - 1, Math.max(0, Math.floor(p * arr.length)))];
    const minX = Math.min(getPct(picArray, 0.01), getPct(pacArray, 0.01));
    const maxX = Math.max(getPct(picArray, 0.99), getPct(pacArray, 0.99));

    // Scala Asse X (con l'algoritmo multipli di 100, 250, 500...)
    const { yMax: xNiceMax, ticks: xTicks } = calculateNiceYAxis(maxX);
    const xMinVal = 0;
    const xMaxVal = xNiceMax;

    // Costruzione Istogramma a 50 Bin
    const numBins = 50;
    const binWidth = (xMaxVal - xMinVal) / numBins;

    const picBins = new Float64Array(numBins);
    const pacBins = new Float64Array(numBins);

    for (let i = 0; i < picArray.length; i++) {
        const picVal = picArray[i];
        if (picVal >= xMinVal && picVal <= xMaxVal) {
            const b = Math.min(numBins - 1, Math.floor((picVal - xMinVal) / binWidth));
            picBins[b]++;
        }
        const pacVal = pacArray[i];
        if (pacVal >= xMinVal && pacVal <= xMaxVal) {
            const b = Math.min(numBins - 1, Math.floor((pacVal - xMinVal) / binWidth));
            pacBins[b]++;
        }
    }

    // Normalizzazione per densità (Area = 1)
    for (let b = 0; b < numBins; b++) {
        picBins[b] = picBins[b] / (picArray.length * binWidth);
        pacBins[b] = pacBins[b] / (pacArray.length * binWidth);
    }

    // Levigatura (Smooth Moving Average a 3 punti)
    const smooth = (arr) => {
        const res = new Float64Array(arr.length);
        for (let i = 0; i < arr.length; i++) {
            const prev = i > 0 ? arr[i - 1] : arr[i];
            const next = i < arr.length - 1 ? arr[i + 1] : arr[i];
            res[i] = (prev * 0.25) + (arr[i] * 0.5) + (next * 0.25);
        }
        return res;
    };

    const picSmooth = smooth(smooth(picBins));
    const pacSmooth = smooth(smooth(pacBins));

    let maxDensity = 0;
    for (let b = 0; b < numBins; b++) {
        if (picSmooth[b] > maxDensity) maxDensity = picSmooth[b];
        if (pacSmooth[b] > maxDensity) maxDensity = pacSmooth[b];
    }
    if (maxDensity <= 0) maxDensity = 0.0001;

    const getX = (val) => paddingLeft + ((val - xMinVal) / (xMaxVal - xMinVal)) * plotWidth;
    const getY = (dens) => paddingTop + plotHeight - (dens / (maxDensity * 1.1)) * plotHeight;

    // 1. Griglia Y (senza etichette numeriche complesse per la densità)
    const yTicks = 4;
    for (let i = 0; i <= yTicks; i++) {
        const yPos = paddingTop + plotHeight - (i / yTicks) * plotHeight;
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", paddingLeft);
        line.setAttribute("y1", yPos);
        line.setAttribute("x2", width - paddingRight);
        line.setAttribute("y2", yPos);
        line.setAttribute("class", "chart-grid-line");
        svg.appendChild(line);
    }

    // 2. Griglia ed Etichette Asse X (Montante con separatore delle migliaia)
    xTicks.forEach(valTick => {
        const xPos = getX(valTick);
        if (xPos >= paddingLeft && xPos <= width - paddingRight) {
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", xPos);
            line.setAttribute("y1", paddingTop);
            line.setAttribute("x2", xPos);
            line.setAttribute("y2", height - paddingBottom);
            line.setAttribute("class", "chart-grid-line");
            svg.appendChild(line);

            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", xPos);
            text.setAttribute("y", height - paddingBottom + 18);
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("class", "chart-axis-label");
            text.textContent = formatAxisEuro(valTick);
            svg.appendChild(text);
        }
    });

    // Titolo Asse X
    const xAxisTitle = document.createElementNS("http://www.w3.org/2000/svg", "text");
    xAxisTitle.setAttribute("x", paddingLeft + plotWidth / 2);
    xAxisTitle.setAttribute("y", height - paddingBottom + 38);
    xAxisTitle.setAttribute("text-anchor", "middle");
    xAxisTitle.setAttribute("class", "chart-axis-label chart-axis-title");
    xAxisTitle.textContent = "Montante Finale (EUR)";
    svg.appendChild(xAxisTitle);

    // Titolo Asse Y (Densità di probabilità)
    const yAxisTitle = document.createElementNS("http://www.w3.org/2000/svg", "text");
    yAxisTitle.setAttribute("x", -(paddingTop + plotHeight / 2));
    yAxisTitle.setAttribute("y", 20);
    yAxisTitle.setAttribute("transform", "rotate(-90)");
    yAxisTitle.setAttribute("text-anchor", "middle");
    yAxisTitle.setAttribute("class", "chart-axis-label chart-axis-title");
    yAxisTitle.textContent = "Densità di Probabilità";
    svg.appendChild(yAxisTitle);

    // Assi principali
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

    // 3. Generazione Aree / Curve vettoriali SVG per PIC e PAC
    const createAreaD = (bins) => {
        let d = `M ${paddingLeft} ${height - paddingBottom} `;
        for (let b = 0; b < numBins; b++) {
            const valCenter = xMinVal + (b + 0.5) * binWidth;
            const x = getX(valCenter);
            const y = getY(bins[b]);
            d += `L ${x.toFixed(1)} ${y.toFixed(1)} `;
        }
        d += `L ${width - paddingRight} ${height - paddingBottom} Z`;
        return d;
    };

    // Area Densità PIC
    const pathPicArea = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathPicArea.setAttribute("d", createAreaD(picSmooth));
    pathPicArea.setAttribute("class", "density-area-pic");
    svg.appendChild(pathPicArea);

    // Area Densità PAC
    const pathPacArea = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathPacArea.setAttribute("d", createAreaD(pacSmooth));
    pathPacArea.setAttribute("class", "density-area-pac");
    svg.appendChild(pathPacArea);
}

// -------------------------------------------------------
// GRAFICO DETERMINISTICO (SEZIONE 1)
// -------------------------------------------------------
function renderSVGChartSection1(serie) {
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
