'use client'

// React Imports
import { useEffect, useMemo, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Backdrop,
  CircularProgress,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { Print as PrintIcon, Comment as CommentIcon, Description as DescriptionIcon, CheckCircle as CheckCircleIcon, Cancel as CancelIcon } from '@mui/icons-material'
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

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import ReasonInputDialog from '@/components/dialogs/ReasonInputDialog/ReasonInputDialog'
import OptionMenu from '@core/components/option-menu'
import TableFilters from './TableFilters'
import AuditTrailDialog from '../components/AuditTrailDialog'

// Style Imports
import tableStyles from '@core/styles/table.module.css'
import { getLocalizedUrl } from '@/utils/i18n'
import { Locale } from 'react-datepicker/dist/date_utils'

export interface RequisitionType {
  id: number
  requisitionDateTime: string
  sampleId: string
  referenceNumber: string
  patientName: string
  gender: string
  age: number
  department: string
  status: string
  tests: string[]
  panels: string[]
  fatherHusbandName: string
  lastScreeningDate: string
  lastStudyCompletionDate: string
  mobileNumber: string
  hivCounsellingDone: string
  fastingSince: string
  fastingHours: number
  cancellationReason?: string
}

type RequisitionWithActionsType = RequisitionType & {
  actions?: string
}

type RequisitionStatusType = {
  [key: string]: {
    title: string
    color: ThemeColor
  }
}

const requisitionStatusObj: RequisitionStatusType = {
  'Pending Approval': { title: 'Pending Approval', color: 'warning' },
  'Approved': { title: 'Approved', color: 'success' },
  'Cancelled': { title: 'Cancelled', color: 'error' }
}

// Column Definitions
const columnHelper = createColumnHelper<RequisitionWithActionsType>()

type Props = {
  requisitionData?: RequisitionType[]
  onDataChange?: () => void
}

// Add dummy data
const dummyRequisitions: RequisitionType[] = [
  {
    id: 1,
    requisitionDateTime: '2024-03-20 10:30:00',
    sampleId: 'SAMP001',
    referenceNumber: 'REF001',
    patientName: 'John Doe',
    gender: 'Male',
    age: 35,
    department: 'Cardiology',
    status: 'Pending Approval',
    tests: ['Blood Test', 'ECG'],
    panels: ['Cardiac Panel'],
    fatherHusbandName: 'James Doe',
    lastScreeningDate: '2024-02-15',
    lastStudyCompletionDate: '2024-01-30',
    mobileNumber: '1234567890',
    hivCounsellingDone: 'Yes',
    fastingSince: '2024-03-20 08:00:00',
    fastingHours: 2
  },
  {
    id: 2,
    requisitionDateTime: '2024-03-20 11:15:00',
    sampleId: 'SAMP002',
    referenceNumber: 'REF002',
    patientName: 'Jane Smith',
    gender: 'Female',
    age: 28,
    department: 'Neurology',
    status: 'Approved',
    tests: ['MRI', 'CT Scan'],
    panels: ['Neurological Panel'],
    fatherHusbandName: 'Robert Smith',
    lastScreeningDate: '2024-02-20',
    lastStudyCompletionDate: '2024-02-05',
    mobileNumber: '9876543210',
    hivCounsellingDone: 'No',
    fastingSince: '2024-03-20 09:00:00',
    fastingHours: 3
  },
  {
    id: 3,
    requisitionDateTime: '2024-03-20 14:45:00',
    sampleId: 'SAMP003',
    referenceNumber: 'REF003',
    patientName: 'Michael Johnson',
    gender: 'Male',
    age: 45,
    department: 'Orthopedics',
    status: 'Cancelled',
    tests: ['X-Ray', 'Bone Density'],
    panels: ['Orthopedic Panel'],
    fatherHusbandName: 'David Johnson',
    lastScreeningDate: '2024-02-10',
    lastStudyCompletionDate: '2024-01-25',
    mobileNumber: '5555555555',
    hivCounsellingDone: 'Yes',
    fastingSince: '2024-03-20 12:00:00',
    fastingHours: 4
  }
];

const SampleRequisitionListTable = ({ requisitionData = dummyRequisitions, onDataChange }: Props) => {
  // States
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState<RequisitionType[]>(requisitionData)
  const [filteredData, setFilteredData] = useState<RequisitionType[]>(requisitionData)
  const [globalFilter, setGlobalFilter] = useState('')
  const [selectedRequisition, setSelectedRequisition] = useState<RequisitionType | null>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [dialogType, setDialogType] = useState('')
  const [filters, setFilters] = useState({
    date: null,
    referenceNumber: '',
    name: '',
    department: '',
    status: '',
    test: '',
    panel: '',
  })
  const [showAuditTrail, setShowAuditTrail] = useState(false)
  const [selectedRequisitionForAudit, setSelectedRequisitionForAudit] = useState<RequisitionType | null>(null)
  const router = useRouter()
  const { lang: locale } = useParams()

  
  const [isNavigating, setIsNavigating] = useState(false)

  const columns = useMemo<ColumnDef<RequisitionWithActionsType, any>[]>(
    () => [
      columnHelper.accessor('actions', {
        header: 'Actions',
        cell: ({ row }) => (
          <div className='flex items-center'>
            <OptionMenu
              iconButtonProps={{ size: 'medium' }}
              iconClassName='text-textSecondary'
              options={[
                {
                  text: 'Print Barcode',
                  icon: 'tabler-printer',
                  menuItemProps: {
                    onClick: () => handleAction('barcode', row.original),
                    className: 'text-primary'
                  }
                },
                {
                  text: 'Add Remarks',
                  icon: 'tabler-message',
                  menuItemProps: {
                    onClick: () => handleAction('remarks', row.original),
                    className: 'text-secondary'
                  }
                },
                {
                  text: 'Generate TRF',
                  icon: 'tabler-file-text',
                  menuItemProps: {
                    onClick: () => handleAction('trf', row.original),
                    className: 'text-info'
                  }
                },
                {
                  text: 'Approve',
                  icon: 'tabler-check',
                  menuItemProps: {
                    onClick: () => handleAction('approve', row.original),
                    className: 'text-success',
                    disabled: row.original.status !== 'Pending Approval'
                  }
                },
                {
                  text: 'Cancel',
                  icon: 'tabler-x',
                  menuItemProps: {
                    onClick: () => handleAction('cancel', row.original),
                    className: 'text-error',
                    disabled: row.original.status !== 'Pending Approval'
                  }
                },
                {
                  text: 'View Audit Trail',
                  icon: 'tabler-history',
                  menuItemProps: {
                    onClick: () => {
                      setSelectedRequisitionForAudit(row.original)
                      setShowAuditTrail(true)
                    },
                    className: 'text-warning'
                  }
                }
              ]}
            />
          </div>
        ),
        enableSorting: false
      }),
      columnHelper.accessor('requisitionDateTime', {
        header: 'Requisition Date/Time',
        cell: ({ row }) => <Typography>{row.original.requisitionDateTime}</Typography>
      }),
      columnHelper.accessor('sampleId', {
        header: 'Sample ID',
        cell: ({ row }) => <Typography>{row.original.sampleId}</Typography>
      }),
      columnHelper.accessor('referenceNumber', {
        header: 'Reference Number',
        cell: ({ row }) => <Typography>{row.original.referenceNumber}</Typography>
      }),
      columnHelper.accessor('patientName', {
        header: 'Patient Name',
        cell: ({ row }) => <Typography>{row.original.patientName}</Typography>
      }),
      columnHelper.accessor('gender', {
        header: 'Gender',
        cell: ({ row }) => <Typography>{row.original.gender}</Typography>
      }),
      columnHelper.accessor('age', {
        header: 'Age',
        cell: ({ row }) => <Typography>{row.original.age}</Typography>
      }),
      columnHelper.accessor('department', {
        header: 'Department',
        cell: ({ row }) => <Typography>{row.original.department}</Typography>
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ row }) => (
          <Chip
            label={requisitionStatusObj[row.original.status].title}
            variant='tonal'
            color={requisitionStatusObj[row.original.status].color}
            size='small'
          />
        )
      }),
    ],
    []
  )

  // Add this before the table configuration
  const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
    const itemRank = rankItem(row.getValue(columnId), value)
    addMeta({ itemRank })
    return itemRank.passed
  }

  const table = useReactTable({
    data: filteredData ?? [],
    columns,
    filterFns: { fuzzy: fuzzyFilter },
    state: { rowSelection, globalFilter },
    initialState: { 
      pagination: { pageSize: 10 },
      sorting: [
        {
          id: 'requisitionDateTime',
          desc: true
        }
      ]
    },
    enableRowSelection: true,
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

  const handleAction = async (type: string, requisition: RequisitionType) => {
    setSelectedRequisition(requisition)
    setDialogType(type)
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setSelectedRequisition(null)
  }

  const handleConfirmAction = async () => {
    if (!selectedRequisition) return

    try {
      let response
      let actionData = {}

      switch (dialogType) {
        case 'approve':
          response = await fetch(`/api/apps/lims/sample-requisition`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: selectedRequisition.id,
              action: 'approve'
            })
          })
          break

        case 'cancel':
          const reason = (document.querySelector('textarea[name="reason"]') as HTMLTextAreaElement)?.value
          if (!reason) {
            toast.error('Please provide a cancellation reason')
            return
          }
          response = await fetch(`/api/apps/lims/sample-requisition`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: selectedRequisition.id,
              action: 'cancel',
              reason
            })
          })
          break

        case 'barcode':
          response = await fetch(`/api/apps/lims/print-barcode`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sampleId: selectedRequisition.sampleId
            })
          })
          break

        case 'trf':
          response = await fetch(`/api/apps/lims/generate-trf`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requisitionId: selectedRequisition.id
            })
          })
          break

        case 'remarks':
          const remarks = (document.querySelector('textarea[name="remarks"]') as HTMLTextAreaElement)?.value
          if (!remarks) {
            toast.error('Please provide remarks')
            return
          }
          response = await fetch(`/api/apps/lims/sample-requisition`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: selectedRequisition.id,
              action: 'update',
              remarks
            })
          })
          break
      }

      if (response && !response.ok) {
        throw new Error('Action failed')
      }

      toast.success('Action completed successfully')
      handleCloseDialog()
      if (onDataChange) {
        onDataChange()
      }
    } catch (error) {
      console.error('Error performing action:', error)
      toast.error('Failed to perform action')
    }
  }

  const handleApplyFilters = () => {
    // Implement filter logic here
    console.log('Applied filters:', filters)
  }
  const openSampleRequisitionForm = () => {
    setIsNavigating(true)
    try {
      router.push(getLocalizedUrl(`/apps/lims/sample-requisition/form`, String(locale)))
    } catch (error: unknown) {
      console.error('Navigation error:', error)
      setIsNavigating(false)
      toast.error('Failed to navigate to Requisition Form')
    }
  }
  useEffect(() => {
    if (JSON.stringify(requisitionData) !== JSON.stringify(data)) {
      setData(requisitionData)
      setFilteredData(requisitionData)
    }
  }, [requisitionData])

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Card>
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}
        open={isNavigating}
      >
        <CircularProgress color="inherit" />
        <Typography variant="body1">
            Navigating to Requisition Form...
          </Typography>
      </Backdrop>
        <CardHeader 
          title='Sample Requisitions'
          action={
            <div className='flex items-center gap-4'>
              <Button
                color='primary'
                variant='contained'
                startIcon={<i className='tabler-plus' />}
                onClick={openSampleRequisitionForm}
              >
                Add Requisition
              </Button>
            </div>
          }
        />
        <Divider />
        

        <div className='flex flex-wrap justify-between gap-4 p-6'>
          <CustomTextField
            value={globalFilter ?? ''}
            onChange={e => setGlobalFilter(String(e.target.value))}
            placeholder='Search Requisition'
            className='max-sm:is-full'
          />
        </div>

        <TableFilters setData={setFilteredData} requisitionData={data} />

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

        <Dialog open={openDialog} onClose={handleCloseDialog}>
          <DialogTitle>
            {dialogType === 'barcode' && 'Print Barcode'}
            {dialogType === 'remarks' && 'Add Remarks'}
            {dialogType === 'trf' && 'Generate TRF'}
            {dialogType === 'approve' && 'Approve Requisition'}
            {dialogType === 'cancel' && 'Cancel Requisition'}
          </DialogTitle>
          <DialogContent>
            {dialogType === 'remarks' && (
              <TextField
                fullWidth
                multiline
                rows={4}
                name="remarks"
                label="Remarks"
                margin="normal"
              />
            )}
            {dialogType === 'cancel' && (
              <TextField
                fullWidth
                multiline
                rows={4}
                name="reason"
                label="Cancellation Reason"
                margin="normal"
                required
              />
            )}
            {dialogType === 'barcode' && (
              <Typography>Barcode will be printed for Sample ID: {selectedRequisition?.sampleId}</Typography>
            )}
            {dialogType === 'trf' && (
              <Typography>TRF will be generated for Reference Number: {selectedRequisition?.referenceNumber}</Typography>
            )}
            {dialogType === 'approve' && (
              <Typography>Are you sure you want to approve this requisition?</Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleConfirmAction} variant="contained" color="primary">
              Confirm
            </Button>
          </DialogActions>
        </Dialog>

        {selectedRequisitionForAudit && (
          <AuditTrailDialog
            open={showAuditTrail}
            onClose={() => {
              setShowAuditTrail(false)
              setSelectedRequisitionForAudit(null)
            }}
            requisitionId={selectedRequisitionForAudit.id}
          />
        )}
      </Card>
    </LocalizationProvider>
  )
}

export default SampleRequisitionListTable
