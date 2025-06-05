'use client'

// MUI Imports
import Grid from '@mui/material/Grid2'
import { useState, useEffect } from 'react'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'

// Component Imports
import NablListTable from '@/views/apps/lims/NABL/NablListTable'
import { nablService } from '@/app/api/apps/lims/NABL/service'
import { AccreditationDetail } from '@/app/api/apps/lims/types'

const NABLPage = () => {
  const [accreditationData, setAccreditationData] = useState<AccreditationDetail[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAccreditations = async () => {
    try {
      setLoading(true)
      const data = await nablService.getAllAccreditations()
      setAccreditationData(data)
    } catch (error) {
      console.error('Error fetching accreditations:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccreditations()
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
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              NABL Accreditation Management
            </Typography>
            <NablListTable 
              accreditationData={accreditationData} 
              onDataChange={fetchAccreditations}
            />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default NABLPage 