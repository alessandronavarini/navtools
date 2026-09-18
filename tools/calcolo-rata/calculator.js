/*
=========================================================
NavTools - Calcolo Rata Finanziamento
Motore di calcolo ammortamento alla francese
=========================================================
*/

const RataCalculator = {
    mesiPerAnno: 12,

    calcolaRataMensile(importo, tassoAnnuo, durataAnni) {
        const numeroRate = durataAnni * this.mesiPerAnno;
        const tassoMensile = (tassoAnnuo / 100) / this.mesiPerAnno;

        if (numeroRate <= 0 || importo <= 0) {
            return 0;
        }

        if (tassoMensile === 0) {
            return importo / numeroRate;
        }

        return importo * (tassoMensile / (1 - Math.pow(1 + tassoMensile, -numeroRate)));
    },

    generaPianoAmmortamento(importo, tassoAnnuo, durataAnni, rataMensile) {
        const numeroRate = durataAnni * this.mesiPerAnno;
        const tassoMensile = (tassoAnnuo / 100) / this.mesiPerAnno;
        let debitoResiduo = importo;
        const piano = [];

        for (let mese = 1; mese <= numeroRate; mese++) {
            const quotaInteressi = debitoResiduo * tassoMensile;
            let quotaCapitale = rataMensile - quotaInteressi;

            if (mese === numeroRate || quotaCapitale > debitoResiduo) {
                quotaCapitale = debitoResiduo;
            }

            debitoResiduo = Math.max(0, debitoResiduo - quotaCapitale);

            piano.push({
                mese,
                rata: round2(quotaCapitale + quotaInteressi),
                quotaCapitale: round2(quotaCapitale),
                quotaInteressi: round2(quotaInteressi),
                debitoResiduo: round2(debitoResiduo)
            });
        }

        return piano;
    },

    calcola({ importo, tassoAnnuo, durataAnni }) {
        const numeroRate = durataAnni * this.mesiPerAnno;
        const rataMensile = this.calcolaRataMensile(importo, tassoAnnuo, durataAnni);
        const totaleRimborsato = rataMensile * numeroRate;
        const totaleInteressi = totaleRimborsato - importo;
        const incidenzaInteressi = totaleRimborsato > 0 ? (totaleInteressi / totaleRimborsato) * 100 : 0;
        const pianoAmmortamento = this.generaPianoAmmortamento(importo, tassoAnnuo, durataAnni, rataMensile);

        return {
            importo: round2(importo),
            tassoAnnuo,
            durataAnni,
            numeroRate,
            rataMensile: round2(rataMensile),
            totaleRimborsato: round2(totaleRimborsato),
            totaleInteressi: round2(totaleInteressi),
            incidenzaInteressi: round2(incidenzaInteressi),
            pianoAmmortamento
        };
    }
};
