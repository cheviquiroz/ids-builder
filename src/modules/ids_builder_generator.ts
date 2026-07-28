// Genera un documento IDS (Information Delivery Specification) válido según
// el esquema de buildingSMART (https://standards.buildingsmart.org/IDS),
// a partir de las respuestas del cuestionario y su mapeo a entidades IFC.
//
// IMPORTANTE: todo lo relacionado a IFC / PropertySet / XML es lenguaje
// interno para construir el archivo técnico. La UI nunca debe consumir estos
// nombres directamente: para eso existen getHumanFriendlyMapping() y
// getIDSPreviewData(), que devuelven texto 100% en español de proyecto.

import type { Answers } from './ids_builder_questions'
import type { MappingResult, PropertyCategory } from './ids_builder_mappings'
import { buildMapping } from './ids_builder_mappings'

const IDS_XMLNS = 'http://standards.buildingsmart.org/IDS'
const IDS_XSD_LOCATION = 'http://standards.buildingsmart.org/IDS/1.0/ids.xsd'

const PROJECT_TYPE_LABELS: Record<string, string> = {
  vivienda: 'Vivienda',
  oficinas: 'Oficinas',
  industrial: 'Industrial',
  comercial: 'Comercial',
  educacional: 'Educacional',
  salud: 'Salud',
  otro: 'Otro'
}

const STRUCTURAL_SYSTEM_LABELS: Record<string, string> = {
  hormigon: 'Hormigón Armado',
  acero: 'Acero',
  mixto: 'Mixto (Hormigón + Acero)',
  madera: 'Madera'
}

const PHASE_LABELS: Record<string, string> = {
  DC: 'Idea Inicial / Conceptual',
  DB: 'Anteproyecto / Diseño Básico',
  DD: 'Proyecto Ejecutivo / Diseño Detallado'
}

/** Nombre humano del tipo de proyecto (uso del edificio). Reutilizable por otros generadores de documentos. */
export function getProjectTypeLabel(projectType?: string): string {
  return projectType ? (PROJECT_TYPE_LABELS[projectType] ?? projectType) : 'No definido'
}

/** Nombre humano del sistema estructural. Reutilizable por otros generadores de documentos. */
export function getStructuralSystemLabel(structuralSystem?: string): string {
  return structuralSystem ? (STRUCTURAL_SYSTEM_LABELS[structuralSystem] ?? structuralSystem) : 'No definido'
}

/** Nombre humano de la fase del proyecto (DC/DB/DD). Reutilizable por otros generadores de documentos. */
export function getPhaseLabel(phase?: string): string {
  return phase ? (PHASE_LABELS[phase] ?? phase) : 'No definida'
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

function buildSpecificationXml({ name, ifcClass, predefinedType, requirementLines }: SpecificationXmlOptions): string {
  const lines: string[] = []
  lines.push(`${indent(2)}<specification name="${escapeXml(name)}" ifcVersion="IFC4" minOccurs="1" maxOccurs="unbounded">`)
  lines.push(`${indent(3)}<applicability>`)
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

  const projectTypeLabel = getProjectTypeLabel(answers.projectType)
  const systemLabel = getStructuralSystemLabel(answers.structuralSystem)
  const phaseLabel = getPhaseLabel(answers.projectPhase)

  const title = `IDS - Estructura (${systemLabel})`
  const description = [
    `Tipo de proyecto: ${projectTypeLabel}.`,
    `Sistema estructural: ${systemLabel}.`,
    `Fase: ${phaseLabel}.`
  ].join(' ')

  const today = new Date().toISOString().slice(0, 10)

  const specifications: string[] = mapping.entities.map((entity) => {
    const requirementLines: string[] = []

    // Requisito de material, si corresponde.
    mapping.materials.forEach((material) => {
      requirementLines.push(`${indent(4)}<material cardinality="required">`)
      if (material.value) {
        requirementLines.push(simpleValueTag('value', material.value, 5))
      }
      requirementLines.push(`${indent(4)}</material>`)
    })

    // Requisitos de propiedades (property sets), específicos de esta entidad.
    entity.properties.forEach((prop) => {
      requirementLines.push(
        `${indent(4)}<property propertySet="${escapeXml(prop.propertySet)}" dataType="${escapeXml(prop.dataType)}" cardinality="required">`
      )
      requirementLines.push(simpleValueTag('name', prop.baseName, 5))
      requirementLines.push(`${indent(4)}</property>`)
    })

    // Requisitos de clasificación (normativa aplicable).
    mapping.classifications.forEach((classification) => {
      requirementLines.push(`${indent(4)}<classification cardinality="required">`)
      requirementLines.push(simpleValueTag('value', classification.value, 5))
      requirementLines.push(simpleValueTag('system', classification.system, 5))
      requirementLines.push(`${indent(4)}</classification>`)
    })

    return buildSpecificationXml({
      name: entity.label,
      ifcClass: entity.ifcClass,
      predefinedType: entity.predefinedType,
      requirementLines
    })
  })

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<ids xmlns="${IDS_XMLNS}" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="${IDS_XMLNS} ${IDS_XSD_LOCATION}">`,
    `${indent(1)}<info>`,
    `${indent(2)}<title>${escapeXml(title)}</title>`,
    `${indent(2)}<description>${escapeXml(description)}</description>`,
    `${indent(2)}<author>ids-builder@local</author>`,
    `${indent(2)}<date>${today}</date>`,
    `${indent(2)}<version>1.0</version>`,
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
      ifc: `${prop.propertySet}.${prop.baseName}`
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

export interface PreviewData {
  projectType: string
  system: string
  phase: string
  entities: FriendlyEntity[]
  propertiesByEntity: Record<string, FriendlyProperty[]>
  validations: string[]
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
  validations.push('Validable con herramientas de coordinación BIM')

  return {
    projectType: getProjectTypeLabel(answers.projectType),
    system: getStructuralSystemLabel(answers.structuralSystem),
    phase: getPhaseLabel(answers.projectPhase),
    entities: friendly.entities,
    propertiesByEntity: friendly.propertiesByEntity,
    validations
  }
}
