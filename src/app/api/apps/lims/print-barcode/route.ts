import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sampleId, barcodeId, noOfPrint, printType, samples } = body

    if (!sampleId && (!samples || samples.length === 0)) {
      return NextResponse.json({ error: 'Sample ID or samples array is required' }, { status: 400 })
    }

    // Handle both single sample and multiple samples
    const samplesToProcess = samples || [{ sampleId, barcodeId }]

    // Generate PDF content
    const pdfContent = generateBarcodePDF(samplesToProcess, noOfPrint || 1)

    // Create a blob from the PDF content
    const blob = new Blob([pdfContent], { type: 'application/pdf' })

    // Log the print job for each sample
    for (const sample of samplesToProcess) {
      try {
        await fetch('/api/apps/lims/sample-requisition/1/audit-trail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'Print Barcode',
            description: `Barcode PDF generated for sample ${sample.sampleId || sampleId}`,
            triggeredBy: 'System', // In real implementation, this would be the logged-in user
            status: 'Success',
            volunteerId: 'VOL001', // In real implementation, this would be fetched from the requisition
            barcodeId: sample.barcodeId || barcodeId
          })
        })
      } catch (auditError) {
        console.warn('Failed to log audit trail:', auditError)
        // Continue with PDF generation even if audit logging fails
      }
    }

    // Return the PDF blob
    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Barcodes_${new Date().toISOString().replace(/[:.]/g, '_')}.pdf"`
      }
    })
  } catch (error) {
    console.error('Error generating barcode PDF:', error)
    return NextResponse.json({ error: 'Failed to generate barcode PDF' }, { status: 500 })
  }
}

function generateBarcodePDF(samples: any[], noOfPrint: number): string {
  // This is a simplified PDF generation
  // In a real implementation, you would use a library like jsPDF or PDFKit
  // to generate proper PDF with barcode images

  const pdfHeader = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n'
  const pdfPages = '2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n'

  let content = ''
  let pageCount = 0

  for (const sample of samples) {
    for (let i = 0; i < noOfPrint; i++) {
      pageCount++
      content += `${3 + pageCount - 1} 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents ${4 + pageCount - 1} 0 R\n>>\nendobj\n`

      const sampleInfo = `Barcode ID: ${sample.barcodeId || 'N/A'}\nSample ID: ${sample.sampleId || 'N/A'}`
      const streamContent = `stream\nBT\n/F1 12 Tf\n72 720 Td\n(${sampleInfo}) Tj\nET\nendstream`

      content += `${4 + pageCount - 1} 0 obj\n<<\n/Length ${streamContent.length - 8}\n>>\n${streamContent}\nendobj\n`
    }
  }

  const xref = `xref\n0 ${5 + pageCount}\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n`

  let xrefOffset = pdfHeader.length + pdfPages.length + content.length
  const trailer = `trailer\n<<\n/Size ${5 + pageCount}\n/Root 1 0 R\n>>\nstartxref\n${xrefOffset}\n%%EOF`

  return pdfHeader + pdfPages + content + xref + trailer
}
