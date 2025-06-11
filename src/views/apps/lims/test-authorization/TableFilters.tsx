'use client'

import { useState } from 'react'
import Box from '@mui/material/Box'
import CustomTextField from '@core/components/mui/TextField'
import type { TestAuthorizationType } from '@/types/apps/limsTypes'

interface TableFiltersProps {
  setData: (data: TestAuthorizationType[]) => void
  testData: TestAuthorizationType[]
}

const TableFilters = ({ setData, testData }: TableFiltersProps) => {
  const [filters, setFilters] = useState({
    status: '',
    testType: '',
    dateRange: {
      start: '',
      end: ''
    }
  })

  const handleFilterChange = (field: string, value: any) => {
    const newFilters = field === 'dateRange' 
      ? { ...filters, dateRange: value }
      : { ...filters, [field]: value }
    
    setFilters(newFilters)

    let filtered = [...testData]

    if (newFilters.status) {
      filtered = filtered.filter(item => item.authorizationStatus === newFilters.status)
    }

    if (newFilters.testType) {
      filtered = filtered.filter(item => item.testName === newFilters.testType)
    }

    if (newFilters.dateRange.start && newFilters.dateRange.end) {
      filtered = filtered.filter(item => {
        const date = new Date(item.registrationDateTime)
        return date >= new Date(newFilters.dateRange.start) && date <= new Date(newFilters.dateRange.end)
      })
    }

    setData(filtered)
  }

  return (
    <Box sx={{ p: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      <CustomTextField
        select
        label='Status'
        value={filters.status}
        onChange={e => handleFilterChange('status', e.target.value)}
        sx={{ minWidth: 200 }}
      >
        <option value=''>All</option>
        <option value='Pending'>Pending</option>
        <option value='Approved'>Approved</option>
        <option value='Rejected'>Rejected</option>
      </CustomTextField>

      <CustomTextField
        select
        label='Test Type'
        value={filters.testType}
        onChange={e => handleFilterChange('testType', e.target.value)}
        sx={{ minWidth: 200 }}
      >
        <option value=''>All</option>
        <option value='Blood Glucose'>Blood Glucose</option>
        <option value='Hemoglobin'>Hemoglobin</option>
      </CustomTextField>

      <CustomTextField
        type='date'
        label='Start Date'
        value={filters.dateRange.start}
        onChange={e => handleFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
        sx={{ minWidth: 200 }}
      />

      <CustomTextField
        type='date'
        label='End Date'
        value={filters.dateRange.end}
        onChange={e => handleFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
        sx={{ minWidth: 200 }}
      />
    </Box>
  )
}

export default TableFilters 