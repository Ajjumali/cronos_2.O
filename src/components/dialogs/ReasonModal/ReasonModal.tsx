import { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import CustomTextField from '@core/components/mui/TextField'

interface ReasonModalProps {
  open: boolean
  handleClose: () => void
  handleConfirm: (reason: string) => void
  title: string
  description?: string
}

const ReasonModal = ({ open, handleClose, handleConfirm, title, description }: ReasonModalProps) => {
  const [reason, setReason] = useState('')

  const handleSubmit = () => {
    if (reason.trim()) {
      handleConfirm(reason)
      setReason('')
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {description && <p className='mb-4'>{description}</p>}
        <CustomTextField
          fullWidth
          multiline
          rows={4}
          label='Reason'
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder='Please provide a reason for this action'
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color='secondary'>
          Cancel
        </Button>
        <Button onClick={handleSubmit} color='primary' disabled={!reason.trim()}>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ReasonModal 