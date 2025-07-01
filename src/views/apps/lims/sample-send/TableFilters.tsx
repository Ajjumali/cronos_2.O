'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Collapse from '@mui/material/Collapse'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import Print from '@mui/icons-material/Print'
import FileDownload from '@mui/icons-material/FileDownload'
import Divider from '@mui/material/Divider'
import Autocomplete from '@mui/material/Autocomplete'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

interface SampleType {
  id: string
  volunteerId: string
  volunteerName: string
  age: number
  screeningDate: string
  screeningFacility: string
  barcodeId: string
  sampleType: string
  collectedBy: string
  collectedOn: string
  sentBy: string
  sentOn: string
  status: 'pending' | 'sent' | 'received'
  projectNo: string
  statusId: string
  location: string
  study: string
  avatar?: string
}

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

interface TableFiltersProps {
  setData: (data: SampleType[]) => void
  sampleData?: SampleType[]
  selectedSamples: SampleType[]
  handleSendSamples: (samples: SampleType[]) => void
  onSelectSamples: (samples: SampleType[]) => void
}

const TableFilters = ({
  setData,
  sampleData = [],
  selectedSamples = [],
  handleSendSamples,
  onSelectSamples
}: TableFiltersProps) => {
  // States
  const [projectNo, setProjectNo] = useState<number>(0)
  const [study, setStudy] = useState<string>('')
  const [receiveStatus, setReceiveStatus] = useState<string>('')
  const [sampleType, setSampleType] = useState<string>('')
  const [location, setLocation] = useState<string>('')
  const [lab, setLab] = useState<string>('')
  const [sendSampleStatus, setSendSampleStatus] = useState<string>('')
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false)
  const [sampleTypes, setSampleTypes] = useState<SampleTypeDto[]>([])
  const [labs, setLabs] = useState<LabDto[]>([])
  const [locations, setLocations] = useState<LocationDto[]>([])
  const [projects, setProjects] = useState<ProjectDto[]>([])
  const [studySites, setStudySites] = useState<StudySiteDto[]>([])
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [search, setSearch] = useState<string>('')

  // Fetch sample types, labs, locations, and projects on component mount
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
    setSearch('')
    setFromDate('')
    setToDate('')
    setProjectNo(0)
    setStudy('')
    setReceiveStatus('')
    setSampleType('')
    setLocation('')
    setLab('')
    setSendSampleStatus('')
    setStudySites([])
    setData(sampleData)
  }

  // Function to apply filters
  const handleApplyFilters = () => {
    const filteredData = sampleData.filter(sample => {
      if (search &&
        !(
          sample.volunteerName?.toLowerCase().includes(search.toLowerCase()) ||
          sample.volunteerId?.toLowerCase().includes(search.toLowerCase()) ||
          sample.barcodeId?.toLowerCase().includes(search.toLowerCase())
        )
      ) return false
      if (fromDate && new Date(sample.collectedOn) < new Date(fromDate)) return false
      if (toDate && new Date(sample.collectedOn) > new Date(toDate)) return false
      if (projectNo && sample.projectNo !== projectNo.toString()) return false
      if (receiveStatus && sample.statusId !== receiveStatus) return false
      if (sampleType && sample.sampleType !== sampleType) return false
      if (location && sample.location !== location) return false
      if (lab && sample.screeningFacility !== lab) return false
      if (study && sample.study !== study) return false
      if (sendSampleStatus && sample.status !== sendSampleStatus) return false

      return true
    })

    setData(filteredData)
  }

  return (
    <Box>
      {/* Top row with title and action buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant='h4' sx={{ mb: 0 }}>
          Sample Send
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button variant='outlined' startIcon={<Print />}>Print</Button>
          <Button variant='outlined' startIcon={<FileDownload />}>Export</Button>
          <Grid item xs={12} md={4}>
            <CustomTextField
              select
              fullWidth
              id='lab'
              value={lab}
              onChange={e => setLab(e.target.value)}
              slotProps={{ select: { displayEmpty: true } }}
            >
              <MenuItem value=''>Select Lab</MenuItem>
              {labs.map(lab => (
                <MenuItem key={lab.id} value={lab.labName}>
                  {lab.labName}
                </MenuItem>
              ))}
            </CustomTextField>
          </Grid>
          <Button variant='contained' color='primary' onClick={() => handleSendSamples(selectedSamples)}>
            Send to Lab
          </Button>
        </Box>
      </Box>
      {/* Divider line */}
      <Divider sx={{ mb: 2 }} />
      {/* Search Box Row (below divider) */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', mb: 2 }}>
        <CustomTextField
          placeholder='Search Send Sample'
          value={search}
          onChange={e => setSearch(e.target.value)}
          size='small'
          sx={{ width: 240 }}
        />
      </Box>

      {/* Filters section */}
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
        <Button variant='text' onClick={clearFilters} startIcon={<i className='tabler-refresh text-sm' />}>
          Clear
        </Button>
      </Box>

      <Collapse in={isFiltersExpanded}>
        <Grid container spacing={6}>
          <Grid item xs={12} md={4}>
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

          <Grid item xs={12} md={4}>
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

          <Grid item xs={12} md={4}>
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

          <Grid item xs={12} md={4}>
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

          <Grid item xs={12} md={4}>
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

          <Grid item xs={12} md={4}>
            <CustomTextField
              select
              fullWidth
              id='send-sample-status'
              value={sendSampleStatus}
              onChange={e => setSendSampleStatus(e.target.value)}
              slotProps={{ select: { displayEmpty: true } }}
            >
              <MenuItem value=''>Select Send Sample Status</MenuItem>
              <MenuItem value='pending'>Pending</MenuItem>
              <MenuItem value='sent'>Sent</MenuItem>
              <MenuItem value='received'>Received</MenuItem>
            </CustomTextField>
          </Grid>

          <Grid item xs={12} md={4}>
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

          <Grid item xs={12} md={4}>
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

          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant='contained'
              color='primary'
              onClick={handleApplyFilters}
              startIcon={<i className='tabler-search' />}
            >
              Go
            </Button>
          </Grid>
        </Grid>
      </Collapse>
    </Box>
  )
}

export default TableFilters
