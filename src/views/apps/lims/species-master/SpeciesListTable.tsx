'use client'

// React Imports
import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import type { TextFieldProps } from '@mui/material/TextField'

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
import type { SpeciesType } from '@/types/apps/limsTypes'

// Component Imports
import AddSpeciesDrawer from './AddSpeciesDrawer'
import CustomTextField from '@core/components/mui/TextField'
import ConfirmDialog from '@/components/dialogs/ConfirmDialog/ConfirmDialog'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import ReasonInputDialog from '@/components/dialogs/ReasonInputDialog/ReasonInputDialog'

// Style Imports
import tableStyles from '@core/styles/table.module.css'
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

type SpeciesWithActionsType = SpeciesType & {
  actions?: string
}

type speciesStatusType = {
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

const speciesStatusObj: speciesStatusType = {
  Active: { title: 'Active', color: 'success' },
  Inactive: { title: 'Inactive', color: 'error' }
}

// Column Definitions
const columnHelper = createColumnHelper<SpeciesWithActionsType>()

type Props = {
  speciesData?: SpeciesType[]
  onDataChange?: () => void
  autoApprovalEnabled?: boolean
}

const SpeciesListTable = ({ speciesData = [], onDataChange, autoApprovalEnabled = false }: Props) => {
  const { data: session } = useSession()
  // States
  const [data, setData] = useState<SpeciesType[]>(speciesData)
  const [filteredData, setFilteredData] = useState<SpeciesType[]>(speciesData)
  const [globalFilter, setGlobalFilter] = useState('')
  const [speciesDrawerOpen, setSpeciesDrawerOpen] = useState(false)
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesType | null>(null)
  const [deleteId, setDeleteId] = useState<SpeciesType['speciesId'] | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isPdfLoading, setIsPdfLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isReasonDialogOpen, setIsReasonDialogOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<'delete' | 'update' | null>(null)
  const [pendingData, setPendingData] = useState<any>(null)

  // Update data when speciesData prop changes
  useEffect(() => {
    const sortedData = [...speciesData].sort((a, b) => {
      const dateA = a.updatedOn ? new Date(a.updatedOn).getTime() : 0;
      const dateB = b.updatedOn ? new Date(b.updatedOn).getTime() : 0;
      return dateB - dateA;
    });
    setData(sortedData);
    setFilteredData(sortedData);
  }, [speciesData]);

  const handleDeleteRecord = async (reason: string) => {
    if (deleteId !== null) {
      try {
        const response = await fetch(`/api/apps/lims/Species-master/${deleteId}?reason=${encodeURIComponent(reason)}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(session?.user as any)?.accessToken}`
          }
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Failed to delete species: ${response.status} ${response.statusText}`)
        }

        const result = await response.json()
        
        if (result.success) {
          const updatedData = data?.filter(species => species.speciesId !== deleteId)
          setData(updatedData)
          setFilteredData(updatedData)
          handleCloseDelete()
          toast.success(result.message)
          onDataChange?.()
        } else {
          toast.error(result.message || 'Failed to delete species')
        }
      } catch (error: any) {
        console.error('Error deleting species:', error)
        toast.error(error.message || 'Failed to delete species')
      }
    }
  }

  const handleDeleteClick = async (speciesId: number) => {
    if (autoApprovalEnabled) {
      try {
        const response = await fetch(`/api/apps/lims/Species-master/${speciesId}?reason=${encodeURIComponent('Auto-approved deletion')}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(session?.user as any)?.accessToken}`
          }
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Failed to delete species: ${response.status} ${response.statusText}`)
        }

        const result = await response.json()
        
        if (result.success) {
          const updatedData = data?.filter(species => species.speciesId !== speciesId)
          setData(updatedData)
          setFilteredData(updatedData)
          toast.success(result.message)
          onDataChange?.()
        } else {
          toast.error(result.message || 'Failed to delete species')
        }
      } catch (error: any) {
        console.error('Error auto-approving deletion:', error)
        toast.error(error.message || 'Failed to auto-approve deletion')
      }
    } else {
      setDeleteId(speciesId)
      setIsDeleteDialogOpen(true)
    }
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

  const handleEditSpecies = async (species: SpeciesType) => {
    if (autoApprovalEnabled) {
      try {
        const response = await fetch(`/api/apps/lims/Species-master/${species.speciesId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(session?.user as any)?.accessToken}`
          },
          body: JSON.stringify({
            ...species,
            reason: 'Auto-approved edit'
          })
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Failed to update species: ${response.status} ${response.statusText}`)
        }

        const result = await response.json()
        
        if (result.success) {
          toast.success(result.message)
          onDataChange?.()
        } else {
          toast.error(result.message || 'Failed to update species')
        }
      } catch (error: any) {
        console.error('Error auto-approving species:', error)
        toast.error(error.message || 'Failed to auto-approve species')
      }
    } else {
      setSelectedSpecies(species)
      setSpeciesDrawerOpen(true)
    }
  }

  const handleCloseDrawer = () => {
    setSpeciesDrawerOpen(false)
    setSelectedSpecies(null)
  }

  const handleCloseDelete = () => {
    setDeleteId(null)
    setIsDeleteDialogOpen(false)
  }

  // Export handler function
  const handleExport = async () => {
    setIsExporting(true)
    try {
      const response = await fetch('/api/apps/lims/Species-master/download?fileType=CSV', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(session?.user as any)?.accessToken}`
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to download CSV: ${response.status} ${response.statusText}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Species_List.csv'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('CSV file downloaded successfully')
    } catch (error: any) {
      console.error('Export failed:', error)
      toast.error(error.message || 'Failed to download CSV file')
    } finally {
      setIsExporting(false)
    }
  }

  // PDF export handler function
  const handlePdfExport = async () => {
    setIsPdfLoading(true)
    try {
      const response = await fetch('/api/apps/lims/Species-master/download?fileType=PDF', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(session?.user as any)?.accessToken}`
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to download PDF: ${response.status} ${response.statusText}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Species_List.pdf'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('PDF file downloaded successfully')
    } catch (error: any) {
      console.error('PDF export failed:', error)
      toast.error(error.message || 'Failed to download PDF file')
    } finally {
      setIsPdfLoading(false)
    }
  }

  const columns = useMemo<ColumnDef<SpeciesWithActionsType, any>[]>(
    () => [
      columnHelper.accessor('actions', {
        header: 'Actions',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            <IconButton onClick={() => handleEditSpecies(row.original)}>
              <i className='tabler-edit text-textSecondary' />
            </IconButton>
            <IconButton
              onClick={() => {
                handleDeleteClick(row.original.speciesId)
              }}
            >
              <i className='tabler-trash text-textSecondary' />
            </IconButton>
          </div>
        )
      }),
      columnHelper.accessor('speciesName', {
        header: 'Species Name',
        cell: ({ row }) => <Typography>{row.original.speciesName}</Typography>
      }),
      columnHelper.accessor('remarks', {
        header: 'Remarks',
        cell: ({ row }) => <Typography>{row.original.remarks || '-'}</Typography>
      }),
      columnHelper.accessor('isActive', {
        header: 'Status',
        cell: ({ row }) => (
          <Chip
            label={speciesStatusObj[row.original.isActive ? 'Active' : 'Inactive'].title}
            variant='tonal'
            color={speciesStatusObj[row.original.isActive ? 'Active' : 'Inactive'].color}
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
    data: filteredData as SpeciesWithActionsType[],
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

  const handleAddSpecies = () => {
      setSpeciesDrawerOpen(true);
      setSelectedSpecies(null);
  };

  return (
   
     <Card>
        <CardHeader 
          title='Species Master'
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
                onClick={handleAddSpecies}
              >
                Add Species
              </Button>
            </div>
          }
        />
        <Divider />
        <div className='flex flex-wrap justify-between gap-4 p-6'>
          <DebouncedInput
            value={globalFilter ?? ''}
            onChange={value => setGlobalFilter(String(value))}
            placeholder='Search Species'
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

      <AddSpeciesDrawer
        open={speciesDrawerOpen}
        handleClose={handleCloseDrawer}
        onDataChange={onDataChange}
        selectedSpecies={selectedSpecies}
      />

      <ConfirmDialog
        open={isDeleteDialogOpen}
        handleClose={handleCloseDelete}
        handleConfirm={handleDeleteConfirm}
        title='Delete Species'
        description='Are you sure you want to delete this species?'
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

export default SpeciesListTable 
