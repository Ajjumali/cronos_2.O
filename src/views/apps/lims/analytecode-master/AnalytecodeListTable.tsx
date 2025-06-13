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
import Checkbox from '@mui/material/Checkbox'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Switch from '@mui/material/Switch'
import MenuItem from '@mui/material/MenuItem'
import TablePagination from '@mui/material/TablePagination'
import Typography from '@mui/material/Typography'
import type { TextFieldProps } from '@mui/material/TextField'
import { formatDate } from '@/utils/dateUtils'
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
import type { UserOptions } from 'jspdf-autotable'

// Type Imports
import type { ThemeColor } from '@core/types'
import type { AnalyteCodeType } from '@/types/apps/limsTypes'

// Component Imports
import AddAnalyteCodeDrawer from './AddAnalyteCodeDrawer'
import CustomTextField from '@core/components/mui/TextField'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import ConfirmDialog from '@/components/dialogs/ConfirmDialog/ConfirmDialog'
import ReasonModal from '@/components/dialogs/ReasonModal/ReasonModal'

// Service Imports
import { toast } from 'react-toastify'

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

type AnalyteCodeWithActionsType = AnalyteCodeType & {
  actions?: string
}

type analyteCodeStatusType = {
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

const analyteCodeStatusObj: analyteCodeStatusType = {
  Active: { title: 'Active', color: 'success' },
  Inactive: { title: 'Inactive', color: 'error' }
}

// Column Definitions
const columnHelper = createColumnHelper<AnalyteCodeWithActionsType>()

type Props = {
  analyteCodeData?: AnalyteCodeType[]
  onDataChange?: () => void
}

const AnalyteCodeListTable = ({ analyteCodeData = [], onDataChange }: Props) => {
  // States
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState<AnalyteCodeType[]>(analyteCodeData)
  const [filteredData, setFilteredData] = useState<AnalyteCodeType[]>(analyteCodeData)
  const [globalFilter, setGlobalFilter] = useState('')
  const [analyteCodeDrawerOpen, setAnalyteCodeDrawerOpen] = useState(false)
  const [selectedAnalyteCode, setSelectedAnalyteCode] = useState<AnalyteCodeType | null>(null)
  const [isPdfLoading, setIsPdfLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [deleteId, setDeleteId] = useState<AnalyteCodeType['analyteId'] | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<{
    type: 'update' | 'delete'
    data?: AnalyteCodeType
  } | null>(null)
  //const [hasPdfPermission, setHasPdfPermission] = useState(false)

  // Hooks
  const { lang: locale } = useParams()

  // Check PDF permission on component mount
  // useEffect(() => {
  //   // You can replace this with your actual permission check logic
  //   const checkPdfPermission = async () => {
  //     try {
  //       // Example: Check if user has PDF export permission
  //       const hasPermission = await analyteCodeService.checkPdfPermission()
  //       setHasPdfPermission(hasPermission)
  //     } catch (error) {
  //       console.error('Error checking PDF permission:', error)
  //       setHasPdfPermission(false)
  //     }
  //   }

  //   checkPdfPermission()
  // }, [])

  const handleDeleteRecord = async () => {
    if (deleteId !== null) {
      try {
        setIsDeleteDialogOpen(false)
        setPendingAction({ type: 'delete', data: data.find(item => item.analyteId === deleteId) })
        setIsReasonModalOpen(true)
      } catch (error) {
        console.error('Error preparing for deletion:', error)
        toast.error('Failed to prepare for deletion')
      }
    }
  }

  const handleEditAnalyteCode = (analyteCode: AnalyteCodeType) => {
    setSelectedAnalyteCode(analyteCode)
    setAnalyteCodeDrawerOpen(true)
  }

  const handleDrawerSubmit = (updatedAnalyteCode: AnalyteCodeType) => {
    setPendingAction({ type: 'update', data: updatedAnalyteCode })
    setIsReasonModalOpen(true)
    setAnalyteCodeDrawerOpen(false)
  }

  const handleReasonConfirm = async (reason: string) => {
    if (!pendingAction) return

    try {
      if (pendingAction.type === 'delete' && pendingAction.data) {
        const response = await fetch(`/api/apps/lims/Analytecode-master?id=${pendingAction.data.analyteId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ reason })
        })

        if (!response.ok) {
          throw new Error('Failed to delete record')
        }

        const result = await response.json()
        if (result.success) {
          const updatedData = data?.filter(analyteCode => analyteCode.analyteId !== pendingAction.data?.analyteId)
          setData(updatedData)
          setFilteredData(updatedData)
          toast.success(result.message)
          onDataChange?.()
        } else {
          throw new Error(result.message)
        }
      }
    } catch (error) {
      console.error('Error performing action:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to perform action')
    } finally {
      setIsReasonModalOpen(false)
      setPendingAction(null)
      setDeleteId(null)
    }
  }

  const handleCloseReasonModal = () => {
    setIsReasonModalOpen(false)
    setPendingAction(null)
  }

  const handleCloseDrawer = () => {
    setAnalyteCodeDrawerOpen(false)
    setSelectedAnalyteCode(null)
  }

  const handleCloseDelete = () => {
    setDeleteId(null)
    setIsDeleteDialogOpen(false)
  }

  const columns = useMemo<ColumnDef<AnalyteCodeWithActionsType, any>[]>(
    () => [
      columnHelper.accessor('actions', {
        header: 'Actions',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            <IconButton onClick={() => handleEditAnalyteCode(row.original)}>
              <i className='tabler-edit text-textSecondary' />
            </IconButton>
            <IconButton
              onClick={() => {
                setDeleteId(row.original.analyteId)
                setIsDeleteDialogOpen(true)
              }}
            >
              <i className='tabler-trash text-textSecondary' />
            </IconButton>
          </div>
        ),
        enableSorting: false
      }),
      columnHelper.accessor('analyteName', {
        header: 'Analyte Name',
        cell: ({ row }) => <Typography>{row.original.analyteName || '-'}</Typography>
      }),
      columnHelper.accessor('analyteCode', {
        header: 'Analyte Code',
        cell: ({ row }) => <Typography>{row.original.analyteCode || '-'}</Typography>
      }),
      columnHelper.accessor('instrumentName', {
        header: 'Instrument',
        cell: ({ row }) => <Typography>{row.original.instrumentName || '-'}</Typography>
      }),
      columnHelper.accessor('sampletype', {
        header: 'Sample Type',
        cell: ({ row }) => <Typography>{row.original.sampletype || '-'}</Typography>
      }),
      columnHelper.accessor('testName', {
        header: 'Test',
        cell: ({ row }) => <Typography>{row.original.testName || '-'}</Typography>
      }),
      columnHelper.accessor('isActive', {
        header: 'Status',
        cell: ({ row }) => (
          <Chip
            label={analyteCodeStatusObj[row.original.isActive ? 'Active' : 'Inactive'].title}
            variant='tonal'
            color={analyteCodeStatusObj[row.original.isActive ? 'Active' : 'Inactive'].color}
            size='small'
          />
        )
      }),
      columnHelper.accessor('updatedBy', {
        header: 'Performed By',
        cell: ({ row }) => <Typography>{row.original.updatedBy || '-'}</Typography>
      }),
      columnHelper.accessor('updatedOn', {
        header: 'Performed On',
        cell: ({ row }) => <Typography>{row.original.updatedOn ? formatDate(row.original.updatedOn) : '-'}</Typography>
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
      sorting: [{ id: 'updatedOn', desc: true }]
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
      const response = await fetch('/api/apps/lims/Analytecode-master/download?fileType=download&type=CSV')
      if (!response.ok) {
        throw new Error('Failed to download CSV file')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'AnalyteCode_List.csv'
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
      const response = await fetch('/api/apps/lims/Analytecode-master/download?fileType=download&type=PDF')
      if (!response.ok) {
        throw new Error('Failed to download PDF file')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'AnalyteCode_List.pdf'
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

  const handleAddAnalyteCode = () => {
    setSelectedAnalyteCode(null)
    setAnalyteCodeDrawerOpen(true)
  }

  useEffect(() => {
    setData(analyteCodeData)
    setFilteredData(analyteCodeData)
  }, [analyteCodeData])

  return (
    <Card>
      <CardHeader
        title='Analyte Codes Master'
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
              startIcon={<i className='tabler-plus' />}
              onClick={handleAddAnalyteCode}
            >
              Add Analyte Code
            </Button>
          </Box>
        }
      />
      <Divider />
      <div className='flex flex-wrap justify-between gap-4 p-6'>
        <DebouncedInput
          value={globalFilter ?? ''}
          onChange={value => setGlobalFilter(String(value))}
          placeholder='Search Analyte Code'
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

      <AddAnalyteCodeDrawer
        open={analyteCodeDrawerOpen}
        handleClose={handleCloseDrawer}
        onDataChange={onDataChange}
        analyteCodeData={data}
        selectedAnalyteCode={selectedAnalyteCode}
      />

      <ConfirmDialog
        open={isDeleteDialogOpen}
        handleClose={handleCloseDelete}
        title='Delete'
        handleConfirm={handleDeleteRecord}
        description='Are you sure want to delete record?'
      />

      <ReasonModal
        open={isReasonModalOpen}
        handleClose={handleCloseReasonModal}
        handleConfirm={handleReasonConfirm}
        title={pendingAction?.type === 'update' ? 'Update Reason' : 'Delete Reason'}
        description={
          pendingAction?.type === 'update'
            ? 'Please provide a reason for updating this analyte code.'
            : 'Please provide a reason for deleting this analyte code.'
        }
      />
    </Card>
  )
}

export default AnalyteCodeListTable
