import { useState, useEffect } from 'react'
import { Box, Card, CardHeader, CardContent, Button } from '@mui/material'
import { Add } from '@mui/icons-material'
import NablListTable from './NablListTable'
import AccreditationForm from './AccreditationForm'
import { AccreditationDetail, Test } from '@/app/api/apps/lims/types'

// Mock data for available tests
const mockAvailableTests: Test[] = [
  { id: 1, name: 'Blood Test', code: 'BT001' },
  { id: 2, name: 'Urine Test', code: 'UT001' },
  { id: 3, name: 'X-Ray', code: 'XR001' },
  { id: 4, name: 'MRI Scan', code: 'MS001' },
  { id: 5, name: 'CT Scan', code: 'CS001' }
]

// Local mock data for accreditations (for demo; replace with API in real app)
const mockAccreditations: AccreditationDetail[] = [
  {
    id: 1,
    fromDate: '2024-01-01',
    toDate: '2024-12-31',
    testCount: 3,
    accreditationType: 'NABL',
    tests: [
      {
        id: 1,
        testName: 'Blood Test',
        addedBy: 'John Doe',
        addedOn: '2024-01-01',
        modifiedBy: 'John Doe',
        modifiedOn: '2024-01-01',
        remarks: 'Initial test'
      },
      {
        id: 2,
        testName: 'Urine Test',
        addedBy: 'John Doe',
        addedOn: '2024-01-01',
        modifiedBy: 'John Doe',
        modifiedOn: '2024-01-01',
        remarks: 'Initial test'
      },
      {
        id: 3,
        testName: 'X-Ray',
        addedBy: 'John Doe',
        addedOn: '2024-01-01',
        modifiedBy: 'John Doe',
        modifiedOn: '2024-01-01',
        remarks: 'Initial test'
      }
    ]
  }
]

const NABLPage = () => {
  const [accreditationData, setAccreditationData] = useState<AccreditationDetail[]>([])
  const [openForm, setOpenForm] = useState(false)
  const [selectedAccreditation, setSelectedAccreditation] = useState<AccreditationDetail | null>(null)

  // Simulate fetching data (replace with API call in real app)
  const fetchAccreditations = () => {
    setAccreditationData(mockAccreditations)
  }

  useEffect(() => {
    fetchAccreditations()
  }, [])

  const handleAddNew = () => {
    setSelectedAccreditation(null)
    setOpenForm(true)
  }

  const handleEdit = (accreditation: AccreditationDetail) => {
    setSelectedAccreditation(accreditation)
    setOpenForm(true)
  }

  const handleSave = (data: AccreditationDetail) => {
    if (selectedAccreditation) {
      // Update existing accreditation
      setAccreditationData(prevData =>
        prevData.map(item => (item.id === selectedAccreditation.id ? { ...data, id: item.id } : item))
      )
    } else {
      // Add new accreditation
      setAccreditationData(prevData => [...prevData, { ...data, id: Date.now() }])
    }
    setOpenForm(false)
    setSelectedAccreditation(null)
  }

  const handleDelete = (id: number) => {
    setAccreditationData(prevData => prevData.filter(item => item.id !== id))
  }

  const handleCopy = (accreditation: AccreditationDetail) => {
    setSelectedAccreditation({
      ...accreditation,
      id: Date.now(),
      fromDate: new Date().toISOString(),
      toDate: new Date().toISOString()
    })
    setOpenForm(true)
  }

  return (
    <Box>
      <Card>
        <CardHeader
          title='NABL Accreditation Management'
          action={
            <Button variant='contained' startIcon={<Add />} onClick={handleAddNew}>
              Add Accreditation
            </Button>
          }
        />
        <CardContent>
          <NablListTable accreditationData={accreditationData} onDataChange={fetchAccreditations} />
        </CardContent>
      </Card>

      <AccreditationForm
        open={openForm}
        onClose={() => {
          setOpenForm(false)
          setSelectedAccreditation(null)
        }}
        onSave={handleSave}
        initialData={selectedAccreditation}
        availableTests={mockAvailableTests}
      />
    </Box>
  )
}

export default NABLPage
