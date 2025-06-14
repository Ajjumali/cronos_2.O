/* eslint-disable import/no-unresolved */
'use client'

import React, { useState, useEffect, useMemo } from 'react'

import { useParams, useRouter } from 'next/navigation'

import { toast } from 'react-toastify'
import autoTable from 'jspdf-autotable'
// eslint-disable-next-line import/no-named-as-default
import jsPDF from 'jspdf'
import { Edit as EditIcon } from '@mui/icons-material'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Card,
  CardHeader,
  Typography,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Backdrop,
  CircularProgress
} from '@mui/material'
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
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import type { RankingInfo } from '@tanstack/match-sorter-utils'
import * as XLSX from 'xlsx'

import OptionMenu from '@core/components/option-menu'
import tableStyles from '@core/styles/table.module.css'

import TableFilters from './TableFilters'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import { formatDate } from '@/utils/dateUtils'
import SampleRegistrationForm from '../form/SampleRegistrationForm'

declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

export type SampleRegistrationType = {
  id: string
  registrationDateTime: string
  sampleId: string
  subjectId: string
  gender: string
  name: string
  company: string
  branch: string
  type: 'human' | 'animal'
  laboratory: string
  department: string
  testStatus: string
  test: string
  panel: string
  projectNo: string
  sampleType: string
  location: string
  lastModifiedBy?: string
  lastModifiedAt?: string
  auditTrail?: Array<{
    action: string
    timestamp: string
    user: string
    details: string
    status: string
    reason?: string
  }>
}

type SampleWithActionsType = SampleRegistrationType & {
  actions?: string
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({ itemRank })

  return itemRank.passed
}

const columnHelper = createColumnHelper<SampleWithActionsType>()

type Props = {
  sampleData?: SampleRegistrationType[]
  onDataChange?: () => void
}

const SampleRegistrationListTable = ({ sampleData = [] }: Props) => {
  // States
  const [data, setData] = useState<SampleRegistrationType[]>(sampleData)
  const [globalFilter, setGlobalFilter] = useState('')
  const [isPdfLoading, setIsPdfLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isAddingRegistration, setIsAddingRegistration] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedRow, setSelectedRow] = useState<SampleRegistrationType | null>(null)
  const [showAuditTrailDialog, setShowAuditTrailDialog] = useState(false)

  const [selectedAuditTrail, setSelectedAuditTrail] = useState<
    Array<{
      action: string
      timestamp: string
      user: string
      details: string
    }>
  >([])

  const router = useRouter()
  const [openDialog, setOpenDialog] = useState(false)
  const [dialogType, setDialogType] = useState('')
  const [selectedSample, setSelectedSample] = useState<SampleRegistrationType | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedRowForEdit, setSelectedRowForEdit] = useState<SampleRegistrationType | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        const response = await fetch('/api/apps/lims/sample-registration')

        if (!response.ok) {
          throw new Error('Failed to fetch data')
        }

        const result = await response.json()

        setData(result)
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to load sample registrations')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Hooks
  const { lang: locale } = useParams()

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedRow(null)
  }

  const handleAddRegistration = async () => {
    try {
      setIsNavigating(true)

      // Add a small delay to ensure loader is visible
      await new Promise(resolve => setTimeout(resolve, 100))
      await router.push(`/${locale}/apps/lims/sample-registration/add`)
    } catch (error) {
      console.error('Navigation failed:', error)
      toast.error('Failed to navigate to add registration page')
    } finally {
      setIsNavigating(false)
    }
  }

  const handleAction = (type: string, row: SampleRegistrationType) => {
    setDialogType(type)
    setOpenDialog(true)
    handleMenuClose()
    setSelectedSample(row)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setSelectedSample(null)
    setDialogType('')
  }

  const handleConfirmAction = () => {
    // Implement the logic to confirm the action
    handleCloseDialog()
  }

  const handleEditClick = (row: SampleRegistrationType) => {
    setSelectedRowForEdit(row)
    setShowEditDialog(true)
  }

  const handleCloseEditDialog = () => {
    setShowEditDialog(false)
    setSelectedRowForEdit(null)
  }

  const columns = useMemo<ColumnDef<SampleRegistrationType, any>[]>(
    () => [
      columnHelper.accessor('actions', {
        header: 'Actions',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <IconButton size='small' onClick={() => handleEditClick(row.original)} className='text-primary'>
              <EditIcon />
            </IconButton>
            <OptionMenu
              iconButtonProps={{ size: 'medium' }}
              iconClassName='text-textSecondary'
              options={[
                {
                  text: 'Sample Information',
                  icon: 'tabler-eye',
                  menuItemProps: {
                    onClick: () => handleAction('info', row.original)
                  }
                },
                {
                  text: 'Print Barcode',
                  icon: 'tabler-printer',
                  menuItemProps: {
                    onClick: () => handleAction('barcode', row.original)
                  }
                },
                {
                  text: 'Add Remarks',
                  icon: 'tabler-message',
                  menuItemProps: {
                    onClick: () => handleAction('remarks', row.original)
                  }
                },
                {
                  text: 'Generate eTRF',
                  icon: 'tabler-file-text',
                  menuItemProps: {
                    onClick: () => handleAction('etrf', row.original)
                  }
                },
                {
                  text: 'View Audit Trail',
                  icon: 'tabler-history',
                  menuItemProps: {
                    onClick: () => handleAction('audit', row.original)
                  }
                }
              ]}
            />
          </div>
        ),
        enableSorting: false
      }),
      columnHelper.accessor('registrationDateTime', {
        header: 'Registration Date/Time',
        cell: ({ row }) => <Typography>{row.original.registrationDateTime}</Typography>
      }),
      columnHelper.accessor('sampleId', {
        header: 'Sample ID',
        cell: ({ row }) => <Typography>{row.original.sampleId}</Typography>
      }),
      columnHelper.accessor('subjectId', {
        header: 'ID',
        cell: ({ row }) => <Typography>{row.original.subjectId}</Typography>
      }),
      columnHelper.accessor('gender', {
        header: 'Gender',
        cell: ({ row }) => <Typography>{row.original.gender}</Typography>
      }),
      columnHelper.accessor('name', {
        header: 'Name',
        cell: ({ row }) => <Typography>{row.original.name}</Typography>
      }),
      columnHelper.accessor('company', {
        header: 'Company',
        cell: ({ row }) => <Typography>{row.original.company}</Typography>
      }),
      columnHelper.accessor('branch', {
        header: 'Branch',
        cell: ({ row }) => <Typography>{row.original.branch}</Typography>
      })
    ],
    []
  )

  const table = useReactTable({
    data,
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
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  // PDF export handler function
  const handlePdfExport = async () => {
    setIsPdfLoading(true)

    try {
      const doc = new jsPDF()

      // Add title
      doc.setFontSize(16)
      doc.text('Sample Registration List', 14, 15)

      // Add date
      doc.setFontSize(10)
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22)

      // Prepare table data
      const tableData = table
        .getFilteredRowModel()
        .rows.map(row => [
          row.original.name,
          row.original.sampleId,
          row.original.subjectId,
          row.original.type,
          formatDate(row.original.registrationDateTime),
          row.original.testStatus,
          row.original.company,
          row.original.branch,
          row.original.laboratory,
          row.original.department
        ])

      // Add table
      autoTable(doc, {
        head: [
          [
            'Name',
            'Sample ID',
            'Subject ID',
            'Type',
            'Registration Date/Time',
            'Status',
            'Company',
            'Branch',
            'Laboratory',
            'Department'
          ]
        ],
        body: tableData,
        startY: 30,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 30 }
      })

      // Save the PDF
      doc.save(`sample-registration-${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success('PDF file downloaded successfully')
    } catch (error) {
      console.error('PDF export failed:', error)
      toast.error('Failed to download PDF file')
    } finally {
      setIsPdfLoading(false)
    }
  }

  // Excel export handler function
  const handleExportExcel = async () => {
    try {
      setIsExporting(true)

      // Prepare the data
      const exportData = sampleData.map(sample => ({
        'Registration Date/Time': sample.registrationDateTime,
        'Sample ID': sample.sampleId,
        ID: sample.subjectId,
        Gender: sample.gender,
        Name: sample.name,
        Company: sample.company,
        Branch: sample.branch,
        Type: sample.type,
        Laboratory: sample.laboratory,
        Department: sample.department,
        'Test Status': sample.testStatus,
        Test: sample.test,
        Panel: sample.panel
      }))

      // Create a worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData)

      // Create a workbook
      const workbook = XLSX.utils.book_new()

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample Registrations')

      // Generate Excel file
      XLSX.writeFile(workbook, 'sample_registrations.xlsx')

      toast.success('Excel file downloaded successfully')
    } catch (error) {
      console.error('Excel export failed:', error)
      toast.error('Failed to download Excel file')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <>
      <Card>
        <Backdrop
          sx={{
            color: '#fff',
            zIndex: theme => theme.zIndex.drawer + 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
          open={isNavigating}
        >
          <CircularProgress color='inherit' />
          <Typography variant='body1'>Navigating to Registration Form...</Typography>
        </Backdrop>
        <CardHeader
          title='Sample Registration'
          action={
            <div className='flex items-center gap-4'>
              <Button
                color='primary'
                variant='contained'
                startIcon={
                  isAddingRegistration ? <i className='tabler-loader animate-spin' /> : <i className='tabler-plus' />
                }
                onClick={handleAddRegistration}
                disabled={isAddingRegistration}
              >
                {isAddingRegistration ? 'Adding...' : 'Add Registration'}
              </Button>
              <Button
                variant='outlined'
                startIcon={
                  isExporting ? <i className='tabler-loader animate-spin' /> : <i className='tabler-file-spreadsheet' />
                }
                onClick={handleExportExcel}
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
            </div>
          }
        />
        <TableFilters setData={newData => setData(newData as SampleRegistrationType[])} sampleData={sampleData} />
        <div className='overflow-x-auto'>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
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
                      No samples registered
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map(row => (
                    <tr key={row.id}>
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
        <TablePaginationComponent table={table} />
      </Card>

      <Dialog open={showAuditTrailDialog} onClose={() => setShowAuditTrailDialog(false)} maxWidth='md' fullWidth>
        <DialogTitle>Audit Trail</DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Action</TableCell>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(selectedAuditTrail || []).map((entry, index) => (
                  <TableRow key={index}>
                    <TableCell>{entry.action}</TableCell>
                    <TableCell>{formatDate(entry.timestamp)}</TableCell>
                    <TableCell>{entry.user}</TableCell>
                    <TableCell>{entry.details}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAuditTrailDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth='md' fullWidth>
        <DialogTitle>
          {dialogType === 'info' && 'Sample Information'}
          {dialogType === 'barcode' && 'Print Barcode'}
          {dialogType === 'remarks' && 'Add Remarks'}
          {dialogType === 'etrf' && 'Generate eTRF'}
          {dialogType === 'audit' && 'Audit Trail'}
        </DialogTitle>
        <DialogContent>
          {dialogType === 'info' && (
            <Box sx={{ p: 2 }}>
              <Typography variant='h6'>Sample Details</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography>
                    <strong>Sample ID:</strong> {selectedSample?.sampleId}
                  </Typography>
                  <Typography>
                    <strong>Registration Date:</strong> {selectedSample?.registrationDateTime}
                  </Typography>
                  <Typography>
                    <strong>Subject ID:</strong> {selectedSample?.subjectId}
                  </Typography>
                  <Typography>
                    <strong>Name:</strong> {selectedSample?.name}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography>
                    <strong>Gender:</strong> {selectedSample?.gender}
                  </Typography>
                  <Typography>
                    <strong>Company:</strong> {selectedSample?.company}
                  </Typography>
                  <Typography>
                    <strong>Branch:</strong> {selectedSample?.branch}
                  </Typography>
                  <Typography>
                    <strong>Type:</strong> {selectedSample?.type}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
          {dialogType === 'remarks' && <TextField fullWidth multiline rows={4} label='Remarks' margin='normal' />}
          {dialogType === 'audit' && (
            <Box sx={{ p: 2 }}>
              <Typography variant='h6'>Audit Trail</Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Action</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Triggered By</TableCell>
                    <TableCell>Triggered On</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Reason</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedSample?.auditTrail?.map((entry, index) => (
                    <TableRow key={index}>
                      <TableCell>{entry.action}</TableCell>
                      <TableCell>{entry.details}</TableCell>
                      <TableCell>{entry.user}</TableCell>
                      <TableCell>{entry.timestamp}</TableCell>
                      <TableCell>{entry.status}</TableCell>
                      <TableCell>{entry.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          {dialogType !== 'info' && dialogType !== 'audit' && (
            <Button onClick={handleConfirmAction} variant='contained' color='primary'>
              Confirm
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={showEditDialog} onClose={handleCloseEditDialog} maxWidth='md' fullWidth>
        <DialogTitle>
          Edit Sample Registration
          <IconButton onClick={handleCloseEditDialog} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <i className='tabler-x' />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedRowForEdit && (
            <SampleRegistrationForm initialData={selectedRowForEdit} mode='edit' onClose={handleCloseEditDialog} />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default SampleRegistrationListTable
