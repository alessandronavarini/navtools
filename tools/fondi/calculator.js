/*
=========================================================
NavTools - Disinvestimento Fondi
Motore di calcolo
Versione 1.0
=========================================================

Il modulo contiene solo regole di dominio e formule.
La pagina legge gli input, chiama queste funzioni e si occupa
esclusivamente di mostrare i risultati.
*/

const Calculator = {
    commissioni: {
        "NEF": 10,
        "Etica SGR": 0,
        "Fidelity": 20,
        "Pictet": 15,
        "Invesco": 12,
        "Schroders": 15,
        "Union": 20,
        "Raiffeisen": 0,
        "JPM": 12,
        "F. Templeton": 10,
        "BNP Parvest": 20,
        "Blackrock": 20,
        "Amundi": 10
    },

    quotaPlusvalenza(gainPercent) {
        const gain = gainPercent / 100;

        if (gain <= -1) {
            return null;
        }

        return gain / (1 + gain);
    },

    gainPercentDaPlusvalenza(valoreMercato, plusvalenza) {
        const valoreCarico = valoreMercato - plusvalenza;

        if (valoreCarico <= 0) {
            return null;
        }

        return (plusvalenza / valoreCarico) * 100;
    },

    imposta(lordo, gainPercent, aliquota) {
        const quota = this.quotaPlusvalenza(gainPercent);

        if (quota === null) {
            return null;
        }

        return lordo * quota * (aliquota / 100);
    },

    nettoMassimo(valoreMercato, gainPercent, aliquota, commissione) {
        const impostaInteroComparto = this.imposta(valoreMercato, gainPercent, aliquota);

        if (impostaInteroComparto === null) {
            return null;
        }

        return valoreMercato - impostaInteroComparto - commissione;
    },

    lordoDaNetto({ valoreMercato, gainPercent, aliquota, commissione, netto }) {
        const quota = this.quotaPlusvalenza(gainPercent);

        if (quota === null) {
            return this.errore("Guadagno non valido.");
        }

        const denominatore = 1 - quota * (aliquota / 100);

        if (denominatore <= 0) {
            return this.errore("Parametri fiscali non validi.");
        }

        const lordo = (netto + commissione) / denominatore;
        const nettoMassimo = this.nettoMassimo(valoreMercato, gainPercent, aliquota, commissione);

        if (lordo > valoreMercato) {
            return {
                success: false,
                message: "Netto richiesto non ottenibile con il valore del comparto.",
                nettoMassimo: round2(nettoMassimo),
                commissione
            };
        }

        const imposta = this.imposta(lordo, gainPercent, aliquota);

        return {
            success: true,
            lordo: round2(lordo),
            netto: round2(netto),
            imposta: round2(imposta),
            commissione,
            nettoMassimo: round2(nettoMassimo),
            gainPercent: round2(gainPercent)
        };
    },

    nettoDaLordo({ valoreMercato, gainPercent, aliquota, commissione, lordo }) {
        if (lordo > valoreMercato) {
            return this.errore("L'importo lordo supera il valore del comparto.");
        }

        const imposta = this.imposta(lordo, gainPercent, aliquota);

        if (imposta === null) {
            return this.errore("Guadagno non valido.");
        }

        const netto = lordo - imposta - commissione;
        const nettoMassimo = this.nettoMassimo(valoreMercato, gainPercent, aliquota, commissione);

        return {
            success: true,
            lordo: round2(lordo),
            netto: round2(netto),
            imposta: round2(imposta),
            commissione,
            nettoMassimo: round2(nettoMassimo),
            gainPercent: round2(gainPercent)
        };
    },

    errore(message) {
        return {
            success: false,
            message
        };
    }
};
