'use client'

import { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import { toast } from 'react-toastify'

interface RemarkDialogProps {
  open: boolean
  setOpen: (open: boolean) => void
  sampleId: number
  currentRemark?: string
  onSuccess?: () => void
}

const RemarkDialog = ({ open, setOpen, sampleId, currentRemark, onSuccess }: RemarkDialogProps) => {
  const [remark, setRemark] = useState(currentRemark || '')
  const [loading, setLoading] = useState(false)

  const handleClose = () => {
    setOpen(false)
    setRemark(currentRemark || '')
  }

  const handleSubmit = async () => {
    if (!remark.trim()) {
      toast.error('Please enter a remark')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/apps/lims/Sample-received?action=remark', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: sampleId,
          remark
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update remark')
      }

      toast.success('Remark updated successfully')
      onSuccess?.()
      handleClose()
    } catch (error) {
      console.error('Error updating remark:', error)
      toast.error('Failed to update remark')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle>Add/Edit Remark</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin='dense'
          label='Remark'
          fullWidth
          multiline
          rows={4}
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder='Enter your remark here...'
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant='contained' disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default RemarkDialog 