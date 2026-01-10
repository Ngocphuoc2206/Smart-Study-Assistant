export function getQueryString(
  value: string | string[] | undefined,
  fieldName = "query"
): string {
  if (!value) return "";
  if (Array.isArray(value)) return value[0] ?? "";
  return value;
}

export function requireQueryString(
  value: string | string[] | undefined,
  fieldName = "query"
): string {
  const v = getQueryString(value, fieldName);
  if (!v) {
    throw new Error(`Missing query param: ${fieldName}`);
  }
  return v;
}
