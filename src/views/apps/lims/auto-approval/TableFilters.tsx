import { useState, useEffect, useCallback, useMemo } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import CardContent from '@mui/material/CardContent'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Collapse from '@mui/material/Collapse'
import Box from '@mui/material/Box'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

type TableFiltersProps = {
  globalFilter: string
  setGlobalFilter: (value: string) => void
}

const TableFilters = ({ globalFilter, setGlobalFilter }: TableFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [filters, setFilters] = useState({
    testName: '',
    analyteCode: '',
    instrumentName: '',
    status: ''
  })

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleReset = () => {
    setFilters({
      testName: '',
      analyteCode: '',
      instrumentName: '',
      status: ''
    })
    setGlobalFilter('')
  }

  return (
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button
          variant="text"
          onClick={() => setIsExpanded(!isExpanded)}
          startIcon={
            <div className="flex items-center gap-1">
              <i className="tabler-filter text-sm" />
              <i className={`tabler-chevron-${isExpanded ? 'up' : 'down'} text-sm`} />
            </div>
          }
        >
          Filters
        </Button>
        <Button 
          variant="text" 
          onClick={handleReset}
          startIcon={<i className="tabler-refresh text-sm" />}
        >
          Reset Filters
        </Button>
      </Box>
      <Collapse in={isExpanded}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <CustomTextField
              fullWidth
              label="Test Name"
              value={filters.testName}
              onChange={e => handleFilterChange('testName', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <CustomTextField
              fullWidth
              label="Analyte Code"
              value={filters.analyteCode}
              onChange={e => handleFilterChange('analyteCode', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <CustomTextField
              fullWidth
              label="Instrument"
              value={filters.instrumentName}
              onChange={e => handleFilterChange('instrumentName', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <CustomTextField
              select
              fullWidth
              label="Status"
              value={filters.status}
              onChange={e => handleFilterChange('status', e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </CustomTextField>
          </Grid>
        </Grid>
      </Collapse>
    </CardContent>
  )
}

export default TableFilters 