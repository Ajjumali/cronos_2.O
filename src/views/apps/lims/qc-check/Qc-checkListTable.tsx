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
import Menu from '@mui/material/Menu'
import classnames from 'classnames'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import tableStyles from '@core/styles/table.module.css'
import type { TextFieldProps } from '@mui/material/TextField'
import TableFilters from './TableFilters'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { UserOptions } from 'jspdf-autotable'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import LinearProgress from '@mui/material/LinearProgress'
import { rankItem } from '@tanstack/match-sorter-utils'
import type { FilterFn } from '@tanstack/react-table'
import type { RankingInfo } from '@tanstack/match-sorter-utils'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import type { QcCheckType } from '@/types/qc-check'

declare global {
  interface Window {
    jspdf: {
      jsPDF: typeof jsPDF
    }
  }
}

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: UserOptions) => jsPDF
  }
}

declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

type Props = {
  qcData?: QcCheckType[]
  onDataChange?: () => void
}

const columnHelper = createColumnHelper<QcCheckType>()

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

  return (
    <TextField
      {...props}
      value={value}
      onChange={e => setValue(e.target.value)}
      size='small'
      label={props.label || 'Search'}
    />
  )
}

const QcCheckListTable = ({ qcData = [], onDataChange }: Props) => {
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [filteredData, setFilteredData] = useState<QcCheckType[]>([])
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null)
  const [isPdfLoading, setIsPdfLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isBulkOperationLoading, setIsBulkOperationLoading] = useState(false)
  const [bulkOperationProgress, setBulkOperationProgress] = useState(0)
  const [showBulkConfirm, setShowBulkConfirm] = useState(false)
  const [selectedSamplesForBulk, setSelectedSamplesForBulk] = useState<number[]>([])

  // Update filtered data when qcData changes
  useEffect(() => {
    setFilteredData(qcData)
  }, [qcData])

  const handleExportClick = (event: React.MouseEvent<HTMLElement>) => {
    setExportAnchorEl(event.currentTarget)
  }

  const handleExportClose = () => {
    setExportAnchorEl(null)
  }

  const exportToCSV = () => {
    setIsExporting(true)
    // Get the current filtered data
    const dataToExport = table.getFilteredRowModel().rows.map(row => ({
      'Sr. No.': row.original.srNo,
      'Test Name': row.original.testName,
      'Instrument Name': row.original.instrumentName,
      'Level 1': row.original.level1,
      'Level 2': row.original.level2,
      'Level 3': row.original.level3,
      'Done On': row.original.doneOn,
      'Done By': row.original.doneBy,
      Profile: row.original.profile
    }))

    // Convert to CSV
    const headers = Object.keys(dataToExport[0])
    const csvContent = [
      headers.join(','), // Header row
      ...dataToExport.map(row =>
        headers
          .map(header => {
            const value = row[header as keyof typeof row]
            // Handle values that might contain commas
            return typeof value === 'string' && value.includes(',') ? `"${value}"` : value
          })
          .join(',')
      )
    ].join('\n')

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `qc-results-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    handleExportClose()
    setIsExporting(false)
  }

  const exportToPDF = () => {
    setIsPdfLoading(true)
    const doc = new jsPDF()

    // Add title
    doc.setFontSize(16)
    doc.text('QC Check List', 14, 15)

    // Add date
    doc.setFontSize(10)
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22)

    // Prepare table data
    const tableData = table
      .getFilteredRowModel()
      .rows.map(row => [
        row.original.srNo,
        row.original.testName,
        row.original.instrumentName,
        row.original.level1,
        row.original.level2,
        row.original.level3,
        row.original.doneOn,
        row.original.doneBy,
        row.original.profile
      ])

    // Add table
    autoTable(doc, {
      head: [
        ['Sr. No.', 'Test Name', 'Instrument Name', 'Level 1', 'Level 2', 'Level 3', 'Done On', 'Done By', 'Profile']
      ],
      body: tableData,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { top: 30 }
    })

    // Save the PDF
    doc.save(`qc-results-${new Date().toISOString().split('T')[0]}.pdf`)
    handleExportClose()
    setIsPdfLoading(false)
  }

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllRowsSelected()}
            indeterminate={table.getIsSomeRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            indeterminate={row.getIsSomeSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        )
      }),
      columnHelper.accessor('srNo', {
        header: 'Sr. No.',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('testName', {
        header: 'Test Name',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('instrumentName', {
        header: 'Instrument Name',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('level1', {
        header: 'Level 1',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('level2', {
        header: 'Level 2',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('level3', {
        header: 'Level 3',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('doneOn', {
        header: 'Done On',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('doneBy', {
        header: 'Done By',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('profile', {
        header: 'Profile',
        cell: info => info.getValue()
      })
    ],
    []
  )

  const fuzzyFilter = (row: any, columnId: string, value: string) => {
    const rowValue = row.getValue(columnId)
    return String(rowValue ?? '')
      .toLowerCase()
      .includes(String(value ?? '').toLowerCase())
  }

  const table = useReactTable({
    data: filteredData,
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
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10
      }
    }
  })

  const handleBulkOperation = () => {
    const selectedRows = table.getSelectedRowModel().rows
    if (selectedRows.length === 0) {
      toast.warning('Please select at least one row')
      return
    }
    setSelectedSamplesForBulk(selectedRows.map(row => row.original.id))
    setShowBulkConfirm(true)
  }

  const handleBulkConfirm = async () => {
    setIsBulkOperationLoading(true)
    setBulkOperationProgress(0)

    try {
      // Simulate bulk operation with progress
      const total = selectedSamplesForBulk.length
      for (let i = 0; i < total; i++) {
        // Update progress
        setBulkOperationProgress(Math.round(((i + 1) / total) * 100))

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      toast.success('Bulk operation completed successfully')
      onDataChange?.()
    } catch (error) {
      toast.error('Failed to perform bulk operation')
      console.error('Bulk operation error:', error)
    } finally {
      setIsBulkOperationLoading(false)
      setShowBulkConfirm(false)
      setSelectedSamplesForBulk([])
      setBulkOperationProgress(0)
    }
  }

  const BulkOperationProgress = () => (
    <div className='p-4'>
      <div className='flex items-center justify-between mb-2'>
        <Typography variant='body2'>Processing...</Typography>
        <Typography variant='body2'>{bulkOperationProgress}%</Typography>
      </div>
      <LinearProgress variant='determinate' value={bulkOperationProgress} />
    </div>
  )

  return (
    <Card>
      <CardHeader
        title='QC Check List'
        action={
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant='outlined'
              startIcon={
                isExporting ? <i className='tabler-loader animate-spin' /> : <i className='tabler-file-spreadsheet' />
              }
              onClick={exportToCSV}
              disabled={isExporting}
            >
              {isExporting ? 'Exporting...' : 'Excel'}
            </Button>
            <Button
              variant='outlined'
              startIcon={
                isPdfLoading ? <i className='tabler-loader animate-spin' /> : <i className='tabler-file-text' />
              }
              onClick={exportToPDF}
              disabled={isPdfLoading}
            >
              {isPdfLoading ? 'Exporting...' : 'PDF'}
            </Button>
          </Box>
        }
      />
      <Divider />
      <div className='flex flex-wrap gap-4 p-6 items-center'>
        <DebouncedInput
          value={globalFilter ?? ''}
          onChange={value => setGlobalFilter(String(value))}
          placeholder='Search QC Check'
          className='max-sm:is-full'
        />
      </div>
      <TableFilters setData={setFilteredData} qcData={qcData} />

      <div className='overflow-x-auto' style={{ maxHeight: '600px' }}>
        <table className={tableStyles.table}>
          <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
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
          <tbody>
            {table.getFilteredRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                  No data available
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
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

      {showBulkConfirm && (
        <Dialog
          open={showBulkConfirm}
          onClose={() => !isBulkOperationLoading && setShowBulkConfirm(false)}
          maxWidth='sm'
          fullWidth
        >
          <DialogTitle>Confirm Bulk Operation</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to mark {selectedSamplesForBulk.length} selected items as Pass?
            </Typography>
            {isBulkOperationLoading && <BulkOperationProgress />}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowBulkConfirm(false)} disabled={isBulkOperationLoading}>
              Cancel
            </Button>
            <Button onClick={handleBulkConfirm} color='primary' disabled={isBulkOperationLoading}>
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Card>
  )
}

export default QcCheckListTable
