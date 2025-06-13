'use client'

// React Imports
import { useEffect, useMemo, useState } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import TablePagination from '@mui/material/TablePagination'
import Typography from '@mui/material/Typography'
import type { TextFieldProps } from '@mui/material/TextField'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import {
  Print as PrintIcon,
  Info as InfoIcon,
  Description as DescriptionIcon,
  Message as MessageIcon
} from '@mui/icons-material'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { toast } from 'react-toastify'

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

// Type Imports
import type { ThemeColor } from '@core/types'
import { InstrumentType } from '@/types/apps/limsTypes'
import { formatDate } from '@/utils/dateUtils'

// Component Imports
import AddInstrumentDrawer from './AddInstrumentDrawer'
import CustomTextField from '@core/components/mui/TextField'
import ConfirmDialog from '@/components/dialogs/ConfirmDialog/ConfirmDialog'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import ReasonInputDialog from '@/components/dialogs/ReasonInputDialog/ReasonInputDialog'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

type InstrumentWithActionsType = InstrumentType & {
  actions?: string
}

type InstrumentCategoryType = {
  [key: string]: {
    icon: string
    color: ThemeColor
  }
}

type instrumentStatusType = {
  [key: string]: {
    title: string
    color: ThemeColor
  }
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  // Rank the item
  const itemRank = rankItem(row.getValue(columnId), value)

  // Store the itemRank info
  addMeta({
    itemRank
  })

  // Return if the item should be filtered in/out
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
  // States
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

  return <CustomTextField {...props} value={value} onChange={e => setValue(e.target.value)} />
}

const instrumentStatusObj: instrumentStatusType = {
  Active: { title: 'Active', color: 'success' },
  Maintenance: { title: 'Maintenance', color: 'warning' },
  Inactive: { title: 'Inactive', color: 'error' }
}

// Column Definitions
const columnHelper = createColumnHelper<InstrumentWithActionsType>()

type Props = {
  instrumentData?: InstrumentType[]
  onDataChange?: () => void
}

const InstrumentListTable = ({ instrumentData = [], onDataChange }: Props) => {
  // States
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState<InstrumentType[]>(instrumentData)
  const [filteredData, setFilteredData] = useState<InstrumentType[]>(instrumentData)
  const [globalFilter, setGlobalFilter] = useState('')
  const [instrumentDrawerOpen, setInstrumentDrawerOpen] = useState(false)
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentType | null>(null)
  const [isPdfLoading, setIsPdfLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [deleteId, setDeleteId] = useState<InstrumentType['instrumentId'] | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isReasonDialogOpen, setIsReasonDialogOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<'update' | 'delete' | null>(null)
  const [pendingData, setPendingData] = useState<InstrumentType | null>(null)
  const [filters, setFilters] = useState({
    dateRange: { from: null, to: null },
    department: '',
    instrumentId: '',
    status: '',
    manufacturer: '',
    model: ''
  })
  // Hooks
  const { lang: locale } = useParams()
  const handleDeleteRecord = async () => {
    if (deleteId !== null) {
      try {
        // First close the confirmation dialog
        handleCloseDelete()
        // Then open the reason dialog
        setPendingAction('delete')
        setPendingData(data.find(instrument => instrument.instrumentId === deleteId) || null)
        setIsReasonDialogOpen(true)
      } catch (error) {
        console.error('Error initiating delete:', error)
        toast.error('Failed to initiate deletion')
      }
    }
  }
  const handleEditInstrument = (instrument: InstrumentType) => {
    setSelectedInstrument(instrument)
    setInstrumentDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setInstrumentDrawerOpen(false)
    setSelectedInstrument(null)
  }
  const handleCloseDelete = () => {
    setDeleteId(null)
    setIsDeleteDialogOpen(false)
    setIsReasonDialogOpen(false)
    setPendingAction(null)
    setPendingData(null)
  }
  const handleConfirmDelete = () => {
    setIsDeleteDialogOpen(false)
    setIsReasonDialogOpen(true)
  }
  const handleDrawerDataChange = (updatedInstrument: InstrumentType) => {
    setPendingAction('update')
    setPendingData(updatedInstrument)
    setIsReasonDialogOpen(true)
  }
  const columns = useMemo<ColumnDef<InstrumentWithActionsType, any>[]>(
    () => [
      columnHelper.accessor('actions', {
        header: 'Actions',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            <IconButton onClick={() => handleEditInstrument(row.original)}>
              <i className='tabler-edit text-textSecondary' />
            </IconButton>
            <IconButton
              onClick={() => {
                setDeleteId(row.original.instrumentId)
                setIsDeleteDialogOpen(true)
              }}
            >
              <i className='tabler-trash text-textSecondary' />
            </IconButton>
          </div>
        ),
        enableSorting: false
      }),

      columnHelper.accessor('instrumentName', {
        header: 'Instrument Name',
        cell: ({ row }) => <Typography>{row.original.instrumentName}</Typography>
      }),
      columnHelper.accessor('categoryName', {
        header: 'Category',
        cell: ({ row }) => <Typography>{row.original.categoryName}</Typography>
      }),
      columnHelper.accessor('port', {
        header: 'Port',
        cell: ({ row }) => <Typography>{row.original.port || '-'}</Typography>
      }),
      columnHelper.accessor('ipAddress', {
        header: 'IP Address',
        cell: ({ row }) => <Typography>{row.original.ipAddress || '-'}</Typography>
      }),
      columnHelper.accessor('instrumentSerialNumber', {
        header: 'Serial Number',
        cell: ({ row }) => <Typography>{row.original.instrumentSerialNumber || '-'}</Typography>
      }),
      columnHelper.accessor('isActive', {
        header: 'Status',
        cell: ({ row }) => (
          <Chip
            label={instrumentStatusObj[row.original.isActive ? 'Active' : 'Inactive'].title}
            variant='tonal'
            color={instrumentStatusObj[row.original.isActive ? 'Active' : 'Inactive'].color}
            size='small'
          />
        )
      }),

      columnHelper.accessor('updatedBy', {
        header: 'Performed By',
        cell: ({ row }) => <Typography>{row.original.updatedBy}</Typography>
      }),
      columnHelper.accessor('updatedOn', {
        header: 'Performed On',
        cell: ({ row }) => <Typography>{formatDate(row.original.updatedOn)}</Typography>
      })
    ],
    []
  )

  const table = useReactTable({
    data: filteredData ?? [],
    columns,
    filterFns: { fuzzy: fuzzyFilter },
    state: { rowSelection, globalFilter },
    initialState: {
      pagination: { pageSize: 10 },
      sorting: [
        {
          id: 'updatedOn',
          desc: true
        }
      ]
    },
    enableRowSelection: true,
    globalFilterFn: fuzzyFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

  // Export handler function
  const handleExport = async () => {
    setIsExporting(true)
    try {
      const response = await fetch('/api/apps/lims/Instrument-master/download?fileType=CSV')
      if (!response.ok) {
        throw new Error('Failed to download CSV file')
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Instrument_${new Date().toISOString().replace(/[:.]/g, '_')}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('CSV file downloaded successfully')
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to download CSV file')
    } finally {
      setIsExporting(false)
    }
  }

  // PDF export handler function
  const handlePdfExport = async () => {
    setIsPdfLoading(true)
    try {
      const response = await fetch('/api/apps/lims/Instrument-master/download?fileType=PDF')
      if (!response.ok) {
        throw new Error('Failed to download PDF file')
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Instrument_${new Date().toISOString().replace(/[:.]/g, '_')}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('PDF file downloaded successfully')
    } catch (error) {
      console.error('PDF export failed:', error)
      toast.error('Failed to download PDF file')
    } finally {
      setIsPdfLoading(false)
    }
  }

  const handleAddInstrument = () => {
    setSelectedInstrument(null)
    setInstrumentDrawerOpen(true)
  }

  const handleReasonSubmit = async (reason: string) => {
    if (!reason.trim()) {
      toast.error('Please provide a reason')
      return
    }

    if (!pendingData || !pendingData.instrumentId) {
      toast.error('Invalid instrument data. Please try again.')
      return
    }

    try {
      if (pendingAction === 'update') {
        // Send the update with the reason
        const response = await fetch(`/api/apps/lims/Instrument-master/${pendingData.instrumentId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...pendingData,
            reason: reason
          })
        })

        if (!response.ok) {
          throw new Error('Failed to update instrument')
        }

        // Update the local state
        const updatedData = data.map(instrument =>
          instrument.instrumentId === pendingData.instrumentId ? pendingData : instrument
        )
        setData(updatedData)
        setFilteredData(updatedData)

        toast.success('Record Updated successfully')
        onDataChange?.()
      } else if (pendingAction === 'delete') {
        // Perform the actual deletion with the reason
        const response = await fetch(
          `/api/apps/lims/Instrument-master/${pendingData.instrumentId}?reason=${encodeURIComponent(reason)}`,
          {
            method: 'DELETE'
          }
        )

        if (!response.ok) {
          throw new Error('Failed to delete instrument')
        }

        // Update the local state
        const updatedData = data.filter(instrument => instrument.instrumentId !== pendingData.instrumentId)
        setData(updatedData)
        setFilteredData(updatedData)

        toast.success('Record deleted successfully')
        onDataChange?.()
      }
    } catch (error) {
      console.error(`Error ${pendingAction}ing instrument:`, error)
      toast.error(`Failed to ${pendingAction} instrument`)
    } finally {
      handleCloseDelete()
    }
  }

  const handleFilterChange = (
    key: keyof typeof filters,
    value: string | Date | { from: Date | null; to: Date | null }
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      dateRange: { from: null, to: null },
      department: '',
      instrumentId: '',
      status: '',
      manufacturer: '',
      model: ''
    })
  }

  const handlePrintInstrument = (instrument: InstrumentType) => {
    try {
      const doc = new jsPDF()

      // Add instrument details
      doc.setFontSize(16)
      doc.text('Instrument Details', 14, 15)

      doc.setFontSize(10)
      doc.text(`Instrument ID: ${instrument.instrumentId}`, 14, 25)
      doc.text(`Name: ${instrument.instrumentName}`, 14, 32)
      //doc.text(`Model: ${instrument.model}`, 14, 39);
      doc.text(`Performed By: ${instrument.updatedBy}`, 14, 46)
      doc.text(`Serial Number: ${instrument.instrumentSerialNumber}`, 14, 53)
      doc.text(`Status: ${instrument.isActive ? 'Active' : 'Inactive'}`, 14, 60)
      doc.text(`Category: ${instrument.categoryName}`, 14, 67)
      doc.text(`Port: ${instrument.port || '-'}`, 14, 74)
      doc.text(`IP Address: ${instrument.ipAddress || '-'}`, 14, 81)
      doc.text(`Last Calibration: ${formatDate(instrument.updatedOn)}`, 14, 88)

      // Save the PDF
      doc.save(`instrument-${instrument.instrumentId}.pdf`)
      toast.success('Instrument details printed successfully')
    } catch (error) {
      console.error('Print failed:', error)
      toast.error('Failed to print instrument details')
    }
  }

  const handleViewInfo = (instrument: InstrumentType) => {
    setSelectedInstrument(instrument)
    setInfoDialogOpen(true)
  }

  const handleViewMessage = (instrument: InstrumentType) => {
    setSelectedInstrument(instrument)
    setMessageDialogOpen(true)
  }

  const handleViewDescription = (instrument: InstrumentType) => {
    setSelectedInstrument(instrument)
    setDescriptionDialogOpen(true)
  }

  const [infoDialogOpen, setInfoDialogOpen] = useState(false)
  const [messageDialogOpen, setMessageDialogOpen] = useState(false)
  const [descriptionDialogOpen, setDescriptionDialogOpen] = useState(false)

  useEffect(() => {
    setData(instrumentData)
    setFilteredData(instrumentData)
  }, [instrumentData])

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Card>
        <CardHeader
          title='Instruments Master'
          action={
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant='outlined'
                startIcon={
                  isExporting ? <i className='tabler-loader animate-spin' /> : <i className='tabler-file-spreadsheet' />
                }
                onClick={handleExport}
                disabled={isExporting}
              >
                {isExporting ? 'Exporting...' : 'Excel'}
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
              <Button
                variant='contained'
                color='primary'
                className='max-sm:is-full'
                startIcon={<i className='tabler-plus' />}
                onClick={handleAddInstrument}
              >
                Add Instrument
              </Button>
            </Box>
          }
        />
        <Divider />
        <div className='flex flex-wrap justify-between gap-4 p-6'>
          <DebouncedInput
            value={globalFilter ?? ''}
            onChange={value => setGlobalFilter(String(value))}
            placeholder='Search Instrument'
            className='max-sm:is-full'
          />
        </div>
        <div className='overflow-x-auto'>
          <table className={tableStyles.table}>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id}>
                      {header.isPlaceholder ? null : (
                        <>
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
                        </>
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
                  .map(row => {
                    return (
                      <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                        ))}
                      </tr>
                    )
                  })}
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

        <AddInstrumentDrawer
          open={instrumentDrawerOpen}
          handleClose={handleCloseDrawer}
          onDataChange={handleDrawerDataChange}
          instrumentData={data}
          selectedInstrument={selectedInstrument}
        />

        <ConfirmDialog
          open={isDeleteDialogOpen}
          handleClose={handleCloseDelete}
          handleConfirm={handleConfirmDelete}
          title='Delete'
          description='Are you sure want to delete record?'
        />

        <ReasonInputDialog
          open={isReasonDialogOpen}
          handleClose={handleCloseDelete}
          handleConfirm={handleReasonSubmit}
          title={pendingAction === 'update' ? 'Update Reason' : 'Delete Reason'}
          description='Please provide a reason for this action.'
        />
      </Card>

      {/* Info Dialog */}
      <Dialog open={infoDialogOpen} onClose={() => setInfoDialogOpen(false)}>
        <DialogTitle>Instrument Information</DialogTitle>
        <DialogContent>
          {selectedInstrument && (
            <Box sx={{ pt: 2 }}>
              <Typography>
                <strong>Instrument ID:</strong> {selectedInstrument.instrumentId}
              </Typography>
              <Typography>
                <strong>Name:</strong> {selectedInstrument.instrumentName}
              </Typography>
              {/* <Typography><strong>Model:</strong> {selectedInstrument.model}</Typography> */}
              <Typography>
                <strong>Performed By:</strong> {selectedInstrument.updatedBy}
              </Typography>
              <Typography>
                <strong>Serial Number:</strong> {selectedInstrument.instrumentSerialNumber}
              </Typography>
              <Typography>
                <strong>Status:</strong> {selectedInstrument.isActive ? 'Active' : 'Inactive'}
              </Typography>
              <Typography>
                <strong>Category:</strong> {selectedInstrument.categoryName}
              </Typography>
              <Typography>
                <strong>Port:</strong> {selectedInstrument.port || '-'}
              </Typography>
              <Typography>
                <strong>IP Address:</strong> {selectedInstrument.ipAddress || '-'}
              </Typography>
              <Typography>
                <strong>Last Calibration:</strong> {formatDate(selectedInstrument.updatedOn)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInfoDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Message Dialog */}
      <Dialog open={messageDialogOpen} onClose={() => setMessageDialogOpen(false)}>
        <DialogTitle>Instrument Messages</DialogTitle>
        <DialogContent>
          {selectedInstrument && (
            <Box sx={{ pt: 2 }}>
              <Typography>No messages available for this instrument.</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMessageDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Description Dialog */}
      <Dialog open={descriptionDialogOpen} onClose={() => setDescriptionDialogOpen(false)}>
        <DialogTitle>Instrument Description</DialogTitle>
        <DialogContent>
          {selectedInstrument && (
            <Box sx={{ pt: 2 }}>
              <Typography>No description available for this instrument.</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDescriptionDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  )
}

export default InstrumentListTable

function handleDeleteClick(instrumentId: number) {
  throw new Error('Function not implemented.')
}
