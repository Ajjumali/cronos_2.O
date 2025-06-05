import { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'

type Props = {
  open: boolean
  handleClose: () => void
  handleConfirm: (reason: string) => void
  title: string
  description: string
}

const ReasonInputDialog = ({ open, handleClose, handleConfirm, title, description }: Props) => {
  const [reason, setReason] = useState('')

  const handleSubmit = () => {
    if (reason.trim()) {
      handleConfirm(reason)
      setReason('')
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle className='flex items-center justify-between'>
        {title}
        <IconButton onClick={handleClose}>
          <i className='tabler-x' />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <p className='mb-4'>{description}</p>
        <TextField
          fullWidth
          label='Reason'
          value={reason}
          onChange={e => setReason(e.target.value)}
          multiline
          rows={3}
          required
        />
      </DialogContent>
      <DialogActions>
        <Button variant='tonal' color='secondary' onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant='contained'
          onClick={handleSubmit}
          disabled={!reason.trim()}
        >
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ReasonInputDialog 