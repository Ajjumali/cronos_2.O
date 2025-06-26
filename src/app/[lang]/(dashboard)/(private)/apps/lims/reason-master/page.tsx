'use client'

// MUI Imports
import Grid from '@mui/material/Grid2'
import { useState, useEffect } from 'react'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

// Component Imports
import ReasonListTable from '@/views/apps/lims/reason-master/ReasonListTable'
import { ReasonType } from '@/types/apps/limsTypes'

const LimsReasonMaster = () => {
  const [reasons, setReasons] = useState<ReasonType[]>([])
  const [loading, setLoading] = useState(true)

  const fetchReasons = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/apps/lims/reason-master')
      if (!response.ok) {
        throw new Error('Failed to fetch reasons')
      }
      const data = await response.json()
      setReasons(data.result)
    } catch (error) {
      console.error('Error fetching reasons:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReasons()
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
        <ReasonListTable reasonData={reasons} onDataChange={fetchReasons} />
      </Grid>
    </Grid>
  )
}

export default LimsReasonMaster
