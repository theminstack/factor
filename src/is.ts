const isPlainObject = (value: any): value is Record<string, any> => {
  return Boolean(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
};

const isTupleChanged = (a: any, b: any): boolean => {
  const aType = typeof a;
  const bType = typeof b;

  if (aType !== bType) return true;

  if (aType === 'object') {
    if (Array.isArray(a)) {
      if (!Array.isArray(b)) return true;
      if (a.length !== b.length) return true;

      for (let i = a.length - 1; i >= 0; i--) {
        if (a[i] !== b[i]) return true;
      }

      return false;
    }

    if (isPlainObject(a)) {
      if (!isPlainObject(b)) return true;

      const keys = Object.keys(a);

      if (keys.length !== Object.keys(b).length) return true;

      for (const key of keys) {
        if (a[key] !== b[key]) return true;
      }

      return false;
    }
  }

  return a !== b;
};

export { isTupleChanged };
