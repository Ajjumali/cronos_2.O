'use client'

// MUI Imports
import Grid from '@mui/material/Grid2';
import { useState, useEffect } from 'react'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

// Component Imports
import OutsourceListTable from '@/views/apps/lims/outsource/OutsourceListTable'

// Dummy service and type (replace with real service/type as needed)
type OutsourceType = {
  id: number
  date: string
  sampleId: string
  referenceId: string
  genderName: string
  parameter: string
  status: string
  selectedTests: any[]
}

const dummyOutsourceService = {
  async getAllRequests(): Promise<OutsourceType[]> {
    // Replace with real API call
    return [
      {
        id: 1,
        date: '2025-07-01 11:45',
        sampleId: 'TR000101E',
        referenceId: 'PK-100-101',
        genderName: 'Male Mihir Bhavsar',
        parameter: 'CBC',
        status: 'Pending',
        selectedTests: []
      },
      {
        id: 2,
        date: '2025-07-01 11:45',
        sampleId: 'TR000102C',
        referenceId: 'PK-100-102',
        genderName: 'Female XYZ',
        parameter: 'HIV',
        status: 'Completed',
        selectedTests: []
      }
    ]
  }
}

const LimsOutsourceList = () => {
  const [requests, setRequests] = useState<OutsourceType[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const data = await dummyOutsourceService.getAllRequests()
      setRequests(data)
    } catch (error) {
      console.error('Error fetching outsourcing requests:', error)
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
        <OutsourceListTable 
          outsourceData={requests}
          onDataChange={fetchRequests}
        />
      </Grid>
    </Grid>
  )
}

export default LimsOutsourceList
