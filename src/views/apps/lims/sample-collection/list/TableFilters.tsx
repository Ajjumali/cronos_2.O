'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import CardContent from '@mui/material/CardContent'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Collapse from '@mui/material/Collapse'
import Box from '@mui/material/Box'
import Autocomplete from '@mui/material/Autocomplete'
import Typography from '@mui/material/Typography'

// Component Imports
// eslint-disable-next-line import/no-unresolved
import CustomTextField from '@core/components/mui/TextField'

// Type Imports
import type { SampleCollectionType } from '@/app/api/apps/lims/sample-collection/route'

// Add ColorLegend component
const ColorLegend = () => (
  <Box sx={{ display: 'flex', gap: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ width: 16, height: 16, bgcolor: 'warning.main', borderRadius: 1 }} />
      <Typography variant="body2">Pending</Typography>
    </Box>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ width: 16, height: 16, bgcolor: 'success.main', borderRadius: 1 }} />
      <Typography variant="body2">Collected</Typography>
    </Box>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ width: 16, height: 16, bgcolor: 'error.main', borderRadius: 1 }} />
      <Typography variant="body2">Rejected</Typography>
    </Box>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ width: 16, height: 16, bgcolor: 'info.main', borderRadius: 1 }} />
      <Typography variant="body2">Outsourced</Typography>
    </Box>
  </Box>
)

interface SampleTypeDto {
  sampleId: number
  sampleType: string
  activeFlag: string
}

interface LabDto {
  id: number
  labName: string
  activeFlag: string
}

interface LocationDto {
  id: number
  name: string
  activeFlag: string
}

interface EmployeeDto {
  id: number
  employeeId: string
  employeeName: string
  activeFlag: string
}

const TableFilters = ({
  setData,
  sampleData
}: {
  setData: (data: SampleCollectionType[]) => void
  sampleData?: SampleCollectionType[]
}) => {
  // States
  const [collectionStatus, setCollectionStatus] = useState<string>('')
  const [sampleType, setSampleType] = useState<string>('')
  const [location, setLocation] = useState<string>('')
  const [employeeId, setEmployeeId] = useState<string>('')
  const [lab, setLab] = useState<string>('')
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false)
  const [sampleTypes, setSampleTypes] = useState<SampleTypeDto[]>([])
  const [labs, setLabs] = useState<LabDto[]>([])
  const [locations, setLocations] = useState<LocationDto[]>([])
  const [employees, setEmployees] = useState<EmployeeDto[]>([])

  // Fetch sample types, labs, locations, and employees on component mount
  useEffect(() => {
    const fetchSampleTypes = async () => {
      try {
        const response = await fetch('/api/apps/lims/sample-type-master')

        if (!response.ok) {
          throw new Error('Failed to fetch sample types')
        }

        const data = await response.json()

        if (data.result) {
          setSampleTypes(data.result)
        } else {
          setSampleTypes([])
        }
      } catch (error) {
        console.error('Error fetching sample types:', error)
        setSampleTypes([])
      }
    }

    const fetchLabs = async () => {
      try {
        const response = await fetch('/api/apps/lims/lab-master')

        if (!response.ok) {
          throw new Error('Failed to fetch labs')
        }

        const data = await response.json()

        if (data.result) {
          setLabs(data.result)
        } else {
          setLabs([])
        }
      } catch (error) {
        console.error('Error fetching labs:', error)
        setLabs([])
      }
    }

    const fetchLocations = async () => {
      try {
        const response = await fetch('/api/apps/lims/location-master')

        if (!response.ok) {
          throw new Error('Failed to fetch locations')
        }

        const data = await response.json()

        if (data.result) {
          setLocations(data.result)
        } else {
          setLocations([])
        }
      } catch (error) {
        console.error('Error fetching locations:', error)
        setLocations([])
      }
    }

    const fetchEmployees = async () => {
      try {
        const response = await fetch('/api/apps/lims/employee-master')

        if (!response.ok) {
          throw new Error('Failed to fetch employees')
        }

        const data = await response.json()

        if (data.result) {
          setEmployees(data.result)
        } else {
          setEmployees([])
        }
      } catch (error) {
        console.error('Error fetching employees:', error)
        setEmployees([])
      }
    }

    fetchSampleTypes()
    fetchLabs()
    fetchLocations()
    fetchEmployees()
  }, [])

  // Function to clear all filters
  const clearFilters = () => {
    setCollectionStatus('')
    setSampleType('')
    setLocation('')
    setEmployeeId('')
    setLab('')
    setData(sampleData || [])
  }

  // Function to apply filters
  const handleApplyFilters = () => {
    const filteredData = sampleData?.filter(sample => {
      if (collectionStatus && sample.collectionStatus !== collectionStatus) return false
      if (sampleType && sample.sampleType !== sampleType) return false
      if (location && sample.location !== location) return false
      if (employeeId && sample.employeeId !== employeeId) return false
      if (lab && sample.laboratory !== lab) return false

      return true
    })

    setData(filteredData ?? [])
  }

  return (
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button
          variant="text"
          onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
          startIcon={
            <div className="flex items-center gap-1">
              <i className="tabler-filter text-sm" />
            </div>
          }
        >
          Filters
        </Button>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <ColorLegend />
          <Button 
            variant="text" 
            onClick={clearFilters}
            startIcon={<i className="tabler-refresh text-sm" />}
          >
            Reset Filters
          </Button>
        </Box>
      </Box>
      
      <Collapse in={isFiltersExpanded}>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <CustomTextField
              select
              fullWidth
              id='collection-status'
              value={collectionStatus}
              onChange={e => setCollectionStatus(e.target.value)}
              slotProps={{
                select: { displayEmpty: true }
              }}
            >
              <MenuItem value=''>Select Collection Status</MenuItem>
              <MenuItem value='Pending'>Pending</MenuItem>
              <MenuItem value='Collected'>Collected</MenuItem>
              <MenuItem value='Rejected'>Rejected</MenuItem>
              <MenuItem value='Outsourced'>Outsourced</MenuItem>
            </CustomTextField>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 4 }}>
            <CustomTextField
              select
              fullWidth
              id='sample-type'
              value={sampleType}
              onChange={e => setSampleType(e.target.value)}
              slotProps={{
                select: { displayEmpty: true }
              }}
            >
              <MenuItem value=''>Select Sample Type</MenuItem>
              {sampleTypes.map((type) => (
                <MenuItem key={type.sampleId} value={type.sampleType}>
                  {type.sampleType}
                </MenuItem>
              ))}
            </CustomTextField>
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <CustomTextField
              select
              fullWidth
              id='location'
              value={location}
              onChange={e => setLocation(e.target.value)}
              slotProps={{
                select: { displayEmpty: true }
              }}
            >
              <MenuItem value=''>Select Location</MenuItem>
              {locations.map((loc) => (
                <MenuItem key={loc.id} value={loc.name}>
                  {loc.name}
                </MenuItem>
              ))}
            </CustomTextField>
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <Autocomplete
              fullWidth
              id='employee-id'
              options={employees}
              getOptionLabel={(option) => option.employeeId + ' - ' + option.employeeName}
              value={employees.find(emp => emp.employeeId === employeeId) || null}
              onChange={(_, newValue) => setEmployeeId(newValue?.employeeId || '')}
              renderInput={(params) => (
                <CustomTextField
                  {...params}
                  placeholder="Search Employee ID"
                />
              )}
              isOptionEqualToValue={(option, value) => option.employeeId === value.employeeId}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  {option.employeeId} - {option.employeeName}
                </li>
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <CustomTextField
              select
              fullWidth
              id='lab'
              value={lab}
              onChange={e => setLab(e.target.value)}
              slotProps={{
                select: { displayEmpty: true }
              }}
            >
              <MenuItem value=''>Select Laboratory</MenuItem>
              {labs.map((lab) => (
                <MenuItem key={lab.id} value={lab.labName}>
                  {lab.labName}
                </MenuItem>
              ))}
            </CustomTextField>
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
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
