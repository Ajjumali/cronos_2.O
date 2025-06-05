import { useState } from 'react'
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Button,
  Typography
} from '@mui/material'
import { Add } from '@mui/icons-material'
import NablListTable from './NablListTable'
import AccreditationForm from './AccreditationForm'

// Mock data for available tests
const mockAvailableTests = [
  { id: 1, name: 'Blood Test', code: 'BT001' },
  { id: 2, name: 'Urine Test', code: 'UT001' },
  { id: 3, name: 'X-Ray', code: 'XR001' },
  { id: 4, name: 'MRI Scan', code: 'MS001' },
  { id: 5, name: 'CT Scan', code: 'CS001' }
]

const NABLPage = () => {
  const [accreditationData, setAccreditationData] = useState([])
  const [openForm, setOpenForm] = useState(false)
  const [selectedAccreditation, setSelectedAccreditation] = useState(null)

  const handleAddNew = () => {
    setSelectedAccreditation(null)
    setOpenForm(true)
  }

  const handleEdit = (accreditation) => {
    setSelectedAccreditation(accreditation)
    setOpenForm(true)
  }

  const handleSave = (data) => {
    if (selectedAccreditation) {
      // Update existing accreditation
      setAccreditationData(prevData =>
        prevData.map(item =>
          item.id === selectedAccreditation.id ? { ...data, id: item.id } : item
        )
      )
    } else {
      // Add new accreditation
      setAccreditationData(prevData => [...prevData, { ...data, id: Date.now() }])
    }
    setOpenForm(false)
    setSelectedAccreditation(null)
  }

  const handleDelete = (id) => {
    setAccreditationData(prevData => prevData.filter(item => item.id !== id))
  }

  const handleCopy = (accreditation) => {
    setSelectedAccreditation({
      ...accreditation,
      id: Date.now(),
      fromDate: new Date(),
      toDate: new Date()
    })
    setOpenForm(true)
  }

  return (
    <Box>
      <Card>
        <CardHeader
          title="NABL Accreditation Management"
          action={
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddNew}
            >
              Add Accreditation
            </Button>
          }
        />
        <CardContent>
          <NablListTable
            accreditationData={accreditationData}
            onDataChange={setAccreditationData}
          />
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