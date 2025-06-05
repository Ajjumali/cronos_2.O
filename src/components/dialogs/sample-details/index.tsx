import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, Typography } from '@mui/material'
import type { SampleType } from '@/types/apps/limsTypes'

interface SampleDetailsDialogProps {
  open: boolean
  onClose: () => void
  sample: SampleType | null
}

const SampleDetailsDialog = ({ open, onClose, sample }: SampleDetailsDialogProps) => {
  if (!sample) return null

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'

    try {
      const date = new Date(dateString)
      const day = date.getDate().toString().padStart(2, '0')
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const year = date.getFullYear()

      return `${day}-${month}-${year}`
    } catch (error) {
      return '-'
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Sample Details</DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Sample ID
            </Typography>
            <Typography variant="body1">{sample.sampleId}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Volunteer ID
            </Typography>
            <Typography variant="body1">{sample.volunteerId}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Name
            </Typography>
            <Typography variant="body1">{sample.name}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Gender
            </Typography>
            <Typography variant="body1">{sample.gender}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Test Panel
            </Typography>
            <Typography variant="body1">{sample.testPanelName}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Test Name
            </Typography>
            <Typography variant="body1">{sample.testName}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Result
            </Typography>
            <Typography variant="body1">{sample.result || '-'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Unit
            </Typography>
            <Typography variant="body1">{sample.unit || '-'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Reference Range
            </Typography>
            <Typography variant="body1">{sample.referenceRange || '-'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Status
            </Typography>
            <Typography variant="body1">{sample.status}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Registration Date
            </Typography>
            <Typography variant="body1">{formatDate(sample.registrationDateTime)}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Performed By
            </Typography>
            <Typography variant="body1">{sample.performedBy || '-'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Performed On
            </Typography>
            <Typography variant="body1">{formatDate(sample.performedOn)}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Verified By
            </Typography>
            <Typography variant="body1">{sample.verifiedBy || '-'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Verified On
            </Typography>
            <Typography variant="body1">{formatDate(sample.verifiedOn)}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              Remarks
            </Typography>
            <Typography variant="body1">{sample.remarks || '-'}</Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

export default SampleDetailsDialog 