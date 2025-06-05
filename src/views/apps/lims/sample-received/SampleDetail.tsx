'use client'

// React Imports
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'

// Component Imports
import type { SampleType } from './SampleReceivedTable'

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

const statusMap = {
  null: { label: 'Pending', color: 'warning' },
  1: { label: 'Received', color: 'success' },
  2: { label: 'Rejected', color: 'error' },
  3: { label: 'Pending', color: 'warning' },
  4: { label: 'In Progress', color: 'warning' },
  5: { label: 'Completed', color: 'info' },
  6: { label: 'Outsource', color: 'secondary' }
}

const DetailItem = ({ label, value }: { label: string; value: string | number | undefined }) => (
  <Grid item xs={12} sm={6} md={4}>
    <Box sx={{ mb: 1.5 }}>
      <Typography variant='subtitle2' color='text.secondary' sx={{ mb: 0.25, fontSize: '0.75rem' }}>
        {label}
      </Typography>
      <Typography variant='body2' sx={{ fontWeight: 500 }}>{value || '-'}</Typography>
    </Box>
  </Grid>
)

const SampleDetail = () => {
  const params = useParams()
  const router = useRouter()
  const [sample, setSample] = useState<SampleType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSampleDetails = async () => {
      try {
        const response = await fetch(`/api/apps/lims/Sample-received?id=${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch sample details');
        }
        const data = await response.json();
        setSample(data.result);
      } catch (error) {
        console.error('Error fetching sample details:', error);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchSampleDetails();
    }
  }, [params.id]);

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography>Loading...</Typography>
        </CardContent>
      </Card>
    )
  }

  if (!sample) {
    return (
      <Card>
        <CardContent>
          <Typography>Sample not found</Typography>
        </CardContent>
      </Card>
    )
  }

  const statusInfo = (sample.statusId === null ? statusMap.null : statusMap[sample.statusId as keyof typeof statusMap]) || { label: 'Unknown', color: 'default' }

  return (
    <Card>
      <CardHeader
        title='Sample Details'
        titleTypographyProps={{ variant: 'h5' }}
        action={
          <Button
            variant='contained'
            size='small'
            startIcon={<i className='tabler-arrow-left' />}
            onClick={() => router.back()}
          >
            Back
          </Button>
        }
      />
      <CardContent sx={{ p: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>Status:</Typography>
              <Chip
                label={statusInfo.label}
                color={statusInfo.color as any}
                variant='tonal'
                size='small'
              />
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 600 }}>
              Basic Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <DetailItem label='Volunteer ID' value={sample.subjectId} />
          <DetailItem label='Volunteer Name' value={sample.VolunteerName} />

          <DetailItem label='Barcode ID' value={sample.barcodeId} />
          <DetailItem label='Sample Type' value={sample.sampleType} />
          <DetailItem label='Project No' value={sample.projectNo} />
          <DetailItem label='Study' value={sample.study} />
          <DetailItem label='Lab' value={sample.labName} />
          <DetailItem label='Location' value={sample.location} />
          <DetailItem label='Reference ID' value={sample.referenceId} />

          <Grid item xs={12}>
            <Typography variant='subtitle1' sx={{ mb: 1, mt: 2, fontWeight: 600 }}>
              Collection Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <DetailItem label='Collected By' value={sample.collectedByName} />
          <DetailItem label='Collected On' value={formatDate(sample.collectedOn)} />
          <DetailItem label='Sent By' value={sample.sentByName} />
          <DetailItem label='Sent On' value={formatDate(sample.sentOn)} />

          <Grid item xs={12}>
            <Typography variant='subtitle1' sx={{ mb: 1, mt: 2, fontWeight: 600 }}>
              Receiving Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <DetailItem label='Received By' value={sample.receivedByName} />
          <DetailItem label='Received On' value={formatDate(sample.receivedOn)} />
          <DetailItem label='Time Zone ID' value={sample.timeZoneId} />
          <DetailItem label='Facility ID' value={sample.facilityId} />

          {sample.remarks && (
            <>
              <Grid item xs={12}>
                <Typography variant='subtitle1' sx={{ mb: 1, mt: 2, fontWeight: 600 }}>
                  Additional Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ mb: 1 }}>
                  <Typography variant='subtitle2' color='text.secondary' sx={{ mb: 0.25, fontSize: '0.75rem' }}>
                    Remarks
                  </Typography>
                  <Typography variant='body2' sx={{ fontWeight: 500 }}>{sample.remarks}</Typography>
                </Box>
              </Grid>
            </>
          )}
        </Grid>
      </CardContent>
    </Card>
  )
}

export default SampleDetail 