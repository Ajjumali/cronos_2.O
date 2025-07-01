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

interface PanelDto {
  id: number
  panelName: string
  activeFlag: string
}

interface TestDto {
  id: number
  testName: string
  activeFlag: string
}

interface TableFiltersProps {
  setData: (data: RequisitionType[]) => void
  requisitionData?: RequisitionType[]
}

const TableFilters = ({ setData, requisitionData }: TableFiltersProps) => {
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [panel, setPanel] = useState<string>('')
  const [test, setTest] = useState<string>('')
  const [department, setDepartment] = useState<string>('')
  const [status, setStatus] = useState<string>('')
  const [referenceNumber, setReferenceNumber] = useState<string>('')
  const [name, setName] = useState<string>('')
  const [panels, setPanels] = useState<PanelDto[]>([])
  const [tests, setTests] = useState<TestDto[]>([])
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false)

  // Get unique reference numbers from requisitionData
  const referenceNumberOptions = Array.from(new Set((requisitionData || []).map(r => r.referenceNumber)))
  // Get unique names from requisitionData
  const nameOptions = Array.from(new Set((requisitionData || []).map(r => r.patientName)))

  useEffect(() => {
    const fetchPanels = async () => {
      try {
        const response = await fetch('/api/apps/lims/panel-master')
        if (!response.ok) throw new Error('Failed to fetch panels')
        const data = await response.json()
        setPanels(data.result || [])
      } catch (error) {
        console.error('Error fetching panels:', error)
        setPanels([])
      }
    }
    const fetchTests = async () => {
      try {
        const response = await fetch('/api/apps/lims/test-master')
        if (!response.ok) throw new Error('Failed to fetch tests')
        const data = await response.json()
        setTests(data.result || [])
      } catch (error) {
        console.error('Error fetching tests:', error)
        setTests([])
      }
    }
    fetchPanels()
    fetchTests()
  }, [])

  const clearFilters = () => {
    setFromDate('')
    setToDate('')
    setPanel('')
    setTest('')
    setDepartment('')
    setStatus('')
    setReferenceNumber('')
    setName('')
    setData(requisitionData || [])
  }

  const handleApplyFilters = () => {
    const filteredData = requisitionData?.filter(item => {
      if (fromDate && new Date(item.requisitionDateTime) < new Date(fromDate)) return false
      if (toDate && new Date(item.requisitionDateTime) > new Date(toDate)) return false
      if (department && item.department !== department) return false
      if (status && item.status !== status) return false
      if (referenceNumber && item.referenceNumber !== referenceNumber) return false
      if (panel && !(item.panels || []).includes(panel)) return false
      if (test && !(item.tests || []).includes(test)) return false
      if (name && item.patientName !== name) return false
      return true
    })
    setData(filteredData ?? [])
  }

  return (
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button
          variant='text'
          onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
          startIcon={<i className='tabler-filter text-sm' />}
        >
          Filters
        </Button>
        <Button
          variant='text'
          onClick={clearFilters}
          startIcon={<CloseIcon />}
        >
          Clear
        </Button>
      </Box>
      <Collapse in={isFiltersExpanded}>
        <Grid container spacing={6}>
          <Grid item xs={12} sm={4}>
            <CustomTextField
              fullWidth
              type='date'
              id='from-date'
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              placeholder='From Date'
              InputLabelProps={{ shrink: false }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <CustomTextField
              fullWidth
              type='date'
              id='to-date'
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              placeholder='To Date'
              InputLabelProps={{ shrink: false }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <CustomTextField
              select
              fullWidth
              id='department'
              value={department}
              onChange={e => setDepartment(e.target.value)}
              slotProps={{ select: { displayEmpty: true } }}
            >
              <MenuItem value=''>Select Department</MenuItem>
              <MenuItem value='Cardiology'>Cardiology</MenuItem>
              <MenuItem value='Neurology'>Neurology</MenuItem>
              <MenuItem value='Orthopedics'>Orthopedics</MenuItem>
            </CustomTextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <CustomTextField
              select
              fullWidth
              id='status'
              value={status}
              onChange={e => setStatus(e.target.value)}
              slotProps={{ select: { displayEmpty: true } }}
            >
              <MenuItem value=''>Select Requisition Status</MenuItem>
              <MenuItem value='Pending Approval'>Pending Approval</MenuItem>
              <MenuItem value='Approved'>Approved</MenuItem>
              <MenuItem value='Cancelled'>Cancelled</MenuItem>
            </CustomTextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <CustomTextField
              select
              fullWidth
              id='reference-number'
              value={referenceNumber}
              onChange={e => setReferenceNumber(e.target.value)}
              slotProps={{ select: { displayEmpty: true } }}
            >
              <MenuItem value=''>Select Reference Number</MenuItem>
              {referenceNumberOptions.map(option => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </CustomTextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <CustomTextField
              select
              fullWidth
              id='panel'
              value={panel}
              onChange={e => setPanel(e.target.value)}
              slotProps={{ select: { displayEmpty: true } }}
            >
              <MenuItem value=''>Select Panel</MenuItem>
              {panels.map((panel) => (
                <MenuItem key={panel.id} value={panel.panelName}>
                  {panel.panelName}
                </MenuItem>
              ))}
            </CustomTextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <CustomTextField
              select
              fullWidth
              id='test'
              value={test}
              onChange={e => setTest(e.target.value)}
              slotProps={{ select: { displayEmpty: true } }}
            >
              <MenuItem value=''>Select Test</MenuItem>
              {tests.map((test) => (
                <MenuItem key={test.id} value={test.testName}>
                  {test.testName}
                </MenuItem>
              ))}
            </CustomTextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <CustomTextField
              select
              fullWidth
              id='name'
              value={name}
              onChange={e => setName(e.target.value)}
              slotProps={{ select: { displayEmpty: true } }}
            >
              <MenuItem value=''>Select Name</MenuItem>
              {nameOptions.map(option => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </CustomTextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              variant='contained'
              color='primary'
              onClick={handleApplyFilters}
              fullWidth
              startIcon={<i className='tabler-search' />}
            >
              Go
            </Button>
          </Grid>
        </Grid>
      </Collapse>
    </CardContent>
  )
}

export default TableFilters
