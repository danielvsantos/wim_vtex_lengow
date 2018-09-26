export function formatPrice(value) {
    return (value / 100).toFixed(2).toString(10)
}

export function formatPriceToDecimal(value) {
    return parseFloat((value / 100).toFixed(2))
}
