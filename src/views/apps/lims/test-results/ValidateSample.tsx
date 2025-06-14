'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Switch from '@mui/material/Switch'
import CustomTextField from '@core/components/mui/TextField'
import { testResultsService } from '@/app/api/apps/lims/Test-results/route'
import { toast } from 'react-toastify'
import { getLocalizedUrl } from '@/utils/i18n'
import Checkbox from '@mui/material/Checkbox'
import Paper from '@mui/material/Paper'
import OptionMenu from '@core/components/option-menu'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import type { TextFieldProps } from '@mui/material/TextField'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import { rankItem, type RankingInfo } from '@tanstack/match-sorter-utils'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import BarcodePrintDialog from '@/components/dialogs/barcode-print'
import FormControlLabel from '@mui/material/FormControlLabel'
import { FormGroup, TextField } from '@mui/material'

// Dummy data for demonstration
const dummySample = {
  laboratory: 'Central Lab',
  location: 'Building A',
  requestedBy: 'Dr. Smith',
  sampleId: 'SMP-001',
  period: 'Q1 2024',
  referenceId: 'REF-123',
  age: 29,
  projectNumber: 'PRJ-001',
  volunteerId: 'VOL-001',
  qcAcceptance: true
}

const dummyTestRows = [
  { checked: true, testName: 'HIV', result: 'Reactive', referenceRange: '10-15', remark: 'XYZ' },
  { checked: true, testName: 'HBA1c', result: '9', referenceRange: '5-6', remark: 'XYZ' },
  { checked: true, testName: 'Chloride', result: '15', referenceRange: '10-15', remark: 'XYZ' },
  { checked: false, testName: 'Glucose', result: '99', referenceRange: '80-100', remark: 'ABC' }
]

declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })
  return itemRank.passed
}

const DebouncedInput = ({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number
  onChange: (value: string | number) => void
  debounce?: number
} & Omit<TextFieldProps, 'onChange'>) => {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)

    return () => clearTimeout(timeout)
  }, [value])

  return <CustomTextField {...props} value={value} onChange={e => setValue(e.target.value)} />
}

const columnHelper = createColumnHelper<any>()

// Add status configuration
const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    color: '#FFA726', // Orange
    icon: 'tabler-clock'
  },
  validated: {
    label: 'Validated',
    color: '#66BB6A', // Green
    icon: 'tabler-check'
  },
  rejected: {
    label: 'Rejected',
    color: '#EF5350', // Red
    icon: 'tabler-x'
  },
  outsourced: {
    label: 'Outsourced',
    color: '#42A5F5', // Blue
    icon: 'tabler-external-link'
  }
} as const

interface TestRemark {
  text: string
  timestamp: string
  action: string
}

interface TestRow {
  checked: boolean
  testName: string
  result: string
  referenceRange: string
  remark: string
  remarks: string
  actionRemarks: TestRemark[]
}

interface TestAction {
  type: 'repeat' | 'recollect' | 'reject' | 'dilution' | 'hold' | 'document'
  label: string
  icon: string
  color: 'primary' | 'error' | 'warning' | 'info' | 'success' | 'secondary'
  description: string
}

const TEST_ACTIONS: TestAction[] = [
  {
    type: 'repeat',
    label: 'Repeat Test',
    icon: 'tabler-refresh',
    color: 'primary',
    description: 'This will mark the test for repetition. The test will be performed again with the same parameters.'
  },
  {
    type: 'recollect',
    label: 'Recollect Sample',
    icon: 'tabler-droplet',
    color: 'info',
    description: 'This will mark the sample for recollection. A new sample will need to be collected from the patient.'
  },
  {
    type: 'reject',
    label: 'Reject Test',
    icon: 'tabler-x',
    color: 'error',
    description: 'This will reject the test result. The test will need to be reviewed and potentially repeated.'
  },
  {
    type: 'dilution',
    label: 'Dilution Required',
    icon: 'tabler-droplet-half',
    color: 'warning',
    description: 'This will mark the test for dilution. The sample will need to be diluted before retesting.'
  },
  {
    type: 'hold',
    label: 'Hold Test',
    icon: 'tabler-pause',
    color: 'success',
    description:
      'This will put the test on hold. The test will remain in a pending state until further action is taken.'
  },
  {
    type: 'document',
    label: 'Attach Document',
    icon: 'tabler-paperclip',
    color: 'secondary',
    description: 'Upload documents related to this test result.'
  }
]

const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const ValidateSample = () => {
  const params = useParams()
  const router = useRouter()
  const sampleId = params?.id as string
  const [sample, setSample] = useState(dummySample)
  const [testRows, setTestRows] = useState<TestRow[]>(
    dummyTestRows.map(row => ({
      ...row,
      remarks: row.remark || '',
      actionRemarks: []
    }))
  )
  const [qcAcceptance, setQcAcceptance] = useState(dummySample.qcAcceptance)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnVisibility, setColumnVisibility] = useState({})
  const [columnMenuAnchor, setColumnMenuAnchor] = useState<null | HTMLElement>(null)
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false)
  const [selectedTestName, setSelectedTestName] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [isTestDetailsModalOpen, setIsTestDetailsModalOpen] = useState(false)
  const [selectedTestDetails, setSelectedTestDetails] = useState<any>(null)
  const [isLoadingTestDetails, setIsLoadingTestDetails] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | false>('testInfo')
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [approvalComment, setApprovalComment] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isSignatureValid, setIsSignatureValid] = useState(false)
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const [showSignatureError, setShowSignatureError] = useState(false)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    isOutsourced: false
  })
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false)
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null)
  const [isRemarksModalOpen, setIsRemarksModalOpen] = useState(false)
  const [selectedTestForRemarks, setSelectedTestForRemarks] = useState<any>(null)
  const [remarks, setRemarks] = useState('')
  const [isSavingRemarks, setIsSavingRemarks] = useState(false)
  const [isActionModalOpen, setIsActionModalOpen] = useState(false)
  const [selectedAction, setSelectedAction] = useState<TestAction | null>(null)
  const [selectedTestForAction, setSelectedTestForAction] = useState<any>(null)
  const [actionComment, setActionComment] = useState('')
  const [isProcessingAction, setIsProcessingAction] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [showBarcodeDialog, setShowBarcodeDialog] = useState<boolean>(false)
  const [selectedTestForBarcode, setSelectedTestForBarcode] = useState<any>(null)
  const [isAcknowledged, setIsAcknowledged] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const columns = useMemo<ColumnDef<any, any>[]>(
    () => [
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {TEST_ACTIONS.map(action => (
              <Button
                key={action.type}
                size='small'
                variant='outlined'
                color={action.color}
                onClick={() => handleActionOpen(action, row.original.testName)}
                startIcon={<i className={action.icon} />}
              >
                {action.label}
              </Button>
            ))}
          </Box>
        )
      },
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            {...{
              checked: table.getIsAllRowsSelected(),
              indeterminate: table.getIsSomeRowsSelected(),
              onChange: table.getToggleAllRowsSelectedHandler()
            }}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            {...{
              checked: row.getIsSelected(),
              disabled: !row.getCanSelect(),
              indeterminate: row.getIsSomeSelected(),
              onChange: row.getToggleSelectedHandler()
            }}
          />
        ),
        enableHiding: false
      },
      columnHelper.accessor('testName', {
        header: 'Test Name',
        cell: ({ row }) => <Typography>{row.original.testName}</Typography>
      }),
      columnHelper.accessor('result', {
        header: 'Test Result',
        cell: ({ row }) => (
          <CustomTextField
            size='small'
            fullWidth
            value={row.original.result}
            onChange={e => {
              const newTestRows = [...testRows]
              const index = newTestRows.findIndex(item => item.testName === row.original.testName)
              if (index !== -1) {
                newTestRows[index] = {
                  ...newTestRows[index],
                  result: e.target.value
                }
                setTestRows(newTestRows)
              }
            }}
          />
        )
      }),
      columnHelper.accessor('referenceRange', {
        header: 'Reference Range',
        cell: ({ row }) => <Typography>{row.original.referenceRange}</Typography>
      }),
      columnHelper.accessor('remark', {
        header: 'Report Remark',
        cell: ({ row }) => (
          <CustomTextField
            size='small'
            fullWidth
            value={row.original.remark}
            onChange={e => {
              const newTestRows = [...testRows]
              const index = newTestRows.findIndex(item => item.testName === row.original.testName)
              if (index !== -1) {
                newTestRows[index] = {
                  ...newTestRows[index],
                  remark: e.target.value
                }
                setTestRows(newTestRows)
              }
            }}
          />
        )
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status || 'pending'
          const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]

          return (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: config.color
              }}
            >
              <i className={config.icon} />
              <Typography>{config.label}</Typography>
            </Box>
          )
        }
      }),
      columnHelper.accessor('actionRemarks', {
        header: 'Action Remarks',
        cell: ({ row }) => {
          const remarks = row.original.actionRemarks || []
          return (
            <Box>
              {remarks.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {remarks.map((remark: any, index: number) => (
                    <Box
                      key={index}
                      sx={{
                        p: 1,
                        bgcolor: 'action.hover',
                        borderRadius: 1,
                        fontSize: '0.875rem'
                      }}
                    >
                      <Typography variant='body2' sx={{ mb: 0.5 }}>
                        {remark.text}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {new Date(remark.timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant='body2' color='text.secondary'>
                  No remarks
                </Typography>
              )}
            </Box>
          )
        }
      })
    ],
    []
  )

  const table = useReactTable({
    data: testRows,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    state: {
      rowSelection,
      globalFilter,
      columnVisibility
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: fuzzyFilter
  })

  const handleBackToGrid = () => {
    router.push(getLocalizedUrl('/apps/lims/test-results/list', params?.lang as string))
  }

  useEffect(() => {
    const fetchSampleData = async () => {
      try {
        setLoading(true)
        // TODO: Replace with actual API call to fetch sample data
        // const response = await testResultsService.getSampleDetails(sampleId)
        // setSample(response.result)
        // setTestRows(response.result.testRows)
        // setQcAcceptance(response.result.qcAcceptance)
      } catch (error) {
        console.error('Error fetching sample data:', error)
        toast.error('Failed to fetch sample data')
      } finally {
        setLoading(false)
      }
    }

    if (sampleId) {
      fetchSampleData()
    }
  }, [sampleId])

  // Validation helpers
  const isNumeric = (val: string) => /^\d+$/.test(val)
  const isAlphanumeric = (val: string) => /^[a-zA-Z0-9]+$/.test(val)

  // Handlers for field changes (for demonstration, not saving changes)
  const handleSwitch = () => setQcAcceptance(val => !val)

  const handleBulkAction = (action: string) => {
    const selectedRows = table.getSelectedRowModel().rows
    if (selectedRows.length === 0) {
      toast.warning('Please select at least one test')
      return
    }

    const selectedTestNames = selectedRows.map(row => row.original.testName)

    switch (action) {
      case 'Validate':
        setIsApprovalModalOpen(true)
        break
      case 'Non-Validate':
        // TODO: Implement non-validate logic
        toast.success(`Non-validated tests: ${selectedTestNames.join(', ')}`)
        break
      case 'Repeat':
        // TODO: Implement repeat logic
        toast.success(`Repeated tests: ${selectedTestNames.join(', ')}`)
        break
      case 'Dilution':
        // TODO: Implement dilution logic
        toast.success(`Diluted tests: ${selectedTestNames.join(', ')}`)
        break
      case 'Save':
        // TODO: Implement save logic
        toast.success(`Saved tests: ${selectedTestNames.join(', ')}`)
        break
      case 'Cancel':
        // TODO: Implement cancel logic
        toast.success(`Cancelled tests: ${selectedTestNames.join(', ')}`)
        break
      case 'Outsource':
        // TODO: Implement outsource logic
        toast.success(`Outsourced tests: ${selectedTestNames.join(', ')}`)
        break
      default:
        toast.error('Invalid action')
    }
  }

  const handleAction = (action: string, testName: string) => {
    switch (action) {
      case 'Repeat Test':
        // TODO: Implement repeat test logic
        toast.success(`Repeated test: ${testName}`)
        break
      case 'Print Barcode':
        // TODO: Implement print barcode logic
        toast.success(`Printed barcode for: ${testName}`)
        break
      case 'Dilute':
        // TODO: Implement dilute logic
        toast.success(`Diluted test: ${testName}`)
        break
      case 'Attach Document':
        handleDocumentUpload(testName)
        break
      case 'QC':
        // TODO: Implement QC logic
        toast.success(`QC performed for: ${testName}`)
        break
      default:
        toast.error('Invalid action')
    }
  }

  const handleTestInfoOpen = async (testName: string) => {
    try {
      setIsLoadingTestDetails(true)
      setIsTestDetailsModalOpen(true)

      // TODO: Replace with actual API call
      // const response = await testResultsService.getTestDetails(sampleId, testName)
      // setSelectedTestDetails(response.result)

      // Dummy data for demonstration
      setSelectedTestDetails({
        testInfo: {
          name: testName,
          code: 'TEST-001',
          description: 'Complete blood count test',
          category: 'Hematology',
          turnaroundTime: '24 hours',
          status: 'Active'
        },
        panelInfo: {
          name: 'Complete Blood Count Panel',
          code: 'PANEL-001',
          description: 'Standard CBC panel including WBC, RBC, and platelets',
          tests: ['WBC', 'RBC', 'HGB', 'HCT', 'PLT'],
          price: '$150.00'
        },
        instrumentInfo: {
          name: 'Sysmex XN-1000',
          model: 'XN-1000',
          serialNumber: 'SN123456',
          manufacturer: 'Sysmex Corporation',
          lastCalibration: '2024-02-15',
          nextCalibration: '2024-05-15',
          status: 'Operational'
        }
      })
    } catch (error) {
      console.error('Error fetching test details:', error)
      toast.error('Failed to fetch test details')
    } finally {
      setIsLoadingTestDetails(false)
    }
  }

  const handleRemarksOpen = (testName: string) => {
    const test = testRows.find(row => row.testName === testName)
    if (test) {
      setSelectedTestForRemarks(test)
      setRemarks('')
      setIsRemarksModalOpen(true)
    }
  }

  const handleCloseRemarksModal = () => {
    setIsRemarksModalOpen(false)
    setSelectedTestForRemarks(null)
    setRemarks('')
  }

  const handleSaveRemarks = async () => {
    if (!selectedTestForRemarks || !remarks.trim()) {
      toast.error('Please enter remarks')
      return
    }

    try {
      setIsSavingRemarks(true)

      setTestRows(prev =>
        prev.map(row => {
          if (row.testName === selectedTestForRemarks.testName) {
            return {
              ...row,
              actionRemarks: [
                ...row.actionRemarks,
                {
                  text: remarks,
                  timestamp: new Date().toISOString(),
                  action: 'Manual Remark'
                }
              ]
            }
          }
          return row
        })
      )

      toast.success('Remarks added successfully')
      handleCloseRemarksModal()
    } catch (error) {
      console.error('Error saving remarks:', error)
      toast.error('Failed to save remarks')
    } finally {
      setIsSavingRemarks(false)
    }
  }

  const handleSave = () => {
    setIsReasonModalOpen(true)
  }

  const handleCloseReasonModal = () => {
    setIsReasonModalOpen(false)
    setReason('')
  }

  const handleReasonSubmit = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason')
      return
    }

    try {
      setIsSaving(true)

      await new Promise(resolve => setTimeout(resolve, 1000))

      toast.success('Test results saved successfully')
      handleCloseReasonModal()
    } catch (error) {
      console.error('Error saving test results:', error)
      toast.error('Failed to save test results')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDocumentUpload = (testName: string) => {
    setSelectedTestName(testName)
    setIsDocumentModalOpen(true)
  }

  const handleCloseDocumentModal = () => {
    setIsDocumentModalOpen(false)
    setSelectedTestName('')
    setUploadedFiles([])
    setUploadProgress(0)
  }

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File ${file.name} exceeds maximum size of 10MB`
    }

    // Check file type
    const fileType = file.type
    if (!Object.keys(ACCEPTED_FILE_TYPES).includes(fileType)) {
      return `File ${file.name} has unsupported format. Supported formats: PDF, JPG, PNG, DOC, DOCX`
    }

    return null
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null)
    if (event.target.files) {
      const files = Array.from(event.target.files)
      const errors: string[] = []

      files.forEach(file => {
        const error = validateFile(file)
        if (error) {
          errors.push(error)
        }
      })

      if (errors.length > 0) {
        setUploadError(errors.join('\n'))
        return
      }

      setUploadedFiles(prev => [...prev, ...files])
    }
  }

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUploadSubmit = async () => {
    if (uploadedFiles.length === 0) {
      setUploadError('Please select at least one file to upload')
      return
    }

    try {
      setIsUploading(true)
      setUploadProgress(0)
      setUploadError(null)

      // Create FormData
      const formData = new FormData()
      uploadedFiles.forEach(file => {
        formData.append('files', file)
      })
      formData.append('testName', selectedTestName)
      formData.append('sampleId', sampleId)

      // TODO: Replace with actual API call
      // const response = await testResultsService.uploadTestDocuments(formData)

      // Simulate file upload progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100))
        setUploadProgress(i)
      }

      toast.success('Documents uploaded successfully')
      handleCloseDocumentModal()
    } catch (error) {
      console.error('Error uploading documents:', error)
      setUploadError('Failed to upload documents. Please try again.')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleCloseTestDetailsModal = () => {
    setIsTestDetailsModalOpen(false)
    setSelectedTestDetails(null)
  }

  const handleAccordionChange = (section: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedSection(isExpanded ? section : false)
  }

  const handleCloseApprovalModal = () => {
    setIsApprovalModalOpen(false)
    setApprovalComment('')
    setSignatureData(null)
    setIsSignatureValid(false)
    setShowSignatureError(false)
    if (canvasRef.current) {
      canvasRef.current.getContext('2d')?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
  }

  const handleApprovalSubmit = async () => {
    if (!signatureData) {
      setShowSignatureError(true)
      return
    }

    const selectedRows = table.getSelectedRowModel().rows
    const selectedTestNames = selectedRows.map(row => row.original.testName)

    try {
      setIsApproving(true)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      toast.success(`Successfully approved ${selectedTestNames.length} test(s)`)
      handleCloseApprovalModal()

      // Refresh the test results
      // await fetchSampleData()
    } catch (error) {
      console.error('Error approving test results:', error)
      toast.error('Failed to approve test results')
    } finally {
      setIsApproving(false)
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (ctx) {
      ctx.beginPath()
      ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY)
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) {
      ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY)
      ctx.stroke()
      setIsSignatureValid(true)
      setShowSignatureError(false)
      setSignatureData(canvasRef.current?.toDataURL() || null)
    }
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, canvas?.width || 0, canvas?.height || 0)
      setIsSignatureValid(false)
      setSignatureData(null)
      setShowSignatureError(false)
    }
  }

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleClearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      status: '',
      isOutsourced: false
    })
  }

  const handleFilterMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget)
    setIsFilterMenuOpen(true)
  }

  const handleFilterMenuClose = () => {
    setFilterAnchorEl(null)
    setIsFilterMenuOpen(false)
  }

  const applyFilters = () => {
    // TODO: Implement actual filtering logic
    // For now, we'll just show a toast
    toast.success('Filters applied')
    handleFilterMenuClose()
  }

  const handleActionOpen = (action: TestAction, testName: string) => {
    const test = testRows.find(row => row.testName === testName)
    if (test) {
      if (action.type === 'document') {
        // Directly open document upload dialog
        setSelectedTestName(testName)
        setIsDocumentModalOpen(true)
      } else {
        // Handle other actions through the action modal
        setSelectedAction(action)
        setSelectedTestForAction(test)
        setActionComment('')
        setIsActionModalOpen(true)
      }
    }
  }

  const handleCloseActionModal = () => {
    setIsActionModalOpen(false)
    setSelectedAction(null)
    setSelectedTestForAction(null)
    setActionComment('')
  }

  const handleProcessAction = async () => {
    if (!selectedAction || !selectedTestForAction) return

    try {
      setIsProcessingAction(true)

      // TODO: Replace with actual API call
      // await testResultsService.processTestAction(sampleId, selectedTestForAction.testName, {
      //   action: selectedAction.type,
      //   comment: actionComment,
      //   timestamp: new Date().toISOString()
      // })

      // Update local state
      setTestRows(prev =>
        prev.map(row => {
          if (row.testName === selectedTestForAction.testName) {
            return {
              ...row,
              actionRemarks: [
                ...row.actionRemarks,
                {
                  text: `Action taken: ${selectedAction.label}${actionComment ? ` - ${actionComment}` : ''}`,
                  timestamp: new Date().toISOString(),
                  action: selectedAction.type
                }
              ]
            }
          }
          return row
        })
      )

      toast.success(`Successfully processed ${selectedAction.label}`)
      handleCloseActionModal()
    } catch (error) {
      console.error('Error processing action:', error)
      toast.error('Failed to process action')
    } finally {
      setIsProcessingAction(false)
    }
  }

  const handlePrintBarcode = (testName: string) => {
    const test = testRows.find(row => row.testName === testName)
    if (test) {
      setSelectedTestForBarcode({
        id: test.testName,
        barcodeId: test.testName, // Using test name as barcode ID for now
        sampleDetails: {
          subjectId: sample.volunteerId,
          sampleType: test.testName,
          collectedOn: sample.period
        }
      })
      setShowBarcodeDialog(true)
    }
  }

  function handleReject(): void {
    throw new Error('Function not implemented.')
  }

  return (
    <Card>
      <CardHeader
        title='Validate Sample'
        action={
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant='outlined'
              color='primary'
              onClick={handleBackToGrid}
              startIcon={<i className='tabler-arrow-left' />}
            >
              Back to Grid
            </Button>
          </Box>
        }
      />
      <Divider />
      <CardContent>
        {/* Project and Sample Details */}
        <Typography variant='h6' sx={{ mb: 2 }}>
          1. Project and Sample Details
        </Typography>
        <Paper sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 0.5 }}>
                  Laboratory
                </Typography>
                <Typography variant='body1'>{sample.laboratory}</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 0.5 }}>
                  Location
                </Typography>
                <Typography variant='body1'>{sample.location}</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 0.5 }}>
                  Requested By
                </Typography>
                <Typography variant='body1'>{sample.requestedBy}</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 0.5 }}>
                  Sample ID
                </Typography>
                <Typography variant='body1'>{sample.sampleId}</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 0.5 }}>
                  Period
                </Typography>
                <Typography variant='body1'>{sample.period}</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 0.5 }}>
                  Reference ID
                </Typography>
                <Typography variant='body1'>{sample.referenceId}</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 0.5 }}>
                  Age
                </Typography>
                <Typography variant='body1'>{sample.age}</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 0.5 }}>
                  Project Number
                </Typography>
                <Typography variant='body1'>{sample.projectNumber}</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 0.5 }}>
                  Volunteer ID
                </Typography>
                <Typography variant='body1'>{sample.volunteerId}</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 0.5 }}>
                  QC Acceptance
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant='body1'>{qcAcceptance ? 'Yes' : 'No'}</Typography>
                  <Switch checked={qcAcceptance} onChange={handleSwitch} />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>
        <Divider sx={{ my: 4 }} />

        {/* Test Details Grid */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant='h6'>2. Test Details</Typography>
        </Box>

        {/* Search Box */}
        <Box sx={{ mb: 3 }}>
          <DebouncedInput
            value={globalFilter ?? ''}
            onChange={value => setGlobalFilter(String(value))}
            placeholder='Search by test name, result, or remark...'
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <i className='tabler-search' />
                </InputAdornment>
              ),
              endAdornment: globalFilter && (
                <InputAdornment position='end'>
                  <i
                    className='tabler-x cursor-pointer'
                    onClick={() => setGlobalFilter('')}
                    style={{ cursor: 'pointer' }}
                  />
                </InputAdornment>
              )
            }}
          />
        </Box>

        {/* Filter Menu */}
        <Menu
          anchorEl={filterAnchorEl}
          open={isFilterMenuOpen}
          onClose={handleFilterMenuClose}
          PaperProps={{
            sx: { width: 400, p: 2 }
          }}
        >
          <Box sx={{ mb: 3 }}>
            <Typography variant='h6' sx={{ mb: 2 }}>
              Filter Test Results
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  fullWidth
                  size='small'
                  type='date'
                  label='Start Date'
                  value={filters.startDate}
                  onChange={e => handleFilterChange('startDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  fullWidth
                  size='small'
                  type='date'
                  label='End Date'
                  value={filters.endDate}
                  onChange={e => handleFilterChange('endDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <FormControl fullWidth size='small' sx={{ mt: 2 }}>
              <InputLabel>Sample Status</InputLabel>
              <Select
                value={filters.status}
                label='Sample Status'
                onChange={e => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value=''>All</MenuItem>
                <MenuItem value='pending'>Pending</MenuItem>
                <MenuItem value='validated'>Validated</MenuItem>
                <MenuItem value='rejected'>Rejected</MenuItem>
                <MenuItem value='outsourced'>Outsourced</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Switch
                checked={filters.isOutsourced}
                onChange={e => handleFilterChange('isOutsourced', e.target.checked)}
              />
              <Typography>Show Outsourced Samples Only</Typography>
            </Box>

            <Box sx={{ mt: 3, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button variant='outlined' onClick={handleClearFilters} startIcon={<i className='tabler-x' />}>
                Clear Filters
              </Button>
              <Button variant='contained' onClick={applyFilters} startIcon={<i className='tabler-filter' />}>
                Apply Filters
              </Button>
            </Box>
          </Box>
        </Menu>

        <Paper sx={{ p: 2, mb: 4 }}>
          <Grid container spacing={2}>
            {/* Header */}
            <Grid size={{ xs: 12 }}>
              <Grid
                container
                spacing={2}
                sx={{ fontWeight: 'bold', borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}
              >
                <Grid size={{ xs: 1 }}>
                  <Typography sx={{ fontWeight: 'bold' }}>Actions</Typography>
                </Grid>
                <Grid size={{ xs: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      height: '100%',
                      minHeight: '40px'
                    }}
                  >
                    <Checkbox
                      checked={table.getIsAllRowsSelected()}
                      indeterminate={table.getIsSomeRowsSelected()}
                      onChange={table.getToggleAllRowsSelectedHandler()}
                    />
                  </Box>
                </Grid>
                <Grid size={{ xs: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography sx={{ fontWeight: 'bold' }}>Test Name</Typography>
                    <Typography
                      variant='body2'
                      sx={{
                        color: 'text.secondary',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      ({table.getSelectedRowModel().rows.length}{' '}
                      {table.getSelectedRowModel().rows.length === 1 ? 'selected' : 'selected'})
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 2 }}>Test Result</Grid>
                <Grid size={{ xs: 2 }}>Reference Range</Grid>
                <Grid size={{ xs: 2 }}>Report Remark</Grid>
              </Grid>
            </Grid>
            {/* Rows */}
            {table.getRowModel().rows.map((row, idx) => (
              <Grid size={{ xs: 12 }} key={row.id}>
                <Grid
                  container
                  spacing={2}
                  sx={{
                    py: 2,
                    borderBottom: idx !== table.getRowModel().rows.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider',
                    backgroundColor: row.getIsSelected() ? 'action.selected' : 'transparent'
                  }}
                >
                  <Grid size={{ xs: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                      <OptionMenu
                        iconButtonProps={{ size: 'small' }}
                        options={[
                          {
                            text: 'Test Information',
                            icon: 'tabler-info-circle',
                            menuItemProps: {
                              onClick: () => handleTestInfoOpen(row.original.testName),
                              className: 'text-info'
                            }
                          },
                          {
                            text: 'Test Remark',
                            icon: 'tabler-message',
                            menuItemProps: {
                              onClick: () => handleRemarksOpen(row.original.testName),
                              className: 'text-primary'
                            }
                          },
                          {
                            text: 'Repeat Test',
                            icon: 'tabler-refresh',
                            menuItemProps: {
                              onClick: () => handleActionOpen(TEST_ACTIONS[0], row.original.testName),
                              className: 'text-primary'
                            }
                          },
                          {
                            text: 'Print Barcode',
                            icon: 'tabler-printer',
                            menuItemProps: {
                              onClick: () => handlePrintBarcode(row.original.testName),
                              className: 'text-primary'
                            }
                          },
                          {
                            text: 'Dilute',
                            icon: 'tabler-droplet',
                            menuItemProps: {
                              onClick: () => handleActionOpen(TEST_ACTIONS[2], row.original.testName),
                              className: 'text-info'
                            }
                          },
                          {
                            text: 'Attach Document',
                            icon: 'tabler-paperclip',
                            menuItemProps: {
                              onClick: () => handleActionOpen(TEST_ACTIONS[5], row.original.testName),
                              className: 'text-success'
                            }
                          },
                          {
                            text: 'QC',
                            icon: 'tabler-check',
                            menuItemProps: {
                              onClick: () => handleActionOpen(TEST_ACTIONS[4], row.original.testName),
                              className: 'text-warning'
                            }
                          }
                        ]}
                      />
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 1 }}>
                    <Checkbox checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />
                  </Grid>
                  <Grid size={{ xs: 2 }}>
                    <Typography>{row.original.testName}</Typography>
                  </Grid>
                  <Grid size={{ xs: 2 }}>
                    <CustomTextField
                      size='small'
                      fullWidth
                      value={row.original.result}
                      onChange={e => {
                        const newTestRows = [...testRows]
                        const index = newTestRows.findIndex(item => item.testName === row.original.testName)
                        if (index !== -1) {
                          newTestRows[index] = {
                            ...newTestRows[index],
                            result: e.target.value
                          }
                          setTestRows(newTestRows)
                        }
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 2 }}>
                    <Typography>{row.original.referenceRange}</Typography>
                  </Grid>
                  <Grid size={{ xs: 2 }}>
                    <CustomTextField
                      size='small'
                      fullWidth
                      value={row.original.remark}
                      onChange={e => {
                        const newTestRows = [...testRows]
                        const index = newTestRows.findIndex(item => item.testName === row.original.testName)
                        if (index !== -1) {
                          newTestRows[index] = {
                            ...newTestRows[index],
                            remark: e.target.value
                          }
                          setTestRows(newTestRows)
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Bulk Actions */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            flexWrap: 'wrap',
            justifyContent: 'center',
            mt: 4,
            opacity: table.getSelectedRowModel().rows.length > 0 ? 1 : 0.5,
            pointerEvents: table.getSelectedRowModel().rows.length > 0 ? 'auto' : 'none'
          }}
        >
          <Button
            variant='outlined'
            color='primary'
            onClick={() => handleBulkAction('Validate')}
            startIcon={<i className='tabler-check' />}
          >
            Validate
          </Button>
          <Button
            variant='outlined'
            color='primary'
            onClick={() => handleBulkAction('Non-Validate')}
            startIcon={<i className='tabler-x' />}
          >
            Non-Validate
          </Button>
          <Button
            variant='outlined'
            color='primary'
            onClick={() => handleBulkAction('Repeat')}
            startIcon={<i className='tabler-refresh' />}
          >
            Repeat
          </Button>
          <Button
            variant='outlined'
            color='primary'
            onClick={() => handleBulkAction('Dilution')}
            startIcon={<i className='tabler-droplet' />}
          >
            Dilution
          </Button>
          <Button
            variant='outlined'
            color='primary'
            onClick={() => handleBulkAction('Save')}
            startIcon={<i className='tabler-device-floppy' />}
          >
            Save
          </Button>
          <Button
            variant='outlined'
            color='primary'
            onClick={() => handleBulkAction('Outsource')}
            startIcon={<i className='tabler-external-link' />}
          >
            Outsource
          </Button>
        </Box>
      </CardContent>

      {/* Reason Dialog */}
      <Dialog
        open={isReasonModalOpen}
        onClose={handleCloseReasonModal}
        aria-labelledby='reason-dialog-title'
        aria-describedby='reason-dialog-description'
      >
        <DialogTitle id='reason-dialog-title'>Save Changes</DialogTitle>
        <DialogContent>
          <CustomTextField
            fullWidth
            multiline
            rows={3}
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder='Enter reason for changes...'
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReasonModal}>Cancel</Button>
          <Button onClick={handleReasonSubmit} color='primary' disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Document Upload Dialog */}
      <Dialog open={isDocumentModalOpen} onClose={handleCloseDocumentModal} maxWidth='md' fullWidth>
        <DialogTitle>Upload Documents for {selectedTestName}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <input
              type='file'
              multiple
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id='document-upload'
              accept={Object.entries(ACCEPTED_FILE_TYPES)
                .map(([mimeType, extensions]) => [...extensions, mimeType].join(','))
                .join(',')}
            />
            <label htmlFor='document-upload'>
              <Button variant='outlined' component='span' startIcon={<i className='tabler-upload' />} sx={{ mb: 2 }}>
                Select Files
              </Button>
            </label>

            <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 2 }}>
              Supported formats: PDF, JPG, PNG, DOC, DOCX (Max size: 10MB per file)
            </Typography>

            {uploadError && (
              <Typography color='error' sx={{ mb: 2, whiteSpace: 'pre-line' }}>
                {uploadError}
              </Typography>
            )}

            {uploadedFiles.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant='subtitle2' sx={{ mb: 1 }}>
                  Selected Files:
                </Typography>
                {uploadedFiles.map((file, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <i className={`tabler-file-${file.type.includes('pdf') ? 'pdf' : 'text'}`} />
                      <Typography variant='body2'>
                        {file.name} ({(file.size / 1024).toFixed(2)} KB)
                      </Typography>
                    </Box>
                    <IconButton size='small' onClick={() => handleRemoveFile(index)} color='error'>
                      <i className='tabler-x' />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}

            {isUploading && (
              <Box sx={{ mt: 2 }}>
                <Typography variant='body2' sx={{ mb: 1 }}>
                  Uploading... {uploadProgress}%
                </Typography>
                <Box
                  sx={{
                    width: '100%',
                    height: 4,
                    bgcolor: 'action.hover',
                    borderRadius: 2,
                    overflow: 'hidden'
                  }}
                >
                  <Box
                    sx={{
                      width: `${uploadProgress}%`,
                      height: '100%',
                      bgcolor: 'primary.main',
                      transition: 'width 0.3s ease-in-out'
                    }}
                  />
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDocumentModal}>Cancel</Button>
          <Button onClick={handleUploadSubmit} color='primary' disabled={isUploading || uploadedFiles.length === 0}>
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Test Details Dialog */}
      <Dialog open={isTestDetailsModalOpen} onClose={handleCloseTestDetailsModal} maxWidth='md' fullWidth>
        <DialogTitle>
          <Box>
            <Typography variant='h5' component='div'>
              Test Details
            </Typography>
            {selectedTestDetails?.testInfo?.name && (
              <Typography variant='subtitle1' color='text.secondary' component='div'>
                {selectedTestDetails.testInfo.name}
              </Typography>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {isLoadingTestDetails ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <i className='tabler-loader animate-spin' style={{ fontSize: '2rem' }} />
            </Box>
          ) : selectedTestDetails ? (
            <Box sx={{ mt: 2 }}>
              {/* Test Information Accordion */}
              <Accordion
                expanded={expandedSection === 'testInfo'}
                onChange={handleAccordionChange('testInfo')}
                sx={{ mb: 2 }}
              >
                <AccordionSummary
                  expandIcon={<i className='tabler-chevron-down' />}
                  aria-controls='test-info-content'
                  id='test-info-header'
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <i className='tabler-microscope' />
                    <Typography variant='h6'>Test Information</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <CustomTextField fullWidth label='Test Code' value={selectedTestDetails.testInfo.code} disabled />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <CustomTextField
                        fullWidth
                        label='Category'
                        value={selectedTestDetails.testInfo.category}
                        disabled
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <CustomTextField
                        fullWidth
                        label='Description'
                        value={selectedTestDetails.testInfo.description}
                        multiline
                        rows={2}
                        disabled
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <CustomTextField
                        fullWidth
                        label='Turnaround Time'
                        value={selectedTestDetails.testInfo.turnaroundTime}
                        disabled
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <CustomTextField fullWidth label='Status' value={selectedTestDetails.testInfo.status} disabled />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* Panel Information Accordion */}
              <Accordion
                expanded={expandedSection === 'panelInfo'}
                onChange={handleAccordionChange('panelInfo')}
                sx={{ mb: 2 }}
              >
                <AccordionSummary
                  expandIcon={<i className='tabler-chevron-down' />}
                  aria-controls='panel-info-content'
                  id='panel-info-header'
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <i className='tabler-clipboard-list' />
                    <Typography variant='h6'>Panel Information</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <CustomTextField
                        fullWidth
                        label='Panel Name'
                        value={selectedTestDetails.panelInfo.name}
                        disabled
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <CustomTextField
                        fullWidth
                        label='Panel Code'
                        value={selectedTestDetails.panelInfo.code}
                        disabled
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <CustomTextField
                        fullWidth
                        label='Description'
                        value={selectedTestDetails.panelInfo.description}
                        multiline
                        rows={2}
                        disabled
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <CustomTextField
                        fullWidth
                        label='Included Tests'
                        value={selectedTestDetails.panelInfo.tests.join(', ')}
                        disabled
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <CustomTextField fullWidth label='Price' value={selectedTestDetails.panelInfo.price} disabled />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* Instrument Information Accordion */}
              <Accordion
                expanded={expandedSection === 'instrumentInfo'}
                onChange={handleAccordionChange('instrumentInfo')}
              >
                <AccordionSummary
                  expandIcon={<i className='tabler-chevron-down' />}
                  aria-controls='instrument-info-content'
                  id='instrument-info-header'
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <i className='tabler-device-analytics' />
                    <Typography variant='h6'>Instrument Information</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <CustomTextField
                        fullWidth
                        label='Instrument Name'
                        value={selectedTestDetails.instrumentInfo.name}
                        disabled
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <CustomTextField
                        fullWidth
                        label='Model'
                        value={selectedTestDetails.instrumentInfo.model}
                        disabled
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <CustomTextField
                        fullWidth
                        label='Serial Number'
                        value={selectedTestDetails.instrumentInfo.serialNumber}
                        disabled
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <CustomTextField
                        fullWidth
                        label='Manufacturer'
                        value={selectedTestDetails.instrumentInfo.manufacturer}
                        disabled
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <CustomTextField
                        fullWidth
                        label='Last Calibration'
                        value={selectedTestDetails.instrumentInfo.lastCalibration}
                        disabled
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <CustomTextField
                        fullWidth
                        label='Next Calibration'
                        value={selectedTestDetails.instrumentInfo.nextCalibration}
                        disabled
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <CustomTextField
                        fullWidth
                        label='Status'
                        value={selectedTestDetails.instrumentInfo.status}
                        disabled
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Box>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color='text.secondary'>No test details available</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTestDetailsModal}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Approval Confirmation Dialog */}
      <Dialog open={isApprovalModalOpen} onClose={handleCloseApprovalModal} maxWidth='xs' fullWidth>
        <DialogTitle>Test Result Declaration</DialogTitle>

        <DialogContent dividers>
          <FormGroup sx={{ mb: 2 }}>
            <FormControlLabel
              control={<Checkbox checked={isAcknowledged} onChange={e => setIsAcknowledged(e.target.checked)} />}
              label='I confirm that the details are accurate and approve the digital authorization of this result.'
            />
          </FormGroup>

          <TextField
            fullWidth
            label='User Name'
            value={username}
            onChange={e => setUsername(e.target.value)}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label='Password'
            type='password'
            value={password}
            onChange={e => setPassword(e.target.value)}
            sx={{ mb: 3 }}
          />

          <Box display='flex' justifyContent='center' mb={2}>
            <img src='/images/tick-ico-image.png' alt='Digital Signature' height={50} />
          </Box>

          <Typography variant='caption' color='text.secondary'>
            Please provide your credentials to authorize the result. Your signature will be recorded digitally.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'center' }}>
          <Button variant='contained' color='error' onClick={handleReject}>
            Reject
          </Button>
          <Button variant='contained' color='success' onClick={handleCloseApprovalModal}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Remarks Dialog */}
      <Dialog open={isRemarksModalOpen} onClose={handleCloseRemarksModal} maxWidth='sm' fullWidth>
        <DialogTitle>
          Add Remarks
          {selectedTestForRemarks && (
            <Typography variant='subtitle1' color='text.secondary'>
              {selectedTestForRemarks.testName}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <CustomTextField
              fullWidth
              multiline
              rows={4}
              label='Remarks'
              placeholder='Enter your remarks here...'
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              sx={{ mb: 2 }}
            />

            {selectedTestForRemarks?.actionRemarks?.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant='subtitle2' sx={{ mb: 1 }}>
                  Previous Remarks
                </Typography>
                <Box
                  sx={{
                    maxHeight: '200px',
                    overflowY: 'auto',
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                    p: 2
                  }}
                >
                  {selectedTestForRemarks.actionRemarks.map((remark: any, index: number) => (
                    <Box
                      key={index}
                      sx={{
                        p: 1,
                        mb: 1,
                        bgcolor: 'background.paper',
                        borderRadius: 1,
                        '&:last-child': { mb: 0 }
                      }}
                    >
                      <Typography variant='body2' sx={{ mb: 0.5 }}>
                        {remark.text}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {new Date(remark.timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRemarksModal} disabled={isSavingRemarks}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveRemarks}
            color='primary'
            variant='contained'
            disabled={isSavingRemarks || !remarks.trim()}
            startIcon={
              isSavingRemarks ? <i className='tabler-loader animate-spin' /> : <i className='tabler-device-floppy' />
            }
          >
            {isSavingRemarks ? 'Saving...' : 'Save Remarks'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <Dialog open={isActionModalOpen} onClose={handleCloseActionModal} maxWidth='sm' fullWidth>
        <DialogTitle>
          Confirm Action
          {selectedAction && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <i className={selectedAction.icon} style={{ color: `var(--mui-palette-${selectedAction.color}-main)` }} />
              <Typography variant='subtitle1'>{selectedAction.label}</Typography>
            </Box>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {selectedTestForAction && (
              <Typography variant='body1' sx={{ mb: 2 }}>
                Test: {selectedTestForAction.testName}
              </Typography>
            )}

            <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
              {selectedAction?.description}
            </Typography>

            <CustomTextField
              fullWidth
              multiline
              rows={3}
              label='Action Comment'
              placeholder='Enter any additional comments or notes...'
              value={actionComment}
              onChange={e => setActionComment(e.target.value)}
            />

            <Typography variant='caption' color='text.secondary' sx={{ mt: 2, display: 'block' }}>
              This action will be recorded in the test history and may require additional steps to complete.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseActionModal} disabled={isProcessingAction}>
            Cancel
          </Button>
          <Button
            onClick={handleProcessAction}
            color={selectedAction?.color || 'primary'}
            variant='contained'
            disabled={isProcessingAction}
            startIcon={
              isProcessingAction ? <i className='tabler-loader animate-spin' /> : <i className={selectedAction?.icon} />
            }
          >
            {isProcessingAction ? 'Processing...' : 'Confirm Action'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Barcode Print Dialog */}
      <BarcodePrintDialog
        open={showBarcodeDialog}
        setOpen={setShowBarcodeDialog}
        sampleId={selectedTestForBarcode?.id}
        barcodeId={selectedTestForBarcode?.barcodeId}
      />
    </Card>
  )
}

export default ValidateSample
