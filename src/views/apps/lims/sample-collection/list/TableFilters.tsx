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
  const [projectNo, setProjectNo] = useState<number>(0)
  const [study, setStudy] = useState<string>('')
  const [receiveStatus, setReceiveStatus] = useState<string>('')
  const [projects, setProjects] = useState<any[]>([])
  const [studySites, setStudySites] = useState<any[]>([])
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')

  // Fetch sample types, labs, locations, and employees on component mount
  useEffect(() => {
   const fetchSampleTypes = async () => {
  try {
    const response = await fetch('/api/apps/lims/sample-type-master');
    if (!response.ok) {
      // Optionally log the response text for debugging
      const text = await response.text();
      console.error('Server error:', text);
      throw new Error('Failed to fetch sample types');
    }
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response:', text);
      throw new Error('Invalid response format');
    }
    const data = await response.json();
    if (data.result) {
      setSampleTypes(data.result);
    } else {
      setSampleTypes([]);
    }
  } catch (error) {
    console.error('Error fetching sample types:', error);
    setSampleTypes([]);
  }
};

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

    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/apps/lims/project-master')
        if (!response.ok) throw new Error('Failed to fetch projects')
        const data = await response.json()
        setProjects(data.result || [])
      } catch (error) {
        setProjects([])
      }
    }

    const fetchStudySites = async () => {
      if (!projectNo) {
        setStudySites([])
        return
      }
      try {
        const response = await fetch(`/api/apps/lims/study-site-master?id=${projectNo}`)
        const data = await response.json()
        setStudySites(data.result || [])
      } catch (error) {
        setStudySites([])
      }
    }

    fetchSampleTypes()
    fetchLabs()
    fetchLocations()
    fetchEmployees()
    fetchProjects()
    fetchStudySites()
  }, [])

  // Function to clear all filters
  const clearFilters = () => {
    setFromDate('')
    setToDate('')
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
      if (fromDate && new Date(sample.collectedOn) < new Date(fromDate)) return false
      if (toDate && new Date(sample.collectedOn) > new Date(toDate)) return false
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
            Clear
          </Button>
        </Box>
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
          
          <Grid item xs={12} sm={4}>
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

          <Grid item xs={12} sm={4}>
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

          <Grid item xs={12} sm={4}>
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

          <Grid item xs={12} sm={4}>
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

          <Grid item xs={12} sm={4}>
            <Autocomplete
              fullWidth
              id='project-no'
              options={projects}
              getOptionLabel={option => option.studyProtocolNumber + ' - ' + option.studyTitle}
              value={projects.find(project => project.id === projectNo) || null}
              onChange={(_, newValue) => setProjectNo(newValue?.id || 0)}
              renderInput={params => <CustomTextField {...params} placeholder='Search Project' />}
              isOptionEqualToValue={(option, value) => option.studyProtocolNumber === value.studyProtocolNumber}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  {option.studyProtocolNumber} - {option.studyTitle}
                </li>
              )}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <Autocomplete
              fullWidth
              id='study'
              options={studySites}
              getOptionLabel={option => `${option.siteProtocolNumber} - ${option.siteGroupName}`}
              value={studySites.find(site => site.siteNumber === study) || null}
              onChange={(_, newValue) => setStudy(newValue?.siteNumber || '')}
              renderInput={params => <CustomTextField {...params} placeholder='Search Study Site' />}
              isOptionEqualToValue={(option, value) => option.siteNumber === value.siteNumber}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  {option.siteProtocolNumber} - {option.siteGroupName}
                </li>
              )}
              disabled={!projectNo}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <CustomTextField
              select
              fullWidth
              id='receive-status'
              value={receiveStatus}
              onChange={e => setReceiveStatus(e.target.value)}
              slotProps={{ select: { displayEmpty: true } }}
              placeholder='Select Receive Status'
            >
              <MenuItem value=''>Select Receive Status</MenuItem>
              <MenuItem value='3'>Pending</MenuItem>
              <MenuItem value='5'>Completed</MenuItem>
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
