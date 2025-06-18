'use client'

import React, { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  IconButton,
  Collapse,
  Box,
  Typography,
  TablePagination,
  Chip
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'

interface Column {
  key: string
  mLabel: string
  isVisible: boolean
}

interface SampleData {
  barcode_id: string
  SAMPLETYPE: string
  sample_collected_by: string
  sample_collected_on: string
  sample_sent_by: string
  sample_sent_on: string
  is_selected?: boolean
}

interface TableItem {
  id: string
  sample_data: SampleData[]
  [key: string]: any // for dynamic column values
}

interface SampleSendTableProps {
  columns?: Column[]
  data?: TableItem[]
}

export default function SampleSendTable({ columns = [], data = [] }: SampleSendTableProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [selectedSamples, setSelectedSamples] = useState<Record<string, boolean>>({})
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(5)

  const handleExpand = (id: string, samples: SampleData[]) => {
    const newExpanded = !expanded[id]
    setExpanded(prev => ({ ...prev, [id]: newExpanded }))

    // When expanding, sync sample selections with main row selection
    if (newExpanded && selected[id]) {
      const newSelectedSamples = { ...selectedSamples }
      samples.forEach(sample => {
        newSelectedSamples[sample.barcode_id] = true
      })
      setSelectedSamples(newSelectedSamples)
    }
  }

  const handleSelect = (id: string, samples: SampleData[]) => {
    const newSelected = !selected[id]
    setSelected(prev => ({ ...prev, [id]: newSelected }))

    // Select/deselect all samples for this patient
    const newSelectedSamples = { ...selectedSamples }
    samples.forEach(sample => {
      newSelectedSamples[sample.barcode_id] = newSelected
    })
    setSelectedSamples(newSelectedSamples)
  }

  const handleSampleSelect = (sampleId: string) => {
    setSelectedSamples(prev => ({ ...prev, [sampleId]: !prev[sampleId] }))
  }

  // Dummy data for testing
  const dummyData: TableItem[] = [
    {
      id: '1',
      patient_name: 'John Doe',
      patient_id: 'P001',
      test_type: 'Blood Test',
      status: 'Pending',
      sample_data: [
        {
          barcode_id: 'BC001',
          SAMPLETYPE: 'Blood',
          sample_collected_by: 'Dr. Smith',
          sample_collected_on: '2024-03-20',
          sample_sent_by: 'Nurse Johnson',
          sample_sent_on: '2024-03-21'
        },
        {
          barcode_id: 'BC002',
          SAMPLETYPE: 'Urine',
          sample_collected_by: 'Dr. Smith',
          sample_collected_on: '2024-03-20',
          sample_sent_by: 'Nurse Johnson',
          sample_sent_on: '2024-03-21'
        }
      ]
    },
    {
      id: '2',
      patient_name: 'Jane Smith',
      patient_id: 'P002',
      test_type: 'Urine Test',
      status: 'Completed',
      sample_data: [
        {
          barcode_id: 'BC003',
          SAMPLETYPE: 'Urine',
          sample_collected_by: 'Dr. Brown',
          sample_collected_on: '2024-03-19',
          sample_sent_by: 'Nurse Wilson',
          sample_sent_on: '2024-03-20'
        }
      ]
    },
    {
      id: '3',
      patient_name: 'Robert Johnson',
      patient_id: 'P003',
      test_type: 'Multiple Tests',
      status: 'In Progress',
      sample_data: [
        {
          barcode_id: 'BC004',
          SAMPLETYPE: 'Blood',
          sample_collected_by: 'Dr. Davis',
          sample_collected_on: '2024-03-22',
          sample_sent_by: 'Nurse Parker',
          sample_sent_on: '2024-03-22'
        },
        {
          barcode_id: 'BC005',
          SAMPLETYPE: 'Tissue',
          sample_collected_by: 'Dr. Davis',
          sample_collected_on: '2024-03-22',
          sample_sent_by: 'Nurse Parker',
          sample_sent_on: '2024-03-22'
        },
        {
          barcode_id: 'BC006',
          SAMPLETYPE: 'Swab',
          sample_collected_by: 'Dr. Davis',
          sample_collected_on: '2024-03-22',
          sample_sent_by: 'Nurse Parker',
          sample_sent_on: '2024-03-22'
        }
      ]
    },
    {
      id: '4',
      patient_name: 'Maria Garcia',
      patient_id: 'P004',
      test_type: 'COVID Test',
      status: 'Pending',
      sample_data: [
        {
          barcode_id: 'BC007',
          SAMPLETYPE: 'Nasal Swab',
          sample_collected_by: 'Dr. Lee',
          sample_collected_on: '2024-03-21',
          sample_sent_by: 'Nurse Chen',
          sample_sent_on: '2024-03-21'
        }
      ]
    },
    {
      id: '5',
      patient_name: 'James Wilson',
      patient_id: 'P005',
      test_type: 'Comprehensive Panel',
      status: 'Completed',
      sample_data: [
        {
          barcode_id: 'BC008',
          SAMPLETYPE: 'Blood',
          sample_collected_by: 'Dr. Taylor',
          sample_collected_on: '2024-03-18',
          sample_sent_by: 'Nurse Anderson',
          sample_sent_on: '2024-03-18'
        },
        {
          barcode_id: 'BC009',
          SAMPLETYPE: 'Urine',
          sample_collected_by: 'Dr. Taylor',
          sample_collected_on: '2024-03-18',
          sample_sent_by: 'Nurse Anderson',
          sample_sent_on: '2024-03-18'
        },
        {
          barcode_id: 'BC010',
          SAMPLETYPE: 'Stool',
          sample_collected_by: 'Dr. Taylor',
          sample_collected_on: '2024-03-18',
          sample_sent_by: 'Nurse Anderson',
          sample_sent_on: '2024-03-18'
        }
      ]
    },
    {
      id: '6',
      patient_name: 'Sarah Chen',
      patient_id: 'P006',
      test_type: 'Allergy Test',
      status: 'In Progress',
      sample_data: [
        {
          barcode_id: 'BC011',
          SAMPLETYPE: 'Blood',
          sample_collected_by: 'Dr. Martinez',
          sample_collected_on: '2024-03-23',
          sample_sent_by: 'Nurse Thompson',
          sample_sent_on: '2024-03-23'
        },
        {
          barcode_id: 'BC012',
          SAMPLETYPE: 'Skin',
          sample_collected_by: 'Dr. Martinez',
          sample_collected_on: '2024-03-23',
          sample_sent_by: 'Nurse Thompson',
          sample_sent_on: '2024-03-23'
        }
      ]
    }
  ]

  const dummyColumns: Column[] = [
    { key: 'patient_name', mLabel: 'Employee Name', isVisible: true },
    { key: 'patient_id', mLabel: 'Employee ID', isVisible: true },
    { key: 'test_type', mLabel: 'Test Type', isVisible: true },
    { key: 'status', mLabel: 'Status', isVisible: true }
  ]

  // Use dummy data if no data is provided
  const displayData = (data?.length ?? 0) > 0 ? data : dummyData
  const displayColumns = (columns?.length ?? 0) > 0 ? columns : dummyColumns

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success'
      case 'pending':
        return 'warning'
      case 'in progress':
        return 'info'
      default:
        return 'default'
    }
  }

  return (
    <Paper
      sx={{
        width: '100%',
        overflow: 'hidden',
        boxShadow: theme => theme.shadows[1],
        borderRadius: 1,
        border: theme => `1px solid ${theme.palette.divider}`,
        transition: 'all 0.3s ease-in-out'
      }}
    >
      <TableContainer
        sx={{
          maxHeight: 640,
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
            transition: 'all 0.3s ease-in-out'
          },
          '&::-webkit-scrollbar-track': {
            background: theme => theme.palette.background.default,
            borderRadius: '4px',
            transition: 'all 0.3s ease-in-out'
          },
          '&::-webkit-scrollbar-thumb': {
            background: theme => theme.palette.divider,
            borderRadius: '4px',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              background: theme => theme.palette.action.hover
            }
          }
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell
                padding='checkbox'
                sx={{
                  backgroundColor: theme => theme.palette.background.paper,
                  borderBottom: theme => `2px solid ${theme.palette.divider}`,
                  py: 2,
                  transition: 'all 0.3s ease-in-out'
                }}
              />
              {displayColumns.map(
                col =>
                  col.isVisible && (
                    <TableCell
                      key={col.key}
                      sx={{
                        backgroundColor: theme => theme.palette.background.paper,
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        color: theme => theme.palette.text.primary,
                        borderBottom: theme => `2px solid ${theme.palette.divider}`,
                        py: 2,
                        px: 2,
                        transition: 'all 0.3s ease-in-out'
                      }}
                    >
                      {col.mLabel}
                    </TableCell>
                  )
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {displayData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={displayColumns.length + 1}
                  align='center'
                  sx={{
                    py: 4,
                    color: theme => theme.palette.text.secondary,
                    fontSize: '0.875rem',
                    transition: 'all 0.3s ease-in-out'
                  }}
                >
                  No data found
                </TableCell>
              </TableRow>
            ) : (
              displayData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item, idx) => (
                <React.Fragment key={item.id || idx}>
                  <TableRow
                    hover
                    sx={{
                      '& > *': { borderBottom: 'unset' },
                      backgroundColor: theme => (selected[item.id] ? theme.palette.action.selected : 'inherit'),
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        backgroundColor: theme =>
                          selected[item.id] ? theme.palette.action.selected : theme.palette.action.hover,
                        transform: 'translateY(-1px)',
                        boxShadow: theme => theme.shadows[1]
                      }
                    }}
                  >
                    <TableCell
                      padding='checkbox'
                      sx={{
                        borderBottom: theme => `1px solid ${theme.palette.divider}`,
                        py: 1.5,
                        transition: 'all 0.3s ease-in-out'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Checkbox
                          checked={!!selected[item.id]}
                          onChange={() => handleSelect(item.id, item.sample_data || [])}
                          sx={{
                            '&.Mui-checked': {
                              color: theme => theme.palette.primary.main
                            },
                            transition: 'all 0.3s ease-in-out',
                            '&:hover': {
                              transform: 'scale(1.1)'
                            }
                          }}
                        />
                        <IconButton
                          size='small'
                          onClick={() => handleExpand(item.id, item.sample_data || [])}
                          sx={{
                            width: 28,
                            height: 28,
                            backgroundColor: theme =>
                              expanded[item.id] ? theme.palette.primary.main : theme.palette.action.hover,
                            color: theme =>
                              expanded[item.id] ? theme.palette.primary.contrastText : theme.palette.text.primary,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                              backgroundColor: theme =>
                                expanded[item.id] ? theme.palette.primary.dark : theme.palette.action.selected,
                              transform: 'scale(1.1) rotate(180deg)'
                            }
                          }}
                        >
                          {expanded[item.id] ? <RemoveIcon fontSize='small' /> : <AddIcon fontSize='small' />}
                        </IconButton>
                      </Box>
                    </TableCell>
                    {displayColumns.map(
                      col =>
                        col.isVisible && (
                          <TableCell
                            key={col.key}
                            sx={{
                              borderBottom: theme => `1px solid ${theme.palette.divider}`,
                              py: 1.5,
                              px: 2,
                              color: theme => theme.palette.text.primary,
                              transition: 'all 0.3s ease-in-out'
                            }}
                          >
                            {col.key === 'status' ? (
                              <Chip
                                label={item[col.key]}
                                color={getStatusColor(item[col.key]) as any}
                                size='small'
                                sx={{
                                  fontWeight: 500,
                                  '& .MuiChip-label': {
                                    px: 1.5
                                  },
                                  transition: 'all 0.3s ease-in-out',
                                  '&:hover': {
                                    transform: 'scale(1.05)'
                                  }
                                }}
                              />
                            ) : (
                              item[col.key]
                            )}
                          </TableCell>
                        )
                    )}
                  </TableRow>
                  <TableRow>
                    <TableCell
                      style={{ paddingBottom: 0, paddingTop: 0 }}
                      colSpan={displayColumns.length + 1}
                      sx={{ borderBottom: 'none' }}
                    >
                      <Collapse
                        in={!!expanded[item.id]}
                        timeout={300}
                        unmountOnExit
                        sx={{
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      >
                        <Box
                          margin={1}
                          sx={{
                            backgroundColor: theme => theme.palette.background.default,
                            borderRadius: 1,
                            boxShadow: theme => theme.shadows[1],
                            border: theme => `1px solid ${theme.palette.divider}`,
                            transition: 'all 0.3s ease-in-out',
                            transform: 'translateY(0)',
                            opacity: 1
                          }}
                        >
                          <Table size='small'>
                            <TableHead>
                              <TableRow>
                                <TableCell
                                  padding='checkbox'
                                  sx={{
                                    backgroundColor: theme => theme.palette.background.paper,
                                    borderBottom: theme => `1px solid ${theme.palette.divider}`,
                                    py: 1.5,
                                    transition: 'all 0.3s ease-in-out'
                                  }}
                                />
                                {[
                                  'Barcode ID',
                                  'Sample/Vacutainer Type',
                                  'Sample Collected By',
                                  'Sample Collected On',
                                  'Sample Sent By',
                                  'Sample Sent On'
                                ].map(header => (
                                  <TableCell
                                    key={header}
                                    sx={{
                                      backgroundColor: theme => theme.palette.background.paper,
                                      borderBottom: theme => `1px solid ${theme.palette.divider}`,
                                      fontWeight: 500,
                                      py: 1.5,
                                      px: 2,
                                      fontSize: '0.875rem',
                                      transition: 'all 0.3s ease-in-out'
                                    }}
                                  >
                                    {header}
                                  </TableCell>
                                ))}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {(item.sample_data || []).map((sample, sidx) => (
                                <TableRow
                                  key={sidx}
                                  hover
                                  sx={{
                                    backgroundColor: theme =>
                                      selectedSamples[sample.barcode_id] ? theme.palette.action.selected : 'inherit',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    '&:hover': {
                                      backgroundColor: theme =>
                                        selectedSamples[sample.barcode_id]
                                          ? theme.palette.action.selected
                                          : theme.palette.action.hover,
                                      transform: 'translateY(-1px)',
                                      boxShadow: theme => theme.shadows[1]
                                    }
                                  }}
                                >
                                  <TableCell
                                    padding='checkbox'
                                    sx={{
                                      borderBottom: theme => `1px solid ${theme.palette.divider}`,
                                      py: 1.5,
                                      transition: 'all 0.3s ease-in-out'
                                    }}
                                  >
                                    <Checkbox
                                      checked={!!selectedSamples[sample.barcode_id]}
                                      onChange={() => handleSampleSelect(sample.barcode_id)}
                                      sx={{
                                        '&.Mui-checked': {
                                          color: theme => theme.palette.primary.main
                                        },
                                        transition: 'all 0.3s ease-in-out',
                                        '&:hover': {
                                          transform: 'scale(1.1)'
                                        }
                                      }}
                                    />
                                  </TableCell>
                                  {[
                                    sample.barcode_id,
                                    sample.SAMPLETYPE,
                                    sample.sample_collected_by,
                                    sample.sample_collected_on,
                                    sample.sample_sent_by,
                                    sample.sample_sent_on
                                  ].map((value, index) => (
                                    <TableCell
                                      key={index}
                                      sx={{
                                        borderBottom: theme => `1px solid ${theme.palette.divider}`,
                                        py: 1.5,
                                        px: 2,
                                        fontSize: '0.875rem',
                                        color: theme => theme.palette.text.primary,
                                        transition: 'all 0.3s ease-in-out'
                                      }}
                                    >
                                      {value}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component='div'
        count={displayData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        sx={{
          borderTop: theme => `1px solid ${theme.palette.divider}`,
          py: 1,
          transition: 'all 0.3s ease-in-out'
        }}
      />
    </Paper>
  )
}
