'use client'

// React Imports
import { useEffect, useMemo, useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import type { TextFieldProps } from '@mui/material/TextField'
import TablePagination from '@mui/material/TablePagination'

// Third-party Imports
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

// Component Imports
import AddStrainDrawer from './AddStrainDrawer'
import CustomTextField from '@core/components/mui/TextField'
import ConfirmDialog from '@/components/dialogs/ConfirmDialog/ConfirmDialog'
import ReasonInputDialog from '@/components/dialogs/ReasonInputDialog/ReasonInputDialog'

// Style Imports
import tableStyles from '@core/styles/table.module.css'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import { StrainType } from '@/types/apps/limsTypes'
import { strainService } from '@/app/api/apps/lims/Strain-master/route'
import { toast } from 'react-toastify'
import { Divider } from '@mui/material'
import { formatDate } from '@/utils/dateUtils'


declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

type StrainWithActionsType = StrainType & {
  actions?: string
}

type strainStatusType = {
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

const strainStatusObj: strainStatusType = {
  Active: { title: 'Active', color: 'success' },
  Inactive: { title: 'Inactive', color: 'error' }
}

// Column Definitions
const columnHelper = createColumnHelper<StrainWithActionsType>()

type Props = {
  strainData?: StrainType[]
  onDataChange?: () => void
}

const StrainListTable = ({ strainData = [], onDataChange }: Props) => {
  // States
  const [data, setData] = useState<StrainType[]>(strainData)
  const [filteredData, setFilteredData] = useState<StrainType[]>(strainData)
  const [globalFilter, setGlobalFilter] = useState('')
  const [strainDrawerOpen, setStrainDrawerOpen] = useState(false)
  const [selectedStrain, setSelectedStrain] = useState<StrainType | null>(null)
  const [deleteId, setDeleteId] = useState<StrainType['strainId'] | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isReasonDialogOpen, setIsReasonDialogOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<'delete' | 'update' | null>(null)
  const [pendingData, setPendingData] = useState<any>(null)
  const [isPdfLoading, setIsPdfLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Update data when strainData prop changes
  useEffect(() => {
    const sortedData = [...strainData].sort((a, b) => {
      const dateA = a.updatedOn ? new Date(a.updatedOn).getTime() : 0;
      const dateB = b.updatedOn ? new Date(b.updatedOn).getTime() : 0;
      return dateB - dateA;
    });
    setData(sortedData);
    setFilteredData(sortedData);
  }, [strainData]);

  const handleDeleteRecord = async (reason: string) => {
    if (deleteId !== null) {
      try {
        await strainService.deleteStrain(deleteId, reason)
        const updatedData = data?.filter(strain => strain.strainId !== deleteId)
        setData(updatedData)
        setFilteredData(updatedData)
        handleCloseDelete()
        toast.success('Record deleted successfully')
        onDataChange?.()
      } catch (error: any) {
        console.error('Error deleting strain:', error)
        toast.error(error.message || 'Failed to delete strain')
      }
    }
  }

  const handleDeleteClick = (strainId: number) => {
    setDeleteId(strainId)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    setIsDeleteDialogOpen(false)
    setIsReasonDialogOpen(true)
    setPendingAction('delete')
  }

  const handleReasonSubmit = async (reason: string) => {
    setIsReasonDialogOpen(false)
    if (pendingAction === 'delete') {
      await handleDeleteRecord(reason)
    }
    setPendingAction(null)
    setPendingData(null)
  }

  const handleCloseDelete = () => {
    setDeleteId(null)
    setIsDeleteDialogOpen(false)
  }

  const handleEditStrain = (strain: StrainType) => {
    setSelectedStrain(strain)
    setStrainDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setStrainDrawerOpen(false)
    setSelectedStrain(null)
  }

  // Export handler function
  const handleExport = async () => {
    setIsExporting(true)
    try {
      await strainService.downloadFile('CSV')
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
      await strainService.downloadFile('PDF')
      toast.success('PDF file downloaded successfully')
    } catch (error) {
      console.error('PDF export failed:', error)
      toast.error('Failed to download PDF file')
    } finally {
      setIsPdfLoading(false)
    }
  }

  const handleAddStrain = () => {
    setStrainDrawerOpen(true)
  }

  const columns = useMemo<ColumnDef<StrainWithActionsType, any>[]>(
    () => [
      columnHelper.accessor('actions', {
        header: 'Actions',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            <IconButton onClick={() => handleEditStrain(row.original)}>
              <i className='tabler-edit text-textSecondary' />
            </IconButton>
            <IconButton
              onClick={() => {
                handleDeleteClick(row.original.strainId)
              }}
            >
              <i className='tabler-trash text-textSecondary' />
            </IconButton>
          </div>
        )
      }),
      columnHelper.accessor('strainName', {
        header: 'Strain Name',
        cell: ({ row }) => <Typography>{row.original.strainName}</Typography>
      }),
      columnHelper.accessor('remarks', {
        header: 'Remarks',
        cell: ({ row }) => <Typography>{row.original.remarks || '-'}</Typography>
      }),
      columnHelper.accessor('isActive', {
        header: 'Status',
        cell: ({ row }) => (
          <Chip
            label={strainStatusObj[row.original.isActive ? 'Active' : 'Inactive'].title}
            variant='tonal'
            color={strainStatusObj[row.original.isActive ? 'Active' : 'Inactive'].color}
            size='small'
          />
        )
      }),
      columnHelper.accessor('updatedBy', {
        header: 'Performed  By',
        cell: ({ row }) => <Typography>{row.original.updatedBy || '-'}</Typography>
      }),
      columnHelper.accessor('updatedOn', {
        header: 'Performed On',
        cell: ({ row }) => (
          <Typography>
            {formatDate(row.original.updatedOn)}
          </Typography>
        )
      }),
    ],
    []
  )

  const table = useReactTable({
    data: filteredData as StrainWithActionsType[],
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    state: {
      globalFilter
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

  return (
    <Card>
      <CardHeader 
        title='Strain Master'
        action={
          <div className='flex gap-2'>
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

            <Button
              variant='contained'
              color='primary'
              className='max-sm:is-full'
              startIcon={<i className='tabler-plus' />}
              onClick={handleAddStrain}
            >
              Add Strain
            </Button>
          </div>
        }
      />
      <Divider />
      <div className='flex flex-wrap justify-between gap-4 p-6'>
        <DebouncedInput
          value={globalFilter ?? ''}
          onChange={value => setGlobalFilter(String(value))}
          placeholder='Search Strain'
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
                      <div
                        {...{
                          className: header.column.getCanSort() ? 'cursor-pointer select-none' : '',
                          onClick: header.column.getToggleSortingHandler()
                        }}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePaginationComponent table={table as unknown as ReturnType<typeof useReactTable>} />

      <AddStrainDrawer
        open={strainDrawerOpen}
        handleClose={handleCloseDrawer}
        onDataChange={onDataChange}
        selectedStrain={selectedStrain}
      />

      <ConfirmDialog
        open={isDeleteDialogOpen}
        handleClose={handleCloseDelete}
        handleConfirm={handleDeleteConfirm}
        title='Delete Strain'
        description='Are you sure you want to delete this strain?'
      />

      <ReasonInputDialog
        open={isReasonDialogOpen}
        handleClose={() => {
          setIsReasonDialogOpen(false)
          setPendingAction(null)
          setPendingData(null)
        }}
        handleConfirm={handleReasonSubmit}
        title='Provide Reason'
        description='Please provide a reason for this action.'
      />
    </Card>
  )
}

export default StrainListTable 
