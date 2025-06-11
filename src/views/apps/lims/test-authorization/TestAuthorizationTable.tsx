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
import dynamic from 'next/dynamic'

// Type Imports
import type { ThemeColor } from '@core/types'
import type { Locale } from '@configs/i18n'
import type { TestAuthorizationType } from '@/types/apps/limsTypes'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'
import CustomTextField from '@core/components/mui/TextField'
import OptionMenu from '@core/components/option-menu'
import TableFilters from './TableFilters'
import RemarkDialog from '@/components/dialogs/test-result/remark-dialog'
import BarcodePrintDialog from '@/components/dialogs/barcode-print'
import TestAuthorizationDetailsDialog from '@/components/dialogs/test-authorization-details'
import ConfirmDialog from '@/components/dialogs/ConfirmDialog/ConfirmDialog'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

// Style Imports
import tableStyles from '@core/styles/table.module.css'
import TablePaginationComponent from '@/components/TablePaginationComponent'

// API Imports
import { testAuthorizationService } from '@/app/api/apps/lims/Test-authorization/route'

declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

type TestAuthorizationWithActionsType = TestAuthorizationType & {
  actions?: string
}

type TestStatusType = {
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

const testStatusObj: TestStatusType = {
  Pending: { title: 'Pending', color: 'warning' },
  Approved: { title: 'Approved', color: 'success' },
  Rejected: { title: 'Rejected', color: 'error' }
}

const columnHelper = createColumnHelper<TestAuthorizationWithActionsType>()

const formatDate = (dateString?: string) => {
  if (!dateString) return '-'

  try {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()

    return `${day}-${month}-${year}`
  } catch (error) {
    return '-'
  }
}

const TestAuthorizationTable = ({ testData }: { testData?: TestAuthorizationType[] }) => {
  const router = useRouter()
  const { lang: locale } = useParams()
  const initialData = Array.isArray(testData) ? testData : []
  const [data, setData] = useState<TestAuthorizationType[]>(initialData)
  const [filteredData, setFilteredData] = useState<TestAuthorizationType[]>(initialData)
  const [globalFilter, setGlobalFilter] = useState('')
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null)
  const [remarkDialogOpen, setRemarkDialogOpen] = useState(false)
  const [isPdfLoading, setIsPdfLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [showBarcodeDialog, setShowBarcodeDialog] = useState<boolean>(false)
  const [selectedTest, setSelectedTest] = useState<TestAuthorizationType | null>(null)
  const [columnVisibility, setColumnVisibility] = useState({})
  const [columnMenuAnchor, setColumnMenuAnchor] = useState<null | HTMLElement>(null)
  const [showSampleDetails, setShowSampleDetails] = useState(false)
  const [selectedSampleForDetails, setSelectedSampleForDetails] = useState<TestAuthorizationType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showRejectConfirm, setShowRejectConfirm] = useState(false)
  const [selectedTestForReject, setSelectedTestForReject] = useState<TestAuthorizationType | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [isNavigating, setIsNavigating] = useState(false)

  useEffect(() => {
    if (testData) {
      setData(testData)
      setFilteredData(testData)
      setIsLoading(false)
    }
  }, [testData])

  const columns = useMemo<ColumnDef<TestAuthorizationWithActionsType, any>[]>(
    () => [
      columnHelper.accessor('registrationDateTime', {
        header: 'Registration Date',
        cell: info => formatDate(info.getValue())
      }),
      columnHelper.accessor('sampleId', {
        header: 'Sample ID',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('volunteerId', {
        header: 'Volunteer ID',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('gender', {
        header: 'Gender',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('name', {
        header: 'Name',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('testPanelName', {
        header: 'Test Panel',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('sampleType', {
        header: 'Sample Type',
        cell: info => (
          <Typography
            component="span"
            sx={{ 
              color: 'primary.main', 
              cursor: 'pointer',
              '&:hover': { textDecoration: 'underline' }
            }}
            onClick={() => openValidateSample(info.row.original)}
          >
            {info.getValue()}
          </Typography>
        )
      }),
      columnHelper.accessor('authorizationStatus', {
        header: 'Status',
        cell: info => {
          const authStatus = info.getValue() as string
          const statusInfo = testStatusObj[authStatus] || { title: authStatus, color: 'default' }

          return (
            <Chip
              label={statusInfo.title}
              color={statusInfo.color}
              size="small"
              sx={{ minWidth: '100px' }}
            />
          )
        }
      }),
      columnHelper.accessor('actions', {
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
      })
    ],
    []
  )

  const table = useReactTable<TestAuthorizationWithActionsType>({
    data: filteredData as TestAuthorizationWithActionsType[],
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
      filtered = filtered.filter(item => item.authorizationStatus === filters.status)
    }

    if (filters.testType) {
      filtered = filtered.filter(item => item.testName === filters.testType)
    }

    if (filters.dateRange?.start && filters.dateRange?.end) {
      filtered = filtered.filter(item => {
        const date = new Date(item.registrationDateTime)
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
      const response = await testAuthorizationService.getTestAuthorizations()
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
      const response = await fetch('/api/apps/lims/test-authorization?action=download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileType: 'CSV' })
      });

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Test_Authorizations_${new Date().toISOString().replace(/[:.]/g, '_')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('CSV file downloaded successfully');
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to download CSV file');
    } finally {
      setIsExporting(false)
    }
  }

  const handlePdfExport = async () => {
    setIsPdfLoading(true)
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(16);
      doc.text('Test Authorizations List', 14, 15);
      
      // Add date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

      // Prepare table data
      const tableData = data.map(test => [
        test.registrationDateTime ? formatDate(test.registrationDateTime) : '-',
        test.sampleId || '-',
        test.volunteerId || '-',
        test.gender || '-',
        test.name || '-',
        test.testPanelName || '-',
        test.sampleType || '-',
        test.authorizationStatus || '-',
        test.authorizedBy || '-',
        test.authorizedOn ? formatDate(test.authorizedOn) : '-'
      ]);

      // Add table using autoTable
      autoTable(doc, {
        head: [['Registration Date', 'Sample ID', 'Volunteer ID', 'Gender', 'Name', 'Test Panel', 'Sample Type', 'Status', 'Authorized By', 'Authorized On']],
        body: tableData,
        startY: 30,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 30 }
      });

      // Save the PDF
      doc.save(`test-authorizations-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF file downloaded successfully');
    } catch (error) {
      console.error('PDF export failed:', error);
      toast.error('Failed to download PDF file');
    } finally {
      setIsPdfLoading(false)
    }
  }

  const openSampleDetails = (row: TestAuthorizationWithActionsType) => {
    // Example: navigate to a details page or open a modal
    // For navigation:
    router.push(getLocalizedUrl(`/apps/lims/test-results/Test-Detail/${row.id}`, locale as Locale));
    // Or for modal: set some state to show details
  };

  const printBarcode = (row: TestAuthorizationWithActionsType) => {
    // Example: Open a barcode print dialog or trigger print logic
    // setSelectedSample(row); setShowBarcodeDialog(true);
    toast.info(`Print barcode for Sample ID: ${row.sampleId}`);
  };

  const openRemarkDialog = (row: TestAuthorizationWithActionsType) => {
    setSelectedTestId(row.id);
    setRemarkDialogOpen(true);
  };

  const openOutsourceDialog = (row: TestAuthorizationWithActionsType) => {
    // Example: Open an outsource dialog or trigger outsource logic
    toast.info(`Outsource sample with ID: ${row.sampleId}`);
  };

  const openValidateSample = (row: TestAuthorizationWithActionsType) => {
    setIsNavigating(true)
    try {
      router.push(getLocalizedUrl(`/apps/lims/test-results/validate-sample/${row.sampleId}`, locale as Locale))
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

  const SampleDetailsDialog = dynamic(() => import('@/components/dialogs/sample-details'), {
    ssr: false
  })

  return (
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
          Navigating to validate sample...
        </Typography>
      </Backdrop>
      <CardHeader 
        title="Test Results" 
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
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
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
      <div className='flex items-center justify-center gap-4 p-4 border-t'>
      </div>

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
        sampleId={(selectedTest as TestAuthorizationWithActionsType)?.sampleId || 0}
        barcodeId={(selectedTest as TestAuthorizationWithActionsType)?.sampleId ? String((selectedTest as TestAuthorizationWithActionsType).sampleId) : undefined}
      />
      <TestAuthorizationDetailsDialog
        open={showSampleDetails}
        onClose={() => setShowSampleDetails(false)}
        sample={selectedSampleForDetails}
      />
      <ConfirmDialog
        open={showRejectConfirm}
        title="Confirm Rejection"
        description={
          <div className='flex flex-col gap-4'>
            <Typography>
              Do you want to reject test for sample {(selectedTestForReject as TestAuthorizationWithActionsType)?.sampleId}?
            </Typography>
            <CustomTextField
              fullWidth
              multiline
              rows={3}
              label='Reason for Rejection'
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              required
              error={!rejectReason.trim()}
              helperText={!rejectReason.trim() ? 'Please provide a reason for rejection' : ''}
            />
          </div>
        }
        okText="Yes"
        cancelText="No"
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

export default TestAuthorizationTable 