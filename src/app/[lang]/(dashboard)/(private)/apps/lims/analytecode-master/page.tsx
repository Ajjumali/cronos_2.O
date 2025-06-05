'use client'

// MUI Imports
import Grid from '@mui/material/Grid2'
import { useState, useEffect } from 'react'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

// Component Imports
import AnalyteCodeListTable from '@/views/apps/lims/analytecode-master/AnalytecodeListTable'
import { analyteCodeService } from '@/app/api/apps/lims/Analytecode-master/route'
import { AnalyteCodeType } from '@/types/apps/limsTypes'

const LimsAnalyteCodesList = () => {
  const [analyteCodes, setAnalyteCodes] = useState<AnalyteCodeType[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAnalyteCodes = async () => {
    try {
      setLoading(true)
      const data = await analyteCodeService.getAllAnalyteCodes()
      setAnalyteCodes(data)
    } catch (error) {
      console.error('Error fetching analyte codes:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalyteCodes()
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
        <AnalyteCodeListTable 
          analyteCodeData={analyteCodes} 
          onDataChange={fetchAnalyteCodes}
        />
      </Grid>
    </Grid>
  )
}

export default LimsAnalyteCodesList