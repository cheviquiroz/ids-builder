// Genera un documento IDS (Information Delivery Specification) válido según
// el esquema de buildingSMART (https://standards.buildingsmart.org/IDS),
// a partir de las respuestas del cuestionario y su mapeo a entidades IFC.
//
// IMPORTANTE: todo lo relacionado a IFC / PropertySet / XML es lenguaje
// interno para construir el archivo técnico. La UI nunca debe consumir estos
// nombres directamente: para eso existen getHumanFriendlyMapping() y
// getIDSPreviewData(), que devuelven texto 100% en español de proyecto.

import type { Answers } from './ids_builder_questions'
import { isValidEmail } from './ids_builder_questions'
import type { MappingResult, PropertyCategory } from './ids_builder_mappings'
import { buildMapping } from './ids_builder_mappings'
import { getCardinalityForNDI } from '../utils/datatypeMapper'
import { OGUC_DESTINATIONS } from '../data/oguc-destinations'
import { deriveOgucFireSafety } from '../utils/ids-derivation'
import { ALL_BIM_USES, TDI_DEFINITIONS } from '../data/bim-uses-standard'

/** Autor por defecto: debe cumplir el patrón de email exigido por el XSD oficial de IDS 1.0 (`[^@]+@[^\.]+\..+`). */
const DEFAULT_AUTHOR_EMAIL = 'ids-builder@bwisebim.com'

const IDS_XMLNS = 'http://standards.buildingsmart.org/IDS'
const IDS_XSD_LOCATION = 'http://standards.buildingsmart.org/IDS/1.0/ids.xsd'

const SPECIALIZATION_LABELS: Record<string, string> = {
  structure: 'Estructura',
  architecture: 'Arquitectura',
  mep: 'MEP (Mecánica, Eléctrica, Plomería)',
  other: 'Otra especialidad'
}

const STRUCTURAL_SYSTEM_LABELS: Record<string, string> = {
  hormigon: 'Hormigón Armado',
  acero: 'Acero',
  mixto: 'Mixto (Hormigón + Acero)',
  madera: 'Madera'
}

const PHASE_LABELS: Record<string, string> = {
  DC: 'Idea Inicial / Conceptual',
  DA: 'Anteproyecto',
  DB: 'Diseño Básico',
  DD: 'Proyecto Ejecutivo / Diseño Detallado'
}

/** Nombre humano de la especialidad. Reutilizable por otros generadores de documentos. */
export function getSpecializationLabel(specialization?: string): string {
  return specialization ? (SPECIALIZATION_LABELS[specialization] ?? specialization) : 'No definida'
}

/** Nombre humano del destino OGUC (reemplaza al antiguo "tipo de proyecto"). Reutilizable por otros generadores de documentos. */
export function getOgucDestinationLabel(destination?: string): string {
  if (!destination) return 'No definido'
  return OGUC_DESTINATIONS[destination]?.label ?? destination
}

/** Nombre humano del sistema estructural. Reutilizable por otros generadores de documentos. */
export function getStructuralSystemLabel(structuralSystem?: string): string {
  return structuralSystem ? (STRUCTURAL_SYSTEM_LABELS[structuralSystem] ?? structuralSystem) : 'No definido'
}

/** Nombre humano de la fase del proyecto (DC/DB/DD). Reutilizable por otros generadores de documentos. */
export function getPhaseLabel(phase?: string): string {
  return phase ? (PHASE_LABELS[phase] ?? phase) : 'No definida'
}

/** Usos BIM seleccionados (Estándar BIM Tabla 06), en su forma completa (número, etiqueta, TDI). */
function getSelectedBimUses(answers: Answers) {
  const selectedIds = answers.bimUses ?? []
  return ALL_BIM_USES.filter((use) => selectedIds.includes(use.id))
}

/** Deriva, a partir de los Usos BIM seleccionados, el conjunto de TDI (Tipo de Información) requeridos, ordenados alfabéticamente. */
function deriveTDIFromSelectedUses(selectedUses: ReturnType<typeof getSelectedBimUses>): string[] {
  const tdi = new Set<string>()
  selectedUses.forEach((use) => use.tdiRequired.forEach((t) => tdi.add(t)))
  return Array.from(tdi).sort()
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function indent(level: number): string {
  return '  '.repeat(level)
}

function simpleValueTag(tag: string, value: string, level: number): string {
  return `${indent(level)}<${tag}><simpleValue>${escapeXml(value)}</simpleValue></${tag}>`
}

interface SpecificationXmlOptions {
  name: string
  ifcClass: string
  predefinedType?: string
  requirementLines: string[]
}

// NOTA sobre el esquema real (verificado contra Schema/ids.xsd y el ejemplo
// oficial IDS_StructuralSafety.ids de buildingSMART/IDS):
// - <specification> NO lleva minOccurs/maxOccurs (esos atributos van en
//   <applicability>, que los referencia vía xs:occurs).
// - <property> usa <propertySet>/<baseName> como ELEMENTOS hijos (con
//   <simpleValue>), no como atributos; dataType SÍ es un atributo, y debe
//   ser un IFC Defined Type real en mayúsculas (p.ej. IFCLABEL).
// - Los atributos nativos de IFC (Name, PredefinedType, sin PropertySet
//   real) van como <attribute>, que no admite dataType.
// - Dentro de <requirements>, el orden declarado es: entity, partOf,
//   classification, attribute, property, material.
function buildSpecificationXml({ name, ifcClass, predefinedType, requirementLines }: SpecificationXmlOptions): string {
  const lines: string[] = []
  lines.push(`${indent(2)}<specification name="${escapeXml(name)}" ifcVersion="IFC4">`)
  lines.push(`${indent(3)}<applicability minOccurs="1" maxOccurs="unbounded">`)
  lines.push(`${indent(4)}<entity>`)
  lines.push(simpleValueTag('name', ifcClass, 5))
  if (predefinedType) {
    lines.push(simpleValueTag('predefinedType', predefinedType, 5))
  }
  lines.push(`${indent(4)}</entity>`)
  lines.push(`${indent(3)}</applicability>`)
  lines.push(`${indent(3)}<requirements>`)
  lines.push(...requirementLines)
  lines.push(`${indent(3)}</requirements>`)
  lines.push(`${indent(2)}</specification>`)
  return lines.join('\n')
}

/** Genera el documento IDS XML completo a partir de las respuestas recolectadas. */
export function generateIdsXml(answers: Answers): string {
  const mapping = buildMapping(answers)

  const specializationLabel = getSpecializationLabel(answers.specialization)
  const destinationLabel = getOgucDestinationLabel(answers.ogucDestination)
  const systemLabel = getStructuralSystemLabel(answers.structuralSystem)
  const phaseLabel = getPhaseLabel(answers.projectPhase)
  const fireSafety = deriveOgucFireSafety(answers.ogucDestination, answers.destinationCondition)
  const selectedBimUses = getSelectedBimUses(answers)
  const derivedTDI = deriveTDIFromSelectedUses(selectedBimUses)

  const title = answers.idsTitle?.trim() || `IDS - Estructura (${systemLabel})`
  const authorEmail = answers.authorEmail && isValidEmail(answers.authorEmail) ? answers.authorEmail.trim() : DEFAULT_AUTHOR_EMAIL
  const description =
    answers.idsDescription?.trim() ||
    [
      `Especialidad: ${specializationLabel}.`,
      `Destino OGUC: ${destinationLabel}.`,
      `Sistema estructural: ${systemLabel}.`,
      `Fase: ${phaseLabel}.`,
      fireSafety.fireRatingRequired ? `Resistencia al fuego exigida: ${fireSafety.fireSafetyType}.` : null,
      fireSafety.verticalSafetyRequired ? 'Requiere zona vertical de seguridad.' : null,
      selectedBimUses.length ? `Usos BIM: ${selectedBimUses.map((u) => `${u.number}. ${u.label}`).join(', ')}.` : null,
      derivedTDI.length ? `TDI requeridos: ${derivedTDI.join(', ')}.` : null
    ]
      .filter(Boolean)
      .join(' ')

  const today = new Date().toISOString().slice(0, 10)

  const specifications: string[] = mapping.entities.map((entity) => {
    const classificationLines: string[] = []
    const attributeLines: string[] = []
    const propertyLines: string[] = []
    const materialLines: string[] = []

    // Requisitos de clasificación (normativa aplicable).
    mapping.classifications.forEach((classification) => {
      classificationLines.push(`${indent(4)}<classification cardinality="required">`)
      classificationLines.push(simpleValueTag('value', classification.value, 5))
      classificationLines.push(simpleValueTag('system', classification.system, 5))
      classificationLines.push(`${indent(4)}</classification>`)
    })

    // Propiedades/atributos de esta entidad, específicos según la Matriz.
    entity.properties.forEach((prop) => {
      const cardinality = getCardinalityForNDI(prop.ndi)
      if (prop.propertySet && prop.dataType) {
        propertyLines.push(`${indent(4)}<property dataType="${escapeXml(prop.dataType)}" cardinality="${cardinality}">`)
        propertyLines.push(simpleValueTag('propertySet', prop.propertySet, 5))
        propertyLines.push(simpleValueTag('baseName', prop.baseName, 5))
        propertyLines.push(`${indent(4)}</property>`)
      } else {
        // Atributo nativo IFC (sin PropertySet real): el esquema no admite dataType en <attribute>.
        attributeLines.push(`${indent(4)}<attribute cardinality="${cardinality}">`)
        attributeLines.push(simpleValueTag('name', prop.baseName, 5))
        attributeLines.push(`${indent(4)}</attribute>`)
      }
    })

    // Requisito de material, si corresponde.
    mapping.materials.forEach((material) => {
      materialLines.push(`${indent(4)}<material cardinality="required">`)
      if (material.value) {
        materialLines.push(simpleValueTag('value', material.value, 5))
      }
      materialLines.push(`${indent(4)}</material>`)
    })

    return buildSpecificationXml({
      name: entity.label,
      ifcClass: entity.ifcClass,
      predefinedType: entity.predefinedType,
      requirementLines: [...classificationLines, ...attributeLines, ...propertyLines, ...materialLines]
    })
  })

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<ids xmlns="${IDS_XMLNS}" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="${IDS_XMLNS} ${IDS_XSD_LOCATION}">`,
    `${indent(1)}<info>`,
    `${indent(2)}<title>${escapeXml(title)}</title>`,
    `${indent(2)}<version>1.0</version>`,
    `${indent(2)}<description>${escapeXml(description)}</description>`,
    `${indent(2)}<author>${escapeXml(authorEmail)}</author>`,
    `${indent(2)}<date>${today}</date>`,
    `${indent(1)}</info>`,
    `${indent(1)}<specifications>`,
    ...specifications,
    `${indent(1)}</specifications>`,
    '</ids>'
  ]

  return xml.join('\n')
}

/** Copia el XML generado al portapapeles del navegador. */
export async function copyIdsXmlToClipboard(xml: string): Promise<void> {
  await navigator.clipboard.writeText(xml)
}

/** Dispara la descarga del XML generado como archivo .ids. */
export function downloadIdsXml(xml: string, filename = 'ids-builder-estructura.ids'): void {
  const blob = new Blob([xml], { type: 'application/xml' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ═══════════════════════════════════════════════════════════════════════
// Traducción a lenguaje humano (sin IFC / PropertySet / XML / NDI / jerga BIM)
// Todo lo de arriba sigue existiendo para construir el archivo técnico; lo
// de abajo es exclusivamente lo que la UI debe consumir.
// ═══════════════════════════════════════════════════════════════════════

const ENTITY_NAME_FALLBACK: Record<string, string> = {
  IFCCOLUMN: 'Columnas',
  IFCBEAM: 'Vigas',
  IFCSLAB: 'Losas',
  IFCFOOTING: 'Fundaciones',
  IFCMEMBER: 'Elementos de arriostramiento',
  IFCPLATE: 'Placas de conexión'
}

const CATEGORY_LABELS: Record<PropertyCategory, string> = {
  dimensiones: '📐 Dimensiones',
  materiales: '🏭 Materiales',
  fuego: '🔥 Resistencia al Fuego',
  resistencia: '⚙️ Propiedades Mecánicas',
  clasificacion: '🏷️ Clasificación Estructural',
  termico: '🌡️ Aislación Térmica',
  cargas: '⚖️ Capacidad de Carga'
}

const REGULATION_VALIDATION_MESSAGES: Record<string, string> = {
  estandar_bim_publico: 'Proyecto público requiere Estándar BIM Chile',
  oguc: 'Cumple con la Ordenanza General de Urbanismo y Construcciones (OGUC)',
  nch: 'Cumple con las Normas Técnicas Chilenas (NCh) aplicables',
  municipales_dom: 'Cumple con las exigencias municipales y DOM'
}

const PHASE_VALIDATION_MESSAGES: Record<string, string> = {
  DC: 'Información mínima para etapa conceptual',
  DA: 'Información mínima para etapa de anteproyecto',
  DB: 'Información mínima para diseño básico',
  DD: 'Información completa para proyecto ejecutivo'
}

/** Elemento estructural en lenguaje humano. El campo `ifc` es solo trazabilidad interna, nunca se muestra. */
export interface FriendlyEntity {
  spanishName: string
  ifc: string
  description: string
}

/**
 * Propiedad exigida en lenguaje humano. `technicalName` es el nombre IFC
 * real (p.ej. "Slope", "Height"): se muestra en gris/monospace junto al
 * nombre en español, nunca solo. El campo `ifc` es trazabilidad interna.
 */
export interface FriendlyProperty {
  spanishName: string
  technicalName: string
  category: string
  required: boolean
  ifc: string
}

export interface HumanFriendlyMapping {
  entities: FriendlyEntity[]
  /** Propiedades de cada entidad, indexadas por su ifcClass (p.ej. "IFCCOLUMN"). */
  propertiesByEntity: Record<string, FriendlyProperty[]>
}

/**
 * Traduce el mapeo IFC (entidades + propiedades) a lenguaje 100% humano, sin
 * jerga BIM. Cada entidad conserva sus propias propiedades (según la Matriz
 * PlanBIM), para poder agruparlas en la UI como Entidad → Categoría → Propiedad.
 */
export function getHumanFriendlyMapping(mapping: MappingResult): HumanFriendlyMapping {
  const propertiesByEntity: Record<string, FriendlyProperty[]> = {}

  mapping.entities.forEach((entity) => {
    propertiesByEntity[entity.ifcClass] = entity.properties.map((prop) => ({
      spanishName: prop.label,
      technicalName: prop.baseName,
      category: CATEGORY_LABELS[prop.category],
      required: prop.required,
      ifc: prop.propertySet ? `${prop.propertySet}.${prop.baseName}` : prop.baseName
    }))
  })

  return {
    entities: mapping.entities.map((entity) => ({
      spanishName: entity.label || ENTITY_NAME_FALLBACK[entity.ifcClass] || entity.ifcClass,
      ifc: entity.ifcClass,
      description: entity.predefinedType ? `Tipo: ${entity.predefinedType}` : ''
    })),
    propertiesByEntity
  }
}

/** Uso BIM seleccionado, en lenguaje humano (para el panel "Usos BIM" del preview). */
export interface FriendlyBimUse {
  number: number
  label: string
  description: string
}

/** TDI (Tipo de Información) derivado, en lenguaje humano (para el panel "TDI Requeridos" del preview). */
export interface FriendlyTDI {
  id: string
  label: string
  description: string
}

export interface PreviewData {
  projectType: string
  system: string
  phase: string
  entities: FriendlyEntity[]
  propertiesByEntity: Record<string, FriendlyProperty[]>
  validations: string[]
  bimUses: FriendlyBimUse[]
  tdiRequired: FriendlyTDI[]
}

/** Construye una vista legible (sin IFC/PropertySet/XML) del documento a partir del mapeo y las respuestas. */
export function getIDSPreviewData(mapping: MappingResult, answers: Answers): PreviewData {
  const friendly = getHumanFriendlyMapping(mapping)

  const validations: string[] = []
  ;(answers.regulation ?? []).forEach((regulation) => {
    validations.push(REGULATION_VALIDATION_MESSAGES[regulation] ?? `Cumple con normativa: ${regulation}`)
  })
  if (answers.projectPhase) {
    validations.push(PHASE_VALIDATION_MESSAGES[answers.projectPhase])
  }
  const fireSafety = deriveOgucFireSafety(answers.ogucDestination, answers.destinationCondition)
  if (fireSafety.fireRatingRequired) {
    validations.push(`Resistencia al fuego exigida: ${fireSafety.fireSafetyType} (Destino OGUC)`)
  }
  if (fireSafety.verticalSafetyRequired) {
    validations.push('Requiere zona vertical de seguridad (OGUC)')
  }

  const selectedBimUses = getSelectedBimUses(answers)
  const derivedTDI = deriveTDIFromSelectedUses(selectedBimUses)
  if (derivedTDI.length) {
    validations.push(`TDI requeridos según Usos BIM: ${derivedTDI.join(', ')}`)
  }
  validations.push('Validable con herramientas de coordinación BIM')

  return {
    projectType: getOgucDestinationLabel(answers.ogucDestination),
    system: getStructuralSystemLabel(answers.structuralSystem),
    phase: getPhaseLabel(answers.projectPhase),
    entities: friendly.entities,
    propertiesByEntity: friendly.propertiesByEntity,
    validations,
    bimUses: selectedBimUses.map((use) => ({ number: use.number, label: use.label, description: use.description })),
    tdiRequired: derivedTDI.map((id) => ({
      id,
      label: TDI_DEFINITIONS[id as keyof typeof TDI_DEFINITIONS]?.label ?? id,
      description: TDI_DEFINITIONS[id as keyof typeof TDI_DEFINITIONS]?.description ?? ''
    }))
  }
}
