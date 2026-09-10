function formatEuro(value) {
    if (!Number.isFinite(value)) {
        return "-";
    }

    const sign = value < 0 ? "-" : "";
    const parts = Math.abs(value).toFixed(2).split(".");
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const decimalPart = parts[1];

    return sign + "€\u00a0" + integerPart + "," + decimalPart;
}

function formatPercent(value) {
    if (!Number.isFinite(value)) {
        return "-";
    }

    const sign = value < 0 ? "-" : "";
    const parts = Math.abs(value).toFixed(2).split(".");
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const decimalPart = parts[1];

    return sign + integerPart + "," + decimalPart + "%";
}

function round2(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

// Inizializzazione della barra di navigazione responsive
document.addEventListener("DOMContentLoaded", function () {
    const navToggle = document.querySelector(".nav-toggle");
    const navMenu = document.querySelector(".nav-menu");

    if (navToggle && navMenu) {
        navToggle.addEventListener("click", function () {
            navMenu.classList.toggle("is-open");
        });

        // Chiudi il menu quando si clicca fuori
        document.addEventListener("click", function (event) {
            if (!navToggle.contains(event.target) && !navMenu.contains(event.target)) {
                navMenu.classList.remove("is-open");
            }
        });
    }
});

