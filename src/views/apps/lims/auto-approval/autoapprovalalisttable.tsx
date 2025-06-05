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
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable, getFilteredRowModel, getPaginationRowModel, getSortedRowModel } from '@tanstack/react-table'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import tableStyles from '@core/styles/table.module.css'
import type { TextFieldProps } from '@mui/material/TextField'
import TableFilters from './TableFilters'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { UserOptions } from 'jspdf-autotable'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import Box from '@mui/material/Box'

type AutoApprovalType = {
  id: number
  testName: string
  analyteCode: string
  instrumentName: string
  referenceRange: string
  approvalCondition: string
  effectiveDate: string
  version: number
  status: string
}

type Props = {
  autoApprovalData: AutoApprovalType[]
  onDataChange: () => Promise<void>
  autoApprovalEnabled: boolean
}

const columnHelper = createColumnHelper<AutoApprovalType>()

const AutoApprovalListTable = ({ autoApprovalData = [], onDataChange, autoApprovalEnabled }: Props) => {
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState<AutoApprovalType[]>(autoApprovalData)
  const [globalFilter, setGlobalFilter] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [isPdfLoading, setIsPdfLoading] = useState(false)
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false)
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null)
  const [effectiveDate, setEffectiveDate] = useState<Date | null>(null)

  useEffect(() => {
    setData(autoApprovalData)
  }, [autoApprovalData])

  const handleStatusChange = (id: number, value: string) => {
    const updated = data.map(row =>
      row.id === id ? { ...row, status: value } : row
    )
    setData(updated)
    onDataChange?.()
  }

  const handleConfigClick = (id: number) => {
    setSelectedRowId(id)
    setIsConfigDialogOpen(true)
  }

  const handleCloseConfig = () => {
    setIsConfigDialogOpen(false)
    setSelectedRowId(null)
    setEffectiveDate(null)
  }

  const handleSaveConfig = () => {
    if (!effectiveDate) {
      toast.error('Please select an effective date')
      return
    }

    // Here you would typically make an API call to save the configuration
    toast.success('Configuration saved successfully')
    handleCloseConfig()
  }

  const handleExportCSV = () => {
    setIsExporting(true)
    try {
      const headers = ['Test Name', 'Analyte Code', 'Instrument', 'Reference Range', 'Approval Condition', 'Effective Date', 'Version', 'Status']
      const csvData = data.map(row => [
        row.testName || '-',
        row.analyteCode || '-',
        row.instrumentName || '-',
        row.referenceRange || '-',
        row.approvalCondition || '-',
        row.effectiveDate || '-',
        row.version || '-',
        row.status || '-'
      ])

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n')

      const timestamp = new Date().toISOString().split('T')[0]
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `auto-approval-config-${timestamp}.csv`
      link.click()
      toast.success('CSV file downloaded successfully')
    } catch (error) {
      console.error('Error exporting CSV:', error)
      toast.error('Failed to download CSV file')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportPDF = () => {
    setIsPdfLoading(true)
    try {
      const doc = new jsPDF()
      
      // Add title
      doc.setFontSize(16)
      doc.text('Auto-Approval Configuration', 14, 15)
      
      // Add date
      doc.setFontSize(10)
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22)

      // Prepare table data
      const tableData = data.map(row => [
        row.testName || '-',
        row.analyteCode || '-',
        row.instrumentName || '-',
        row.referenceRange || '-',
        row.approvalCondition || '-',
        row.effectiveDate || '-',
        row.version || '-',
        row.status || '-'
      ])

      // Add table
      autoTable(doc, {
        head: [['Test Name', 'Analyte Code', 'Instrument', 'Reference Range', 'Approval Condition', 'Effective Date', 'Version', 'Status']],
        body: tableData,
        startY: 30,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 30 }
      })

      // Save the PDF
      const timestamp = new Date().toISOString().split('T')[0]
      doc.save(`auto-approval-config-${timestamp}.pdf`)
      toast.success('PDF file downloaded successfully')
    } catch (error) {
      console.error('Error exporting PDF:', error)
      toast.error('Failed to download PDF file')
    } finally {
      setIsPdfLoading(false)
    }
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor('testName', {
        header: 'Test Name',
        cell: (info: { getValue: () => string }) => info.getValue()
      }),
      columnHelper.accessor('analyteCode', {
        header: 'Analyte Code',
        cell: (info: { getValue: () => string }) => info.getValue()
      }),
      columnHelper.accessor('instrumentName', {
        header: 'Instrument',
        cell: (info: { getValue: () => string }) => info.getValue()
      }),
      columnHelper.accessor('referenceRange', {
        header: 'Reference Range',
        cell: (info: { getValue: () => string }) => info.getValue()
      }),
      columnHelper.accessor('approvalCondition', {
        header: 'Approval Condition',
        cell: (info: { getValue: () => string }) => info.getValue()
      }),
      columnHelper.accessor('effectiveDate', {
        header: 'Effective Date',
        cell: (info: { getValue: () => string }) => info.getValue()
      }),
      columnHelper.accessor('version', {
        header: 'Version',
        cell: (info: { getValue: () => number }) => info.getValue()
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info: { row: { original: AutoApprovalType } }) => (
          <Select
            value={info.row.original.status}
            onChange={e => handleStatusChange(info.row.original.id, e.target.value)}
            displayEmpty
            size="small"
            disabled={!autoApprovalEnabled}
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
        )
      }),
      {
        id: 'actions',
        header: 'Actions',
        cell: (info: { row: { original: AutoApprovalType } }) => (
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleConfigClick(info.row.original.id)}
            disabled={!autoApprovalEnabled}
          >
            Configure
          </Button>
        )
      }
    ],
    [handleStatusChange, autoApprovalEnabled]
  )

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
    state: {
      rowSelection,
      globalFilter
    },
    initialState: {
      pagination: {
        pageSize: 10
      }
    },
    enableRowSelection: true,
    globalFilterFn: fuzzyFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  return (
    <Card>
      <CardHeader
        title="Auto-Approval Configuration"
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
              onClick={handleExportCSV}
              disabled={isExporting || !autoApprovalEnabled}
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
              onClick={handleExportPDF}
              disabled={isPdfLoading || !autoApprovalEnabled}
            >
              {isPdfLoading ? 'Exporting...' : 'PDF'}
            </Button>
          </Box>
        }
      />
      <Divider />
      <TableFilters
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
      />
      <div className="overflow-x-auto">
        <table className={tableStyles.table}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getFilteredRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={table.getVisibleFlatColumns().length} className="text-center">
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

      {/* Configuration Dialog */}
      <Dialog open={isConfigDialogOpen} onClose={handleCloseConfig} maxWidth="md" fullWidth>
        <DialogTitle>Configure Auto-Approval Criteria</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Test Information
              </Typography>
              {selectedRowId && (
                <div>
                  <Typography>Test Name: {data.find(row => row.id === selectedRowId)?.testName}</Typography>
                  <Typography>Analyte Code: {data.find(row => row.id === selectedRowId)?.analyteCode}</Typography>
                  <Typography>Instrument: {data.find(row => row.id === selectedRowId)?.instrumentName}</Typography>
                </div>
              )}
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Reference Range
              </Typography>
              <Typography>
                {selectedRowId && data.find(row => row.id === selectedRowId)?.referenceRange}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Effective Date
              </Typography>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  value={effectiveDate}
                  onChange={(newValue: Date | null) => setEffectiveDate(newValue)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfig}>Cancel</Button>
          <Button onClick={handleSaveConfig} variant="contained" color="primary">
            Save Configuration
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default AutoApprovalListTable 