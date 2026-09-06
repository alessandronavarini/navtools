/*
=========================================================
NavTools - Calcolatore PAC / PIC
Motore di calcolo
Versione 1.0.0
=========================================================

LOGICA DI CALCOLO:
------------------

1. MODALITÀ PAC (Piano di Accumulo Capitale):
   - Versamento Iniziale (V0) al mese 0
   - Versamento Mensile (M) al termine di ciascun mese m (da 1 a N, dove N = 12 * Anni)
   - Rendimento mensile composto: r_m = (1 + r_g)^(1/12) - 1, dove r_g è il rendimento annuo lordo
   - Evoluzione mese per mese:
       W_g(0) = V0
       W_g(m) = W_g(m-1) * (1 + r_m) + M
       CapitaleInvestito(m) = V0 + m * M
   - Al termine dell'anno y (mese m = 12 * y):
       Capitale Investito = V0 + 12 * y * M
       Controvalore Lordo = W_g(12 * y)
       Guadagno Lordo = max(0, Controvalore Lordo - Capitale Investito)
       Imposte (Regime Amministrato alla liquidazione) = Guadagno Lordo * aliquotaTasse
       Controvalore Netto = Controvalore Lordo - Imposte

2. MODALITÀ PIC (Piano di Investimento Capitale / Unica Soluzione):
   - Versamento Iniziale (V0) all'anno 0
   - Versamento Mensile = 0
   - Al termine dell'anno y:
       Capitale Investito = V0
       Controvalore Lordo = V0 * (1 + r_g)^y
       Guadagno Lordo = max(0, Controvalore Lordo - V0)
       Imposte = Guadagno Lordo * aliquotaTasse
       Controvalore Netto = Controvalore Lordo - Imposte
=========================================================
*/

const PacPicCalculator = {
    /**
     * Esegue la simulazione completa anno per anno per PAC o PIC.
     *
     * @param {object} p - Parametri di input
     * @param {string} p.modalita          - "PAC" oppure "PIC"
     * @param {number} p.durataAnni        - Durata in anni (es. 10)
     * @param {number} p.versamentoIniziale - Versamento iniziale V0 in EUR
     * @param {number} p.versamentoMensile  - Versamento mensile M in EUR (solo PAC)
     * @param {number} p.rendimentoAnnuoLordo - Rendimento annuo lordo in % (es. 7)
     * @param {number} p.aliquotaTasse     - Aliquota fiscale in % (es. 26)
     * @returns {object} Risultato finale e serie temporale anno per anno
     */
    calcola(p) {
        const {
            modalita,
            durataAnni,
            versamentoIniziale,
            versamentoMensile,
            rendimentoAnnuoLordo,
            aliquotaTasse
        } = p;

        const isPAC = modalita === "PAC";
        const anni = Math.max(1, Math.min(50, Math.round(durataAnni)));
        const vIniziale = Math.max(0, versamentoIniziale);
        const vMensile = isPAC ? Math.max(0, versamentoMensile) : 0;
        const rAnnuo = Math.max(-99, rendimentoAnnuoLordo) / 100;
        const tTax = Math.max(0, Math.min(100, aliquotaTasse)) / 100;

        // Rendimento mensile composto equivalente: (1 + r_annuo)^(1/12) - 1
        const rMensile = Math.pow(1 + rAnnuo, 1 / 12) - 1;

        const serieTemporale = [];

        // Anno 0 (Stato Iniziale)
        let montanteLordo = vIniziale;
        let capitaleInvestito = vIniziale;

        serieTemporale.push({
            anno: 0,
            mese: 0,
            capitaleInvestito: round2(capitaleInvestito),
            controvaloreLordo: round2(montanteLordo),
            controvaloreNetto: round2(montanteLordo),
            guadagnoLordo: 0,
            guadagnoNetto: 0,
            imposteStimate: 0
        });

        // Simulazione mese per mese per raccogliere i dati annuali
        const totaleMesi = anni * 12;

        for (let m = 1; m <= totaleMesi; m++) {
            // Crescita del capitale accumulato + nuovo versamento mensile
            montanteLordo = montanteLordo * (1 + rMensile) + vMensile;
            capitaleInvestito += vMensile;

            // Rilevamento dati alla fine di ciascun anno (m = 12, 24, 36...)
            if (m % 12 === 0) {
                const annoCorrente = m / 12;
                const guadagnoLordo = Math.max(0, montanteLordo - capitaleInvestito);
                const imposteStimate = guadagnoLordo * tTax;
                const controvaloreNetto = montanteLordo - imposteStimate;
                const guadagnoNetto = Math.max(0, controvaloreNetto - capitaleInvestito);

                serieTemporale.push({
                    anno: annoCorrente,
                    mese: m,
                    capitaleInvestito: round2(capitaleInvestito),
                    controvaloreLordo: round2(montanteLordo),
                    controvaloreNetto: round2(controvaloreNetto),
                    guadagnoLordo: round2(guadagnoLordo),
                    guadagnoNetto: round2(guadagnoNetto),
                    imposteStimate: round2(imposteStimate)
                });
            }
        }

        const datoFinale = serieTemporale[serieTemporale.length - 1];

        return {
            modalita,
            durataAnni: anni,
            capitaleInvestitoFinale: datoFinale.capitaleInvestito,
            controvaloreLordoFinale: datoFinale.controvaloreLordo,
            controvaloreNettoFinale: datoFinale.controvaloreNetto,
            guadagnoLordoFinale: datoFinale.guadagnoLordo,
            guadagnoNettoFinale: datoFinale.guadagnoNetto,
            imposteFinali: datoFinale.imposteStimate,
            serieTemporale
        };
    }
};

/**
 * Arrotonda un numero a due cifre decimali.
 * @param {number} n
 * @returns {number}
 */
function round2(n) {
    return Math.round((n + Number.EPSILON) * 100) / 100;
}
