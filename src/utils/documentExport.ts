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
  const rows = doc.elements
    .flatMap((element) =>
      element.properties.map(
        (prop) => `
          <tr>
            <td>${escapeHtml(element.name)}</td>
            <td>${escapeHtml(prop.spanish)}</td>
            <td>${escapeHtml(prop.category)}</td>
            <td>${prop.required ? 'Sí' : 'No'}</td>
          </tr>`
      )
    )
    .join('')

  const regulations =
    doc.regulations.map((r) => `<li>${escapeHtml(r)}</li>`).join('') || '<li>Sin normativa seleccionada</li>'

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(fileTitle)}</title>
    <style>
      body { font-family: Arial, Helvetica, sans-serif; color: #111827; padding: 32px; }
      h1 { font-size: 20px; margin-bottom: 4px; }
      h2 { font-size: 15px; margin-top: 28px; margin-bottom: 8px; color: #1f2937; }
      .subtitle { color: #374151; font-size: 14px; font-weight: 600; margin: 0 0 12px; }
      .intro { color: #374151; font-size: 13px; margin: 0 0 18px; }
      .meta { color: #4b5563; font-size: 13px; margin-bottom: 20px; }
      .meta span { margin-right: 18px; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      th, td { border: 1px solid #d1d5db; padding: 6px 10px; text-align: left; }
      th { background: #f3f4f6; }
      ul { margin: 4px 0 0; padding-left: 20px; font-size: 13px; }
      @media print { body { padding: 0; } }
    </style>
  </head>
  <body>
    <h1>ANEXO DE INFORMACIÓN BIM</h1>
    <p class="subtitle">Fase: ${escapeHtml(doc.phase)}</p>
    <p class="intro">
      Este anexo complementa la Solicitud de Información BIM (SDI BIM) y especifica qué información debe
      contener el modelo de estructura para ${escapeHtml(doc.phase)}.
    </p>
    <div class="meta">
      <span><strong>Proyecto:</strong> ${escapeHtml(doc.projectInfo.name)}</span>
      <span><strong>Sistema:</strong> ${escapeHtml(doc.projectInfo.system)}</span>
      <span><strong>Fecha:</strong> ${escapeHtml(doc.projectInfo.date)}</span>
    </div>

    <h2>Elementos Estructurales y Propiedades Requeridas</h2>
    <table>
      <thead>
        <tr><th>Elemento</th><th>Propiedad</th><th>Categoría</th><th>Requerida</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <h2>Normativa y Estándares Aplicables</h2>
    <ul>${regulations}</ul>
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
