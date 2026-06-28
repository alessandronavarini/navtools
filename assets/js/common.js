function formatEuro(value) {
    if (!Number.isFinite(value)) {
        return "-";
    }

    return new Intl.NumberFormat("it-IT", {
        style: "currency",
        currency: "EUR"
    }).format(value);
}

function formatPercent(value) {
    if (!Number.isFinite(value)) {
        return "-";
    }

    return new Intl.NumberFormat("it-IT", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value) + "%";
}

function round2(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}
