'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

// Type Imports
import type { MethodType } from '@/types/apps/limsTypes'

// Component Imports
import MethodListTable from '@/views/apps/lims/method/MethodListTable'

// Service Imports
import { methodService } from '@/app/api/apps/lims/method/route'

const MethodPage = () => {
  const [methods, setMethods] = useState<MethodType[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMethods = async () => {
    try {
      setLoading(true)
      const data = await methodService.getMethods()
      setMethods(data)
    } catch (error) {
      console.error('Error fetching methods:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMethods()
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
        <MethodListTable methodData={methods} onDataChange={fetchMethods} />
      </Grid>
    </Grid>
  )
}

export default MethodPage
