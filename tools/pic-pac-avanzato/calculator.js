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

            // Crescita durante il mese m
            montantePIC = montantePIC * (1 + rMensile);
            if (montantePIC > peakPic) peakPic = montantePIC;
            portafoglioPAC = portafoglioPAC * (1 + rMensile);
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
        const medianDDPic = getPercentile(picDDSorted, 0.50);
        const meanDDPic = picDDSorted.reduce((a, b) => a + b, 0) / picDDSorted.length;

        const maxDDPac = Math.max(...pacDDSorted);
        const medianDDPac = getPercentile(pacDDSorted, 0.50);
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
            medianDDPic: round2(medianDDPic),
            meanDDPic: round2(meanDDPic),
            maxDDPac: round2(maxDDPac),
            medianDDPac: round2(medianDDPac),
            meanDDPac: round2(meanDDPac)
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
 * Arrotonda un numero a due cifre decimali.
 */
function round2(n) {
    return Math.round((n + Number.EPSILON) * 100) / 100;
}
