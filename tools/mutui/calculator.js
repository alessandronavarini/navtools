/*
=========================================================
NavTools - Importo Mutuo Erogabile
Motore di calcolo
Versione 1.0
=========================================================
*/

const MortgageCalculator = {
    mesiPerAnno: 12,

    quotaRedditoDestinabile(redditoMensile, percentualeDestinabile) {
        return redditoMensile * (percentualeDestinabile / 100);
    },

    rataDisponibile(quotaReddito, rateInCorso) {
        return Math.max(quotaReddito - rateInCorso, 0);
    },

    importoMassimoDaRata(rataMensile, tassoAnnuo, durataAnni) {
        const numeroRate = durataAnni * this.mesiPerAnno;
        const tassoMensile = (tassoAnnuo / 100) / this.mesiPerAnno;

        if (numeroRate <= 0 || rataMensile <= 0) {
            return 0;
        }

        if (tassoMensile === 0) {
            return rataMensile * numeroRate;
        }

        return rataMensile * (1 - Math.pow(1 + tassoMensile, -numeroRate)) / tassoMensile;
    },

    calcola({ redditoMensile, percentualeDestinabile, rateInCorso, tassoAnnuo, durataAnni }) {
        const quotaReddito = this.quotaRedditoDestinabile(redditoMensile, percentualeDestinabile);
        const rataMassima = this.rataDisponibile(quotaReddito, rateInCorso);
        const numeroRate = durataAnni * this.mesiPerAnno;
        const importoMassimo = this.importoMassimoDaRata(rataMassima, tassoAnnuo, durataAnni);

        return {
            quotaReddito: round2(quotaReddito),
            rataMassima: round2(rataMassima),
            numeroRate,
            importoMassimo: round2(importoMassimo)
        };
    }
};
