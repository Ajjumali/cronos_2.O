'use client'

import { useEffect, useState } from 'react'
import SampleRegistrationListTable from '@/views/apps/lims/sample-registration/list/SampleRegistrationListTable'
import type { SampleRegistrationType } from '@/views/apps/lims/sample-registration/list/SampleRegistrationListTable'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

const SampleRegistrationListPage = () => {
  const [sampleData, setSampleData] = useState<SampleRegistrationType[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/apps/lims/sample-registration')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setSampleData(data)
    } catch (error) {
      console.error('Error fetching sample data:', error)
      setSampleData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleDataChange = () => {
    fetchData()
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <div className='p-6'>
      <SampleRegistrationListTable sampleData={sampleData} onDataChange={handleDataChange} />
    </div>
  )
}

export default SampleRegistrationListPage
