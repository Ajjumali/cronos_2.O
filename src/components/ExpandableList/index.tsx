import React, { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Collapse,
  Paper,
  Checkbox,
  TextField,
  Box
} from '@mui/material'
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material'

// Types for props
interface Column<T = any> {
  label: string
  key: string
  width?: string | number
  align?: 'left' | 'right' | 'center'
  filterable?: boolean
  renderCell?: (row: T) => React.ReactNode
}

interface ExpandableListProps<T> {
  columns: Column<T>[]
  data: T[]
  rowKey: (row: T) => string | number
  renderExpandedContent: (row: T) => React.ReactNode
}

function ExpandableList<T>({ columns, data, rowKey, renderExpandedContent }: ExpandableListProps<T>) {
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set())
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set())
  const [filters, setFilters] = useState<{ [key: string]: string }>({})

  const handleExpandClick = (key: string | number) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }

  const handleCheckboxClick = (key: string | number) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  // Filter data based on filters
  const filteredData = data.filter(row =>
    columns.every(col => {
      const filterValue = filters[col.key]
      if (!filterValue) return true
      const cellValue = (row as any)[col.key]
      return cellValue?.toString().toLowerCase().includes(filterValue.toLowerCase())
    })
  )

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow style={{ background: '#edeff0' }}>
            <TableCell style={{ width: 56 }} /> {/* Checkbox + expand icon */}
            {columns.map(col => (
              <TableCell key={col.key} align={col.align} style={{ width: col.width, fontWeight: 600 }}>
                {col.label}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell />
            {columns.map(col => (
              <TableCell key={col.key} align={col.align}>
                {col.filterable !== false && (
                  <TextField
                    size='small'
                    variant='standard'
                    placeholder='Search'
                    value={filters[col.key] || ''}
                    onChange={e => handleFilterChange(col.key, e.target.value)}
                    fullWidth
                    InputProps={{ disableUnderline: true }}
                  />
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredData.map(row => {
            const key = rowKey(row)
            const isExpanded = expandedRows.has(key)
            const isChecked = selectedRows.has(key)
            return (
              <React.Fragment key={key}>
                <TableRow hover>
                  <TableCell style={{ display: 'flex', alignItems: 'center', padding: 0 }}>
                    <Checkbox
                      checked={isChecked}
                      onChange={() => handleCheckboxClick(key)}
                      size='small'
                      sx={{ marginLeft: 1 }}
                    />
                    <IconButton size='small' onClick={() => handleExpandClick(key)}>
                      {isExpanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                    </IconButton>
                  </TableCell>
                  {columns.map(col => (
                    <TableCell key={col.key} align={col.align}>
                      {col.renderCell ? col.renderCell(row) : (row as any)[col.key]}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={columns.length + 1}>
                    <Collapse in={isExpanded} timeout='auto' unmountOnExit>
                      <Box sx={{ margin: 0, marginLeft: 6 }}>{renderExpandedContent(row)}</Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default ExpandableList
