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
