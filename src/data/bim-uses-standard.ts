/**
 * ESTÁNDAR BIM PARA PROYECTOS PÚBLICOS
 * Tabla 06: Usos BIM (25 usos) + Tabla 07: TDI por Uso BIM
 *
 * Fuente: Estándar BIM para Proyectos Públicos (PlanBIM)
 * Adaptado para: DC (Idea Inicial), DB (Anteproyecto), DD (Ejecutivo)
 * Basado en: Project Execution Planning Guide v2.1 (2011)
 */

// Mapeo: Fases BIM estándar → Fases IDS Chile (DC/DB/DD)
export const PHASE_MAPPING = {
  'dc': ['PLANIFICACIÓN', 'DISEÑO'],      // DC incluye Usos 1-8
  'db': ['DISEÑO'],                        // DB = Usos 6-14
  'dd': ['CONSTRUCCIÓN', 'OPERACIÓN']     // DD = Usos 15-25
} as const;

export type BIMPhase = 'PLANIFICACIÓN' | 'DISEÑO' | 'CONSTRUCCIÓN' | 'OPERACIÓN';
export type IDSPhase = 'dc' | 'db' | 'dd';

/**
 * TODOS LOS USOS BIM (25) CON SUS TDI ASOCIADOS
 */
export const BIM_USES_COMPLETE = {
  // ═══════════════════════════════════════════════════════════════
  // FASE: PLANIFICACIÓN (Usos 1-5) → Aplica en: DC
  // ═══════════════════════════════════════════════════════════════

  USE_01_LEVANTAMIENTO: {
    id: 'uso_01_levantamiento',
    number: 1,
    bimPhase: 'PLANIFICACIÓN',
    idsPhases: ['dc'] as IDSPhase[],
    label: 'Levantamiento de condiciones existentes',
    description: 'Recopilación de información del estado actual de sitio/edificio',
    tdiRequired: ['TDI_B', 'TDI_C'],
    alternativeForRehabilitation: false
  },

  USE_02_ESTIMACION: {
    id: 'uso_02_estimacion',
    number: 2,
    bimPhase: 'PLANIFICACIÓN',
    idsPhases: ['dc'] as IDSPhase[],
    label: 'Estimación de cantidades y costos',
    description: 'Mediciones, presupuestos y estimación de recursos',
    tdiRequired: ['TDI_B', 'TDI_F'],
    alternativeForRehabilitation: false
  },

  USE_03_PLANIFICACION_FASES: {
    id: 'uso_03_planificacion_fases',
    number: 3,
    bimPhase: 'PLANIFICACIÓN',
    idsPhases: ['dc'] as IDSPhase[],
    label: 'Planificación de fases',
    description: 'Utilización de modelos 4D (3D + tiempo) para secuencia constructiva',
    tdiRequired: ['TDI_B', 'TDI_L'],
    alternativeForRehabilitation: true
  },

  USE_04_PROGRAMA_ESPACIAL: {
    id: 'uso_04_programa_espacial',
    number: 4,
    bimPhase: 'PLANIFICACIÓN',
    idsPhases: ['dc'] as IDSPhase[],
    label: 'Análisis del cumplimiento del programa espacial (zonificación)',
    description: 'Evaluación de eficiencia y exactitud vs requerimientos',
    tdiRequired: ['TDI_B', 'TDI_J', 'TDI_K'],
    alternativeForRehabilitation: false
  },

  USE_05_ANALISIS_UBICACION: {
    id: 'uso_05_analisis_ubicacion',
    number: 5,
    bimPhase: 'PLANIFICACIÓN',
    idsPhases: ['dc'] as IDSPhase[],
    label: 'Análisis de ubicación',
    description: 'Evaluación de propiedades del área y localización óptima',
    tdiRequired: ['TDI_C', 'TDI_I'],
    alternativeForRehabilitation: false
  },

  // ═══════════════════════════════════════════════════════════════
  // FASE: DISEÑO (Usos 6-14) → Aplica en: DB, DD (inicio)
  // ═══════════════════════════════════════════════════════════════

  USE_06_COORDINACION_3D: {
    id: 'uso_06_coordinacion_3d',
    number: 6,
    bimPhase: 'DISEÑO',
    idsPhases: ['db', 'dd'] as IDSPhase[],
    label: 'Coordinación 3D',
    description: 'Detección de interferencias entre disciplinas previo y post-diseño',
    tdiRequired: ['TDI_A', 'TDI_B', 'TDI_C'],
    alternativeForRehabilitation: false
  },

  USE_07_DISEÑO_ESPECIALIDADES: {
    id: 'uso_07_diseño_especialidades',
    number: 7,
    bimPhase: 'DISEÑO',
    idsPhases: ['db', 'dd'] as IDSPhase[],
    label: 'Diseño de especialidades',
    description: 'Creación de modelos BIM por disciplina (Arquitectura, Estructura, MEP)',
    tdiRequired: ['TDI_A', 'TDI_B', 'TDI_D', 'TDI_E'],
    alternativeForRehabilitation: false
  },

  USE_08_REVISION_DISEÑO: {
    id: 'uso_08_revision_diseño',
    number: 8,
    bimPhase: 'DISEÑO',
    idsPhases: ['db', 'dd'] as IDSPhase[],
    label: 'Revisión del diseño',
    description: 'Revisión de respuestas a requerimientos (áreas, iluminación, seguridad, confort, etc.)',
    tdiRequired: ['TDI_A', 'TDI_B', 'TDI_E'],
    alternativeForRehabilitation: false
  },

  USE_09_ANALISIS_ESTRUCTURAL: {
    id: 'uso_09_analisis_estructural',
    number: 9,
    bimPhase: 'DISEÑO',
    idsPhases: ['db', 'dd'] as IDSPhase[],
    label: 'Análisis estructural',
    description: 'Análisis del comportamiento de sistemas estructurales',
    tdiRequired: ['TDI_B', 'TDI_E', 'TDI_K'],
    alternativeForRehabilitation: false
  },

  USE_10_ANALISIS_LUMINICO: {
    id: 'uso_10_analisis_luminico',
    number: 10,
    bimPhase: 'DISEÑO',
    idsPhases: ['db', 'dd'] as IDSPhase[],
    label: 'Análisis lumínico',
    description: 'Análisis de iluminación natural y artificial, sombra solar',
    tdiRequired: ['TDI_B', 'TDI_E', 'TDI_G'],
    alternativeForRehabilitation: false
  },

  USE_11_ANALISIS_ENERGETICO: {
    id: 'uso_11_analisis_energetico',
    number: 11,
    bimPhase: 'DISEÑO',
    idsPhases: ['db', 'dd'] as IDSPhase[],
    label: 'Análisis energético',
    description: 'Evaluación de criterios energéticos, desempeño y consumo',
    tdiRequired: ['TDI_B', 'TDI_E', 'TDI_G'],
    alternativeForRehabilitation: false
  },

  USE_12_ANALISIS_MECANICO: {
    id: 'uso_12_analisis_mecanico',
    number: 12,
    bimPhase: 'DISEÑO',
    idsPhases: ['db', 'dd'] as IDSPhase[],
    label: 'Análisis mecánico',
    description: 'Análisis de sistemas mecánicos (HVAC, etc.)',
    tdiRequired: ['TDI_B', 'TDI_E'],
    alternativeForRehabilitation: false
  },

  USE_13_OTROS_ANALISIS: {
    id: 'uso_13_otros_analisis',
    number: 13,
    bimPhase: 'DISEÑO',
    idsPhases: ['db', 'dd'] as IDSPhase[],
    label: 'Otros análisis de ingeniería',
    description: 'Análisis acústico, aeronáutico, sísmico, etc.',
    tdiRequired: ['TDI_B', 'TDI_E'],
    alternativeForRehabilitation: false
  },

  USE_14_SUSTENTABILIDAD: {
    id: 'uso_14_sustentabilidad',
    number: 14,
    bimPhase: 'DISEÑO',
    idsPhases: ['db', 'dd'] as IDSPhase[],
    label: 'Evaluación de sustentabilidad',
    description: 'Evaluación según criterios de sustentabilidad',
    tdiRequired: ['TDI_B', 'TDI_E', 'TDI_H'],
    alternativeForRehabilitation: false
  },

  // ═══════════════════════════════════════════════════════════════
  // FASE: CONSTRUCCIÓN (Usos 15-19) → Aplica en: DD
  // ═══════════════════════════════════════════════════════════════

  USE_15_VALIDACION_NORMATIVA: {
    id: 'uso_15_validacion_normativa',
    number: 15,
    bimPhase: 'CONSTRUCCIÓN',
    idsPhases: ['dd'] as IDSPhase[],
    label: 'Validación normativa',
    description: 'Revisión de cumplimiento de códigos y normas (OGUC, NCh, etc.)',
    tdiRequired: ['TDI_K', 'TDI_E'],
    alternativeForRehabilitation: false
  },

  USE_16_PLANIFICACION_OBRA: {
    id: 'uso_16_planificacion_obra',
    number: 16,
    bimPhase: 'CONSTRUCCIÓN',
    idsPhases: ['dd'] as IDSPhase[],
    label: 'Planificación de obra',
    description: 'Planificación gráfica de actividades, costo de mano de obra, materiales',
    tdiRequired: ['TDI_B', 'TDI_L', 'TDI_M', 'TDI_F'],
    alternativeForRehabilitation: false
  },

  USE_17_DISEÑO_SISTEMAS_CONSTRUCTIVOS: {
    id: 'uso_17_diseño_sistemas_constructivos',
    number: 17,
    bimPhase: 'CONSTRUCCIÓN',
    idsPhases: ['dd'] as IDSPhase[],
    label: 'Diseño de sistemas constructivos',
    description: 'Diseño de sistemas complementarios (andamios, apuntalamientos, etc.)',
    tdiRequired: ['TDI_B', 'TDI_D', 'TDI_L'],
    alternativeForRehabilitation: false
  },

  USE_18_FABRICACION_DIGITAL: {
    id: 'uso_18_fabricacion_digital',
    number: 18,
    bimPhase: 'CONSTRUCCIÓN',
    idsPhases: ['dd'] as IDSPhase[],
    label: 'Fabricación Digital',
    description: 'Utilización de información BIM para fabricación de componentes',
    tdiRequired: ['TDI_B', 'TDI_D', 'TDI_M'],
    alternativeForRehabilitation: false
  },

  USE_19_CONTROL_OBRA: {
    id: 'uso_19_control_obra',
    number: 19,
    bimPhase: 'CONSTRUCCIÓN',
    idsPhases: ['dd'] as IDSPhase[],
    label: 'Control de obra',
    description: 'Monitoreo, análisis y optimización de construcción según especificaciones',
    tdiRequired: ['TDI_B', 'TDI_M', 'TDI_K'],
    alternativeForRehabilitation: false
  },

  // ═══════════════════════════════════════════════════════════════
  // FASE: OPERACIÓN (Usos 20-25) → No aplica en DD (futura)
  // ═══════════════════════════════════════════════════════════════

  USE_20_MODELACION_AS_BUILT: {
    id: 'uso_20_modelacion_as_built',
    number: 20,
    bimPhase: 'OPERACIÓN',
    idsPhases: [] as IDSPhase[],  // Futura fase post-DD
    label: 'Modelación as-Built',
    description: 'Modelo que representa exactamente las condiciones físicas de lo construido',
    tdiRequired: ['TDI_B', 'TDI_D', 'TDI_M', 'TDI_O'],
    alternativeForRehabilitation: false
  },

  USE_21_GESTION_ACTIVOS: {
    id: 'uso_21_gestion_activos',
    number: 21,
    bimPhase: 'OPERACIÓN',
    idsPhases: [] as IDSPhase[],
    label: 'Gestión de activos',
    description: 'Sistema vinculado bidireccionalmente a modelo as-built para mantención y operación',
    tdiRequired: ['TDI_B', 'TDI_D', 'TDI_N', 'TDI_O'],
    alternativeForRehabilitation: false
  },

  USE_22_ANALISIS_SISTEMAS: {
    id: 'uso_22_analisis_sistemas',
    number: 22,
    bimPhase: 'OPERACIÓN',
    idsPhases: [] as IDSPhase[],
    label: 'Análisis de sistemas',
    description: 'Análisis de desempeño de sistemas mecánicos, energéticos, etc.',
    tdiRequired: ['TDI_B', 'TDI_E', 'TDI_G'],
    alternativeForRehabilitation: false
  },

  USE_23_MANTENIMIENTO_PREVENTIVO: {
    id: 'uso_23_mantenimiento_preventivo',
    number: 23,
    bimPhase: 'OPERACIÓN',
    idsPhases: [] as IDSPhase[],
    label: 'Mantenimiento preventivo',
    description: 'Mantención funcional de estructura y equipamiento durante operación',
    tdiRequired: ['TDI_B', 'TDI_D', 'TDI_O'],
    alternativeForRehabilitation: false
  },

  USE_24_GESTION_ESPACIOS: {
    id: 'uso_24_gestion_espacios',
    number: 24,
    bimPhase: 'OPERACIÓN',
    idsPhases: [] as IDSPhase[],
    label: 'Gestión y seguimiento de espacios',
    description: 'Administración de espacios y recursos para análisis de uso y cambios',
    tdiRequired: ['TDI_A', 'TDI_B', 'TDI_J'],
    alternativeForRehabilitation: true
  },

  USE_25_GESTION_EMERGENCIAS: {
    id: 'uso_25_gestion_emergencias',
    number: 25,
    bimPhase: 'OPERACIÓN',
    idsPhases: [] as IDSPhase[],
    label: 'Planificación y gestión de emergencias',
    description: 'Acceso a información crítica para respuesta ante emergencias',
    tdiRequired: ['TDI_B', 'TDI_C', 'TDI_K', 'TDI_N'],
    alternativeForRehabilitation: false
  }
} as const;

export type BIMUseKey = keyof typeof BIM_USES_COMPLETE;

/**
 * TIPOS DE INFORMACIÓN (TDI) - 15 categorías
 * Basado en: Matriz de Elementos/Objetos US Veterans Affairs
 */
export const TDI_DEFINITIONS = {
  TDI_A: {
    id: 'TDI_A',
    label: 'Información general del proyecto',
    description: 'Identificación: tipo de edificio, nombre, dirección, requerimientos espaciales/programáticos'
  },
  TDI_B: {
    id: 'TDI_B',
    label: 'Propiedades físicas y geométricas',
    description: 'Características físicas: ancho, largo, alto, área, volumen, masa'
  },
  TDI_C: {
    id: 'TDI_C',
    label: 'Propiedades geográficas y de localización espacial',
    description: 'Georreferencia: latitud, longitud, número/nombre de piso, espacios/zonas'
  },
  TDI_D: {
    id: 'TDI_D',
    label: 'Requerimientos específicos para fabricante y/o constructor',
    description: 'Tipo elemento, materialidad, componentes, identificación de producto'
  },
  TDI_E: {
    id: 'TDI_E',
    label: 'Especificaciones técnicas',
    description: 'Peso transporte, nivel ruido, performance de equipos fabricados industrialmente'
  },
  TDI_F: {
    id: 'TDI_F',
    label: 'Requerimientos y estimación de costos',
    description: 'Costo unitario, costo base ensamblaje, costo transporte'
  },
  TDI_G: {
    id: 'TDI_G',
    label: 'Requerimientos energéticos',
    description: 'Características energéticas: humedad, valor U, consumo servicios, low-E glazing'
  },
  TDI_H: {
    id: 'TDI_H',
    label: 'Estándar sostenible',
    description: 'Sustentabilidad: calidad iluminación, materiales sustentables, contenido reciclado'
  },
  TDI_I: {
    id: 'TDI_I',
    label: 'Condiciones del sitio y medioambientales',
    description: 'Característica del sitio: condiciones sísmicas, uso suelo, niveles de riesgo'
  },
  TDI_J: {
    id: 'TDI_J',
    label: 'Validación de cumplimiento de programa',
    description: 'Validación programática: áreas planificadas, requisitos vidriado, volumetría, servicios'
  },
  TDI_K: {
    id: 'TDI_K',
    label: 'Cumplimiento normativo',
    description: 'Normas OGUC/NCh: control fuego, ventilación, anchos accesos, carga ocupación, seguridad'
  },
  TDI_L: {
    id: 'TDI_L',
    label: 'Requerimientos de fases, secuencia de tiempo y calendarización',
    description: 'Programación: fases, orden hitos, orden construcción, timing'
  },
  TDI_M: {
    id: 'TDI_M',
    label: 'Logística y secuencia de construcción',
    description: 'ID material, ID instalación, número de serie componente, secuencia'
  },
  TDI_N: {
    id: 'TDI_N',
    label: 'Entrega para la operación',
    description: 'Empresas participantes, contactos, nombre disciplina, áreas de trabajo'
  },
  TDI_O: {
    id: 'TDI_O',
    label: 'Gestión de activos',
    description: 'Tipos productos, tipos repuestos, fechas garantía, operación/mantención'
  }
} as const;

/**
 * HELPERS
 */

export function getTDIForUse(useKey: BIMUseKey): readonly string[] {
  return BIM_USES_COMPLETE[useKey].tdiRequired;
}

export function deriveTDIFromUses(selectedUseKeys: BIMUseKey[]): Set<string> {
  const allTDI = new Set<string>();
  selectedUseKeys.forEach(useKey => {
    getTDIForUse(useKey).forEach(tdi => allTDI.add(tdi));
  });
  return allTDI;
}

export function formatTDIList(tdiSet: Set<string>): string {
  return Array.from(tdiSet)
    .sort()
    .map(tdi => `${tdi} - ${TDI_DEFINITIONS[tdi as keyof typeof TDI_DEFINITIONS].label}`)
    .join('\n');
}

export const ALL_BIM_USES = Object.values(BIM_USES_COMPLETE).sort((a, b) => a.number - b.number);

export function getUsesByIDSPhase(phase: IDSPhase): typeof ALL_BIM_USES {
  return ALL_BIM_USES.filter(u => u.idsPhases.includes(phase));
}
