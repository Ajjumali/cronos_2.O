import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Grid, Box } from '@mui/material'
import { formatDate } from '@/utils/dateUtils'
import type { SampleType } from '@/views/apps/lims/sample-received/SampleReceivedTable'

interface SampleDetailsDialogProps {
  open: boolean
  setOpen: (open: boolean) => void
  sample: SampleType | null
}

const SampleDetailsDialog = ({ open, setOpen, sample }: SampleDetailsDialogProps) => {
  if (!sample) return null

  const details = [
    { label: 'Volunteer ID', value: sample.subjectId || '-' },
    { label: 'Barcode ID', value: sample.barcodeId || '-' },
    { label: 'Lab Name', value: sample.labName || '-' },
    { label: 'Sample Type', value: sample.sampleType || '-' },
    { label: 'Project No', value: sample.projectNo || '-' },
    { label: 'Study', value: sample.study || '-' },
    { label: 'Study Protocol', value: sample.studyProtocol || '-' },
    { label: 'Volunteer Name', value: sample.VolunteerName || '-' },
    { label: 'Collected By', value: sample.collectedByName || '-' },
    { label: 'Collected On', value: formatDate(sample.collectedOn) },
    { label: 'Sent By', value: sample.sentByName || '-' },
    { label: 'Sent On', value: formatDate(sample.sentOn) },
    { label: 'Received By', value: sample.receivedByName || '-' },
    { label: 'Received On', value: formatDate(sample.receivedOn) },
    { label: 'Location', value: sample.location || '-' },
    { label: 'Reference ID', value: sample.referenceId || '-' },
    { label: 'Remarks', value: sample.remarks || '-' }
  ]

  return (
    <Dialog 
      open={open} 
      onClose={() => setOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Typography variant="h5" component="div">
          Sample Details
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            {details.map((detail, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {detail.label}
                  </Typography>
                  <Typography variant="body1">
                    {detail.value}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpen(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

export default SampleDetailsDialog 