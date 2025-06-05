'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import TablePagination from '@mui/material/TablePagination'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import classnames from 'classnames'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, ColumnDef, Table } from '@tanstack/react-table'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import tableStyles from '@core/styles/table.module.css'
import type { TextFieldProps } from '@mui/material/TextField'
import TableFilters from './TableFilters'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { UserOptions } from 'jspdf-autotable'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import TestSelectionDialog from './TestSelectionDialog'
import AuditTrailDialog from './AuditTrailDialog'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { useParams } from 'next/navigation'
import Chip from '@mui/material/Chip'
import Checkbox from '@mui/material/Checkbox'
import Menu from '@mui/material/Menu'
import CircularProgress from '@mui/material/CircularProgress'
import LinearProgress from '@mui/material/LinearProgress'
import { rankItem } from '@tanstack/match-sorter-utils'
import type { FilterFn } from '@tanstack/react-table'
import type { RankingInfo } from '@tanstack/match-sorter-utils'
import CustomTextField from '@core/components/mui/TextField'
import OptionMenu from '@core/components/option-menu'
import ConfirmDialog from '@/components/dialogs/ConfirmDialog/ConfirmDialog'
import { formatDate } from '@/utils/dateUtils'
import Grid from '@mui/material/Grid'

declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

type LabType = {
  id: number
  labName: string
  description?: string
  accountB2bCode?: string
  activeFlag: string
}

type TestType = {
  id: number
  testName: string
  analyteCode: string
  instrumentName: string
  sampleType: string
  isActive: boolean
}

type OutsourceType = {
  id: number
  date: string
  sampleId: string
  referenceId: string
  genderName: string
  parameter: string
  status: string
  laboratoryId?: number
  laboratory?: LabType
  selectedTests: TestType[]
  shipmentStatus?: string
  shipmentTrackingId?: string
  shipmentDate?: string
  processedDate?: string
}

type OutsourceWithActionsType = OutsourceType & {
  actions?: string
}

type StatusKey = 'null' | 1 | 2 | 3 | 4 | 5 | 6;
type StatusMapType = Record<StatusKey, { label: string; color: 'warning' | 'success' | 'error' | 'info' | 'secondary' }>;

type Props = {
  outsourceData?: OutsourceType[]
  onDataChange?: () => void
}

const statusOptions = [
  { value: '', label: 'Select' },
  { value: 'Pending', label: 'Pending' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Rejected', label: 'Rejected' }
]

const statusMap: StatusMapType = {
  'null': { label: 'Pending', color: 'warning' },
  1: { label: 'Received', color: 'success' },
  2: { label: 'Rejected', color: 'error' },
  3: { label: 'Pending', color: 'warning' },
  4: { label: 'In Progress', color: 'warning' },
  5: { label: 'Completed', color: 'info' },
  6: { label: 'Outsourced', color: 'secondary' }
}

const columnHelper = createColumnHelper<OutsourceWithActionsType>()

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <TextField
      {...props}
      value={value}
      onChange={e => setValue(e.target.value)}
      size="small"
      label={props.label || "Search"}
    />
  )
}

const OutsourceListTable = ({ outsourceData = [], onDataChange }: Props) => {
  const { lang: locale } = useParams()
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState<OutsourceType[]>(outsourceData)
  const [globalFilter, setGlobalFilter] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [isPdfLoading, setIsPdfLoading] = useState(false)
  const [laboratories, setLaboratories] = useState<LabType[]>([])
  const [tests, setTests] = useState<TestType[]>([])
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false)
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null)
  const [isAuditTrailDialogOpen, setIsAuditTrailDialogOpen] = useState(false)
  const [selectedAuditTrailId, setSelectedAuditTrailId] = useState<number | null>(null)
  const [isShipmentDialogOpen, setIsShipmentDialogOpen] = useState(false)
  const [selectedShipmentId, setSelectedShipmentId] = useState<number | null>(null)
  const [isProcessingDialogOpen, setIsProcessingDialogOpen] = useState(false)
  const [selectedProcessingId, setSelectedProcessingId] = useState<number | null>(null)
  const [showOutsourceConfirm, setShowOutsourceConfirm] = useState(false)
  const [selectedSamplesForOutsource, setSelectedSamplesForOutsource] = useState<number[]>([])
  const [isBulkOperationLoading, setIsBulkOperationLoading] = useState(false)
  const [bulkOperationProgress, setBulkOperationProgress] = useState(0)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedOutsourceDetails, setSelectedOutsourceDetails] = useState<OutsourceType | null>(null)

  useEffect(() => {
    setData(outsourceData)
  }, [outsourceData])

  // Fetch laboratories on component mount
  useEffect(() => {
    const fetchLaboratories = async () => {
      try {
        const response = await fetch('/api/apps/lims/lab-master')
        
        // Check if response is ok (status in the range 200-299)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        // Check content type to ensure we're getting JSON
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          throw new TypeError("Oops, we haven't got JSON!")
        }

        const result = await response.json()
        if (result.status === 'success') {
          setLaboratories(result.result)
        } else {
          throw new Error(result.message || 'Failed to fetch laboratories')
        }
      } catch (error) {
        console.error('Error fetching laboratories:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to fetch laboratories')
      }
    }

    fetchLaboratories()
  }, [])

  // Fetch tests on component mount
  useEffect(() => {
    const fetchTests = async () => {
      try {
        const response = await fetch('/api/apps/lims/analytecode-master/all')
        const result = await response.json()
        if (result.status === 'success') {
          setTests(result.result.map((test: any) => ({
            id: test.analyteId,
            testName: test.testName,
            analyteCode: test.analyteCode,
            instrumentName: test.instrumentName,
            sampleType: test.sampletype,
            isActive: test.isActive
          })))
        }
      } catch (error) {
        console.error('Error fetching tests:', error)
        toast.error('Failed to fetch tests')
      }
    }

    fetchTests()
  }, [])

  const handleStatusChange = (id: number, value: string) => {
    const updated = data.map(row =>
      row.id === id ? { ...row, status: value } : row
    )
    setData(updated)
    onDataChange?.()
  }

  const handleLaboratoryChange = (id: number, laboratoryId: number) => {
    const selectedLab = laboratories.find(lab => lab.id === laboratoryId)
    const updated = data.map(row =>
      row.id === id ? { ...row, laboratoryId, laboratory: selectedLab } : row
    )
    setData(updated)
    onDataChange?.()
  }

  const handleTestSelection = (id: number, selectedTests: TestType[]) => {
    const updated = data.map(row =>
      row.id === id ? { ...row, selectedTests } : row
    )
    setData(updated)
    onDataChange?.()
    setIsTestDialogOpen(false)
    setSelectedRowId(null)
  }

  const openTestDialog = (id: number) => {
    setSelectedRowId(id)
    setIsTestDialogOpen(true)
  }

  const handleViewAuditTrail = (id: number) => {
    setSelectedAuditTrailId(id)
    setIsAuditTrailDialogOpen(true)
  }

  const handleCloseAuditTrail = () => {
    setIsAuditTrailDialogOpen(false)
    setSelectedAuditTrailId(null)
  }

  const handleMarkForShipment = (id: number) => {
    setSelectedShipmentId(id)
    setIsShipmentDialogOpen(true)
  }

  const handleMarkAsProcessed = (id: number) => {
    setSelectedProcessingId(id)
    setIsProcessingDialogOpen(true)
  }

  const handleShipmentConfirm = async (trackingId: string) => {
    if (!selectedShipmentId) return

    try {
      const response = await fetch(`/api/apps/lims/outsource/${selectedShipmentId}/shipment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          trackingId,
          status: 'Shipped'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update shipment status')
      }

      const updated = data.map(row =>
        row.id === selectedShipmentId
          ? {
              ...row,
              shipmentStatus: 'Shipped',
              shipmentTrackingId: trackingId,
              shipmentDate: new Date().toISOString()
            }
          : row
      )
      setData(updated)
      onDataChange?.()
      toast.success('Sample marked for shipment successfully')
    } catch (error) {
      console.error('Error updating shipment status:', error)
      toast.error('Failed to update shipment status')
    } finally {
      setIsShipmentDialogOpen(false)
      setSelectedShipmentId(null)
    }
  }

  const handleProcessingConfirm = async () => {
    if (!selectedProcessingId) return

    try {
      const response = await fetch(`/api/apps/lims/outsource/${selectedProcessingId}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'Processed'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update processing status')
      }

      const updated = data.map(row =>
        row.id === selectedProcessingId
          ? {
              ...row,
              status: 'Processed',
              processedDate: new Date().toISOString()
            }
          : row
      )
      setData(updated)
      onDataChange?.()
      toast.success('Sample marked as processed successfully')
    } catch (error) {
      console.error('Error updating processing status:', error)
      toast.error('Failed to update processing status')
    } finally {
      setIsProcessingDialogOpen(false)
      setSelectedProcessingId(null)
    }
  }

  const handleFilterSearch = (filters: any) => {
    const filteredData = outsourceData.filter(item => {
      // Date range filter
      if (filters.fromDate && new Date(item.date) < filters.fromDate) return false
      if (filters.toDate && new Date(item.date) > filters.toDate) return false

      // Other filters
      if (filters.projectNo && item.referenceId !== filters.projectNo) return false
      if (filters.study && item.parameter !== filters.study) return false
      if (filters.testingStatus && item.status !== filters.testingStatus) return false
      if (filters.referenceId && item.referenceId !== filters.referenceId) return false
      if (filters.sampleType && item.parameter !== filters.sampleType) return false
      if (filters.location && item.parameter !== filters.location) return false
      if (filters.test && !item.selectedTests?.some(t => t.testName === filters.test)) return false
      if (filters.panel && item.parameter !== filters.panel) return false
      if (filters.lab && item.laboratory?.labName !== filters.lab) return false

      return true
    })

    setData(filteredData)
  }

  const handleFilterClear = () => {
    setData(outsourceData)
  }

  const handleViewDetails = (outsource: OutsourceType) => {
    setSelectedOutsourceDetails(outsource)
    setShowDetailsDialog(true)
  }

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <OptionMenu
              iconButtonProps={{ size: 'medium' }}
              iconClassName='text-textSecondary'
              options={[
                {
                  text: 'View Details',
                  icon: 'tabler-eye',
                  menuItemProps: {
                    onClick: () => handleViewDetails(row.original)
                  }
                },
                {
                  text: 'Mark for Shipment',
                  icon: 'tabler-truck',
                  menuItemProps: {
                    onClick: () => handleMarkForShipment(row.original.id),
                    disabled: !!row.original.shipmentStatus
                  }
                },
                {
                  text: 'Mark as Processed',
                  icon: 'tabler-check',
                  menuItemProps: {
                    onClick: () => handleMarkAsProcessed(row.original.id),
                    disabled: row.original.shipmentStatus !== 'Shipped' || row.original.status === 'Processed'
                  }
                },
                {
                  text: 'View Audit Trail',
                  icon: 'tabler-history',
                  menuItemProps: {
                    onClick: () => handleViewAuditTrail(row.original.id)
                  }
                }
              ]}
            />
          </div>
        )
      }),
      {
        id: 'select',
        header: ({ table }: { table: Table<OutsourceWithActionsType> }) => (
          <Checkbox
            {...{
              checked: table.getIsAllRowsSelected(),
              indeterminate: table.getIsSomeRowsSelected(),
              onChange: table.getToggleAllRowsSelectedHandler()
            }}
          />
        ),
        cell: ({ row }: { row: any }) => (
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
      columnHelper.accessor('date', {
        header: 'Date',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('sampleId', {
        header: 'Sample ID',
        cell: info => (
          <span style={{ color: "#388e3c", fontWeight: 600, cursor: "pointer" }}>
            {info.getValue()}
          </span>
        )
      }),
      columnHelper.accessor('referenceId', {
        header: 'Reference ID',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('genderName', {
        header: 'Gender Name',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('parameter', {
        header: 'Parameter',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('laboratory', {
        header: 'Laboratory',
        cell: info => (
          <Select
            value={info.row.original.laboratoryId || ''}
            onChange={e => handleLaboratoryChange(info.row.original.id, Number(e.target.value))}
            displayEmpty
            size="small"
          >
            <MenuItem value="">
              <em>Select Laboratory</em>
            </MenuItem>
            {laboratories.map(lab => (
              <MenuItem key={lab.id} value={lab.id}>
                {lab.labName}
              </MenuItem>
            ))}
          </Select>
        )
      }),
      columnHelper.accessor('selectedTests', {
        header: 'Tests',
        cell: info => (
          <div>
            <Button
              variant="outlined"
              size="small"
              onClick={() => openTestDialog(info.row.original.id)}
            >
              {info.row.original.selectedTests?.length || 0} Tests
            </Button>
          </div>
        )
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: info => (
          <Select
            value={info.row.original.status}
            onChange={e => handleStatusChange(info.row.original.id, e.target.value)}
            displayEmpty
            size="small"
          >
            {statusOptions.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        )
      }),
      columnHelper.accessor('shipmentStatus', {
        header: 'Shipment Status',
        cell: info => (
          <div className="flex items-center gap-2">
            <span>{info.getValue() || 'Not Shipped'}</span>
            {info.getValue() === 'Shipped' && (
              <span className="text-xs text-gray-500">
                ({info.row.original.shipmentTrackingId})
              </span>
            )}
          </div>
        )
      }),
    ],
    [data, laboratories, tests]
  )

  // Add fuzzyFilter function for global filtering
  const fuzzyFilter = (row: any, columnId: string, value: string) => {
    const rowValue = row.getValue(columnId)
    return String(rowValue ?? '')
      .toLowerCase()
      .includes(String(value ?? '').toLowerCase())
  }

  const table = useReactTable({
    data,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    globalFilterFn: fuzzyFilter,
    state: { rowSelection, globalFilter },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const response = await fetch('/api/apps/lims/outsource?action=download', {
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
      a.download = `Outsource_List_${new Date().toISOString().replace(/[:.]/g, '_')}.csv`;
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
      doc.text('Outsource List', 14, 15);
      
      // Add date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

      // Prepare table data
      const tableData = data.map(item => [
        item.date || '-',
        item.sampleId || '-',
        item.referenceId || '-',
        item.genderName || '-',
        item.parameter || '-',
        item.status || '-',
        item.laboratory?.labName || '-',
        item.shipmentStatus || '-',
        item.shipmentTrackingId || '-',
        item.shipmentDate || '-',
        item.processedDate || '-'
      ]);

      // Add table using autoTable
      autoTable(doc, {
        head: [['Date', 'Sample ID', 'Reference ID', 'Gender', 'Parameter', 'Status', 'Laboratory', 'Shipment Status', 'Tracking ID', 'Shipment Date', 'Processed Date']],
        body: tableData,
        startY: 30,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 30 }
      });

      // Save the PDF
      doc.save(`outsource-list-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF file downloaded successfully');
    } catch (error) {
      console.error('PDF export failed:', error);
      toast.error('Failed to download PDF file');
    } finally {
      setIsPdfLoading(false)
    }
  }

  const handleBulkOutsource = () => {
    const selectedIds = Object.keys(rowSelection).map(key => data[parseInt(key)].id)
    if (selectedIds.length > 0) {
      setSelectedSamplesForOutsource(selectedIds)
      setShowOutsourceConfirm(true)
    }
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
            const response = await fetch('/api/apps/lims/outsource?action=status', {
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
      const response = await fetch('/api/apps/lims/outsource')
      const newData = await response.json()
      setData(newData)
      onDataChange?.()
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
        title="Outsource List" 
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
        <div className="flex items-center gap-4">
          <DebouncedInput
            value={globalFilter ?? ''}
            onChange={value => setGlobalFilter(String(value))}
            placeholder='Search Outsource'
            className='max-sm:is-full'
          />
          {Object.keys(rowSelection).length > 0 && (
            <div className="text-sm text-gray-600">
              {Object.keys(rowSelection).length} row(s) selected
            </div>
          )}
        </div>
      </div>
      <TableFilters
        setData={setData}
        testData={outsourceData}
      />
            
      <div className='overflow-x-auto'>
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
                        }[header.column.getIsSorted() as 'asc' | 'desc'] ?? null}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          {table.getFilteredRowModel().rows.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                  No data available
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody>
              {table
                .getRowModel()
                .rows.slice(0, table.getState().pagination.pageSize)
                .map(row => (
                  <tr 
                    key={row.id} 
                    className={classnames({ selected: row.getIsSelected() })}
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))}
            </tbody>
          )}
        </table>
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

      {/* Add bulk action buttons */}
      <div className='flex items-center justify-center gap-4 p-4 border-t'>
        <Button
          variant='contained'
          startIcon={<i className='tabler-external-link' />}
          disabled={Object.keys(rowSelection).length === 0}
          onClick={handleBulkOutsource}
        >
          Outsource Selected
        </Button>
        <Button
          variant='contained'
          startIcon={<i className='tabler-file-type-pdf' />}
          disabled={Object.keys(rowSelection).length === 0}
          onClick={handlePdfExport}
        >
          Export Selected
        </Button>
        <Button
          variant='contained'
          startIcon={<i className='tabler-file-spreadsheet' />}
          disabled={Object.keys(rowSelection).length === 0}
          onClick={handleExport}
        >
          Download Outsource Sample
        </Button>
      </div>

      {/* Test Selection Dialog */}
      {isTestDialogOpen && selectedRowId !== null && (
        <TestSelectionDialog
          open={isTestDialogOpen}
          onClose={() => {
            setIsTestDialogOpen(false)
            setSelectedRowId(null)
          }}
          tests={tests}
          selectedTests={data.find(row => row.id === selectedRowId)?.selectedTests || []}
          onSave={(selectedTests) => handleTestSelection(selectedRowId, selectedTests)}
        />
      )}

      <AuditTrailDialog
        open={isAuditTrailDialogOpen}
        onClose={handleCloseAuditTrail}
        outsourceId={selectedAuditTrailId || 0}
      />

      {/* Shipment Dialog */}
      <Dialog
        open={isShipmentDialogOpen}
        onClose={() => {
          setIsShipmentDialogOpen(false)
          setSelectedShipmentId(null)
        }}
      >
        <DialogTitle>Mark for Shipment</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Tracking ID"
            type="text"
            fullWidth
            variant="outlined"
            onChange={(e) => handleShipmentConfirm(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setIsShipmentDialogOpen(false)
              setSelectedShipmentId(null)
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Processing Dialog */}
      <Dialog
        open={isProcessingDialogOpen}
        onClose={() => {
          setIsProcessingDialogOpen(false)
          setSelectedProcessingId(null)
        }}
      >
        <DialogTitle>Mark as Processed</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to mark this sample as processed?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setIsProcessingDialogOpen(false)
              setSelectedProcessingId(null)
            }}
          >
            Cancel
          </Button>
          <Button
            color="primary"
            onClick={handleProcessingConfirm}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

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

      {/* Add Details Dialog */}
      <Dialog
        open={showDetailsDialog}
        onClose={() => {
          setShowDetailsDialog(false)
          setSelectedOutsourceDetails(null)
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Outsource Details</DialogTitle>
        <DialogContent>
          {selectedOutsourceDetails && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Sample ID</Typography>
                  <Typography>{selectedOutsourceDetails.sampleId}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Reference ID</Typography>
                  <Typography>{selectedOutsourceDetails.referenceId}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Date</Typography>
                  <Typography>{formatDate(selectedOutsourceDetails.date)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Gender</Typography>
                  <Typography>{selectedOutsourceDetails.genderName}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Parameter</Typography>
                  <Typography>{selectedOutsourceDetails.parameter}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Status</Typography>
                  <Typography>{selectedOutsourceDetails.status}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Laboratory</Typography>
                  <Typography>{selectedOutsourceDetails.laboratory?.labName || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Shipment Status</Typography>
                  <Typography>{selectedOutsourceDetails.shipmentStatus || 'Not Shipped'}</Typography>
                </Grid>
                {selectedOutsourceDetails.shipmentTrackingId && (
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Tracking ID</Typography>
                    <Typography>{selectedOutsourceDetails.shipmentTrackingId}</Typography>
                  </Grid>
                )}
                {selectedOutsourceDetails.shipmentDate && (
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Shipment Date</Typography>
                    <Typography>{formatDate(selectedOutsourceDetails.shipmentDate)}</Typography>
                  </Grid>
                )}
                {selectedOutsourceDetails.processedDate && (
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Processed Date</Typography>
                    <Typography>{formatDate(selectedOutsourceDetails.processedDate)}</Typography>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Selected Tests</Typography>
                  <Box sx={{ mt: 1 }}>
                    {selectedOutsourceDetails.selectedTests?.map((test, index) => (
                      <Chip
                        key={test.id}
                        label={test.testName}
                        size="small"
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowDetailsDialog(false)
            setSelectedOutsourceDetails(null)
          }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default OutsourceListTable
