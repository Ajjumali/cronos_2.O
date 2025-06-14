'use client'

// React Imports
import { useEffect, useMemo, useState } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

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
import Menu from '@mui/material/Menu'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import CircularProgress from '@mui/material/CircularProgress'
import Backdrop from '@mui/material/Backdrop'

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
import { toast } from 'react-toastify'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Type Imports
import type { ThemeColor } from '@core/types'
import type { Locale } from '@configs/i18n'
import type { TestResultType, StatusType, SampleType } from '@/types/apps/limsTypes'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'
import CustomTextField from '@core/components/mui/TextField'
import OptionMenu from '@core/components/option-menu'
import TableFilters from './TableFilters'
import RemarkDialog from '@/components/dialogs/test-result/remark-dialog'
import BarcodePrintDialog from '@/components/dialogs/barcode-print'
import SampleDetailsDialog from '@/components/dialogs/sample-details'
import ConfirmDialog from '@/components/dialogs/ConfirmDialog/ConfirmDialog'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

// Style Imports
import tableStyles from '@core/styles/table.module.css'
import TablePaginationComponent from '@/components/TablePaginationComponent'

// API Imports
import { testResultsService } from '@/app/api/apps/lims/Test-results/route'

declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

type StatusKey = 'null' | 1 | 2 | 3 | 4 | 5 | 6
type StatusMapType = Record<StatusKey, { label: string; color: 'warning' | 'success' | 'error' | 'info' | 'secondary' }>

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })
  return itemRank.passed
}

const statusMap: StatusMapType = {
  null: { label: 'Pending', color: 'warning' },
  1: { label: 'Received', color: 'success' },
  2: { label: 'Rejected', color: 'error' },
  3: { label: 'Pending', color: 'warning' },
  4: { label: 'In Progress', color: 'info' },
  5: { label: 'Completed', color: 'success' },
  6: { label: 'Outsourced', color: 'secondary' }
}

const columnHelper = createColumnHelper<TestResultType>()

const formatDate = (dateString?: string) => {
  if (!dateString) return '-'

  try {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')

    return `${day}-${month}-${year} ${hours}:${minutes}`
  } catch (error) {
    return '-'
  }
}

const TestResultsTable = ({ testData, onDataChange }: { testData?: TestResultType[]; onDataChange?: () => void }) => {
  const router = useRouter()
  const { lang: locale } = useParams()
  const initialData = Array.isArray(testData) ? testData : []
  const [data, setData] = useState<TestResultType[]>(initialData)
  const [filteredData, setFilteredData] = useState<TestResultType[]>(initialData)
  const [globalFilter, setGlobalFilter] = useState('')
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null)
  const [remarkDialogOpen, setRemarkDialogOpen] = useState(false)
  const [isPdfLoading, setIsPdfLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [showBarcodeDialog, setShowBarcodeDialog] = useState<boolean>(false)
  const [selectedTest, setSelectedTest] = useState<TestResultType | null>(null)
  const [columnVisibility, setColumnVisibility] = useState({})
  const [columnMenuAnchor, setColumnMenuAnchor] = useState<null | HTMLElement>(null)
  const [showSampleDetails, setShowSampleDetails] = useState(false)
  const [selectedSampleForDetails, setSelectedSampleForDetails] = useState<TestResultType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showRejectConfirm, setShowRejectConfirm] = useState(false)
  const [selectedTestForReject, setSelectedTestForReject] = useState<TestResultType | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [isNavigating, setIsNavigating] = useState(false)

  useEffect(() => {
    if (testData) {
      setData(testData)
      setFilteredData(testData)
      setIsLoading(false)
    }
  }, [testData])

  const columns = useMemo<ColumnDef<TestResultType, any>[]>(
    () => [
      {
        id: 'actions',
        header: 'Actions',
        cell: info => {
          const test = info.row.original

          return (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <OptionMenu
                iconButtonProps={{ size: 'medium' }}
                iconClassName='text-textSecondary'
                options={[
                  {
                    text: 'View Details',
                    icon: 'tabler-eye',
                    menuItemProps: {
                      onClick: () => {
                        setSelectedSampleForDetails(test)
                        setShowSampleDetails(true)
                      },
                      className: 'text-info'
                    }
                  },
                  {
                    text: 'Print Barcode',
                    icon: 'tabler-printer',
                    menuItemProps: {
                      onClick: () => {
                        setSelectedTest(test)
                        setShowBarcodeDialog(true)
                      },
                      className: 'text-primary'
                    }
                  },
                  {
                    text: 'Add Remarks',
                    icon: 'tabler-message',
                    menuItemProps: {
                      onClick: () => {
                        setSelectedTestId(test.id)
                        setRemarkDialogOpen(true)
                      },
                      className: `text-${test.remarks ? 'error' : 'secondary'}`
                    }
                  }
                ]}
              />
            </Box>
          )
        }
      },
      columnHelper.accessor('registrationDate', {
        header: 'Registration Date',
        cell: info => formatDate(info.getValue())
      }),
      columnHelper.accessor('sampleTypeId', {
        header: 'Sample ID',
        cell: info => info.getValue() || '-'
      }),
      columnHelper.accessor('subjectId', {
        header: 'Volunteer ID',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('gender', {
        header: 'Gender',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('VolunteerName', {
        header: 'VolunteerName',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('testPanelName', {
        header: 'Test Panel',
        cell: info => info.getValue() || '-'
      }),
      columnHelper.accessor('sampleType', {
        header: 'Sample Type',
        cell: info => (
          <Typography
            component='span'
            sx={{
              color: 'primary.main',
              cursor: 'pointer',
              '&:hover': { textDecoration: 'underline' }
            }}
            onClick={() => openValidateSample(info.row.original)}
          >
            {info.getValue() || '-'}
          </Typography>
        )
      }),
      columnHelper.accessor('StatusID', {
        header: 'Status',
        enableHiding: true,
        cell: ({ row }) => {
          const statusId = row.original.StatusID
          const statusInfo = statusMap[statusId as keyof StatusMapType] || statusMap['null']
          return (
            <Chip
              label={statusInfo.label}
              variant='tonal'
              color={statusInfo.color}
              size='small'
              sx={{
                minWidth: '100px',
                justifyContent: 'center',
                fontWeight: 500
              }}
            />
          )
        }
      })
    ],
    []
  )

  const table = useReactTable<TestResultType>({
    data: filteredData,
    columns,
    state: {
      columnVisibility
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    filterFns: {
      fuzzy: fuzzyFilter
    }
  })

  const handleFilterChange = (filters: any) => {
    let filtered = [...data]

    if (filters.status) {
      filtered = filtered.filter(item => (item as TestResultType).StatusID === filters.status)
    }

    if (filters.testType) {
      filtered = filtered.filter(item => (item as TestResultType).testName === filters.testType)
    }

    if (filters.dateRange?.start && filters.dateRange?.end) {
      filtered = filtered.filter(item => {
        const date = new Date((item as TestResultType).registrationDate)
        return date >= new Date(filters.dateRange.start) && date <= new Date(filters.dateRange.end)
      })
    }

    setFilteredData(filtered)
  }

  const handleRemarks = (id: number) => {
    setSelectedTestId(id)
    setRemarkDialogOpen(true)
  }

  const handleRemarkSuccess = async () => {
    try {
      const response = await testResultsService.getTestResults()
      setData(response.result)
      toast.success('Remarks updated successfully')
    } catch (error) {
      console.error('Error updating remarks:', error)
      toast.error('Failed to update remarks')
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const response = await fetch('/api/apps/lims/test-results?action=download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileType: 'CSV' })
      })

      if (!response.ok) {
        throw new Error('Failed to download file')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Test_Results_${new Date().toISOString().replace(/[:.]/g, '_')}.csv`
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

  const handlePdfExport = async () => {
    setIsPdfLoading(true)
    try {
      const doc = new jsPDF()

      // Add title
      doc.setFontSize(16)
      doc.text('Test Results List', 14, 15)

      // Add date
      doc.setFontSize(10)
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22)

      // Prepare table data
      const tableData = data.map(test => [
        test.registrationDate ? formatDate(test.registrationDate) : '-',
        test.sampleTypeId || '-',
        test.subjectId || '-',
        test.gender || '-',
        test.VolunteerName || '-',
        test.testPanelName || '-',
        test.sampleType || '-',
        test.StatusID || '-',
        test.performedBy || '-',
        test.performedOn ? formatDate(test.performedOn) : '-',
        test.verifiedBy || '-',
        test.verifiedOn ? formatDate(test.verifiedOn) : '-'
      ])

      // Add table using autoTable
      autoTable(doc, {
        head: [
          [
            'Registration Date',
            'Sample ID',
            'Volunteer ID',
            'Gender',
            'Name',
            'Test Panel',
            'Sample Type',
            'Status',
            'Performed By',
            'Performed On',
            'Verified By',
            'Verified On'
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
      doc.save(`test-results-${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success('PDF file downloaded successfully')
    } catch (error) {
      console.error('PDF export failed:', error)
      toast.error('Failed to download PDF file')
    } finally {
      setIsPdfLoading(false)
    }
  }

  const openSampleDetails = (row: TestResultType) => {
    // Example: navigate to a details page or open a modal
    // For navigation:
    router.push(getLocalizedUrl(`/apps/lims/test-results/Test-Detail/${row.id}`, locale as Locale))
    // Or for modal: set some state to show details
  }

  const printBarcode = (row: TestResultType) => {
    // Example: Open a barcode print dialog or trigger print logic
    // setSelectedSample(row); setShowBarcodeDialog(true);
    toast.info(`Print barcode for Sample ID: ${row.sampleTypeId}`)
  }

  const openRemarkDialog = (row: TestResultType) => {
    setSelectedTestId(row.id)
    setRemarkDialogOpen(true)
  }

  const openOutsourceDialog = (row: TestResultType) => {
    // Example: Open an outsource dialog or trigger outsource logic
    toast.info(`Outsource sample with ID: ${row.sampleTypeId}`)
  }

  const openValidateSample = (row: TestResultType) => {
    setIsNavigating(true)
    try {
      router.push(getLocalizedUrl(`/apps/lims/test-results/validate-sample/${row.sampleTypeId}`, locale as Locale))
    } catch (error: unknown) {
      console.error('Navigation error:', error)
      setIsNavigating(false)
      toast.error('Failed to navigate to validate sample page')
    }
  }

  const handleRejectConfirm = async () => {
    if (!selectedTestForReject || !rejectReason.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }
  }

  const mapToSampleType = (testResult: TestResultType | null): SampleType | null => {
    if (!testResult) return null
    return {
      sampleId: testResult.sampleTypeId || 0,
      volunteerId: testResult.subjectId || '',
      name: testResult.VolunteerName || '',
      gender: testResult.gender || '',
      testPanelName: testResult.testPanelName || '',
      testName: testResult.testName || '',
      result: testResult.result || '',
      unit: testResult.unit || '',
      referenceRange: testResult.referenceRange || '',
      status: testResult.StatusID.toString() || '',
      registrationDateTime: testResult.registrationDate || '',
      performedBy: testResult.performedBy || '',
      performedOn: testResult.performedOn || '',
      verifiedBy: testResult.verifiedBy || '',
      verifiedOn: testResult.verifiedOn || '',
      remarks: testResult.remarks || '',
      sampleType: testResult.sampleType || '',
      isActive: true
    }
  }

  return (
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
        <Typography variant='body1'>Navigating to validate sample...</Typography>
      </Backdrop>
      <CardHeader
        title='Test Validation'
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
          </Box>
        }
      />
      <Divider />
      <TableFilters setData={setFilteredData} testData={data} />
      <div className={tableStyles.tableContainer}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
            <CircularProgress />
          </Box>
        ) : (
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
              {table.getRowModel().rows.map(row => (
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <TablePaginationComponent table={table} />
      <div className='flex items-center justify-center gap-4 p-4 border-t'></div>

      <RemarkDialog
        open={remarkDialogOpen}
        onClose={() => setRemarkDialogOpen(false)}
        onSuccess={handleRemarkSuccess}
        id={selectedTestId}
        type='test'
      />
      <BarcodePrintDialog
        open={showBarcodeDialog}
        setOpen={setShowBarcodeDialog}
        sampleId={selectedTest?.sampleTypeId || 0}
        barcodeId={selectedTest?.sampleTypeId ? String(selectedTest.sampleTypeId) : undefined}
      />
      <SampleDetailsDialog
        open={showSampleDetails}
        onClose={() => setShowSampleDetails(false)}
        sample={mapToSampleType(selectedSampleForDetails)}
      />
      <ConfirmDialog
        open={showRejectConfirm}
        title='Confirm Rejection'
        description={
          <div className='flex flex-col gap-4'>
            <Typography>Do you want to reject test for sample {selectedTestForReject?.sampleTypeId}?</Typography>
            <CustomTextField
              fullWidth
              multiline
              rows={3}
              label='Reason for Rejection'
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              required
              error={!rejectReason.trim()}
              helperText={!rejectReason.trim() ? 'Please provide a reason for rejection' : ''}
            />
          </div>
        }
        okText='Yes'
        cancelText='No'
        handleClose={() => {
          setShowRejectConfirm(false)
          setSelectedTestForReject(null)
          setRejectReason('')
        }}
        handleConfirm={handleRejectConfirm}
      />
    </Card>
  )
}

export default TestResultsTable
