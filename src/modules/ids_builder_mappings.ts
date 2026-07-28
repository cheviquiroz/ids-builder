// Traduce las respuestas del cuestionario a entidades, propiedades y
// clasificaciones IFC (esquema IFC4) usadas para construir las
// especificaciones (specifications) del IDS.
//
// Las propiedades reales (por entidad y por etapa DC/DB) vienen de la Matriz
// PlanBIM V3.0 (src/data/planbim-matrix.ts, generada desde el Excel oficial
// con extract_planbim_matrix.py). Solo se completan a mano las propiedades
// mecánicas de detalle (Diseño Ejecutivo/DD), que quedan fuera del recorte
// DC/DB extraído de la Matriz.
//
// Todo lo definido en este archivo es "lenguaje técnico interno": solo se usa
// para construir el XML oculto. La traducción a lenguaje humano para la UI
// vive en ids_builder_generator.ts (getHumanFriendlyMapping / getIDSPreviewData).

import type { Answers, StructuralSystem } from './ids_builder_questions'
import { getPropertiesByEtapa, type MatrixProperty } from '../data/planbim-matrix'

/** Entidad IFC objetivo de una especificación, con su predefinedType opcional. */
export interface IfcEntityTarget {
  ifcClass: string
  predefinedType?: string
  label: string
  /** Propiedades reales exigidas para ESTA entidad (de la Matriz PlanBIM + fase). */
  properties: IfcPropertyRequirement[]
}

/** Categoría humana a la que pertenece una propiedad, usada para agrupar en la UI. */
export type PropertyCategory =
  | 'dimensiones'
  | 'materiales'
  | 'fuego'
  | 'resistencia'
  | 'clasificacion'
  | 'termico'
  | 'cargas'

/** Propiedad IFC (property set) exigida como requisito. */
export interface IfcPropertyRequirement {
  propertySet: string
  baseName: string
  dataType: string
  label: string
  category: PropertyCategory
  /** Si es indispensable desde etapas tempranas (NDI-1) u opcional/de detalle (NDI-2+). */
  required: boolean
  /** Trazabilidad a la Matriz PlanBIM: TDI/NDI reales, o 'N/A' para propiedades agregadas a mano (fuera del recorte DC/DB). */
  tdi: string
  ndi: string
}

/** Material exigido como requisito, con valor esperado opcional. */
export interface IfcMaterialRequirement {
  value?: string
  label: string
}

/** Clasificación (norma) exigida como requisito. */
export interface IfcClassificationRequirement {
  system: string
  value: string
  label: string
}

export interface MappingResult {
  entities: IfcEntityTarget[]
  materials: IfcMaterialRequirement[]
  classifications: IfcClassificationRequirement[]
}

/** Bridge entre el nombre de clase IFC que usa la app (mayúsculas, para el XML) y la clave de la Matriz PlanBIM (camelCase, como viene del Excel). */
const MATRIX_IFC_KEY: Partial<Record<string, string>> = {
  IFCCOLUMN: 'IfcColumn',
  IFCBEAM: 'IfcBeam',
  IFCSLAB: 'IfcSlab',
  IFCFOOTING: 'IfcFooting',
  IFCWALL: 'IfcWall'
}

const ENTITY_BASE: Record<string, { predefinedType?: string; label: string }> = {
  IFCCOLUMN_hormigon: { predefinedType: 'COLUMN', label: 'Columnas de hormigón armado' },
  IFCBEAM_hormigon: { predefinedType: 'BEAM', label: 'Vigas de hormigón armado' },
  IFCSLAB_hormigon: { predefinedType: 'FLOOR', label: 'Losas' },
  IFCFOOTING_hormigon: { predefinedType: 'FOOTING_BEAM', label: 'Fundaciones' },
  IFCCOLUMN_acero: { predefinedType: 'COLUMN', label: 'Columnas de acero' },
  IFCBEAM_acero: { predefinedType: 'BEAM', label: 'Vigas de acero' },
  IFCMEMBER_acero: { predefinedType: 'BRACE', label: 'Arriostramientos' },
  IFCPLATE_acero: { predefinedType: 'GUSSET_PLATE', label: 'Placas de conexión' },
  IFCCOLUMN_mixto: { predefinedType: 'COLUMN', label: 'Columnas (hormigón / acero)' },
  IFCBEAM_mixto: { predefinedType: 'BEAM', label: 'Vigas (hormigón / acero)' },
  IFCSLAB_mixto: { predefinedType: 'COMPOSITE', label: 'Losas colaborantes' },
  IFCMEMBER_mixto: { predefinedType: 'BRACE', label: 'Arriostramientos metálicos' },
  IFCCOLUMN_madera: { predefinedType: 'COLUMN', label: 'Pilares de madera' },
  IFCBEAM_madera: { predefinedType: 'BEAM', label: 'Vigas de madera' },
  IFCMEMBER_madera: { predefinedType: 'BRACE', label: 'Diagonales / arriostramientos' }
}

const ENTITIES_BY_SYSTEM: Record<StructuralSystem, string[]> = {
  hormigon: ['IFCCOLUMN', 'IFCBEAM', 'IFCSLAB', 'IFCFOOTING'],
  acero: ['IFCCOLUMN', 'IFCBEAM', 'IFCMEMBER', 'IFCPLATE'],
  mixto: ['IFCCOLUMN', 'IFCBEAM', 'IFCSLAB', 'IFCMEMBER'],
  madera: ['IFCCOLUMN', 'IFCBEAM', 'IFCMEMBER']
}

const MATERIAL_BY_SYSTEM: Record<StructuralSystem, IfcMaterialRequirement> = {
  hormigon: { value: 'Hormigón Armado', label: 'Hormigón Armado' },
  acero: { value: 'Acero Estructural', label: 'Acero Estructural' },
  mixto: { label: 'Hormigón Armado o Acero Estructural' },
  madera: { value: 'Madera Estructural', label: 'Madera Estructural' }
}

const REGULATION_LABELS: Record<string, string> = {
  estandar_bim_publico: 'Estándar BIM para Proyectos Públicos',
  oguc: 'OGUC - Ordenanza General de Urbanismo y Construcciones',
  nch: 'Normas Técnicas Chilenas (NCh)',
  municipales_dom: 'Exigencias Municipales / DOM'
}

/** Tipo de dato IFC aproximado según el nombre real de la propiedad (para el XML técnico). */
const DATA_TYPE_BY_PROPERTY: Record<string, string> = {
  Height: 'IfcQuantityLength',
  Length: 'IfcQuantityLength',
  Width: 'IfcQuantityLength',
  Depth: 'IfcQuantityLength',
  NominalThickness: 'IfcQuantityLength',
  Perimeter: 'IfcQuantityLength',
  CrossSectionArea: 'IfcQuantityArea',
  OuterSurfaceArea: 'IfcQuantityArea',
  GrossSurfaceArea: 'IfcQuantityArea',
  GrossFootprintArea: 'IfcQuantityArea',
  GrossSideArea: 'IfcQuantityArea',
  GrossVolume: 'IfcQuantityVolume',
  LoadBearing: 'IfcBoolean',
  IsExternal: 'IfcBoolean',
  ThermalTransmittance: 'IfcThermalTransmittanceMeasure',
  Slope: 'IfcPlaneAngleMeasure',
  PitchAngle: 'IfcPlaneAngleMeasure',
  YieldStrength: 'IfcPressureMeasure',
  ElasticModulus: 'IfcModulusOfElasticityMeasure'
}

function inferDataType(english: string): string {
  return DATA_TYPE_BY_PROPERTY[english] ?? 'IfcLabel'
}

/** Traduce una propiedad real de la Matriz PlanBIM al requisito interno IFC que usa el resto de la app. */
function toIfcPropertyRequirement(ifcClass: string, prop: MatrixProperty): IfcPropertyRequirement {
  const shortName = ifcClass.replace('IFC', '')
  return {
    propertySet: prop.pset ?? `Pset_${shortName.charAt(0)}${shortName.slice(1).toLowerCase()}Common`,
    baseName: prop.english,
    dataType: inferDataType(prop.english),
    label: prop.spanish,
    category: prop.category,
    // NDI-1 = información mínima obligatoria; NDI-2 en adelante = detalle adicional/opcional.
    required: prop.ndi === 'NDI-1',
    tdi: prop.tdi,
    ndi: prop.ndi
  }
}

/** Propiedades mecánicas de detalle: fuera del recorte DC/DB de la Matriz, solo aplican en Diseño Ejecutivo (DD). */
function mechanicalPropertiesForDD(): IfcPropertyRequirement[] {
  return [
    {
      propertySet: 'Pset_MaterialMechanical',
      baseName: 'YieldStrength',
      dataType: 'IfcPressureMeasure',
      label: 'Límite elástico del material',
      category: 'resistencia',
      required: false,
      tdi: 'N/A',
      ndi: 'N/A'
    },
    {
      propertySet: 'Pset_MaterialMechanical',
      baseName: 'ElasticModulus',
      dataType: 'IfcModulusOfElasticityMeasure',
      label: 'Módulo de elasticidad',
      category: 'resistencia',
      required: false,
      tdi: 'N/A',
      ndi: 'N/A'
    }
  ]
}

/** Construye, para una entidad y fase dadas, sus propiedades reales desde la Matriz PlanBIM. */
function buildEntityProperties(ifcClass: string, phase: string): IfcPropertyRequirement[] {
  const matrixKey = MATRIX_IFC_KEY[ifcClass]
  // La Matriz extraída solo cubre DC/DB; Diseño Ejecutivo (DD) hereda el detalle de DB como base.
  const matrixPhase = phase === 'DD' ? 'DB' : phase

  const realProperties = matrixKey
    ? getPropertiesByEtapa(matrixKey, matrixPhase).map((prop) => toIfcPropertyRequirement(ifcClass, prop))
    : []

  if (phase === 'DD') {
    return [...realProperties, ...mechanicalPropertiesForDD()]
  }
  return realProperties
}

/** Construye el resultado de mapeo completo a partir de las respuestas del cuestionario. */
export function buildMapping(answers: Answers): MappingResult {
  const system = answers.structuralSystem
  const phase = answers.projectPhase ?? 'DB'

  const entities: IfcEntityTarget[] = system
    ? ENTITIES_BY_SYSTEM[system].map((ifcClass) => {
        const base = ENTITY_BASE[`${ifcClass}_${system}`]
        return {
          ifcClass,
          predefinedType: base?.predefinedType,
          label: base?.label ?? ifcClass,
          properties: buildEntityProperties(ifcClass, phase)
        }
      })
    : []

  const materials: IfcMaterialRequirement[] = system ? [MATERIAL_BY_SYSTEM[system]] : []

  const classifications: IfcClassificationRequirement[] = (answers.regulation ?? []).map((regulation) => ({
    system: 'Normativa Aplicable',
    value: regulation,
    label: REGULATION_LABELS[regulation] ?? regulation
  }))

  return { entities, materials, classifications }
}
