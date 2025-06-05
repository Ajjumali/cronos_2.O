'use client'

// React Imports
import { useEffect, useMemo, useState } from 'react'

// Next Imports
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
} from '@mui/material'
import { Print as PrintIcon, Info as InfoIcon, Description as DescriptionIcon, Message as MessageIcon } from '@mui/icons-material'
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
import { MethodType } from '@/types/apps/limsTypes'
import { formatDate } from '@/utils/dateUtils'

// Component Imports
import AddMethodDrawer from './AddMethodDrawer'
import CustomTextField from '@core/components/mui/TextField'
import ConfirmDialog from '@/components/dialogs/ConfirmDialog/ConfirmDialog'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import ReasonInputDialog from '@/components/dialogs/ReasonInputDialog/ReasonInputDialog'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

// Service Imports
import { methodService } from '@/app/api/apps/lims/method/route'

declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

type MethodWithActionsType = MethodType & {
  actions?: string
}

type methodStatusType = {
  [key: string]: {
    title: string
    color: ThemeColor
  }
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({
    itemRank
  })
  return itemRank.passed
}

const methodStatusObj: methodStatusType = {
  Active: { title: 'Active', color: 'success' },
  Inactive: { title: 'Inactive', color: 'error' }
}

// Column Definitions
const columnHelper = createColumnHelper<MethodWithActionsType>()

type Props = {
  methodData?: MethodType[]
  onDataChange?: () => void
}

const MethodListTable = ({ methodData = [], onDataChange }: Props) => {
  // States
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState<MethodType[]>(methodData)
  const [filteredData, setFilteredData] = useState<MethodType[]>(methodData)
  const [globalFilter, setGlobalFilter] = useState('')
  const [methodDrawerOpen, setMethodDrawerOpen] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<MethodType | null>(null)
  const [isPdfLoading, setIsPdfLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [deleteId, setDeleteId] = useState<MethodType['methodId'] | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isReasonDialogOpen, setIsReasonDialogOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<'update' | 'delete' | null>(null)
  const [pendingData, setPendingData] = useState<MethodType | null>(null)
  const [infoDialogOpen, setInfoDialogOpen] = useState(false)
  const [messageDialogOpen, setMessageDialogOpen] = useState(false)
  const [descriptionDialogOpen, setDescriptionDialogOpen] = useState(false)

  // Hooks
  const { lang: locale } = useParams()

  const handleDeleteRecord = async () => {
    if (deleteId !== null) {
      try {
        handleCloseDelete()
        setPendingAction('delete')
        setPendingData(data.find(method => method.methodId === deleteId) || null)
        setIsReasonDialogOpen(true)
      } catch (error) {
        console.error('Error initiating delete:', error)
        toast.error('Failed to initiate deletion')
      }
    }
  }

  const handleEditMethod = (method: MethodType) => {
    setSelectedMethod(method)
    setMethodDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setMethodDrawerOpen(false)
    setSelectedMethod(null)
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

  const handleDrawerDataChange = (updatedMethod: MethodType) => {
    setPendingAction('update')
    setPendingData(updatedMethod)
    setIsReasonDialogOpen(true)
  }

  const columns = useMemo<ColumnDef<MethodWithActionsType, any>[]>(
    () => [
      columnHelper.accessor('actions', {
        header: 'Actions',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            <IconButton onClick={() => handleEditMethod(row.original)}>
              <i className='tabler-edit text-textSecondary' />
            </IconButton>
            <IconButton
              onClick={() => {
                setDeleteId(row.original.methodId)
                setIsDeleteDialogOpen(true)
              }}
            >
              <i className='tabler-trash text-textSecondary' />
            </IconButton>
            <IconButton onClick={() => handleViewInfo(row.original)}>
              <InfoIcon className='text-textSecondary' />
            </IconButton>
            <IconButton onClick={() => handleViewDescription(row.original)}>
              <DescriptionIcon className='text-textSecondary' />
            </IconButton>
          </div>
        ),
        enableSorting: false
      }),
      
      columnHelper.accessor('methodName', {
        header: 'Method Name',
        cell: ({ row }) => <Typography>{row.original.methodName}</Typography>
      }),
      columnHelper.accessor('description', {
        header: 'Description',
        cell: ({ row }) => <Typography>{row.original.description || '-'}</Typography>
      }),
      columnHelper.accessor('isActive', {
        header: 'Status',
        cell: ({ row }) => (
          <Chip
            label={methodStatusObj[row.original.isActive ? 'Active' : 'Inactive'].title}
            variant='tonal'
            color={methodStatusObj[row.original.isActive ? 'Active' : 'Inactive'].color}
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

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await methodService.downloadFile('CSV')
      toast.success('CSV file downloaded successfully')
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to download CSV file')
    } finally {
      setIsExporting(false)
    }
  }

  const handlePdfExport = async () => {
    setIsPdfLoading(true)
    try {
      const doc = new jsPDF()
      
      doc.setFontSize(16)
      doc.text('Test Method List', 14, 15)
      
      doc.setFontSize(10)
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22)

      const tableData = data.map(method => [
        formatDate(method.updatedOn),
        method.methodId,
        method.methodName,
        method.updatedBy,
        method.isActive ? 'Active' : 'Inactive',
        method.description || '-'
      ])

      autoTable(doc, {
        head: [['Performed On', 'Method ID', 'Method Name', 'Performed By', 'Status', 'Description']],
        body: tableData,
        startY: 30,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 30 }
      })

      doc.save(`method-list-${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success('PDF file downloaded successfully')
    } catch (error) {
      console.error('PDF export failed:', error)
      toast.error('Failed to download PDF file')
    } finally {
      setIsPdfLoading(false)
    }
  }

  const handleAddMethod = () => {
    setSelectedMethod(null)
    setMethodDrawerOpen(true)
  }

  const handleReasonSubmit = async (reason: string) => {
    if (!reason.trim()) {
      toast.error('Please provide a reason')
      return
    }

    if (!pendingData || !pendingData.methodId) {
      toast.error('Invalid method data. Please try again.')
      return
    }

    try {
      if (pendingAction === 'update') {
        await methodService.updateMethod(pendingData.methodId, {
          ...pendingData,
          reason: reason
        })
        const updatedData = data.map(method =>
          method.methodId === pendingData.methodId ? pendingData : method
        )
        setData(updatedData)
        setFilteredData(updatedData)

        toast.success('Method updated successfully')
        onDataChange?.()
      } else if (pendingAction === 'delete') {
        await methodService.deleteMethod(pendingData.methodId, reason)
        
        const updatedData = data.filter(method => method.methodId !== pendingData.methodId)
        setData(updatedData)
        setFilteredData(updatedData)

        toast.success('Method deleted successfully')
        onDataChange?.()
      }
    } catch (error) {
      console.error(`Error ${pendingAction}ing method:`, error)
      toast.error(`Failed to ${pendingAction} method`)
    } finally {
      handleCloseDelete()
    }
  }

  const handleViewInfo = (method: MethodType) => {
    setSelectedMethod(method)
    setInfoDialogOpen(true)
  }

  const handleViewDescription = (method: MethodType) => {
    setSelectedMethod(method)
    setDescriptionDialogOpen(true)
  }

  useEffect(() => {
    setData(methodData)
    setFilteredData(methodData)
  }, [methodData])

  return (
    <Card>
      <CardHeader 
        title='Test Method Management' 
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
        <CustomTextField
          value={globalFilter ?? ''}
          onChange={e => setGlobalFilter(String(e.target.value))}
          placeholder='Search Method'
          className='max-sm:is-full'
        />
        <div className='flex flex-wrap items-center max-sm:flex-col gap-4 max-sm:is-full is-auto'>
          <Button
            variant='contained'
            color='primary'
            className='max-sm:is-full'
            startIcon={<i className='tabler-plus' />}
            onClick={handleAddMethod}
          >
            Add New Test Method
          </Button>
        </div>
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
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
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
      
      <AddMethodDrawer
        open={methodDrawerOpen}
        handleClose={handleCloseDrawer}
        onDataChange={handleDrawerDataChange}
        methodData={data}
        selectedMethod={selectedMethod}
      />
      
      <ConfirmDialog
        open={isDeleteDialogOpen}
        handleClose={handleCloseDelete}
        handleConfirm={handleConfirmDelete}
        title="Delete"
        description="Are you sure want to delete this test method?"
      />

      <ReasonInputDialog
        open={isReasonDialogOpen}
        handleClose={handleCloseDelete}
        handleConfirm={handleReasonSubmit}
        title={pendingAction === 'update' ? 'Update Reason' : 'Delete Reason'}
        description="Please provide a reason for this action."
      />

      {/* Info Dialog */}
      <Dialog open={infoDialogOpen} onClose={() => setInfoDialogOpen(false)}>
        <DialogTitle>Test Method Information</DialogTitle>
        <DialogContent>
          {selectedMethod && (
            <Box sx={{ pt: 2 }}>
              <Typography><strong>Method ID:</strong> {selectedMethod.methodId}</Typography>
              <Typography><strong>Name:</strong> {selectedMethod.methodName}</Typography>
              <Typography><strong>Description:</strong> {selectedMethod.description || '-'}</Typography>
              <Typography><strong>Status:</strong> {selectedMethod.isActive ? 'Active' : 'Inactive'}</Typography>
              <Typography><strong>Performed By:</strong> {selectedMethod.updatedBy}</Typography>
              <Typography><strong>Performed On:</strong> {formatDate(selectedMethod.updatedOn)}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInfoDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Description Dialog */}
      <Dialog open={descriptionDialogOpen} onClose={() => setDescriptionDialogOpen(false)}>
        <DialogTitle>Test Method Description</DialogTitle>
        <DialogContent>
          {selectedMethod && (
            <Box sx={{ pt: 2 }}>
              <Typography>{selectedMethod.description || 'No description available for this method.'}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDescriptionDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default MethodListTable
