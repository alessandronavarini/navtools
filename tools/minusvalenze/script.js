/*
=========================================================
NavTools - Redditi di Capitale e Diversi
Logica interattiva della pagina
Versione 1.0.0
=========================================================

Contenuto:
  1. Classificatore fiscale (Sezione 1)
  2. Linea del tempo minusvalenze (Sezione 2)
  3. Convertitori aliquote 26% / 12,5% (Sezione 3)
*/


/* =========================================================
   1. CLASSIFICATORE FISCALE
   =========================================================
   Determina se un provento è "reddito di capitale" o
   "reddito diverso" e se è compensabile con minusvalenze.
*/

// Matrice di classificazione: strumento × tipo provento
// Struttura: { categoria, compensabile, testo }
const CLASSIFICAZIONE = {
    azioni: {
        cedola: {
            categoria: "capital",
            label:     "Reddito di capitale",
            testo:     "I <strong>dividendi</strong> da azioni sono redditi di capitale: la ritenuta del 26% è applicata direttamente alla fonte dall'intermediario. <strong>Non è possibile compensarli con minusvalenze pregresse</strong>."
        },
        plusvalenza: {
            categoria: "diverse",
            label:     "Reddito diverso",
            testo:     "Le <strong>plusvalenze</strong> su azioni sono redditi diversi. Vengono tassate al 26%, ma <strong>possono essere interamente compensate</strong> da minusvalenze pregresse."
        },
        minusvalenza: {
            categoria: "minus",
            label:     "Minusvalenza",
            testo:     "La <strong>minusvalenza</strong> realizzata dalla vendita di azioni genera un credito fiscale sfruttabile per compensare redditi diversi nell'anno in corso e nei 4 anni successivi."
        }
    },
    obbligazioni: {
        cedola: {
            categoria: "capital",
            label:     "Reddito di capitale",
            testo:     "Le <strong>cedole</strong> obbligazionarie sono redditi di capitale e sono tassate alla fonte al 26% (o 12,5% per Titoli di Stato italiani ed equiparati). <strong>Non sono compensabili</strong> con minusvalenze."
        },
        plusvalenza: {
            categoria: "diverse",
            label:     "Reddito diverso",
            testo:     "Le <strong>plusvalenze</strong> da negoziazione di obbligazioni sono redditi diversi, e sono tassate al 26% (12,5% per Titoli di Stato). <strong>Sono compensabili</strong> con minusvalenze pregresse."
        },
        minusvalenza: {
            categoria: "minus",
            label:     "Minusvalenza",
            testo:     "La <strong>minusvalenza</strong> da vendita di obbligazioni è un reddito diverso. Può essere usata per compensare redditi diversi nell'anno in cui è prodotta e nei 4 anni successivi."
        }
    },
    oicr: {
        cedola: {
            categoria: "capital",
            label:     "Reddito di capitale",
            testo:     "I <strong>proventi distribuiti</strong> da fondi comuni ed ETF (distribuzioni periodiche, rimborsi) sono redditi di capitale. Sono tassati alla fonte con aliquota effettiva basata sulla composizione del portafoglio (tra il 26% e il 12,5%). <strong>Non sono compensabili</strong> con minusvalenze."
        },
        plusvalenza: {
            categoria: "capital",
            label:     "Reddito di capitale",
            testo:     "Attenzione: la <strong>plusvalenza</strong> da rimborso/vendita di quote di OICR è classificata come <strong>reddito di capitale</strong>. Questo significa che <strong>non è compensabile</strong> con minusvalenze pregresse."
        },
        minusvalenza: {
            categoria: "minus",
            label:     "Minusvalenza",
            testo:     "La <strong>minusvalenza</strong> da rimborso/vendita di quote OICR è un reddito diverso e può essere usata per compensare redditi diversi futuri nell'anno in corso e nei 4 anni successivi."
        }
    },
    certificate: {
        cedola: {
            categoria: "diverse",
            label:     "Reddito diverso",
            testo:     "Le <strong>cedole</strong> incassate da Certificate sono classificate come redditi <strong>diversi</strong>, e sono tassate al 26%. A differenza di dividendi e cedole obbligazionarie, <strong>possono essere compensate</strong> con minusvalenze pregresse nell'anno in corso e nei 4 anni successivi alla loro generazione."
        },
        plusvalenza: {
            categoria: "diverse",
            label:     "Reddito diverso",
            testo:     "Le <strong>plusvalenze</strong> realizzate alla scadenza o in caso di vendita anticipata di Certificate sono redditi diversi, tassate al 26%."
        },
        minusvalenza: {
            categoria: "minus",
            label:     "Minusvalenza",
            testo:     "La <strong>minusvalenza</strong> su Certificate è un reddito diverso: può essere sfruttata per compensareredditi diversi nell'anno in corso e nei 4 anni successivi al realizzo."
        }
    },
    etc_etn: {
        cedola: {
            categoria: "capital",
            label:     "Reddito di capitale",
            testo:     "I proventi periodici di ETC/ETN (se previsti) sono redditi di capitale, tassati al 26%. <strong>Non sono compensabili</strong> con minusvalenze."
        },
        plusvalenza: {
            categoria: "diverse",
            label:     "Reddito diverso",
            testo:     "Le <strong>plusvalenze</strong> da vendita di ETC/ETN sono redditi diversi, tassate al 26%. Differentemente dagli OICR, ETC ed ETN rientrano nei redditi diversi anche in caso di plusvalenza."
        },
        minusvalenza: {
            categoria: "minus",
            label:     "Minusvalenza",
            testo:     "La <strong>minusvalenza</strong> da ETC/ETN è un reddito diverso, sfruttabile per compensare plusvalenze nell'anno in corso e nei 4 anni successivi al realizzo."
        }
    }
};

function initClassificatore() {
    const selStrumento  = document.getElementById("instrumentSelect");
    const selProvento   = document.getElementById("incomeTypeSelect");
    const divResult     = document.getElementById("classifierResult");
    const divBadge      = document.getElementById("classifierBadge");
    const pText         = document.getElementById("classifierText");

    function aggiorna() {
        const strumento = selStrumento.value;
        const provento  = selProvento.value;

        if (!strumento || !provento) {
            divResult.hidden = true;
            return;
        }

        const info = CLASSIFICAZIONE[strumento]?.[provento];
        if (!info) {
            divResult.hidden = true;
            return;
        }

        // Imposta badge
        divBadge.className = "result-badge";
        if (info.categoria === "capital") {
            divBadge.classList.add("badge-capital");
        } else if (info.categoria === "diverse") {
            divBadge.classList.add("badge-diverse");
        } else {
            divBadge.classList.add("badge-diverse-minus");
        }
        divBadge.textContent = info.label;

        pText.innerHTML  = info.testo;
        divResult.hidden = false;
    }

    selStrumento.addEventListener("change", aggiorna);
    selProvento.addEventListener("change",  aggiorna);
}


/* =========================================================
   2. LINEA DEL TEMPO DELLE MINUSVALENZE
   =========================================================
   Mostra la data odierna, i 3 anni intermedi e la scadenza
   del 31/12 del quarto anno successivo.
*/

function initTimeline() {
    const annoCorrente = new Date().getFullYear();
    const annoScadenza = annoCorrente + 4;

    // Testi informativi
    document.getElementById("futureDeadlineText").textContent =
        `Le minusvalenze generate nell'anno ${annoCorrente} potranno essere compensate nell'anno in corso e nei 4 anni successivi, entro il 31 dicembre ${annoScadenza}.`;

    document.getElementById("expiringText").textContent =
        `Il 31 dicembre ${annoCorrente} scadono le minusvalenze generate nell'anno ${annoCorrente - 4}: è opportuno utilizzarle prima della fine dell'anno.`;

    // Costruzione linea del tempo
    const container = document.getElementById("timelinePoints");
    container.innerHTML = "";

    // Punti da mostrare: anno corrente (oggi) + 3 anni intermedi + anno scadenza
    const punti = [
        { anno: annoCorrente, sublabel: "Oggi – generazione",      tipo: "today" },
        { anno: annoCorrente + 1, sublabel: "Anno 1",              tipo: "mid" },
        { anno: annoCorrente + 2, sublabel: "Anno 2",              tipo: "mid" },
        { anno: annoCorrente + 3, sublabel: "Anno 3",              tipo: "mid" },
        { anno: annoScadenza,  sublabel: "31/12 – Scadenza finale", tipo: "deadline" }
    ];

    punti.forEach(punto => {
        const div = document.createElement("div");
        div.className = "timeline-point";

        const dot = document.createElement("div");
        dot.className = "timeline-dot" +
            (punto.tipo === "today"    ? " today"    : "") +
            (punto.tipo === "deadline" ? " deadline" : "");

        const year = document.createElement("div");
        year.className = "timeline-year" +
            (punto.tipo === "today"    ? " today-label"    : "") +
            (punto.tipo === "deadline" ? " deadline-label" : "");
        year.textContent = punto.anno;

        const sub = document.createElement("div");
        sub.className = "timeline-sublabel" +
            (punto.tipo === "deadline" ? " deadline-sublabel" : "");
        sub.textContent = punto.sublabel;

        div.appendChild(dot);
        div.appendChild(year);
        div.appendChild(sub);
        container.appendChild(div);
    });
}


/* =========================================================
   3. CONVERTITORI DI ALIQUOTA
   =========================================================
   Rapporto di conversione tra aliquota 26% (ordinaria) e
   12,5% (agevolata Titoli di Stato):
     - Per compensare €1 di plusvalenza al 12,5% servono
       (12,5 / 26) × €1 ≈ €0,4808 di minusvalenza al 26%.
     - Per usare €1 di minusvalenza al 26% servono
       (26 / 12,5) × €1 = €2,08 di plusvalenza al 12,5%.
*/

// Aliquote dichiarate come costanti per facilità di aggiornamento
const ALIQUOTA_ORDINARIA  = 26;    // %
const ALIQUOTA_AGEVOLATA  = 12.5;  // %
const RAPPORTO_AGE_ORD    = ALIQUOTA_AGEVOLATA / ALIQUOTA_ORDINARIA; // ≈ 0.4808
const RAPPORTO_ORD_AGE    = ALIQUOTA_ORDINARIA  / ALIQUOTA_AGEVOLATA; // = 2.08

function initConvertitori() {
    const inputPlusAgevolata  = document.getElementById("plusAgevolataInput");
    const inputMinusDisp      = document.getElementById("minusDisponibileInput");
    const spanMinusNecessarie = document.getElementById("minusNecessarieResult");
    const spanPlusEquivalenti = document.getElementById("plusEquivalentiResult");

    function calcolaMinusNecessarie() {
        const plus = parseFloat(inputPlusAgevolata.value.replace(",", "."));
        if (!isNaN(plus) && plus >= 0) {
            // Minusvalenza (26%) necessaria = plusvalenza (12,5%) × (12,5 / 26)
            const minus = plus * RAPPORTO_AGE_ORD;
            spanMinusNecessarie.textContent = formatEuro(minus);
        } else {
            spanMinusNecessarie.textContent = "—";
        }
    }

    function calcolaPlusEquivalenti() {
        const minus = parseFloat(inputMinusDisp.value.replace(",", "."));
        if (!isNaN(minus) && minus >= 0) {
            // Plusvalenza (12,5%) equivalente = minusvalenza (26%) × (26 / 12,5)
            const plus = minus * RAPPORTO_ORD_AGE;
            spanPlusEquivalenti.textContent = formatEuro(plus);
        } else {
            spanPlusEquivalenti.textContent = "—";
        }
    }

    inputPlusAgevolata.addEventListener("input", calcolaMinusNecessarie);
    inputMinusDisp.addEventListener("input",    calcolaPlusEquivalenti);

    // Calcola i valori iniziali al caricamento
    calcolaMinusNecessarie();
    calcolaPlusEquivalenti();
}


/* =========================================================
   UTILITY
   ========================================================= */

function formatEuro(value) {
    if (!Number.isFinite(value)) return "—";
    return "€\u00a0" + value.toLocaleString("it-IT", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


/* =========================================================
   AVVIO
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    initClassificatore();
    initTimeline();
    initConvertitori();
});
