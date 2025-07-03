'use client'

// React Imports
import React, { useEffect, useMemo, useState, useRef } from 'react'

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
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import LinearProgress from '@mui/material/LinearProgress'
import { TableContainer, Collapse, Paper } from '@mui/material'

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

// Type Imports
import type { ThemeColor } from '@core/types'
import type { Locale } from '@configs/i18n'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'
import CustomTextField from '@core/components/mui/TextField'
import OptionMenu from '@core/components/option-menu'
import TableFilters from './TableFilters'
import BarcodePrintDialog from '@/components/dialogs/barcode-print/index'
import RemarkDialog from '@/components/dialogs/remark-dialog/index'
import ConfirmDialog from '@/components/dialogs/ConfirmDialog/ConfirmDialog'
import SampleDetailsDialog from '@/components/dialogs/sample-details-dialog'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'
import { formatDate } from '@/utils/dateUtils'
// Style Imports
import tableStyles from '@core/styles/table.module.css'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import { toast } from 'react-toastify'

import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import PrintIcon from '@mui/icons-material/Print'
import LaunchIcon from '@mui/icons-material/Launch'
import AutorenewIcon from '@mui/icons-material/Autorenew'

declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

export type SampleType = {
  sentByName: string | number | undefined
  id: number
  subjectId?: string
  scrBarcodeId?: number
  barcodeId?: string
  sampleTypeId?: number
  sampleType?: string
  noOfPrint?: number
  collectedBy?: string
  //collectedByName?: string
  collectedOn?: string
  sentBy?: string
  //sentByName?: string
  sentOn?: string
  receivedBy?: string
  receivedOn?: string
  isFromExisting?: string
  modifyBy?: string
  modifyOn: string
  activeFlag: string
  receivedByName?: string
  timeZoneId?: number
  facilityId?: number
  projectNo?: string
  study?: string
  receiveStatus?: string
  location?: string
  referenceId?: string
  lab?: string
  statusId?: number | null
  remarks?: string
  labName?: string
  studyProtocol?: string
  VolunteerName?: string
}

// New types for the API response format
export type SampleDataItem = {
  id: string
  barcodeId: string
  sampleType: string
  sampleCollectedBy: string
  sampleCollectedOn: string
  sampleSentBy: string
  sampleSentOn: string
  status: string
}

export type VolunteerData = {
  subjectId: string
  barcodeId: string
  sampleType: string
  volunteerName: string
  sampleData: SampleDataItem[]
}

type SampleWithActionsType = SampleType & {
  actions?: string
}

type SampleStatusType = {
  [key: string]: {
    title: string
    color: ThemeColor
  }
}

type StatusKey = 'null' | 1 | 2 | 3 | 4 | 5 | 6
type StatusMapType = Record<StatusKey, { label: string; color: 'warning' | 'success' | 'error' | 'info' | 'secondary' }>

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

const statusMap: StatusMapType = {
  null: { label: 'Pending', color: 'warning' },
  1: { label: 'Received', color: 'success' },
  2: { label: 'Rejected', color: 'error' },
  3: { label: 'Pending', color: 'warning' },
  4: { label: 'In Progress', color: 'warning' },
  5: { label: 'Completed', color: 'info' },
  6: { label: 'Outsourced', color: 'secondary' }
}

const columnHelper = createColumnHelper<SampleWithActionsType>()

type Props = {
  sampleData?: VolunteerData[]
  onDataChange?: () => void
}

// Grouping helper - updated for new API format
const groupSamplesByVolunteer = (volunteerData: VolunteerData[]) => {
  return volunteerData.reduce(
    (groups, volunteer) => {
      const volunteerId = volunteer.subjectId
      if (!groups[volunteerId]) {
        groups[volunteerId] = {
          volunteerName: volunteer.volunteerName,
          barcodeId: volunteer.barcodeId, // Using subjectId as projectNo for now
          //sampleType: volunteer.sampleType,
          statusId: getStatusIdFromStatus(volunteer.sampleData[0]?.status), // Get status from first sample
          samples: volunteer.sampleData.map(sample => ({
            id: parseInt(sample.id),
            barcodeId: sample.barcodeId,
            sampleType: sample.sampleType,
            collectedBy: sample.sampleCollectedBy,
            collectedOn: sample.sampleCollectedOn,
            sentByName: sample.sampleSentBy,
            sentOn: sample.sampleSentOn,
            receivedByName: '', // Not provided in new format
            receivedOn: '', // Not provided in new format
            subjectId: volunteer.subjectId,
            VolunteerName: volunteer.volunteerName,
            statusId: getStatusIdFromStatus(sample.status),
            activeFlag: 'Y',
            modifyOn: new Date().toISOString(),
            sentBy: sample.sampleSentBy,
            receivedBy: '',
            isFromExisting: '',
            modifyBy: '',
            timeZoneId: undefined,
            facilityId: undefined,
            projectNo: volunteer.subjectId,
            study: volunteer.sampleType,
            receiveStatus: sample.status,
            location: '',
            lab: '',
            remarks: '',
            labName: '',
            studyProtocol: ''
            // scrBarcodeId: undefined,
            // sampleTypeId: undefined,
            // noOfPrint: undefined
          }))
        }
      }
      return groups
    },
    {} as Record<
      string,
      {
        volunteerName: string
        barcodeId: string
        //sampleType: string
        statusId: number | null | undefined
        samples: SampleType[]
      }
    >
  )
}

// Helper function to convert status string to statusId
const getStatusIdFromStatus = (status: string): number | null => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return 3
    case 'received':
      return 1
    case 'rejected':
      return 2
    case 'in progress':
      return 4
    case 'completed':
      return 5
    case 'outsourced':
      return 6
    default:
      return null
  }
}

const GroupedSampleReceivedTable = ({
  sampleData = [],
  onSampleDetails,
  onPrintBarcode
}: {
  sampleData: VolunteerData[]
  onSampleDetails: (sample: SampleType) => void
  onPrintBarcode: (sample: SampleType) => void
}) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [selectedGroups, setSelectedGroups] = useState<Record<string, boolean>>({})
  const [selectedSamples, setSelectedSamples] = useState<Record<string, boolean>>({})
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Add bulk operation states
  const [showOutsourceConfirm, setShowOutsourceConfirm] = useState(false)
  const [selectedSamplesForOutsource, setSelectedSamplesForOutsource] = useState<number[]>([])
  const [showReceiveConfirm, setShowReceiveConfirm] = useState(false)
  const [selectedSampleForReceive, setSelectedSampleForReceive] = useState<SampleType | null>(null)
  const [showRejectConfirm, setShowRejectConfirm] = useState(false)
  const [selectedSampleForReject, setSelectedSampleForReject] = useState<SampleType | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showBulkReceiveConfirm, setShowBulkReceiveConfirm] = useState(false)
  const [selectedSamplesForReceive, setSelectedSamplesForReceive] = useState<number[]>([])
  const [showBulkRejectConfirm, setShowBulkRejectConfirm] = useState(false)
  const [selectedSamplesForReject, setSelectedSamplesForReject] = useState<number[]>([])
  const [bulkRejectReason, setBulkRejectReason] = useState('')
  const [showBulkCentrifugeConfirm, setShowBulkCentrifugeConfirm] = useState(false)
  const [selectedSamplesForCentrifuge, setSelectedSamplesForCentrifuge] = useState<number[]>([])
  const [isBulkOperationLoading, setIsBulkOperationLoading] = useState(false)
  const [bulkOperationProgress, setBulkOperationProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const grouped = useMemo(() => groupSamplesByVolunteer(sampleData), [sampleData])
  const groupKeys = Object.keys(grouped)
  const pagedGroupKeys = groupKeys.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  const handleExpand = (volunteerId: string, samples: SampleType[]) => {
    const newExpanded = !expanded[volunteerId]
    setExpanded(prev => ({ ...prev, [volunteerId]: newExpanded }))
    if (newExpanded && selectedGroups[volunteerId]) {
      const newSelectedSamples = { ...selectedSamples }
      samples.forEach(sample => {
        if (sample.barcodeId) newSelectedSamples[sample.barcodeId] = true
      })
      setSelectedSamples(newSelectedSamples)
    }
  }
  const handleGroupSelect = (volunteerId: string, samples: SampleType[]) => {
    const newSelected = !selectedGroups[volunteerId]
    setSelectedGroups(prev => ({ ...prev, [volunteerId]: newSelected }))
    const newSelectedSamples = { ...selectedSamples }
    samples.forEach(sample => {
      if (sample.barcodeId) newSelectedSamples[sample.barcodeId] = newSelected
    })
    setSelectedSamples(newSelectedSamples)
  }
  const handleSampleSelect = (barcodeId: string) => {
    setSelectedSamples(prev => ({ ...prev, [barcodeId]: !prev[barcodeId] }))
  }
  const isGroupSelected = (volunteerId: string, samples: SampleType[]) => {
    return samples.every(sample => sample.barcodeId && selectedSamples[sample.barcodeId])
  }
  const isGroupIndeterminate = (volunteerId: string, samples: SampleType[]) => {
    const selectedCount = samples.filter(sample => sample.barcodeId && selectedSamples[sample.barcodeId]).length
    return selectedCount > 0 && selectedCount < samples.length
  }
  const getStatusInfo = (statusId: number | null | undefined) => {
    if (statusId === null || statusId === undefined) return statusMap.null
    return statusMap[statusId as keyof typeof statusMap] || { label: 'Unknown', color: 'default' }
  }

  // Add missing handler functions
  const handleSampleReceive = async (id: number) => {
    try {
      const response = await fetch('/api/apps/lims/Sample-received?action=status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: [id], statusId: 1 })
      })

      if (!response.ok) {
        throw new Error('Failed to receive sample')
      }

      toast.success('Sample received successfully')
      // Refresh the data
      const dataResponse = await fetch('/api/apps/lims/Sample-received')
      const data = await dataResponse.json()
      // Note: This would need to be handled by parent component
      window.location.reload()
    } catch (error) {
      console.error('Error receiving sample:', error)
      toast.error('Failed to receive sample')
    }
  }

  const handleSampleReject = (id: number) => {
    // Find the sample in the grouped data
    const allSamples = Object.values(grouped).flatMap(group => group.samples)
    const sample = allSamples.find(item => item.id === id)
    if (sample) {
      setSelectedSampleForReject(sample)
      setShowRejectConfirm(true)
    }
  }

  const handleRejectConfirm = async () => {
    if (!selectedSampleForReject || !rejectReason.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch('/api/apps/lims/Sample-received?action=status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ids: [selectedSampleForReject.id],
          statusId: 2,
          reason: rejectReason
        })
      })

      if (!response.ok) {
        throw new Error('Failed to reject sample')
      }

      toast.success('Sample rejected successfully')
      window.location.reload()
    } catch (error) {
      console.error('Error rejecting sample:', error)
      toast.error('Failed to reject sample')
    } finally {
      setShowRejectConfirm(false)
      setSelectedSampleForReject(null)
      setRejectReason('')
      setIsLoading(false)
    }
  }

  const handlePrintBarcode = async (id: number) => {
    // Find the sample in the grouped data
    const allSamples = Object.values(grouped).flatMap(group => group.samples)
    const sample = allSamples.find(item => item.id === id)
    if (!sample) {
      toast.error('Sample not found')
      return
    }

    if (!sample.barcodeId) {
      toast.error('No barcode ID available for this sample')
      return
    }

    onPrintBarcode(sample)
  }

  const handleOutsourceSample = async (id: number) => {
    setSelectedSamplesForOutsource([id])
    setShowOutsourceConfirm(true)
  }

  const handleOutsourceConfirm = async () => {
    try {
      setIsBulkOperationLoading(true)
      setBulkOperationProgress(0)

      const totalSamples = selectedSamplesForOutsource.length
      let processedSamples = 0

      await Promise.all(
        selectedSamplesForOutsource.map(async id => {
          try {
            const response = await fetch('/api/apps/lims/Sample-received?action=status', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ ids: [id], statusId: 6 })
            })

            if (!response.ok) {
              throw new Error('Failed to outsource sample')
            }

            processedSamples++
            setBulkOperationProgress((processedSamples / totalSamples) * 100)
          } catch (error) {
            console.error(`Error outsourcing sample ${id}:`, error)
          }
        })
      )

      toast.success('Samples outsourced successfully')
      window.location.reload()
    } catch (error) {
      console.error('Error outsourcing samples:', error)
      toast.error('Failed to outsource some samples. Please check the audit trail for details.')
    } finally {
      setShowOutsourceConfirm(false)
      setSelectedSamplesForOutsource([])
      setIsBulkOperationLoading(false)
      setBulkOperationProgress(0)
    }
  }

  const handleRemarks = (id: number) => {
    const allSamples = Object.values(grouped).flatMap(group => group.samples)
    const sample = allSamples.find(item => item.id === id)
    if (sample) {
      // Note: This would need to be handled by parent component
      toast.info('Remarks functionality needs to be implemented in parent component')
    }
  }

  // Add bulk operation handlers
  const handleBulkReceive = () => {
    const selectedIds = Object.entries(selectedSamples)
      .filter(([_, checked]) => checked)
      .map(([barcodeId]) => {
        const allSamples = Object.values(grouped).flatMap(group => group.samples)
        return allSamples.find(sample => sample.barcodeId === barcodeId)?.id
      })
      .filter(Boolean)

    if (selectedIds.length > 0) {
      setSelectedSamplesForReceive(selectedIds as number[])
      setShowBulkReceiveConfirm(true)
    }
  }

  const handleBulkReceiveConfirm = async () => {
    try {
      setIsBulkOperationLoading(true)
      setBulkOperationProgress(0)

      const totalSamples = selectedSamplesForReceive.length
      let processedSamples = 0

      await Promise.all(
        selectedSamplesForReceive.map(async id => {
          try {
            const response = await fetch('/api/apps/lims/Sample-received?action=status', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ ids: [id], statusId: 1 })
            })

            if (!response.ok) {
              throw new Error('Failed to receive sample')
            }

            processedSamples++
            setBulkOperationProgress((processedSamples / totalSamples) * 100)
          } catch (error) {
            console.error(`Error receiving sample ${id}:`, error)
          }
        })
      )

      toast.success('Selected samples received successfully')
      window.location.reload()
    } catch (error) {
      console.error('Error receiving samples:', error)
      toast.error('Failed to receive some samples. Please check the audit trail for details.')
    } finally {
      setShowBulkReceiveConfirm(false)
      setSelectedSamplesForReceive([])
      setIsBulkOperationLoading(false)
      setBulkOperationProgress(0)
    }
  }

  const handleBulkReject = () => {
    const selectedIds = Object.entries(selectedSamples)
      .filter(([_, checked]) => checked)
      .map(([barcodeId]) => {
        const allSamples = Object.values(grouped).flatMap(group => group.samples)
        return allSamples.find(sample => sample.barcodeId === barcodeId)?.id
      })
      .filter(Boolean)

    if (selectedIds.length > 0) {
      setSelectedSamplesForReject(selectedIds as number[])
      setShowBulkRejectConfirm(true)
    }
  }

  const handleBulkRejectConfirm = async () => {
    if (!bulkRejectReason.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }

    try {
      setIsBulkOperationLoading(true)
      setBulkOperationProgress(0)

      const totalSamples = selectedSamplesForReject.length
      let processedSamples = 0

      await Promise.all(
        selectedSamplesForReject.map(async id => {
          try {
            const response = await fetch('/api/apps/lims/Sample-received?action=status', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                ids: [id],
                statusId: 2,
                reason: bulkRejectReason
              })
            })

            if (!response.ok) {
              throw new Error('Failed to reject sample')
            }

            processedSamples++
            setBulkOperationProgress((processedSamples / totalSamples) * 100)
          } catch (error) {
            console.error(`Error rejecting sample ${id}:`, error)
          }
        })
      )

      toast.success('Selected samples rejected successfully')
      window.location.reload()
    } catch (error) {
      console.error('Error rejecting samples:', error)
      toast.error('Failed to reject some samples. Please check the audit trail for details.')
    } finally {
      setShowBulkRejectConfirm(false)
      setSelectedSamplesForReject([])
      setBulkRejectReason('')
      setIsBulkOperationLoading(false)
      setBulkOperationProgress(0)
    }
  }

  const handleBulkOutsource = () => {
    const selectedIds = Object.entries(selectedSamples)
      .filter(([_, checked]) => checked)
      .map(([barcodeId]) => {
        const allSamples = Object.values(grouped).flatMap(group => group.samples)
        return allSamples.find(sample => sample.barcodeId === barcodeId)?.id
      })
      .filter(Boolean)
    setSelectedSamplesForOutsource(selectedIds as number[])
    setShowOutsourceConfirm(true)
  }

  const handleBulkPrintBarcode = () => {
    const selectedIds = Object.entries(selectedSamples)
      .filter(([_, checked]) => checked)
      .map(([barcodeId]) => {
        const allSamples = Object.values(grouped).flatMap(group => group.samples)
        return allSamples.find(sample => sample.barcodeId === barcodeId)
      })
      .filter(Boolean)

    if (selectedIds.length === 0) {
      toast.error('No samples selected')
      return
    }

    // Check if any sample is missing barcode ID
    const sampleWithoutBarcode = selectedIds.find(sample => !sample?.barcodeId)
    if (sampleWithoutBarcode) {
      toast.error(`Sample ${sampleWithoutBarcode.id} has no barcode ID`)
      return
    }

    // Set the first sample for backward compatibility with BarcodePrintDialog
    onPrintBarcode(selectedIds[0] as SampleType)
  }

  const handleBulkCentrifuge = () => {
    const selectedIds = Object.entries(selectedSamples)
      .filter(([_, checked]) => checked)
      .map(([barcodeId]) => {
        const allSamples = Object.values(grouped).flatMap(group => group.samples)
        return allSamples.find(sample => sample.barcodeId === barcodeId)?.id
      })
      .filter(Boolean)

    if (selectedIds.length > 0) {
      setSelectedSamplesForCentrifuge(selectedIds as number[])
      setShowBulkCentrifugeConfirm(true)
    }
  }

  const handleBulkCentrifugeConfirm = async () => {
    try {
      setIsBulkOperationLoading(true)
      setBulkOperationProgress(0)

      const totalSamples = selectedSamplesForCentrifuge.length
      let processedSamples = 0

      await Promise.all(
        selectedSamplesForCentrifuge.map(async id => {
          try {
            const response = await fetch('/api/apps/lims/Sample-received?action=centrifuge', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ ids: [id] })
            })

            if (!response.ok) {
              throw new Error('Failed to centrifuge sample')
            }

            processedSamples++
            setBulkOperationProgress((processedSamples / totalSamples) * 100)
          } catch (error) {
            console.error(`Error centrifuging sample ${id}:`, error)
          }
        })
      )

      toast.success('Selected samples sent for centrifugation successfully')
      window.location.reload()
    } catch (error) {
      console.error('Error centrifuging samples:', error)
      toast.error('Failed to centrifuge some samples. Please check the audit trail for details.')
    } finally {
      setShowBulkCentrifugeConfirm(false)
      setSelectedSamplesForCentrifuge([])
      setIsBulkOperationLoading(false)
      setBulkOperationProgress(0)
    }
  }

  // Get selected sample IDs
  const selectedSampleIds = Object.entries(selectedSamples)
    .filter(([_, checked]) => checked)
    .map(([barcodeId]) => {
      const allSamples = Object.values(grouped).flatMap(group => group.samples)
      return allSamples.find(sample => sample.barcodeId === barcodeId)?.id
    })
    .filter(Boolean)

  return (
    <>
      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={showReceiveConfirm}
        title='Confirm Sample Receive'
        description='Are you sure you want to receive this sample?'
        handleClose={() => setShowReceiveConfirm(false)}
        handleConfirm={async () => {
          if (selectedSampleForReceive) await handleSampleReceive(selectedSampleForReceive.id)
        }}
        disabled={isLoading}
      />
      <ConfirmDialog
        open={showRejectConfirm}
        title='Confirm Sample Reject'
        description={
          <Box>
            <Typography variant='body2' sx={{ mb: 2 }}>
              Are you sure you want to reject this sample?
            </Typography>
            <CustomTextField
              fullWidth
              label='Rejection Reason'
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              multiline
              rows={3}
              required
            />
          </Box>
        }
        handleClose={() => setShowRejectConfirm(false)}
        handleConfirm={handleRejectConfirm}
        disabled={isLoading}
      />
      <ConfirmDialog
        open={showOutsourceConfirm}
        title='Confirm Sample Outsource'
        description={`Are you sure you want to outsource ${selectedSamplesForOutsource.length} sample(s)?`}
        handleClose={() => setShowOutsourceConfirm(false)}
        handleConfirm={handleOutsourceConfirm}
        disabled={isBulkOperationLoading}
      />
      <ConfirmDialog
        open={showBulkReceiveConfirm}
        title='Confirm Bulk Receive'
        description={`Are you sure you want to receive ${selectedSamplesForReceive.length} sample(s)?`}
        handleClose={() => setShowBulkReceiveConfirm(false)}
        handleConfirm={handleBulkReceiveConfirm}
        disabled={isBulkOperationLoading}
      />
      <ConfirmDialog
        open={showBulkRejectConfirm}
        title='Confirm Bulk Reject'
        description={
          <Box>
            <Typography variant='body2' sx={{ mb: 2 }}>
              Are you sure you want to reject {selectedSamplesForReject.length} sample(s)?
            </Typography>
            <CustomTextField
              fullWidth
              label='Rejection Reason'
              value={bulkRejectReason}
              onChange={e => setBulkRejectReason(e.target.value)}
              multiline
              rows={3}
              required
            />
          </Box>
        }
        handleClose={() => setShowBulkRejectConfirm(false)}
        handleConfirm={handleBulkRejectConfirm}
        disabled={isBulkOperationLoading}
      />
      <ConfirmDialog
        open={showBulkCentrifugeConfirm}
        title='Confirm Bulk Centrifuge'
        description={`Are you sure you want to send ${selectedSamplesForCentrifuge.length} sample(s) for centrifugation?`}
        handleClose={() => setShowBulkCentrifugeConfirm(false)}
        handleConfirm={handleBulkCentrifugeConfirm}
        disabled={isBulkOperationLoading}
      />

      {/* Progress Indicator */}
      {isBulkOperationLoading && (
        <Box sx={{ width: '100%', mt: 2 }}>
          <LinearProgress variant='determinate' value={bulkOperationProgress} />
          <Typography variant='body2' color='text.secondary' align='center' sx={{ mt: 1 }}>
            Processing {Math.round(bulkOperationProgress)}% complete
          </Typography>
        </Box>
      )}

      <Paper
        sx={{
          width: '100%',
          overflow: 'hidden',
          boxShadow: t => t.shadows[1],
          borderRadius: 1,
          border: t => `1px solid ${t.palette.divider}`
        }}
      >
        <TableContainer sx={{ maxHeight: 640 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell padding='checkbox' />
                <TableCell>Volunteer Name</TableCell>
                <TableCell>Volunteer ID</TableCell>
                <TableCell>Barcode ID</TableCell>
                {/* <TableCell>Sample Type</TableCell> */}
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedGroupKeys.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align='center'>
                    No data found
                  </TableCell>
                </TableRow>
              ) : (
                pagedGroupKeys.map(volunteerId => {
                  const group = grouped[volunteerId]
                  return (
                    <React.Fragment key={volunteerId}>
                      <TableRow hover>
                        <TableCell padding='checkbox'>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Checkbox
                              checked={isGroupSelected(volunteerId, group.samples)}
                              indeterminate={isGroupIndeterminate(volunteerId, group.samples)}
                              onChange={() => handleGroupSelect(volunteerId, group.samples)}
                            />
                            <IconButton
                              size='small'
                              onClick={() => handleExpand(volunteerId, group.samples)}
                              sx={{
                                width: 28,
                                height: 28,
                                backgroundColor: theme =>
                                  expanded[volunteerId] ? theme.palette.primary.main : theme.palette.action.hover,
                                color: theme =>
                                  expanded[volunteerId]
                                    ? theme.palette.primary.contrastText
                                    : theme.palette.text.primary,
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': {
                                  backgroundColor: theme =>
                                    expanded[volunteerId] ? theme.palette.primary.dark : theme.palette.action.selected,
                                  transform: 'scale(1.1) rotate(180deg)'
                                }
                              }}
                            >
                              {expanded[volunteerId] ? <RemoveIcon fontSize='small' /> : <AddIcon fontSize='small' />}
                            </IconButton>
                          </Box>
                        </TableCell>
                        <TableCell>{group.volunteerName}</TableCell>
                        <TableCell>{volunteerId}</TableCell>
                        <TableCell>{group.barcodeId}</TableCell>
                        {/* <TableCell>{group.study}</TableCell> */}
                      </TableRow>
                      <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                          <Collapse in={!!expanded[volunteerId]} timeout={300} unmountOnExit>
                            <Box margin={1}>
                              <Table size='small'>
                                <TableHead>
                                  <TableRow>
                                    <TableCell padding='checkbox' />
                                    <TableCell>Actions</TableCell>
                                    <TableCell>Barcode ID</TableCell>
                                    <TableCell>Sample Type</TableCell>
                                    <TableCell>Collected By</TableCell>
                                    <TableCell>Collected On</TableCell>
                                    <TableCell>Sent By</TableCell>
                                    <TableCell>Sent On</TableCell>
                                    <TableCell>Status</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {group.samples.map(sample => (
                                    <TableRow key={sample.barcodeId} hover>
                                      <TableCell padding='checkbox'>
                                        <Checkbox
                                          checked={!!selectedSamples[sample.barcodeId || '']}
                                          onChange={() => sample.barcodeId && handleSampleSelect(sample.barcodeId)}
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <OptionMenu
                                          options={[
                                            {
                                              text: 'Receive',
                                              icon: <i className='tabler-check' style={{ color: '#4CAF50' }} />,
                                              menuItemProps: {
                                                onClick: () => handleSampleReceive(sample.id)
                                              }
                                            },
                                            {
                                              text: 'Reject',
                                              icon: <i className='tabler-x' style={{ color: '#F44336' }} />,
                                              menuItemProps: {
                                                onClick: () => handleSampleReject(sample.id)
                                              }
                                            },
                                            {
                                              text: 'Print Barcode',
                                              icon: <i className='tabler-printer' style={{ color: '#3F51B5' }} />,
                                              menuItemProps: {
                                                onClick: () => handlePrintBarcode(sample.id)
                                              }
                                            },
                                            {
                                              text: 'Sample Detail',
                                              icon: <i className='tabler-eye' style={{ color: '#00BCD4' }} />,
                                              menuItemProps: {
                                                onClick: () => onSampleDetails(sample)
                                              }
                                            },
                                            {
                                              text: 'Outsource Sample',
                                              icon: <i className='tabler-external-link' style={{ color: '#FF9800' }} />,
                                              menuItemProps: {
                                                onClick: () => handleOutsourceSample(sample.id)
                                              }
                                            },
                                            {
                                              text: 'Remarks',
                                              icon: <i className='tabler-message' style={{ color: '#E91E63' }} />,
                                              menuItemProps: {
                                                onClick: () => handleRemarks(sample.id)
                                              }
                                            }
                                          ]}
                                        />
                                      </TableCell>
                                      <TableCell>{sample.barcodeId}</TableCell>
                                      <TableCell>{sample.sampleType}</TableCell>
                                      <TableCell>{sample.collectedBy}</TableCell>
                                      <TableCell>{formatDate(sample.collectedOn)}</TableCell>
                                      <TableCell>{sample.sentByName}</TableCell>
                                      <TableCell>{formatDate(sample.sentOn)}</TableCell>
                                      <TableCell>
                                        <Chip
                                          label={getStatusInfo(sample.statusId).label}
                                          color={getStatusInfo(sample.statusId).color as any}
                                          size='small'
                                        />
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component='div'
          count={groupKeys.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={e => {
            setRowsPerPage(parseInt(e.target.value, 10))
            setPage(0)
          }}
        />
      </Paper>

      {/* Bulk Action Buttons */}
      <div className='flex items-center justify-center gap-4 p-4 border-t'>
        <Button
          variant='contained'
          color='success'
          startIcon={<i className='tabler-check' />}
          disabled={selectedSampleIds.length === 0}
          onClick={handleBulkReceive}
        >
          Receive
        </Button>
        <Button
          variant='contained'
          color='error'
          startIcon={<i className='tabler-x' />}
          disabled={selectedSampleIds.length === 0}
          onClick={handleBulkReject}
        >
          Reject
        </Button>
        <Button
          variant='contained'
          color='warning'
          startIcon={<i className='tabler-external-link' />}
          disabled={selectedSampleIds.length === 0}
          onClick={handleBulkOutsource}
        >
          Outsource
        </Button>
        <Button
          variant='contained'
          color='info'
          startIcon={<i className='tabler-printer' />}
          disabled={selectedSampleIds.length === 0}
          onClick={handleBulkPrintBarcode}
        >
          Print Barcode
        </Button>
        <Button
          variant='contained'
          color='secondary'
          startIcon={<i className='tabler-rotate' />}
          disabled={selectedSampleIds.length === 0}
          onClick={handleBulkCentrifuge}
        >
          Centrifuge Selected
        </Button>
      </div>
    </>
  )
}

const SampleReceivedTable = ({ sampleData = [], onDataChange }: Props) => {
  const router = useRouter()
  const { lang: locale } = useParams()
  const [rowSelection, setRowSelection] = useState({})
  const initialData = Array.isArray(sampleData) ? sampleData : []
  const [data, setData] = useState<VolunteerData[]>(initialData)
  const [filteredData, setFilteredData] = useState<VolunteerData[]>(initialData)
  const [globalFilter, setGlobalFilter] = useState('')
  const [isPdfLoading, setIsPdfLoading] = useState(false)
  const [isExcelLoading, setIsExcelLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showBarcodeDialog, setShowBarcodeDialog] = useState<boolean>(false)
  const [selectedSample, setSelectedSample] = useState<SampleType | null>(null)
  const [columnVisibility, setColumnVisibility] = useState({})
  const [columnMenuAnchor, setColumnMenuAnchor] = useState<null | HTMLElement>(null)
  const [showRemarkDialog, setShowRemarkDialog] = useState<boolean>(false)
  const [selectedSampleForRemark, setSelectedSampleForRemark] = useState<SampleType | null>(null)
  const [showBarcodeScanDialog, setShowBarcodeScanDialog] = useState(false)
  const [barcodeInput, setBarcodeInput] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [highlightedSampleId, setHighlightedSampleId] = useState<number | null>(null)
  const barcodeInputRef = useRef<HTMLInputElement>(null)
  const [showOutsourceConfirm, setShowOutsourceConfirm] = useState(false)
  const [selectedSamplesForOutsource, setSelectedSamplesForOutsource] = useState<number[]>([])
  const [showReceiveConfirm, setShowReceiveConfirm] = useState(false)
  const [selectedSampleForReceive, setSelectedSampleForReceive] = useState<SampleType | null>(null)
  const [showRejectConfirm, setShowRejectConfirm] = useState(false)
  const [selectedSampleForReject, setSelectedSampleForReject] = useState<SampleType | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showBulkReceiveConfirm, setShowBulkReceiveConfirm] = useState(false)
  const [selectedSamplesForReceive, setSelectedSamplesForReceive] = useState<number[]>([])
  const [showBulkRejectConfirm, setShowBulkRejectConfirm] = useState(false)
  const [selectedSamplesForReject, setSelectedSamplesForReject] = useState<number[]>([])
  const [bulkRejectReason, setBulkRejectReason] = useState('')
  const [showBulkCentrifugeConfirm, setShowBulkCentrifugeConfirm] = useState(false)
  const [selectedSamplesForCentrifuge, setSelectedSamplesForCentrifuge] = useState<number[]>([])
  const [showSampleDetails, setShowSampleDetails] = useState(false)
  const [selectedSampleForDetails, setSelectedSampleForDetails] = useState<SampleType | null>(null)
  const [showAuditTrail, setShowAuditTrail] = useState(false)
  const [selectedSampleForAudit, setSelectedSampleForAudit] = useState<number | null>(null)
  const [isBulkOperationLoading, setIsBulkOperationLoading] = useState(false)
  const [bulkOperationProgress, setBulkOperationProgress] = useState(0)
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [selectedGroups, setSelectedGroups] = useState<Record<string, boolean>>({})
  const [selectedSamples, setSelectedSamples] = useState<Record<string, boolean>>({})
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchText, setSearchText] = useState('')

  const grouped = useMemo(() => groupSamplesByVolunteer(filteredData), [filteredData])
  const groupKeys = Object.keys(grouped)
  const pagedGroupKeys = groupKeys.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  // Add effect to update data when props change
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        if (Array.isArray(sampleData)) {
          setData(sampleData)
          setFilteredData(sampleData)
        }
      } catch (error) {
        toast.error('Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [sampleData])

  // Add effect to log when data changes
  useEffect(() => {
    console.log('Current data state:', data)
    console.log('Current filteredData state:', filteredData)
  }, [data, filteredData])

  const handleExpand = (volunteerId: string, samples: SampleType[]) => {
    const newExpanded = !expanded[volunteerId]
    setExpanded(prev => ({ ...prev, [volunteerId]: newExpanded }))
    // When expanding, sync sample selections with group selection
    if (newExpanded && selectedGroups[volunteerId]) {
      const newSelectedSamples = { ...selectedSamples }
      samples.forEach(sample => {
        if (sample.barcodeId) newSelectedSamples[sample.barcodeId] = true
      })
      setSelectedSamples(newSelectedSamples)
    }
  }

  const handleGroupSelect = (volunteerId: string, samples: SampleType[]) => {
    const newSelected = !selectedGroups[volunteerId]
    setSelectedGroups(prev => ({ ...prev, [volunteerId]: newSelected }))
    // Select/deselect all samples for this volunteer
    const newSelectedSamples = { ...selectedSamples }
    samples.forEach(sample => {
      if (sample.barcodeId) newSelectedSamples[sample.barcodeId] = newSelected
    })
    setSelectedSamples(newSelectedSamples)
  }

  const handleSampleSelect = (barcodeId: string) => {
    setSelectedSamples(prev => ({ ...prev, [barcodeId]: !prev[barcodeId] }))
  }

  const isGroupSelected = (volunteerId: string, samples: SampleType[]) => {
    return samples.every(sample => sample.barcodeId && selectedSamples[sample.barcodeId])
  }
  const isGroupIndeterminate = (volunteerId: string, samples: SampleType[]) => {
    const selectedCount = samples.filter(sample => sample.barcodeId && selectedSamples[sample.barcodeId]).length
    return selectedCount > 0 && selectedCount < samples.length
  }

  const getStatusInfo = (statusId: number | null | undefined) => {
    if (statusId === null || statusId === undefined) return statusMap.null
    return statusMap[statusId as keyof typeof statusMap] || { label: 'Unknown', color: 'default' }
  }

  const handleSampleReceive = async (id: number) => {
    try {
      const response = await fetch('/api/apps/lims/Sample-received?action=status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: [id], statusId: 1 })
      })

      if (!response.ok) {
        throw new Error('Failed to receive sample')
      }

      toast.success('Sample received successfully')
      // Refresh the data
      const dataResponse = await fetch('/api/apps/lims/Sample-received')
      const data = await dataResponse.json()
      setData(data.result || data)
      setFilteredData(data.result || data)
    } catch (error) {
      console.error('Error receiving sample:', error)
      toast.error('Failed to receive sample')
    }
  }

  const handleSampleReject = (id: number) => {
    // Find the sample in the grouped data
    const allSamples = Object.values(grouped).flatMap(group => group.samples)
    const sample = allSamples.find(item => item.id === id)
    if (sample) {
      setSelectedSampleForReject(sample)
      setShowRejectConfirm(true)
    }
  }

  const handleRejectConfirm = async () => {
    if (!selectedSampleForReject || !rejectReason.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch('/api/apps/lims/Sample-received?action=status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ids: [selectedSampleForReject.id],
          statusId: 2,
          reason: rejectReason
        })
      })

      if (!response.ok) {
        throw new Error('Failed to reject sample')
      }

      toast.success('Sample rejected successfully')
      const dataResponse = await fetch('/api/apps/lims/Sample-received')
      const data = await dataResponse.json()
      setData(data.result || data)
      setFilteredData(data.result || data)
    } catch (error) {
      console.error('Error rejecting sample:', error)
      toast.error('Failed to reject sample')
    } finally {
      setShowRejectConfirm(false)
      setSelectedSampleForReject(null)
      setRejectReason('')
      setIsLoading(false)
    }
  }

  const handlePrintBarcode = (sample: SampleType) => {
    setSelectedSample(sample)
    setShowBarcodeDialog(true)
  }

  const handleBulkPrintBarcode = () => {
    const selectedIds = Object.entries(selectedSamples)
      .filter(([_, checked]) => checked)
      .map(([barcodeId]) => {
        const allSamples = Object.values(grouped).flatMap(group => group.samples)
        return allSamples.find(sample => sample.barcodeId === barcodeId)
      })
      .filter(Boolean)

    if (selectedIds.length === 0) {
      toast.error('No samples selected')
      return
    }

    // Check if any sample is missing barcode ID
    const sampleWithoutBarcode = selectedIds.find(sample => !sample?.barcodeId)
    if (sampleWithoutBarcode) {
      toast.error(`Sample ${sampleWithoutBarcode.id} has no barcode ID`)
      return
    }

    // Set the first sample for backward compatibility with BarcodePrintDialog
    setSelectedSample(selectedIds[0] as SampleType)
    setShowBarcodeDialog(true)
  }

  const handleOutsourceSample = async (id: number) => {
    setSelectedSamplesForOutsource([id])
    setShowOutsourceConfirm(true)
  }

  const handleOutsourceConfirm = async () => {
    try {
      setIsBulkOperationLoading(true)
      setBulkOperationProgress(0)

      const totalSamples = selectedSamplesForOutsource.length
      let processedSamples = 0

      await Promise.all(
        selectedSamplesForOutsource.map(async id => {
          try {
            const response = await fetch('/api/apps/lims/Sample-received?action=status', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ ids: [id], statusId: 6 })
            })

            if (!response.ok) {
              throw new Error('Failed to outsource sample')
            }

            processedSamples++
            setBulkOperationProgress((processedSamples / totalSamples) * 100)
          } catch (error) {
            console.error(`Error outsourcing sample ${id}:`, error)
          }
        })
      )

      toast.success('Samples outsourced successfully')
      const response = await fetch('/api/apps/lims/Sample-received')
      const newData = await response.json()
      setData(newData.result || newData)
      setFilteredData(newData.result || newData)
    } catch (error) {
      console.error('Error outsourcing samples:', error)
      toast.error('Failed to outsource some samples. Please check the audit trail for details.')
    } finally {
      setShowOutsourceConfirm(false)
      setSelectedSamplesForOutsource([])
      setIsBulkOperationLoading(false)
      setBulkOperationProgress(0)
    }
  }

  const handleRemarks = (id: number) => {
    const allSamples = Object.values(grouped).flatMap(group => group.samples)
    const sample = allSamples.find(item => item.id === id)
    if (sample) {
      setSelectedSampleForRemark(sample)
      setShowRemarkDialog(true)
    }
  }

  const handleRemarkSuccess = async () => {
    // Refresh the data
    const response = await fetch('/api/apps/lims/Sample-received')
    const data = await response.json()
    setData(data.result || data)
    setFilteredData(data.result || data)
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const response = await fetch('/api/apps/lims/Sample-received?action=download', {
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
      a.download = `Sample_Received_${new Date().toISOString().replace(/[:.]/g, '_')}.csv`
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
      doc.text('Sample Received List', 14, 15)

      // Add date
      doc.setFontSize(10)
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22)

      // Prepare table data from the new structure
      const allSamples = Object.values(grouped).flatMap(group => group.samples)
      const tableData = allSamples.map(sample => [
        sample.subjectId || '-',
        sample.barcodeId || '-',
        sample.labName || '-',
        sample.statusId ? statusMap[sample.statusId as keyof StatusMapType].label : 'Pending',
        sample.sampleType || '-',
        sample.collectedBy || '-',
        formatDate(sample.collectedOn),
        sample.sentByName || '-',
        formatDate(sample.sentOn),
        sample.receivedByName || '-',
        sample.receivedOn ? formatDate(sample.receivedOn) : '-',
        sample.receiveStatus || '-',
        sample.location || '-',
        sample.labName || '-',
        sample.studyProtocol || '-',
        sample.VolunteerName || '-'
      ])

      // Add table using autoTable
      autoTable(doc, {
        head: [
          [
            'Volunteer ID',
            'Barcode ID',
            'Lab Name',
            'Status',
            'Sample Type',
            'Collected By',
            'Collected On',
            'Sent By',
            'Sent On',
            'Received By',
            'Received On'
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
      doc.save(`sample-received-${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success('PDF file downloaded successfully')
    } catch (error) {
      console.error('PDF export failed:', error)
      toast.error('Failed to download PDF file')
    } finally {
      setIsPdfLoading(false)
    }
  }

  // const handleExcelExport = async () => {
  //   setIsExcelLoading(true)
  //   try {
  //     const response = await fetch('/api/apps/lims/Sample-received/export/excel', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ data: filteredData }),
  //     })

  //     if (!response.ok) {
  //       throw new Error('Failed to generate Excel')
  //     }

  //     const blob = await response.blob()
  //     const url = window.URL.createObjectURL(blob)
  //     const link = document.createElement('a')
  //     link.href = url
  //     link.setAttribute('download', `sample-received-${new Date().toISOString()}.xlsx`)
  //     document.body.appendChild(link)
  //     link.click()
  //     link.remove()
  //     window.URL.revokeObjectURL(url)
  //     toast.success('Excel exported successfully')
  //   } catch (error) {
  //     console.error('Error exporting Excel:', error)
  //     toast.error('Failed to export Excel')
  //   } finally {
  //     setIsExcelLoading(false)
  //   }
  // }

  // Add filter state
  const [filters, setFilters] = useState({
    projectNo: '',
    study: '',
    receiveStatus: '',
    sampleType: '',
    location: '',
    referenceId: '',
    lab: ''
  })

  // Add filter handler
  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  // Add filter apply handler - updated for new data structure
  const handleApplyFilters = () => {
    let filtered = [...data]

    if (filters.projectNo) {
      filtered = filtered.filter(item => item.subjectId?.includes(filters.projectNo))
    }
    if (filters.study) {
      filtered = filtered.filter(item => item.sampleType?.includes(filters.study))
    }
    if (filters.sampleType) {
      filtered = filtered.filter(item => item.sampleType === filters.sampleType)
    }
    if (filters.receiveStatus) {
      filtered = filtered.filter(item => item.sampleData.some(sample => sample.status === filters.receiveStatus))
    }

    setFilteredData(filtered)
  }

  // Add row highlighting styles
  const getRowStyle = (row: any) => {
    if (row.original.id === highlightedSampleId) {
      return { backgroundColor: '#e8f5e9' } // Light green for highlighted
    }
    return {}
  }

  const handleManualReceive = (sample: SampleType) => {
    // Check if sample is already scanned and verified
    if (!sample.barcodeId) {
      toast.error('Please scan and verify the sample first')
      return
    }
    setSelectedSampleForReceive(sample)
    setShowReceiveConfirm(true)
  }

  const handleReceiveConfirm = async () => {
    if (!selectedSampleForReceive) return

    try {
      setIsLoading(true) // Set loading to true before operation
      await fetch('/api/apps/lims/Sample-received?action=status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: [selectedSampleForReceive.id], statusId: 1 })
      })
      toast.success('Sample received successfully')

      // Refresh the data with proper error handling
      const response = await fetch('/api/apps/lims/Sample-received')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new TypeError("Oops, we haven't got JSON!")
      }
      const data = await response.json()
      if (!data) {
        throw new Error('Invalid data format received')
      }

      setData(data.result || data)
      setFilteredData(data.result || data)
      onDataChange?.() // Call the onDataChange callback
      // Scroll to the top of the table
      const tableContainer = document.querySelector('.overflow-x-auto')
      if (tableContainer) {
        tableContainer.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch (error) {
      console.error('Error receiving sample:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to receive sample')
    } finally {
      setShowReceiveConfirm(false)
      setSelectedSampleForReceive(null)
      setIsLoading(false) // Set loading to false after operation
    }
  }

  const handleBulkReceive = () => {
    const selectedIds = Object.entries(selectedSamples)
      .filter(([_, checked]) => checked)
      .map(([barcodeId]) => {
        const allSamples = Object.values(grouped).flatMap(group => group.samples)
        return allSamples.find(sample => sample.barcodeId === barcodeId)?.id
      })
      .filter(Boolean)

    if (selectedIds.length > 0) {
      setSelectedSamplesForReceive(selectedIds as number[])
      setShowBulkReceiveConfirm(true)
    }
  }

  const handleBulkReceiveConfirm = async () => {
    try {
      setIsBulkOperationLoading(true)
      setBulkOperationProgress(0)

      const totalSamples = selectedSamplesForReceive.length
      let processedSamples = 0

      await Promise.all(
        selectedSamplesForReceive.map(async id => {
          try {
            const response = await fetch('/api/apps/lims/Sample-received?action=status', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ ids: [id], statusId: 1 })
            })

            if (!response.ok) {
              throw new Error('Failed to receive sample')
            }

            processedSamples++
            setBulkOperationProgress((processedSamples / totalSamples) * 100)
          } catch (error) {
            console.error(`Error receiving sample ${id}:`, error)
          }
        })
      )

      toast.success('Selected samples received successfully')
      const response = await fetch('/api/apps/lims/Sample-received')
      const newData = await response.json()
      setData(newData.result || newData)
      setFilteredData(newData.result || newData)
      onDataChange?.()
    } catch (error) {
      console.error('Error receiving samples:', error)
      toast.error('Failed to receive some samples. Please check the audit trail for details.')
    } finally {
      setShowBulkReceiveConfirm(false)
      setSelectedSamplesForReceive([])
      setIsBulkOperationLoading(false)
      setBulkOperationProgress(0)
    }
  }

  const handleBulkReject = () => {
    const selectedIds = Object.entries(selectedSamples)
      .filter(([_, checked]) => checked)
      .map(([barcodeId]) => {
        const allSamples = Object.values(grouped).flatMap(group => group.samples)
        return allSamples.find(sample => sample.barcodeId === barcodeId)?.id
      })
      .filter(Boolean)

    if (selectedIds.length > 0) {
      setSelectedSamplesForReject(selectedIds as number[])
      setShowBulkRejectConfirm(true)
    }
  }

  const handleBulkRejectConfirm = async () => {
    if (!bulkRejectReason.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }

    try {
      setIsBulkOperationLoading(true)
      setBulkOperationProgress(0)

      const totalSamples = selectedSamplesForReject.length
      let processedSamples = 0

      await Promise.all(
        selectedSamplesForReject.map(async id => {
          try {
            const response = await fetch('/api/apps/lims/Sample-received?action=status', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                ids: [id],
                statusId: 2,
                reason: bulkRejectReason
              })
            })

            if (!response.ok) {
              throw new Error('Failed to reject sample')
            }

            processedSamples++
            setBulkOperationProgress((processedSamples / totalSamples) * 100)
          } catch (error) {
            console.error(`Error rejecting sample ${id}:`, error)
          }
        })
      )

      toast.success('Selected samples rejected successfully')
      const response = await fetch('/api/apps/lims/Sample-received')
      const newData = await response.json()
      setData(newData.result || newData)
      setFilteredData(newData.result || newData)
    } catch (error) {
      console.error('Error rejecting samples:', error)
      toast.error('Failed to reject some samples. Please check the audit trail for details.')
    } finally {
      setShowBulkRejectConfirm(false)
      setSelectedSamplesForReject([])
      setBulkRejectReason('')
      setIsBulkOperationLoading(false)
      setBulkOperationProgress(0)
    }
  }

  const handleBulkCentrifuge = () => {
    const selectedIds = Object.entries(selectedSamples)
      .filter(([_, checked]) => checked)
      .map(([barcodeId]) => {
        const allSamples = Object.values(grouped).flatMap(group => group.samples)
        return allSamples.find(sample => sample.barcodeId === barcodeId)?.id
      })
      .filter(Boolean)

    if (selectedIds.length > 0) {
      setSelectedSamplesForCentrifuge(selectedIds as number[])
      setShowBulkCentrifugeConfirm(true)
    }
  }

  const handleBulkCentrifugeConfirm = async () => {
    try {
      setIsBulkOperationLoading(true)
      setBulkOperationProgress(0)

      const totalSamples = selectedSamplesForCentrifuge.length
      let processedSamples = 0

      await Promise.all(
        selectedSamplesForCentrifuge.map(async id => {
          try {
            const response = await fetch('/api/apps/lims/Sample-received?action=centrifuge', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ ids: [id] })
            })

            if (!response.ok) {
              throw new Error('Failed to centrifuge sample')
            }

            processedSamples++
            setBulkOperationProgress((processedSamples / totalSamples) * 100)
          } catch (error) {
            console.error(`Error centrifuging sample ${id}:`, error)
          }
        })
      )

      toast.success('Selected samples sent for centrifugation successfully')
      const response = await fetch('/api/apps/lims/Sample-received')
      const newData = await response.json()
      setData(newData.result || newData)
      setFilteredData(newData.result || newData)
      onDataChange?.()
    } catch (error) {
      console.error('Error centrifuging samples:', error)
      toast.error('Failed to centrifuge some samples. Please check the audit trail for details.')
    } finally {
      setShowBulkCentrifugeConfirm(false)
      setSelectedSamplesForCentrifuge([])
      setIsBulkOperationLoading(false)
      setBulkOperationProgress(0)
    }
  }

  // Add audit trail type
  type AuditTrailType = {
    actionPerformed: string
    description: string
    triggeredBy: string
    triggeredOn: string
    status: string
    reason?: string
    volunteerId?: string
    barcodeId?: string
    sampleSendBy?: string
    sampleSendOn?: string
  }

  // Add audit trail dialog component
  const AuditTrailDialog = ({
    open,
    setOpen,
    sampleId
  }: {
    open: boolean
    setOpen: (open: boolean) => void
    sampleId: number
  }) => {
    const [auditTrail, setAuditTrail] = useState<AuditTrailType[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      const fetchAuditTrail = async () => {
        try {
          setLoading(true)
          const response = await fetch('/api/apps/lims/Sample-received/audit-trail', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sampleId })
          })
          const data = await response.json()
          setAuditTrail(data.result || [])
        } catch (error) {
          console.error('Error fetching audit trail:', error)
          toast.error('Failed to fetch audit trail')
        } finally {
          setLoading(false)
        }
      }

      if (open && sampleId) {
        fetchAuditTrail()
      }
    }, [open, sampleId])

    return (
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>Audit Trail</DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
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
                  <TableCell>Sample Send By</TableCell>
                  <TableCell>Sample Send On</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {auditTrail.map((trail, index) => (
                  <TableRow key={index}>
                    <TableCell>{trail.actionPerformed}</TableCell>
                    <TableCell>{trail.description}</TableCell>
                    <TableCell>{trail.triggeredBy}</TableCell>
                    <TableCell>{formatDate(trail.triggeredOn)}</TableCell>
                    <TableCell>{trail.status}</TableCell>
                    <TableCell>{trail.reason || '-'}</TableCell>
                    <TableCell>{trail.volunteerId || '-'}</TableCell>
                    <TableCell>{trail.barcodeId || '-'}</TableCell>
                    <TableCell>{trail.sampleSendBy || '-'}</TableCell>
                    <TableCell>{formatDate(trail.sampleSendOn)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    )
  }

  // Add audit trail handler
  const handleAuditTrail = (id: number) => {
    setSelectedSampleForAudit(id)
    setShowAuditTrail(true)
  }

  // Add sample details handler
  const handleSampleDetails = (sample: SampleType) => {
    setSelectedSampleForDetails(sample)
    setShowSampleDetails(true)
  }

  // Add progress indicator component
  const BulkOperationProgress = () => (
    <Box sx={{ width: '100%', mt: 2 }}>
      <LinearProgress variant='determinate' value={bulkOperationProgress} />
      <Typography variant='body2' color='text.secondary' align='center' sx={{ mt: 1 }}>
        Processing {Math.round(bulkOperationProgress)}% complete
      </Typography>
    </Box>
  )

  // Create a wrapper function for TableFilters compatibility
  const handleFilterDataChange = (sampleData: SampleType[]) => {
    let filtered = sampleData
    if (searchText.trim()) {
      const lower = searchText.trim().toLowerCase()
      filtered = filtered.filter(
        sample =>
          (sample.id?.toString() || '').toLowerCase().includes(lower) ||
          (sample.barcodeId?.toLowerCase() || '').includes(lower) ||
          (sample.subjectId?.toLowerCase() || '').includes(lower)
      )
    }
    // Convert SampleType[] back to VolunteerData[] format
    const volunteerDataMap = new Map<string, VolunteerData>()

    filtered.forEach(sample => {
      const volunteerId = sample.subjectId || 'unknown'
      if (!volunteerDataMap.has(volunteerId)) {
        volunteerDataMap.set(volunteerId, {
          subjectId: volunteerId,
          barcodeId: sample.barcodeId || '',
          sampleType: sample.sampleType || '',
          volunteerName: typeof sample.VolunteerName === 'string' ? sample.VolunteerName : '',
          sampleData: []
        })
      }

      const volunteer = volunteerDataMap.get(volunteerId)!
      volunteer.sampleData.push({
        id: sample.id?.toString() || '',
        barcodeId: sample.barcodeId || '',
        sampleType: sample.sampleType || '',
        sampleCollectedBy: sample.collectedBy || '',
        sampleCollectedOn: sample.collectedOn || '',
        sampleSentBy: typeof sample.sentByName === 'string' ? sample.sentByName : '',
        sampleSentOn: sample.sentOn || '',
        status: sample.receiveStatus || 'Pending'
      })
    })

    setFilteredData(Array.from(volunteerDataMap.values()))
  }

  // Get selected sample IDs
  const selectedSampleIds = Object.entries(selectedSamples)
    .filter(([_, checked]) => checked)
    .map(([barcodeId]) => {
      const allSamples = Object.values(grouped).flatMap(group => group.samples)
      return allSamples.find(sample => sample.barcodeId === barcodeId)?.id
    })
    .filter(Boolean)

  // Add useEffect to re-apply search filter when searchText changes
  useEffect(() => {
    handleFilterDataChange(Object.values(grouped).flatMap(group => group.samples))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText])

  return (
    <>
      <BarcodePrintDialog
        open={showBarcodeDialog}
        setOpen={setShowBarcodeDialog}
        sampleId={selectedSample?.id ?? 0}
        barcodeId={selectedSample?.barcodeId || ''}
        samples={
          selectedSample
            ? [
                {
                  id: selectedSample.id,
                  barcodeId: selectedSample.barcodeId || '',
                  subjectId: selectedSample.subjectId,
                  sampleType: selectedSample.sampleType,
                  collectedOn: selectedSample.collectedOn
                }
              ]
            : undefined
        }
        sampleDetails={
          selectedSample
            ? {
                subjectId: selectedSample.subjectId,
                sampleType: selectedSample.sampleType,
                collectedOn: selectedSample.collectedOn
              }
            : undefined
        }
      />
      <SampleDetailsDialog open={showSampleDetails} setOpen={setShowSampleDetails} sample={selectedSampleForDetails} />
      <RemarkDialog
        open={showRemarkDialog}
        setOpen={setShowRemarkDialog}
        sampleId={selectedSampleForRemark?.id || 0}
        onSuccess={handleRemarkSuccess}
      />
      <ConfirmDialog
        open={showReceiveConfirm}
        title='Confirm Sample Receive'
        description='Are you sure you want to receive this sample?'
        handleClose={() => setShowReceiveConfirm(false)}
        handleConfirm={async () => {
          if (selectedSampleForReceive) await handleSampleReceive(selectedSampleForReceive.id)
        }}
        disabled={isLoading}
      />
      <ConfirmDialog
        open={showRejectConfirm}
        title='Confirm Sample Reject'
        description={
          <Box>
            <Typography variant='body2' sx={{ mb: 2 }}>
              Are you sure you want to reject this sample?
            </Typography>
            <CustomTextField
              fullWidth
              label='Rejection Reason'
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              multiline
              rows={3}
              required
            />
          </Box>
        }
        handleClose={() => setShowRejectConfirm(false)}
        handleConfirm={handleRejectConfirm}
        disabled={isLoading}
      />
      <ConfirmDialog
        open={showOutsourceConfirm}
        title='Confirm Sample Outsource'
        description={`Are you sure you want to outsource ${selectedSamplesForOutsource.length} sample(s)?`}
        handleClose={() => setShowOutsourceConfirm(false)}
        handleConfirm={handleOutsourceConfirm}
        disabled={isBulkOperationLoading}
      />
      <ConfirmDialog
        open={showBulkReceiveConfirm}
        title='Confirm Bulk Receive'
        description={`Are you sure you want to receive ${selectedSamplesForReceive.length} sample(s)?`}
        handleClose={() => setShowBulkReceiveConfirm(false)}
        handleConfirm={handleBulkReceiveConfirm}
        disabled={isBulkOperationLoading}
      />
      <ConfirmDialog
        open={showBulkRejectConfirm}
        title='Confirm Bulk Reject'
        description={
          <Box>
            <Typography variant='body2' sx={{ mb: 2 }}>
              Are you sure you want to reject {selectedSamplesForReject.length} sample(s)?
            </Typography>
            <CustomTextField
              fullWidth
              label='Rejection Reason'
              value={bulkRejectReason}
              onChange={e => setBulkRejectReason(e.target.value)}
              multiline
              rows={3}
              required
            />
          </Box>
        }
        handleClose={() => setShowBulkRejectConfirm(false)}
        handleConfirm={handleBulkRejectConfirm}
        disabled={isBulkOperationLoading}
      />
      <ConfirmDialog
        open={showBulkCentrifugeConfirm}
        title='Confirm Bulk Centrifuge'
        description={`Are you sure you want to send ${selectedSamplesForCentrifuge.length} sample(s) for centrifugation?`}
        handleClose={() => setShowBulkCentrifugeConfirm(false)}
        handleConfirm={handleBulkCentrifugeConfirm}
        disabled={isBulkOperationLoading}
      />
      <AuditTrailDialog open={showAuditTrail} setOpen={setShowAuditTrail} sampleId={selectedSampleForAudit || 0} />
      {isBulkOperationLoading && <BulkOperationProgress />}
      <Paper
        sx={{
          width: '100%',
          overflow: 'hidden',
          boxShadow: theme => theme.shadows[1],
          borderRadius: 1,
          border: theme => `1px solid ${theme.palette.divider}`,
          transition: 'all 0.3s ease-in-out',
          mb: 4
        }}
      >
        {/* Top section: Title and actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 4, pb: 2 }}>
          <Typography variant='h4'>Sample Received</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <DebouncedInput
              placeholder='Scan barcode'
              value={searchText}
              onChange={val => setSearchText(val as string)}
              sx={{ minWidth: 260 }}
            />
            <Button
              variant='outlined'
              startIcon={<i className='tabler-printer' />}
              onClick={handlePdfExport}
              disabled={isPdfLoading}
            >
              {isPdfLoading ? 'Exporting...' : 'PDF'}
            </Button>
            <Button
              variant='outlined'
              startIcon={<i className='tabler-file-spreadsheet' />}
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? 'Exporting...' : 'Export'}
            </Button>
            {/* Placeholder for future bulk actions */}
          </Box>
        </Box>
        {/* Divider line between title/actions and filters/table */}
        <Divider sx={{ mb: 2 }} />
        {/* Filters */}
        <Box sx={{ px: 4 }}>
          <TableFilters
            setData={handleFilterDataChange}
            sampleData={Object.values(grouped).flatMap(group => group.samples)}
          />
        </Box>
        {/* Grouped Table (filtered) */}
        <Box sx={{ px: 4, pb: 4 }}>
          <GroupedSampleReceivedTable
            sampleData={filteredData}
            onSampleDetails={handleSampleDetails}
            onPrintBarcode={sample => {
              setSelectedSample(sample)
              setShowBarcodeDialog(true)
            }}
          />
        </Box>
      </Paper>
    </>
  )
}
export default SampleReceivedTable
