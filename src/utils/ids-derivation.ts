// Deriva exigencias de seguridad contra incendio y zona vertical de
// seguridad a partir del Destino OGUC (Art. 4.2.4) y su condición asociada
// (p.ej. cantidad de pisos, tipo de establecimiento de salud).
//
// ALCANCE DELIBERADO: esta derivación es una capa adicional de metadatos y
// exigencias de resistencia al fuego sobre el pipeline ya verificado. NO
// deriva entidades ni propiedades estructurales — esas siguen viniendo 100%
// de la Matriz PlanBIM (ids_builder_mappings.ts), confirmada contra el
// IDS-Audit-Tool oficial. La derivación de "Usos BIM → TDI" queda pendiente
// para cuando se disponga de la tabla completa (Estándar BIM Tabla 06/07).

import { OGUC_DESTINATIONS, type FireSafetyType, type OgucDestinationId } from '../data/oguc-destinations'

export interface OgucFireSafetyResult {
  fireSafetyType: FireSafetyType | null
  fireRatingRequired: boolean
  verticalSafetyRequired: boolean
}

/** Deriva las exigencias de fuego/seguridad vertical para un destino y su condición (si aplica). */
export function deriveOgucFireSafety(
  destination: OgucDestinationId | string | undefined,
  destinationCondition: string | undefined
): OgucFireSafetyResult {
  const config = destination ? OGUC_DESTINATIONS[destination] : undefined
  if (!config) {
    return { fireSafetyType: null, fireRatingRequired: false, verticalSafetyRequired: false }
  }

  const condition = config.conditionalOptions?.find((c) => c.id === destinationCondition)
  const fireSafetyType = condition ? condition.fireSafetyType : config.defaultFireSafetyType

  return {
    fireSafetyType,
    fireRatingRequired: fireSafetyType !== null,
    verticalSafetyRequired: !!condition?.requiresVerticalSafety
  }
}
