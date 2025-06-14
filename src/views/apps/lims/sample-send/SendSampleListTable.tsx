'use client'

import { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  TablePagination,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography
} from '@mui/material'
import { Delete, Edit, Info, MoreVert } from '@mui/icons-material'
import { toast } from 'react-toastify'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
// eslint-disable-next-line import/no-unresolved
import OptionMenu from '@core/components/option-menu'

interface Sample {
  id: string
  volunteerId: string
  volunteerName: string
  age: number
  screeningDate: string
  screeningFacility: string
  barcodeId: string
  sampleType: string
  collectedBy: string
  collectedOn: string
  sentBy: string
  sentOn: string
  status: 'pending' | 'sent' | 'received'
  avatar?: string
}

interface Props {
  onSendSamples: (samples: Sample[]) => void
  onSelectSamples: (samples: Sample[]) => void
  searchText: string
  lab: string
}

export default function SendSampleListTable({ onSendSamples, onSelectSamples, searchText, lab }: Props) {
  const [samples, setSamples] = useState<Sample[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [openSendDialog, setOpenSendDialog] = useState(false)

  // Dummy data - Replace with actual API call
  useEffect(() => {
    const dummySamples: Sample[] = [
      {
        id: '1',
        volunteerId: 'VOL001',
        volunteerName: 'John Doe',
        age: 35,
        screeningDate: '2025-05-23',
        screeningFacility: 'Facility A',
        barcodeId: 'BAR001',
        sampleType: 'Blood',
        collectedBy: 'Dr. Smith',
        collectedOn: '2025-05-22',
        sentBy: '',
        sentOn: '',
        status: 'pending',
        avatar: '/images/avatars/1.png'
      },
      {
        id: '2',
        volunteerId: 'VOL002',
        volunteerName: 'Jane Smith',
        age: 28,
        screeningDate: '2025-05-22',
        screeningFacility: 'Facility B',
        barcodeId: 'BAR002',
        sampleType: 'Saliva',
        collectedBy: 'Dr. Johnson',
        collectedOn: '2025-05-21',
        sentBy: 'admin@example.com',
        sentOn: '2025-05-22T10:30:00',
        status: 'sent',
        avatar: '/images/avatars/2.png'
      },
      {
        id: '3',
        volunteerId: 'VOL003',
        volunteerName: 'Robert Johnson',
        age: 42,
        screeningDate: '2025-05-21',
        screeningFacility: 'Facility A',
        barcodeId: 'BAR003',
        sampleType: 'Blood',
        collectedBy: 'Dr. Williams',
        collectedOn: '2025-05-20',
        sentBy: 'lab@example.com',
        sentOn: '2025-05-21T14:15:00',
        status: 'received',
        avatar: '/images/avatars/3.png'
      },
      {
        id: '4',
        volunteerId: 'VOL004',
        volunteerName: 'Emily Davis',
        age: 31,
        screeningDate: '2025-05-20',
        screeningFacility: 'Facility C',
        barcodeId: 'BAR004',
        sampleType: 'Urine',
        collectedBy: 'Dr. Brown',
        collectedOn: '2025-05-19',
        sentBy: '',
        sentOn: '',
        status: 'pending',
        avatar: '/images/avatars/4.png'
      },
      {
        id: '5',
        volunteerId: 'VOL005',
        volunteerName: 'Michael Wilson',
        age: 45,
        screeningDate: '2025-05-19',
        screeningFacility: 'Facility B',
        barcodeId: 'BAR005',
        sampleType: 'Saliva',
        collectedBy: 'Dr. Miller',
        collectedOn: '2025-05-18',
        sentBy: 'admin@example.com',
        sentOn: '2025-05-19T11:20:00',
        status: 'sent',
        avatar: '/images/avatars/5.png'
      },
      {
        id: '6',
        volunteerId: 'VOL006',
        volunteerName: 'Sarah Anderson',
        age: 29,
        screeningDate: '2025-05-18',
        screeningFacility: 'Facility A',
        barcodeId: 'BAR006',
        sampleType: 'Blood',
        collectedBy: 'Dr. Davis',
        collectedOn: '2025-05-17',
        sentBy: 'lab@example.com',
        sentOn: '2025-05-18T09:45:00',
        status: 'received',
        avatar: '/images/avatars/6.png'
      },
      {
        id: '7',
        volunteerId: 'VOL007',
        volunteerName: 'David Thompson',
        age: 38,
        screeningDate: '2025-05-17',
        screeningFacility: 'Facility C',
        barcodeId: 'BAR007',
        sampleType: 'Urine',
        collectedBy: 'Dr. Wilson',
        collectedOn: '2025-05-16',
        sentBy: '',
        sentOn: '',
        status: 'pending',
        avatar: '/images/avatars/7.png'
      },
      {
        id: '8',
        volunteerId: 'VOL008',
        volunteerName: 'Jennifer Martinez',
        age: 33,
        screeningDate: '2025-05-16',
        screeningFacility: 'Facility B',
        barcodeId: 'BAR008',
        sampleType: 'Saliva',
        collectedBy: 'Dr. Anderson',
        collectedOn: '2025-05-15',
        sentBy: 'admin@example.com',
        sentOn: '2025-05-16T13:10:00',
        status: 'sent',
        avatar: '/images/avatars/8.png'
      },
      {
        id: '9',
        volunteerId: 'VOL009',
        volunteerName: 'Christopher Taylor',
        age: 41,
        screeningDate: '2025-05-15',
        screeningFacility: 'Facility A',
        barcodeId: 'BAR009',
        sampleType: 'Blood',
        collectedBy: 'Dr. Thomas',
        collectedOn: '2025-05-14',
        sentBy: 'lab@example.com',
        sentOn: '2025-05-15T10:30:00',
        status: 'received',
        avatar: '/images/avatars/9.png'
      },
      {
        id: '10',
        volunteerId: 'VOL010',
        volunteerName: 'Lisa Garcia',
        age: 27,
        screeningDate: '2025-05-14',
        screeningFacility: 'Facility C',
        barcodeId: 'BAR010',
        sampleType: 'Urine',
        collectedBy: 'Dr. Robinson',
        collectedOn: '2025-05-13',
        sentBy: '',
        sentOn: '',
        status: 'pending',
        avatar: '/images/avatars/10.png'
      },
      {
        id: '11',
        volunteerId: 'VOL011',
        volunteerName: 'Daniel White',
        age: 36,
        screeningDate: '2025-05-13',
        screeningFacility: 'Facility B',
        barcodeId: 'BAR011',
        sampleType: 'Saliva',
        collectedBy: 'Dr. Lewis',
        collectedOn: '2025-05-12',
        sentBy: 'admin@example.com',
        sentOn: '2025-05-13T15:20:00',
        status: 'sent',
        avatar: '/images/avatars/11.png'
      },
      {
        id: '12',
        volunteerId: 'VOL012',
        volunteerName: 'Michelle Lee',
        age: 44,
        screeningDate: '2025-05-12',
        screeningFacility: 'Facility A',
        barcodeId: 'BAR012',
        sampleType: 'Blood',
        collectedBy: 'Dr. Walker',
        collectedOn: '2025-05-11',
        sentBy: 'lab@example.com',
        sentOn: '2025-05-12T10:15:00',
        status: 'received',
        avatar: '/images/avatars/12.png'
      },
      {
        id: '13',
        volunteerId: 'VOL013',
        volunteerName: 'James Clark',
        age: 32,
        screeningDate: '2025-05-11',
        screeningFacility: 'Facility C',
        barcodeId: 'BAR013',
        sampleType: 'Urine',
        collectedBy: 'Dr. Hall',
        collectedOn: '2025-05-10',
        sentBy: '',
        sentOn: '',
        status: 'pending',
        avatar: '/images/avatars/13.png'
      },
      {
        id: '14',
        volunteerId: 'VOL014',
        volunteerName: 'Amanda Scott',
        age: 28,
        screeningDate: '2025-05-10',
        screeningFacility: 'Facility B',
        barcodeId: 'BAR014',
        sampleType: 'Saliva',
        collectedBy: 'Dr. Young',
        collectedOn: '2025-05-09',
        sentBy: 'admin@example.com',
        sentOn: '2025-05-10T14:30:00',
        status: 'sent',
        avatar: '/images/avatars/14.png'
      },
      {
        id: '15',
        volunteerId: 'VOL015',
        volunteerName: 'Ryan King',
        age: 39,
        screeningDate: '2025-05-09',
        screeningFacility: 'Facility A',
        barcodeId: 'BAR015',
        sampleType: 'Blood',
        collectedBy: 'Dr. Allen',
        collectedOn: '2025-05-08',
        sentBy: 'lab@example.com',
        sentOn: '2025-05-09T11:45:00',
        status: 'received',
        avatar: '/images/avatars/15.png'
      }
    ]
    setSamples(dummySamples)
  }, [])

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelecteds = filteredSamples.map(n => n.id)
      setSelectedIds(newSelecteds)
      onSelectSamples(filteredSamples)
      return
    }
    setSelectedIds([])
    onSelectSamples([])
  }

  const handleSelect = (sample: Sample) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedIndex = selectedIds.indexOf(sample.id)
    let newSelected: string[] = []

    if (selectedIndex === -1) {
      newSelected = [...selectedIds, sample.id]
      onSelectSamples([...samples.filter(s => newSelected.includes(s.id))])
    } else {
      newSelected = selectedIds.filter(id => id !== sample.id)
      onSelectSamples(samples.filter(s => newSelected.includes(s.id)))
    }

    setSelectedIds(newSelected)
  }

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const filteredSamples = samples.filter(sample => {
    const matchesSearch =
      sample.volunteerId.toLowerCase().includes(searchText.toLowerCase()) ||
      sample.volunteerName.toLowerCase().includes(searchText.toLowerCase()) ||
      sample.barcodeId.toLowerCase().includes(searchText.toLowerCase())

    const matchesLab = !lab || sample.screeningFacility === lab

    return matchesSearch && matchesLab
  })

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'sent':
        return <Chip label='Sent' color='success' size='small' />
      case 'received':
        return <Chip label='Received' color='info' size='small' />
      default:
        return <Chip label='Pending' color='warning' size='small' />
    }
  }

  const emptyRows = rowsPerPage - Math.min(rowsPerPage, filteredSamples.length - page * rowsPerPage)

  return (
    <div className='space-y-4'>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Actions</TableCell>
              <TableCell padding='checkbox'>
                <Checkbox
                  indeterminate={selectedIds.length > 0 && selectedIds.length < filteredSamples.length}
                  checked={filteredSamples.length > 0 && selectedIds.length === filteredSamples.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell>Volunteer ID</TableCell>
              <TableCell>Volunteer Name</TableCell>
              <TableCell>Age</TableCell>
              <TableCell>Screening Date</TableCell>
              <TableCell>Screening Facility</TableCell>
              <TableCell>Barcode ID</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSamples.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(sample => (
              <TableRow key={sample.id} hover selected={selectedIds.includes(sample.id)}>
                <TableCell>
                  <OptionMenu
                    iconButtonProps={{ size: 'small' }}
                    iconClassName='text-textSecondary'
                    options={[
                      {
                        text: 'View Details',
                        icon: 'tabler-eye',
                        menuItemProps: {
                          onClick: () => {
                            // TODO: Implement view details logic
                            toast.info('View details clicked')
                          }
                        }
                      },
                      {
                        text: 'Edit Sample',
                        icon: 'tabler-edit',
                        menuItemProps: {
                          onClick: () => {
                            // TODO: Implement edit logic
                            toast.info('Edit clicked')
                          }
                        }
                      },
                      {
                        text: 'Delete Sample',
                        icon: 'tabler-trash',
                        menuItemProps: {
                          onClick: () => {
                            // TODO: Implement delete logic
                            toast.info('Delete clicked')
                          },
                          className: 'text-error'
                        }
                      }
                    ]}
                  />
                </TableCell>
                <TableCell padding='checkbox'>
                  <Checkbox checked={selectedIds.includes(sample.id)} onChange={handleSelect(sample)} />
                </TableCell>
                <TableCell>{sample.volunteerId}</TableCell>
                <TableCell>{sample.volunteerName}</TableCell>
                <TableCell>{sample.age}</TableCell>
                <TableCell>{sample.screeningDate}</TableCell>
                <TableCell>{sample.screeningFacility}</TableCell>
                <TableCell>{sample.barcodeId}</TableCell>
                <TableCell>{getStatusChip(sample.status)}</TableCell>
              </TableRow>
            ))}
            {emptyRows > 0 && (
              <TableRow style={{ height: 53 * emptyRows }}>
                <TableCell colSpan={9} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component='div'
        count={filteredSamples.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      <Dialog open={openSendDialog} onClose={() => setOpenSendDialog(false)}>
        <DialogTitle>Send Samples</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to send {selectedIds.length} sample(s) to the lab?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSendDialog(false)}>Cancel</Button>
          <Button
            onClick={() => {
              const selected = samples.filter(s => selectedIds.includes(s.id))
              onSendSamples(selected)
              setSelectedIds([])
              setOpenSendDialog(false)
              toast.success('Samples sent successfully')
            }}
            variant='contained'
            color='primary'
          >
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
