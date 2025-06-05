'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

// Component Imports
import TestResultsTable from '@/views/apps/lims/test-results/TestResultsTable'

// API Imports
import { testResultsService } from '@/app/api/apps/lims/Test-results/route'

// Type Imports
import type { TestResultType } from '@/types/apps/limsTypes'

const TestResultsListPage = () => {
  const [testData, setTestData] = useState<TestResultType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTestData = async () => {
      try {
        setLoading(true)
        const response = await testResultsService.getTestResults()
        setTestData(response.result || [])
      } catch (error) {
        console.error('Error fetching test data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTestData()
  }, [])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return <TestResultsTable testData={testData} />
}

export default TestResultsListPage 