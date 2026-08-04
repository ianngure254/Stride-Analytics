export const round2 = (value: number) => Math.round(value * 100) / 100;

export const formatKes = (value: number) =>
  `KES ${new Intl.NumberFormat('en-KE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(round2(value))}`;
