'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import CardContent from '@mui/material/CardContent'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Collapse from '@mui/material/Collapse'
import Box from '@mui/material/Box'
import { DatePicker } from '@mui/x-date-pickers'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { Close as CloseIcon } from '@mui/icons-material'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

// Type Imports
import type { RequisitionType } from './SampleRequisitionListTable'

interface TableFiltersProps {
  setData: (data: RequisitionType[]) => void
  requisitionData?: RequisitionType[]
}

const TableFilters = ({ setData, requisitionData }: TableFiltersProps) => {
  // States
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null })
  const [status, setStatus] = useState<string>('')
  const [department, setDepartment] = useState<string>('')
  const [referenceNumber, setReferenceNumber] = useState<string>('')
  const [patientName, setPatientName] = useState<string>('')
  const [sampleId, setSampleId] = useState<string>('')
  const [isExpanded, setIsExpanded] = useState(false)

  // Function to clear all filters
  const clearFilters = () => {
    setDateRange({ from: null, to: null })
    setStatus('')
    setDepartment('')
    setReferenceNumber('')
    setPatientName('')
    setSampleId('')
  }

  // Apply filters whenever any filter value changes
  useEffect(() => {
    const filteredData = requisitionData?.filter(requisition => {
      // Date range filter
      if (dateRange.from && new Date(requisition.requisitionDateTime) < dateRange.from) return false
      if (dateRange.to && new Date(requisition.requisitionDateTime) > dateRange.to) return false

      // Other filters
      if (status && requisition.status !== status) return false
      if (department && requisition.department !== department) return false
      if (referenceNumber && !requisition.referenceNumber.includes(referenceNumber)) return false
      if (patientName && !requisition.patientName.toLowerCase().includes(patientName.toLowerCase())) return false
      if (sampleId && !requisition.sampleId.includes(sampleId)) return false

      return true
    })

    setData(filteredData ?? [])
  }, [dateRange, status, department, referenceNumber, patientName, sampleId, requisitionData, setData])

  return (
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button
          variant="text"
          onClick={() => setIsExpanded(!isExpanded)}
          startIcon={<i className={`tabler-chevron-${isExpanded ? 'up' : 'down'}`} />}
        >
          Filters
        </Button>
        <Button 
          variant="text" 
          onClick={clearFilters}
          startIcon={<CloseIcon />}
        >
          Reset Filters
        </Button>
      </Box>
      <Collapse in={isExpanded}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label='From Date'
                value={dateRange.from}
                onChange={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label='To Date'
                value={dateRange.to}
                onChange={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <CustomTextField
              select
              fullWidth
              label='Status'
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <MenuItem value=''>All</MenuItem>
              <MenuItem value='Pending Approval'>Pending Approval</MenuItem>
              <MenuItem value='Approved'>Approved</MenuItem>
              <MenuItem value='Cancelled'>Cancelled</MenuItem>
            </CustomTextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <CustomTextField
              select
              fullWidth
              label='Department'
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <MenuItem value=''>All</MenuItem>
              <MenuItem value='Cardiology'>Cardiology</MenuItem>
              <MenuItem value='Neurology'>Neurology</MenuItem>
              <MenuItem value='Orthopedics'>Orthopedics</MenuItem>
            </CustomTextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <CustomTextField
              fullWidth
              label='Reference Number'
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <CustomTextField
              fullWidth
              label='Patient Name'
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <CustomTextField
              fullWidth
              label='Sample ID'
              value={sampleId}
              onChange={(e) => setSampleId(e.target.value)}
            />
          </Grid>
        </Grid>
      </Collapse>
    </CardContent>
  )
}

export default TableFilters
