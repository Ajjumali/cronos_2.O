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

// Type Imports
import type { SampleType } from './SampleReceivedTable'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

// Add ColorLegend component
const ColorLegend = () => (
  <Box sx={{ display: 'flex', gap: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ width: 16, height: 16, bgcolor: 'success.main', borderRadius: 1 }} />
      <Typography variant='body2'>Received</Typography>
    </Box>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ width: 16, height: 16, bgcolor: 'error.main', borderRadius: 1 }} />
      <Typography variant='body2'>Rejected</Typography>
    </Box>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ width: 16, height: 16, bgcolor: 'warning.main', borderRadius: 1 }} />
      <Typography variant='body2'>Pending</Typography>
    </Box>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ width: 16, height: 16, bgcolor: 'secondary.main', borderRadius: 1 }} />
      <Typography variant='body2'>Outsourced</Typography>
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

const TableFilters = ({
  setData,
  sampleData
}: {
  setData: (data: SampleType[]) => void
  sampleData?: SampleType[]
}) => {
  // States
  const [projectNo, setProjectNo] = useState<number>(0)
  const [study, setStudy] = useState<string>('')
  const [receiveStatus, setReceiveStatus] = useState<string>('')
  const [sampleType, setSampleType] = useState<string>('')
  const [location, setLocation] = useState<string>('')
  const [subjectId, setSubjectId] = useState<string>('')
  const [lab, setLab] = useState<string>('')
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false)
  const [sampleTypes, setSampleTypes] = useState<SampleTypeDto[]>([])
  const [labs, setLabs] = useState<LabDto[]>([])
  const [locations, setLocations] = useState<LocationDto[]>([])
  const [subjects, setSubjects] = useState<SubjectDto[]>([])
  const [projects, setProjects] = useState<ProjectDto[]>([])
  const [studySites, setStudySites] = useState<StudySiteDto[]>([])

  // Fetch sample types, labs, locations, and subjects on component mount
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

    const fetchSubjects = async () => {
      try {
        const response = await fetch('/api/apps/lims/subject-master')
        if (!response.ok) {
          throw new Error('Failed to fetch subjects')
        }
        const data = await response.json()
        if (data.result) {
          setSubjects(data.result)
        } else {
          setSubjects([])
        }
      } catch (error) {
        console.error('Error fetching subjects:', error)
        setSubjects([])
      }
    }

    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/apps/lims/project-master')
        if (!response.ok) {
          throw new Error('Failed to fetch projects')
        }
        const data = await response.json()
        if (data.result) {
          setProjects(data.result)
        } else {
          setProjects([])
        }
      } catch (error) {
        console.error('Error fetching projects:', error)
        setProjects([])
      }
    }

    fetchSampleTypes()
    fetchLabs()
    fetchLocations()
    fetchSubjects()
    fetchProjects()
  }, [])

  // Fetch study sites when project changes
  useEffect(() => {
    const fetchStudySites = async () => {
      if (!projectNo) {
        setStudySites([])
        return
      }

      try {
        const response = await fetch(`/api/apps/lims/study-site-master?id=${projectNo}`)
        const data = await response.json()
        if (data.result) {
          setStudySites(data.result)
        } else {
          setStudySites([])
        }
      } catch (error) {
        console.error('Error fetching study sites:', error)
        setStudySites([])
      }
    }

    fetchStudySites()
  }, [projectNo])

  // Function to clear all filters
  const clearFilters = () => {
    setProjectNo(0)
    setStudy('')
    setReceiveStatus('')
    setSampleType('')
    setLocation('')
    setSubjectId('')
    setLab('')
    setStudySites([])
    setData(sampleData || [])
  }

  // Function to apply filters
  const handleApplyFilters = () => {
    const filteredData = sampleData?.filter(sample => {
      if (projectNo && sample.projectNo !== projectNo.toString()) return false
      if (receiveStatus && sample.statusId?.toString() !== receiveStatus) return false
      if (sampleType && sample.sampleType !== sampleType) return false
      if (location && sample.location !== location) return false
      if (subjectId && sample.referenceId !== subjectId) return false
      if (lab && sample.lab !== lab) return false
      if (study && sample.study !== study) return false

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
          startIcon={
            <div className='flex items-center gap-1'>
              <i className='tabler-filter text-sm' />
            </div>
          }
        >
          Filters
        </Button>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <ColorLegend />
          <Button variant='text' onClick={clearFilters} startIcon={<i className='tabler-refresh text-sm' />}>
            Reset Filters
          </Button>
        </Box>
      </Box>

      <Collapse in={isFiltersExpanded}>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12, sm: 4 }}>
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

          <Grid size={{ xs: 12, sm: 4 }}>
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
          <Grid size={{ xs: 12, sm: 4 }}>
            <CustomTextField
              select
              fullWidth
              id='receive-status'
              value={receiveStatus}
              onChange={e => setReceiveStatus(e.target.value)}
              slotProps={{
                select: { displayEmpty: true }
              }}
            >
              <MenuItem value=''>Select Receive Status</MenuItem>
              <MenuItem value='3'>Pending</MenuItem>
              <MenuItem value='5'>Completed</MenuItem>
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
              {sampleTypes.map(type => (
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
              {locations.map(loc => (
                <MenuItem key={loc.id} value={loc.name}>
                  {loc.name}
                </MenuItem>
              ))}
            </CustomTextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Autocomplete
              fullWidth
              id='subject-id'
              options={subjects}
              getOptionLabel={option => option.vSubjectId + ' - ' + option.vFirstName}
              value={subjects.find(subject => subject.vSubjectId === subjectId) || null}
              onChange={(_, newValue) => setSubjectId(newValue?.vSubjectId || '')}
              renderInput={params => <CustomTextField {...params} placeholder='Search Subject ID' />}
              isOptionEqualToValue={(option, value) => option.vSubjectId === value.vSubjectId}
              renderOption={(props, option) => (
                <li {...props} key={option.nSubjectMstid}>
                  {option.vSubjectId} - {option.vFirstName}
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
              <MenuItem value=''>Select Lab</MenuItem>
              {labs.map(lab => (
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
