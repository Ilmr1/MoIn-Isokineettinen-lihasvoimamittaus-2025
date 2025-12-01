export const toCebabCase = (string) => {
  if (!string?.length) {
    return string;
  }

  return string
    .split(" ")
    .map((text, i) => {
      if (i === 0) {
        return text.toLowerCase();
      }

      return text[0].toUpperCase() + text.substring(1).toLowerCase();
    })
    .join("");
};
