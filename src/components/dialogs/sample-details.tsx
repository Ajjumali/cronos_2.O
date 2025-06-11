import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material'
import type { SampleType } from '@/types/apps/limsTypes'

interface SampleDetailsDialogProps {
  open: boolean
  onClose: () => void
  sample: SampleType | null
}

const SampleDetailsDialog = ({ open, onClose, sample }: SampleDetailsDialogProps) => {
  if (!sample) return null

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Sample Details</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mt: 2 }}>
          <Typography variant="subtitle2">Sample ID:</Typography>
          <Typography>{sample.sampleId}</Typography>

          <Typography variant="subtitle2">Registration Date:</Typography>
          <Typography>{new Date(sample.registrationDateTime).toLocaleDateString()}</Typography>

          <Typography variant="subtitle2">Sample Type:</Typography>
          <Typography>{sample.sampleType}</Typography>

          <Typography variant="subtitle2">Volunteer ID:</Typography>
          <Typography>{sample.volunteerId}</Typography>

          <Typography variant="subtitle2">Name:</Typography>
          <Typography>{sample.name}</Typography>

          <Typography variant="subtitle2">Gender:</Typography>
          <Typography>{sample.gender}</Typography>

          <Typography variant="subtitle2">Status:</Typography>
          <Typography>{sample.status}</Typography>

          {sample.performedBy && (
            <>
              <Typography variant="subtitle2">Performed By:</Typography>
              <Typography>{sample.performedBy}</Typography>

              <Typography variant="subtitle2">Performed On:</Typography>
              <Typography>{sample.performedOn ? new Date(sample.performedOn).toLocaleDateString() : '-'}</Typography>
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

export default SampleDetailsDialog 