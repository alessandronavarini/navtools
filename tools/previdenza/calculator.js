/*
=========================================================
NavTools - Previdenza Complementare
Motore di calcolo
Versione 1.0.0
=========================================================
*/

// Costanti per gli scaglioni IRPEF 2025
const IRPEF_SCAGLIONI_2025 = [
    { soglia: 28000, aliquota: 0.23 },
    { soglia: 50000, aliquota: 0.35 },
    { soglia: Infinity, aliquota: 0.43 }
];

// Costanti per le detrazioni per lavoro dipendente 2025 (Art. 13 TUIR)
const DETRAZIONE_LAVORO_DIPENDENTE_2025 = {
    soglia1: 15000,
    soglia2: 28000,
    soglia3: 50000,
    base1: 1955,
    base2: 1910,
    aggiunta2: 1190,
    divisore2: 13000,
    divisore3: 22000
};

const PensionCalculator = {
    // Calcola l'IRPEF Lorda in base agli scaglioni 2025
    irpefLorda(reddito) {
        if (reddito <= 0) return 0;

        let imposta = 0;
        let precedenteSoglia = 0;

        for (const scaglione of IRPEF_SCAGLIONI_2025) {
            if (reddito > scaglione.soglia) {
                imposta += (scaglione.soglia - precedenteSoglia) * scaglione.aliquota;
                precedenteSoglia = scaglione.soglia;
            } else {
                imposta += (reddito - precedenteSoglia) * scaglione.aliquota;
                break;
            }
        }
        return imposta;
    },

    // Calcola la detrazione per lavoro dipendente 2025
    detrazioneLD(reddito) {
        const p = DETRAZIONE_LAVORO_DIPENDENTE_2025;
        if (reddito <= 0) return 0;
        if (reddito <= p.soglia1) return p.base1;
        if (reddito <= p.soglia2) {
            return p.base2 + p.aggiunta2 * (p.soglia2 - reddito) / p.divisore2;
        }
        if (reddito <= p.soglia3) {
            return Math.max(0, p.base2 * (p.soglia3 - reddito) / p.divisore3);
        }
        return 0;
    },

    // Esegue il calcolo completo
    calcola({ inputMode, ral, aliquotaINPS, imponibileIRPEFInput, importoVersamento, addRegionale, addComunale, modalitaVersamento }) {
        // Step 1 — Base imponibile IRPEF
        const imponibileBase = (inputMode === 'RAL')
            ? ral * (1 - aliquotaINPS / 100)
            : imponibileIRPEFInput;

        // Versamento previdenziale deducibile
        let contributoDeducibile = 0;
        let contributoEccedente = 0;

        if (importoVersamento > 5300) {
            contributoDeducibile = 5300;
            contributoEccedente = importoVersamento - 5300;
        } else {
            contributoDeducibile = importoVersamento;
            contributoEccedente = 0;
        }

        // Step 2 — Imponibili con e senza contributo
        const imponibileSenza = imponibileBase;
        const imponibileCon = Math.max(0, imponibileBase - contributoDeducibile);

        // Step 3 & 4 & 5 — Lorda, Detrazioni, Netta IRPEF
        const irpefLordaSenza = this.irpefLorda(imponibileSenza);
        const irpefLordaCon = this.irpefLorda(imponibileCon);

        const detrazioneSenza = this.detrazioneLD(imponibileSenza);
        const detrazioneCon = this.detrazioneLD(imponibileCon);

        const irpefNettaSenza = Math.max(0, irpefLordaSenza - detrazioneSenza);
        const irpefNettaCon = Math.max(0, irpefLordaCon - detrazioneCon);

        const risparmioIrpef = irpefNettaSenza - irpefNettaCon;

        // Step 6 — Addizionali
        const addRegionaleSenza = imponibileSenza * (addRegionale / 100);
        const addRegionaleCon = imponibileCon * (addRegionale / 100);
        const risparmioAddReg = contributoDeducibile * (addRegionale / 100);

        const addComunaleSenza = imponibileSenza * (addComunale / 100);
        const addComunaleCon = imponibileCon * (addComunale / 100);
        const risparmioAddCom = contributoDeducibile * (addComunale / 100);

        // Totale imposte
        const totaleImposteSenza = irpefNettaSenza + addRegionaleSenza + addComunaleSenza;
        const totaleImposteCon = irpefNettaCon + addRegionaleCon + addComunaleCon;

        // Step 7 — Summary figures
        const risparmioTotale = risparmioIrpef + risparmioAddReg + risparmioAddCom;
        const costoEffettivo = importoVersamento - risparmioTotale;
        const rendimentoImplicito = importoVersamento > 0 ? (risparmioTotale / importoVersamento) * 100 : 0;
        const beneficioMensile = risparmioTotale / 12;

        return {
            imponibileSenza: round2(imponibileSenza),
            imponibileCon: round2(imponibileCon),
            irpefLordaSenza: round2(irpefLordaSenza),
            irpefLordaCon: round2(irpefLordaCon),
            detrazioneSenza: round2(detrazioneSenza),
            detrazioneCon: round2(detrazioneCon),
            irpefNettaSenza: round2(irpefNettaSenza),
            irpefNettaCon: round2(irpefNettaCon),
            addRegionaleSenza: round2(addRegionaleSenza),
            addRegionaleCon: round2(addRegionaleCon),
            addComunaleSenza: round2(addComunaleSenza),
            addComunaleCon: round2(addComunaleCon),
            totaleImposteSenza: round2(totaleImposteSenza),
            totaleImposteCon: round2(totaleImposteCon),
            contributoDeducibile: round2(contributoDeducibile),
            contributoEccedente: round2(contributoEccedente),
            risparmioIrpef: round2(risparmioIrpef),
            risparmioAddReg: round2(risparmioAddReg),
            risparmioAddCom: round2(risparmioAddCom),
            risparmioTotale: round2(risparmioTotale),
            costoEffettivo: round2(costoEffettivo),
            rendimentoImplicito: round2(rendimentoImplicito),
            beneficioMensile: round2(beneficioMensile)
        };
    }
};
