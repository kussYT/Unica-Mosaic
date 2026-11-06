const localDatabase = /@(127\.0\.0\.1|localhost):5433\/unica_mosaic_local(\?|$)/
const previewDatabase = /@(127\.0\.0\.1|localhost):5432\/unica_mosaic_preview(\?|$)/

export function databaseTargetError(
  databaseUrl: string,
  runtime: string | undefined,
  nodeEnv: string | undefined,
): string | null {
  if (!databaseUrl || nodeEnv === 'test') return null
  if (runtime === 'preview') {
    if (!previewDatabase.test(databaseUrl)) {
      return 'En préproduction, DATABASE_URL doit viser unica_mosaic_preview sur 127.0.0.1:5432.'
    }
    return null
  }
  if (!localDatabase.test(databaseUrl)) {
    return 'DATABASE_URL doit viser unica_mosaic_local sur 127.0.0.1:5433.'
  }
  return null
}
