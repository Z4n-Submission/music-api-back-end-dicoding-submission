const camelCase = (str) =>
  str.replace(/_([a-z])/g, (_, char) => char.toUpperCase());

const camelCaseKeys = (obj) => {
  if (obj instanceof Date) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(camelCaseKeys);
  }

  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        camelCase(key),
        camelCaseKeys(value),
      ])
    );
  }

  return obj;
};

module.exports = { camelCaseKeys };
