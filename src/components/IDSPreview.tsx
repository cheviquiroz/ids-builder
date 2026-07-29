import { useMemo, useState } from 'react'
import type { Answers } from '../modules/ids_builder_questions'
import type { MappingResult } from '../modules/ids_builder_mappings'
import type { PreviewData } from '../modules/ids_builder_generator'
import { copyIdsXmlToClipboard, downloadIdsXml } from '../modules/ids_builder_generator'
import { generateAnexoInformacionBIM_DB, generateAnexoInformacionBIM_DC, generateTablaPropiedades } from '../modules/iso19650-generator'
import { exportAnexoDBaPDF, exportAnexoDCaPDF, exportTablaPropiedadesaCSV } from '../utils/documentExport'

interface IDSPreviewProps {
  xml: string
  preview: PreviewData
  answers: Answers
  mapping: MappingResult
  onRestart: () => void
}

export default function IDSPreview({ xml, preview, answers, mapping, onRestart }: IDSPreviewProps) {
  const [showXml, setShowXml] = useState(false)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle')

  const anexoDC = useMemo(() => generateAnexoInformacionBIM_DC(answers), [answers])
  const anexoDB = useMemo(() => generateAnexoInformacionBIM_DB(answers), [answers])
  const tablaPropiedades = useMemo(() => generateTablaPropiedades(answers, mapping), [answers, mapping])

  async function handleCopy() {
    try {
      await copyIdsXmlToClipboard(xml)
      setCopyStatus('copied')
      setTimeout(() => setCopyStatus('idle'), 2000)
    } catch {
      setCopyStatus('error')
      setTimeout(() => setCopyStatus('idle'), 2000)
    }
  }

  return (
    <div className="ids-preview">
      <div className="ids-preview__banner">
        <span className="ids-preview__banner-icon">✅</span>
        <div>
          <h2>Documento Generado con Éxito</h2>
          <p>
            <strong>{preview.projectType}</strong> · <strong>{preview.system}</strong> · Fase:{' '}
            <strong>{preview.phase}</strong>
          </p>
        </div>
      </div>

      <section className="ids-preview__section">
        <h3>🏗️ Elementos Estructurales ({preview.entities.length})</h3>
        <ul className="ids-preview__list">
          {preview.entities.map((entity, i) => (
            <li key={i} className="ids-preview__entity">
              <span className="ids-preview__entity-label">{entity.spanishName}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="ids-preview__section">
        <h3>📋 Información Que el Modelo Debe Contener</h3>
        {preview.entities.length === 0 && <p className="ids-preview__empty">Aún no se definió información requerida.</p>}
        <div className="ids-preview__entity-groups">
          {preview.entities.map((entity) => {
            const properties = preview.propertiesByEntity[entity.ifc] ?? []
            const byCategory: Record<string, typeof properties> = {}
            properties.forEach((prop) => {
              const list = byCategory[prop.category] ?? (byCategory[prop.category] = [])
              list.push(prop)
            })
            const categories = Object.keys(byCategory)

            return (
              <div key={entity.ifc} className="ids-preview__entity-group">
                <h4 className="ids-preview__entity-heading">🏗️ {entity.spanishName}</h4>
                {categories.length === 0 && (
                  <p className="ids-preview__empty">Sin información definida para este elemento.</p>
                )}
                <div className="ids-preview__entity-categories">
                  {categories.map((category) => (
                    <div key={category} className="ids-preview__propset">
                      <h5>{category}</h5>
                      <ul className="ids-preview__list">
                        {byCategory[category].map((prop, i) => (
                          <li key={i} className="ids-preview__property">
                            <span className={`ids-preview__badge ${prop.required ? 'ids-preview__badge--required' : ''}`}>
                              {prop.required ? '✓' : '○'}
                            </span>
                            <div className="ids-preview__property-text">
                              <div className="ids-preview__property-label">{prop.spanishName}</div>
                              <div className="ids-preview__property-technical">{prop.technicalName}</div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="ids-preview__section">
        <h3>✅ Validaciones y Normativa</h3>
        {preview.validations.length === 0 && <p className="ids-preview__empty">Sin validaciones definidas.</p>}
        <ul className="ids-preview__list">
          {preview.validations.map((validation, i) => (
            <li key={i} className="ids-preview__validation">
              ✓ {validation}
            </li>
          ))}
        </ul>
      </section>

      {preview.bimUses.length > 0 && (
        <section className="ids-preview__section">
          <h3>🎯 Usos BIM Seleccionados</h3>
          <ul className="ids-preview__list">
            {preview.bimUses.map((use) => (
              <li key={use.number} className="ids-preview__validation">
                • {use.number}. {use.label}
              </li>
            ))}
          </ul>
        </section>
      )}

      {preview.tdiRequired.length > 0 && (
        <section className="ids-preview__section">
          <h3>📚 TDI Derivados Automáticamente</h3>
          <p className="ids-iso__subtitle">
            Tipos de Información requeridos según los Usos BIM seleccionados (Total: {preview.tdiRequired.length}):
          </p>
          <ul className="ids-preview__list">
            {preview.tdiRequired.map((tdi) => (
              <li key={tdi.id} className="ids-preview__validation">
                {tdi.id}: {tdi.label}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="ids-preview__info">
        ℹ️ Este documento especifica qué información debe contener tu modelo 3D. Herramientas como Solibri,
        BIMcollab o plugins de Revit/ArchiCAD verifican automáticamente que el modelo cumpla.
      </div>

      <section className="ids-iso">
        <h3 className="ids-iso__title">📄 Anexo de Información BIM</h3>
        <p className="ids-iso__subtitle">
          Descarga el anexo que complementa tu Solicitud de Información BIM (SDI BIM):
        </p>
        <div className="ids-iso__grid">
          <button className="ids-iso__btn" onClick={() => exportAnexoDCaPDF(anexoDC)}>
            📋 Anexo DC (PDF)
          </button>
          <button className="ids-iso__btn" onClick={() => exportAnexoDBaPDF(anexoDB)}>
            📋 Anexo DB (PDF)
          </button>
          <button className="ids-iso__btn" onClick={() => exportTablaPropiedadesaCSV(tablaPropiedades)}>
            📊 Tabla Propiedades
          </button>
          <button
            className="ids-iso__btn"
            onClick={() => downloadIdsXml(xml, 'Especificacion_Tecnica_Estructura.ids')}
          >
            ⚙️ Especificación IDS
          </button>
        </div>
      </section>

      <div className="ids-preview__actions">
        <button className="ids-btn ids-btn--info" onClick={handleCopy}>
          {copyStatus === 'copied' ? '✔ Copiado' : copyStatus === 'error' ? '✖ Error al copiar' : '📋 Copiar Especificación'}
        </button>
        <button className="ids-btn ids-btn--muted" onClick={onRestart}>
          🔄 Empezar de Nuevo
        </button>
      </div>

      <button className="ids-preview__toggle" onClick={() => setShowXml((v) => !v)}>
        {showXml ? '▼ Ocultar especificación técnica' : '▶ Ver especificación técnica'}
      </button>

      {showXml && (
        <div className="ids-preview__technical">
          <p className="ids-preview__technical-warning">
            ⚠️ Contenido técnico. Para validadores BIM (Solibri, BIMcollab, plugins de Revit/ArchiCAD).
          </p>
          <pre className="ids-result__xml">
            <code>{xml}</code>
          </pre>
        </div>
      )}
    </div>
  )
}
