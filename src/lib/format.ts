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
      className: "text-emerald-700",
      barClassName: "from-emerald-700 to-lime-600",
    };
  }

  if (score >= 50) {
    return {
      label: "Recoverable",
      className: "text-amber-700",
      barClassName: "from-amber-700 to-orange-500",
    };
  }

  return {
    label: "Urgent",
    className: "text-rose-700",
    barClassName: "from-rose-700 to-orange-500",
  };
}

export function scoreGrade(score: number) {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 45) return "D";
  return "F";
}

export function percent(value: number) {
  return `${Math.max(0, Math.min(100, value))}%`;
}
