'use client'

// MUI Imports
import Grid from '@mui/material/Grid2'
import { useState, useEffect } from 'react'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

// Component Imports
import QcCheckListTable from '@/views/apps/lims/qc-check/Qc-checkListTable'
import type { QcCheckType } from '@/types/qc-check'

// Dummy service (replace with real service as needed)
const dummyQcCheckService = {
  async getAllRequests(): Promise<QcCheckType[]> {
    // Replace with real API call
    return [
      {
        id: 1,
        srNo: 1,
        testName: 'CBC',
        instrumentName: 'Sysmex XN-1000',
        date: '2025-07-01 11:45',
        sampleId: 'TR000101E',
        referenceId: 'PK-100-101',
        genderName: 'Male Mihir Bhavsar',
        parameter: 'CBC',
        level1: 'Pass',
        level2: 'Pass',
        level3: 'Pass',
        doneOn: '2025-07-01',
        doneBy: 'John Doe',
        profile: 'Hematology'
      },
      {
        id: 2,
        srNo: 2,
        testName: 'HIV',
        instrumentName: 'Cobas 6000',
        date: '2025-07-01 11:45',
        sampleId: 'TR000102C',
        referenceId: 'PK-100-102',
        genderName: 'Female XYZ',
        parameter: 'HIV',
        level1: 'Pass',
        level2: 'Pass',
        level3: 'Pass',
        doneOn: '2025-07-01',
        doneBy: 'Jane Smith',
        profile: 'Serology'
      }
    ]
  }
}

const LimsQcCheckList = () => {
  const [qcRequests, setQcRequests] = useState<QcCheckType[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const data = await dummyQcCheckService.getAllRequests()
      setQcRequests(data)
    } catch (error) {
      console.error('Error fetching QC check requests:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Grid container spacing={6}>
      <Grid size={12}>
        <QcCheckListTable qcData={qcRequests} onDataChange={fetchRequests} />
      </Grid>
    </Grid>
  )
}

export default LimsQcCheckList
