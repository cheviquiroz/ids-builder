// Árbol de preguntas del IDS Builder para proyectos de estructura.
// Define el flujo tipo Typeform (una pregunta a la vez) con lógica condicional.
// Todo el texto aquí es lenguaje de proyecto/obra: sin IFC, PropertySet, XML ni jerga BIM.

export type Specialization = 'structure' | 'architecture' | 'mep' | 'other'
export type ProjectType = 'vivienda' | 'oficinas' | 'industrial' | 'comercial' | 'educacional' | 'salud' | 'otro'
export type StructuralSystem = 'hormigon' | 'acero' | 'mixto' | 'madera'
export type ProjectPhase = 'DC' | 'DB' | 'DD'

export type AnswerValue = string | string[]

export interface Answers {
  // Metadatos del documento IDS (obligatorios los dos primeros; van antes del cuestionario).
  idsTitle?: string
  authorEmail?: string
  idsDescription?: string

  specialization?: Specialization
  projectType?: ProjectType
  projectPhase?: ProjectPhase
  structuralSystem?: StructuralSystem
  regulation?: string[]
}

export type QuestionId = keyof Answers

export interface QuestionOption {
  value: string
  label: string
  description?: string
}

/**
 * El estándar IDS 1.0 exige que el autor sea un correo con formato válido:
 * el propio XSD oficial de buildingSMART restringe <info><author> con el
 * patrón `[^@]+@[^\.]+\..+`. Este regex es un poco más estricto (sin
 * espacios) pero cualquier valor que lo cumpla también cumple el del XSD.
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim())
}

export interface Question {
  id: QuestionId
  title: string
  helperText?: string
  type: 'single' | 'multi' | 'text' | 'email' | 'textarea'
  /** Si la pregunta debe responderse para poder avanzar. Por defecto true. */
  required?: boolean
  /** Placeholder para preguntas de tipo texto/email/textarea. */
  placeholder?: string
  /** Sugerencia de valor inicial para preguntas de texto (p.ej. autocompletar la descripción). */
  getDefaultValue?: (answers: Answers) => string
  /** Mensaje de error si el valor de texto no es válido (p.ej. email mal formado). Null = válido. */
  validate?: (value: string) => string | null
  /** Genera las opciones disponibles en función de las respuestas previas (solo single/multi). */
  getOptions: (answers: Answers) => QuestionOption[]
  /** Determina si la pregunta debe mostrarse dado el estado actual de respuestas. */
  isApplicable: (answers: Answers) => boolean
}

export const QUESTION_ORDER: QuestionId[] = [
  'idsTitle',
  'authorEmail',
  'idsDescription',
  'specialization',
  'projectType',
  'projectPhase',
  'structuralSystem',
  'regulation'
]

export const QUESTIONS: Record<QuestionId, Question> = {
  idsTitle: {
    id: 'idsTitle',
    title: 'Título del IDS',
    helperText: 'Nombre descriptivo de este IDS.',
    type: 'text',
    required: true,
    placeholder: 'IDS - Estructura Hormigón Armado',
    isApplicable: () => true,
    getOptions: () => []
  },

  authorEmail: {
    id: 'authorEmail',
    title: 'Email del autor',
    helperText: 'Tu correo de contacto (ej: chevi@bwisebim.com).',
    type: 'email',
    required: true,
    placeholder: 'chevi@bwisebim.com',
    validate: (value) => (isValidEmail(value) ? null : 'Email no válido (ej: chevi@bwisebim.com)'),
    isApplicable: () => true,
    getOptions: () => []
  },

  idsDescription: {
    id: 'idsDescription',
    title: 'Descripción',
    helperText: 'Notas adicionales sobre este IDS (opcional).',
    type: 'textarea',
    required: false,
    getDefaultValue: (answers) => {
      const system = QUESTIONS.structuralSystem.getOptions(answers).find((o) => o.value === answers.structuralSystem)
      const type = QUESTIONS.projectType.getOptions(answers).find((o) => o.value === answers.projectType)
      return `Especificación para ${system?.label ?? 'Sistema'} - ${type?.label ?? 'Tipo de proyecto'}`
    },
    isApplicable: () => true,
    getOptions: () => []
  },

  specialization: {
    id: 'specialization',
    title: '¿Qué especialidad?',
    helperText: 'IDS se define por disciplina. Por ahora solo soportamos Estructura.',
    type: 'single',
    required: true,
    isApplicable: () => true,
    getOptions: () => [
      {
        value: 'structure',
        label: 'Estructura (Hormigón, Acero, Madera)',
        description: 'Requisitos para diseño estructural.'
      },
      { value: 'architecture', label: 'Arquitectura', description: 'No disponible en esta versión.' },
      { value: 'mep', label: 'MEP (Mecánica, Eléctrica, Plomería)', description: 'No disponible en esta versión.' },
      { value: 'other', label: 'Otra especialidad', description: 'No disponible en esta versión.' }
    ]
  },

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
    helperText: 'Selecciona las que apliquen (opcional).',
    type: 'multi',
    required: false,
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
  }
}

/** Devuelve la lista de preguntas visibles, en orden, dado el estado actual de respuestas. */
export function getVisibleQuestions(answers: Answers): Question[] {
  return QUESTION_ORDER.map((id) => QUESTIONS[id]).filter((q) => q.isApplicable(answers))
}

/** Verifica si todas las preguntas aplicables (y obligatorias) ya fueron respondidas. */
export function isComplete(answers: Answers): boolean {
  return getVisibleQuestions(answers).every((q) => {
    if (q.required === false) return true
    const value = answers[q.id]
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'string') {
      if (!value.trim()) return false
      return !q.validate || q.validate(value) === null
    }
    return !!value
  })
}
