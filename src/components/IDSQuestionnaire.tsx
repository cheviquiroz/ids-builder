import { useState } from 'react'
import type { Answers, QuestionId } from '../modules/ids_builder_questions'
import { QUESTIONS, QUESTION_ORDER } from '../modules/ids_builder_questions'
import type { MappingResult } from '../modules/ids_builder_mappings'
import { buildMapping } from '../modules/ids_builder_mappings'
import type { PreviewData } from '../modules/ids_builder_generator'
import { generateIdsXml, getIDSPreviewData } from '../modules/ids_builder_generator'
import IDSPreview from './IDSPreview'

type Step = 'questionnaire' | 'confirm' | 'result'

interface GeneratedDocument {
  answers: Answers
  mapping: MappingResult
  xml: string
  preview: PreviewData
}

function toggleMultiValue(current: string[] | undefined, value: string): string[] {
  const list = current ?? []
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

/**
 * Busca la siguiente posición aplicable en QUESTION_ORDER a partir de `from`,
 * en la dirección indicada. Ninguna pregunta depende del contenido de otra
 * (solo de si ya fue respondida), por lo que basta con evaluar contra las
 * respuestas ya dadas hasta el momento.
 */
function findApplicablePosition(from: number, direction: 1 | -1, answers: Answers): number {
  let pos = from
  while (pos >= 0 && pos < QUESTION_ORDER.length) {
    if (QUESTIONS[QUESTION_ORDER[pos]].isApplicable(answers)) return pos
    pos += direction
  }
  return pos
}

export default function IDSQuestionnaire() {
  const [answers, setAnswers] = useState<Answers>({})
  const [currentPos, setCurrentPos] = useState(0)
  const [step, setStep] = useState<Step>('questionnaire')
  const [generated, setGenerated] = useState<GeneratedDocument | null>(null)

  const currentQuestion = QUESTIONS[QUESTION_ORDER[currentPos]]

  // Lista de preguntas aplicables según lo respondido hasta ahora, usada solo
  // para mostrar el progreso (el total puede variar a medida que se avanza).
  const applicableIds = QUESTION_ORDER.filter((id) => QUESTIONS[id].isApplicable(answers))
  const positionAmongApplicable = applicableIds.indexOf(currentQuestion.id)
  const progress = applicableIds.length > 0 ? Math.round((positionAmongApplicable / applicableIds.length) * 100) : 0

  function setAnswer(id: QuestionId, value: Answers[QuestionId]) {
    setAnswers((prev) => ({ ...prev, [id]: value }))
  }

  function advance(nextAnswers: Answers) {
    const nextPos = findApplicablePosition(currentPos + 1, 1, nextAnswers)
    if (nextPos >= QUESTION_ORDER.length) {
      setStep('confirm')
    } else {
      setCurrentPos(nextPos)
    }
  }

  function goBack() {
    if (step === 'confirm') {
      setStep('questionnaire')
      return
    }
    const prevPos = findApplicablePosition(currentPos - 1, -1, answers)
    if (prevPos >= 0) {
      setCurrentPos(prevPos)
    }
  }

  function handleSingleSelect(id: QuestionId, value: string) {
    const nextAnswers: Answers = { ...answers, [id]: value }
    setAnswers(nextAnswers)
    // Especialidades distintas de "Estructura" no están soportadas todavía:
    // se guarda la selección (para reflejarla en el botón) pero no se avanza.
    if (id === 'specialization' && value !== 'structure') return
    setTimeout(() => advance(nextAnswers), 150)
  }

  function handleMultiToggle(id: QuestionId, value: string) {
    const current = answers[id] as string[] | undefined
    setAnswer(id, toggleMultiValue(current, value))
  }

  function handleGenerate() {
    const mapping = buildMapping(answers)
    const xml = generateIdsXml(answers)
    const preview = getIDSPreviewData(mapping, answers)
    setGenerated({ answers, mapping, xml, preview })
    setStep('result')
  }

  function restart() {
    setAnswers({})
    setCurrentPos(0)
    setGenerated(null)
    setStep('questionnaire')
  }

  if (step === 'result' && generated) {
    return (
      <IDSPreview
        xml={generated.xml}
        preview={generated.preview}
        answers={generated.answers}
        mapping={generated.mapping}
        onRestart={restart}
      />
    )
  }

  if (step === 'confirm') {
    return (
      <div className="ids-confirm">
        <h2>Todo listo - Revisa tu proyecto</h2>
        <p className="ids-confirm__subtitle">
          Confirma tus respuestas antes de generar el documento con los requisitos de tu proyecto.
        </p>
        <ul className="ids-confirm__summary">
          {applicableIds.map((id) => {
            const question = QUESTIONS[id]
            const value = answers[id]
            const options = question.getOptions(answers)
            const labels = Array.isArray(value)
              ? value.map((v) => options.find((o) => o.value === v)?.label ?? v)
              : [options.find((o) => o.value === value)?.label ?? value ?? '—']
            const title = question.getTitle?.(answers) || question.title
            return (
              <li key={id}>
                <span className="ids-confirm__question">{title}</span>
                <span className="ids-confirm__answer">→ {labels.join(', ')}</span>
              </li>
            )
          })}
        </ul>
        <div className="ids-nav">
          <button className="ids-btn ids-btn--ghost" onClick={goBack}>
            ← Atrás
          </button>
          <button className="ids-btn ids-btn--primary" onClick={handleGenerate}>
            Generar Documento →
          </button>
        </div>
      </div>
    )
  }

  const value = answers[currentQuestion.id]
  const options = currentQuestion.getOptions(answers)
  const isTextQuestion = currentQuestion.type === 'text' || currentQuestion.type === 'email' || currentQuestion.type === 'textarea'

  // La sugerencia (getDefaultValue) se muestra solo como placeholder, nunca
  // se guarda sola: si el usuario no escribe nada, el XML final arma su
  // propia descripción con las respuestas completas del cuestionario (más
  // informativa que esta sugerencia temprana, calculada antes de tener
  // sistema/tipo de proyecto respondidos).
  const textValue = isTextQuestion ? (value as string | undefined) ?? '' : ''
  const textPlaceholder = currentQuestion.getDefaultValue?.(answers) ?? currentQuestion.placeholder
  const fieldError = isTextQuestion && textValue ? currentQuestion.validate?.(textValue) ?? null : null
  const isTextAnswerValid = currentQuestion.required === false || (!!textValue.trim() && !fieldError)

  function handleTextChange(nextValue: string) {
    setAnswer(currentQuestion.id, nextValue)
  }

  return (
    <div className="ids-questionnaire">
      <div className="ids-progress">
        <div className="ids-progress__bar" style={{ width: `${progress}%` }} />
      </div>
      <div className="ids-question">
        <span className="ids-question__step">
          Pregunta {positionAmongApplicable + 1} de {applicableIds.length}
        </span>
        <h2 className="ids-question__title">
          {currentQuestion.getTitle?.(answers) || currentQuestion.title}
          {currentQuestion.required !== false ? ' *' : ''}
        </h2>
        {currentQuestion.helperText && <p className="ids-question__helper">{currentQuestion.helperText}</p>}

        {isTextQuestion ? (
          <div className="ids-text-field">
            {currentQuestion.type === 'textarea' ? (
              <textarea
                className="ids-text-field__input ids-text-field__input--textarea"
                value={textValue}
                placeholder={textPlaceholder}
                rows={4}
                onChange={(e) => handleTextChange(e.target.value)}
              />
            ) : (
              <input
                className="ids-text-field__input"
                type={currentQuestion.type === 'email' ? 'email' : 'text'}
                value={textValue}
                placeholder={textPlaceholder}
                onChange={(e) => handleTextChange(e.target.value)}
              />
            )}
            {fieldError && <p className="ids-text-field__error">{fieldError}</p>}
          </div>
        ) : (
          <div className="ids-options">
            {options.map((option) => {
              const isSelected =
                currentQuestion.type === 'multi'
                  ? ((value as string[] | undefined) ?? []).includes(option.value)
                  : value === option.value

              return (
                <button
                  key={option.value}
                  className={`ids-option ${isSelected ? 'ids-option--selected' : ''}`}
                  onClick={() =>
                    currentQuestion.type === 'multi'
                      ? handleMultiToggle(currentQuestion.id, option.value)
                      : handleSingleSelect(currentQuestion.id, option.value)
                  }
                >
                  <span className="ids-option__label">{option.label}</span>
                  {option.description && <span className="ids-option__description">{option.description}</span>}
                </button>
              )
            })}
          </div>
        )}

        {currentQuestion.id === 'specialization' && value && value !== 'structure' && (
          <p className="ids-question__warning">
            ⚠️ Esta versión solo soporta Estructura. Selecciona Estructura para continuar.
          </p>
        )}

        <div className="ids-nav">
          <button className="ids-btn ids-btn--ghost" onClick={goBack} disabled={currentPos === 0}>
            ← Atrás
          </button>
          {(currentQuestion.type === 'multi' || isTextQuestion) && (
            <button
              className="ids-btn ids-btn--primary"
              onClick={() => advance(answers)}
              disabled={
                isTextQuestion
                  ? !isTextAnswerValid
                  : currentQuestion.required !== false && !((value as string[] | undefined) ?? []).length
              }
            >
              {isTextQuestion ? 'Siguiente →' : 'Continuar →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
