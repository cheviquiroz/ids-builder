// Genera el contenido del Anexo de Información BIM (por fase: DC y DB) y de
// la Tabla de Propiedades Estructurales. Comparten los mismos elementos y
// propiedades reales (Matriz PlanBIM V3.0) que la Especificación IDS
// (ids_builder_generator.ts), pero en un formato tabular pensado para
// exportarse como documento (PDF/CSV) que complementa la Solicitud de
// Información BIM (SDI BIM) del proyecto.

import type { Answers } from './ids_builder_questions'
import type { MappingResult, PropertyCategory } from './ids_builder_mappings'
import { buildMapping } from './ids_builder_mappings'
import { getPhaseLabel, getOgucDestinationLabel, getStructuralSystemLabel } from './ids_builder_generator'

export type AnexoCategoria = 'Dimensiones' | 'Materiales' | 'Resistencia' | 'Clasificación' | 'Carga' | 'Térmico'

export interface AnexoPropiedad {
  spanish: string
  technicalName: string
  /** null cuando es un atributo nativo IFC sin PropertySet real (p.ej. Name, PredefinedType). */
  propertySet: string | null
  tdi: string
  ndi: string
  category: AnexoCategoria
  required: boolean
}

export interface AnexoElemento {
  name: string
  ifcClass: string
  properties: AnexoPropiedad[]
}

export interface AnexoDocument {
  title: string
  projectInfo: {
    name: string
    phase: string
    system: string
    date: string
    company: string
  }
  elements: AnexoElemento[]
  regulations: string[]
  phase: string
}

const CATEGORY_MAP: Record<PropertyCategory, AnexoCategoria> = {
  dimensiones: 'Dimensiones',
  materiales: 'Materiales',
  fuego: 'Resistencia',
  resistencia: 'Resistencia',
  clasificacion: 'Clasificación',
  termico: 'Térmico',
  cargas: 'Carga'
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0]
}

function baseProjectInfo(answers: Answers, phase: string, fallbackContact: string) {
  return {
    name: getOgucDestinationLabel(answers.ogucDestination),
    phase,
    system: getStructuralSystemLabel(answers.structuralSystem),
    date: todayIso(),
    // El email del autor sirve como dato de contacto del documento; si no se ingresó, se usa un rótulo genérico.
    company: answers.authorEmail?.trim() || fallbackContact
  }
}

function elementsFromMapping(
  mapping: MappingResult,
  filter?: (prop: MappingResult['entities'][number]['properties'][number]) => boolean
): AnexoElemento[] {
  return mapping.entities.map((entity) => ({
    name: entity.label,
    ifcClass: entity.ifcClass,
    properties: entity.properties
      .filter((prop) => (filter ? filter(prop) : true))
      .map((prop) => ({
        spanish: prop.label,
        technicalName: prop.baseName,
        propertySet: prop.propertySet,
        tdi: prop.tdi,
        ndi: prop.ndi,
        category: CATEGORY_MAP[prop.category],
        required: prop.required
      }))
  }))
}

/**
 * Anexo de Información BIM - Diseño Conceptual (DC): la información real de
 * la Matriz PlanBIM para esta fase, independiente de qué fase haya
 * respondido el usuario en el cuestionario (se genera siempre, para que el
 * equipo pueda descargar ambos anexos cuando los necesite).
 */
export function generateAnexoInformacionBIM_DC(answers: Answers): AnexoDocument {
  const mapping = buildMapping({ ...answers, projectPhase: 'DC' })
  return {
    title: 'Anexo de Información BIM - Diseño Conceptual',
    projectInfo: baseProjectInfo(answers, 'Diseño Conceptual (DC)', 'Equipo de Proyecto'),
    elements: elementsFromMapping(mapping, (prop) => prop.required),
    regulations: mapping.classifications.map((c) => c.label),
    phase: 'Diseño Conceptual'
  }
}

/**
 * Anexo de Información BIM - Diseño Básico (DB): la información real de la
 * Matriz PlanBIM para esta fase, igualmente independiente de la fase
 * respondida en el cuestionario.
 */
export function generateAnexoInformacionBIM_DB(answers: Answers): AnexoDocument {
  const mapping = buildMapping({ ...answers, projectPhase: 'DB' })
  return {
    title: 'Anexo de Información BIM - Diseño Básico',
    projectInfo: baseProjectInfo(answers, 'Diseño Básico (DB)', 'Equipo de Proyecto'),
    elements: elementsFromMapping(mapping),
    regulations: mapping.classifications.map((c) => c.label),
    phase: 'Diseño Básico'
  }
}

/**
 * Tabla de Propiedades Estructurales: detalle tabular pensado para CSV/Excel,
 * según la fase real respondida en el cuestionario (Conceptual/Básica/Detallada).
 */
export function generateTablaPropiedades(answers: Answers, mapping: MappingResult): AnexoDocument {
  const phase = answers.projectPhase ?? 'DB'
  const onlyEssentials = phase === 'DC'
  const phaseLabel = phase === 'DC' ? 'Diseño Conceptual' : phase === 'DD' ? 'Diseño Detallado' : 'Diseño Básico'

  return {
    title: 'Tabla de Propiedades Estructurales por Fase',
    projectInfo: baseProjectInfo(answers, getPhaseLabel(answers.projectPhase), 'Equipo de Proyecto'),
    elements: elementsFromMapping(mapping, onlyEssentials ? (prop) => prop.required : undefined),
    regulations: mapping.classifications.map((c) => c.label),
    phase: phaseLabel
  }
}
