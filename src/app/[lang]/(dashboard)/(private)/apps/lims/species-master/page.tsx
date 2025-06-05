'use client'

// MUI Imports
import Grid from '@mui/material/Grid2'
import { useState, useEffect } from 'react'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

// Component Imports
import SpeciesListTable from '@/views/apps/lims/species-master/SpeciesListTable'
import { SpeciesType } from '@/types/apps/limsTypes'

const LimsSpeciesList = () => {
  const [species, setSpecies] = useState<SpeciesType[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSpecies = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/apps/lims/Species-master')
      if (!response.ok) throw new Error('Failed to fetch species')
      
      const data = await response.json()
      setSpecies(data.result)
    } catch (error) {
      console.error('Error fetching species:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSpecies()
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
        <SpeciesListTable 
          speciesData={species} 
          onDataChange={fetchSpecies}
        />
      </Grid>
    </Grid>
  )
}

export default LimsSpeciesList 