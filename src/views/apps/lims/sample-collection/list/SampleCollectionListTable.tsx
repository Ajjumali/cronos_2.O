'use client'

// React Imports
import { useMemo, useState } from 'react'

// Next Imports
import { useParams } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
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
  Checkbox,
  CircularProgress
} from '@mui/material'
import {
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  History as HistoryIcon
} from '@mui/icons-material'

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
import { toast } from 'react-toastify'

// Type Imports
import type { ThemeColor } from '@core/types'

// eslint-disable-next-line import/no-unresolved
import CustomTextField from '@core/components/mui/TextField'

// eslint-disable-next-line import/no-unresolved
import OptionMenu from '@core/components/option-menu'

// eslint-disable-next-line import/no-unresolved
import tableStyles from '@core/styles/table.module.css'

import type { SampleCollectionType } from '@/app/api/apps/lims/sample-collection/route'

// eslint-disable-next-line import/no-unresolved
import { formatDate } from '@/utils/dateUtils'

// Component Imports
// eslint-disable-next-line import/no-unresolved
import TablePaginationComponent from '@/components/TablePaginationComponent'
import TableFilters from './TableFilters'


// Style Imports

declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

type SampleWithActionsType = SampleCollectionType & {
  actions?: string
}

type collectionStatusType = {
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

const collectionStatusObj: collectionStatusType = {
  Pending: { title: 'Pending', color: 'warning' },
  Collected: { title: 'Collected', color: 'success' },
  Rejected: { title: 'Rejected', color: 'error' },
  Outsourced: { title: 'Outsourced', color: 'info' }
}

const columnHelper = createColumnHelper<SampleWithActionsType>()

type Props = {
  sampleData?: SampleCollectionType[]
  onDataChange?: () => void
}

const SampleCollectionListTable = ({ sampleData = [], onDataChange }: Props): JSX.Element => {
  // States
  const [data, setData] = useState<SampleCollectionType[]>(sampleData)
  const [globalFilter, setGlobalFilter] = useState('')
  const [isPdfLoading, setIsPdfLoading] = useState(false)
  const [isExcelLoading, setIsExcelLoading] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedRow, setSelectedRow] = useState<SampleWithActionsType | null>(null)
  const [rowSelection, setRowSelection] = useState({})
  const [showBulkOutsourceConfirm, setShowBulkOutsourceConfirm] = useState(false)
  const [showBulkCollectConfirm, setShowBulkCollectConfirm] = useState(false)
  const [showBulkPrintConfirm, setShowBulkPrintConfirm] = useState(false)
  const [showBulkRejectConfirm, setShowBulkRejectConfirm] = useState(false)
  const [selectedSamplesForBulkAction, setSelectedSamplesForBulkAction] = useState<number[]>([])
  const [showVolumeInputDialog, setShowVolumeInputDialog] = useState(false)
  const [selectedSampleForVolume, setSelectedSampleForVolume] = useState<SampleWithActionsType | null>(null)
  const [volume, setVolume] = useState<string>('')
  const [showAuditTrailDialog, setShowAuditTrailDialog] = useState(false)
  const [selectedSampleForAudit, setSelectedSampleForAudit] = useState<SampleWithActionsType | null>(null)
  const [auditTrailData, setAuditTrailData] = useState<any[]>([])
  const [showBarcodeScanDialog, setShowBarcodeScanDialog] = useState(false)
  const [selectedSampleForScan, setSelectedSampleForScan] = useState<SampleWithActionsType | null>(null)
  const [barcodeInput, setBarcodeInput] = useState('')
  const [isScanning, setIsScanning] = useState(false)

  // Hooks
  const { lang: locale } = useParams()


  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedRow(null)
  }

  const handleBulkOutsource = () => {
    const selectedIds = Object.keys(rowSelection).map(key => data[parseInt(key)].id)

    if (selectedIds.length > 0) {
      setSelectedSamplesForBulkAction(selectedIds)
      setShowBulkOutsourceConfirm(true)
    }
  }

  const handleBulkCollect = () => {
    const selectedIds = Object.keys(rowSelection).map(key => data[parseInt(key)].id)

    if (selectedIds.length > 0) {
      setSelectedSamplesForBulkAction(selectedIds)
      setShowBulkCollectConfirm(true)
    }
  }

  const handleBulkPrintBarcode = () => {
    const selectedIds = Object.keys(rowSelection).map(key => data[parseInt(key)].id)

    if (selectedIds.length > 0) {
      setSelectedSamplesForBulkAction(selectedIds)
      setShowBulkPrintConfirm(true)
    }
  }

  const handleBulkReject = () => {
    const selectedIds = Object.keys(rowSelection).map(key => data[parseInt(key)].id)

    if (selectedIds.length > 0) {
      setSelectedSamplesForBulkAction(selectedIds)
      setShowBulkRejectConfirm(true)
    }
  }

  const handleBulkOutsourceConfirm = async () => {
    try {
      // TODO: Implement bulk outsource logic
      toast.success('Selected samples outsourced successfully')
      onDataChange?.()
    } catch (error) {
      console.error('Error outsourcing samples:', error)
      toast.error('Failed to outsource samples')
    } finally {
      setShowBulkOutsourceConfirm(false)
      setSelectedSamplesForBulkAction([])
    }
  }

  const handleBulkCollectConfirm = async () => {
    try {
      // TODO: Implement bulk collect logic
      toast.success('Selected samples collected successfully')
      onDataChange?.()
    } catch (error) {
      console.error('Error collecting samples:', error)
      toast.error('Failed to collect samples')
    } finally {
      setShowBulkCollectConfirm(false)
      setSelectedSamplesForBulkAction([])
    }
  }

  const handleBulkPrintBarcodeConfirm = async () => {
    try {
      // TODO: Implement bulk print barcode logic
      toast.success('Barcodes printed successfully')
    } catch (error) {
      console.error('Error printing barcodes:', error)
      toast.error('Failed to print barcodes')
    } finally {
      setShowBulkPrintConfirm(false)
      setSelectedSamplesForBulkAction([])
    }
  }

  const handleBulkRejectConfirm = async () => {
    try {
      // TODO: Implement bulk reject logic
      toast.success('Selected samples rejected successfully')
      onDataChange?.()
    } catch (error) {
      console.error('Error rejecting samples:', error)
      toast.error('Failed to reject samples')
    } finally {
      setShowBulkRejectConfirm(false)
      setSelectedSamplesForBulkAction([])
    }
  }

  const handleVolumeInput = (sample: SampleWithActionsType) => {
    setSelectedSampleForVolume(sample)
    setShowVolumeInputDialog(true)
  }

  const handleVolumeSubmit = async () => {
    if (!selectedSampleForVolume || !volume) return

    try {
      // TODO: Implement volume update API call
      toast.success('Volume updated successfully')
      onDataChange?.()
    } catch (error) {
      console.error('Error updating volume:', error)
      toast.error('Failed to update volume')
    } finally {
      setShowVolumeInputDialog(false)
      setSelectedSampleForVolume(null)
      setVolume('')
    }
  }

  const handleAuditTrail = async (sample: SampleWithActionsType) => {
    setSelectedSampleForAudit(sample)
    setShowAuditTrailDialog(true)

    try {
      // TODO: Implement audit trail API call
      // Mock data for now
      setAuditTrailData([
        {
          action: 'Sample Collection',
          description: 'Sample collected manually',
          triggeredBy: 'John Doe',
          triggeredOn: '2024-03-20 10:30:00',
          status: 'Completed',
          reason: 'Regular collection',
          volunteerId: 'VOL001',
          barcodeId: 'BAR001'
        }
      ])
    } catch (error) {
      console.error('Error fetching audit trail:', error)
      toast.error('Failed to fetch audit trail')
    }
  }

  const handleBarcodeScan = (sample: SampleWithActionsType) => {
    setSelectedSampleForScan(sample)
    setShowBarcodeScanDialog(true)
    setIsScanning(true)

    // TODO: Implement barcode scanner activation
  }

  const handleBarcodeSubmit = async () => {
    if (!selectedSampleForScan || !barcodeInput) return

    try {
      // TODO: Implement barcode validation and collection API call
      toast.success('Sample collected successfully')
      onDataChange?.()
    } catch (error) {
      console.error('Error collecting sample:', error)
      toast.error('Failed to collect sample')
    } finally {
      setShowBarcodeScanDialog(false)
      setSelectedSampleForScan(null)
      setBarcodeInput('')
      setIsScanning(false)
    }
  }

  const columns = useMemo<ColumnDef<SampleWithActionsType, any>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            {...{
              checked: table.getIsAllRowsSelected(),
              indeterminate: table.getIsSomeRowsSelected(),
              onChange: table.getToggleAllRowsSelectedHandler()
            }}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            {...{
              checked: row.getIsSelected(),
              disabled: !row.getCanSelect(),
              indeterminate: row.getIsSomeSelected(),
              onChange: row.getToggleSelectedHandler()
            }}
          />
        ),
        enableHiding: false
      },
      columnHelper.accessor('employeeName', {
        header: 'Employee Name',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('sampleId', {
        header: 'Sample ID',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('employeeId', {
        header: 'Employee ID',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('collectedBy', {
        header: 'Collected By',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('collectedOn', {
        header: 'Collected On',
        cell: info => formatDate(info.getValue())
      }),
      columnHelper.accessor('collectionStatus', {
        header: 'Status',
        cell: info => {
          const status = info.getValue()

          
return (
            <Chip
              label={collectionStatusObj[status]?.title}
              color={collectionStatusObj[status]?.color}
              size='small'
            />
          )
        }
      }),
      columnHelper.accessor('actions', {
        header: 'Actions',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            <IconButton 
              title="Add Volume"
              onClick={() => handleVolumeInput(row.original)}
              disabled={row.original.collectionStatus === 'Collected'}
            >
              <AddIcon />
            </IconButton>
            <IconButton title="Manual Collection">
              <CheckCircleIcon />
            </IconButton>
            <IconButton 
              title="View Audit Trail"
              onClick={() => handleAuditTrail(row.original)}
            >
              <HistoryIcon />
            </IconButton>
            <IconButton 
              title="Scan Barcode"
              onClick={() => handleBarcodeScan(row.original)}
              disabled={row.original.collectionStatus === 'Collected'}
            >
              <i className='tabler-scan' />
            </IconButton>
            <OptionMenu
              iconButtonProps={{ size: 'medium' }}
              iconClassName='text-textSecondary'
              options={[
                {
                  text: 'Reject Sample',
                  icon: 'tabler-x',
                  menuItemProps: {
                    onClick: () => handleMenuClose(),
                    className: 'text-error'
                  }
                },
                {
                  text: 'Print Barcode',
                  icon: 'tabler-printer',
                  menuItemProps: {
                    onClick: () => handleMenuClose(),
                    className: 'text-primary'
                  }
                },
                {
                  text: 'Sample Info',
                  icon: 'tabler-eye',
                  menuItemProps: {
                    onClick: () => handleMenuClose(),
                    className: 'text-info'
                  }
                },
                {
                  text: 'Add Remark',
                  icon: 'tabler-message',
                  menuItemProps: {
                    onClick: () => handleMenuClose(),
                    className: 'text-secondary'
                  }
                },
                {
                  text: 'Outsource Sample',
                  icon: 'tabler-external-link',
                  menuItemProps: {
                    onClick: () => handleMenuClose(),
                    className: 'text-warning'
                  }
                },
                {
                  text: 'Download eTRF',
                  icon: 'tabler-download',
                  menuItemProps: {
                    onClick: () => handleMenuClose(),
                    className: 'text-success'
                  }
                }
              ]}
            />
          </div>
        ),
        enableSorting: false
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
      rowSelection,
      globalFilter
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
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
      doc.text('Sample Collection List', 14, 15)
      
      // Add date
      doc.setFontSize(10)
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22)

      // Prepare table data
      const tableData = table.getFilteredRowModel().rows.map(row => [
        row.original.employeeName,
        row.original.sampleId,
        row.original.employeeId,
        row.original.collectedBy,
        formatDate(row.original.collectedOn),
        row.original.collectionStatus,
        row.original.sampleType,
        row.original.location,
        row.original.laboratory
      ])

      // Add table
      autoTable(doc, {
        head: [['Employee Name', 'Sample ID', 'Employee ID', 'Collected By', 'Collected On', 'Status', 'Sample Type', 'Location', 'Laboratory']],
        body: tableData,
        startY: 30,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 30 }
      })

      // Save the PDF
      doc.save(`sample-collection-${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success('PDF file downloaded successfully')
    } catch (error) {
      console.error('PDF export failed:', error)
      toast.error('Failed to download PDF file')
    } finally {
      setIsPdfLoading(false)
    }
  }

  // Excel export handler function
  const handleExcelExport = async () => {
    setIsExcelLoading(true)

    try {
      const headers = ['Employee Name', 'Sample ID', 'Employee ID', 'Collected By', 'Collected On', 'Status', 'Sample Type', 'Location', 'Laboratory']

      const csvData = table.getFilteredRowModel().rows.map(row => [
        row.original.employeeName,
        row.original.sampleId,
        row.original.employeeId,
        row.original.collectedBy,
        formatDate(row.original.collectedOn),
        row.original.collectionStatus,
        row.original.sampleType,
        row.original.location,
        row.original.laboratory
      ])

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')

      link.href = URL.createObjectURL(blob)
      link.download = `sample-collection-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      toast.success('Excel file downloaded successfully')
    } catch (error) {
      console.error('Excel export failed:', error)
      toast.error('Failed to download Excel file')
    } finally {
      setIsExcelLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader 
        title='Sample Collection List'
        action={
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant='outlined'
              startIcon={
                isExcelLoading ? (
                  <i className='tabler-loader animate-spin' />
                ) : (
                  <i className='tabler-file-spreadsheet' />
                )
              }
              onClick={handleExcelExport}
              disabled={isExcelLoading}
            >
              {isExcelLoading ? 'Exporting...' : 'Excel'}
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
      <TableFilters setData={setData} sampleData={sampleData} />
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
                  No samples registered
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
      <TablePaginationComponent table={table} />
      
      {/* Bulk Action Buttons */}
      <div className='flex items-center justify-center gap-4 p-4 border-t'>
        <Button
          variant='contained'
          color='warning'
          startIcon={<i className='tabler-external-link' />}
          disabled={Object.keys(rowSelection).length === 0}
          onClick={handleBulkOutsource}
        >
          Outsource
        </Button>
        <Button
          variant='contained'
          color='success'
          startIcon={<i className='tabler-check' />}
          disabled={Object.keys(rowSelection).length === 0}
          onClick={handleBulkCollect}
        >
          Collect
        </Button>
        <Button
          variant='contained'
          color='info'
          startIcon={<i className='tabler-printer' />}
          disabled={Object.keys(rowSelection).length === 0}
          onClick={handleBulkPrintBarcode}
        >
          Print Barcode
        </Button>
        <Button
          variant='contained'
          color='error'
          startIcon={<i className='tabler-x' />}
          disabled={Object.keys(rowSelection).length === 0}
          onClick={handleBulkReject}
        >
          Reject
        </Button>
      </div>

      {/* Confirmation Dialogs */}
      <Dialog
        open={showBulkOutsourceConfirm}
        onClose={() => setShowBulkOutsourceConfirm(false)}
      >
        <DialogTitle>Confirm Outsource</DialogTitle>
        <DialogContent>
          Are you sure you want to outsource the selected samples?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBulkOutsourceConfirm(false)}>Cancel</Button>
          <Button onClick={handleBulkOutsourceConfirm} color='warning' variant='contained'>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showBulkCollectConfirm}
        onClose={() => setShowBulkCollectConfirm(false)}
      >
        <DialogTitle>Confirm Collection</DialogTitle>
        <DialogContent>
          Are you sure you want to collect the selected samples?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBulkCollectConfirm(false)}>Cancel</Button>
          <Button onClick={handleBulkCollectConfirm} color='success' variant='contained'>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showBulkPrintConfirm}
        onClose={() => setShowBulkPrintConfirm(false)}
      >
        <DialogTitle>Confirm Print</DialogTitle>
        <DialogContent>
          Are you sure you want to print barcodes for the selected samples?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBulkPrintConfirm(false)}>Cancel</Button>
          <Button onClick={handleBulkPrintBarcodeConfirm} color='info' variant='contained'>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showBulkRejectConfirm}
        onClose={() => setShowBulkRejectConfirm(false)}
      >
        <DialogTitle>Confirm Rejection</DialogTitle>
        <DialogContent>
          Are you sure you want to reject the selected samples?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBulkRejectConfirm(false)}>Cancel</Button>
          <Button onClick={handleBulkRejectConfirm} color='error' variant='contained'>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showVolumeInputDialog}
        onClose={() => setShowVolumeInputDialog(false)}
      >
        <DialogTitle>Add Sample Volume</DialogTitle>
        <DialogContent>
          <CustomTextField
            fullWidth
            label='Volume'
            type='number'
            value={volume}
            onChange={(e) => {
              const value = e.target.value

              if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 9999)) {
                setVolume(value)
              }
            }}
            inputProps={{ max: 9999, min: 0 }}
            error={volume !== '' && (parseInt(volume) < 0 || parseInt(volume) > 9999)}
            helperText={volume !== '' && (parseInt(volume) < 0 || parseInt(volume) > 9999) ? 'Please enter a valid number between 0 and 9999' : ''}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowVolumeInputDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleVolumeSubmit} 
            color='primary' 
            variant='contained'
            disabled={!volume || parseInt(volume) < 0 || parseInt(volume) > 9999}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showAuditTrailDialog}
        onClose={() => setShowAuditTrailDialog(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>Audit Trail</DialogTitle>
        <DialogContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Action</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Triggered By</TableCell>
                  <TableCell>Triggered On</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Volunteer ID</TableCell>
                  <TableCell>Barcode ID</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {auditTrailData.map((audit, index) => (
                  <TableRow key={index}>
                    <TableCell>{audit.action}</TableCell>
                    <TableCell>{audit.description}</TableCell>
                    <TableCell>{audit.triggeredBy}</TableCell>
                    <TableCell>{audit.triggeredOn}</TableCell>
                    <TableCell>{audit.status}</TableCell>
                    <TableCell>{audit.reason}</TableCell>
                    <TableCell>{audit.volunteerId}</TableCell>
                    <TableCell>{audit.barcodeId}</TableCell>
                  </TableRow>
                ))}
                {auditTrailData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No audit trail data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAuditTrailDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showBarcodeScanDialog}
        onClose={() => setShowBarcodeScanDialog(false)}
      >
        <DialogTitle>Scan Barcode</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            {isScanning ? (
              <CircularProgress />
            ) : (
              <CustomTextField
                fullWidth
                label='Barcode'
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                autoFocus
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBarcodeScanDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleBarcodeSubmit} 
            color='primary' 
            variant='contained'
            disabled={!barcodeInput || isScanning}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default SampleCollectionListTable
