import { useState } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

type Props = {
  open: boolean
  handleClose: () => void
  handleConfirm: (reason: string) => void
  title?: string
  description?: string
}

const UpdateReasonDialog = ({ open, handleClose, handleConfirm, title = 'Update Reason', description }: Props) => {
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
        {description && (
          <Typography variant='body2' className='mb-4'>
            {description}
          </Typography>
        )}
        <CustomTextField
          fullWidth
          multiline
          rows={3}
          label='Reason for Update'
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder='Please provide a reason for this update'
          required
        />
      </DialogContent>
      <DialogActions>
        <Button variant='tonal' color='error' onClick={handleClose}>
          Cancel
        </Button>
        <Button variant='contained' onClick={handleSubmit} disabled={!reason.trim()}>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default UpdateReasonDialog 