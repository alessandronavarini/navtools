// ================================
// NavTools - Premi Aziendali e Welfare
// Logica interfaccia utente
// ================================

// -------------------------------------------------------
// Riferimenti agli elementi del DOM
// -------------------------------------------------------
const el = {
    // Input
    importoPremio:       document.getElementById("importoPremio"),
    sogliaMassima:       document.getElementById("sogliaMassima"),
    importoWelfare:      document.getElementById("importoWelfare"),
    aliquotaIRPEF:       document.getElementById("aliquotaIRPEF"),
    addizionaliIRPEF:    document.getElementById("addizionaliIRPEF"),
    aliquotaINPS:        document.getElementById("aliquotaINPS"),
    impostaSostitutiva:  document.getElementById("impostaSostitutiva"),
    maggiorazioneWelfare: document.getElementById("maggiorazioneWelfare"),

    // Avviso input welfare non valido
    welfareWarningBadge: document.getElementById("welfareWarningBadge"),

    // Output card principale
    resultTitle:         document.getElementById("resultTitle"),
    resultValue:         document.getElementById("resultValue"),
    resultMessage:       document.getElementById("resultMessage"),
    netBustaPagaValue:   document.getElementById("netBustaPagaValue"),
    netWelfareValue:     document.getElementById("netWelfareValue"),

    // Output dettaglio busta paga
    lordoBustaValue:     document.getElementById("lordoBustaValue"),
    quotaAgevolataValue: document.getElementById("quotaAgevolataValue"),
    quotaOrdinariaValue: document.getElementById("quotaOrdinariaValue"),
    inpsValue:           document.getElementById("inpsValue"),
    impostaSostValue:    document.getElementById("impostaSostValue"),
    irpefValue:          document.getElementById("irpefValue"),
    netBustaSummary:     document.getElementById("netBustaSummary"),

    // Output dettaglio welfare
    premioWelfareValue:  document.getElementById("premioWelfareValue"),
    maggiorazioneValue:  document.getElementById("maggiorazioneValue"),
    netWelfareSummary:   document.getElementById("netWelfareSummary")
};

// -------------------------------------------------------
// Inizializzazione
// -------------------------------------------------------
function init() {
    // Ascolta ogni modifica agli input
    document.querySelectorAll("input").forEach(input => {
        input.addEventListener("input", updatePage);
    });

    // Calcola subito al caricamento della pagina
    updatePage();
}

// -------------------------------------------------------
// Ciclo di aggiornamento principale
// -------------------------------------------------------
function updatePage() {
    const values = readValues();
    const validationError = validate(values);

    if (validationError) {
        renderError(validationError);
        return;
    }

    const result = PremioWelfareCalculator.calcola(values);
    renderResult(result);
}

// -------------------------------------------------------
// Lettura dei valori dagli input
// -------------------------------------------------------
function readValues() {
    return {
        importoPremio:        readNumber(el.importoPremio),
        sogliaMassima:        readNumber(el.sogliaMassima),
        importoWelfare:       readNumber(el.importoWelfare),
        aliquotaIRPEF:        readNumber(el.aliquotaIRPEF),
        addizionaliIRPEF:     readNumber(el.addizionaliIRPEF),
        aliquotaINPS:         readNumber(el.aliquotaINPS),
        impostaSostitutiva:   readNumber(el.impostaSostitutiva),
        maggiorazioneWelfare: readNumber(el.maggiorazioneWelfare)
    };
}

// -------------------------------------------------------
// Validazione degli input
// -------------------------------------------------------
function validate(v) {
    // Rimuovi stato di errore dal campo welfare prima di validare
    el.importoWelfare.classList.remove("input-error");
    el.welfareWarningBadge.hidden = true;

    if (!Number.isFinite(v.importoPremio) || v.importoPremio < 0)
        return "Inserisci un importo premio valido (≥ 0).";

    if (!Number.isFinite(v.sogliaMassima) || v.sogliaMassima < 0)
        return "Inserisci una soglia massima valida (≥ 0).";

    if (!Number.isFinite(v.importoWelfare) || v.importoWelfare < 0) {
        markWelfareError("Importo welfare non valido");
        return "Inserisci un importo welfare valido (≥ 0).";
    }

    if (v.importoWelfare > v.sogliaMassima) {
        markWelfareError("Supera la soglia agevolata");
        return `L'importo welfare (${formatEuro(v.importoWelfare)}) supera la soglia massima agevolata (${formatEuro(v.sogliaMassima)}).`;
    }

    if (v.importoWelfare > v.importoPremio) {
        markWelfareError("Supera l'importo del premio");
        return `L'importo welfare (${formatEuro(v.importoWelfare)}) supera l'importo del premio (${formatEuro(v.importoPremio)}).`;
    }

    if (!Number.isFinite(v.aliquotaIRPEF) || v.aliquotaIRPEF < 0 || v.aliquotaIRPEF > 100)
        return "Inserisci un'aliquota IRPEF compresa tra 0% e 100%.";

    if (!Number.isFinite(v.addizionaliIRPEF) || v.addizionaliIRPEF < 0 || v.addizionaliIRPEF > 100)
        return "Inserisci un valore di addizionali IRPEF compreso tra 0% e 100%.";

    if (!Number.isFinite(v.aliquotaINPS) || v.aliquotaINPS < 0 || v.aliquotaINPS > 100)
        return "Inserisci un'aliquota INPS compresa tra 0% e 100%.";

    if (!Number.isFinite(v.impostaSostitutiva) || v.impostaSostitutiva < 0 || v.impostaSostitutiva > 100)
        return "Inserisci un'imposta sostitutiva compresa tra 0% e 100%.";

    if (!Number.isFinite(v.maggiorazioneWelfare) || v.maggiorazioneWelfare < 0)
        return "Inserisci una maggiorazione welfare valida (≥ 0%).";

    return ""; // Nessun errore
}

function markWelfareError(msg) {
    el.importoWelfare.classList.add("input-error");
    el.welfareWarningBadge.hidden = false;
    el.welfareWarningBadge.textContent = msg;
}

// -------------------------------------------------------
// Rendering del risultato
// -------------------------------------------------------
function renderResult(r) {
    // Reset messaggio di errore
    el.resultMessage.textContent = "";
    el.resultMessage.className = "";

    // --- Card principale ---
    el.resultValue.textContent     = formatEuro(r.totalePercepito);
    el.netBustaPagaValue.textContent = formatEuro(r.nettoBusta);
    el.netWelfareValue.textContent  = formatEuro(r.creditoWelfare);

    // --- Dettaglio busta paga ---
    el.lordoBustaValue.textContent     = formatEuro(r.lordoBusta);
    el.quotaAgevolataValue.textContent = formatEuro(r.quotaAgevolata);
    el.quotaOrdinariaValue.textContent = formatEuro(r.quotaOrdinaria);
    el.inpsValue.textContent           = "– " + formatEuro(r.contributiINPS);
    el.impostaSostValue.textContent    = "– " + formatEuro(r.impostaSost);
    el.irpefValue.textContent          = "– " + formatEuro(r.irpefAddizionali);
    el.netBustaSummary.textContent     = formatEuro(r.nettoBusta);

    // --- Dettaglio welfare ---
    el.premioWelfareValue.textContent  = formatEuro(r.premioWelfare);
    el.maggiorazioneValue.textContent  = "+ " + formatEuro(r.maggiorazione);
    el.netWelfareSummary.textContent   = formatEuro(r.creditoWelfare);
}

// -------------------------------------------------------
// Rendering dell'errore
// -------------------------------------------------------
function renderError(message) {
    el.resultMessage.textContent = message;
    el.resultMessage.className = "error";

    const dash = "–";
    el.resultValue.textContent         = dash;
    el.netBustaPagaValue.textContent   = dash;
    el.netWelfareValue.textContent     = dash;
    el.lordoBustaValue.textContent     = dash;
    el.quotaAgevolataValue.textContent = dash;
    el.quotaOrdinariaValue.textContent = dash;
    el.inpsValue.textContent           = dash;
    el.impostaSostValue.textContent    = dash;
    el.irpefValue.textContent          = dash;
    el.netBustaSummary.textContent     = dash;
    el.premioWelfareValue.textContent  = dash;
    el.maggiorazioneValue.textContent  = dash;
    el.netWelfareSummary.textContent   = dash;
}

// -------------------------------------------------------
// Utility
// -------------------------------------------------------

/**
 * Legge il valore numerico da un campo input.
 * Restituisce NaN se il campo è vuoto o non valido.
 */
function readNumber(input) {
    if (!input || input.value === "") return NaN;
    return parseFloat(input.value.replace(",", "."));
}

/**
 * Formatta un numero come valuta EUR.
 */
function formatEuro(value) {
    if (!Number.isFinite(value)) return "–";
    return "€\u00a0" + value.toLocaleString("it-IT", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// -------------------------------------------------------
// Avvio
// -------------------------------------------------------
init();
