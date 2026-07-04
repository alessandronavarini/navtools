/*
=========================================================
NavTools - Premi Aziendali e Welfare
Motore di calcolo
Versione 1.0.0
=========================================================

LOGICA DI CALCOLO
-----------------

Il premio totale si suddivide in due parti:

  A) Premio in busta paga (lordo_busta = importoPremio - importoWelfare)
     Si suddivide a sua volta in:
       A1) Quota agevolata: parte entro la soglia rimasta dopo il welfare
           - I contributi INPS riducono l'imponibile
           - Imposta sostitutiva applicata su: quotaAgevolata - INPS(agevolata)
       A2) Quota ordinaria: eventuale eccedenza rispetto alla soglia
           - I contributi INPS riducono l'imponibile
           - IRPEF + addizionali applicata su: quotaOrdinaria - INPS(ordinaria)

  B) Premio in welfare (importoWelfare)
     - Esente da imposte
     - Il datore aggiunge la maggiorazione (%) sul valore welfare
     - Credito welfare = importoWelfare × (1 + maggiorazione/100)

NOTA: lo strumento è semplificato:
  - Non considera le detrazioni per lavoro dipendente
  - Non considera il possibile salto di scaglione causato dal premio
  - L'INPS è calcolato sull'intero lordo in busta; viene poi sottratto
    proporzionalmente dalla base imponibile di ciascuna quota
=========================================================
*/

// -------------------------------------------------------
// Limite agevolato 2026 (aggiornabile annualmente)
// -------------------------------------------------------
const SOGLIA_AGEVOLATA_DEFAULT_2026 = 5000; // EUR

const PremioWelfareCalculator = {

    /**
     * Esegue il calcolo completo della simulazione premio/welfare.
     *
     * @param {object} p - Parametri di input
     * @param {number} p.importoPremio      - Importo lordo del premio (EUR)
     * @param {number} p.sogliaMassima      - Soglia massima agevolata (EUR)
     * @param {number} p.importoWelfare     - Parte destinata al welfare (EUR, <= min(soglia, premio))
     * @param {number} p.aliquotaIRPEF      - Aliquota marginale IRPEF (%)
     * @param {number} p.addizionaliIRPEF   - Addizionali IRPEF totali (%)
     * @param {number} p.aliquotaINPS       - Aliquota INPS lavoratore (%)
     * @param {number} p.impostaSostitutiva - Imposta sostitutiva premio (%)
     * @param {number} p.maggiorazioneWelfare - Maggiorazione datore su welfare (%)
     * @returns {object} Risultato dettagliato del calcolo
     */
    calcola(p) {
        const {
            importoPremio,
            sogliaMassima,
            importoWelfare,
            aliquotaIRPEF,
            addizionaliIRPEF,
            aliquotaINPS,
            impostaSostitutiva,
            maggiorazioneWelfare
        } = p;

        // --- Parte welfare ---
        const premioWelfare     = importoWelfare;
        const maggiorazione     = premioWelfare * (maggiorazioneWelfare / 100);
        const creditoWelfare    = premioWelfare + maggiorazione;

        // --- Parte in busta paga ---
        const lordoBusta        = importoPremio - importoWelfare;

        // Quota agevolata rimasta in busta (entro soglia, non destinata al welfare)
        const sogliaResiduaBusta = Math.max(0, sogliaMassima - importoWelfare);
        const quotaAgevolata     = Math.min(lordoBusta, sogliaResiduaBusta);

        // Quota ordinaria: eccedenza rispetto alla soglia
        const quotaOrdinaria     = Math.max(0, lordoBusta - sogliaResiduaBusta);

        // INPS: si applica sull'intero lordo in busta
        const contributiINPS     = lordoBusta * (aliquotaINPS / 100);

        // I contributi INPS sono deducibili dall'imponibile fiscale.
        // Vengono sottratti proporzionalmente dalla quota agevolata e da quella ordinaria.
        // Imponibile agevolato netto INPS
        const imponibileAgevolato = Math.max(0, quotaAgevolata - quotaAgevolata * (aliquotaINPS / 100));
        // Imponibile ordinario netto INPS
        const imponibileOrdinario = Math.max(0, quotaOrdinaria - quotaOrdinaria * (aliquotaINPS / 100));

        // Imposta sostitutiva: sulla quota agevolata al netto INPS
        const impostaSost        = imponibileAgevolato * (impostaSostitutiva / 100);

        // IRPEF + addizionali: sulla quota ordinaria al netto INPS
        const aliquotaTotaleOrd  = (aliquotaIRPEF + addizionaliIRPEF) / 100;
        const irpefAddizionali   = imponibileOrdinario * aliquotaTotaleOrd;

        // Netto in busta = lordo - INPS - imposta sostitutiva - IRPEF su quota ordinaria
        const totaleTasseBusta   = contributiINPS + impostaSost + irpefAddizionali;
        const nettoBusta         = Math.max(0, lordoBusta - totaleTasseBusta);

        // Valore totale percepito
        const totalePercepito    = nettoBusta + creditoWelfare;

        return {
            // Busta paga
            lordoBusta:       round2(lordoBusta),
            quotaAgevolata:   round2(quotaAgevolata),
            quotaOrdinaria:   round2(quotaOrdinaria),
            contributiINPS:   round2(contributiINPS),
            impostaSost:      round2(impostaSost),
            irpefAddizionali: round2(irpefAddizionali),
            totaleTasseBusta: round2(totaleTasseBusta),
            nettoBusta:       round2(nettoBusta),
            // Welfare
            premioWelfare:    round2(premioWelfare),
            maggiorazione:    round2(maggiorazione),
            creditoWelfare:   round2(creditoWelfare),
            // Totale
            totalePercepito:  round2(totalePercepito)
        };
    }
};

/**
 * Arrotonda a 2 cifre decimali.
 * @param {number} n
 * @returns {number}
 */
function round2(n) {
    return Math.round(n * 100) / 100;
}
