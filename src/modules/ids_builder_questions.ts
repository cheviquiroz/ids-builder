// Árbol de preguntas del IDS Builder para proyectos de estructura.
// Define el flujo tipo Typeform (una pregunta a la vez) con lógica condicional.
// Todo el texto aquí es lenguaje de proyecto/obra: sin IFC, PropertySet, XML ni jerga BIM.

export type ProjectType = 'vivienda' | 'oficinas' | 'industrial' | 'comercial' | 'educacional' | 'salud' | 'otro'
export type StructuralSystem = 'hormigon' | 'acero' | 'mixto' | 'madera'
export type ProjectPhase = 'DC' | 'DB' | 'DD'

export type AnswerValue = string | string[]

export interface Answers {
  projectType?: ProjectType
  projectPhase?: ProjectPhase
  structuralSystem?: StructuralSystem
  regulation?: string[]
  reviewRoles?: string[]
}

export type QuestionId = keyof Answers

export interface QuestionOption {
  value: string
  label: string
  description?: string
}

export interface Question {
  id: QuestionId
  title: string
  helperText?: string
  type: 'single' | 'multi'
  /** Genera las opciones disponibles en función de las respuestas previas. */
  getOptions: (answers: Answers) => QuestionOption[]
  /** Determina si la pregunta debe mostrarse dado el estado actual de respuestas. */
  isApplicable: (answers: Answers) => boolean
}

export const QUESTION_ORDER: QuestionId[] = [
  'projectType',
  'projectPhase',
  'structuralSystem',
  'regulation',
  'reviewRoles'
]

export const QUESTIONS: Record<QuestionId, Question> = {
  projectType: {
    id: 'projectType',
    title: '¿Qué tipo de proyecto estás desarrollando?',
    helperText: 'Nos ayuda a entender el uso y el contexto normativo de tu proyecto.',
    type: 'single',
    isApplicable: () => true,
    getOptions: () => [
      { value: 'vivienda', label: 'Vivienda', description: 'Proyecto habitacional, unifamiliar o multifamiliar.' },
      { value: 'oficinas', label: 'Oficinas', description: 'Edificio corporativo o de oficinas.' },
      { value: 'industrial', label: 'Industrial', description: 'Naves industriales, bodegas o plantas.' },
      { value: 'comercial', label: 'Comercial', description: 'Locales comerciales, strip centers o malls.' },
      { value: 'educacional', label: 'Educacional', description: 'Colegios, universidades o jardines infantiles.' },
      { value: 'salud', label: 'Salud', description: 'Hospitales, clínicas o centros de salud.' },
      { value: 'otro', label: 'Otro', description: 'Otro tipo de proyecto.' }
    ]
  },

  projectPhase: {
    id: 'projectPhase',
    title: '¿En qué fase se encuentra el proyecto?',
    helperText: 'Define cuánto detalle le vamos a pedir a la información del proyecto.',
    type: 'single',
    isApplicable: () => true,
    getOptions: () => [
      {
        value: 'DC',
        label: 'Idea Inicial / Conceptual',
        description: 'Primeras líneas, criterios generales de estructuración.'
      },
      {
        value: 'DB',
        label: 'Anteproyecto / Diseño Básico',
        description: 'Definición preliminar, coordinación entre disciplinas.'
      },
      {
        value: 'DD',
        label: 'Proyecto Ejecutivo / Diseño Detallado',
        description: 'Especificaciones técnicas, detalles constructivos listos para obra.'
      }
    ]
  },

  structuralSystem: {
    id: 'structuralSystem',
    title: '¿Cuál es el sistema estructural principal?',
    helperText: 'Define los elementos y materiales que describirá tu proyecto.',
    type: 'single',
    isApplicable: () => true,
    getOptions: () => [
      { value: 'hormigon', label: 'Hormigón Armado' },
      { value: 'acero', label: 'Acero' },
      { value: 'mixto', label: 'Mixto (Hormigón + Acero)' },
      { value: 'madera', label: 'Madera' }
    ]
  },

  regulation: {
    id: 'regulation',
    title: '¿Qué normativas rigen tu proyecto?',
    helperText: 'Selecciona todas las que apliquen.',
    type: 'multi',
    isApplicable: (answers) => !!answers.structuralSystem,
    getOptions: () => [
      {
        value: 'estandar_bim_publico',
        label: 'Estándar BIM para Proyectos Públicos',
        description: 'Si es un proyecto público.'
      },
      { value: 'oguc', label: 'OGUC - Ordenanza General de Urbanismo y Construcciones' },
      { value: 'nch', label: 'Normas Técnicas Chilenas (NCh)' },
      { value: 'municipales_dom', label: 'Exigencias Municipales / DOM' }
    ]
  },

  reviewRoles: {
    id: 'reviewRoles',
    title: '¿Quién revisa y valida la información estructural?',
    helperText: 'Selecciona todos los que apliquen.',
    type: 'multi',
    isApplicable: () => true,
    getOptions: () => [
      { value: 'calculista', label: 'Ingeniero Cálculista / Estructural' },
      { value: 'constructor', label: 'Constructor / Maestro Mayor', description: 'Responsable en obra.' },
      { value: 'supervisor', label: 'Supervisor de Obras' },
      { value: 'autoridades', label: 'Municipalidad / Autoridades' }
    ]
  }
}

/** Devuelve la lista de preguntas visibles, en orden, dado el estado actual de respuestas. */
export function getVisibleQuestions(answers: Answers): Question[] {
  return QUESTION_ORDER.map((id) => QUESTIONS[id]).filter((q) => q.isApplicable(answers))
}

/** Verifica si todas las preguntas aplicables ya fueron respondidas. */
export function isComplete(answers: Answers): boolean {
  return getVisibleQuestions(answers).every((q) => {
    const value = answers[q.id]
    if (Array.isArray(value)) return value.length > 0
    return !!value
  })
}
