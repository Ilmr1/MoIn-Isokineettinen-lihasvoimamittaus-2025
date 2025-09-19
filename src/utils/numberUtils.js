export const truncDecimals = (number, decimals) => {
  const precision = Math.pow(10, decimals);
  return Math.trunc(number * precision) / precision;
}

export const delta = (start, end) => Math.abs(end) - Math.abs(start);
export const min = (a, b) => Math.min(a ?? b, b ?? a);
export const max = (a, b) => Math.max(a ?? b, b ?? a);

