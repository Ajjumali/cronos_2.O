import React, { useState, useEffect } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import { toast } from 'react-toastify'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

type AuditTrailType = {
  id: number
  userId: number
  type: string
  tableName: string
  dateTime: string
  oldValues: string
  newValues: string
  affectedColumns: string
  primaryKey: string
}

interface AuditTrailDialogProps {
  open: boolean
  onClose: () => void
  outsourceId: number
}

const AuditTrailDialog: React.FC<AuditTrailDialogProps> = ({
  open,
  onClose,
  outsourceId
}) => {
  const [auditTrails, setAuditTrails] = useState<AuditTrailType[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [isPdfLoading, setIsPdfLoading] = useState(false)

  useEffect(() => {
    if (open && outsourceId) {
      fetchAuditTrails()
    }
  }, [open, outsourceId])

  const fetchAuditTrails = async () => {
    try {
      // For demonstration, we'll use dummy data instead of fetching
      const dummyData: AuditTrailType[] = [
        {
          id: 1,
          userId: 1,
          type: 'Created',
          tableName: 'Outsource',
          dateTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
          oldValues: '',
          newValues: JSON.stringify({
            sampleId: 'SMP001',
            referenceId: 'REF001',
            status: 'Pending'
          }),
          affectedColumns: 'sampleId, referenceId, status',
          primaryKey: outsourceId.toString()
        },
        {
          id: 2,
          userId: 1,
          type: 'Updated',
          tableName: 'Outsource',
          dateTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
          oldValues: JSON.stringify({
            status: 'Pending'
          }),
          newValues: JSON.stringify({
            status: 'In Progress'
          }),
          affectedColumns: 'status',
          primaryKey: outsourceId.toString()
        },
        {
          id: 3,
          userId: 2,
          type: 'Updated',
          tableName: 'Outsource',
          dateTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
          oldValues: JSON.stringify({
            laboratoryId: null
          }),
          newValues: JSON.stringify({
            laboratoryId: 1,
            laboratory: {
              id: 1,
              labName: 'ABC Laboratory'
            }
          }),
          affectedColumns: 'laboratoryId, laboratory',
          primaryKey: outsourceId.toString()
        },
        {
          id: 4,
          userId: 1,
          type: 'Updated',
          tableName: 'Outsource',
          dateTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          oldValues: JSON.stringify({
            selectedTests: []
          }),
          newValues: JSON.stringify({
            selectedTests: [
              { id: 1, testName: 'Blood Test' },
              { id: 2, testName: 'Urine Analysis' }
            ]
          }),
          affectedColumns: 'selectedTests',
          primaryKey: outsourceId.toString()
        },
        {
          id: 5,
          userId: 2,
          type: 'Updated',
          tableName: 'Outsource',
          dateTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          oldValues: JSON.stringify({
            status: 'In Progress',
            shipmentStatus: null
          }),
          newValues: JSON.stringify({
            status: 'Shipped',
            shipmentStatus: 'Shipped',
            shipmentTrackingId: 'TRK123456',
            shipmentDate: new Date().toISOString()
          }),
          affectedColumns: 'status, shipmentStatus, shipmentTrackingId, shipmentDate',
          primaryKey: outsourceId.toString()
        },
        {
          id: 6,
          userId: 3,
          type: 'Updated',
          tableName: 'Outsource',
          dateTime: new Date().toISOString(), // Today
          oldValues: JSON.stringify({
            status: 'Shipped'
          }),
          newValues: JSON.stringify({
            status: 'Processed',
            processedDate: new Date().toISOString()
          }),
          affectedColumns: 'status, processedDate',
          primaryKey: outsourceId.toString()
        }
      ]
      setAuditTrails(dummyData)
    } catch (error) {
      console.error('Error fetching audit trails:', error)
      toast.error('Failed to fetch audit trails')
    }
  }

  const filteredAuditTrails = auditTrails.filter(trail =>
    trail.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trail.tableName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trail.affectedColumns?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleExportCSV = () => {
    setIsExporting(true)
    try {
      const dataToExport = filteredAuditTrails.map(trail => ({
        'Date/Time': new Date(trail.dateTime).toLocaleString(),
        'Type': trail.type,
        'Table': trail.tableName,
        'Changes': trail.affectedColumns,
        'Old Values': trail.oldValues,
        'New Values': trail.newValues
      }))

      const headers = Object.keys(dataToExport[0])
      const csvContent = [
        headers.join(','),
        ...dataToExport.map(row =>
          headers.map(header => {
            const value = row[header as keyof typeof row]
            return typeof value === 'string' && value.includes(',')
              ? `"${value}"`
              : value
          }).join(',')
        )
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `audit-trail-${outsourceId}-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('CSV file downloaded successfully')
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to download CSV file')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportPDF = () => {
    setIsPdfLoading(true)
    try {
      const doc = new jsPDF()
      
      // Add title
      doc.setFontSize(16)
      doc.text('Audit Trail Report', 14, 15)
      
      // Add date
      doc.setFontSize(10)
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22)

      // Prepare table data
      const tableData = filteredAuditTrails.map(trail => [
        new Date(trail.dateTime).toLocaleString(),
        trail.type,
        trail.tableName,
        trail.affectedColumns || '',
        trail.oldValues || '',
        trail.newValues || ''
      ])

      // Add table
      autoTable(doc, {
        head: [['Date/Time', 'Type', 'Table', 'Changes', 'Old Values', 'New Values']],
        body: tableData,
        startY: 30,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 30 }
      })

      // Save the PDF
      doc.save(`audit-trail-${outsourceId}-${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success('PDF file downloaded successfully')
    } catch (error) {
      console.error('PDF export failed:', error)
      toast.error('Failed to download PDF file')
    } finally {
      setIsPdfLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Audit Trail</DialogTitle>
      <DialogContent>
        <div className="flex justify-between items-center mb-4">
          <TextField
            fullWidth
            margin="normal"
            placeholder="Search audit trail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <i className="tabler-search" />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setSearchTerm('')}
                  >
                    <i className="tabler-x" />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </div>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date/Time</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Table</TableCell>
                <TableCell>Changes</TableCell>
                <TableCell>Old Values</TableCell>
                <TableCell>New Values</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAuditTrails.map((trail) => (
                <TableRow key={trail.id}>
                  <TableCell>{new Date(trail.dateTime).toLocaleString()}</TableCell>
                  <TableCell>{trail.type}</TableCell>
                  <TableCell>{trail.tableName}</TableCell>
                  <TableCell>{trail.affectedColumns}</TableCell>
                  <TableCell>{trail.oldValues}</TableCell>
                  <TableCell>{trail.newValues}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button
          color="error"
          variant="tonal"
          onClick={handleExportPDF}
          disabled={isPdfLoading}
          startIcon={
            isPdfLoading ? (
              <i className="tabler-loader animate-spin" />
            ) : (
              <i className="tabler-file-text" />
            )
          }
        >
          {isPdfLoading ? 'Generating...' : 'PDF'}
        </Button>
        <Button
          color="success"
          variant="tonal"
          onClick={handleExportCSV}
          disabled={isExporting}
          startIcon={
            isExporting ? (
              <i className="tabler-loader animate-spin" />
            ) : (
              <i className="tabler-upload" />
            )
          }
        >
          {isExporting ? 'Exporting...' : 'CSV'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AuditTrailDialog 