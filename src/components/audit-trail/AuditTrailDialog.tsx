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
import SearchIcon from '@mui/icons-material/Search'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import { toast } from 'react-toastify'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export type AuditTrailType = {
  id: number
  userId: number
  userName?: string
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
  recordId: number
  moduleName: string
  fetchAuditTrails: (recordId: number) => Promise<AuditTrailType[]>
}

const AuditTrailDialog: React.FC<AuditTrailDialogProps> = ({
  open,
  onClose,
  recordId,
  moduleName,
  fetchAuditTrails
}) => {
  const [auditTrails, setAuditTrails] = useState<AuditTrailType[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [isPdfLoading, setIsPdfLoading] = useState(false)

  useEffect(() => {
    if (open && recordId) {
      loadAuditTrails()
    }
  }, [open, recordId])

  const loadAuditTrails = async () => {
    try {
      const data = await fetchAuditTrails(recordId)
      setAuditTrails(data)
    } catch (error) {
      console.error('Error fetching audit trails:', error)
      toast.error('Failed to fetch audit trails')
    }
  }

  const filteredAuditTrails = auditTrails.filter(trail =>
    trail.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trail.tableName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trail.affectedColumns?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trail.userName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleExportCSV = () => {
    setIsExporting(true)
    try {
      const dataToExport = filteredAuditTrails.map(trail => ({
        'Date/Time': new Date(trail.dateTime).toLocaleString(),
        'User': trail.userName || `User ${trail.userId}`,
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
      link.setAttribute('download', `audit-trail-${moduleName}-${recordId}-${new Date().toISOString().split('T')[0]}.csv`)
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
      doc.text(`${moduleName} Audit Trail Report`, 14, 15)
      
      // Add date and record ID
      doc.setFontSize(10)
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22)
      doc.text(`Record ID: ${recordId}`, 14, 28)

      // Prepare table data
      const tableData = filteredAuditTrails.map(trail => [
        new Date(trail.dateTime).toLocaleString(),
        trail.userName || `User ${trail.userId}`,
        trail.type,
        trail.tableName,
        trail.affectedColumns || '',
        trail.oldValues || '',
        trail.newValues || ''
      ])

      // Add table
      autoTable(doc, {
        head: [['Date/Time', 'User', 'Type', 'Table', 'Changes', 'Old Values', 'New Values']],
        body: tableData,
        startY: 35,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 35 }
      })

      doc.save(`audit-trail-${moduleName}-${recordId}-${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success('PDF file downloaded successfully')
    } catch (error) {
      console.error('PDF export failed:', error)
      toast.error('Failed to download PDF file')
    } finally {
      setIsPdfLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '80vh',
          maxHeight: '80vh'
        }
      }}
    >
      <DialogTitle>
        {moduleName} Audit Trail
        <TextField
          size="small"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ float: 'right', width: '300px' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
      </DialogTitle>
      <DialogContent>
        <TableContainer component={Paper} sx={{ maxHeight: 'calc(80vh - 200px)' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Date/Time</TableCell>
                <TableCell>User</TableCell>
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
                  <TableCell>{trail.userName || `User ${trail.userId}`}</TableCell>
                  <TableCell>{trail.type}</TableCell>
                  <TableCell>{trail.tableName}</TableCell>
                  <TableCell>{trail.affectedColumns}</TableCell>
                  <TableCell>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                      {trail.oldValues ? JSON.stringify(JSON.parse(trail.oldValues), null, 2) : ''}
                    </pre>
                  </TableCell>
                  <TableCell>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                      {trail.newValues ? JSON.stringify(JSON.parse(trail.newValues), null, 2) : ''}
                    </pre>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleExportCSV}
          disabled={isExporting}
          startIcon={<FileDownloadIcon />}
        >
          Export CSV
        </Button>
        <Button
          onClick={handleExportPDF}
          disabled={isPdfLoading}
          startIcon={<PictureAsPdfIcon />}
        >
          Export PDF
        </Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

export default AuditTrailDialog 