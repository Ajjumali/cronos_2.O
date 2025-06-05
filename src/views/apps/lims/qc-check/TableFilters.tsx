import { useState, useEffect, useCallback, useMemo } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import CardContent from '@mui/material/CardContent'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Collapse from '@mui/material/Collapse'
import Box from '@mui/material/Box'
import { Close as CloseIcon } from '@mui/icons-material'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

type QcCheckType = {
  id: number
  srNo: number
  testName: string
  instrumentName: string
  level1: string
  level2: string
  level3: string
  doneOn: string
  doneBy: string
  profile: string
  result: string
  date: string
  sampleId: string
  referenceId: string
  genderName: string
  parameter: string
}

const resultOptions = [
  { value: '', label: 'All Results' },
  { value: 'Pass', label: 'Pass' },
  { value: 'Fail', label: 'Fail' },
  { value: 'NA', label: 'NA' }
]

const TableFilters = ({
  setData,
  qcData
}: {
  setData: (data: QcCheckType[]) => void
  qcData?: QcCheckType[]
}) => {
  // States
  const [instrumentName, setInstrumentName] = useState<string>('')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [instrumentNames, setInstrumentNames] = useState<string[]>([])
  const [selectedLevel, setSelectedLevel] = useState<string>('')
  const [selectedResult, setSelectedResult] = useState<string>('')

  // Dummy instrument names, replace with API call if needed
  useEffect(() => {
    // Replace this with your API call if needed
    setInstrumentNames([
      'Sysmex XN-1000',
      'Cobas 6000',
      'Abbott Architect',
      'Mindray BC-2800'
    ])
  }, [])

  // Function to clear all filters
  const clearFilters = useCallback(() => {
    setInstrumentName('')
    setFromDate('')
    setToDate('')
    setSelectedLevel('')
    setSelectedResult('')
  }, [])

  // Apply filters whenever filter values change
  useEffect(() => {
    if (!qcData) return

    const filteredData = qcData.filter(row => {
      // Instrument filter
      if (instrumentName && row.instrumentName !== instrumentName) return false
      
      // Date range filter
      if (fromDate && row.date.slice(0, 10) < fromDate) return false
      if (toDate && row.date.slice(0, 10) > toDate) return false
      
      // Level filter
      if (selectedLevel) {
        const levelValue = row[`level${selectedLevel}` as keyof QcCheckType]
        if (!levelValue) return false
      }
      
      // Result filter
      if (selectedResult && row.result !== selectedResult) return false
      
      return true
    })

    setData(filteredData)
  }, [instrumentName, fromDate, toDate, selectedLevel, selectedResult, qcData, setData])

  return (
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button
          variant="text"
          onClick={() => setIsExpanded(!isExpanded)}
          startIcon={
            <div className="flex items-center gap-1">
              <i className="tabler-filter text-sm" />
            </div>
          }
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
        <Grid container spacing={6}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <CustomTextField
              select
              fullWidth
              id='select-instrument-name'
              label='Instrument Name'
              value={instrumentName}
              onChange={e => setInstrumentName(e.target.value)}
              slotProps={{
                select: { displayEmpty: true }
              }}
            >
              <MenuItem value=''>Select Instrument</MenuItem>
              {instrumentNames.map(name => (
                <MenuItem key={name} value={name}>
                  {name}
                </MenuItem>
              ))}
            </CustomTextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <CustomTextField
              type="date"
              fullWidth
              id='from-date'
              label='From Date'
              InputLabelProps={{ shrink: true }}
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <CustomTextField
              type="date"
              fullWidth
              id='to-date'
              label='To Date'
              InputLabelProps={{ shrink: true }}
              value={toDate}
              onChange={e => setToDate(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <CustomTextField
              select
              fullWidth
              id='select-level'
              label='QC Level'
              value={selectedLevel}
              onChange={e => setSelectedLevel(e.target.value)}
              slotProps={{
                select: { displayEmpty: true }
              }}
            >
              <MenuItem value=''>All Levels</MenuItem>
              <MenuItem value='1'>Level 1</MenuItem>
              <MenuItem value='2'>Level 2</MenuItem>
              <MenuItem value='3'>Level 3</MenuItem>
            </CustomTextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <CustomTextField
              select
              fullWidth
              id='select-result'
              label='QC Result'
              value={selectedResult}
              onChange={e => setSelectedResult(e.target.value)}
              slotProps={{
                select: { displayEmpty: true }
              }}
            >
              {resultOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </CustomTextField>
          </Grid>
        </Grid>
      </Collapse>
    </CardContent>
  )
}

export default TableFilters
