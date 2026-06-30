/*
=========================================================
NavTools - Prestazioni Previdenza Complementare
Motore di calcolo
Versione 1.0.0
=========================================================
*/

const TaxRateCalculator = {
    calculateRates(years) {
        // Aliquota 15% -> 9%
        let rate15to9 = 15;
        if (years > 15) {
            rate15to9 = Math.max(9, 15 - (years - 15) * 0.30);
        }

        // Aliquota 20% -> 15%
        let rate20to15 = 20;
        if (years > 15) {
            rate20to15 = Math.max(15, 20 - (years - 15) * 0.25);
        }

        return {
            years: Math.round(years),
            rate15to9: round2(rate15to9),
            rate20to15: round2(rate20to15)
        };
    }
};
