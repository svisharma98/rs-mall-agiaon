export function currency(value, currencyCode = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

export function currencySymbol(currencyCode = "INR") {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0
  }).formatToParts(0).find(({ type }) => type === "currency")?.value || currencyCode;
}

export function dateTime(value) {
  return value ? new Date(value.replace(" ", "T")).toLocaleString("en-IN") : "—";
}
