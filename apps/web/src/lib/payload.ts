export function toOptionalTrimmedString(value: string | null | undefined): string | undefined {
  const normalized = (value || '').trim();
  return normalized ? normalized : undefined;
}
