import { useState } from 'react'
import {
  Box,
  Card,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Button,
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
  Pagination,
  CardHeader,
  Divider
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
  onNavigateToForm: (params: { id?: string; copyData?: string; isEdit?: boolean; isCopy?: boolean }) => void
}

interface TableColumn {
  field: string
  headerName: string
  width?: number
  flex?: number
  renderCell?: (row: AccreditationDetail) => React.ReactNode
  valueGetter?: (row: AccreditationDetail) => string | number
}

const NablListTable = ({ accreditationData, onDataChange, onNavigateToForm }: Props) => {
  const [selectedRow, setSelectedRow] = useState<AccreditationDetail | null>(null)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [page, setPage] = useState(1)
  const rowsPerPage = 5
  const [search, setSearch] = useState('')

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
      onNavigateToForm({ id: selectedRow.id.toString(), isEdit: true })
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
      // Navigate to form with copy data
      const copyData = {
        ...selectedRow,
        id: undefined,
        fromDate: new Date().toISOString(),
        toDate: new Date().toISOString()
      }
      onNavigateToForm({
        copyData: encodeURIComponent(JSON.stringify(copyData)),
        isCopy: true
      })
    }
    handleMenuClose()
  }

  const columns: TableColumn[] = [
    {
      field: 'dateRange',
      headerName: 'Date Range',
      flex: 1,
      valueGetter: row =>
        `${format(new Date(row.fromDate), 'dd/MM/yyyy')} - ${format(new Date(row.toDate), 'dd/MM/yyyy')}`
    },
    {
      field: 'testCount',
      headerName: 'Test Count',
      flex: 1,
      valueGetter: row => row.tests.length
    },
    {
      field: 'accreditationType',
      headerName: 'Accreditation Type',
      flex: 1,
      renderCell: row => (
        <Chip
          label={row.accreditationType}
          color={row.accreditationType === 'NABL' ? 'primary' : 'secondary'}
          size='small'
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      renderCell: row => (
        <IconButton onClick={e => handleMenuOpen(e, row)}>
          <MoreVerticalIcon />
        </IconButton>
      )
    }
  ]

  const filteredData = accreditationData.filter(row => {
    if (!search) return true
    // Search by accreditationType or test name
    return (
      row.accreditationType.toLowerCase().includes(search.toLowerCase()) ||
      row.tests.some(test => test.testName.toLowerCase().includes(search.toLowerCase()))
    )
  })
  const paginatedData = filteredData.slice((page - 1) * rowsPerPage, page * rowsPerPage)

  return (
    <Card>
      <CardHeader
        title='NABL Accreditation'
        action={
          <Button variant='contained' color='primary' onClick={() => onNavigateToForm({})}>
            Add NABL
          </Button>
        }
      />
      <Divider />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 2, p: 3 }}>
        <TextField
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder='Search NABL or Test Name'
          size='small'
          sx={{ minWidth: 250 }}
        />
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map(column => (
                <TableCell key={column.field} style={{ width: column.width, flex: column.flex }}>
                  {column.headerName}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align='center'>
                  No data available
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map(row => (
                <TableRow
                  key={row.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => onNavigateToForm({ id: row.id.toString(), isEdit: true })}
                >
                  {columns.map(column => (
                    <TableCell key={`${row.id}-${column.field}`}>
                      {column.renderCell
                        ? column.renderCell(row)
                        : column.valueGetter
                          ? column.valueGetter(row)
                          : String(row[column.field as keyof AccreditationDetail] || '')}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 2 }}>
        <Pagination
          count={Math.ceil(filteredData.length / rowsPerPage)}
          page={page}
          onChange={(_, value) => setPage(value)}
        />
      </Box>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEdit}>
          <EditIcon /> Edit
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <DeleteIcon /> Delete
        </MenuItem>
        <MenuItem onClick={handleCopy}>
          <CopyIcon /> Copy
        </MenuItem>
      </Menu>
    </Card>
  )
}

export default NablListTable
