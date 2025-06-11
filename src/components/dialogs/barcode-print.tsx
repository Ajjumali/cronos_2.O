'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

interface BarcodePrintDialogProps {
  open: boolean
  setOpen: (open: boolean) => void
  sampleId: number
  barcodeId?: string
}

const BarcodePrintDialog = ({ open, setOpen, sampleId, barcodeId }: BarcodePrintDialogProps) => {
  const handleClose = () => {
    setOpen(false)
  }

  const handlePrint = () => {
    // TODO: Implement barcode printing logic
    window.print()
    handleClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle>Print Barcode</DialogTitle>
      <DialogContent>
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant='body1' sx={{ mb: 2 }}>
            Sample ID: {sampleId}
          </Typography>
          {barcodeId && (
            <Typography variant='body1'>
              Barcode ID: {barcodeId}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handlePrint} variant='contained'>
          Print
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default BarcodePrintDialog 