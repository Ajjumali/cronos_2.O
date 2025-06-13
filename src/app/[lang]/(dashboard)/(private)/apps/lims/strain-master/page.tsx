'use client'

// MUI Imports
import Grid from '@mui/material/Grid2'
import { useState, useEffect } from 'react'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

// Component Imports
import StrainListTable from '@/views/apps/lims/strain-master/StrainListTable'
import { StrainType } from '@/types/apps/limsTypes'

const LimsStrainsList = () => {
  const [strains, setStrains] = useState<StrainType[]>([])
  const [loading, setLoading] = useState(true)

  const fetchStrains = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/apps/lims/Strain-master')
      if (!response.ok) {
        throw new Error('Failed to fetch strains')
      }
      const data = await response.json()
      setStrains(data.result)
    } catch (error) {
      console.error('Error fetching strains:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStrains()
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
        <StrainListTable strainData={strains} onDataChange={fetchStrains} />
      </Grid>
    </Grid>
  )
}

export default LimsStrainsList
