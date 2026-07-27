/*
=========================================================
NavTools - Interessi Conto Deposito / Certificato di Deposito
Motore di calcolo
Versione 1.0.0
=========================================================
*/

const ContoDepositoCalculator = {
    /**
     * Calcola gli interessi cedolari per le varie frequenze e i totali complessivi.
     * 
     * @param {object} params
     * @param {number} params.importoInvestito - Capitale investito in EUR
     * @param {number} params.tassoAnnuo - Tasso di interesse nominale annuo in % (es. 2)
     * @param {number} params.durataMesi - Durata dell'investimento in mesi (es. 36)
     * @returns {object} Oggetto contenente la tabella delle frequenze e i totali complessivi
     */
    calcola({ importoInvestito, tassoAnnuo, durataMesi }) {
        const tassoDecimale = tassoAnnuo / 100;
        const aliquotaRitenuta = 0.26;

        // Definizione delle frequenze possibili
        const frequenze = [
            { id: "trimestrale", nome: "Trimestrale", mesi: 3 },
            { id: "semestrale", nome: "Semestrale", mesi: 6 },
            { id: "annuale", nome: "Annuale", mesi: 12 },
            { id: "zero_coupon", nome: "Zero Coupon (a scadenza)", mesi: durataMesi } // Zero coupon coincide con la scadenza
        ];

        // Generazione delle righe della tabella
        const righeTabella = frequenze.map(freq => {
            // Se la durata dell'investimento è inferiore alla frequenza della cedola, non è applicabile
            if (durataMesi < freq.mesi) {
                return {
                    frequenza: freq.nome,
                    applicabile: false,
                    tassoLordo: null,
                    cedolaLorda: null,
                    tassoNetto: null,
                    cedolaNetta: null
                };
            }

            let tassoLordoCedola, cedolaLorda, tassoNettoCedola, cedolaNetta;

            if (freq.id === "zero_coupon") {
                // Per lo zero coupon, il rendimento è unico alla scadenza dell'investimento
                tassoLordoCedola = tassoDecimale * (durataMesi / 12);
                tassoNettoCedola = tassoLordoCedola * (1 - aliquotaRitenuta);
                cedolaLorda = importoInvestito * tassoLordoCedola;
                cedolaNetta = importoInvestito * tassoNettoCedola;
            } else {
                // Per le altre frequenze, calcoliamo la singola cedola periodica
                tassoLordoCedola = tassoDecimale * (freq.mesi / 12);
                tassoNettoCedola = tassoLordoCedola * (1 - aliquotaRitenuta);
                cedolaLorda = importoInvestito * tassoLordoCedola;
                cedolaNetta = importoInvestito * tassoNettoCedola;
            }

            return {
                frequenza: freq.nome,
                applicabile: true,
                tassoLordo: tassoLordoCedola * 100, // in percentuale
                cedolaLorda: round2(cedolaLorda),
                tassoNetto: tassoNettoCedola * 100, // in percentuale
                cedolaNetta: round2(cedolaNetta)
            };
        });

        // Calcolo dei totali complessivi sull'intera durata dell'investimento
        const totaleLordoInteressi = importoInvestito * tassoDecimale * (durataMesi / 12);
        const totaleNettoInteressi = totaleLordoInteressi * (1 - aliquotaRitenuta);

        // Imposta di bollo massima annuale (2 per mille, ossia lo 0.2%, con un minimo di 1.00 EUR)
        const impostaBolloMassimaAnnuale = Math.max(1.00, importoInvestito * 0.002);

        return {
            righeTabella,
            totaleLordoInteressi: round2(totaleLordoInteressi),
            totaleNettoInteressi: round2(totaleNettoInteressi),
            impostaBolloMassimaAnnuale: round2(impostaBolloMassimaAnnuale)
        };
    }
};

/**
 * Arrotonda un numero a due cifre decimali.
 * @param {number} num - Il numero da arrotondare
 * @returns {number} Il numero arrotondato
 */
function round2(num) {
    return Math.round((num + Number.EPSILON) * 100) / 100;
}
