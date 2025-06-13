'use client'

// MUI Imports
import Grid from '@mui/material/Grid2'
import { useState, useEffect } from 'react'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

// Component Imports
import InstrumentListTable from '@/views/apps/lims/instrument/list/InstrumentListTable'
import { InstrumentType } from '@/types/apps/limsTypes'

const LimsInstrumentsList = () => {
  const [instruments, setInstruments] = useState<InstrumentType[]>([])
  const [loading, setLoading] = useState(true)

  const fetchInstruments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/apps/lims/Instrument-master')
      if (!response.ok) {
        throw new Error('Failed to fetch instruments')
      }
      const data = await response.json()
      setInstruments(data.result)
    } catch (error) {
      console.error('Error fetching instruments:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInstruments()
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
      {/* <Grid size={{ xs: 12 }}>
        <ProductCard />
        ``
      </Grid> */}
      <Grid size={{ xs: 12 }}>
        <InstrumentListTable instrumentData={instruments} onDataChange={fetchInstruments} />
      </Grid>
    </Grid>
  )
}

export default LimsInstrumentsList
