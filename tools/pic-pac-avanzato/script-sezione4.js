// =======================================================
// NavTools - Modulo 4: Monte Carlo (t di Student Asimmetrica - Bruce Hansen)
// Logica di interazione e rendering dell'interfaccia utente
// Versione 1.4.0
// =======================================================

const elements = {
    capitaleInvestireMC4: document.getElementById("capitaleInvestireMC4"),
    orizzonteTemporaleMC4: document.getElementById("orizzonteTemporaleMC4"),
    durataPACMC4: document.getElementById("durataPACMC4"),
    rataMensileCalculatedMC4: document.getElementById("rataMensileCalculatedMC4"),
    rendimentoAttesoMC4: document.getElementById("rendimentoAttesoMC4"),
    volatilitaAnnuaMC4: document.getElementById("volatilitaAnnuaMC4"),
    gradiLibertaMC4: document.getElementById("gradiLibertaMC4"),
    lambdaAsimmetriaMC4: document.getElementById("lambdaAsimmetriaMC4"),
    numeroSimulazioniMC4: document.getElementById("numeroSimulazioniMC4"),

    btnRunMonteCarlo4: document.getElementById("btnRunMonteCarlo4"),
    progressBarBox4: document.getElementById("progressBarBox4"),
    progressBarFill4: document.getElementById("progressBarFill4"),
    progressBarText4: document.getElementById("progressBarText4"),

    mcResultTitle4: document.getElementById("mcResultTitle4"),
    probPicWinValue4: document.getElementById("probPicWinValue4"),
    probPacWinValue4: document.getElementById("probPacWinValue4"),
    picP50Val4: document.getElementById("picP50Val4"),
    pacP50Val4: document.getElementById("pacP50Val4"),
    diffP50Val4: document.getElementById("diffP50Val4"),
    picP10Val4: document.getElementById("picP10Val4"),
    pacP10Val4: document.getElementById("pacP10Val4"),
    diffP10Val4: document.getElementById("diffP10Val4"),
    picP90Val4: document.getElementById("picP90Val4"),
    pacP90Val4: document.getElementById("pacP90Val4"),
    diffP90Val4: document.getElementById("diffP90Val4"),
    mcDensityChart4: document.getElementById("mcDensityChart4")
};

function init() {
    bindEvents();
    updateRataMC4UI();
}

function bindEvents() {
    [elements.capitaleInvestireMC4, elements.orizzonteTemporaleMC4, elements.durataPACMC4, elements.rendimentoAttesoMC4, elements.volatilitaAnnuaMC4, elements.gradiLibertaMC4, elements.lambdaAsimmetriaMC4, elements.numeroSimulazioniMC4].forEach(input => {
        if (input) {
            input.addEventListener("input", updateRataMC4UI);
            input.addEventListener("change", updateRataMC4UI);
        }
    });

    if (elements.btnRunMonteCarlo4) {
        elements.btnRunMonteCarlo4.addEventListener("click", runMonteCarloSection4);
    }
}

function updateRataMC4UI() {
    const cTot = readNumber(elements.capitaleInvestireMC4);
    const ratePAC = readNumber(elements.durataPACMC4);

    if (Number.isFinite(cTot) && Number.isFinite(ratePAC) && ratePAC > 0) {
        const rata = cTot / ratePAC;
        elements.rataMensileCalculatedMC4.textContent = formatEuro(rata) + " / mese";
    } else {
        elements.rataMensileCalculatedMC4.textContent = "–";
    }
}

function readValuesSection4() {
    let numSim = readNumber(elements.numeroSimulazioniMC4);
    if (!Number.isFinite(numSim) || numSim < 10000) {
        numSim = 10000;
    }

    let nu = readNumber(elements.gradiLibertaMC4);
    if (!Number.isFinite(nu) || nu < 3) {
        nu = 5;
    }

    let lam = readNumber(elements.lambdaAsimmetriaMC4);
    if (!Number.isFinite(lam)) {
        lam = -0.15;
    }

    return {
        capitaleInvestire: readNumber(elements.capitaleInvestireMC4),
        orizzonteTemporale: readNumber(elements.orizzonteTemporaleMC4),
        durataPAC: readNumber(elements.durataPACMC4),
        rendimentoAtteso: readNumber(elements.rendimentoAttesoMC4),
        volatilitaAnnua: readNumber(elements.volatilitaAnnuaMC4),
        gradiLiberta: nu,
        lambdaAsimmetria: lam,
        numeroSimulazioni: numSim
    };
}

function validateSection4(v) {
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
    if (!Number.isFinite(v.gradiLiberta) || v.gradiLiberta < 3 || v.gradiLiberta > 100) {
        alert("Inserisci dei gradi di libertà validi (minimo 3).");
        return false;
    }
    if (!Number.isFinite(v.lambdaAsimmetria) || v.lambdaAsimmetria <= -1 || v.lambdaAsimmetria >= 1) {
        alert("Inserisci un parametro di asimmetria lambda valido compreso tra -0.99 e 0.99.");
        return false;
    }
    return true;
}

function runMonteCarloSection4() {
    const v = readValuesSection4();
    if (!validateSection4(v)) return;

    elements.btnRunMonteCarlo4.disabled = true;
    elements.progressBarBox4.hidden = false;
    elements.progressBarFill4.style.width = "0%";
    elements.progressBarText4.textContent = "Preparazione simulazione Monte Carlo Skewed t...";

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
    const gradiLiberta = v.gradiLiberta;
    const lambdaAsimmetria = v.lambdaAsimmetria;

    const simParams = {
        cTot,
        totaleMesi,
        ratePAC,
        rataMensilePAC,
        muMensile,
        sigmaMensile,
        gradiLiberta,
        lambdaAsimmetria
    };

    function processBatch() {
        const start = runsCompleted;
        const end = Math.min(totalRuns, start + batchSize);

        for (let i = start; i < end; i++) {
            const { picFinal, pacFinal, picDrawdown, pacDrawdown } = PicPacAvanzatoCalculator.simulaSingoloMonteCarloHansenSkewedT(simParams);
            picResults[i] = picFinal;
            pacResults[i] = pacFinal;
            picDrawdowns[i] = picDrawdown;
            pacDrawdowns[i] = pacDrawdown;
        }

        runsCompleted = end;
        const progressPct = (runsCompleted / totalRuns) * 100;
        elements.progressBarFill4.style.width = progressPct + "%";
        elements.progressBarText4.textContent = `Calcolo Skewed t in corso... ${runsCompleted.toLocaleString("it-IT")} / ${totalRuns.toLocaleString("it-IT")} simulazioni (${Math.round(progressPct)}%)`;

        if (runsCompleted < totalRuns) {
            setTimeout(processBatch, 0);
        } else {
            setTimeout(() => {
                elements.progressBarBox4.hidden = true;
                elements.btnRunMonteCarlo4.disabled = false;

                const stats = PicPacAvanzatoCalculator.elaboraStatisticheMonteCarlo(picResults, pacResults, picDrawdowns, pacDrawdowns);
                renderResultsSection4(stats, picResults, pacResults);
            }, 60);
        }
    }

    setTimeout(processBatch, 20);
}

function renderResultsSection4(stats, picArray, pacArray) {
    if (elements.mcResultTitle4) {
        elements.mcResultTitle4.textContent = `Esito ${stats.totalRuns.toLocaleString("it-IT")} Simulazioni Monte Carlo (Skewed t di Hansen)`;
    }

    elements.probPicWinValue4.textContent = stats.probVittoriaPIC.toLocaleString("it-IT", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";
    elements.probPacWinValue4.textContent = stats.probVittoriaPAC.toLocaleString("it-IT", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";

    elements.picP50Val4.textContent = formatEuro(stats.picMediana);
    elements.pacP50Val4.textContent = formatEuro(stats.pacMediana);
    elements.diffP50Val4.textContent = (stats.diffMediana >= 0 ? "+" : "") + formatEuro(stats.diffMediana);

    elements.picP10Val4.textContent = formatEuro(stats.picP10);
    elements.pacP10Val4.textContent = formatEuro(stats.pacP10);
    elements.diffP10Val4.textContent = (stats.diffP10 >= 0 ? "+" : "") + formatEuro(stats.diffP10);

    elements.picP90Val4.textContent = formatEuro(stats.picP90);
    elements.pacP90Val4.textContent = formatEuro(stats.pacP90);
    elements.diffP90Val4.textContent = (stats.diffP90 >= 0 ? "+" : "") + formatEuro(stats.diffP90);

    // Popola tabella draw‑down Sezione 4
    const fmtDD = v => (Number.isFinite(v) ? v.toFixed(2) + "%" : "–");

    const elMedianDDPic = document.getElementById("medianDDPic4");
    const elP10DDPic    = document.getElementById("p10DDPic4");
    const elP90DDPic    = document.getElementById("p90DDPic4");
    const elMeanDDPic   = document.getElementById("meanDDPic4");

    const elMedianDDPac = document.getElementById("medianDDPac4");
    const elP10DDPac    = document.getElementById("p10DDPac4");
    const elP90DDPac    = document.getElementById("p90DDPac4");
    const elMeanDDPac   = document.getElementById("meanDDPac4");

    if (elMedianDDPic) elMedianDDPic.textContent = fmtDD(stats.medianDDPic);
    if (elP10DDPic)    elP10DDPic.textContent    = fmtDD(stats.p10DDPic);
    if (elP90DDPic)    elP90DDPic.textContent    = fmtDD(stats.p90DDPic);
    if (elMeanDDPic)   elMeanDDPic.textContent   = fmtDD(stats.meanDDPic);

    if (elMedianDDPac) elMedianDDPac.textContent = fmtDD(stats.medianDDPac);
    if (elP10DDPac)    elP10DDPac.textContent    = fmtDD(stats.p10DDPac);
    if (elP90DDPac)    elP90DDPac.textContent    = fmtDD(stats.p90DDPac);
    if (elMeanDDPac)   elMeanDDPac.textContent   = fmtDD(stats.meanDDPac);

    // Evidenzia la strategia con draw‑down medio minore
    [elMeanDDPic, elMeanDDPac].forEach(el => el && el.classList.remove("better"));
    if (Number.isFinite(stats.meanDDPic) && Number.isFinite(stats.meanDDPac)) {
        if (stats.meanDDPic <= stats.meanDDPac) {
            elMeanDDPic && elMeanDDPic.classList.add("better");
        } else {
            elMeanDDPac && elMeanDDPac.classList.add("better");
        }
    }

    renderMCDensityChart4(picArray, pacArray, stats);
}

// -------------------------------------------------------
// GRAFICO DENSITÀ DI PROBABILITÀ (MONTE CARLO SEZIONE 4)
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

function renderMCDensityChart4(picArray, pacArray, stats) {
    const svg = elements.mcDensityChart4;
    if (!svg) return;
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

    // Linee verticali tratteggiate sulle mediane
    if (stats) {
        const makeMedianLine = (medianVal, color) => {
            const x = getX(medianVal);
            if (x < paddingLeft || x > width - paddingRight) return;

            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", x);
            line.setAttribute("y1", paddingTop);
            line.setAttribute("x2", x);
            line.setAttribute("y2", height - paddingBottom);
            line.setAttribute("stroke", color);
            line.setAttribute("stroke-dasharray", "5 4");
            line.setAttribute("stroke-width", "2.5");
            line.setAttribute("opacity", "0.9");
            svg.appendChild(line);
        };

        makeMedianLine(stats.picMediana, "var(--primary)");
        makeMedianLine(stats.pacMediana, "var(--accent)");
    }
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
