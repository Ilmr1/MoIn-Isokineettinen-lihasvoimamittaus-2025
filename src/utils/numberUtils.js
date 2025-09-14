export const truncDecimals = (number, decimals) => {
  const precision = Math.pow(10, decimals);
  return Math.trunc(number * precision) / precision;
}
