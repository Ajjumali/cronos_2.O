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
  avatar?: string
}

interface LabDto {
  id: number
  labName: string
  activeFlag: string
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
  const [searchText, setSearchText] = useState('')
  const [lab, setLab] = useState('')
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false)
  const [labs, setLabs] = useState<LabDto[]>([])

  // Fetch labs on component mount
  useEffect(() => {
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

    fetchLabs()
  }, [])

  // Function to clear all filters
  const clearFilters = () => {
    setSearchText('')
    setLab('')
    setData(sampleData)
  }

  // Function to apply filters
  const handleApplyFilters = () => {
    const filteredData = sampleData.filter(sample => {
      if (
        searchText &&
        !sample.volunteerId.toLowerCase().includes(searchText.toLowerCase()) &&
        !sample.volunteerName.toLowerCase().includes(searchText.toLowerCase()) &&
        !sample.barcodeId.toLowerCase().includes(searchText.toLowerCase())
      )
        return false
      if (lab && sample.screeningFacility !== lab) return false

      return true
    })

    setData(filteredData)
  }

  return (
    <Box>
      {/* Top row with action buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant='h4'>Sample Send</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button variant='outlined' startIcon={<Print />}>
            Print
          </Button>
          <Button variant='outlined' startIcon={<FileDownload />}>
            Export
          </Button>
          <Button
            variant='contained'
            color='primary'
            disabled={selectedSamples.length === 0}
            onClick={() => handleSendSamples(selectedSamples)}
          >
            Send to Lab
          </Button>
        </Box>
      </Box>

      {/* Divider line */}
      <Divider sx={{ mb: 2 }} />

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
          Reset Filters
        </Button>
      </Box>

      <Collapse in={isFiltersExpanded}>
        <Grid container spacing={6}>
          <Grid item xs={12} md={4}>
            <Autocomplete
              fullWidth
              id='search-text'
              options={sampleData}
              getOptionLabel={option => `${option.volunteerId} - ${option.volunteerName}`}
              value={
                sampleData.find(
                  sample =>
                    sample.volunteerId === searchText ||
                    sample.volunteerName === searchText ||
                    sample.barcodeId === searchText
                ) || null
              }
              onChange={(_, newValue) => setSearchText(newValue?.volunteerId || '')}
              renderInput={params => <TextField {...params} size='small' placeholder='Search by name or ID' />}
              isOptionEqualToValue={(option, value) =>
                option.volunteerId === value.volunteerId ||
                option.volunteerName === value.volunteerName ||
                option.barcodeId === value.barcodeId
              }
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  {option.volunteerId} - {option.volunteerName} ({option.barcodeId})
                </li>
              )}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size='small'>
              <InputLabel>Lab</InputLabel>
              <Select value={lab} label='Lab' onChange={e => setLab(e.target.value as string)}>
                <MenuItem value=''>All Labs</MenuItem>
                {labs.map(lab => (
                  <MenuItem key={lab.id} value={lab.labName}>
                    {lab.labName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant='contained'
              color='primary'
              onClick={handleApplyFilters}
              startIcon={<i className='tabler-search' />}
            >
              Search
            </Button>
          </Grid>
        </Grid>
      </Collapse>
    </Box>
  )
}

export default TableFilters
