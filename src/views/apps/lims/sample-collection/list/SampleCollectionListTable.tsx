'use client'

// React Imports
import React from 'react'
import { useMemo, useState, useEffect } from 'react'

// Next Imports
import { useParams } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  CircularProgress,
  Typography,
  Grid,
  TablePagination
} from '@mui/material'
import { Add as AddIcon, CheckCircle as CheckCircleIcon, History as HistoryIcon, Remove as RemoveIcon } from '@mui/icons-material'
import Collapse from '@mui/material/Collapse'

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
import { toast } from 'react-toastify'

// Type Imports
import type { ThemeColor } from '@core/types'

// eslint-disable-next-line import/no-unresolved
import CustomTextField from '@core/components/mui/TextField'

// eslint-disable-next-line import/no-unresolved
import OptionMenu from '@core/components/option-menu'

// eslint-disable-next-line import/no-unresolved
import tableStyles from '@core/styles/table.module.css'

import type { SampleCollectionType } from '@/app/api/apps/lims/sample-collection/route'

// eslint-disable-next-line import/no-unresolved
import { formatDate } from '@/utils/dateUtils'

// Component Imports
// eslint-disable-next-line import/no-unresolved
import TablePaginationComponent from '@/components/TablePaginationComponent'
import TableFilters from './TableFilters'
import BarcodePrintDialog from '@/components/dialogs/barcode-print'

// Style Imports

declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

type SampleWithActionsType = SampleCollectionType & {
  actions?: string
  barcodeId?: string
}

type collectionStatusType = {
  [key: string]: {
    title: string
    color: ThemeColor
  }
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({ itemRank })

  return itemRank.passed
}

const collectionStatusObj: collectionStatusType = {
  Pending: { title: 'Pending', color: 'warning' },
  Collected: { title: 'Collected', color: 'success' },
  Rejected: { title: 'Rejected', color: 'error' },
  Outsourced: { title: 'Outsourced', color: 'info' }
}

const columnHelper = createColumnHelper<SampleWithActionsType>()

type Props = {
  sampleData?: SampleCollectionType[]
  onDataChange?: () => void
}

const SampleCollectionListTable = ({ sampleData = [], onDataChange }: Props): JSX.Element => {
  // States
  const [data, setData] = useState<SampleCollectionType[]>(sampleData)
  const [globalFilter, setGlobalFilter] = useState('')
  const [isPdfLoading, setIsPdfLoading] = useState(false)
  const [isExcelLoading, setIsExcelLoading] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedRow, setSelectedRow] = useState<SampleWithActionsType | null>(null)
  const [rowSelection, setRowSelection] = useState({})
  const [showBulkOutsourceConfirm, setShowBulkOutsourceConfirm] = useState(false)
  const [showBulkCollectConfirm, setShowBulkCollectConfirm] = useState(false)
  const [showBulkPrintConfirm, setShowBulkPrintConfirm] = useState(false)
  const [showBulkRejectConfirm, setShowBulkRejectConfirm] = useState(false)
  const [selectedSamplesForBulkAction, setSelectedSamplesForBulkAction] = useState<number[]>([])
  const [showVolumeInputDialog, setShowVolumeInputDialog] = useState(false)
  const [selectedSampleForVolume, setSelectedSampleForVolume] = useState<SampleWithActionsType | null>(null)
  const [volume, setVolume] = useState<string>('')
  const [showAuditTrailDialog, setShowAuditTrailDialog] = useState(false)
  const [selectedSampleForAudit, setSelectedSampleForAudit] = useState<SampleWithActionsType | null>(null)
  const [auditTrailData, setAuditTrailData] = useState<any[]>([])
  const [showBarcodeScanDialog, setShowBarcodeScanDialog] = useState(false)
  const [selectedSampleForScan, setSelectedSampleForScan] = useState<SampleWithActionsType | null>(null)
  const [barcodeInput, setBarcodeInput] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [showBarcodeDialog, setShowBarcodeDialog] = useState(false)
  const [selectedSample, setSelectedSample] = useState<SampleWithActionsType | null>(null)
  const [showSampleDetails, setShowSampleDetails] = useState(false)
  const [selectedSampleForDetails, setSelectedSampleForDetails] = useState<SampleWithActionsType | null>(null)
  const [showRemarkDialog, setShowRemarkDialog] = useState(false)
  const [selectedSampleForRemark, setSelectedSampleForRemark] = useState<SampleWithActionsType | null>(null)
  const [remark, setRemark] = useState('')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [selectedGroups, setSelectedGroups] = useState<Record<string, boolean>>({})
  const [selectedSamples, setSelectedSamples] = useState<Record<string, boolean>>({})
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(5)

  // Hooks
  const { lang: locale } = useParams()

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedRow(null)
  }

  const handleBulkOutsource = () => {
    const selectedIds = Object.keys(rowSelection).map(key => data[parseInt(key)].id)

    if (selectedIds.length > 0) {
      setSelectedSamplesForBulkAction(selectedIds)
      setShowBulkOutsourceConfirm(true)
    }
  }

  const handleBulkCollect = () => {
    const selectedIds = Object.keys(rowSelection).map(key => data[parseInt(key)].id)

    if (selectedIds.length > 0) {
      setSelectedSamplesForBulkAction(selectedIds)
      setShowBulkCollectConfirm(true)
    }
  }

  const handlePrintBarcode = async (id: number) => {
    console.log('handlePrintBarcode called with id:', id)
    const sample = data.find(item => item.id === id)
    console.log('Found sample:', sample)

    if (!sample) {
      toast.error('Sample not found')
      return
    }

    if (!sample.barcodeId) {
      toast.error('No barcode ID available for this sample')
      return
    }

    console.log('Setting selected sample and showing dialog')
    setSelectedSample(sample)
    setShowBarcodeDialog(true)
  }

  const handleBulkPrintBarcode = async () => {
    console.log('handleBulkPrintBarcode called')
    const selectedIds = Object.keys(rowSelection).map(key => data[parseInt(key)].id)
    console.log('Selected IDs:', selectedIds)

    if (selectedIds.length === 0) {
      toast.error('No samples selected')
      return
    }

    const selectedSamples = data.filter(item => selectedIds.includes(item.id))
    console.log('Selected samples:', selectedSamples)

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

    console.log('Setting selected sample and showing dialog')
    setSelectedSample(selectedSamples[0]) // Keep first sample for backward compatibility
    setShowBarcodeDialog(true)
  }

  const handleBulkReject = () => {
    const selectedIds = Object.keys(rowSelection).map(key => data[parseInt(key)].id)

    if (selectedIds.length > 0) {
      setSelectedSamplesForBulkAction(selectedIds)
      setShowBulkRejectConfirm(true)
    }
  }

  const handleBulkOutsourceConfirm = async () => {
    try {
      // TODO: Implement bulk outsource logic
      toast.success('Selected samples outsourced successfully')
      onDataChange?.()
    } catch (error) {
      console.error('Error outsourcing samples:', error)
      toast.error('Failed to outsource samples')
    } finally {
      setShowBulkOutsourceConfirm(false)
      setSelectedSamplesForBulkAction([])
    }
  }

  const handleBulkCollectConfirm = async () => {
    try {
      // TODO: Implement bulk collect logic
      toast.success('Selected samples collected successfully')
      onDataChange?.()
    } catch (error) {
      console.error('Error collecting samples:', error)
      toast.error('Failed to collect samples')
    } finally {
      setShowBulkCollectConfirm(false)
      setSelectedSamplesForBulkAction([])
    }
  }

  const handleBulkPrintBarcodeConfirm = async () => {
    try {
      // TODO: Implement bulk print barcode logic
      toast.success('Barcodes printed successfully')
    } catch (error) {
      console.error('Error printing barcodes:', error)
      toast.error('Failed to print barcodes')
    } finally {
      setShowBulkPrintConfirm(false)
      setSelectedSamplesForBulkAction([])
    }
  }

  const handleBulkRejectConfirm = async () => {
    try {
      // TODO: Implement bulk reject logic
      toast.success('Selected samples rejected successfully')
      onDataChange?.()
    } catch (error) {
      console.error('Error rejecting samples:', error)
      toast.error('Failed to reject samples')
    } finally {
      setShowBulkRejectConfirm(false)
      setSelectedSamplesForBulkAction([])
    }
  }

  const handleVolumeInput = (sample: SampleWithActionsType) => {
    setSelectedSampleForVolume(sample)
    setShowVolumeInputDialog(true)
  }

  const handleVolumeSubmit = async () => {
    if (!selectedSampleForVolume || !volume) return

    try {
      // TODO: Implement volume update API call
      toast.success('Volume updated successfully')
      onDataChange?.()
    } catch (error) {
      console.error('Error updating volume:', error)
      toast.error('Failed to update volume')
    } finally {
      setShowVolumeInputDialog(false)
      setSelectedSampleForVolume(null)
      setVolume('')
    }
  }

  const handleAuditTrail = async (sample: SampleWithActionsType) => {
    setSelectedSampleForAudit(sample)
    setShowAuditTrailDialog(true)

    try {
      // TODO: Implement audit trail API call
      // Mock data for now
      setAuditTrailData([
        {
          action: 'Sample Collection',
          description: 'Sample collected manually',
          triggeredBy: 'John Doe',
          triggeredOn: '2024-03-20 10:30:00',
          status: 'Completed',
          reason: 'Regular collection',
          volunteerId: 'VOL001',
          barcodeId: 'BAR001'
        }
      ])
    } catch (error) {
      console.error('Error fetching audit trail:', error)
      toast.error('Failed to fetch audit trail')
    }
  }

  const handleBarcodeScan = (sample: SampleWithActionsType) => {
    // Simple barcode scan functionality
    console.log('Scanning barcode for sample:', sample)
    toast.info('Barcode scanning initiated')
  }

  const handleBarcodeSubmit = async () => {
    if (!selectedSampleForScan || !barcodeInput) return

    try {
      // TODO: Implement barcode validation and collection API call
      toast.success('Sample collected successfully')
      onDataChange?.()
    } catch (error) {
      console.error('Error collecting sample:', error)
      toast.error('Failed to collect sample')
    } finally {
      setShowBarcodeScanDialog(false)
      setSelectedSampleForScan(null)
      setBarcodeInput('')
      setIsScanning(false)
    }
  }

  const handleAddRemark = (sample: SampleWithActionsType) => {
    setSelectedSampleForRemark(sample)
    setRemark(sample.remarks || '')
    setShowRemarkDialog(true)
  }

  const handleRemarkSubmit = async () => {
    if (!selectedSampleForRemark) return

    try {
      // TODO: Implement remark update API call
      toast.success('Remark added successfully')
      onDataChange?.()
    } catch (error) {
      console.error('Error adding remark:', error)
      toast.error('Failed to add remark')
    } finally {
      setShowRemarkDialog(false)
      setSelectedSampleForRemark(null)
      setRemark('')
    }
  }

  const columns = useMemo<ColumnDef<SampleWithActionsType, any>[]>(
    () => [
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            <OptionMenu
              iconButtonProps={{ size: 'medium' }}
              iconClassName='text-textSecondary'
              options={[
                {
                  text: 'Sample Collect',
                  icon: 'tabler-check',
                  menuItemProps: {
                    onClick: () => {
                      // TODO: Implement sample collection logic
                      toast.success('Sample collected successfully')
                      handleMenuClose()
                    },
                    disabled: row.original.collectionStatus === 'Collected',
                    className: 'text-success'
                  }
                },
                {
                  text: 'Add Volume',
                  icon: 'tabler-plus',
                  menuItemProps: {
                    onClick: () => {
                      handleVolumeInput(row.original)
                      handleMenuClose()
                    },
                    disabled: row.original.collectionStatus === 'Collected',
                    className: 'text-primary'
                  }
                },
                {
                  text: 'View Audit Trail',
                  icon: 'tabler-history',
                  menuItemProps: {
                    onClick: () => {
                      handleAuditTrail(row.original)
                      handleMenuClose()
                    },
                    className: 'text-info'
                  }
                },
                {
                  text: 'Reject Sample',
                  icon: 'tabler-x',
                  menuItemProps: {
                    onClick: () => handleMenuClose(),
                    className: 'text-error'
                  }
                },
                {
                  text: 'Print Barcode',
                  icon: 'tabler-printer',
                  menuItemProps: {
                    onClick: () => {
                      setSelectedSample(row.original)
                      setShowBarcodeDialog(true)
                    },
                    className: 'text-primary'
                  }
                },
                {
                  text: 'Sample Info',
                  icon: 'tabler-eye',
                  menuItemProps: {
                    onClick: () => {
                      setSelectedSampleForDetails(row.original)
                      setShowSampleDetails(true)
                      handleMenuClose()
                    },
                    className: 'text-info'
                  }
                },
                {
                  text: 'Add Remark',
                  icon: 'tabler-message',
                  menuItemProps: {
                    onClick: () => {
                      handleAddRemark(row.original)
                      handleMenuClose()
                    },
                    className: 'text-secondary'
                  }
                },
                {
                  text: 'Outsource Sample',
                  icon: 'tabler-external-link',
                  menuItemProps: {
                    onClick: () => handleMenuClose(),
                    className: 'text-warning'
                  }
                },
                {
                  text: 'Download eTRF',
                  icon: 'tabler-download',
                  menuItemProps: {
                    onClick: () => handleMenuClose(),
                    className: 'text-success'
                  }
                }
              ]}
            />
          </div>
        ),
        enableSorting: false
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
      columnHelper.accessor('employeeName', {
        header: 'Employee Name',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('sampleId', {
        header: 'Sample ID',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('employeeId', {
        header: 'Employee ID',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('collectedBy', {
        header: 'Collected By',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('collectedOn', {
        header: 'Collected On',
        cell: info => formatDate(info.getValue())
      }),
      columnHelper.accessor('collectionStatus', {
        header: 'Status',
        cell: info => {
          const status = info.getValue()

          return (
            <Chip label={collectionStatusObj[status]?.title} color={collectionStatusObj[status]?.color} size='small' />
          )
        }
      })
    ],
    []
  )

  const table = useReactTable({
    data,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    state: {
      rowSelection,
      globalFilter
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  // PDF export handler function
  const handlePdfExport = async () => {
    setIsPdfLoading(true)

    try {
      const doc = new jsPDF()

      // Add title
      doc.setFontSize(16)
      doc.text('Sample Collection List', 14, 15)

      // Add date
      doc.setFontSize(10)
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22)

      // Prepare table data
      const tableData = table
        .getFilteredRowModel()
        .rows.map(row => [
          row.original.employeeName,
          row.original.sampleId,
          row.original.employeeId,
          row.original.collectedBy,
          formatDate(row.original.collectedOn),
          row.original.collectionStatus,
          row.original.sampleType,
          row.original.location,
          row.original.laboratory
        ])

      // Add table
      autoTable(doc, {
        head: [
          [
            'Employee Name',
            'Sample ID',
            'Employee ID',
            'Collected By',
            'Collected On',
            'Status',
            'Sample Type',
            'Location',
            'Laboratory'
          ]
        ],
        body: tableData,
        startY: 30,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 30 }
      })

      // Save the PDF
      doc.save(`sample-collection-${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success('PDF file downloaded successfully')
    } catch (error) {
      console.error('PDF export failed:', error)
      toast.error('Failed to download PDF file')
    } finally {
      setIsPdfLoading(false)
    }
  }

  // Excel export handler function
  const handleExcelExport = async () => {
    setIsExcelLoading(true)

    try {
      const headers = [
        'Employee Name',
        'Sample ID',
        'Employee ID',
        'Collected By',
        'Collected On',
        'Status',
        'Sample Type',
        'Location',
        'Laboratory'
      ]

      const csvData = table
        .getFilteredRowModel()
        .rows.map(row => [
          row.original.employeeName,
          row.original.sampleId,
          row.original.employeeId,
          row.original.collectedBy,
          formatDate(row.original.collectedOn),
          row.original.collectionStatus,
          row.original.sampleType,
          row.original.location,
          row.original.laboratory
        ])

      const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')

      link.href = URL.createObjectURL(blob)
      link.download = `sample-collection-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      toast.success('Excel file downloaded successfully')
    } catch (error) {
      console.error('Excel export failed:', error)
      toast.error('Failed to download Excel file')
    } finally {
      setIsExcelLoading(false)
    }
  }

  // Add useEffect to monitor dialog state
  useEffect(() => {
    console.log('Barcode dialog state:', { showBarcodeDialog, selectedSample })
  }, [showBarcodeDialog, selectedSample])

  // Add this handler for the Cancel button
  const handleBulkCancel = () => {
    toast.info('Cancel action triggered')
  }

  // Helper to group samples by employeeId
  const groupSamplesByEmployee = (samples: SampleWithActionsType[]) => {
    const groups: Record<string, { employeeName: string; employeeId: string; samples: SampleWithActionsType[]; collectionStatus: string }> = {}
    samples.forEach(sample => {
      const empId = sample.employeeId || 'Unknown'
      if (!groups[empId]) {
        groups[empId] = {
          employeeName: sample.employeeName || '-',
          employeeId: empId,
          collectionStatus: sample.collectionStatus || 'Pending',
          samples: []
        }
      }
      groups[empId].samples.push(sample)
    })
    return groups
  }

  const grouped = useMemo(() => groupSamplesByEmployee(data), [data])
  const groupKeys = Object.keys(grouped)
  const pagedGroupKeys = groupKeys.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  const handleExpand = (employeeId: string, samples: SampleWithActionsType[]) => {
    const newExpanded = !expanded[employeeId]
    setExpanded(prev => ({ ...prev, [employeeId]: newExpanded }))
    if (newExpanded && selectedGroups[employeeId]) {
      const newSelectedSamples = { ...selectedSamples }
      samples.forEach(sample => {
        if (sample.barcodeId) newSelectedSamples[sample.barcodeId] = true
      })
      setSelectedSamples(newSelectedSamples)
    }
  }
  const handleGroupSelect = (employeeId: string, samples: SampleWithActionsType[]) => {
    const newSelected = !selectedGroups[employeeId]
    setSelectedGroups(prev => ({ ...prev, [employeeId]: newSelected }))
    const newSelectedSamples = { ...selectedSamples }
    samples.forEach(sample => {
      if (sample.barcodeId) newSelectedSamples[sample.barcodeId] = newSelected
    })
    setSelectedSamples(newSelectedSamples)
  }
  const handleSampleSelect = (barcodeId: string) => {
    setSelectedSamples(prev => ({ ...prev, [barcodeId]: !prev[barcodeId] }))
  }
  const isGroupSelected = (employeeId: string, samples: SampleWithActionsType[]) => {
    return samples.every(sample => sample.barcodeId && selectedSamples[sample.barcodeId])
  }
  const isGroupIndeterminate = (employeeId: string, samples: SampleWithActionsType[]) => {
    const selectedCount = samples.filter(sample => sample.barcodeId && selectedSamples[sample.barcodeId]).length
    return selectedCount > 0 && selectedCount < samples.length
  }

  const anySelected = Object.keys(selectedSamples).filter(k => selectedSamples[k]).length > 0

  return (
    <Card>
      <CardHeader
        title={<Typography variant='h4' fontWeight={600}>Sample Collection</Typography>}
        action={
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <CustomTextField
              placeholder='Scan barcode'
              size='small'
              sx={{ width: '200px' }}
              onChange={e => {
                // Handle barcode scan input
                const value = e.target.value
                if (value) {
                  // TODO: Implement barcode scan logic
                  console.log('Barcode scanned:', value)
                }
              }}
            />
            <Button
              variant='outlined'
              startIcon={
                isExcelLoading ? (
                  <i className='tabler-loader animate-spin' />
                ) : (
                  <i className='tabler-file-spreadsheet' />
                )
              }
              onClick={handleExcelExport}
              disabled={isExcelLoading}
            >
              {isExcelLoading ? 'Exporting...' : 'Excel'}
            </Button>
            <Button
              variant='outlined'
              startIcon={
                isPdfLoading ? <i className='tabler-loader animate-spin' /> : <i className='tabler-file-text' />
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
      <TableFilters setData={setData} sampleData={sampleData} />
      <Box sx={{ px: 4, pb: 4 }}>
        <Paper sx={{ width: '100%', overflow: 'hidden', boxShadow: t => t.shadows[1], borderRadius: 1, border: t => `1px solid ${t.palette.divider}` }}>
          <TableContainer sx={{ maxHeight: 640 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell padding='checkbox' />
                  <TableCell>Employee Name</TableCell>
                  <TableCell>Employee ID</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pagedGroupKeys.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align='center'>No data found</TableCell>
                  </TableRow>
                ) : (
                  pagedGroupKeys.map(employeeId => {
                    const group = grouped[employeeId]
                    return (
                      <React.Fragment key={`group-${employeeId}`}>
                        <TableRow hover key={`group-row-${employeeId}`}>
                          <TableCell padding='checkbox'>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Checkbox
                                checked={isGroupSelected(employeeId, group.samples)}
                                indeterminate={isGroupIndeterminate(employeeId, group.samples)}
                                onChange={() => handleGroupSelect(employeeId, group.samples)}
                              />
                              <IconButton
                                size='small'
                                onClick={() => handleExpand(employeeId, group.samples)}
                                sx={{
                                  width: 28,
                                  height: 28,
                                  backgroundColor: theme => expanded[employeeId] ? theme.palette.primary.main : theme.palette.action.hover,
                                  color: theme => expanded[employeeId] ? theme.palette.primary.contrastText : theme.palette.text.primary,
                                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                  '&:hover': {
                                    backgroundColor: theme => expanded[employeeId] ? theme.palette.primary.dark : theme.palette.action.selected,
                                    transform: 'scale(1.1) rotate(180deg)'
                                  }
                                }}
                              >
                                {expanded[employeeId] ? <RemoveIcon fontSize='small' /> : <AddIcon fontSize='small' />}
                              </IconButton>
                            </Box>
                          </TableCell>
                          <TableCell>{group.employeeName}</TableCell>
                          <TableCell>{employeeId}</TableCell>
                          <TableCell>
                            <Chip label={collectionStatusObj[group.collectionStatus]?.title} color={collectionStatusObj[group.collectionStatus]?.color} size='small' />
                          </TableCell>
                        </TableRow>
                        <TableRow key={`collapse-row-${employeeId}`}>
                          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4}>
                            <Collapse in={!!expanded[employeeId]} timeout={300} unmountOnExit>
                              <Box margin={1}>
                                <Table size='small'>
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>Actions</TableCell>
                                      <TableCell padding='checkbox' />
                                      <TableCell>Sample ID</TableCell>
                                      <TableCell>Barcode ID</TableCell>
                                      <TableCell>Sample Type</TableCell>
                                      <TableCell>Collected By</TableCell>
                                      <TableCell>Collected On</TableCell>
                                      <TableCell>Location</TableCell>
                                      <TableCell>Laboratory</TableCell>
                                      <TableCell>Status</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {group.samples.map(sample => (
                                      <TableRow key={`sample-${sample.barcodeId || sample.sampleId}` } hover>
                                        <TableCell>
                                          <Box sx={{ display: 'flex', gap: 1 }}>
                                            <OptionMenu
                                              iconButtonProps={{ size: 'medium' }}
                                              iconClassName='text-textSecondary'
                                              options={[
                                                {
                                                  text: 'View Details',
                                                  icon: 'tabler-eye',
                                                  menuItemProps: {
                                                    onClick: () => {
                                                      setSelectedSampleForDetails(sample)
                                                      setShowSampleDetails(true)
                                                    },
                                                    className: 'text-info'
                                                  }
                                                },
                                                {
                                                  text: 'Print Barcode',
                                                  icon: 'tabler-printer',
                                                  menuItemProps: {
                                                    onClick: () => {
                                                      setSelectedSample(sample)
                                                      setShowBarcodeDialog(true)
                                                    },
                                                    className: 'text-primary'
                                                  }
                                                },
                                                {
                                                  text: 'Add Remark',
                                                  icon: 'tabler-message',
                                                  menuItemProps: {
                                                    onClick: () => handleAddRemark(sample),
                                                    className: 'text-secondary'
                                                  }
                                                }
                                              ]}
                                            />
                                          </Box>
                                        </TableCell>
                                        <TableCell padding='checkbox'>
                                          <Checkbox
                                            checked={!!selectedSamples[sample.barcodeId || '']}
                                            onChange={() => sample.barcodeId && handleSampleSelect(sample.barcodeId)}
                                          />
                                        </TableCell>
                                        <TableCell>{sample.sampleId}</TableCell>
                                        <TableCell>{sample.barcodeId}</TableCell>
                                        <TableCell>{sample.sampleType}</TableCell>
                                        <TableCell>{sample.collectedBy}</TableCell>
                                        <TableCell>{formatDate(sample.collectedOn)}</TableCell>
                                        <TableCell>{sample.location}</TableCell>
                                        <TableCell>{sample.laboratory}</TableCell>
                                        <TableCell>
                                          <Chip label={collectionStatusObj[sample.collectionStatus]?.title} color={collectionStatusObj[sample.collectionStatus]?.color} size='small' />
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component='div'
            count={groupKeys.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={e => {
              setRowsPerPage(parseInt(e.target.value, 10))
              setPage(0)
            }}
          />
        </Paper>
      </Box>

      {/* Bulk Action Buttons */}
      <div className='flex items-center justify-center gap-4 p-4 border-t'>
        <Button
          variant='contained'
          color='warning'
          startIcon={<i className='tabler-external-link' />}
          disabled={!anySelected}
          onClick={handleBulkOutsource}
        >
          Outsource
        </Button>
        <Button
          variant='contained'
          color='success'
          startIcon={<i className='tabler-check' />}
          disabled={!anySelected}
          onClick={handleBulkCollect}
        >
          Collect
        </Button>
        <Button
          variant='contained'
          color='info'
          startIcon={<i className='tabler-printer' />}
          disabled={!anySelected}
          onClick={handleBulkPrintBarcode}
        >
          Print Barcode
        </Button>
        <Button
          variant='contained'
          color='error'
          startIcon={<i className='tabler-x' />}
          disabled={!anySelected}
          onClick={handleBulkReject}
        >
          Reject
        </Button>
        <Button
          variant='contained'
          color='error'
          startIcon={<i className='tabler-circle-x' />}
          disabled={!anySelected}
          onClick={handleBulkCancel}
        >
          Cancel
        </Button>
      </div>

      {/* Confirmation Dialogs */}
      <Dialog open={showBulkOutsourceConfirm} onClose={() => setShowBulkOutsourceConfirm(false)}>
        <DialogTitle>Confirm Outsource</DialogTitle>
        <DialogContent>Are you sure you want to outsource the selected samples?</DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBulkOutsourceConfirm(false)}>Cancel</Button>
          <Button onClick={handleBulkOutsourceConfirm} color='warning' variant='contained'>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showBulkCollectConfirm} onClose={() => setShowBulkCollectConfirm(false)}>
        <DialogTitle>Confirm Collection</DialogTitle>
        <DialogContent>Are you sure you want to collect the selected samples?</DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBulkCollectConfirm(false)}>Cancel</Button>
          <Button onClick={handleBulkCollectConfirm} color='success' variant='contained'>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showBulkPrintConfirm} onClose={() => setShowBulkPrintConfirm(false)}>
        <DialogTitle>Confirm Print</DialogTitle>
        <DialogContent>Are you sure you want to print barcodes for the selected samples?</DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBulkPrintConfirm(false)}>Cancel</Button>
          <Button onClick={handleBulkPrintBarcodeConfirm} color='info' variant='contained'>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showBulkRejectConfirm} onClose={() => setShowBulkRejectConfirm(false)}>
        <DialogTitle>Confirm Rejection</DialogTitle>
        <DialogContent>Are you sure you want to reject the selected samples?</DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBulkRejectConfirm(false)}>Cancel</Button>
          <Button onClick={handleBulkRejectConfirm} color='error' variant='contained'>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showVolumeInputDialog} onClose={() => setShowVolumeInputDialog(false)}>
        <DialogTitle>Add Sample Volume</DialogTitle>
        <DialogContent>
          <CustomTextField
            fullWidth
            label='Volume'
            type='number'
            value={volume}
            onChange={e => {
              const value = e.target.value

              if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 9999)) {
                setVolume(value)
              }
            }}
            inputProps={{ max: 9999, min: 0 }}
            error={volume !== '' && (parseInt(volume) < 0 || parseInt(volume) > 9999)}
            helperText={
              volume !== '' && (parseInt(volume) < 0 || parseInt(volume) > 9999)
                ? 'Please enter a valid number between 0 and 9999'
                : ''
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowVolumeInputDialog(false)}>Cancel</Button>
          <Button
            onClick={handleVolumeSubmit}
            color='primary'
            variant='contained'
            disabled={!volume || parseInt(volume) < 0 || parseInt(volume) > 9999}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showAuditTrailDialog} onClose={() => setShowAuditTrailDialog(false)} maxWidth='md' fullWidth>
        <DialogTitle>Audit Trail</DialogTitle>
        <DialogContent>
          <TableContainer component={Paper}>
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
                </TableRow>
              </TableHead>
              <TableBody>
                {auditTrailData.map((audit, index) => (
                  <TableRow key={index}>
                    <TableCell>{audit.action}</TableCell>
                    <TableCell>{audit.description}</TableCell>
                    <TableCell>{audit.triggeredBy}</TableCell>
                    <TableCell>{audit.triggeredOn}</TableCell>
                    <TableCell>{audit.status}</TableCell>
                    <TableCell>{audit.reason}</TableCell>
                    <TableCell>{audit.volunteerId}</TableCell>
                    <TableCell>{audit.barcodeId}</TableCell>
                  </TableRow>
                ))}
                {auditTrailData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align='center'>
                      No audit trail data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAuditTrailDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showSampleDetails} onClose={() => setShowSampleDetails(false)} maxWidth='md' fullWidth>
        <DialogTitle>
          <Typography variant='h5' component='div'>
            Sample Details
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant='subtitle2' color='text.secondary'>
                  Sample ID
                </Typography>
                <Typography variant='body1'>{selectedSampleForDetails?.sampleId || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant='subtitle2' color='text.secondary'>
                  Employee Name
                </Typography>
                <Typography variant='body1'>{selectedSampleForDetails?.employeeName || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant='subtitle2' color='text.secondary'>
                  Employee ID
                </Typography>
                <Typography variant='body1'>{selectedSampleForDetails?.employeeId || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant='subtitle2' color='text.secondary'>
                  Barcode ID
                </Typography>
                <Typography variant='body1'>{selectedSampleForDetails?.barcodeId || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant='subtitle2' color='text.secondary'>
                  Collected By
                </Typography>
                <Typography variant='body1'>{selectedSampleForDetails?.collectedBy || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant='subtitle2' color='text.secondary'>
                  Collected On
                </Typography>
                <Typography variant='body1'>{formatDate(selectedSampleForDetails?.collectedOn) || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant='subtitle2' color='text.secondary'>
                  Sample Type
                </Typography>
                <Typography variant='body1'>{selectedSampleForDetails?.sampleType || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant='subtitle2' color='text.secondary'>
                  Collection Status
                </Typography>
                <Typography variant='body1'>{selectedSampleForDetails?.collectionStatus || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant='subtitle2' color='text.secondary'>
                  Location
                </Typography>
                <Typography variant='body1'>{selectedSampleForDetails?.location || '-'}</Typography>
              </Grid> 
              <Grid item xs={12} sm={6}>
                <Typography variant='subtitle2' color='text.secondary'>
                  Laboratory
                </Typography>
                <Typography variant='body1'>{selectedSampleForDetails?.laboratory || '-'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant='subtitle2' color='text.secondary'>
                  Remarks
                </Typography>
                <Typography variant='body1'>{selectedSampleForDetails?.remarks || '-'}</Typography>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSampleDetails(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <BarcodePrintDialog
        open={showBarcodeDialog}
        setOpen={setShowBarcodeDialog}
        sampleId={selectedSample?.id || 0}
        barcodeId={selectedSample?.barcodeId || ''}
      />

      {/* Add Remark Dialog */}
      <Dialog open={showRemarkDialog} onClose={() => setShowRemarkDialog(false)} maxWidth='sm' fullWidth>
        <DialogTitle>
          <Typography variant='h5' component='div'>
            Add Remark
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <CustomTextField
              fullWidth
              multiline
              rows={4}
              label='Remark'
              value={remark}
              onChange={e => setRemark(e.target.value)}
              placeholder='Enter your remark here...'
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRemarkDialog(false)}>Cancel</Button>
          <Button onClick={handleRemarkSubmit} color='primary' variant='contained' disabled={!remark.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default SampleCollectionListTable
