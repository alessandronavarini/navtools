/*
=========================================================
NavTools - Modellazione Avanzata PIC vs PAC
Motore di calcolo (Deterministico & Monte Carlo Normale)
Versione 1.2.0
=========================================================

CORREZIONE TEMPISTICA VERSAMENTO PAC:
-------------------------------------
I versamenti del PAC avvengono all'INIZIO di ciascun mese m (m = 1...K).
In questo modo la rata m-esima beneficia del rendimento del mese m.
Se K = 1 (PAC di 1 sola rata), l'intero capitale viene versato all'inizio
del mese 1 ed è esposto al mercato esattamente come il PIC (risultati identici).
=========================================================
*/

const PicPacAvanzatoCalculator = {
    /**
     * SEZIONE 1: Esegue la simulazione deterministica confrontando PIC e PAC.
     */
    calcolaDeterministico(p) {
        const {
            capitaleInvestire,
            orizzonteTemporale,
            durataPAC,
            rendimentoAnnuale
        } = p;

        const cTot = Math.max(100, capitaleInvestire);
        const anni = Math.max(1, Math.min(50, Math.round(orizzonteTemporale)));
        const ratePAC = Math.max(1, Math.min(anni * 12, Math.round(durataPAC)));
        const rAnnuo = Math.max(-99, rendimentoAnnuale) / 100;

        const rataMensilePAC = cTot / ratePAC;
        const rMensile = Math.pow(1 + rAnnuo, 1 / 12) - 1;

        const totaleMesi = anni * 12;
        const serieTemporale = [];

        let montantePIC = cTot;
        let portafoglioPAC = 0;

        serieTemporale.push({
            anno: 0,
            mese: 0,
            montantePIC: round2(montantePIC),
            montantePAC: round2(cTot),
            portafoglioPAC: round2(0),
            liquiditaPAC: round2(cTot),
            capitaleInvestitoPIC: round2(cTot),
            capitaleInvestitoPAC: round2(0)
        });

        for (let m = 1; m <= totaleMesi; m++) {
            // Versamento all'inizio del mese m per il PAC
            const quotaVersata = m <= ratePAC ? rataMensilePAC : 0;
            portafoglioPAC += quotaVersata;

            // Crescita del mercato durante il mese m
            montantePIC = montantePIC * (1 + rMensile);
            portafoglioPAC = portafoglioPAC * (1 + rMensile);

            const liquiditaPAC = Math.max(0, cTot - Math.min(m, ratePAC) * rataMensilePAC);
            const patrimonioTotalePAC = portafoglioPAC + liquiditaPAC;
            const capitaleVersatoNelPortafoglioPAC = Math.min(m, ratePAC) * rataMensilePAC;

            if (m % 12 === 0) {
                const annoCorrente = m / 12;
                serieTemporale.push({
                    anno: annoCorrente,
                    mese: m,
                    montantePIC: round2(montantePIC),
                    montantePAC: round2(patrimonioTotalePAC),
                    portafoglioPAC: round2(portafoglioPAC),
                    liquiditaPAC: round2(liquiditaPAC),
                    capitaleInvestitoPIC: round2(cTot),
                    capitaleInvestitoPAC: round2(capitaleVersatoNelPortafoglioPAC)
                });
            }
        }

        const datoFinale = serieTemporale[serieTemporale.length - 1];
        const differenzaMontante = datoFinale.montantePIC - datoFinale.montantePAC;
        const percentualeDifferenza = datoFinale.montantePAC > 0
            ? (differenzaMontante / datoFinale.montantePAC) * 100
            : 0;

        return {
            capitaleTotale: round2(cTot),
            orizzonteAnni: anni,
            durataRatePAC: ratePAC,
            rataMensilePAC: round2(rataMensilePAC),
            rendimentoAnnuale: rAnnuo * 100,

            montanteFinalePIC: datoFinale.montantePIC,
            montanteFinalePAC: datoFinale.montantePAC,
            differenzaMontante: round2(differenzaMontante),
            percentualeDifferenza: round2(percentualeDifferenza),

            serieTemporale
        };
    },

    /**
     * SEZIONE 2: Esegue una singola simulazione Monte Carlo con distribuzione normale sui rendimenti.
     * I versamenti PAC avvengono all'INIZIO di ciascun mese m.
     */
    simulaSingoloMonteCarloNormale(p) {
        const {
            cTot,
            totaleMesi,
            ratePAC,
            rataMensilePAC,
            muMensile,
            sigmaMensile
        } = p;

        let montantePIC = cTot;
        let portafoglioPAC = 0;
        let peakPic = montantePIC;
        let peakPac = 0;
        let maxDDPic = 0;
        let maxDDPac = 0;

        for (let m = 1; m <= totaleMesi; m++) {
            // Versamento all'INIZIO del mese m per il PAC
            if (m <= ratePAC) {
                portafoglioPAC += rataMensilePAC;
                if (portafoglioPAC > peakPac) peakPac = portafoglioPAC;
            }

            // Generazione rendimento casuale normale Z ~ N(0, 1) tramite Box-Muller
            const z = randomNormal();
            const rMensile = muMensile + sigmaMensile * z;
            const fattoreCrescita = Math.max(0.0001, 1 + rMensile);

            // Crescita durante il mese m
            montantePIC = montantePIC * fattoreCrescita;
            if (montantePIC > peakPic) peakPic = montantePIC;
            portafoglioPAC = portafoglioPAC * fattoreCrescita;
            if (portafoglioPAC > peakPac) peakPac = portafoglioPAC;

            // Calcola draw‑down percentuale corrente e aggiorna il massimo
            if (peakPic > 0) {
                const ddPic = ((peakPic - montantePIC) / peakPic) * 100;
                if (ddPic > maxDDPic) maxDDPic = ddPic;
            }
            if (peakPac > 0) {
                const ddPac = ((peakPac - portafoglioPAC) / peakPac) * 100;
                if (ddPac > maxDDPac) maxDDPac = ddPac;
            }
        }

        return {
            picFinal: montantePIC,
            pacFinal: portafoglioPAC,
            picDrawdown: maxDDPic,
            pacDrawdown: maxDDPac
        };
    },

    /**
     * Elabora le statistiche (mediana, 10° percentile, 90° percentile e % di vittoria) sulle N simulazioni.
     */
    elaboraStatisticheMonteCarlo(picArray, pacArray, picDDArray, pacDDArray) {
        const totalRuns = picArray.length;

        let vittoriePIC = 0;
        let vittoriePAC = 0;

        for (let i = 0; i < totalRuns; i++) {
            const diff = picArray[i] - pacArray[i];
            if (Math.abs(diff) < 0.01) {
                vittoriePIC += 0.5;
                vittoriePAC += 0.5;
            } else if (diff > 0) {
                vittoriePIC++;
            } else {
                vittoriePAC++;
            }
        }

        // Sort arrays for percentile calculations
        picArray.sort();
        pacArray.sort();
        const picDDSorted = Float64Array.from(picDDArray).slice().sort();
        const pacDDSorted = Float64Array.from(pacDDArray).slice().sort();

        const getPercentile = (arr, pct) => {
            const idx = Math.min(arr.length - 1, Math.max(0, Math.floor(pct * arr.length)));
            return arr[idx];
        };

        const picP10 = getPercentile(picArray, 0.10);
        const picMediana = getPercentile(picArray, 0.50);
        const picP90 = getPercentile(picArray, 0.90);

        const pacP10 = getPercentile(pacArray, 0.10);
        const pacMediana = getPercentile(pacArray, 0.50);
        const pacP90 = getPercentile(pacArray, 0.90);

        // Draw‑down statistics (percentage)
        const maxDDPic = Math.max(...picDDSorted);
        const p10DDPic = getPercentile(picDDSorted, 0.10);
        const medianDDPic = getPercentile(picDDSorted, 0.50);
        const p90DDPic = getPercentile(picDDSorted, 0.90);
        const meanDDPic = picDDSorted.reduce((a, b) => a + b, 0) / picDDSorted.length;

        const maxDDPac = Math.max(...pacDDSorted);
        const p10DDPac = getPercentile(pacDDSorted, 0.10);
        const medianDDPac = getPercentile(pacDDSorted, 0.50);
        const p90DDPac = getPercentile(pacDDSorted, 0.90);
        const meanDDPac = pacDDSorted.reduce((a, b) => a + b, 0) / pacDDSorted.length;

        const probVittoriaPIC = (vittoriePIC / totalRuns) * 100;
        const probVittoriaPAC = (vittoriePAC / totalRuns) * 100;

        return {
            totalRuns,
            probVittoriaPIC: round2(probVittoriaPIC),
            probVittoriaPAC: round2(probVittoriaPAC),

            picP10: round2(picP10),
            picMediana: round2(picMediana),
            picP90: round2(picP90),

            pacP10: round2(pacP10),
            pacMediana: round2(pacMediana),
            pacP90: round2(pacP90),

            diffMediana: round2(picMediana - pacMediana),
            diffP10: round2(picP10 - pacP10),
            diffP90: round2(picP90 - pacP90),

            // draw‑down stats (already in percent)
            maxDDPic: round2(maxDDPic),
            p10DDPic: round2(p10DDPic),
            medianDDPic: round2(medianDDPic),
            p90DDPic: round2(p90DDPic),
            meanDDPic: round2(meanDDPic),

            maxDDPac: round2(maxDDPac),
            p10DDPac: round2(p10DDPac),
            medianDDPac: round2(medianDDPac),
            p90DDPac: round2(p90DDPac),
            meanDDPac: round2(meanDDPac)
        };
    },

    /**
     * SEZIONE 3: Esegue una singola simulazione Monte Carlo con distribuzione t di Student (code grasse / fat tails).
     * I versamenti PAC avvengono all'INIZIO di ciascun mese m.
     */
    simulaSingoloMonteCarloStudentT(p) {
        const {
            cTot,
            totaleMesi,
            ratePAC,
            rataMensilePAC,
            muMensile,
            sigmaMensile,
            gradiLiberta
        } = p;

        let montantePIC = cTot;
        let portafoglioPAC = 0;
        let peakPic = montantePIC;
        let peakPac = 0;
        let maxDDPic = 0;
        let maxDDPac = 0;

        const nu = Math.max(3, Math.round(gradiLiberta || 5));

        for (let m = 1; m <= totaleMesi; m++) {
            // Versamento all'INIZIO del mese m per il PAC
            if (m <= ratePAC) {
                portafoglioPAC += rataMensilePAC;
                if (portafoglioPAC > peakPac) peakPac = portafoglioPAC;
            }

            // Generazione rendimento casuale t di Student con varianza unitaria
            const z = randomStudentT(nu);
            const rMensile = muMensile + sigmaMensile * z;
            const fattoreCrescita = Math.max(0.0001, 1 + rMensile);

            // Crescita durante il mese m
            montantePIC = montantePIC * fattoreCrescita;
            if (montantePIC > peakPic) peakPic = montantePIC;
            portafoglioPAC = portafoglioPAC * fattoreCrescita;
            if (portafoglioPAC > peakPac) peakPac = portafoglioPAC;

            // Calcola draw‑down percentuale corrente e aggiorna il massimo
            if (peakPic > 0) {
                const ddPic = ((peakPic - montantePIC) / peakPic) * 100;
                if (ddPic > maxDDPic) maxDDPic = ddPic;
            }
            if (peakPac > 0) {
                const ddPac = ((peakPac - portafoglioPAC) / peakPac) * 100;
                if (ddPac > maxDDPac) maxDDPac = ddPac;
            }
        }

        return {
            picFinal: montantePIC,
            pacFinal: portafoglioPAC,
            picDrawdown: maxDDPic,
            pacDrawdown: maxDDPac
        };
    },

    /**
     * SEZIONE 4: Esegue una singola simulazione Monte Carlo con distribuzione t di Student Asimmetrica (Skewed t) di Bruce Hansen (1994).
     * I versamenti PAC avvengono all'INIZIO di ciascun mese m.
     */
    simulaSingoloMonteCarloHansenSkewedT(p) {
        const {
            cTot,
            totaleMesi,
            ratePAC,
            rataMensilePAC,
            muMensile,
            sigmaMensile,
            gradiLiberta,
            lambdaAsimmetria
        } = p;

        let montantePIC = cTot;
        let portafoglioPAC = 0;
        let peakPic = montantePIC;
        let peakPac = 0;
        let maxDDPic = 0;
        let maxDDPac = 0;

        const nu = Math.max(3, Math.round(gradiLiberta || 5));
        const lam = Math.max(-0.99, Math.min(0.99, lambdaAsimmetria !== undefined ? lambdaAsimmetria : -0.15));

        for (let m = 1; m <= totaleMesi; m++) {
            // Versamento all'INIZIO del mese m per il PAC
            if (m <= ratePAC) {
                portafoglioPAC += rataMensilePAC;
                if (portafoglioPAC > peakPac) peakPac = portafoglioPAC;
            }

            // Generazione rendimento casuale Hansen Skewed t con media 0 e varianza 1
            const z = randomHansenSkewedT(nu, lam);
            const rMensile = muMensile + sigmaMensile * z;
            const fattoreCrescita = Math.max(0.0001, 1 + rMensile);

            // Crescita durante il mese m
            montantePIC = montantePIC * fattoreCrescita;
            if (montantePIC > peakPic) peakPic = montantePIC;
            portafoglioPAC = portafoglioPAC * fattoreCrescita;
            if (portafoglioPAC > peakPac) peakPac = portafoglioPAC;

            // Calcola draw‑down percentuale corrente e aggiorna il massimo
            if (peakPic > 0) {
                const ddPic = ((peakPic - montantePIC) / peakPic) * 100;
                if (ddPic > maxDDPic) maxDDPic = ddPic;
            }
            if (peakPac > 0) {
                const ddPac = ((peakPac - portafoglioPAC) / peakPac) * 100;
                if (ddPac > maxDDPac) maxDDPac = ddPac;
            }
        }

        return {
            picFinal: montantePIC,
            pacFinal: portafoglioPAC,
            picDrawdown: maxDDPic,
            pacDrawdown: maxDDPac
        };
    },

    /**
     * SEZIONE 5: Esegue una singola simulazione Monte Carlo con processo Autoregressivo AR(1) per il Momentum.
     * I versamenti PAC avvengono all'INIZIO di ciascun mese m.
     */
    simulaSingoloMonteCarloAR1(p) {
        const {
            cTot,
            totaleMesi,
            ratePAC,
            rataMensilePAC,
            muMensile,
            sigmaMensile,
            phiMomentum
        } = p;

        let montantePIC = cTot;
        let portafoglioPAC = 0;
        let peakPic = montantePIC;
        let peakPac = 0;
        let maxDDPic = 0;
        let maxDDPac = 0;

        const phi = Math.max(-0.95, Math.min(0.95, phiMomentum !== undefined ? phiMomentum : 0.10));
        const noiseScale = Math.sqrt(Math.max(0.0001, 1 - phi * phi));

        // Inizializza lo stato AR(1) con un'estrazione dalla distribuzione stazionaria N(0,1)
        let xPrev = randomNormal();

        for (let m = 1; m <= totaleMesi; m++) {
            // Versamento all'INIZIO del mese m per il PAC
            if (m <= ratePAC) {
                portafoglioPAC += rataMensilePAC;
                if (portafoglioPAC > peakPac) peakPac = portafoglioPAC;
            }

            // Aggiornamento dello stato AR(1): X_m = phi * X_{m-1} + sqrt(1 - phi^2) * Z_m
            const z = randomNormal();
            const xCurr = phi * xPrev + noiseScale * z;
            xPrev = xCurr;

            const rMensile = muMensile + sigmaMensile * xCurr;
            const fattoreCrescita = Math.max(0.0001, 1 + rMensile);

            // Crescita durante il mese m
            montantePIC = montantePIC * fattoreCrescita;
            if (montantePIC > peakPic) peakPic = montantePIC;
            portafoglioPAC = portafoglioPAC * fattoreCrescita;
            if (portafoglioPAC > peakPac) peakPac = portafoglioPAC;

            // Calcola draw‑down percentuale corrente e aggiorna il massimo
            if (peakPic > 0) {
                const ddPic = ((peakPic - montantePIC) / peakPic) * 100;
                if (ddPic > maxDDPic) maxDDPic = ddPic;
            }
            if (peakPac > 0) {
                const ddPac = ((peakPac - portafoglioPAC) / peakPac) * 100;
                if (ddPac > maxDDPac) maxDDPac = ddPac;
            }
        }

        return {
            picFinal: montantePIC,
            pacFinal: portafoglioPAC,
            picDrawdown: maxDDPic,
            pacDrawdown: maxDDPac
        };
    }
};

/**
 * Genera un numero casuale con distribuzione normale N(0,1) usando la trasformazione di Box-Muller.
 */
function randomNormal() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Genera un numero casuale con distribuzione t di Student con ν gradi di libertà (ν > 2),
 * scalato in modo che la varianza teorica del fattore di disturbo sia esattamente pari a 1.
 */
function randomStudentT(nu) {
    const z = randomNormal();
    const intNu = Math.max(3, Math.round(nu));
    let v = 0;
    for (let i = 0; i < intNu; i++) {
        const x = randomNormal();
        v += x * x;
    }
    const t = z / Math.sqrt(v / intNu);
    // Varianza teorica di t_ν è ν / (ν - 2). Moltiplichiamo per sqrt((ν - 2) / ν)
    const scaleFactor = Math.sqrt((intNu - 2) / intNu);
    return t * scaleFactor;
}

/**
 * Genera un numero casuale con distribuzione t di Student Asimmetrica (Skewed t) di Bruce Hansen (1994)
 * con ν gradi di libertà e parametro di asimmetria λ (-1 < λ < 1), scalato a media 0 e varianza 1.
 */
function randomHansenSkewedT(nu, lambda) {
    const intNu = Math.max(3, Math.round(nu));
    const lam = Math.max(-0.99, Math.min(0.99, lambda));

    const c = gamma((intNu + 1) / 2) / (Math.sqrt(Math.PI * (intNu - 2)) * gamma(intNu / 2));
    const a = 4 * lam * c * ((intNu - 2) / (intNu - 1));
    const b = Math.sqrt(1 + 3 * lam * lam - a * a);

    const u = Math.random();
    const x = Math.abs(randomStudentT(intNu)); // metà positiva della t di Student standardizzata

    let y;
    if (u < (1 - lam) / 2) {
        y = -(1 - lam) * x;
    } else {
        y = (1 + lam) * x;
    }

    return (y - a) / b;
}

/**
 * Approssimazione di Lanczos per la funzione Gamma di Eulero.
 */
function gamma(n) {
    const g = 7;
    const p = [
        0.99999999999980993, 676.5203681218851, -1259.1392167224028,
        771.32342877765313, -176.61502916214059, 12.507343278686905,
        -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
    ];
    if (n < 0.5) return Math.PI / (Math.sin(Math.PI * n) * gamma(1 - n));
    n -= 1;
    let x = p[0];
    for (let i = 1; i < g + 2; i++) x += p[i] / (n + i);
    const t = n + g + 0.5;
    return Math.sqrt(2 * Math.PI) * Math.pow(t, n + 0.5) * Math.exp(-t) * x;
}

/**
 * Arrotonda un numero a due cifre decimali.
 */
function round2(n) {
    return Math.round((n + Number.EPSILON) * 100) / 100;
}
