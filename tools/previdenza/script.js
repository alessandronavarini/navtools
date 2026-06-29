// ================================
// Stato e riferimenti pagina
// ================================

const elements = {
    // Mode
    incomeModeRAL: document.querySelector('input[name="incomeMode"][value="RAL"]'),
    incomeModeIRPEF: document.querySelector('input[name="incomeMode"][value="IRPEF"]'),
    ralInputs: document.getElementById("ralInputs"),
    irpefInputs: document.getElementById("irpefInputs"),

    // Inputs
    ral: document.getElementById("ral"),
    inpsRate: document.getElementById("inpsRate"),
    taxableIrpef: document.getElementById("taxableIrpef"),
    annualContribution: document.getElementById("annualContribution"),
    contributionWarningBadge: document.getElementById("contributionWarningBadge"),

    paymentModeBustaPaga: document.querySelector('input[name="paymentMode"][value="busta_paga"]'),
    paymentModeBonifico: document.querySelector('input[name="paymentMode"][value="bonifico"]'),
    paymentModeNote: document.getElementById("paymentModeNote"),

    regionalTax: document.getElementById("regionalTax"),
    municipalTax: document.getElementById("municipalTax"),

    // Outputs Card
    resultValue: document.getElementById("resultValue"),
    resultMessage: document.getElementById("resultMessage"),
    effectiveCostValue: document.getElementById("effectiveCostValue"),
    taxReturnRateText: document.getElementById("taxReturnRateText"),
    monthlyBenefitRow: document.getElementById("monthlyBenefitRow"),
    monthlyBenefitValue: document.getElementById("monthlyBenefitValue"),

    // Output Details
    taxableWithoutValue: document.getElementById("taxableWithoutValue"),
    taxableWithValue: document.getElementById("taxableWithValue"),
    grossWithoutValue: document.getElementById("grossWithoutValue"),
    grossWithValue: document.getElementById("grossWithValue"),
    deductionWithoutValue: document.getElementById("deductionWithoutValue"),
    deductionWithValue: document.getElementById("deductionWithValue"),
    netWithoutValue: document.getElementById("netWithoutValue"),
    netWithValue: document.getElementById("netWithValue"),
    regWithoutValue: document.getElementById("regWithoutValue"),
    regWithValue: document.getElementById("regWithValue"),
    comWithoutValue: document.getElementById("comWithoutValue"),
    comWithValue: document.getElementById("comWithValue"),
    totalTaxWithoutValue: document.getElementById("totalTaxWithoutValue"),
    totalTaxWithValue: document.getElementById("totalTaxWithValue"),

    // Output Summary
    savingIrpefValue: document.getElementById("savingIrpefValue"),
    savingAdditionsValue: document.getElementById("savingAdditionsValue"),
    savingTotalValue: document.getElementById("savingTotalValue"),

    excessWarningBlock: document.getElementById("excessWarningBlock"),
    excessWarningText: document.getElementById("excessWarningText")
};

function init() {
    bindEvents();
    updateInputVisibility();
    updatePage();
}

function bindEvents() {
    document.querySelectorAll("input").forEach((input) => {
        input.addEventListener("input", updatePage);
        input.addEventListener("change", updatePage);
    });
}

function updateInputVisibility() {
    const isRAL = elements.incomeModeRAL.checked;
    if (isRAL) {
        elements.ralInputs.hidden = false;
        elements.irpefInputs.hidden = true;
        elements.ral.disabled = false;
        elements.inpsRate.disabled = false;
        elements.taxableIrpef.disabled = true;
    } else {
        elements.ralInputs.hidden = true;
        elements.irpefInputs.hidden = false;
        elements.ral.disabled = true;
        elements.inpsRate.disabled = true;
        elements.taxableIrpef.disabled = false;
    }

    const isBustaPaga = elements.paymentModeBustaPaga.checked;
    if (isBustaPaga) {
        elements.paymentModeNote.textContent = "Il beneficio fiscale si distribuisce mensilmente nel cedolino.";
        elements.monthlyBenefitRow.hidden = false;
    } else {
        elements.paymentModeNote.textContent = "Il beneficio fiscale è recuperato in sede di dichiarazione dei redditi (Modello 730).";
        elements.monthlyBenefitRow.hidden = true;
    }
}

function updatePage() {
    updateInputVisibility();
    const values = readValues();
    const validationError = validate(values);

    if (validationError) {
        renderError(validationError);
        return;
    }

    const result = PensionCalculator.calcola(values);
    renderResult(result);
}

function readValues() {
    const inputMode = elements.incomeModeRAL.checked ? "RAL" : "IRPEF";
    const paymentMode = elements.paymentModeBustaPaga.checked ? "busta_paga" : "bonifico";

    return {
        inputMode,
        ral: readNumber(elements.ral),
        aliquotaINPS: readNumber(elements.inpsRate),
        imponibileIRPEFInput: readNumber(elements.taxableIrpef),
        importoVersamento: readNumber(elements.annualContribution),
        addRegionale: readNumber(elements.regionalTax),
        addComunale: readNumber(elements.municipalTax),
        modalitaVersamento: paymentMode
    };
}

function validate(values) {
    if (values.inputMode === "RAL") {
        if (!Number.isFinite(values.ral) || values.ral < 0) {
            return "Inserisci un importo RAL valido (maggiore o uguale a zero).";
        }
        if (!Number.isFinite(values.aliquotaINPS) || values.aliquotaINPS < 0 || values.aliquotaINPS > 100) {
            return "Inserisci un'aliquota INPS compresa tra 0% e 100%.";
        }
    } else {
        if (!Number.isFinite(values.imponibileIRPEFInput) || values.imponibileIRPEFInput < 0) {
            return "Inserisci un imponibile IRPEF valido (maggiore o uguale a zero).";
        }
    }

    if (!Number.isFinite(values.importoVersamento) || values.importoVersamento < 0) {
        return "Inserisci un importo da versare valido (maggiore o uguale a zero).";
    }

    if (!Number.isFinite(values.addRegionale) || values.addRegionale < 0 || values.addRegionale > 100) {
        return "Inserisci un'addizionale regionale compresa tra 0% e 100%.";
    }

    if (!Number.isFinite(values.addComunale) || values.addComunale < 0 || values.addComunale > 100) {
        return "Inserisci un'addizionale comunale compresa tra 0% e 100%.";
    }

    return "";
}

function renderResult(result) {
    if (elements.resultMessage) {
        elements.resultMessage.textContent = "";
        elements.resultMessage.className = "";
    }

    // Badge di avviso input > 5300
    if (result.contributoEccedente > 0) {
        elements.contributionWarningBadge.hidden = false;
        elements.contributionWarningBadge.textContent = "Supera limite deducibile";

        elements.excessWarningBlock.hidden = false;
        elements.excessWarningText.innerHTML = `&nbsp;&#9888;&nbsp; <strong>${formatEuro(result.contributoEccedente)}</strong> del versamento superano il limite deducibile di €5.300,00 e non generano risparmio fiscale.`;
    } else {
        elements.contributionWarningBadge.hidden = true;
        elements.excessWarningBlock.hidden = true;
    }

    // Card dei risultati
    elements.resultValue.textContent = formatEuro(result.risparmioTotale);
    elements.effectiveCostValue.textContent = formatEuro(result.costoEffettivo);

    // Formattazione rendimento implicito ad 1 decimale
    const rendImplicitoFormatted = new Intl.NumberFormat("it-IT", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    }).format(result.rendimentoImplicito);
    elements.taxReturnRateText.innerHTML = `Ogni &euro;100 versati, <strong>&euro;${rendImplicitoFormatted}</strong> tornano come risparmio fiscale`;

    if (result.modalitaVersamento === 'busta_paga') {
        elements.monthlyBenefitValue.textContent = formatEuro(result.beneficioMensile);
    }

    // Tabella di dettaglio
    elements.taxableWithoutValue.textContent = formatEuro(result.imponibileSenza);
    elements.taxableWithValue.textContent = formatEuro(result.imponibileCon);

    elements.grossWithoutValue.textContent = formatEuro(result.irpefLordaSenza);
    elements.grossWithValue.textContent = formatEuro(result.irpefLordaCon);

    elements.deductionWithoutValue.textContent = formatEuro(result.detrazioneSenza);
    elements.deductionWithValue.textContent = formatEuro(result.detrazioneCon);

    elements.netWithoutValue.textContent = formatEuro(result.irpefNettaSenza);
    elements.netWithValue.textContent = formatEuro(result.irpefNettaCon);

    elements.regWithoutValue.textContent = formatEuro(result.addRegionaleSenza);
    elements.regWithValue.textContent = formatEuro(result.addRegionaleCon);

    elements.comWithoutValue.textContent = formatEuro(result.addComunaleSenza);
    elements.comWithValue.textContent = formatEuro(result.addComunaleCon);

    elements.totalTaxWithoutValue.textContent = formatEuro(result.totaleImposteSenza);
    elements.totalTaxWithValue.textContent = formatEuro(result.totaleImposteCon);

    // Riepilogo risparmi
    elements.savingIrpefValue.textContent = formatEuro(result.risparmioIrpef);
    elements.savingAdditionsValue.textContent = formatEuro(result.risparmioAddReg + result.risparmioAddCom);
    elements.savingTotalValue.textContent = formatEuro(result.risparmioTotale);
}

function renderError(message) {
    if (elements.resultMessage) {
        elements.resultMessage.textContent = message;
        elements.resultMessage.className = "error";
    }

    elements.contributionWarningBadge.hidden = true;
    elements.excessWarningBlock.hidden = true;

    // Usiamo il trattino em dash "–" come richiesto
    const placeholder = "–";

    elements.resultValue.textContent = placeholder;
    elements.effectiveCostValue.textContent = placeholder;
    elements.taxReturnRateText.textContent = placeholder;
    elements.monthlyBenefitValue.textContent = placeholder;

    elements.taxableWithoutValue.textContent = placeholder;
    elements.taxableWithValue.textContent = placeholder;
    elements.grossWithoutValue.textContent = placeholder;
    elements.grossWithValue.textContent = placeholder;
    elements.deductionWithoutValue.textContent = placeholder;
    elements.deductionWithValue.textContent = placeholder;
    elements.netWithoutValue.textContent = placeholder;
    elements.netWithValue.textContent = placeholder;
    elements.regWithoutValue.textContent = placeholder;
    elements.regWithValue.textContent = placeholder;
    elements.comWithoutValue.textContent = placeholder;
    elements.comWithValue.textContent = placeholder;
    elements.totalTaxWithoutValue.textContent = placeholder;
    elements.totalTaxWithValue.textContent = placeholder;

    elements.savingIrpefValue.textContent = placeholder;
    elements.savingAdditionsValue.textContent = placeholder;
    elements.savingTotalValue.textContent = placeholder;
}

function readNumber(input) {
    if (!input || !input.value) return 0;
    return Number.parseFloat(input.value.replace(",", "."));
}

function formatEuro(value) {
    if (!Number.isFinite(value)) {
        return "–";
    }
    return "€ " + value.toLocaleString('it-IT', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

init();
