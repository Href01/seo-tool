export function errorMessage(error: unknown, fallback = 'Erreur'): string {
  return error instanceof Error && error.message ? error.message : fallback
}
