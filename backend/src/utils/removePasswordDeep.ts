import { formatDateDDMMYYYY } from './formatDate';

export const removePasswordDeep = (obj: any): any => {
  if (obj instanceof Date) return formatDateDDMMYYYY(obj);
  if (Array.isArray(obj)) {
    return obj.map(removePasswordDeep);
  } else if (obj && typeof obj === 'object') {
    const rest = { ...obj };
    delete rest.password;
    for (const key in rest) {
      if (rest[key] && typeof rest[key]) {
        rest[key] = removePasswordDeep(rest[key]);
      }
    }
    return rest;
  }

  return obj;
};
