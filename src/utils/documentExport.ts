// Exporta el Anexo de Información BIM y la Tabla de Propiedades Estructurales
// a archivos reales sin depender de librerías externas: los anexos (DC/DB) se
// imprimen como PDF genuino usando el diálogo de impresión nativo del
// navegador ("Guardar como PDF"), y la tabla se exporta como CSV (formato que
// Excel/Sheets abren de forma nativa).

import type { AnexoDocument } from '../modules/iso19650-generator'

function slugify(value: string): string {
  const slug = value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  return slug || 'documento'
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function buildAnexoHtml(doc: AnexoDocument, fileTitle: string): string {
  const elementSections = doc.elements
    .map((element) => {
      const rows = element.properties
        .map(
          (prop) => `
              <tr>
                <td>${escapeHtml(prop.spanish)}</td>
                <td class="ifc-code"><code>${escapeHtml(prop.technicalName)}</code></td>
                <td class="ifc-code"><code>${escapeHtml(prop.propertySet)}</code></td>
                <td>${escapeHtml(prop.tdi)}</td>
                <td>${escapeHtml(prop.ndi)}</td>
                <td class="${prop.required ? 'required' : 'optional'}">${prop.required ? '✓ Sí' : '○ No'}</td>
              </tr>`
        )
        .join('')

      return `
        <h3>🏗️ ${escapeHtml(element.name)}</h3>
        <div class="ifc-code"><strong>Entidad IFC:</strong> <code>${escapeHtml(element.ifcClass)}</code></div>
        <table>
          <thead>
            <tr>
              <th>Propiedad (Español)</th>
              <th>Atributo / Parámetro IFC</th>
              <th>PropertySet</th>
              <th>TDI</th>
              <th>NDI</th>
              <th>Requerida</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>`
    })
    .join('')

  const regulations =
    doc.regulations.map((r) => `<li>${escapeHtml(r)}</li>`).join('') || '<li>Sin normativa seleccionada</li>'

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(fileTitle)}</title>
    <style>
      body { font-family: Arial, Helvetica, sans-serif; color: #111827; margin: 20px; line-height: 1.5; }
      h1 { color: #1f2937; font-size: 20px; margin-bottom: 10px; }
      .info { color: #6b7280; font-size: 13px; margin-bottom: 20px; }
      .intro { color: #374151; font-size: 13px; margin: 0 0 18px; }
      h2 { color: #059669; font-size: 14px; margin-top: 25px; margin-bottom: 10px; border-bottom: 2px solid #059669; padding-bottom: 5px; }
      h3 { color: #1f2937; font-size: 13px; margin-top: 15px; margin-bottom: 8px; }
      .ifc-code { color: #6b7280; font-family: monospace; font-size: 11px; }
      table { width: 100%; border-collapse: collapse; margin: 10px 0 20px 0; }
      th { background: #f3f4f6; color: #1f2937; border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: bold; font-size: 12px; }
      td { border: 1px solid #d1d5db; padding: 10px; font-size: 11px; }
      tr:nth-child(even) { background: #f9fafb; }
      .required { color: #059669; font-weight: bold; }
      .optional { color: #9ca3af; }
      ul { margin: 4px 0 0; padding-left: 20px; font-size: 13px; }
      .footer { color: #9ca3af; font-size: 11px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 10px; }
      @media print { body { margin: 0; } }
    </style>
  </head>
  <body>
    <h1>ANEXO DE INFORMACIÓN BIM</h1>
    <p class="intro">
      Este anexo complementa la Solicitud de Información BIM (SDI BIM) y especifica qué información debe
      contener el modelo de estructura para ${escapeHtml(doc.phase)}.
    </p>
    <div class="info">
      <div><strong>Proyecto:</strong> ${escapeHtml(doc.projectInfo.name)}</div>
      <div><strong>Fase:</strong> ${escapeHtml(doc.projectInfo.phase)}</div>
      <div><strong>Sistema Estructural:</strong> ${escapeHtml(doc.projectInfo.system)}</div>
      <div><strong>Empresa:</strong> ${escapeHtml(doc.projectInfo.company)}</div>
      <div><strong>Fecha:</strong> ${escapeHtml(doc.projectInfo.date)}</div>
    </div>

    <h2>Especificación Técnica de Información por Entidad</h2>
    ${elementSections}

    <h2>Normativas y Estándares Aplicables</h2>
    <ul>${regulations}</ul>

    <div class="footer">
      <strong>Nota:</strong> Este anexo complementa la Solicitud de Información BIM (SDI BIM) vigente.
      Especifica qué información estructurada debe contener el modelo 3D para cumplir con los requerimientos
      de coordinación BIM en fase ${escapeHtml(doc.phase.toLowerCase())}.
      Las propiedades marcadas con ✓ son obligatorias; las marcadas con ○ son opcionales pero recomendadas.
    </div>
  </body>
</html>`
}

/** Abre el diálogo de impresión del navegador para guardar el documento como PDF real (sin librerías externas). */
function printDocumentAsPdf(html: string): void {
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  document.body.appendChild(iframe)

  const frameDocument = iframe.contentWindow?.document
  if (!frameDocument) {
    document.body.removeChild(iframe)
    return
  }

  frameDocument.open()
  frameDocument.write(html)
  frameDocument.close()

  const cleanup = () => {
    if (iframe.parentNode) document.body.removeChild(iframe)
  }
  iframe.contentWindow?.addEventListener('afterprint', cleanup)
  // Red de seguridad por si el navegador no dispara "afterprint" (p.ej. algunos flujos de guardado a PDF).
  setTimeout(cleanup, 5000)

  iframe.contentWindow?.focus()
  iframe.contentWindow?.print()
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/** Anexo DC: abre el diálogo de impresión para guardar como PDF el anexo de Diseño Conceptual. */
export function exportAnexoDCaPDF(doc: AnexoDocument): void {
  const html = buildAnexoHtml(doc, `Anexo_DC_${slugify(doc.projectInfo.name)}`)
  printDocumentAsPdf(html)
}

/** Anexo DB: abre el diálogo de impresión para guardar como PDF el anexo de Diseño Básico. */
export function exportAnexoDBaPDF(doc: AnexoDocument): void {
  const html = buildAnexoHtml(doc, `Anexo_DB_${slugify(doc.projectInfo.name)}`)
  printDocumentAsPdf(html)
}

/** Tabla de Propiedades: exporta un CSV que Excel abre de forma nativa, con encabezado de comentario. */
export function exportTablaPropiedadesaCSV(doc: AnexoDocument): void {
  const regulationsJoined = doc.regulations.join('; ') || 'Sin normativa seleccionada'

  const commentRows = [
    ['# Tabla de Propiedades Estructurales'],
    [`# Fase: ${doc.phase} - Generado automáticamente`]
  ]

  const dataRows: string[][] = [
    ['Elemento', 'Propiedad Requerida', 'Categoría', 'Obligatoria', 'Norma Aplicable', 'Fase', 'Responsable']
  ]

  doc.elements.forEach((element) => {
    element.properties.forEach((prop) => {
      dataRows.push([
        element.name,
        prop.spanish,
        prop.category,
        prop.required ? 'Sí' : 'No',
        regulationsJoined,
        doc.projectInfo.phase,
        'Ingeniero Estructural'
      ])
    })
  })

  const toCsvLine = (row: string[]) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')
  const csv = [...commentRows.map((row) => row.join('')), ...dataRows.map(toCsvLine)].join('\r\n')

  // BOM al inicio para que Excel detecte UTF-8 y muestre bien tildes/ñ.
  downloadFile(`﻿${csv}`, `Tabla_Propiedades_${slugify(doc.projectInfo.name)}.csv`, 'text/csv;charset=utf-8')
}
