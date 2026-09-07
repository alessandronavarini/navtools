// =======================================================
// NavTools - Modulo 2: Monte Carlo (Distribuzione Normale)
// Logica di interazione e rendering dell'interfaccia utente
// Versione 1.2.0
// =======================================================

const elements = {
    capitaleInvestireMC2: document.getElementById("capitaleInvestireMC2"),
    orizzonteTemporaleMC2: document.getElementById("orizzonteTemporaleMC2"),
    durataPACMC2: document.getElementById("durataPACMC2"),
    rataMensileCalculatedMC2: document.getElementById("rataMensileCalculatedMC2"),
    rendimentoAttesoMC2: document.getElementById("rendimentoAttesoMC2"),
    volatilitaAnnuaMC2: document.getElementById("volatilitaAnnuaMC2"),
    numeroSimulazioniMC2: document.getElementById("numeroSimulazioniMC2"),

    btnRunMonteCarlo2: document.getElementById("btnRunMonteCarlo2"),
    progressBarBox2: document.getElementById("progressBarBox2"),
    progressBarFill2: document.getElementById("progressBarFill2"),
    progressBarText2: document.getElementById("progressBarText2"),

    mcResultTitle: document.getElementById("mcResultTitle"),
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
    updateRataMC2UI();
}

function bindEvents() {
    [elements.capitaleInvestireMC2, elements.orizzonteTemporaleMC2, elements.durataPACMC2, elements.rendimentoAttesoMC2, elements.volatilitaAnnuaMC2, elements.numeroSimulazioniMC2].forEach(input => {
        if (input) {
            input.addEventListener("input", updateRataMC2UI);
            input.addEventListener("change", updateRataMC2UI);
        }
    });

    if (elements.btnRunMonteCarlo2) {
        elements.btnRunMonteCarlo2.addEventListener("click", runMonteCarloSection2);
    }
}

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
    let numSim = readNumber(elements.numeroSimulazioniMC2);
    if (!Number.isFinite(numSim) || numSim < 10000) {
        numSim = 10000;
    }

    return {
        capitaleInvestire: readNumber(elements.capitaleInvestireMC2),
        orizzonteTemporale: readNumber(elements.orizzonteTemporaleMC2),
        durataPAC: readNumber(elements.durataPACMC2),
        rendimentoAtteso: readNumber(elements.rendimentoAttesoMC2),
        volatilitaAnnua: readNumber(elements.volatilitaAnnuaMC2),
        numeroSimulazioni: numSim
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

    elements.btnRunMonteCarlo2.disabled = true;
    elements.progressBarBox2.hidden = false;
    elements.progressBarFill2.style.width = "0%";
    elements.progressBarText2.textContent = "Preparazione simulazione Monte Carlo...";

    const totalRuns = v.numeroSimulazioni;
    const batchSize = Math.max(1000, Math.floor(totalRuns / 20));
    let runsCompleted = 0;

    const picResults = new Float64Array(totalRuns);
    const pacResults = new Float64Array(totalRuns);
    const picDrawdowns = new Float64Array(totalRuns);
    const pacDrawdowns = new Float64Array(totalRuns);

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
        elements.progressBarText2.textContent = `Calcolo in corso... ${runsCompleted.toLocaleString("it-IT")} / ${totalRuns.toLocaleString("it-IT")} simulazioni (${Math.round(progressPct)}%)`;

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
    if (elements.mcResultTitle) {
        elements.mcResultTitle.textContent = `Esito ${stats.totalRuns.toLocaleString("it-IT")} Simulazioni Monte Carlo`;
    }

    elements.probPicWinValue.textContent = stats.probVittoriaPIC.toLocaleString("it-IT", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";
    elements.probPacWinValue.textContent = stats.probVittoriaPAC.toLocaleString("it-IT", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";

    elements.picP50Val.textContent = formatEuro(stats.picMediana);
    elements.pacP50Val.textContent = formatEuro(stats.pacMediana);
    elements.diffP50Val.textContent = (stats.diffMediana >= 0 ? "+" : "") + formatEuro(stats.diffMediana);

    elements.picP10Val.textContent = formatEuro(stats.picP10);
    elements.pacP10Val.textContent = formatEuro(stats.pacP10);
    elements.diffP10Val.textContent = (stats.diffP10 >= 0 ? "+" : "") + formatEuro(stats.diffP10);

    elements.picP90Val.textContent = formatEuro(stats.picP90);
    elements.pacP90Val.textContent = formatEuro(stats.pacP90);
    elements.diffP90Val.textContent = (stats.diffP90 >= 0 ? "+" : "") + formatEuro(stats.diffP90);

    renderMCDensityChart(picArray, pacArray);
}

// -------------------------------------------------------
// GRAFICO DENSITÀ DI PROBABILITÀ (MONTE CARLO SEZIONE 2)
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

    const getPct = (arr, p) => arr[Math.min(arr.length - 1, Math.max(0, Math.floor(p * arr.length)))];
    const minX = Math.min(getPct(picArray, 0.01), getPct(pacArray, 0.01));
    const maxX = Math.max(getPct(picArray, 0.99), getPct(pacArray, 0.99));

    const { yMax: xNiceMax, ticks: xTicks } = calculateNiceYAxis(maxX);
    const xMinVal = 0;
    const xMaxVal = xNiceMax;

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

    for (let b = 0; b < numBins; b++) {
        picBins[b] = picBins[b] / (picArray.length * binWidth);
        pacBins[b] = pacBins[b] / (pacArray.length * binWidth);
    }

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

    const yTicksCount = 4;
    for (let i = 0; i <= yTicksCount; i++) {
        const yPos = paddingTop + plotHeight - (i / yTicksCount) * plotHeight;
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", paddingLeft);
        line.setAttribute("y1", yPos);
        line.setAttribute("x2", width - paddingRight);
        line.setAttribute("y2", yPos);
        line.setAttribute("class", "chart-grid-line");
        svg.appendChild(line);
    }

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

    const xAxisTitle = document.createElementNS("http://www.w3.org/2000/svg", "text");
    xAxisTitle.setAttribute("x", paddingLeft + plotWidth / 2);
    xAxisTitle.setAttribute("y", height - paddingBottom + 38);
    xAxisTitle.setAttribute("text-anchor", "middle");
    xAxisTitle.setAttribute("class", "chart-axis-label chart-axis-title");
    xAxisTitle.textContent = "Montante Finale (EUR)";
    svg.appendChild(xAxisTitle);

    const yAxisTitle = document.createElementNS("http://www.w3.org/2000/svg", "text");
    yAxisTitle.setAttribute("x", -(paddingTop + plotHeight / 2));
    yAxisTitle.setAttribute("y", 20);
    yAxisTitle.setAttribute("transform", "rotate(-90)");
    yAxisTitle.setAttribute("text-anchor", "middle");
    yAxisTitle.setAttribute("class", "chart-axis-label chart-axis-title");
    yAxisTitle.textContent = "Densità di Probabilità";
    svg.appendChild(yAxisTitle);

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

    const pathPicArea = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathPicArea.setAttribute("d", createAreaD(picSmooth));
    pathPicArea.setAttribute("class", "density-area-pic");
    svg.appendChild(pathPicArea);

    const pathPacArea = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathPacArea.setAttribute("d", createAreaD(pacSmooth));
    pathPacArea.setAttribute("class", "density-area-pac");
    svg.appendChild(pathPacArea);
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
