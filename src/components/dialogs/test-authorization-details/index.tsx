import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, Typography } from '@mui/material'
import type { TestAuthorizationType } from '@/types/apps/limsTypes'

interface TestAuthorizationDetailsDialogProps {
  open: boolean
  onClose: () => void
  sample: TestAuthorizationType | null
}

const TestAuthorizationDetailsDialog = ({ open, onClose, sample }: TestAuthorizationDetailsDialogProps) => {
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
      <DialogTitle>Test Authorization Details</DialogTitle>
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
              Authorization Status
            </Typography>
            <Typography variant="body1">{sample.authorizationStatus}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Registration Date
            </Typography>
            <Typography variant="body1">{formatDate(sample.registrationDateTime)}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Authorized By
            </Typography>
            <Typography variant="body1">{sample.authorizedBy || '-'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Authorized On
            </Typography>
            <Typography variant="body1">{formatDate(sample.authorizedOn)}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Project No
            </Typography>
            <Typography variant="body1">{sample.projectNo || '-'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Study
            </Typography>
            <Typography variant="body1">{sample.study || '-'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Sample Type
            </Typography>
            <Typography variant="body1">{sample.sampleType || '-'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Location
            </Typography>
            <Typography variant="body1">{sample.location || '-'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Reference ID
            </Typography>
            <Typography variant="body1">{sample.referenceId || '-'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Lab
            </Typography>
            <Typography variant="body1">{sample.lab || '-'}</Typography>
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

export default TestAuthorizationDetailsDialog 