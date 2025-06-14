'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import CustomTextField from '@core/components/mui/TextField'
import DialogCloseButton from '../DialogCloseButton'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormControl from '@mui/material/FormControl'
import FormLabel from '@mui/material/FormLabel'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import { toast } from 'react-toastify'

export interface BarcodePrintDialogProps {
  open: boolean
  setOpen: (open: boolean) => void
  sampleId: number
  barcodeId?: string
  samples?: {
    id: number
    barcodeId: string
    subjectId?: string
    sampleType?: string
    collectedOn?: string
  }[]
  sampleDetails?: {
    subjectId?: string
    sampleType?: string
    collectedOn?: string
  }
}

type PrintType = 'pdf' | 'printer'

const BarcodePrintDialog = ({
  open,
  setOpen,
  sampleId,
  barcodeId,
  samples,
  sampleDetails
}: BarcodePrintDialogProps) => {
  // States
  const [printType, setPrintType] = useState<PrintType>('pdf')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [noOfPrint, setNoOfPrint] = useState(1)

  useEffect(() => {
    // Generate preview when dialog opens
    if (open && barcodeId) {
      generatePreview()
    }
    return () => {
      // Cleanup preview URL when dialog closes
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [open, barcodeId])

  const handleClose = () => {
    setOpen(false)
    setPrintType('pdf')
    setError(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  const generatePreview = async () => {
    try {
      setIsLoading(true)
      setError(null)
      // TODO: Replace with actual preview generation API call
      const response = await fetch(`/api/apps/lims/barcode-preview/${barcodeId}`)
      if (!response.ok) throw new Error('Failed to generate preview')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url)
    } catch (err) {
      setError('Failed to generate barcode preview')
      console.error('Preview generation error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrintToPDF = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch('/api/apps/lims/Sample-received?action=print-barcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sampleId,
          barcodeId,
          noOfPrint: noOfPrint,
          samples: samples?.map(s => ({
            sampleId: s.id,
            barcodeId: s.barcodeId
          }))
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to generate PDF')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Barcodes_${new Date().toISOString().replace(/[:.]/g, '_')}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Barcode PDF generated successfully')
      handleClose()
    } catch (err) {
      setError('Failed to generate PDF')
      console.error('PDF generation error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrintToPrinter = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch('/api/apps/lims/Sample-received?action=print-barcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sampleId,
          barcodeId,
          noOfPrint: noOfPrint,
          printType: 'printer',
          samples: samples?.map(s => ({
            sampleId: s.id,
            barcodeId: s.barcodeId
          }))
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to print')
      }

      toast.success('Barcodes sent to printer successfully')
      handleClose()
    } catch (err) {
      setError('Failed to print barcodes')
      console.error('Print error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrint = () => {
    if (printType === 'pdf') {
      handlePrintToPDF()
    } else {
      handlePrintToPrinter()
    }
  }

  return (
    <Dialog
      fullWidth
      maxWidth='sm'
      scroll='body'
      open={open}
      onClose={handleClose}
      closeAfterTransition={false}
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <DialogCloseButton onClick={handleClose} disableRipple>
        <i className='tabler-x' />
      </DialogCloseButton>
      <DialogTitle variant='h4' className='flex gap-2 flex-col text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
        Print Barcode
        <Typography component='span' className='flex flex-col text-center'>
          Configure barcode printing settings
        </Typography>
      </DialogTitle>
      <DialogContent className='pbs-0 sm:pli-16'>
        <div className='flex flex-col gap-4'>
          {error && (
            <Alert severity='error' onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <FormControl>
            <FormLabel>Print Type</FormLabel>
            <RadioGroup value={printType} onChange={e => setPrintType(e.target.value as PrintType)} row>
              <FormControlLabel value='pdf' control={<Radio />} label='Print to PDF' />
              <FormControlLabel value='printer' control={<Radio />} label='Print to Printer' />
            </RadioGroup>
          </FormControl>

          <div className='flex flex-col gap-2'>
            <Typography variant='subtitle2'>Sample Details</Typography>
            {samples ? (
              <div className='max-h-[300px] overflow-y-auto pr-4'>
                <Typography variant='body2' color='text.secondary'>
                  Number of Samples: {samples.length}
                </Typography>
                {samples.map((sample, index) => (
                  <div key={sample.id} className='pl-4 border-l-2 border-primary mt-2'>
                    <Typography variant='body2' color='text.secondary'>
                      Barcode ID: {sample.barcodeId || '-'}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Subject ID: {sample.subjectId || '-'}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Sample Type: {sample.sampleType || '-'}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Collected On: {sample.collectedOn || '-'}
                    </Typography>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <Typography variant='body2' color='text.secondary'>
                  Barcode ID: {barcodeId || '-'}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Subject ID: {sampleDetails?.subjectId || '-'}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Sample Type: {sampleDetails?.sampleType || '-'}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Collected On: {sampleDetails?.collectedOn || '-'}
                </Typography>
              </>
            )}
          </div>

          {isLoading ? (
            <div className='flex justify-center p-4'>
              <CircularProgress />
            </div>
          ) : previewUrl ? (
            <div className='flex flex-col items-center gap-2'>
              <Typography variant='subtitle2'>Preview</Typography>
              <img src={previewUrl} alt='Barcode Preview' className='max-w-full h-auto' />
            </div>
          ) : null}
        </div>
      </DialogContent>
      <DialogActions className='pbs-0 sm:pbe-16 sm:pli-16'>
        <Button variant='tonal' color='secondary' onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant='contained'
          color='primary'
          startIcon={<i className='tabler-printer' />}
          onClick={handlePrint}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : printType === 'pdf' ? 'Generate PDF' : 'Print'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default BarcodePrintDialog
