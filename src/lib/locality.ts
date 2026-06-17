export function extractLocality(getComponent: (type: string) => string | null): string | null {
  return (
    getComponent('administrative_area_level_3') ??
    getComponent('administrative_area_level_2') ??
    getComponent('locality') ??
    getComponent('postal_town')
  )
}
