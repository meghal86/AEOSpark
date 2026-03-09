export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function scoreTone(score: number) {
  if (score >= 75) {
    return {
      label: "Strong",
      className: "text-emerald-300",
      barClassName: "from-emerald-400 to-lime-300",
    };
  }

  if (score >= 50) {
    return {
      label: "Recoverable",
      className: "text-amber-300",
      barClassName: "from-amber-400 to-orange-300",
    };
  }

  return {
    label: "Urgent",
    className: "text-rose-300",
    barClassName: "from-rose-500 to-orange-400",
  };
}

export function percent(value: number) {
  return `${Math.max(0, Math.min(100, value))}%`;
}
