import { useState } from 'react'
import {
  Box,
  Card,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination
} from '@mui/material'
import { format } from 'date-fns'
import { AccreditationDetail, AccreditationTest } from '@/app/api/apps/lims/types'
import { nablService } from '@/app/api/apps/lims/NABL/service'

// Custom icons since @mui/icons-material is not available
const MoreVerticalIcon = () => <span>⋮</span>
const EditIcon = () => <span>✎</span>
const DeleteIcon = () => <span>🗑</span>
const CopyIcon = () => <span>📋</span>
const InfoIcon = () => <span>ℹ</span>

interface Props {
  accreditationData: AccreditationDetail[]
  onDataChange: () => void
}

interface TableColumn {
  field: string
  headerName: string
  width?: number
  flex?: number
  renderCell?: (row: AccreditationDetail) => React.ReactNode
  valueGetter?: (row: AccreditationDetail) => string | number
}

const NablListTable = ({ accreditationData, onDataChange }: Props) => {
  const [selectedRow, setSelectedRow] = useState<AccreditationDetail | null>(null)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [openTestDetailsDialog, setOpenTestDetailsDialog] = useState(false)
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'copy'>('add')
  const [formData, setFormData] = useState<Partial<AccreditationDetail>>({
    fromDate: new Date().toISOString(),
    toDate: new Date().toISOString(),
    accreditationType: 'NABL',
    tests: []
  })
  const [page, setPage] = useState(1)
  const rowsPerPage = 5

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, row: AccreditationDetail) => {
    setAnchorEl(event.currentTarget)
    setSelectedRow(row)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedRow(null)
  }

  const handleEdit = () => {
    if (selectedRow) {
      setFormData(selectedRow)
      setDialogMode('edit')
      setOpenDialog(true)
    }
    handleMenuClose()
  }

  const handleDelete = async () => {
    if (selectedRow) {
      try {
        await nablService.deleteAccreditation(selectedRow.id)
        onDataChange()
      } catch (error) {
        console.error('Error deleting accreditation:', error)
      }
    }
    handleMenuClose()
  }

  const handleCopy = () => {
    if (selectedRow) {
      setFormData({
        ...selectedRow,
        id: undefined,
        fromDate: new Date().toISOString(),
        toDate: new Date().toISOString()
      })
      setDialogMode('copy')
      setOpenDialog(true)
    }
    handleMenuClose()
  }

  const handleViewTestDetails = () => {
    setOpenTestDetailsDialog(true)
    handleMenuClose()
  }

  const handleSave = async () => {
    try {
      if (dialogMode === 'add' || dialogMode === 'copy') {
        await nablService.createAccreditation(formData as Omit<AccreditationDetail, 'id'>)
      } else if (dialogMode === 'edit' && selectedRow) {
        await nablService.updateAccreditation({ ...formData, id: selectedRow.id } as AccreditationDetail)
      }
      onDataChange()
      setOpenDialog(false)
      setFormData({
        fromDate: new Date().toISOString(),
        toDate: new Date().toISOString(),
        accreditationType: 'NABL',
        tests: []
      })
    } catch (error) {
      console.error('Error saving accreditation:', error)
    }
  }

  const columns: TableColumn[] = [
    {
      field: 'dateRange',
      headerName: 'Date Range',
      flex: 1,
      valueGetter: (row) => `${format(new Date(row.fromDate), 'dd/MM/yyyy')} - ${format(new Date(row.toDate), 'dd/MM/yyyy')}`
    },
    {
      field: 'testCount',
      headerName: 'Test Count',
      flex: 1,
      valueGetter: (row) => row.tests.length
    },
    {
      field: 'accreditationType',
      headerName: 'Accreditation Type',
      flex: 1,
      renderCell: (row) => (
        <Chip
          label={row.accreditationType}
          color={row.accreditationType === 'NABL' ? 'primary' : 'secondary'}
          size="small"
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      renderCell: (row) => (
        <IconButton onClick={(e) => handleMenuOpen(e, row)}>
          <MoreVerticalIcon />
        </IconButton>
      )
    }
  ]

  const paginatedData = accreditationData.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  )

  return (
    <Card>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.field} style={{ width: column.width, flex: column.flex }}>
                  {column.headerName}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((row) => (
              <TableRow key={row.id}>
                {columns.map((column) => (
                  <TableCell key={`${row.id}-${column.field}`}>
                    {column.renderCell
                      ? column.renderCell(row)
                      : column.valueGetter
                      ? column.valueGetter(row)
                      : String(row[column.field as keyof AccreditationDetail] || '')}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Pagination
          count={Math.ceil(accreditationData.length / rowsPerPage)}
          page={page}
          onChange={(_, value) => setPage(value)}
        />
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon /> Edit
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <DeleteIcon /> Delete
        </MenuItem>
        <MenuItem onClick={handleCopy}>
          <CopyIcon /> Copy
        </MenuItem>
        <MenuItem onClick={handleViewTestDetails}>
          <InfoIcon /> View Test Details
        </MenuItem>
      </Menu>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' ? 'Add Accreditation' : dialogMode === 'edit' ? 'Edit Accreditation' : 'Copy Accreditation'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="From Date"
                type="date"
                value={formData.fromDate?.split('T')[0]}
                onChange={(e) => setFormData({ ...formData, fromDate: new Date(e.target.value).toISOString() })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="To Date"
                type="date"
                value={formData.toDate?.split('T')[0]}
                onChange={(e) => setFormData({ ...formData, toDate: new Date(e.target.value).toISOString() })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openTestDetailsDialog} onClose={() => setOpenTestDetailsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Test Details</DialogTitle>
        <DialogContent>
          {selectedRow && (
            <Box sx={{ mt: 2 }}>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Sr. No.</TableCell>
                      <TableCell>Test Name</TableCell>
                      <TableCell>Added By</TableCell>
                      <TableCell>Added On</TableCell>
                      <TableCell>Modified By</TableCell>
                      <TableCell>Modified On</TableCell>
                      <TableCell>Remarks</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedRow.tests.map((test, index) => (
                      <TableRow key={test.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{test.testName}</TableCell>
                        <TableCell>{test.addedBy}</TableCell>
                        <TableCell>{format(new Date(test.addedOn), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>{test.modifiedBy}</TableCell>
                        <TableCell>{format(new Date(test.modifiedOn), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>{test.remarks}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTestDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default NablListTable
