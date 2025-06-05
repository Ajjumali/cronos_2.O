'use client'

import { useState, useEffect } from 'react'
import Grid from '@mui/material/Grid'
import CardContent from '@mui/material/CardContent'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Collapse from '@mui/material/Collapse'
import Box from '@mui/material/Box'
import Autocomplete from '@mui/material/Autocomplete'
import Typography from '@mui/material/Typography'
import { DatePicker } from '@mui/x-date-pickers'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { Close as CloseIcon } from '@mui/icons-material'
import CustomTextField from '@core/components/mui/TextField'

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

interface SubjectDto {
  nSubjectMstid: number
  vSubjectId: string
  vFirstName: string
  activeFlag: string
}

interface ProjectDto {
  id: number
  studyProtocolNumber: string
  studyProtocolName: string
  activeFlag: string
  studyTitle: string
}

interface StudySiteDto {
  id: number
  siteName: string
  siteNumber: string
  activeFlag: string
  siteGroupName: string
  siteProtocolNumber: string
}

interface TestDto {
  id: number
  testName: string
  activeFlag: string
}

interface PanelDto {
  id: number
  panelName: string
  activeFlag: string
}

// Sample type for filtering (should match your data)
interface SampleRegistrationType {
  id: string
  registrationDateTime: string
  sampleId: string
  subjectId: string
  gender: string
  name: string
  company: string
  branch: string
  type: 'human' | 'animal'
  laboratory: string
  department: string
  testStatus: string
  test: string
  panel: string
  projectNo: string
  sampleType: string
  location: string
  lastModifiedBy?: string
  lastModifiedAt?: string
  auditTrail?: Array<{
    action: string
    timestamp: string
    user: string
    details: string
  }>
}

interface TableFiltersProps {
  setData: (data: SampleRegistrationType[]) => void
  sampleData?: SampleRegistrationType[]
}

const TableFilters = ({ setData, sampleData }: TableFiltersProps) => {
  // States
  const [location, setLocation] = useState<string>('')
  const [subjectId, setSubjectId] = useState<string>('')
  const [lab, setLab] = useState<string>('')
  const [test, setTest] = useState<string>('')
  const [panel, setPanel] = useState<string>('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [receiveStatus, setReceiveStatus] = useState<string>('')
  const [labs, setLabs] = useState<LabDto[]>([])
  const [locations, setLocations] = useState<LocationDto[]>([])
  const [subjects, setSubjects] = useState<SubjectDto[]>([])
  const [tests, setTests] = useState<TestDto[]>([])
  const [panels, setPanels] = useState<PanelDto[]>([])

  // Fetch data on component mount
  useEffect(() => {
    const fetchLabs = async () => {
      try {
        const response = await fetch('/api/apps/lims/lab-master')
        if (!response.ok) throw new Error('Failed to fetch labs')
        const data = await response.json()
        setLabs(data.result || [])
      } catch (error) {
        console.error('Error fetching labs:', error)
        setLabs([])
      }
    }

    const fetchLocations = async () => {
      try {
        const response = await fetch('/api/apps/lims/location-master')
        if (!response.ok) throw new Error('Failed to fetch locations')
        const data = await response.json()
        setLocations(data.result || [])
      } catch (error) {
        console.error('Error fetching locations:', error)
        setLocations([])
      }
    }

    const fetchSubjects = async () => {
      try {
        const response = await fetch('/api/apps/lims/subject-master')
        if (!response.ok) throw new Error('Failed to fetch subjects')
        const data = await response.json()
        setSubjects(data.result || [])
      } catch (error) {
        console.error('Error fetching subjects:', error)
        setSubjects([])
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

    fetchLabs()
    fetchLocations()
    fetchSubjects()
    fetchTests()
    fetchPanels()
  }, [])

  // Function to apply filters
  const handleApplyFilters = () => {
    const filteredData = sampleData?.filter(sample => {
      if (location && sample.location !== location) return false
      if (subjectId && sample.subjectId !== subjectId) return false
      if (lab && sample.laboratory !== lab) return false
      if (test && sample.test !== test) return false
      if (panel && sample.panel !== panel) return false
      return true
    })
    setData(filteredData ?? [])
  }

  // Clear all filters
  const clearFilters = () => {
    setLocation('')
    setSubjectId('')
    setLab('')
    setTest('')
    setPanel('')
    setData(sampleData || [])
  }

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
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="text" 
            onClick={clearFilters}
            startIcon={<CloseIcon />}
          >
            Reset Filters
          </Button>
        </Box>
      </Box>
      <Collapse in={isExpanded}>
      <Grid container spacing={6}>
         
          
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
              id='subject-id'
              options={subjects}
              getOptionLabel={(option) => option.vSubjectId + ' - ' + option.vFirstName}
              value={subjects.find(subject => subject.vSubjectId === subjectId) || null}
              onChange={(_, newValue) => setSubjectId(newValue?.vSubjectId || '')}
              renderInput={(params) => (
                <CustomTextField
                  {...params}
                  placeholder="Search Subject ID"
                />
              )}
              isOptionEqualToValue={(option, value) => option.vSubjectId === value.vSubjectId}
              renderOption={(props, option) => (
                <li {...props} key={option.nSubjectMstid}>
                  {option.vSubjectId} - {option.vFirstName}
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
              <MenuItem value=''>Select Lab</MenuItem>
              {labs.map((lab) => (
                <MenuItem key={lab.id} value={lab.labName}>
                  {lab.labName}
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
              slotProps={{
                select: { displayEmpty: true }
              }}
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
              id='panel'
              value={panel}
              onChange={e => setPanel(e.target.value)}
              slotProps={{
                select: { displayEmpty: true }
              }}
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
