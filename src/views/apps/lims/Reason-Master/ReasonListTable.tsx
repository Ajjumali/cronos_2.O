'use client'

// React Imports
import { useEffect, useMemo, useState } from 'react'

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
import Box from '@mui/material/Box'

// Third-party Imports
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import type { RankingInfo } from '@tanstack/match-sorter-utils'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { toast } from 'react-toastify'

// Type Imports
import { ReasonType } from '@/types/apps/limsTypes'

// Component Imports
import AddReasonDrawer from './AddReasonDrawer'
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

type ReasonWithActionsType = ReasonType & {
  actions?: string
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
  useEffect(() => { setValue(initialValue) }, [initialValue])
  useEffect(() => { const timeout = setTimeout(() => { onChange(value) }, debounce); return () => clearTimeout(timeout) }, [value])
  return <CustomTextField {...props} value={value} onChange={e => setValue(e.target.value)} />
}

type Props = {
  reasonData?: ReasonType[]
  onDataChange?: () => void
}

const ReasonListTable = ({ reasonData = [], onDataChange }: Props) => {
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState<ReasonType[]>(reasonData)
  const [filteredData, setFilteredData] = useState<ReasonType[]>(reasonData)
  const [globalFilter, setGlobalFilter] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedReason, setSelectedReason] = useState<ReasonType | null>(null)
  const [isPdfLoading, setIsPdfLoading] = useState(false)
  const [deleteId, setDeleteId] = useState<ReasonType['reasonId'] | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isReasonDialogOpen, setIsReasonDialogOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<'update' | 'delete' | null>(null)
  const [pendingData, setPendingData] = useState<ReasonType | null>(null)

  const handleEditReason = (reason: ReasonType) => {
    setSelectedReason(reason)
    setDrawerOpen(true)
  }
  const handleCloseDrawer = () => {
    setDrawerOpen(false)
    setSelectedReason(null)
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
  const handleDrawerDataChange = (updatedReason: ReasonType) => {
    setPendingAction('update')
    setPendingData(updatedReason)
    setIsReasonDialogOpen(true)
  }
  const columns = useMemo<ColumnDef<ReasonWithActionsType, any>[]>(
    () => [
      createColumnHelper<ReasonWithActionsType>().accessor('actions', {
        header: 'Actions',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            <IconButton onClick={() => handleEditReason(row.original)}>
              <i className='tabler-edit text-textSecondary' />
            </IconButton>
            <IconButton
              onClick={() => {
                setDeleteId(row.original.reasonId)
                setIsDeleteDialogOpen(true)
              }}
            >
              <i className='tabler-trash text-textSecondary' />
            </IconButton>
          </div>
        ),
        enableSorting: false
      }),
      createColumnHelper<ReasonWithActionsType>().accessor('reasonName', {
        header: 'Reason Name',
        cell: ({ row }) => <Typography>{row.original.reasonName}</Typography>
      }),
      createColumnHelper<ReasonWithActionsType>().accessor('operationId', {
        header: 'Operation ID',
        cell: ({ row }) => <Typography>{row.original.operationId}</Typography>
      }),
      createColumnHelper<ReasonWithActionsType>().accessor('timezoneId', {
        header: 'Timezone ID',
        cell: ({ row }) => <Typography>{row.original.timezoneId}</Typography>
      }),
      createColumnHelper<ReasonWithActionsType>().accessor('isActive', {
        header: 'Status',
        cell: ({ row }) => (
          <Chip
            label={row.original.isActive === 'true' ? 'Active' : 'Inactive'}
            variant='tonal'
            color={row.original.isActive === 'true' ? 'success' : 'error'}
            size='small'
          />
        )
      }),
      createColumnHelper<ReasonWithActionsType>().accessor('updatedBy', {
        header: 'Performed By',
        cell: ({ row }) => <Typography>{row.original.updatedBy}</Typography>
      }),
      createColumnHelper<ReasonWithActionsType>().accessor('updatedOn', {
        header: 'Performed On',
        cell: ({ row }) => <Typography>{row.original.updatedOn}</Typography>
      }),
      // createColumnHelper<ReasonWithActionsType>().accessor('createdBy', {
      //   header: 'Created By',
      //   cell: ({ row }) => <Typography>{row.original.createdBy}</Typography>
      // }),
      // createColumnHelper<ReasonWithActionsType>().accessor('createOn', {
      //   header: 'Created On',
      //   cell: ({ row }) => <Typography>{row.original.createOn}</Typography>
      // })
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
    getPaginationRowModel: getPaginationRowModel()
  })

  // PDF export handler function
  const handlePdfExport = async () => {
    setIsPdfLoading(true)
    try {
      const doc = new jsPDF()
      doc.setFontSize(16)
      doc.text('Reason List', 14, 15)
      doc.setFontSize(10)
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22)
      const tableData = data.map(reason => [
        reason.reasonName || '-',
        reason.operationId || '-',
        reason.timezoneId || '-',
        reason.isActive === 'true' ? 'Active' : 'Inactive',
        reason.updatedBy || '-',
        reason.updatedOn || '-',
        reason.createdBy || '-',
        reason.createOn || '-'
      ])
      autoTable(doc, {
        head: [
          ['Reason Name', 'Operation ID', 'Timezone ID', 'Status', 'Updated By', 'Updated On', 'Created By', 'Created On']
        ],
        body: tableData,
        startY: 30,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 30 }
      })
      doc.save(`reason-list-${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success('PDF file downloaded successfully')
    } catch (error) {
      console.error('PDF export failed:', error)
      toast.error('Failed to download PDF file')
    } finally {
      setIsPdfLoading(false)
    }
  }

  const handleAddReason = () => {
    setSelectedReason(null)
    setDrawerOpen(true)
  }

  const handleReasonSubmit = async (reason: string) => {
    if (!reason.trim()) {
      toast.error('Please provide a reason')
      return
    }
    if (!pendingData || !pendingData.reasonId) {
      toast.error('Invalid reason data. Please try again.')
      return
    }
    try {
      if (pendingAction === 'update') {
        const response = await fetch(`/api/apps/lims/reason-master/${pendingData.reasonId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...pendingData, reason })
        })
        if (!response.ok) throw new Error('Failed to update reason')
        const updatedData = data.map(r => r.reasonId === pendingData.reasonId ? pendingData : r)
        setData(updatedData)
        setFilteredData(updatedData)
        toast.success('Record updated successfully')
        onDataChange?.()
      } else if (pendingAction === 'delete') {
        const response = await fetch(`/api/apps/lims/reason-master/${pendingData.reasonId}?reason=${encodeURIComponent(reason)}`, { method: 'DELETE' })
        if (!response.ok) throw new Error('Failed to delete reason')
        const updatedData = data.filter(r => r.reasonId !== pendingData.reasonId)
        setData(updatedData)
        setFilteredData(updatedData)
        toast.success('Record deleted successfully')
        onDataChange?.()
      }
    } catch (error) {
      console.error(`Error ${pendingAction}ing reason:`, error)
      toast.error(`Failed to ${pendingAction} reason`)
    } finally {
      handleCloseDelete()
    }
  }

  useEffect(() => {
    setData(reasonData)
    setFilteredData(reasonData)
  }, [reasonData])

  return (
    <Card>
      <CardHeader
        title='Reason Master'
        action={
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant='outlined'
              startIcon={isPdfLoading ? <i className='tabler-loader animate-spin' /> : <i className='tabler-file-text' />}
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
              onClick={handleAddReason}
            >
              Add Reason
            </Button>
          </Box>
        }
      />
      <Divider />
      <div className='flex flex-wrap justify-between gap-4 p-6'>
        <DebouncedInput
          value={globalFilter ?? ''}
          onChange={value => setGlobalFilter(String(value))}
          placeholder='Search Reason'
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
      <AddReasonDrawer
        open={drawerOpen}
        handleClose={handleCloseDrawer}
        onDataChange={handleDrawerDataChange}
        reasonData={data}
        selectedReason={selectedReason}
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
  )
}

export default ReasonListTable
