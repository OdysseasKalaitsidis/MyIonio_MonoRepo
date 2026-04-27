export function resolveLabel(
  dictionary: Record<string, string>,
  key?: string | null
) {
  if (!key) return null;
  return dictionary[key] ?? key;
}
