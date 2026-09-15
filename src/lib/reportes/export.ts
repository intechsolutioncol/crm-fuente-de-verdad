import ExcelJS from 'exceljs'
import PDFDocument from 'pdfkit'

export interface TablaExport {
  titulo: string
  columnas: string[]
  filas: (string | number)[][]
}

export interface ReporteExportData {
  titulo: string
  subtitulo?: string
  generadoEl: string
  kpis: { label: string; value: string }[]
  tablas: TablaExport[]
}

function escaparCSV(valor: string | number): string {
  const texto = String(valor)
  if (/[",\n]/.test(texto)) return `"${texto.replace(/"/g, '""')}"`
  return texto
}

export function generarCSV(data: ReporteExportData): string {
  const lineas: string[] = []
  lineas.push(escaparCSV(data.titulo))
  lineas.push(escaparCSV(`Generado el ${data.generadoEl}`))
  lineas.push('')

  if (data.kpis.length > 0) {
    lineas.push('Indicador,Valor')
    for (const k of data.kpis) lineas.push(`${escaparCSV(k.label)},${escaparCSV(k.value)}`)
    lineas.push('')
  }

  for (const tabla of data.tablas) {
    lineas.push(escaparCSV(tabla.titulo))
    lineas.push(tabla.columnas.map(escaparCSV).join(','))
    for (const fila of tabla.filas) lineas.push(fila.map(escaparCSV).join(','))
    lineas.push('')
  }

  return lineas.join('\n')
}

export async function generarXLSX(data: ReporteExportData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'CRM Fuente de Verdad'
  workbook.created = new Date()

  const resumen = workbook.addWorksheet('Resumen')
  resumen.addRow([data.titulo])
  resumen.getRow(1).font = { bold: true, size: 14 }
  resumen.addRow([`Generado el ${data.generadoEl}`])
  resumen.addRow([])
  if (data.kpis.length > 0) {
    resumen.addRow(['Indicador', 'Valor']).font = { bold: true }
    for (const k of data.kpis) resumen.addRow([k.label, k.value])
  }
  resumen.columns.forEach(c => { c.width = 32 })

  for (const tabla of data.tablas) {
    const nombreHoja = tabla.titulo.slice(0, 31).replace(/[[\]*?/\\:]/g, '')
    const hoja = workbook.addWorksheet(nombreHoja || 'Datos')
    const headerRow = hoja.addRow(tabla.columnas)
    headerRow.font = { bold: true }
    for (const fila of tabla.filas) hoja.addRow(fila)
    hoja.columns.forEach(c => { c.width = 22 })
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(arrayBuffer)
}

export async function generarPDF(data: ReporteExportData): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 40, size: 'A4' })
  const chunks: Buffer[] = []
  doc.on('data', chunk => chunks.push(chunk))

  const done = new Promise<Buffer>(resolve => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
  })

  doc.fontSize(18).font('Helvetica-Bold').text(data.titulo)
  if (data.subtitulo) doc.fontSize(11).font('Helvetica').fillColor('#555').text(data.subtitulo)
  doc.fontSize(9).fillColor('#888').text(`Generado el ${data.generadoEl}`)
  doc.moveDown(1)
  doc.fillColor('#000')

  if (data.kpis.length > 0) {
    doc.fontSize(13).font('Helvetica-Bold').text('Indicadores')
    doc.moveDown(0.3)
    doc.fontSize(10).font('Helvetica')
    for (const k of data.kpis) {
      doc.text(`${k.label}: `, { continued: true }).font('Helvetica-Bold').text(k.value).font('Helvetica')
    }
    doc.moveDown(1)
  }

  for (const tabla of data.tablas) {
    if (doc.y > 680) doc.addPage()
    doc.fontSize(13).font('Helvetica-Bold').text(tabla.titulo)
    doc.moveDown(0.3)

    const colWidth = (doc.page.width - 80) / tabla.columnas.length
    const startX = doc.x
    let y = doc.y

    doc.fontSize(9).font('Helvetica-Bold')
    tabla.columnas.forEach((col, i) => doc.text(col, startX + i * colWidth, y, { width: colWidth }))
    y += 16
    doc.moveTo(startX, y - 3).lineTo(doc.page.width - 40, y - 3).strokeColor('#ccc').stroke()

    doc.font('Helvetica')
    for (const fila of tabla.filas) {
      if (y > 760) {
        doc.addPage()
        y = doc.y
      }
      fila.forEach((val, i) => doc.text(String(val), startX + i * colWidth, y, { width: colWidth }))
      y += 15
    }
    doc.y = y
    doc.moveDown(1.2)
  }

  doc.end()
  return done
}

export function nombreArchivo(modulo: string, formato: 'csv' | 'xlsx' | 'pdf'): string {
  const fecha = new Date().toISOString().slice(0, 10)
  return `reporte-${modulo}-${fecha}.${formato}`
}

export function contentType(formato: 'csv' | 'xlsx' | 'pdf'): string {
  if (formato === 'csv') return 'text/csv; charset=utf-8'
  if (formato === 'xlsx') return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  return 'application/pdf'
}
