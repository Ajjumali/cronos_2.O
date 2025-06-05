'use client'

// MUI Imports
import Grid from '@mui/material/Grid2'
import { useState, useEffect } from 'react'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'

// Component Imports
import AutoApprovalListTable from '@/views/apps/lims/auto-approval/autoapprovalalisttable'
import { autoApprovalService } from '@/app/api/apps/lims/auto-approval/route'

type AutoApprovalType = {
  id: number
  testName: string
  analyteCode: string
  instrumentName: string
  referenceRange: string
  approvalCondition: string
  effectiveDate: string
  version: number
  status: string
}

const AutoApprovalPage = () => {
  const [autoApprovalData, setAutoApprovalData] = useState<AutoApprovalType[]>([])
  const [loading, setLoading] = useState(true)
  const [autoApprovalEnabled, setAutoApprovalEnabled] = useState(false)

  const fetchAutoApprovals = async () => {
    try {
      setLoading(true)
      const data = await autoApprovalService.getAllAutoApprovals()
      setAutoApprovalData(data)
    } catch (error) {
      console.error('Error fetching auto-approvals:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAutoApprovals()
  }, [])

  const handleAutoApprovalToggle = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.checked
    setAutoApprovalEnabled(newValue)
    try {
      // TODO: Implement API call to update auto-approval setting
      console.log('Auto-approval setting updated:', newValue)
    } catch (error) {
      console.error('Error updating auto-approval setting:', error)
      setAutoApprovalEnabled(!newValue)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Auto-Approval Settings
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={autoApprovalEnabled}
                  onChange={handleAutoApprovalToggle}
                  color="primary"
                />
              }
              label="Enable Auto-Approval"
            />
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <AutoApprovalListTable 
          autoApprovalData={autoApprovalData} 
          onDataChange={fetchAutoApprovals}
          autoApprovalEnabled={autoApprovalEnabled}
        />
      </Grid>
    </Grid>
  )
}

export default AutoApprovalPage 