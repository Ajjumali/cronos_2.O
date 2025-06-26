'use client'

import React, { useState, useEffect } from 'react'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { toast } from 'react-toastify'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useRouter } from 'next/navigation'
import LinearProgress from '@mui/material/LinearProgress'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import Grid from '@mui/material/Grid'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import Badge from '@mui/material/Badge'
import TableSortLabel from '@mui/material/TableSortLabel'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputAdornment from '@mui/material/InputAdornment'
import Link from '@mui/material/Link'
import RadioGroup from '@mui/material/RadioGroup'
import Radio from '@mui/material/Radio'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormLabel from '@mui/material/FormLabel'
import CustomTextField from '@core/components/mui/TextField'
import CustomAutocomplete from '@core/components/mui/Autocomplete'
import Collapse from '@mui/material/Collapse'
import Autocomplete from '@mui/material/Autocomplete'
import Grid2 from '@mui/material/Grid2'
import Checkbox from '@mui/material/Checkbox'

interface SampleInformation {
  srNo: number
  sampleId: string
  volunteerId: string
  volunteerName: string
  collectionDateTime: string
  panelName: string
  testName: string
  collectedBy: string
  sampleType: string
  requestedBy: string
  receiptDateTime: string
  receiptBy: string
  sampleSendDateTime: string
  sendBy: string
  testCategory: string
  validatedBy: string
  validatedOn: string
  approvedBy: string
  approvedOn: string
}

interface ReportProgress {
  totalTasks: number
  completedTasks: number
  pendingTasks: string[]
  completedTaskList: string[]
}

interface Activity {
  id: string
  type: 'Pending Test' | 'Validation' | 'Review' | 'QC' | 'Approval' | 'Remark'
  status: 'Pending' | 'In Progress' | 'Completed'
  description: string
  timestamp: string
  assignedTo?: string
  priority?: 'High' | 'Medium' | 'Low'
}

interface LabReport {
  employeeId: string
  id: number
  registrationDateTime: string
  sampleId: string
  referenceId: string
  gender: string
  name: string
  testPanelName: string
  sampleInformation: SampleInformation
  remarks: string
  outsourcedSampleTracking: string
  sampleAuditTrail: string[]
  printCount: number
  testingStatus: 'Validated' | 'Non-Validated' | 'Pending' | 'Partially Completed'
  projectNumber: string
  study: string
  location: string
  lab: string
  highLowFlags: {
    testName: string
    value: string
    flag: 'High' | 'Low' | 'Normal'
  }[]
  criticalResults: {
    testName: string
    reason: string
  }[]
  consentFormUrl?: string
  progress?: ReportProgress
  activities: Activity[]
  testCounts: {
    total: number
    pending: number
    completed: number
    failed: number
  }
  fileUrl?: string
}

interface FilterState {
  startDate: Date | null
  endDate: Date | null
  projectNumber: string
  study: string
  testingStatus: string
  sampleType: string
  location: string
  referenceId: string
  test: string
  panel: string
  lab: string
}

interface SampleAnalytics {
  totalSamples: number
  bySampleType: Record<string, number>
  byStatus: Record<string, number>
  byLocation: Record<string, number>
  byTestCategory: Record<string, number>
  averageProcessingTime: number
  successRate: number
}

interface OutsourcedSample {
  id: string
  sampleId: string
  referenceId: string
  outsourcedTo: string
  status: 'Pending' | 'In Transit' | 'In Progress' | 'Completed' | 'Returned' | 'Failed'
  sentDate: string
  expectedReturnDate: string
  actualReturnDate?: string
  trackingNumber?: string
  notes?: string
}

type ReportType = LabReport

type ChronologyType = 'date' | 'testType' | 'status' | 'sampleId'

interface ChronologySettings {
  type: ChronologyType
  order: 'asc' | 'desc'
}

interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Validated':
      return 'success'
    case 'Non-Validated':
      return 'error'
    case 'Pending':
      return 'warning'
    case 'Partially Completed':
      return 'info'
    default:
      return 'default'
  }
}

const ActivityIcon: React.FC<{ type: Activity['type'] }> = ({ type }) => {
  switch (type) {
    case 'Pending Test':
      return <i className='tabler-flask' />
    case 'Validation':
      return <i className='tabler-check' />
    case 'Review':
      return <i className='tabler-eye' />
    case 'QC':
      return <i className='tabler-microscope' />
    case 'Approval':
      return <i className='tabler-stamp' />
    case 'Remark':
      return <i className='tabler-message-circle' />
    default:
      return <i className='tabler-circle' />
  }
}

const ActivityList: React.FC<{ activities: Activity[] }> = ({ activities }) => {
  const groupedActivities = activities.reduce(
    (acc, activity) => {
      if (!acc[activity.type]) {
        acc[activity.type] = []
      }
      acc[activity.type].push(activity)
      return acc
    },
    {} as Record<Activity['type'], Activity[]>
  )

  return (
    <List>
      {Object.entries(groupedActivities).map(([type, typeActivities]) => (
        <React.Fragment key={type}>
          <ListItem>
            <ListItemText
              primary={
                <Typography variant='subtitle1' sx={{ fontWeight: 'bold' }}>
                  {type}
                  <Badge badgeContent={typeActivities.length} color='primary' sx={{ ml: 1 }} />
                </Typography>
              }
            />
          </ListItem>
          {typeActivities.map(activity => (
            <ListItem
              key={activity.id}
              sx={{
                pl: 4,
                backgroundColor:
                  activity.status === 'Pending'
                    ? 'rgba(255, 152, 0, 0.08)'
                    : activity.status === 'In Progress'
                      ? 'rgba(33, 150, 243, 0.08)'
                      : 'inherit'
              }}
            >
              <ListItemIcon>
                <ActivityIcon type={activity.type} />
              </ListItemIcon>
              <ListItemText
                primary={activity.description}
                secondary={
                  <>
                    <Typography component='span' variant='body2' color='text.primary'>
                      {new Date(activity.timestamp).toLocaleString()}
                    </Typography>
                    {activity.assignedTo && ` • Assigned to: ${activity.assignedTo}`}
                    {activity.priority && ` • Priority: ${activity.priority}`}
                  </>
                }
              />
            </ListItem>
          ))}
          <Divider />
        </React.Fragment>
      ))}
    </List>
  )
}

const TestCounts: React.FC<{ counts: LabReport['testCounts'] }> = ({ counts }) => (
  <Grid container spacing={2} sx={{ mb: 2 }}>
    <Grid item xs={3}>
      <Card>
        <CardContent>
          <Typography variant='h6' color='text.secondary'>
            Total Tests
          </Typography>
          <Typography variant='h4'>{counts.total}</Typography>
        </CardContent>
      </Card>
    </Grid>
    <Grid item xs={3}>
      <Card>
        <CardContent>
          <Typography variant='h6' color='warning.main'>
            Pending
          </Typography>
          <Typography variant='h4' color='warning.main'>
            {counts.pending}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
    <Grid item xs={3}>
      <Card>
        <CardContent>
          <Typography variant='h6' color='success.main'>
            Completed
          </Typography>
          <Typography variant='h4' color='success.main'>
            {counts.completed}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
    <Grid item xs={3}>
      <Card>
        <CardContent>
          <Typography variant='h6' color='error.main'>
            Failed
          </Typography>
          <Typography variant='h4' color='error.main'>
            {counts.failed}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  </Grid>
)

const SampleAnalyticsGrid: React.FC<{ analytics: SampleAnalytics }> = ({ analytics }) => {
  const [orderBy, setOrderBy] = useState<string>('name')
  const [order, setOrder] = useState<'asc' | 'desc'>('asc')
  const [filters, setFilters] = useState({
    sampleType: '',
    status: '',
    location: '',
    testCategory: '',
    searchQuery: ''
  })

  const handleSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Card sx={{ mb: 4 }}>
      {/* <CardHeader title='Sample Analytics' /> */}
      <CardContent>
        {/* <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant='h6' color='text.secondary'>
                  Total Samples
                </Typography>
                <Typography variant='h4'>{analytics.totalSamples}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant='h6' color='text.secondary'>
                  Success Rate
                </Typography>
                <Typography variant='h4' color='success.main'>
                  {analytics.successRate}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant='h6' color='text.secondary'>
                  Avg. Processing Time
                </Typography>
                <Typography variant='h4'>{analytics.averageProcessingTime}h</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant='h6' color='text.secondary'>
                  Active Tests
                </Typography>
                <Typography variant='h4' color='primary.main'>
                  {Object.values(analytics.byStatus).reduce((a, b) => a + b, 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid> */}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Sample Type</InputLabel>
              <Select
                value={filters.sampleType}
                label='Sample Type'
                onChange={e => handleFilterChange('sampleType', e.target.value)}
              >
                <MenuItem value=''>All</MenuItem>
                {Object.keys(analytics.bySampleType).map(type => (
                  <MenuItem key={type} value={type}>
                    {type} ({analytics.bySampleType[type]})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label='Status'
                onChange={e => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value=''>All</MenuItem>
                {Object.keys(analytics.byStatus).map(status => (
                  <MenuItem key={status} value={status}>
                    {status} ({analytics.byStatus[status]})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Location</InputLabel>
              <Select
                value={filters.location}
                label='Location'
                onChange={e => handleFilterChange('location', e.target.value)}
              >
                <MenuItem value=''>All</MenuItem>
                {Object.keys(analytics.byLocation).map(location => (
                  <MenuItem key={location} value={location}>
                    {location} ({analytics.byLocation[location]})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid> */}
          {/* <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label='Search'
              value={filters.searchQuery}
              onChange={e => handleFilterChange('searchQuery', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <i className='tabler-search' />
                  </InputAdornment>
                )
              }}
            />
          </Grid> */}
        </Grid>

        {/* <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'sampleType'}
                    direction={orderBy === 'sampleType' ? order : 'asc'}
                    onClick={() => handleSort('sampleType')}
                  >
                    Sample Type
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'status'}
                    direction={orderBy === 'status' ? order : 'asc'}
                    onClick={() => handleSort('status')}
                  >
                    Status
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'location'}
                    direction={orderBy === 'location' ? order : 'asc'}
                    onClick={() => handleSort('location')}
                  >
                    Location
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'count'}
                    direction={orderBy === 'count' ? order : 'asc'}
                    onClick={() => handleSort('count')}
                  >
                    Count
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'successRate'}
                    direction={orderBy === 'successRate' ? order : 'asc'}
                    onClick={() => handleSort('successRate')}
                  >
                    Success Rate
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(analytics.bySampleType).map(([type, count]) => (
                <TableRow key={type}>
                  <TableCell>{type}</TableCell>
                  <TableCell>
                    <Chip
                      label={Object.keys(analytics.byStatus).find(status => analytics.byStatus[status] > 0) || 'N/A'}
                      color={getStatusColor(
                        Object.keys(analytics.byStatus).find(
                          status => analytics.byStatus[status] > 0
                        ) as LabReport['testingStatus']
                      )}
                      size='small'
                    />
                  </TableCell>
                  <TableCell>
                    {Object.keys(analytics.byLocation).find(location => analytics.byLocation[location] > 0) || 'N/A'}
                  </TableCell>
                  <TableCell>{count}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LinearProgress
                        variant='determinate'
                        value={analytics.successRate}
                        sx={{ width: '100%', mr: 1 }}
                      />
                      <Typography variant='body2'>{analytics.successRate}%</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer> */}
      </CardContent>
    </Card>
  )
}

const OutsourcedSamplesGrid: React.FC<{ samples: OutsourcedSample[] }> = ({ samples }) => {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  const getStatusColor = (status: OutsourcedSample['status']) => {
    switch (status) {
      case 'Completed':
        return 'success'
      case 'In Progress':
        return 'info'
      case 'In Transit':
        return 'warning'
      case 'Failed':
        return 'error'
      case 'Returned':
        return 'success'
      default:
        return 'default'
    }
  }

  const filteredSamples = samples.filter(sample => {
    const matchesStatus = !statusFilter || sample.status === statusFilter
    const matchesSearch =
      !searchQuery ||
      sample.sampleId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sample.referenceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sample.outsourcedTo.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  return (
    <Card sx={{ mb: 4 }}>
      <CardHeader
        title='Outsourced Samples Tracking'
        action={
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl size='small' sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} label='Status' onChange={e => setStatusFilter(e.target.value)}>
                <MenuItem value=''>All Statuses</MenuItem>
                <MenuItem value='Pending'>Pending</MenuItem>
                <MenuItem value='In Transit'>In Transit</MenuItem>
                <MenuItem value='In Progress'>In Progress</MenuItem>
                <MenuItem value='Completed'>Completed</MenuItem>
                <MenuItem value='Returned'>Returned</MenuItem>
                <MenuItem value='Failed'>Failed</MenuItem>
              </Select>
            </FormControl>
            <TextField
              size='small'
              placeholder='Search samples...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <i className='tabler-search' />
                  </InputAdornment>
                )
              }}
            />
          </Box>
        }
      />
      <CardContent>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Sample ID</TableCell>
                <TableCell>Reference ID</TableCell>
                <TableCell>Outsourced To</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Sent Date</TableCell>
                <TableCell>Expected Return</TableCell>
                <TableCell>Actual Return</TableCell>
                <TableCell>Tracking</TableCell>
                <TableCell>Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSamples.map(sample => (
                <TableRow
                  key={sample.id}
                  sx={{
                    backgroundColor:
                      sample.status === 'Failed'
                        ? 'rgba(211, 47, 47, 0.08)'
                        : sample.status === 'In Transit'
                          ? 'rgba(255, 152, 0, 0.08)'
                          : 'inherit'
                  }}
                >
                  <TableCell>{sample.sampleId}</TableCell>
                  <TableCell>{sample.referenceId}</TableCell>
                  <TableCell>{sample.outsourcedTo}</TableCell>
                  <TableCell>
                    <Chip label={sample.status} color={getStatusColor(sample.status)} size='small' />
                  </TableCell>
                  <TableCell>{new Date(sample.sentDate).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(sample.expectedReturnDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {sample.actualReturnDate ? new Date(sample.actualReturnDate).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell>
                    {sample.trackingNumber ? (
                      <Tooltip title='Click to track'>
                        <Link
                          href={`https://tracking.example.com/${sample.trackingNumber}`}
                          target='_blank'
                          rel='noopener noreferrer'
                          sx={{ textDecoration: 'none' }}
                        >
                          {sample.trackingNumber}
                        </Link>
                      </Tooltip>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {sample.notes ? (
                      <Tooltip title={sample.notes}>
                        <Typography variant='body2' noWrap sx={{ maxWidth: 150 }}>
                          {sample.notes}
                        </Typography>
                      </Tooltip>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  )
}

const ChronologyDialog: React.FC<{
  open: boolean
  onClose: () => void
  onPrint: (settings: ChronologySettings) => void
}> = ({ open, onClose, onPrint }) => {
  const [settings, setSettings] = useState<ChronologySettings>({
    type: 'date',
    order: 'desc'
  })

  const handleChange = (field: keyof ChronologySettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle>Set Report Chronology</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <FormLabel component='legend'>Sort By</FormLabel>
          <RadioGroup value={settings.type} onChange={e => handleChange('type', e.target.value)}>
            <FormControlLabel value='date' control={<Radio />} label='Registration Date' />
            <FormControlLabel value='testType' control={<Radio />} label='Test Type' />
            <FormControlLabel value='status' control={<Radio />} label='Status' />
            <FormControlLabel value='sampleId' control={<Radio />} label='Sample ID' />
          </RadioGroup>
        </Box>
        <Box sx={{ mt: 3 }}>
          <FormLabel component='legend'>Order</FormLabel>
          <RadioGroup value={settings.order} onChange={e => handleChange('order', e.target.value)}>
            <FormControlLabel value='asc' control={<Radio />} label='Ascending' />
            <FormControlLabel value='desc' control={<Radio />} label='Descending' />
          </RadioGroup>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant='contained' onClick={() => onPrint(settings)} startIcon={<i className='tabler-printer' />}>
          Print Reports
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const ReportDashboard: React.FC = () => {
  const [reports, setReports] = useState<ReportType[]>([])
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isPdfLoading, setIsPdfLoading] = useState(false)
  const [sampleAnalytics, setSampleAnalytics] = useState<SampleAnalytics>({
    totalSamples: 150,
    bySampleType: {
      Blood: 45,
      Urine: 35,
      Tissue: 25,
      Other: 45
    },
    byStatus: {
      Pending: 30,
      'In Progress': 45,
      Completed: 60,
      Failed: 15
    },
    byLocation: {
      'Lab A': 50,
      'Lab B': 40,
      'Lab C': 60
    },
    byTestCategory: {
      Hematology: 40,
      Biochemistry: 35,
      Microbiology: 25,
      Other: 50
    },
    averageProcessingTime: 24,
    successRate: 85
  })
  const [outsourcedSamples, setOutsourcedSamples] = useState<OutsourcedSample[]>([
    {
      id: '1',
      sampleId: 'SAMP001',
      referenceId: 'REF001',
      outsourcedTo: 'External Lab A',
      status: 'In Progress',
      sentDate: '2024-03-01',
      expectedReturnDate: '2024-03-15',
      trackingNumber: 'TRK123456',
      notes: 'Routine analysis'
    },
    {
      id: '2',
      sampleId: 'SAMP002',
      referenceId: 'REF002',
      outsourcedTo: 'External Lab B',
      status: 'In Transit',
      sentDate: '2024-03-05',
      expectedReturnDate: '2024-03-20',
      trackingNumber: 'TRK789012'
    },
    {
      id: '3',
      sampleId: 'SAMP003',
      referenceId: 'REF003',
      outsourcedTo: 'External Lab C',
      status: 'Completed',
      sentDate: '2024-02-20',
      expectedReturnDate: '2024-03-05',
      actualReturnDate: '2024-03-04',
      trackingNumber: 'TRK345678',
      notes: 'Results received and validated'
    }
  ])
  const [isChronologyDialogOpen, setIsChronologyDialogOpen] = useState(false)
  const [isDepartmentDialogOpen, setIsDepartmentDialogOpen] = useState(false)

  // Filter states
  const [projectNo, setProjectNo] = useState<number>(0)
  const [study, setStudy] = useState<string>('')
  const [sampleType, setSampleType] = useState<string>('')
  const [location, setLocation] = useState<string>('')
  const [lab, setLab] = useState<string>('')
  const [projects, setProjects] = useState<any[]>([])
  const [studySites, setStudySites] = useState<any[]>([])
  const [sampleTypes, setSampleTypes] = useState<any[]>([])
  const [labs, setLabs] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false)
  const [test, setTest] = useState<string>('')
  const [panel, setPanel] = useState<string>('')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [tests, setTests] = useState<any[]>([])
  const [panels, setPanels] = useState<any[]>([])
  const [employeeId, setEmployeeId] = useState<string>('')
  const [employees, setEmployees] = useState<any[]>([])
  const [searchRequisition, setSearchRequisition] = useState('')
  const [testStatus, setTestStatus] = useState('')

  const router = useRouter()
  const targetPath = '/apps/reports'
  const enTargetPath = '/en/apps/reports'

  useEffect(() => {
    const currentPath = window.location.pathname

    // Only redirect if we're not already on one of the target paths
    if (currentPath !== targetPath && currentPath !== enTargetPath) {
      router.push(targetPath)
    }
  }, [router])

  useEffect(() => {
    // Fetch reports from API
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      // For demonstration, using dummy data
      const dummyReports: ReportType[] = [
        {
          employeeId: 'EMP001',
          id: 1,
          registrationDateTime: new Date().toISOString(),
          sampleId: 'SAMP001',
          referenceId: 'REF001',
          gender: 'Male',
          name: 'John Doe',
          testPanelName: 'Complete Blood Count',
          sampleInformation: {
            srNo: 1,
            sampleId: 'SAMP001',
            volunteerId: 'VOL001',
            volunteerName: 'John Doe',
            collectionDateTime: new Date().toISOString(),
            panelName: 'Complete Blood Count',
            testName: 'CBC',
            collectedBy: 'Dr. Smith',
            sampleType: 'Blood',
            requestedBy: 'Dr. Johnson',
            receiptDateTime: new Date().toISOString(),
            receiptBy: 'Lab Tech A',
            sampleSendDateTime: new Date().toISOString(),
            sendBy: 'Lab Tech B',
            testCategory: 'Hematology',
            validatedBy: 'Dr. Brown',
            validatedOn: new Date().toISOString(),
            approvedBy: 'Dr. Wilson',
            approvedOn: new Date().toISOString()
          },
          remarks: 'Routine checkup',
          outsourcedSampleTracking: 'In-house',
          sampleAuditTrail: ['Collected', 'Processed'],
          printCount: 1,
          testingStatus: 'Validated',
          projectNumber: 'PROJ001',
          study: 'Study A',
          location: 'Lab A',
          lab: 'Main Lab',
          highLowFlags: [],
          criticalResults: [],
          activities: [],
          testCounts: {
            total: 10,
            pending: 0,
            completed: 10,
            failed: 0
          },
          fileUrl: 'https://example.com/report1.pdf'
        }
      ]
      setReports(dummyReports)
    } catch (error) {
      console.error('Error fetching reports:', error)
      toast.error('Failed to fetch reports')
    }
  }

  // Fetch filter data on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/apps/lims/project-master')
        const data = await response.json()
        setProjects(data.result || [])
      } catch (e) { setProjects([]) }
    }
    const fetchSampleTypes = async () => {
      try {
        const response = await fetch('/api/apps/lims/sample-type-master')
        const data = await response.json()
        setSampleTypes(data.result || [])
      } catch (e) { setSampleTypes([]) }
    }
    const fetchLabs = async () => {
      try {
        const response = await fetch('/api/apps/lims/lab-master')
        const data = await response.json()
        setLabs(data.result || [])
      } catch (e) { setLabs([]) }
    }
    const fetchLocations = async () => {
      try {
        const response = await fetch('/api/apps/lims/location-master')
        const data = await response.json()
        setLocations(data.result || [])
      } catch (e) { setLocations([]) }
    }
    const fetchTests = async () => {
      try {
        const response = await fetch('/api/apps/lims/test-master')
        const data = await response.json()
        setTests(data.result || [])
      } catch (e) { setTests([]) }
    }
    const fetchPanels = async () => {
      try {
        const response = await fetch('/api/apps/lims/panel-master')
        const data = await response.json()
        setPanels(data.result || [])
      } catch (e) { setPanels([]) }
    }
    const fetchEmployees = async () => {
      try {
        const response = await fetch('/api/apps/lims/employee-master')
        const data = await response.json()
        setEmployees(data.result || [])
      } catch (e) { setEmployees([]) }
    }
    fetchProjects(); fetchSampleTypes(); fetchLabs(); fetchLocations(); fetchTests(); fetchPanels(); fetchEmployees();
  }, [])

  // Fetch study sites when project changes
  useEffect(() => {
    const fetchStudySites = async () => {
      if (!projectNo) { setStudySites([]); return }
      try {
        const response = await fetch(`/api/apps/lims/study-site-master?id=${projectNo}`)
        const data = await response.json()
        setStudySites(data.result || [])
      } catch (e) { setStudySites([]) }
    }
    fetchStudySites()
  }, [projectNo])

  // Filtering logic: combine search and filter logic
  const filteredReports = reports
    .filter(report =>
      !searchRequisition ||
      report.sampleId.toLowerCase().includes(searchRequisition.toLowerCase()) ||
      report.referenceId.toLowerCase().includes(searchRequisition.toLowerCase()) ||
      report.name.toLowerCase().includes(searchRequisition.toLowerCase())
    )
    .filter(report => {
      if (projectNo && report.projectNumber !== projects.find(p => p.id === projectNo)?.studyProtocolNumber) return false
      if (study && report.study !== study) return false
      if (sampleType && report.sampleInformation.sampleType !== sampleType) return false
      if (location && report.location !== location) return false
      if (lab && report.lab !== lab) return false
      if (test && report.testPanelName !== test) return false
      if (panel && report.testPanelName !== panel) return false
      if (fromDate && report.registrationDateTime.slice(0, 10) < fromDate) return false
      if (toDate && report.registrationDateTime.slice(0, 10) > toDate) return false
      if (employeeId && report.employeeId !== employeeId) return false
      if (testStatus && report.testingStatus !== testStatus) return false
      return true
    })

  const handleViewReport = (report: ReportType) => {
    setSelectedReport(report)
    setIsViewDialogOpen(true)
  }

  const handlePrintBarcode = async (report: LabReport) => {
    try {
      // Create a new window for barcode printing
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        toast.error('Please allow popups for this website')
        return
      }

      // Generate barcode content
      const barcodeContent = `
        <html>
          <head>
            <title>Barcode - ${report.sampleId}</title>
            <style>
              body { font-family: Arial, sans-serif; }
              .barcode-container { text-align: center; padding: 20px; }
              .barcode { margin: 20px 0; }
              .info { margin: 10px 0; }
              @media print {
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="barcode-container">
              <h2>Sample Barcode</h2>
              <div class="barcode">
                <img src="https://barcodeapi.org/api/code128/${report.sampleId}" alt="Barcode" />
              </div>
              <div class="info">
                <p><strong>Sample ID:</strong> ${report.sampleId}</p>
                <p><strong>Reference ID:</strong> ${report.referenceId}</p>
                <p><strong>Name:</strong> ${report.name}</p>
                <p><strong>Test/Panel:</strong> ${report.testPanelName}</p>
              </div>
              <button class="no-print" onclick="window.print()">Print Barcode</button>
            </div>
          </body>
        </html>
      `

      printWindow.document.write(barcodeContent)
      printWindow.document.close()
    } catch (error) {
      console.error('Error printing barcode:', error)
      toast.error('Failed to print barcode')
    }
  }

  const handlePrintReport = async (report: LabReport) => {
    try {
      // Create a new window for report printing
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        toast.error('Please allow popups for this website')
        return
      }

      // Generate report content
      const reportContent = `
        <html>
          <head>
            <title>Lab Report - ${report.sampleId}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .section { margin: 20px 0; }
              .section-title { font-weight: bold; margin-bottom: 10px; }
              table { width: 100%; border-collapse: collapse; margin: 10px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f5f5f5; }
              .no-print { display: none; }
              @media print {
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Laboratory Report</h1>
              <p>Generated on: ${new Date().toLocaleString()}</p>
            </div>

            <div class="section">
              <div class="section-title">Sample Information</div>
              <table>
                <tr><th>Sample ID</th><td>${report.sampleId}</td></tr>
                <tr><th>Reference ID</th><td>${report.referenceId}</td></tr>
                <tr><th>Name</th><td>${report.name}</td></tr>
                <tr><th>Gender</th><td>${report.gender}</td></tr>
                <tr><th>Test/Panel</th><td>${report.testPanelName}</td></tr>
              </table>
            </div>

            <div class="section">
              <div class="section-title">Collection Details</div>
              <table>
                <tr><th>Collection Date & Time</th><td>${new Date(report.sampleInformation.collectionDateTime).toLocaleString()}</td></tr>
                <tr><th>Collected By</th><td>${report.sampleInformation.collectedBy}</td></tr>
                <tr><th>Sample Type</th><td>${report.sampleInformation.sampleType}</td></tr>
              </table>
            </div>

            ${
              report.highLowFlags.length > 0
                ? `
              <div class="section">
                <div class="section-title">Test Results</div>
                <table>
                  <tr>
                    <th>Test Name</th>
                    <th>Value</th>
                    <th>Flag</th>
                  </tr>
                  ${report.highLowFlags
                    .map(
                      flag => `
                    <tr>
                      <td>${flag.testName}</td>
                      <td>${flag.value}</td>
                      <td>${flag.flag}</td>
                    </tr>
                  `
                    )
                    .join('')}
                </table>
              </div>
            `
                : ''
            }

            ${
              report.criticalResults.length > 0
                ? `
              <div class="section">
                <div class="section-title">Critical Results</div>
                <table>
                  <tr>
                    <th>Test Name</th>
                    <th>Reason</th>
                  </tr>
                  ${report.criticalResults
                    .map(
                      result => `
                    <tr>
                      <td>${result.testName}</td>
                      <td>${result.reason}</td>
                    </tr>
                  `
                    )
                    .join('')}
                </table>
              </div>
            `
                : ''
            }

            <div class="section">
              <div class="section-title">Validation Details</div>
              <table>
                <tr><th>Validated By</th><td>${report.sampleInformation.validatedBy}</td></tr>
                <tr><th>Validated On</th><td>${new Date(report.sampleInformation.validatedOn).toLocaleString()}</td></tr>
                <tr><th>Approved By</th><td>${report.sampleInformation.approvedBy}</td></tr>
                <tr><th>Approved On</th><td>${new Date(report.sampleInformation.approvedOn).toLocaleString()}</td></tr>
              </table>
            </div>

            <button class="no-print" onclick="window.print()">Print Report</button>
          </body>
        </html>
      `

      printWindow.document.write(reportContent)
      printWindow.document.close()
    } catch (error) {
      console.error('Error printing report:', error)
      toast.error('Failed to print report')
    }
  }

  const handleDownloadReport = async (report: LabReport) => {
    try {
      const doc = new jsPDF() as jsPDFWithAutoTable

      // Add title
      doc.setFontSize(16)
      doc.text('Laboratory Report', 14, 15)

      // Add report details
      doc.setFontSize(10)
      doc.text(`Sample ID: ${report.sampleId}`, 14, 25)
      doc.text(`Reference ID: ${report.referenceId}`, 14, 30)
      doc.text(`Name: ${report.name}`, 14, 35)
      doc.text(`Test/Panel: ${report.testPanelName}`, 14, 40)

      // Add sample information
      const sampleInfo = [
        ['Collection Date & Time', new Date(report.sampleInformation.collectionDateTime).toLocaleString()],
        ['Collected By', report.sampleInformation.collectedBy],
        ['Sample Type', report.sampleInformation.sampleType],
        ['Test Category', report.sampleInformation.testCategory]
      ]

      autoTable(doc, {
        body: sampleInfo,
        startY: 45,
        styles: { fontSize: 8 },
        theme: 'grid'
      })

      // Add test results if available
      if (report.highLowFlags.length > 0) {
        const testResults = report.highLowFlags.map(flag => [flag.testName, flag.value, flag.flag])

        autoTable(doc, {
          head: [['Test Name', 'Value', 'Flag']],
          body: testResults,
          startY: doc.lastAutoTable.finalY + 10,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [41, 128, 185] }
        })
      }

      // Add validation details
      const validationInfo = [
        ['Validated By', report.sampleInformation.validatedBy],
        ['Validated On', new Date(report.sampleInformation.validatedOn).toLocaleString()],
        ['Approved By', report.sampleInformation.approvedBy],
        ['Approved On', new Date(report.sampleInformation.approvedOn).toLocaleString()]
      ]

      autoTable(doc, {
        body: validationInfo,
        startY: doc.lastAutoTable.finalY + 10,
        styles: { fontSize: 8 },
        theme: 'grid'
      })

      // Save the PDF
      doc.save(`lab-report-${report.sampleId}.pdf`)
      toast.success('Report downloaded successfully')
    } catch (error) {
      console.error('Error downloading report:', error)
      toast.error('Failed to download report')
    }
  }

  const handleUploadReport = async () => {
    if (!uploadFile || !selectedReport) return

    try {
      // In a real application, this would upload the file to the server
      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('reportId', selectedReport.id.toString())

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      toast.success('Report uploaded successfully')
      setIsUploadDialogOpen(false)
      setUploadFile(null)
      fetchReports() // Refresh the reports list
    } catch (error) {
      console.error('Error uploading report:', error)
      toast.error('Failed to upload report')
    }
  }

  const handleExportCSV = () => {
    setIsExporting(true)
    try {
      const dataToExport = reports.map(report => ({
        'Registration Date & Time': new Date(report.registrationDateTime).toLocaleString(),
        'Sample ID': report.sampleId,
        'Reference ID': report.referenceId,
        Name: report.name,
        Gender: report.gender,
        'Test/Panel Name': report.testPanelName,
        'Project Number': report.projectNumber,
        Study: report.study,
        'Testing Status': report.testingStatus,
        Location: report.location,
        Lab: report.lab,
        'Sample Type': report.sampleInformation.sampleType,
        'Collection Date & Time': new Date(report.sampleInformation.collectionDateTime).toLocaleString(),
        'Collected By': report.sampleInformation.collectedBy,
        'Requested By': report.sampleInformation.requestedBy,
        'Receipt Date & Time': new Date(report.sampleInformation.receiptDateTime).toLocaleString(),
        'Receipt By': report.sampleInformation.receiptBy,
        'Sample Send Date & Time': new Date(report.sampleInformation.sampleSendDateTime).toLocaleString(),
        'Send By': report.sampleInformation.sendBy,
        'Test Category': report.sampleInformation.testCategory,
        'Validated By': report.sampleInformation.validatedBy,
        'Validated On': new Date(report.sampleInformation.validatedOn).toLocaleString(),
        'Approved By': report.sampleInformation.approvedBy,
        'Approved On': new Date(report.sampleInformation.approvedOn).toLocaleString(),
        Remarks: report.remarks,
        'Outsourced Sample Tracking': report.outsourcedSampleTracking,
        'High/Low Flags': report.highLowFlags.map(flag => `${flag.testName}: ${flag.value} (${flag.flag})`).join('; '),
        'Critical Results': report.criticalResults.map(result => `${result.testName}: ${result.reason}`).join('; '),
        'Print Count': report.printCount
      }))

      const headers = Object.keys(dataToExport[0])
      const csvContent = [
        headers.join(','),
        ...dataToExport.map(row =>
          headers
            .map(header => {
              const value = row[header as keyof typeof row]
              return typeof value === 'string' && value.includes(',') ? `"${value}"` : value
            })
            .join(',')
        )
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `lab-reports-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('CSV file downloaded successfully')
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to download CSV file')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportPDF = () => {
    setIsPdfLoading(true)
    try {
      const doc = new jsPDF() as jsPDFWithAutoTable

      // Add title
      doc.setFontSize(16)
      doc.text('Lab Reports', 14, 15)

      // Add date
      doc.setFontSize(10)
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22)

      // Prepare table data
      const tableData = reports.map(report => [
        new Date(report.registrationDateTime).toLocaleString(),
        report.sampleId,
        report.referenceId,
        `${report.name} (${report.gender})`,
        report.testPanelName,
        report.testingStatus,
        report.printCount.toString()
      ])

      // Add main table
      autoTable(doc, {
        head: [
          ['Registration Date & Time', 'Sample ID', 'Reference ID', 'Name', 'Test/Panel', 'Status', 'Print Count']
        ],
        body: tableData,
        startY: 30,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 30 }
      })

      // Add detailed information for each report
      let yPosition = doc.lastAutoTable.finalY + 10

      reports.forEach((report, index) => {
        if (yPosition > 250) {
          doc.addPage()
          yPosition = 20
        }

        // Sample Information
        doc.setFontSize(12)
        doc.text(`Report Details - ${report.sampleId}`, 14, yPosition)
        yPosition += 10

        const sampleInfo = [
          ['Collection Date & Time', new Date(report.sampleInformation.collectionDateTime).toLocaleString()],
          ['Collected By', report.sampleInformation.collectedBy],
          ['Sample Type', report.sampleInformation.sampleType],
          ['Test Category', report.sampleInformation.testCategory]
        ]

        autoTable(doc, {
          body: sampleInfo,
          startY: yPosition,
          styles: { fontSize: 8 },
          theme: 'grid',
          margin: { left: 14 }
        })

        yPosition = doc.lastAutoTable.finalY + 10

        // High/Low Flags
        if (report.highLowFlags.length > 0) {
          doc.setFontSize(10)
          doc.text('High/Low Flags:', 14, yPosition)
          yPosition += 7

          const flagData = report.highLowFlags.map(flag => [flag.testName, flag.value, flag.flag])

          autoTable(doc, {
            head: [['Test Name', 'Value', 'Flag']],
            body: flagData,
            startY: yPosition,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [41, 128, 185] },
            margin: { left: 14 }
          })

          yPosition = doc.lastAutoTable.finalY + 10
        }

        // Critical Results
        if (report.criticalResults.length > 0) {
          doc.setFontSize(10)
          doc.text('Critical Results:', 14, yPosition)
          yPosition += 7

          const criticalData = report.criticalResults.map(result => [result.testName, result.reason])

          autoTable(doc, {
            head: [['Test Name', 'Reason']],
            body: criticalData,
            startY: yPosition,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [41, 128, 185] },
            margin: { left: 14 }
          })

          yPosition = doc.lastAutoTable.finalY + 10
        }

        // Add space between reports
        yPosition += 10
      })

      // Save the PDF
      doc.save(`lab-reports-${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success('PDF file downloaded successfully')
    } catch (error) {
      console.error('PDF export failed:', error)
      toast.error('Failed to download PDF file')
    } finally {
      setIsPdfLoading(false)
    }
  }

  const getProgressPercentage = (progress?: ReportProgress) => {
    if (!progress) return 0
    return Math.round((progress.completedTasks / progress.totalTasks) * 100)
  }

  const renderProgressIndicator = (report: LabReport) => {
    if (!report.progress) return null

    const percentage = getProgressPercentage(report.progress)

    return (
      <Box sx={{ width: '100%', mt: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          <Box sx={{ flexGrow: 1 }}>
            <LinearProgress
              variant='determinate'
              value={percentage}
              color={percentage === 100 ? 'success' : 'primary'}
            />
          </Box>
          <Box sx={{ minWidth: 35, ml: 1 }}>
            <Typography variant='body2' color='text.secondary'>
              {`${percentage}%`}
            </Typography>
          </Box>
        </Box>
        {report.progress.pendingTasks.length > 0 && (
          <Tooltip
            title={
              <Box>
                <Typography variant='subtitle2'>Pending Tasks:</Typography>
                {report.progress.pendingTasks.map((task, index) => (
                  <Typography key={index} variant='body2'>
                    • {task}
                  </Typography>
                ))}
              </Box>
            }
          >
            <Typography variant='caption' color='text.secondary'>
              {report.progress.pendingTasks.length} tasks pending
            </Typography>
          </Tooltip>
        )}
      </Box>
    )
  }

  const sortReportsByChronology = (reports: LabReport[], settings: ChronologySettings): LabReport[] => {
    const sortedReports = [...reports].sort((a, b) => {
      let comparison = 0

      switch (settings.type) {
        case 'date':
          comparison = new Date(a.registrationDateTime).getTime() - new Date(b.registrationDateTime).getTime()
          break
        case 'testType':
          comparison = a.testPanelName.localeCompare(b.testPanelName)
          break
        case 'status':
          comparison = a.testingStatus.localeCompare(b.testingStatus)
          break
        case 'sampleId':
          comparison = a.sampleId.localeCompare(b.sampleId)
          break
      }

      return settings.order === 'asc' ? comparison : -comparison
    })

    return sortedReports
  }

  const handlePrintWithChronology = async (settings: ChronologySettings) => {
    try {
      const sortedReports = sortReportsByChronology(reports, settings)
      const doc = new jsPDF() as jsPDFWithAutoTable

      // Add title
      doc.setFontSize(16)
      doc.text('Lab Reports', 14, 15)

      // Add chronology info
      doc.setFontSize(10)
      doc.text(`Sorted by: ${settings.type} (${settings.order})`, 14, 22)
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28)

      let yPosition = 35

      // Add reports
      for (const report of sortedReports) {
        if (yPosition > 250) {
          doc.addPage()
          yPosition = 20
        }

        // Report header
        doc.setFontSize(12)
        doc.text(`Report: ${report.sampleId}`, 14, yPosition)
        yPosition += 10

        // Report details
        doc.setFontSize(10)
        const details = [
          ['Registration Date', new Date(report.registrationDateTime).toLocaleString()],
          ['Reference ID', report.referenceId],
          ['Name', report.name],
          ['Test/Panel', report.testPanelName],
          ['Status', report.testingStatus]
        ]

        autoTable(doc, {
          body: details,
          startY: yPosition,
          styles: { fontSize: 8 },
          theme: 'grid',
          margin: { left: 14 }
        })

        yPosition = (doc as any).lastAutoTable.finalY + 10

        // Sample information
        if (report.sampleInformation) {
          doc.setFontSize(10)
          doc.text('Sample Information:', 14, yPosition)
          yPosition += 7

          const sampleInfo = [
            ['Collection Date', new Date(report.sampleInformation.collectionDateTime).toLocaleString()],
            ['Collected By', report.sampleInformation.collectedBy],
            ['Sample Type', report.sampleInformation.sampleType],
            ['Test Category', report.sampleInformation.testCategory]
          ]

          autoTable(doc, {
            body: sampleInfo,
            startY: yPosition,
            styles: { fontSize: 8 },
            theme: 'grid',
            margin: { left: 14 }
          })

          yPosition = (doc as any).lastAutoTable.finalY + 10
        }

        // Add space between reports
        yPosition += 10
      }

      // Save the PDF
      doc.save(`lab-reports-${settings.type}-${settings.order}.pdf`)
      toast.success('Reports printed successfully')
      setIsChronologyDialogOpen(false)
    } catch (error) {
      console.error('Error printing reports:', error)
      toast.error('Failed to print reports')
    }
  }

  return (
    <Card>
      <CardHeader
        title='Lab Reports Dashboard'
        action={
          <div className='flex items-center gap-4'>
            <Button
              color='primary'
              variant='outlined'
              onClick={() => setIsChronologyDialogOpen(true)}
              startIcon={<i className='tabler-sort-ascending' />}
            >
              Set Chronology
            </Button>
            <Button
              variant='outlined'
              startIcon={
                isExporting ? <i className='tabler-loader animate-spin' /> : <i className='tabler-file-spreadsheet' />
              }
              onClick={handleExportCSV}
              disabled={isExporting}
            >
              {isExporting ? 'Exporting...' : 'Excel'}
            </Button>
            <Button
              variant='outlined'
              startIcon={
                isPdfLoading ? <i className='tabler-loader animate-spin' /> : <i className='tabler-file-text' />
              }
              onClick={handleExportPDF}
              disabled={isPdfLoading}
            >
              {isPdfLoading ? 'Exporting...' : 'PDF'}
            </Button>
          </div>
        }
      />
      <Divider sx={{ borderColor: '#E0E0E0', borderBottomWidth: 1, borderBottomStyle: 'solid', mb: 3 }} />
      <CardContent>
        {/* Search Requisition Input */}
        <Box sx={{ mb: 3 }}>
          <CustomTextField
            value={searchRequisition}
            onChange={e => setSearchRequisition(e.target.value)}
            placeholder='Search'
            fullWidth
            size='small'
            sx={{ borderRadius: 2, background: '#fff', maxWidth: 220 }}
            InputProps={{ sx: { borderRadius: 2 } }}
          />
        </Box>
        {/* Filters Header Row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Button
            variant='text'
            onClick={() => setIsFiltersExpanded(v => !v)}
            startIcon={<i className='tabler-filter text-sm' />}
            sx={{ fontWeight: 600, fontSize: 16, color: '#7B61FF' }}
          >
            Filters
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant='text'
              color='inherit'
              onClick={() => {
                setProjectNo(0); setStudy(''); setSampleType(''); setLocation(''); setLab(''); setStudySites([]); setTest(''); setPanel(''); setFromDate(''); setToDate(''); setEmployeeId('');
              }}
              sx={{ height: 48, color: '#7B61FF' }}
              startIcon={<i className='tabler-refresh' />}
            >
              Clear
            </Button>
          </Box>
        </Box>
        <Collapse in={isFiltersExpanded}>
          <Grid container spacing={6} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={4}>
              <CustomAutocomplete
                fullWidth
                id='project-no'
                options={projects}
                getOptionLabel={option => option.studyProtocolNumber + ' - ' + option.studyTitle}
                value={projects.find(project => project.id === projectNo) || null}
                onChange={(_, newValue) => setProjectNo(newValue?.id || 0)}
                renderInput={params => <CustomTextField {...params} placeholder='Search Project' />}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <CustomAutocomplete
                fullWidth
                id='study'
                options={studySites}
                getOptionLabel={option => `${option.siteProtocolNumber} - ${option.siteGroupName}`}
                value={studySites.find(site => site.siteNumber === study) || null}
                onChange={(_, newValue) => setStudy(newValue?.siteNumber || '')}
                renderInput={params => <CustomTextField {...params} placeholder='Search Study Site' />}
                isOptionEqualToValue={(option, value) => option.siteNumber === value.siteNumber}
                disabled={!projectNo}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <CustomTextField
                select
                fullWidth
                id='test-status'
                value={testStatus}
                onChange={e => setTestStatus(e.target.value)}
                slotProps={{ select: { displayEmpty: true } }}
              >
                <MenuItem value=''>Select Test Status</MenuItem>
                <MenuItem value='Pending'>Pending</MenuItem>
                <MenuItem value='In Progress'>In Progress</MenuItem>
                <MenuItem value='Completed'>Completed</MenuItem>
                <MenuItem value='Rejected'>Rejected</MenuItem>
              </CustomTextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <CustomTextField
                select
                fullWidth
                id='sample-type'
                value={sampleType}
                onChange={e => setSampleType(e.target.value)}
                slotProps={{ select: { displayEmpty: true } }}
              >
                <MenuItem value=''>Select Sample Type</MenuItem>
                {sampleTypes.map(type => (
                  <MenuItem key={type.sampleId} value={type.sampleType}>{type.sampleType}</MenuItem>
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
                slotProps={{ select: { displayEmpty: true } }}
              >
                <MenuItem value=''>Select Location</MenuItem>
                {locations.map(loc => (
                  <MenuItem key={loc.id} value={loc.name}>{loc.name}</MenuItem>
                ))}
              </CustomTextField>
            </Grid>
            <Grid item xs={12} sm={4}>
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
                  <MenuItem key={lab.id} value={lab.labName}>{lab.labName}</MenuItem>
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
                {tests.map(testItem => (
                  <MenuItem key={testItem.id} value={testItem.testName}>{testItem.testName}</MenuItem>
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
                {panels.map(panelItem => (
                  <MenuItem key={panelItem.id} value={panelItem.panelName}>{panelItem.panelName}</MenuItem>
                ))}
              </CustomTextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <CustomTextField
                type='date'
                fullWidth
                id='from-date'
                placeholder='From Date'
                InputLabelProps={{ shrink: false }}
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <CustomTextField
                type='date'
                fullWidth
                id='to-date'
                placeholder='To Date'
                InputLabelProps={{ shrink: false }}
                value={toDate}
                onChange={e => setToDate(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Autocomplete
                fullWidth
                id='employee-id'
                options={employees}
                getOptionLabel={option => option.employeeId + ' - ' + option.employeeName}
                value={employees.find(emp => emp.employeeId === employeeId) || null}
                onChange={(_, newValue) => setEmployeeId(newValue?.employeeId || '')}
                renderInput={params => <CustomTextField {...params} placeholder='Search Employee ID' />}
                isOptionEqualToValue={(option, value) => option.employeeId === value.employeeId}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                variant='contained'
                color='primary'
                onClick={() => {
                  setProjectNo(0); setStudy(''); setSampleType(''); setLocation(''); setLab(''); setStudySites([]); setTest(''); setPanel(''); setFromDate(''); setToDate(''); setEmployeeId('');
                }}
                fullWidth
                startIcon={<i className='tabler-search' />}
              >
                Go
              </Button>
            </Grid>
          </Grid>
        </Collapse>
        {selectedReport && (
          <>
            <TestCounts counts={selectedReport.testCounts} />
            <Typography variant='h6' sx={{ mb: 2 }}>
              Activities
            </Typography>
            <ActivityList activities={selectedReport.activities} />
          </>
        )}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Registration Date & Time</TableCell>
                <TableCell>Sample ID</TableCell>
                <TableCell>Reference ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Test/Panel</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredReports.map(report => (
                <TableRow
                  key={report.id}
                  sx={{
                    backgroundColor:
                      report.testingStatus === 'Pending'
                        ? 'rgba(255, 152, 0, 0.08)'
                        : report.testingStatus === 'Partially Completed'
                          ? 'rgba(33, 150, 243, 0.08)'
                          : 'inherit'
                  }}
                >
                  <TableCell>{new Date(report.registrationDateTime).toLocaleString()}</TableCell>
                  <TableCell>{report.sampleId}</TableCell>
                  <TableCell>{report.referenceId}</TableCell>
                  <TableCell>{report.name}</TableCell>
                  <TableCell>{report.testPanelName}</TableCell>
                  <TableCell>
                    <Chip label={report.testingStatus} color={getStatusColor(report.testingStatus)} size='small' />
                  </TableCell>
                  <TableCell>{renderProgressIndicator(report)}</TableCell>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      <IconButton size='small' onClick={() => handlePrintBarcode(report)} title='Print Barcode'>
                        <i className='tabler-barcode' />
                      </IconButton>
                      <IconButton size='small' onClick={() => handlePrintReport(report)} title='Print Report'>
                        <i className='tabler-printer' />
                      </IconButton>
                      <IconButton size='small' onClick={() => handleDownloadReport(report)} title='Download Report'>
                        <i className='tabler-download' />
                      </IconButton>
                      <Tooltip title='Show Registered Parameters & Departments' placement='top'>
                        <IconButton size='small' onClick={() => setIsDepartmentDialogOpen(true)}>
                          <i className='tabler-info-circle' />
                        </IconButton>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>

      {/* View Report Dialog */}
      <Dialog open={isViewDialogOpen} onClose={() => setIsViewDialogOpen(false)} maxWidth='lg' fullWidth>
        <DialogTitle>{selectedReport?.name}</DialogTitle>
        <DialogContent>
          <iframe
            src={selectedReport?.fileUrl}
            style={{ width: '100%', height: '80vh', border: 'none' }}
            title={selectedReport?.name}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Upload Report Dialog */}
      <Dialog
        open={isUploadDialogOpen}
        onClose={() => {
          setIsUploadDialogOpen(false)
          setUploadFile(null)
        }}
      >
        <DialogTitle>Upload New Report Version</DialogTitle>
        <DialogContent>
          <Typography variant='body2' className='mb-4'>
            Select a new version of the report to upload
          </Typography>
          <TextField
            type='file'
            fullWidth
            onChange={e => {
              const file = (e.target as HTMLInputElement).files?.[0]
              if (file) {
                setUploadFile(file)
              }
            }}
            inputProps={{
              accept: '.pdf,.doc,.docx,.xls,.xlsx'
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setIsUploadDialogOpen(false)
              setUploadFile(null)
            }}
          >
            Cancel
          </Button>
          <Button color='primary' onClick={handleUploadReport} disabled={!uploadFile}>
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* Chronology Dialog */}
      <ChronologyDialog
        open={isChronologyDialogOpen}
        onClose={() => setIsChronologyDialogOpen(false)}
        onPrint={handlePrintWithChronology}
      />

      {/* Department Dialog */}
      <Dialog open={isDepartmentDialogOpen} onClose={() => setIsDepartmentDialogOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>Registered Departments & Parameters</DialogTitle>
        <DialogContent>
          {Object.entries(
            filteredReports.reduce((acc, r) => {
              const dept = r.sampleInformation?.testCategory || ''
              if (!dept) return acc
              if (!acc[dept]) acc[dept] = []
              acc[dept].push(r.sampleInformation)
              return acc
            }, {} as Record<string, SampleInformation[]>)
          ).map(([dept, params], idx) => (
            <div key={dept} style={{ marginBottom: 32, border: '1px solid #e0e0e0', borderRadius: 6, padding: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                <Checkbox size='small' sx={{ mr: 1 }} />
                <span style={{ fontWeight: 600 }}>{dept}</span>
              </div>
              <Divider sx={{ mb: 1 }} />
              <TableContainer component={Paper} variant='outlined'>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell />
                      <TableCell>Test Name</TableCell>
                      <TableCell>Test Method</TableCell>
                      <TableCell>Unit</TableCell>
                      <TableCell>Test Result</TableCell>
                      <TableCell>Is Critical?</TableCell>
                      <TableCell>RR</TableCell>
                      <TableCell>Flag</TableCell>
                      <TableCell>Abnormal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {params.map((param, i) => (
                      <TableRow key={param.testName + i}>
                        <TableCell><Checkbox size='small' /></TableCell>
                        <TableCell>{String(param.testName)}</TableCell>
                        <TableCell>{String((param as any).testMethod || '')}</TableCell>
                        <TableCell>{String((param as any).unit || '')}</TableCell>
                        <TableCell style={{ fontWeight: 600 }}>{String((param as any).testResult || '')}</TableCell>
                        <TableCell style={{ color: String((param as any).isCritical) === 'Yes' ? 'red' : undefined }}>{String((param as any).isCritical || '-')}</TableCell>
                        <TableCell>{String((param as any).rr || '')}</TableCell>
                        <TableCell style={{ fontWeight: 600 }}>{String((param as any).flag || '')}</TableCell>
                        <TableCell>{String((param as any).abnormal || '')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
          ))}
        </DialogContent>
        <DialogActions>
          <Button variant='contained' color='primary' size='small' onClick={() => alert('Print Selected clicked')}>Print Selected</Button>
          <Button onClick={() => setIsDepartmentDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default ReportDashboard
