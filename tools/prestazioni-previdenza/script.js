// ================================
// Stato e riferimenti pagina
// ================================

const elements = {
    inputModeDate: document.querySelector('input[name="inputMode"][value="DATE"]'),
    inputModeYears: document.querySelector('input[name="inputMode"][value="YEARS"]'),
    dateInputWrapper: document.getElementById("dateInputWrapper"),
    yearsInputWrapper: document.getElementById("yearsInputWrapper"),
    firstEnrollmentDate: document.getElementById("firstEnrollmentDate"),
    calculatedYearsText: document.getElementById("calculatedYearsText"),
    yearsInput: document.getElementById("yearsInput"),
    rate1Display: document.getElementById("rate1Display"),
    rate2Display: document.getElementById("rate2Display"),
    resultMessage: document.getElementById("resultMessage")
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
    const isDateMode = elements.inputModeDate.checked;
    if (isDateMode) {
        elements.dateInputWrapper.hidden = false;
        elements.yearsInputWrapper.hidden = true;
        elements.firstEnrollmentDate.disabled = false;
        elements.yearsInput.disabled = true;
    } else {
        elements.dateInputWrapper.hidden = true;
        elements.yearsInputWrapper.hidden = false;
        elements.firstEnrollmentDate.disabled = true;
        elements.yearsInput.disabled = false;
    }
}

function updatePage() {
    updateInputVisibility();
    
    let years = 0;
    const isDateMode = elements.inputModeDate.checked;
    
    if (isDateMode) {
        const dateVal = elements.firstEnrollmentDate.value;
        if (!dateVal) {
            renderError("Seleziona una data di prima iscrizione valida.");
            return;
        }
        
        const enrollmentDate = new Date(dateVal);
        const today = new Date(); // Utilizza la data corrente di sistema
        
        if (isNaN(enrollmentDate.getTime())) {
            renderError("Data di prima iscrizione non valida.");
            return;
        }
        
        if (enrollmentDate > today) {
            renderError("La data di prima iscrizione non può essere futura.");
            return;
        }
        
        // Calcolo degli anni di partecipazione completi
        years = today.getFullYear() - enrollmentDate.getFullYear();
        const monthDiff = today.getMonth() - enrollmentDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < enrollmentDate.getDate())) {
            years--;
        }
        years = Math.max(0, years);
        
        elements.calculatedYearsText.textContent = years;
    } else {
        years = Number.parseInt(elements.yearsInput.value, 10);
        if (isNaN(years) || years < 0) {
            renderError("Inserisci un numero di anni di partecipazione valido (maggiore o uguale a zero).");
            return;
        }
    }
    
    if (elements.resultMessage) {
        elements.resultMessage.textContent = "";
        elements.resultMessage.className = "";
    }
    
    const result = TaxRateCalculator.calculateRates(years);
    renderResult(result);
}

function renderResult(result) {
    elements.rate1Display.textContent = formatRate(result.rate15to9);
    elements.rate2Display.textContent = formatRate(result.rate20to15);
}

function renderError(message) {
    if (elements.resultMessage) {
        elements.resultMessage.textContent = message;
        elements.resultMessage.className = "error";
    }
    elements.rate1Display.textContent = "–";
    elements.rate2Display.textContent = "–";
    elements.calculatedYearsText.textContent = "–";
}

function formatRate(value) {
    if (!Number.isFinite(value)) {
        return "–";
    }
    return value.toLocaleString("it-IT", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 2
    });
}

init();
