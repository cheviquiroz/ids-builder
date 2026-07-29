// Destinos OGUC (Art. 4.2.4) — fuente de verdad para exigencias de
// resistencia al fuego y zona vertical de seguridad según el uso del
// edificio.
//
// IMPORTANTE: esta clasificación es una CAPA ADICIONAL de metadatos y
// exigencias de seguridad contra incendio. NO reemplaza ni filtra las
// entidades/propiedades estructurales — esas siguen viniendo 100% de la
// Matriz PlanBIM (ids_builder_mappings.ts), ya verificada contra el
// IDS-Audit-Tool oficial de buildingSMART. Ver src/utils/ids-derivation.ts.

export type FireSafetyType = 'F30' | 'F60' | 'F90' | 'F120'

export interface OgucConditionOption {
  id: string
  label: string
  /** null = esta condición específica no exige resistencia al fuego. */
  fireSafetyType: FireSafetyType | null
  requiresVerticalSafety?: boolean
}

export interface OgucDestinationConfig {
  id: string
  label: string
  description: string
  /** Si está presente, se pregunta esto para afinar la exigencia de fuego. */
  conditionalQuestion?: string
  conditionalOptions?: OgucConditionOption[]
  /** Exigencia de fuego cuando el destino NO tiene pregunta condicional. */
  defaultFireSafetyType: FireSafetyType | null
}

export const OGUC_DESTINATIONS: Record<string, OgucDestinationConfig> = {
  vivienda: {
    id: 'vivienda',
    label: 'Vivienda',
    description: 'Residencial (unifamiliar, departamento)',
    conditionalQuestion: '¿Cuántos pisos tiene el edificio?',
    conditionalOptions: [
      { id: 'vivienda_1_2', label: '1-2 pisos (hasta 5,5 m)', fireSafetyType: null },
      { id: 'vivienda_3_6', label: '3-6 pisos (5,5 m a 20 m)', fireSafetyType: 'F60', requiresVerticalSafety: true },
      { id: 'vivienda_7plus', label: '7 pisos o más (sobre 20 m)', fireSafetyType: 'F90', requiresVerticalSafety: true }
    ],
    defaultFireSafetyType: null
  },
  oficinas: {
    id: 'oficinas',
    label: 'Oficinas',
    description: 'Uso administrativo',
    defaultFireSafetyType: 'F60'
  },
  comercio: {
    id: 'comercio',
    label: 'Comercio',
    description: 'Retail, malls, supermercados',
    defaultFireSafetyType: 'F60'
  },
  educacion: {
    id: 'educacion',
    label: 'Educación',
    description: 'Colegios, universidades',
    conditionalQuestion: '¿Tiene áreas de reunión masiva (auditorio, gimnasio)?',
    conditionalOptions: [
      { id: 'educacion_si', label: 'Sí', fireSafetyType: 'F90' },
      { id: 'educacion_no', label: 'No', fireSafetyType: 'F60' }
    ],
    defaultFireSafetyType: 'F60'
  },
  salud: {
    id: 'salud',
    label: 'Salud (hospital / clínica)',
    description: 'Establecimientos de atención médica',
    conditionalQuestion: '¿Qué tipo de establecimiento?',
    conditionalOptions: [
      { id: 'salud_hospital', label: 'Hospital', fireSafetyType: 'F120' },
      { id: 'salud_clinica', label: 'Clínica', fireSafetyType: 'F90' }
    ],
    defaultFireSafetyType: 'F90'
  },
  industrial: {
    id: 'industrial',
    label: 'Industrial / Galpón',
    description: 'Manufactura, bodegaje, almacenamiento',
    defaultFireSafetyType: 'F30'
  },
  otro: {
    id: 'otro',
    label: 'Otro',
    description: 'Especificar en la descripción',
    defaultFireSafetyType: null
  }
}

export type OgucDestinationId = keyof typeof OGUC_DESTINATIONS
