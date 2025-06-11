'use client'

// React Imports
import { useEffect, useMemo, useState, useRef } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Checkbox from '@mui/material/Checkbox'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Switch from '@mui/material/Switch'
import MenuItem from '@mui/material/MenuItem'
import TablePagination from '@mui/material/TablePagination'
import Typography from '@mui/material/Typography'
import type { TextFieldProps } from '@mui/material/TextField'
import Menu from '@mui/material/Menu'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import LinearProgress from '@mui/material/LinearProgress'

// Third-party Imports
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
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
import type { RankingInfo } from '@tanstack/match-sorter-utils'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Type Imports
import type { ThemeColor } from '@core/types'
import type { Locale } from '@configs/i18n'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'
import CustomTextField from '@core/components/mui/TextField'
import OptionMenu from '@core/components/option-menu'
import TableFilters from './TableFilters'
import BarcodePrintDialog from '@/components/dialogs/barcode-print/index'
import RemarkDialog from '@/components/dialogs/remark-dialog/index'
import ConfirmDialog from '@/components/dialogs/ConfirmDialog/ConfirmDialog'
import SampleDetailsDialog from '@/components/dialogs/sample-details-dialog'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'
import { formatDate  } from '@/utils/dateUtils'
// Style Imports
import tableStyles from '@core/styles/table.module.css'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import { toast } from 'react-toastify'

declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

export type SampleType = {
  id: number
  subjectId?: string
  scrBarcodeId?: number
  barcodeId?: string
  sampleTypeId?: number
  sampleType?: string
  noOfPrint?: number
  collectedBy?: number
  collectedByName?: string
  collectedOn?: string
  sentBy?: number
  sentByName?: string
  sentOn?: string
  receivedBy?: number
  receivedOn?: string
  isFromExisting?: string
  modifyBy?: string
  modifyOn: string
  activeFlag: string
  receivedByName?: string
  timeZoneId?: number
  facilityId?: number
  projectNo?: string
  study?: string
  receiveStatus?: string
  location?: string
  referenceId?: string
  lab?: string
  statusId?: number
  remarks?: string
  labName?: string
  studyProtocol?: string
  VolunteerName?: string
}

type SampleWithActionsType = SampleType & {
  actions?: string
}

type SampleStatusType = {
  [key: string]: {
    title: string
    color: ThemeColor
  }
}

type StatusKey = 'null' | 1 | 2 | 3 | 4 | 5 | 6;
type StatusMapType = Record<StatusKey, { label: string; color: 'warning' | 'success' | 'error' | 'info' | 'secondary' }>;

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


const statusMap: StatusMapType = {
  'null': { label: 'Pending', color: 'warning' },
  1: { label: 'Received', color: 'success' },
  2: { label: 'Rejected', color: 'error' },
  3: { label: 'Pending', color: 'warning' },
  4: { label: 'In Progress', color: 'warning' },
  5: { label: 'Completed', color: 'info' },
  6: { label: 'Outsourced', color: 'secondary' }
}

// Add color legend component
const ColorLegend = () => (
  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ width: 16, height: 16, bgcolor: 'success.main', borderRadius: 1 }} />
      <Typography variant="body2">Received</Typography>
    </Box>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ width: 16, height: 16, bgcolor: 'error.main', borderRadius: 1 }} />
      <Typography variant="body2">Rejected</Typography>
    </Box>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ width: 16, height: 16, bgcolor: 'warning.main', borderRadius: 1 }} />
      <Typography variant="body2">Pending</Typography>
    </Box>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ width: 16, height: 16, bgcolor: 'secondary.main', borderRadius: 1 }} />
      <Typography variant="body2">Outsourced</Typography>
    </Box>
  </Box>
)

const columnHelper = createColumnHelper<SampleWithActionsType>()

type Props = {
  sampleData?: SampleType[]
  onDataChange?: () => void
}

const SampleReceivedTable = ({ sampleData = [], onDataChange }: Props) => {
  const router = useRouter()
  const { lang: locale } = useParams()
  const [rowSelection, setRowSelection] = useState({})
  const initialData = Array.isArray(sampleData) ? sampleData : []
  const [data, setData] = useState<SampleType[]>(initialData)
  const [filteredData, setFilteredData] = useState<SampleType[]>(initialData)
  const [globalFilter, setGlobalFilter] = useState('')
  const [isPdfLoading, setIsPdfLoading] = useState(false)
  const [isExcelLoading, setIsExcelLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showBarcodeDialog, setShowBarcodeDialog] = useState<boolean>(false)
  const [selectedSample, setSelectedSample] = useState<SampleType | null>(null)
  const [columnVisibility, setColumnVisibility] = useState({})
  const [columnMenuAnchor, setColumnMenuAnchor] = useState<null | HTMLElement>(null)
  const [showRemarkDialog, setShowRemarkDialog] = useState<boolean>(false)
  const [selectedSampleForRemark, setSelectedSampleForRemark] = useState<SampleType | null>(null)
  const [showBarcodeScanDialog, setShowBarcodeScanDialog] = useState(false)
  const [barcodeInput, setBarcodeInput] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [highlightedSampleId, setHighlightedSampleId] = useState<number | null>(null)
  const barcodeInputRef = useRef<HTMLInputElement>(null)
  const [showOutsourceConfirm, setShowOutsourceConfirm] = useState(false)
  const [selectedSamplesForOutsource, setSelectedSamplesForOutsource] = useState<number[]>([])
  const [showReceiveConfirm, setShowReceiveConfirm] = useState(false)
  const [selectedSampleForReceive, setSelectedSampleForReceive] = useState<SampleType | null>(null)
  const [showRejectConfirm, setShowRejectConfirm] = useState(false)
  const [selectedSampleForReject, setSelectedSampleForReject] = useState<SampleType | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showBulkReceiveConfirm, setShowBulkReceiveConfirm] = useState(false)
  const [selectedSamplesForReceive, setSelectedSamplesForReceive] = useState<number[]>([])
  const [showBulkRejectConfirm, setShowBulkRejectConfirm] = useState(false)
  const [selectedSamplesForReject, setSelectedSamplesForReject] = useState<number[]>([])
  const [bulkRejectReason, setBulkRejectReason] = useState('')
  const [showBulkCentrifugeConfirm, setShowBulkCentrifugeConfirm] = useState(false)
  const [selectedSamplesForCentrifuge, setSelectedSamplesForCentrifuge] = useState<number[]>([])
  const [showSampleDetails, setShowSampleDetails] = useState(false)
  const [selectedSampleForDetails, setSelectedSampleForDetails] = useState<SampleType | null>(null)
  const [showAuditTrail, setShowAuditTrail] = useState(false)
  const [selectedSampleForAudit, setSelectedSampleForAudit] = useState<number | null>(null)
  const [isBulkOperationLoading, setIsBulkOperationLoading] = useState(false)
  const [bulkOperationProgress, setBulkOperationProgress] = useState(0)
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false)

  // Add effect to update data when props change
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        if (Array.isArray(sampleData)) {
          setData(sampleData)
          setFilteredData(sampleData)
        }
      } catch (error) {
        toast.error('Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [sampleData])

  // Add effect to log when data changes
  useEffect(() => {
    console.log('Current data state:', data)
    console.log('Current filteredData state:', filteredData)
  }, [data, filteredData])

  const columns = useMemo<ColumnDef<SampleWithActionsType, any>[]>(
    () => [
       columnHelper.accessor('actions', {
        header: 'Actions',
        enableHiding: false,
        cell: ({ row }) => (
          <div className='flex items-center'>
            <OptionMenu
              iconButtonProps={{ size: 'medium' }}
              iconClassName='text-textSecondary'
              options={[
                {
                  text: 'Receive',
                  icon: 'tabler-check',
                  menuItemProps: {
                    onClick: () => handleManualReceive(row.original),
                    className: 'text-success',
                    disabled: !row.original.barcodeId // Disable if not scanned
                  }
                },
                {
                  text: 'Reject',
                  icon: 'tabler-x',
                  menuItemProps: {
                    onClick: () => handleSampleReject(row.original.id),
                    className: 'text-error'
                  }
                },
                {
                  text: 'Print Barcode',
                  icon: 'tabler-printer',
                  menuItemProps: {
                    onClick: () => handlePrintBarcode(row.original.id),
                    className: 'text-primary'
                  }
                },
                {
                  text: 'Sample Detail',
                  icon: 'tabler-eye',
                  menuItemProps: {
                    onClick: () => {
                      setSelectedSampleForDetails(row.original)
                      setShowSampleDetails(true)
                    },
                    className: 'text-info'
                  }
                },
                {
                  text: 'Outsource Sample',
                  icon: 'tabler-external-link',
                  menuItemProps: {
                    onClick: () => handleOutsourceSample(row.original.id),
                    className: 'text-warning'
                  }
                },
                {
                  text: 'Remarks',
                  icon: 'tabler-message',
                  menuItemProps: {
                    onClick: () => handleRemarks(row.original.id),
                    className: `text-${row.original.remarks ? 'error' : 'secondary'}`
                  }
                },
                {
                  text: 'Audit Trail',
                  icon: 'tabler-history',
                  menuItemProps: {
                    onClick: () => handleAuditTrail(row.original.id),
                    className: 'text-info'
                  }
                }
              ]}
            />
          </div>
        ),
        enableSorting: false
      }),
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
      columnHelper.accessor('subjectId', {
        header: 'Volunteer ID ',
        enableHiding: true,
        cell: ({ row }) => <Typography>{row.original.subjectId || '-'}</Typography>
      }),
      columnHelper.accessor('barcodeId', {
        header: 'Barcode ID',
        enableHiding: true,
        cell: ({ row }: { row: { original: SampleWithActionsType } }) => <Typography>{row.original.barcodeId || '-'}</Typography>
      }),
      columnHelper.accessor('labName', {
        header: 'Lab Name',
        enableHiding: true,
        cell: ({ row }) => <Typography>{row.original.labName || '-'}</Typography>
      }),
      columnHelper.accessor('statusId', {
        header: 'Status',
        enableHiding: true,
        cell: ({ row }) => {
          const statusId = row.original.statusId;
          const statusInfo = (statusId === null ? statusMap.null : statusMap[statusId as keyof StatusMapType]) || { label: 'Unknown', color: 'default' as const };
          return (
            <Chip
              label={statusInfo.label}
              variant='tonal'
              color={statusInfo.color}
              size='small'
            />
          );
        }
      }),
      columnHelper.accessor('sampleType', {
        header: 'Sample Type',
        enableHiding: true,
        cell: ({ row }) => <Typography>{row.original.sampleType || '-'}</Typography>
      }),
      columnHelper.accessor('collectedByName', {
        header: 'Collected By',
        enableHiding: true,
        cell: ({ row }) => <Typography>{row.original.collectedByName || '-'}</Typography>
      }),
      columnHelper.accessor('collectedOn', {
        header: 'Collected On',
        enableHiding: true,
        cell: ({ row }) => <Typography>{formatDate(row.original.collectedOn)}</Typography>
      }),
      columnHelper.accessor('sentByName', {
        header: 'Sent By',
        enableHiding: true,
        cell: ({ row }) => <Typography>{row.original.sentByName || '-'}</Typography>
      }),
      columnHelper.accessor('sentOn', {
        header: 'Sent On',
        enableHiding: true,
        cell: ({ row }) => <Typography>{formatDate(row.original.sentOn)}</Typography>
      }),
      columnHelper.accessor('receivedByName', {
        header: 'Received By',
        enableHiding: true,
        cell: ({ row }) => <Typography>{row.original.receivedByName || '-'}</Typography>
      }),
      columnHelper.accessor('receivedOn', {
        header: 'Received On',
        enableHiding: true,
        cell: ({ row }) => <Typography>{formatDate(row.original.receivedOn)}</Typography>
      }),
      
      
    ],
    []
  )

  const table = useReactTable({
    data: filteredData || [],
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

  const handleSampleReceive = async (id: number) => {
    try {
      const response = await fetch('/api/apps/lims/Sample-received?action=status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: [id], statusId: 1 })
      });
      
      if (!response.ok) {
        throw new Error('Failed to receive sample');
      }
      
      toast.success('Sample received successfully');
      // Refresh the data
      const dataResponse = await fetch('/api/apps/lims/Sample-received');
      const data = await dataResponse.json();
      setData(data);
      setFilteredData(data);
    } catch (error) {
      console.error('Error receiving sample:', error);
      toast.error('Failed to receive sample');
    }
  }

  const handleSampleReject = (id: number) => {
    const sample = data.find(item => item.id === id)
    if (sample) {
      setSelectedSampleForReject(sample)
      setShowRejectConfirm(true)
    }
  }

  const handleRejectConfirm = async () => {
    if (!selectedSampleForReject || !rejectReason.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch('/api/apps/lims/Sample-received?action=status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          ids: [selectedSampleForReject.id], 
          statusId: 2, 
          reason: rejectReason 
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to reject sample');
      }
      
      toast.success('Sample rejected successfully')
      const dataResponse = await fetch('/api/apps/lims/Sample-received')
      const data = await dataResponse.json()
      setData(data)
      setFilteredData(data)
    } catch (error) {
      console.error('Error rejecting sample:', error)
      toast.error('Failed to reject sample')
    } finally {
      setShowRejectConfirm(false)
      setSelectedSampleForReject(null)
      setRejectReason('')
      setIsLoading(false)
    }
  }

  const handlePrintBarcode = async (id: number) => {
    const sample = filteredData.find(item => item.id === id)
    if (!sample) {
      toast.error('Sample not found')
      return
    }

    if (!sample.barcodeId) {
      toast.error('No barcode ID available for this sample')
      return
    }

    setSelectedSample(sample)
    setShowBarcodeDialog(true)
  }

  const handleBulkPrintBarcode = async () => {
    const selectedIds = Object.keys(rowSelection).map(key => filteredData[parseInt(key)].id)
    if (selectedIds.length === 0) {
      toast.error('No samples selected')
      return
    }

    const selectedSamples = filteredData.filter(item => selectedIds.includes(item.id))
    if (selectedSamples.length === 0) {
      toast.error('Selected samples not found')
      return
    }

    // Check if any sample is missing barcode ID
    const sampleWithoutBarcode = selectedSamples.find(sample => !sample.barcodeId)
    if (sampleWithoutBarcode) {
      toast.error(`Sample ${sampleWithoutBarcode.id} has no barcode ID`)
      return
    }

    setSelectedSample(selectedSamples[0]) // Keep first sample for backward compatibility
    setShowBarcodeDialog(true)
  }

  const handleOutsourceSample = async (id: number) => {
    setSelectedSamplesForOutsource([id])
    setShowOutsourceConfirm(true)
  }

  const handleBulkOutsource = () => {
    const selectedIds = Object.keys(rowSelection).map(key => filteredData[parseInt(key)].id)
    setSelectedSamplesForOutsource(selectedIds)
    setShowOutsourceConfirm(true)
  }

  const handleOutsourceConfirm = async () => {
    try {
      setIsBulkOperationLoading(true)
      setBulkOperationProgress(0)
      
      const totalSamples = selectedSamplesForOutsource.length
      let processedSamples = 0
      
      await Promise.all(
        selectedSamplesForOutsource.map(async (id) => {
          try {
            const response = await fetch('/api/apps/lims/Sample-received?action=status', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ ids: [id], statusId: 6 })
            });

            if (!response.ok) {
              throw new Error('Failed to outsource sample');
            }

            processedSamples++
            setBulkOperationProgress((processedSamples / totalSamples) * 100)
          } catch (error) {
            console.error(`Error outsourcing sample ${id}:`, error)
          }
        })
      )
      
      toast.success('Samples outsourced successfully')
      const response = await fetch('/api/apps/lims/Sample-received')
      const newData = await response.json()
      setData(newData)
      setFilteredData(newData)
    } catch (error) {
      console.error('Error outsourcing samples:', error)
      toast.error('Failed to outsource some samples. Please check the audit trail for details.')
    } finally {
      setShowOutsourceConfirm(false)
      setSelectedSamplesForOutsource([])
      setIsBulkOperationLoading(false)
      setBulkOperationProgress(0)
    }
  }

  const handleRemarks = (id: number) => {
    const sample = data.find(item => item.id === id)
    if (sample) {
      setSelectedSampleForRemark(sample)
      setShowRemarkDialog(true)
    }
  }

  const handleRemarkSuccess = async () => {
    // Refresh the data
    const response = await fetch('/api/apps/lims/Sample-received')
    const data = await response.json()
    setData(data)
    setFilteredData(data)
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const response = await fetch('/api/apps/lims/Sample-received?action=download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileType: 'CSV' })
      });

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Sample_Received_${new Date().toISOString().replace(/[:.]/g, '_')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('CSV file downloaded successfully');
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to download CSV file');
    } finally {
      setIsExporting(false)
    }
  }

  const handlePdfExport = async () => {
    setIsPdfLoading(true)
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(16);
      doc.text('Sample Received List', 14, 15);
      
      // Add date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

      // Prepare table data
      const tableData = data.map(sample => [
        sample.subjectId || '-',
        sample.barcodeId || '-',
        sample.labName || '-',
        sample.statusId ? statusMap[sample.statusId as keyof StatusMapType].label : 'Pending',
        sample.sampleType || '-',
        sample.collectedByName || '-',
        formatDate(sample.collectedOn),
        sample.sentByName || '-',
        formatDate(sample.sentOn),
        sample.receivedByName || '-',
        sample.receivedOn ? formatDate(sample.receivedOn) : '-',
        sample.receiveStatus || '-',
        sample.location || '-',
        sample.labName || '-',
        sample.studyProtocol || '-',
        sample.VolunteerName || '-'
      ]);

      // Add table using autoTable
      autoTable(doc, {
        head: [['Volunteer ID', 'Barcode ID', 'Lab Name', 'Status', 'Sample Type', 'Collected By', 'Collected On', 'Sent By', 'Sent On', 'Received By', 'Received On']],
        body: tableData,
        startY: 30,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 30 }
      });

      // Save the PDF
      doc.save(`sample-received-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF file downloaded successfully');
    } catch (error) {
      console.error('PDF export failed:', error);
      toast.error('Failed to download PDF file');
    } finally {
      setIsPdfLoading(false)
    }
  }

  // const handleExcelExport = async () => {
  //   setIsExcelLoading(true)
  //   try {
  //     const response = await fetch('/api/apps/lims/Sample-received/export/excel', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ data: filteredData }),
  //     })

  //     if (!response.ok) {
  //       throw new Error('Failed to generate Excel')
  //     }

  //     const blob = await response.blob()
  //     const url = window.URL.createObjectURL(blob)
  //     const link = document.createElement('a')
  //     link.href = url
  //     link.setAttribute('download', `sample-received-${new Date().toISOString()}.xlsx`)
  //     document.body.appendChild(link)
  //     link.click()
  //     link.remove()
  //     window.URL.revokeObjectURL(url)
  //     toast.success('Excel exported successfully')
  //   } catch (error) {
  //     console.error('Error exporting Excel:', error)
  //     toast.error('Failed to export Excel')
  //   } finally {
  //     setIsExcelLoading(false)
  //   }
  // }

  // Add barcode scanning handler
  const handleBarcodeSubmit = async () => {
    if (!barcodeInput) return

    try {
      setIsScanning(true)
      // Find the sample with matching barcode
      const sample = data.find(item => item.barcodeId === barcodeInput)
      if (sample) {
        setHighlightedSampleId(sample.id)
        // Scroll to the highlighted row
        const rowElement = document.getElementById(`sample-row-${sample.id}`)
        if (rowElement) {
          rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
        toast.success('Sample found')
      } else {
        toast.error('Invalid barcode. Sample not found.')
      }
    } catch (error) {
      console.error('Error scanning barcode:', error)
      toast.error('Failed to scan barcode')
    } finally {
      setIsScanning(false)
      setShowBarcodeScanDialog(false)
      setBarcodeInput('')
    }
  }

  // Add filter state
  const [filters, setFilters] = useState({
    projectNo: '',
    study: '',
    receiveStatus: '',
    sampleType: '',
    location: '',
    referenceId: '',
    lab: ''
  })

  // Add filter handler
  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  // Add filter apply handler
  const handleApplyFilters = () => {
    let filtered = [...data]
    
    if (filters.projectNo) {
      filtered = filtered.filter(item => item.projectNo?.includes(filters.projectNo))
    }
    if (filters.study) {
      filtered = filtered.filter(item => item.study?.includes(filters.study))
    }
    if (filters.receiveStatus) {
      filtered = filtered.filter(item => item.receiveStatus === filters.receiveStatus)
    }
    if (filters.sampleType) {
      filtered = filtered.filter(item => item.sampleType === filters.sampleType)
    }
    if (filters.location) {
      filtered = filtered.filter(item => item.location?.includes(filters.location))
    }
    if (filters.referenceId) {
      filtered = filtered.filter(item => item.referenceId?.includes(filters.referenceId))
    }
    if (filters.lab) {
      filtered = filtered.filter(item => item.lab?.includes(filters.lab))
    }

    setFilteredData(filtered)
  }

  // Add row highlighting styles
  const getRowStyle = (row: any) => {
    if (row.original.id === highlightedSampleId) {
      return { backgroundColor: '#e8f5e9' } // Light green for highlighted
    }
    return {}
  }

  const handleManualReceive = (sample: SampleType) => {
    // Check if sample is already scanned and verified
    if (!sample.barcodeId) {
      toast.error('Please scan and verify the sample first')
      return
    }
    setSelectedSampleForReceive(sample)
    setShowReceiveConfirm(true)
  }

  const handleReceiveConfirm = async () => {
    if (!selectedSampleForReceive) return

    try {
      setIsLoading(true) // Set loading to true before operation
      await fetch('/api/apps/lims/Sample-received?action=status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: [selectedSampleForReceive.id], statusId: 1 })
      });
      toast.success('Sample received successfully');
      
      // Refresh the data with proper error handling
      const response = await fetch('/api/apps/lims/Sample-received');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new TypeError("Oops, we haven't got JSON!");
      }
      const data = await response.json();
      if (!data || !Array.isArray(data)) {
        throw new Error("Invalid data format received");
      }
      
      setData(data);
      setFilteredData(data);
      onDataChange?.(); // Call the onDataChange callback
      // Scroll to the top of the table
      const tableContainer = document.querySelector('.overflow-x-auto');
      if (tableContainer) {
        tableContainer.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Error receiving sample:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to receive sample');
    } finally {
      setShowReceiveConfirm(false)
      setSelectedSampleForReceive(null)
      setIsLoading(false) // Set loading to false after operation
    }
  }

  const handleBulkReceive = () => {
    const selectedIds = Object.keys(rowSelection).map(key => filteredData[parseInt(key)].id)
    if (selectedIds.length > 0) {
      setSelectedSamplesForReceive(selectedIds)
      setShowBulkReceiveConfirm(true)
    }
  }

  const handleBulkReceiveConfirm = async () => {
    try {
      setIsBulkOperationLoading(true)
      setBulkOperationProgress(0)
      
      const totalSamples = selectedSamplesForReceive.length
      let processedSamples = 0
      
      await Promise.all(
        selectedSamplesForReceive.map(async (id) => {
          try {
            const response = await fetch('/api/apps/lims/Sample-received?action=status', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ ids: [id], statusId: 1 })
            });

            if (!response.ok) {
              throw new Error('Failed to receive sample');
            }

            processedSamples++
            setBulkOperationProgress((processedSamples / totalSamples) * 100)
          } catch (error) {
            console.error(`Error receiving sample ${id}:`, error)
          }
        })
      )
      
      toast.success('Selected samples received successfully')
      const response = await fetch('/api/apps/lims/Sample-received')
      const newData = await response.json()
      setData(newData)
      setFilteredData(newData)
      onDataChange?.()
    } catch (error) {
      console.error('Error receiving samples:', error)
      toast.error('Failed to receive some samples. Please check the audit trail for details.')
    } finally {
      setShowBulkReceiveConfirm(false)
      setSelectedSamplesForReceive([])
      setIsBulkOperationLoading(false)
      setBulkOperationProgress(0)
    }
  }

  const handleBulkReject = () => {
    const selectedIds = Object.keys(rowSelection).map(key => filteredData[parseInt(key)].id)
    if (selectedIds.length > 0) {
      setSelectedSamplesForReject(selectedIds)
      setShowBulkRejectConfirm(true)
    }
  }

  const handleBulkRejectConfirm = async () => {
    if (!bulkRejectReason.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }

    try {
      setIsBulkOperationLoading(true)
      setBulkOperationProgress(0)
      
      const totalSamples = selectedSamplesForReject.length
      let processedSamples = 0
      
      await Promise.all(
        selectedSamplesForReject.map(async (id) => {
          try {
            const response = await fetch('/api/apps/lims/Sample-received?action=status', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                ids: [id], 
                statusId: 2, 
                reason: bulkRejectReason 
              })
            });

            if (!response.ok) {
              throw new Error('Failed to reject sample');
            }

            processedSamples++
            setBulkOperationProgress((processedSamples / totalSamples) * 100)
          } catch (error) {
            console.error(`Error rejecting sample ${id}:`, error)
          }
        })
      )
      
      toast.success('Selected samples rejected successfully')
      const response = await fetch('/api/apps/lims/Sample-received')
      const newData = await response.json()
      setData(newData)
      setFilteredData(newData)
    } catch (error) {
      console.error('Error rejecting samples:', error)
      toast.error('Failed to reject some samples. Please check the audit trail for details.')
    } finally {
      setShowBulkRejectConfirm(false)
      setSelectedSamplesForReject([])
      setBulkRejectReason('')
      setIsBulkOperationLoading(false)
      setBulkOperationProgress(0)
    }
  }

  const handleBulkCentrifuge = () => {
    const selectedIds = Object.keys(rowSelection).map(key => filteredData[parseInt(key)].id)
    if (selectedIds.length > 0) {
      setSelectedSamplesForCentrifuge(selectedIds)
      setShowBulkCentrifugeConfirm(true)
    }
  }

  const handleBulkCentrifugeConfirm = async () => {
    try {
      setIsBulkOperationLoading(true)
      setBulkOperationProgress(0)
      
      const totalSamples = selectedSamplesForCentrifuge.length
      let processedSamples = 0
      
      await Promise.all(
        selectedSamplesForCentrifuge.map(async (id) => {
          try {
            const response = await fetch('/api/apps/lims/Sample-received?action=centrifuge', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ ids: [id] })
            });

            if (!response.ok) {
              throw new Error('Failed to centrifuge sample');
            }

            processedSamples++
            setBulkOperationProgress((processedSamples / totalSamples) * 100)
          } catch (error) {
            console.error(`Error centrifuging sample ${id}:`, error)
          }
        })
      )
      
      toast.success('Selected samples sent for centrifugation successfully')
      const response = await fetch('/api/apps/lims/Sample-received')
      const newData = await response.json()
      setData(newData)
      setFilteredData(newData)
      onDataChange?.()
    } catch (error) {
      console.error('Error centrifuging samples:', error)
      toast.error('Failed to centrifuge some samples. Please check the audit trail for details.')
    } finally {
      setShowBulkCentrifugeConfirm(false)
      setSelectedSamplesForCentrifuge([])
      setIsBulkOperationLoading(false)
      setBulkOperationProgress(0)
    }
  }

  // Add audit trail type
  type AuditTrailType = {
    actionPerformed: string
    description: string
    triggeredBy: string
    triggeredOn: string
    status: string
    reason?: string
    volunteerId?: string
    barcodeId?: string
    sampleSendBy?: string
    sampleSendOn?: string
  }

  // Add audit trail dialog component
  const AuditTrailDialog = ({
    open,
    setOpen,
    sampleId
  }: {
    open: boolean
    setOpen: (open: boolean) => void
    sampleId: number
  }) => {
    const [auditTrail, setAuditTrail] = useState<AuditTrailType[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      const fetchAuditTrail = async () => {
        try {
          setLoading(true)
          const response = await fetch('/api/apps/lims/Sample-received/audit-trail', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sampleId })
          });
          const data = await response.json();
          setAuditTrail(data.result || []);
        } catch (error) {
          console.error('Error fetching audit trail:', error);
          toast.error('Failed to fetch audit trail');
        } finally {
          setLoading(false);
        }
      };

      if (open && sampleId) {
        fetchAuditTrail();
      }
    }, [open, sampleId]);

    return (
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>Audit Trail</DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Action</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Triggered By</TableCell>
                  <TableCell>Triggered On</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Volunteer ID</TableCell>
                  <TableCell>Barcode ID</TableCell>
                  <TableCell>Sample Send By</TableCell>
                  <TableCell>Sample Send On</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {auditTrail.map((trail, index) => (
                  <TableRow key={index}>
                    <TableCell>{trail.actionPerformed}</TableCell>
                    <TableCell>{trail.description}</TableCell>
                    <TableCell>{trail.triggeredBy}</TableCell>
                    <TableCell>{formatDate(trail.triggeredOn)}</TableCell>
                    <TableCell>{trail.status}</TableCell>
                    <TableCell>{trail.reason || '-'}</TableCell>
                    <TableCell>{trail.volunteerId || '-'}</TableCell>
                    <TableCell>{trail.barcodeId || '-'}</TableCell>
                    <TableCell>{trail.sampleSendBy || '-'}</TableCell>
                    <TableCell>{formatDate(trail.sampleSendOn)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    )
  }

  // Add audit trail handler
  const handleAuditTrail = (id: number) => {
    setSelectedSampleForAudit(id)
    setShowAuditTrail(true)
  }

  // Add progress indicator component
  const BulkOperationProgress = () => (
    <Box sx={{ width: '100%', mt: 2 }}>
      <LinearProgress variant="determinate" value={bulkOperationProgress} />
      <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
        Processing {Math.round(bulkOperationProgress)}% complete
      </Typography>
    </Box>
  )

  return (
    <Card>
      <CardHeader 
        title="Sample Receive" 
        action={
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant='outlined'
              startIcon={
                isExporting ? (
                  <i className='tabler-loader animate-spin' />
                ) : (
                  <i className='tabler-file-spreadsheet' />
                )
              }
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? 'Exporting...' : 'Excel'}
            </Button>
            <Button
              variant='outlined'
              startIcon={
                isPdfLoading ? (
                  <i className='tabler-loader animate-spin' />
                ) : (
                  <i className='tabler-file-text' />
                )
              }
              onClick={handlePdfExport}
              disabled={isPdfLoading}
            >
              {isPdfLoading ? 'Exporting...' : 'PDF'}
            </Button>
          </Box>
        }
      />
      <Divider />
      
      <div className='flex flex-wrap justify-between gap-4 p-6'>
        {/* Barcode Scanner Button */}
        <div className='flex items-center gap-2'>
          <Button
            variant='outlined'
            startIcon={<i className='tabler-scan' />}
            onClick={() => setShowBarcodeScanDialog(true)}
            sx={{ color: 'lime.main', borderColor: 'lime.main' }}
            className='max-sm:is-full is-auto'
          >
            Scan Barcode
          </Button>
        </div>

        {/* Search and other controls */}
        <div className='flex flex-wrap items-center max-sm:flex-col gap-4 max-sm:is-full is-auto'>
          <DebouncedInput
            value={globalFilter ?? ''}
            onChange={value => setGlobalFilter(String(value))}
            placeholder='Search Sample'
            className='max-sm:is-full'
          />
          <div className='flex items-center gap-2'>
            <IconButton
              size="small"
              onClick={(e) => setColumnMenuAnchor(e.currentTarget)}
              title="Toggle columns"
              sx={{
                backgroundColor: 'primary.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
                marginRight: 1
              }}
            >
              <i className='tabler-columns' />
            </IconButton>
            <Menu
              anchorEl={columnMenuAnchor}
              open={Boolean(columnMenuAnchor)}
              onClose={() => setColumnMenuAnchor(null)}
              PaperProps={{
                style: {
                  maxHeight: 300,
                  width: 250,
                },
              }}
            >
              <Box sx={{ p: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Toggle Columns
                </Typography>
                {table.getAllColumns()
                  .filter(column => column.getCanHide())
                  .map(column => (
                    <MenuItem key={column.id} onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={column.getIsVisible()}
                        onChange={column.getToggleVisibilityHandler()}
                      />
                      <Typography variant="body2">
                        {column.columnDef.header as string}
                      </Typography>
                    </MenuItem>
                  ))}
              </Box>
            </Menu>
          </div>
        </div>
      </div>
      
      <TableFilters setData={setFilteredData} sampleData={data} />
      <div className='overflow-x-auto'>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
            <CircularProgress />
          </Box>
        ) : (
          <table className={tableStyles.table}>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id}>
                      {header.isPlaceholder ? null : (
                        <div
                          className={classnames({
                            'flex items-center': header.column.getIsSorted(),
                            'cursor-pointer select-none': header.column.getCanSort()
                          })}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: <i className='tabler-chevron-up text-xl' />,
                            desc: <i className='tabler-chevron-down text-xl' />
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getFilteredRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                    No data available
                  </td>
                </tr>
              ) : (
                table
                  .getRowModel()
                  .rows.slice(0, table.getState().pagination.pageSize)
                  .map(row => (
                    <tr 
                      key={row.id} 
                      id={`sample-row-${row.original.id}`}
                      className={classnames({ selected: row.getIsSelected() })}
                      style={getRowStyle(row)}
                    >
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                      ))}
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        )}
      </div>
      <TablePagination
        component={() => <TablePaginationComponent table={table} />}
        count={table.getFilteredRowModel().rows.length}
        rowsPerPage={table.getState().pagination.pageSize}
        page={table.getState().pagination.pageIndex}
        onPageChange={(_, page) => {
          table.setPageIndex(page)
        }}
      />
      <div className='flex items-center justify-center gap-4 p-4 border-t'>
        <Button
          variant='contained'
          color='success'
          startIcon={<i className='tabler-check' />}
          disabled={Object.keys(rowSelection).length === 0}
          onClick={handleBulkReceive}
        >
          Receive
        </Button>
        <Button
          variant='contained'
          color='error'
          startIcon={<i className='tabler-x' />}
          disabled={Object.keys(rowSelection).length === 0}
          onClick={handleBulkReject}
        >
          Reject
        </Button>
        <Button
          variant='contained'
          color='warning'
          startIcon={<i className='tabler-external-link' />}
          disabled={Object.keys(rowSelection).length === 0}
          onClick={handleBulkOutsource}
        >
          Outsource
        </Button>
        <Button
          variant='contained'
          color='info'
          startIcon={<i className='tabler-printer' />}
          disabled={Object.keys(rowSelection).length === 0}
          onClick={handleBulkPrintBarcode}
        >
          Print Barcode
        </Button>
        <Button
          variant='contained'
          color='secondary'
          startIcon={<i className='tabler-rotate' />}
          disabled={Object.keys(rowSelection).length === 0}
          onClick={handleBulkCentrifuge}
        >
          Centrifuge Selected
        </Button>
      </div>

      <BarcodePrintDialog
        open={showBarcodeDialog}
        setOpen={setShowBarcodeDialog}
        sampleId={selectedSample?.id || 0}
        barcodeId={selectedSample?.barcodeId}
        samples={Object.keys(rowSelection).map(key => {
          const sample = filteredData[parseInt(key)]
          return {
            id: sample.id,
            barcodeId: sample.barcodeId || '',
            subjectId: sample.subjectId,
            sampleType: sample.sampleType,
            collectedOn: sample.collectedOn
          }
        })}
        sampleDetails={{
          subjectId: selectedSample?.subjectId,
          sampleType: selectedSample?.sampleType,
          collectedOn: selectedSample?.collectedOn
        }}
      />
      <RemarkDialog
        open={showRemarkDialog}
        setOpen={setShowRemarkDialog}
        sampleId={selectedSampleForRemark?.id || 0}
        currentRemark={selectedSampleForRemark?.remarks}
        onSuccess={handleRemarkSuccess}
      />
      <ConfirmDialog
        open={showOutsourceConfirm}
        title="Confirm Outsource"
        description={
          <div className='flex flex-col gap-4'>
            <Typography>
              Do you want to outsource {selectedSamplesForOutsource.length} samples?
            </Typography>
            {isBulkOperationLoading && <BulkOperationProgress />}
          </div>
        }
        okText="Yes"
        cancelText="No"
        handleClose={() => {
          setShowOutsourceConfirm(false)
          setSelectedSamplesForOutsource([])
        }}
        handleConfirm={handleOutsourceConfirm}
        disabled={isBulkOperationLoading}
      />
      <ConfirmDialog
        open={showReceiveConfirm}
        title="Confirm Receive"
        description={`Do you want to mark sample ${selectedSampleForReceive?.barcodeId} as received?`}
        okText="Yes"
        cancelText="No"
        handleClose={() => {
          setShowReceiveConfirm(false)
          setSelectedSampleForReceive(null)
        }}
        handleConfirm={handleReceiveConfirm}
      />
      <ConfirmDialog
        open={showRejectConfirm}
        title="Confirm Rejection"
        description={
          <div className='flex flex-col gap-4'>
            <Typography>
              Do you want to reject sample {selectedSampleForReject?.barcodeId}?
            </Typography>
            <CustomTextField
              fullWidth
              multiline
              rows={3}
              label='Reason for Rejection'
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              required
              error={!rejectReason.trim()}
              helperText={!rejectReason.trim() ? 'Please provide a reason for rejection' : ''}
            />
          </div>
        }
        okText="Yes"
        cancelText="No"
        handleClose={() => {
          setShowRejectConfirm(false)
          setSelectedSampleForReject(null)
          setRejectReason('')
        }}
        handleConfirm={handleRejectConfirm}
      />
      <ConfirmDialog
        open={showBulkReceiveConfirm}
        title="Confirm Bulk Receive"
        description={
          <div className='flex flex-col gap-4'>
            <Typography>
              Do you want to mark {selectedSamplesForReceive.length} samples as received?
            </Typography>
            {isBulkOperationLoading && <BulkOperationProgress />}
          </div>
        }
        okText="Yes"
        cancelText="No"
        handleClose={() => {
          setShowBulkReceiveConfirm(false)
          setSelectedSamplesForReceive([])
        }}
        handleConfirm={handleBulkReceiveConfirm}
        disabled={isBulkOperationLoading}
      />
      <ConfirmDialog
        open={showBulkRejectConfirm}
        title="Confirm Bulk Reject"
        description={
          <div className='flex flex-col gap-4'>
            <Typography>
              Do you want to reject {selectedSamplesForReject.length} samples?
            </Typography>
            <CustomTextField
              fullWidth
              multiline
              rows={3}
              label='Reason for Rejection'
              value={bulkRejectReason}
              onChange={(e) => setBulkRejectReason(e.target.value)}
              required
              error={!bulkRejectReason.trim()}
              helperText={!bulkRejectReason.trim() ? 'Please provide a reason for rejection' : ''}
              disabled={isBulkOperationLoading}
            />
            {isBulkOperationLoading && <BulkOperationProgress />}
          </div>
        }
        okText="Yes"
        cancelText="No"
        handleClose={() => {
          setShowBulkRejectConfirm(false)
          setSelectedSamplesForReject([])
          setBulkRejectReason('')
        }}
        handleConfirm={handleBulkRejectConfirm}
        disabled={isBulkOperationLoading || !bulkRejectReason.trim()}
      />
      <ConfirmDialog
        open={showBulkCentrifugeConfirm}
        title="Confirm Centrifugation"
        description={
          <div className='flex flex-col gap-4'>
            <Typography>
              Do you want to send {selectedSamplesForCentrifuge.length} samples for centrifugation?
            </Typography>
            {isBulkOperationLoading && <BulkOperationProgress />}
          </div>
        }
        okText="Yes"
        cancelText="No"
        handleClose={() => {
          setShowBulkCentrifugeConfirm(false)
          setSelectedSamplesForCentrifuge([])
        }}
        handleConfirm={handleBulkCentrifugeConfirm}
        disabled={isBulkOperationLoading}
      />
      <SampleDetailsDialog
        open={showSampleDetails}
        setOpen={setShowSampleDetails}
        sample={selectedSampleForDetails}
      />
      <AuditTrailDialog
        open={showAuditTrail}
        setOpen={setShowAuditTrail}
        sampleId={selectedSampleForAudit || 0}
      />
      {/* Add Barcode Scan Dialog */}
      <Dialog
        open={showBarcodeScanDialog}
        onClose={() => setShowBarcodeScanDialog(false)}
      >
        <DialogTitle>Scan Barcode</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            {isScanning ? (
              <CircularProgress />
            ) : (
              <CustomTextField
                fullWidth
                label='Barcode'
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                autoFocus
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBarcodeScanDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleBarcodeSubmit} 
            color='primary' 
            variant='contained'
            disabled={!barcodeInput || isScanning}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default SampleReceivedTable
