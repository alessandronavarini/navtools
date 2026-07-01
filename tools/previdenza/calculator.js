/*
=========================================================
NavTools - Previdenza Complementare
Motore di calcolo
Versione 1.1.0
=========================================================

LOGICA DI CALCOLO:

Caso "busta_paga":
  - Si applica la detrazione per lavoro dipendente (art. 13 TUIR) sia al
    reddito senza contributo sia al reddito con contributo.
  - Il risparmio IRPEF include quindi anche la variazione della detrazione.
  - Questo rappresenta il beneficio MASSIMO TEORICO (può essere inferiore
    in presenza di altri redditi o situazioni fiscali particolari).

Caso "bonifico":
  - La detrazione per lavoro dipendente NON viene calcolata.
  - Il beneficio fiscale deriva esclusivamente dalla deduzione dell'imponibile
    IRPEF e dal risparmio sulle addizionali locali.
  - Si evita in questo modo di sovrastimare il beneficio.

Limite deducibilità 2025: € 5.300,00
*/

// -------------------------------------------------------
// Costanti per gli scaglioni IRPEF 2025
// -------------------------------------------------------
const IRPEF_SCAGLIONI_2025 = [
    { soglia: 28000,   aliquota: 0.23 },
    { soglia: 50000,   aliquota: 0.35 },
    { soglia: Infinity, aliquota: 0.43 }
];

// -------------------------------------------------------
// Costanti per le detrazioni per lavoro dipendente 2025
// (Art. 13 TUIR)
// -------------------------------------------------------
const DETRAZIONE_LAVORO_DIPENDENTE_2025 = {
    soglia1:   15000,
    soglia2:   28000,
    soglia3:   50000,
    base1:     1955,
    base2:     1910,
    aggiunta2: 1190,
    divisore2: 13000,
    divisore3: 22000
};

// -------------------------------------------------------
// Limite annuo di deducibilità 2025
// -------------------------------------------------------
const LIMITE_DEDUCIBILITA_2025 = 5300;

// -------------------------------------------------------
// Oggetto principale del calcolatore
// -------------------------------------------------------
const PensionCalculator = {

    /**
     * Calcola l'IRPEF lorda in base agli scaglioni 2025.
     * @param {number} reddito - Reddito imponibile in euro.
     * @returns {number} IRPEF lorda.
     */
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

    /**
     * Calcola la detrazione per lavoro dipendente 2025.
     * @param {number} reddito - Reddito imponibile in euro.
     * @returns {number} Detrazione spettante.
     */
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

    /**
     * Esegue il calcolo completo del risparmio fiscale.
     *
     * @param {object} params
     * @param {string} params.inputMode           - "RAL" oppure "IRPEF"
     * @param {number} params.ral                 - RAL / imponibile INPS (usato se inputMode === "RAL")
     * @param {number} params.aliquotaINPS        - Aliquota contributiva INPS in %
     * @param {number} params.imponibileIRPEFInput - Imponibile IRPEF (usato se inputMode === "IRPEF")
     * @param {number} params.importoVersamento   - Importo annuo da versare al fondo pensione
     * @param {number} params.addRegionale        - Aliquota addizionale regionale in %
     * @param {number} params.addComunale         - Aliquota addizionale comunale in %
     * @param {string} params.modalitaVersamento  - "busta_paga" oppure "bonifico"
     * @returns {object} Risultato del calcolo con tutti i dettagli.
     */
    calcola({ inputMode, ral, aliquotaINPS, imponibileIRPEFInput, importoVersamento,
              addRegionale, addComunale, modalitaVersamento }) {

        // ---- Step 1: Base imponibile IRPEF ----
        const imponibileBase = (inputMode === 'RAL')
            ? ral * (1 - aliquotaINPS / 100)
            : imponibileIRPEFInput;

        // ---- Step 2: Versamento previdenziale deducibile ----
        let contributoDeducibile;
        let contributoEccedente;

        if (importoVersamento > LIMITE_DEDUCIBILITA_2025) {
            contributoDeducibile = LIMITE_DEDUCIBILITA_2025;
            contributoEccedente  = importoVersamento - LIMITE_DEDUCIBILITA_2025;
        } else {
            contributoDeducibile = importoVersamento;
            contributoEccedente  = 0;
        }

        // ---- Step 3: Imponibili confronto ----
        const imponibileSenza = imponibileBase;
        const imponibileCon   = Math.max(0, imponibileBase - contributoDeducibile);

        // ---- Step 4: IRPEF lorda ----
        const irpefLordaSenza = this.irpefLorda(imponibileSenza);
        const irpefLordaCon   = this.irpefLorda(imponibileCon);

        // ---- Step 5: Detrazione lavoro dipendente (solo busta paga) ----
        const applicaDetrazione = (modalitaVersamento === 'busta_paga');

        const detrazioneSenza = applicaDetrazione ? this.detrazioneLD(imponibileSenza) : 0;
        const detrazioneCon   = applicaDetrazione ? this.detrazioneLD(imponibileCon)   : 0;

        // ---- Step 6: IRPEF netta ----
        const irpefNettaSenza = Math.max(0, irpefLordaSenza - detrazioneSenza);
        const irpefNettaCon   = Math.max(0, irpefLordaCon   - detrazioneCon);

        const risparmioIrpef = irpefNettaSenza - irpefNettaCon;

        // ---- Step 7: Addizionali locali ----
        const addRegionaleSenza = imponibileSenza * (addRegionale / 100);
        const addRegionaleCon   = imponibileCon   * (addRegionale / 100);
        const risparmioAddReg   = contributoDeducibile * (addRegionale / 100);

        const addComunaleSenza  = imponibileSenza * (addComunale / 100);
        const addComunaleCon    = imponibileCon   * (addComunale / 100);
        const risparmioAddCom   = contributoDeducibile * (addComunale / 100);

        // ---- Step 8: Totale imposte ----
        const totaleImposteSenza = irpefNettaSenza + addRegionaleSenza + addComunaleSenza;
        const totaleImposteCon   = irpefNettaCon   + addRegionaleCon   + addComunaleCon;

        // ---- Step 9: Riepilogo ----
        const risparmioTotale     = risparmioIrpef + risparmioAddReg + risparmioAddCom;
        const costoEffettivo      = importoVersamento - risparmioTotale;
        const rendimentoImplicito = importoVersamento > 0
            ? (risparmioTotale / importoVersamento) * 100
            : 0;

        return {
            // Imponibili
            imponibileSenza:    round2(imponibileSenza),
            imponibileCon:      round2(imponibileCon),
            // IRPEF lorda
            irpefLordaSenza:    round2(irpefLordaSenza),
            irpefLordaCon:      round2(irpefLordaCon),
            // Detrazione (sarà 0 se modalità bonifico)
            detrazioneSenza:    round2(detrazioneSenza),
            detrazioneCon:      round2(detrazioneCon),
            applicaDetrazione,
            // IRPEF netta
            irpefNettaSenza:    round2(irpefNettaSenza),
            irpefNettaCon:      round2(irpefNettaCon),
            // Addizionali
            addRegionaleSenza:  round2(addRegionaleSenza),
            addRegionaleCon:    round2(addRegionaleCon),
            addComunaleSenza:   round2(addComunaleSenza),
            addComunaleCon:     round2(addComunaleCon),
            // Totali
            totaleImposteSenza: round2(totaleImposteSenza),
            totaleImposteCon:   round2(totaleImposteCon),
            // Contributo
            contributoDeducibile: round2(contributoDeducibile),
            contributoEccedente:  round2(contributoEccedente),
            // Risparmi
            risparmioIrpef:     round2(risparmioIrpef),
            risparmioAddReg:    round2(risparmioAddReg),
            risparmioAddCom:    round2(risparmioAddCom),
            risparmioTotale:    round2(risparmioTotale),
            // Costo effettivo e rendimento
            costoEffettivo:      round2(costoEffettivo),
            rendimentoImplicito: round2(rendimentoImplicito),
            // Modalità di versamento (passata all'UI)
            modalitaVersamento
        };
    }
};
