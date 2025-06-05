'use client'

// React Imports
import { useEffect, useState } from 'react'

// Next Imports
import { useParams, useRouter } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import RemarkDialog from '@/components/dialogs/test-result/remark-dialog'

// API Imports
import { testResultsService } from '@/app/api/apps/lims/Test-results/route'

// Type Imports
import type { TestResultType } from '@/types/apps/limsTypes'

const TestDetail = () => {
  const router = useRouter()
  const { id } = useParams()
  const [testData, setTestData] = useState<TestResultType | null>(null)
  const [remarkDialogOpen, setRemarkDialogOpen] = useState(false)

  useEffect(() => {
    const fetchTestData = async () => {
      try {
        const response = await testResultsService.getTestResultById(Number(id))
        if (response.result) {
          setTestData(response.result)
        }
      } catch (error) {
        console.error('Error fetching test data:', error)
      }
    }

    if (id) {
      fetchTestData()
    }
  }, [id])

  const handleBack = () => {
    router.back()
  }

  const handleRemarks = () => {
    setRemarkDialogOpen(true)
  }

  const handleRemarkSuccess = async () => {
    try {
      const response = await testResultsService.getTestResultById(Number(id))
      if (response.result) {
        setTestData(response.result)
      }
    } catch (error) {
      console.error('Error updating remarks:', error)
    }
  }

  if (!testData) {
    return (
      <Card>
        <CardContent>
          <Typography>Loading...</Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader
        title='Test Result Details'
        action={
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant='outlined' color='secondary' onClick={handleBack}>
              Back
            </Button>
          </Box>
        }
      />
      <Divider />
      <CardContent>
        <Grid container spacing={6}>
          {/* Detail Section as per provided list */}
          <Grid size={{ xs: 12 }}>
            <Typography variant='h6' sx={{ mb: 2 }}>Sample & Volunteer Details</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField fullWidth label='Sr. No.' value={testData.id} disabled />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField fullWidth label='Sample Id' value={testData.sampleId} disabled />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField fullWidth label='Volunteer ID' value={testData.volunteerId} disabled />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField fullWidth label='Volunteer Name' value={testData.name} disabled />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField fullWidth label='Collection Date and Time' value={testData.registrationDateTime} disabled />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField fullWidth label='Panel name with test name' value={`${testData.testPanelName} - ${testData.testName}`} disabled />
          </Grid>
          {/* The following fields are not present in TestResultType, so left as placeholders or empty */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField fullWidth label='Collected by' value={''} disabled />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField fullWidth label='Sample Type' value={''} disabled />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField fullWidth label='Requested By' value={''} disabled />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField fullWidth label='Received Date and Time' value={''} disabled />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField fullWidth label='Received by' value={''} disabled />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField fullWidth label='Sample send date and time' value={''} disabled />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField fullWidth label='Send by' value={''} disabled />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField fullWidth label='Test Category' value={''} disabled />
          </Grid>
          {/* Existing test result fields below */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              label='Test Name'
              value={testData.testName}
              disabled
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              label='Result'
              value={testData.result}
              disabled
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              label='Unit'
              value={testData.unit}
              disabled
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              label='Reference Range'
              value={testData.referenceRange}
              disabled
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant='subtitle2' sx={{ mb: 1 }}>
                Status
              </Typography>
              <Chip
                label={testData.status}
                color={
                  testData.status === 'Completed'
                    ? 'success'
                    : testData.status === 'In Progress'
                    ? 'info'
                    : testData.status === 'Rejected'
                    ? 'error'
                    : 'warning'
                }
                size='small'
              />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              label='Performed By'
              value={testData.performedBy}
              disabled
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              label='Performed On'
              value={testData.performedOn}
              disabled
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              label='Verified By'
              value={testData.verifiedBy}
              disabled
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              label='Verified On'
              value={testData.verifiedOn}
              disabled
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <CustomTextField
              fullWidth
              label='Remarks'
              value={testData.remarks}
              multiline
              rows={4}
              disabled
            />
          </Grid>
        </Grid>
      </CardContent>
      <RemarkDialog
        open={remarkDialogOpen}
        onClose={() => setRemarkDialogOpen(false)}
        onSuccess={handleRemarkSuccess}
        id={Number(id)}
        type='test'
      />
    </Card>
  )
}

export default TestDetail 