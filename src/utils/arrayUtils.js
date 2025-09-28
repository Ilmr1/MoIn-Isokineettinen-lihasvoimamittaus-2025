const isArray = value => Array.isArray(value);

export const atWithWrapping = (array, index) => {
  if (!isArray(array) || array.length === 0) {
    return undefined
  }

  return array.at(index % array.length);
}
