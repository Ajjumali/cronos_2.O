import React, { useState, useEffect } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Checkbox from '@mui/material/Checkbox'
import Paper from '@mui/material/Paper'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import { toast } from 'react-toastify'

type TestType = {
  id: number
  testName: string
  analyteCode: string
  instrumentName: string
  sampleType: string
  isActive: boolean
}

interface TestSelectionDialogProps {
  open: boolean
  onClose: () => void
  tests: TestType[]
  selectedTests: TestType[]
  onSave: (selectedTests: TestType[]) => void
}

const TestSelectionDialog: React.FC<TestSelectionDialogProps> = ({
  open,
  onClose,
  tests,
  selectedTests,
  onSave
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [localSelectedTests, setLocalSelectedTests] = useState<TestType[]>(selectedTests)

  useEffect(() => {
    setLocalSelectedTests(selectedTests)
  }, [selectedTests])

  const filteredTests = tests.filter(test =>
    test.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    test.analyteCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    test.instrumentName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleToggleTest = (test: TestType) => {
    const currentIndex = localSelectedTests.findIndex(t => t.id === test.id)
    const newSelectedTests = [...localSelectedTests]

    if (currentIndex === -1) {
      newSelectedTests.push(test)
    } else {
      newSelectedTests.splice(currentIndex, 1)
    }

    setLocalSelectedTests(newSelectedTests)
  }

  const handleSave = () => {
    if (localSelectedTests.length === 0) {
      toast.error('Please select at least one test')
      return
    }
    onSave(localSelectedTests)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Select Tests</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          margin="normal"
          placeholder="Search tests..."
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
        <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 400 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" />
                <TableCell>Test Name</TableCell>
                <TableCell>Analyte Code</TableCell>
                <TableCell>Instrument</TableCell>
                <TableCell>Sample Type</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTests.map((test) => (
                <TableRow
                  key={test.id}
                  hover
                  onClick={() => handleToggleTest(test)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={localSelectedTests.some(t => t.id === test.id)}
                    />
                  </TableCell>
                  <TableCell>{test.testName}</TableCell>
                  <TableCell>{test.analyteCode}</TableCell>
                  <TableCell>{test.instrumentName}</TableCell>
                  <TableCell>{test.sampleType}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save ({localSelectedTests.length} selected)
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default TestSelectionDialog 