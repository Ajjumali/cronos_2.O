'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid2'

// Component Imports
import TestResultsTable from '@/views/apps/lims/test-results/TestResultsTable'

// Type Imports
import type { TestResultType } from '@/types/apps/limsTypes'

const TestResultsListPage = () => {
  const [testData, setTestData] = useState<TestResultType[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/apps/lims/Test-results')
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch test results')
      }
      const data = await response.json()
      setTestData(data)
    } catch (error) {
      console.error('Error fetching test data:', error)
      setTestData([])
    } finally {
      setLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchData()
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
        <TestResultsTable testData={testData} onDataChange={fetchData} />
      </Grid>
    </Grid>
  )
}

export default TestResultsListPage 