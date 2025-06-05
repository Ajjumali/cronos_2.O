'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import { toast } from 'react-toastify'

// API Imports
import { testResultsService } from '@/app/api/apps/lims/Test-results/route'

interface RemarkDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  id: number | null
  type: string
}

const RemarkDialog = ({ open, onClose, onSuccess, id, type }: RemarkDialogProps) => {
  const [remarks, setRemarks] = useState('')

  const handleClose = () => {
    setRemarks('')
    onClose()
  }

  const handleSubmit = async () => {
    if (!id) return

    try {
      await testResultsService.addRemarks(id, remarks)
      handleClose()
      onSuccess()
    } catch (error) {
      console.error('Error adding remarks:', error)
      toast.error('Failed to add remarks')
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle>Add Remarks</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin='dense'
          label='Remarks'
          type='text'
          fullWidth
          multiline
          rows={4}
          value={remarks}
          onChange={e => setRemarks(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant='contained' color='primary'>
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default RemarkDialog 