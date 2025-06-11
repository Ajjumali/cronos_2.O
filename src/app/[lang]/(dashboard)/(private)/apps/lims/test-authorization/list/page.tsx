'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

// Component Imports
import TestAuthorizationTable from '@/views/apps/lims/test-authorization/TestAuthorizationTable'

// API Imports
import { testAuthorizationService } from '@/app/api/apps/lims/Test-authorization/route'

// Type Imports
import type { TestAuthorizationType } from '@/types/apps/limsTypes'

const TestAuthorizationListPage = () => {
  const [testData, setTestData] = useState<TestAuthorizationType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTestData = async () => {
      try {
        setLoading(true)
        const response = await testAuthorizationService.getTestAuthorizations()
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

  return <TestAuthorizationTable testData={testData} />
}

export default TestAuthorizationListPage 