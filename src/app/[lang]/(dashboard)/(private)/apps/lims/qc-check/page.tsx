'use client'

// MUI Imports
import Grid from '@mui/material/Grid2'
import { useState, useEffect } from 'react'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

// Component Imports
import QcCheckListTable from '@/views/apps/lims/qc-check/Qc-checkListTable'

// Dummy service and type (replace with real service/type as needed)
type QcCheckType = {
  id: number
  date: string
  sampleId: string
  referenceId: string
  genderName: string
  parameter: string
  result: string
  level1: string
  level2: string
  level3: string
}

const dummyQcCheckService = {
  async getAllRequests(): Promise<QcCheckType[]> {
    // Replace with real API call
    return [
      {
        id: 1,
        date: '2025-07-01 11:45',
        sampleId: 'TR000101E',
        referenceId: 'PK-100-101',
        genderName: 'Male Mihir Bhavsar',
        parameter: 'CBC',
        result: '',
        level1: 'Pass',
        level2: 'Pass',
        level3: 'Pass'
      },
      {
        id: 2,
        date: '2025-07-01 11:45',
        sampleId: 'TR000102C',
        referenceId: 'PK-100-102',
        genderName: 'Female XYZ',
        parameter: 'HIV',
        result: '',
        level1: 'Pass',
        level2: 'Pass',
        level3: 'Pass'
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
        <QcCheckListTable 
          qcData={qcRequests}
          onDataChange={fetchRequests}
        />
      </Grid>
    </Grid>
  )
}

export default LimsQcCheckList
