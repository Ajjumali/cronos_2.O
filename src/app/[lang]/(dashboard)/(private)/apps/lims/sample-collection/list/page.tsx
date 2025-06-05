'use client'

import { useEffect, useState } from 'react'
import SampleCollectionListTable from '@/views/apps/lims/sample-collection/list/SampleCollectionListTable'
import type { SampleCollectionType } from '@/app/api/apps/lims/sample-collection/route'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

const SampleCollectionListPage = () => {
  const [sampleData, setSampleData] = useState<SampleCollectionType[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/apps/lims/sample-collection')
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
      <SampleCollectionListTable sampleData={sampleData} onDataChange={handleDataChange} />
    </div>
  )
}

export default SampleCollectionListPage
