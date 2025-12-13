const currencyFormatter = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
});

const numberFormatter = new Intl.NumberFormat("ja-JP");

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "-";
  }
  return currencyFormatter.format(value);
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "-";
  }
  return numberFormatter.format(value);
}

export function formatDate(date: string | null | undefined): string {
  if (!date) {
    return "-";
  }
  const d = new Date(date);
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatDateShort(date: string | null | undefined): string {
  if (!date) {
    return "-";
  }
  const d = new Date(date);
  return d.toLocaleDateString("ja-JP", {
    month: "2-digit",
    day: "2-digit",
  });
}
