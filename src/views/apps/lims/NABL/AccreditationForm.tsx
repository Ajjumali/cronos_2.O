import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface AccreditationFormProps {
  onNavigateToList?: () => void
  formParams?: {
    id?: string
    copyData?: string
    isEdit?: boolean
    isCopy?: boolean
  }
}
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  CircularProgress,
  Checkbox,
  FormControlLabel
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { Delete, DragIndicator, ArrowBack } from '@mui/icons-material'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { nablService } from '@/app/api/apps/lims/NABL/service'
import { AccreditationDetail } from '@/app/api/apps/lims/types'

interface Test {
  id: number
  name: string
  code: string
}

const AccreditationForm = ({ onNavigateToList, formParams }: AccreditationFormProps = {}) => {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Use formParams if provided (SPA mode), otherwise use URL params (direct navigation)
  const id = formParams?.id || searchParams.get('id')
  const copyData = formParams?.copyData || searchParams.get('data')
  const isEditMode = !!id
  const isCopyMode = !!copyData

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [availableTests, setAvailableTests] = useState<Test[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSearchTerm, setSelectedSearchTerm] = useState('')
  const [selectedCheckboxes, setSelectedCheckboxes] = useState<number[]>([])
  const [selectedTestsCheckboxes, setSelectedTestsCheckboxes] = useState<number[]>([])
  const [formData, setFormData] = useState({
    fromDate: new Date(),
    toDate: new Date(),
    accreditationType: 'NABL',
    selectedTests: [] as Array<{
      id: number
      testName: string
      addedBy: string
      addedOn: Date
      modifiedBy: string
      modifiedOn: Date
      remarks: string
    }>
  })

  // Mock available tests - replace with actual API call
  useEffect(() => {
    setAvailableTests([
      { id: 1, name: 'Blood Test', code: 'BT001' },
      { id: 2, name: 'Urine Test', code: 'UT001' },
      { id: 3, name: 'X-Ray', code: 'XR001' },
      { id: 4, name: 'ECG', code: 'EC001' },
      { id: 5, name: 'MRI Scan', code: 'MR001' }
    ])
  }, [])

  // Load existing data if in edit mode or copy mode
  useEffect(() => {
    if (isEditMode && id) {
      loadAccreditationData()
    } else if (isCopyMode && copyData) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(copyData))
        setFormData({
          fromDate: new Date(parsedData.fromDate),
          toDate: new Date(parsedData.toDate),
          accreditationType: parsedData.accreditationType,
          selectedTests: parsedData.tests.map((test: any) => ({
            ...test,
            addedOn: new Date(test.addedOn),
            modifiedOn: new Date(test.modifiedOn)
          }))
        })
      } catch (error) {
        console.error('Error parsing copy data:', error)
      }
    }
  }, [id, isEditMode, copyData, isCopyMode])

  const loadAccreditationData = async () => {
    try {
      setLoading(true)
      if (id) {
        const data = await nablService.getAccreditationById(parseInt(id))
        if (data) {
          setFormData({
            fromDate: new Date(data.fromDate),
            toDate: new Date(data.toDate),
            accreditationType: data.accreditationType,
            selectedTests: data.tests.map(test => ({
              ...test,
              addedOn: new Date(test.addedOn),
              modifiedOn: new Date(test.modifiedOn)
            }))
          })
        }
      }
    } catch (error) {
      console.error('Error loading accreditation data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTestSelect = (test: Test) => {
    if (!formData.selectedTests.find(t => t.id === test.id)) {
      setFormData({
        ...formData,
        selectedTests: [
          ...formData.selectedTests,
          {
            id: test.id,
            testName: test.name,
            addedBy: 'Current User', // Replace with actual user
            addedOn: new Date(),
            modifiedBy: 'Current User', // Replace with actual user
            modifiedOn: new Date(),
            remarks: ''
          }
        ]
      })
    }
  }

  const handleSelectAll = () => {
    const testsToAdd = filteredAvailableTests.filter(test => !formData.selectedTests.find(t => t.id === test.id))

    if (testsToAdd.length > 0) {
      const newTests = testsToAdd.map(test => ({
        id: test.id,
        testName: test.name,
        addedBy: 'Current User', // Replace with actual user
        addedOn: new Date(),
        modifiedBy: 'Current User', // Replace with actual user
        modifiedOn: new Date(),
        remarks: ''
      }))

      setFormData({
        ...formData,
        selectedTests: [...formData.selectedTests, ...newTests]
      })
    }
  }

  const handleSelectMultiple = (selectedTestIds: number[]) => {
    const testsToAdd = filteredAvailableTests.filter(
      test => selectedTestIds.includes(test.id) && !formData.selectedTests.find(t => t.id === test.id)
    )

    if (testsToAdd.length > 0) {
      const newTests = testsToAdd.map(test => ({
        id: test.id,
        testName: test.name,
        addedBy: 'Current User', // Replace with actual user
        addedOn: new Date(),
        modifiedBy: 'Current User', // Replace with actual user
        modifiedOn: new Date(),
        remarks: ''
      }))

      setFormData({
        ...formData,
        selectedTests: [...formData.selectedTests, ...newTests]
      })
    }
  }

  const handleCheckboxChange = (testId: number) => {
    setSelectedCheckboxes(prev => (prev.includes(testId) ? prev.filter(id => id !== testId) : [...prev, testId]))
  }

  const handleSelectAllCheckboxes = () => {
    const availableTestIds = filteredAvailableTests
      .filter(test => !formData.selectedTests.find(t => t.id === test.id))
      .map(test => test.id)

    setSelectedCheckboxes(availableTestIds)
  }

  const handleClearAllCheckboxes = () => {
    setSelectedCheckboxes([])
  }

  const handleAddSelected = () => {
    handleSelectMultiple(selectedCheckboxes)
    setSelectedCheckboxes([])
  }

  const handleRemoveTest = (testId: number) => {
    setFormData({
      ...formData,
      selectedTests: formData.selectedTests.filter(test => test.id !== testId)
    })
  }

  const handleSelectedTestCheckboxChange = (testId: number) => {
    setSelectedTestsCheckboxes(prev => (prev.includes(testId) ? prev.filter(id => id !== testId) : [...prev, testId]))
  }

  const handleSelectAllSelectedTests = () => {
    const selectedTestIds = filteredSelectedTests.map(test => test.id)
    setSelectedTestsCheckboxes(selectedTestIds)
  }

  const handleClearAllSelectedTests = () => {
    setSelectedTestsCheckboxes([])
  }

  const handleDeleteSelectedTests = () => {
    setFormData({
      ...formData,
      selectedTests: formData.selectedTests.filter(test => !selectedTestsCheckboxes.includes(test.id))
    })
    setSelectedTestsCheckboxes([])
  }

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(formData.selectedTests)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setFormData({
      ...formData,
      selectedTests: items
    })
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const saveData = {
        fromDate: formData.fromDate.toISOString(),
        toDate: formData.toDate.toISOString(),
        accreditationType: formData.accreditationType as 'NABL' | 'CAP',
        testCount: formData.selectedTests.length,
        tests: formData.selectedTests.map(test => ({
          ...test,
          addedOn: test.addedOn.toISOString(),
          modifiedOn: test.modifiedOn.toISOString()
        }))
      }

      if (isEditMode && id) {
        await nablService.updateAccreditation({ ...saveData, id: parseInt(id) })
      } else {
        await nablService.createAccreditation(saveData)
      }

      if (onNavigateToList) {
        onNavigateToList()
      } else {
        router.push('/apps/lims/NABL')
      }
    } catch (error) {
      console.error('Error saving accreditation:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (onNavigateToList) {
      onNavigateToList()
    } else {
      router.push('/apps/lims/NABL')
    }
  }

  // Filter available tests based on search term
  const filteredAvailableTests = availableTests.filter(
    test =>
      test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Filter selected tests based on search term
  const filteredSelectedTests = formData.selectedTests.filter(
    test =>
      test.testName.toLowerCase().includes(selectedSearchTerm.toLowerCase()) ||
      test.addedBy.toLowerCase().includes(selectedSearchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Button startIcon={<ArrowBack />} onClick={handleCancel} sx={{ mr: 2 }}>
                Back
              </Button>
              <Typography variant='h5'>
                {isEditMode
                  ? 'Edit NABL Accreditation'
                  : isCopyMode
                    ? 'Copy NABL Accreditation'
                    : 'Add New NABL Accreditation'}
              </Typography>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label='From Date'
                  value={formData.fromDate}
                  onChange={(newValue: Date | null) => setFormData({ ...formData, fromDate: newValue || new Date() })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label='To Date'
                  value={formData.toDate}
                  onChange={(newValue: Date | null) => setFormData({ ...formData, toDate: newValue || new Date() })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Accreditation Type</InputLabel>
                  <Select
                    value={formData.accreditationType}
                    onChange={e => setFormData({ ...formData, accreditationType: e.target.value })}
                    label='Accreditation Type'
                  >
                    <MenuItem value='NABL'>NABL</MenuItem>
                    <MenuItem value='CAP'>CAP</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant='h6' gutterBottom>
                  Available Tests
                </Typography>
                <TextField
                  fullWidth
                  placeholder='Search tests by name or code...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  sx={{ mb: 2 }}
                  size='small'
                />
                <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    size='small'
                    variant='outlined'
                    onClick={handleSelectAllCheckboxes}
                    disabled={
                      filteredAvailableTests.filter(test => !formData.selectedTests.find(t => t.id === test.id))
                        .length === 0
                    }
                  >
                    Select All
                  </Button>
                  <Button
                    size='small'
                    variant='outlined'
                    onClick={handleClearAllCheckboxes}
                    disabled={selectedCheckboxes.length === 0}
                  >
                    Clear All
                  </Button>
                  <Button
                    size='small'
                    variant='contained'
                    onClick={handleAddSelected}
                    disabled={selectedCheckboxes.length === 0}
                  >
                    Add Selected ({selectedCheckboxes.length})
                  </Button>
                </Box>
                <Paper sx={{ maxHeight: 400, overflow: 'auto' }}>
                  <List>
                    {filteredAvailableTests.map((test: Test) => {
                      const isAlreadySelected = formData.selectedTests.some(t => t.id === test.id)
                      const isCheckboxSelected = selectedCheckboxes.includes(test.id)

                      return (
                        <ListItem
                          key={test.id}
                          sx={{
                            width: '100%',
                            textAlign: 'left',
                            '&:hover': { backgroundColor: 'action.hover' },
                            '&:disabled': { opacity: 0.5 }
                          }}
                        >
                          <Checkbox
                            checked={isCheckboxSelected}
                            onChange={() => handleCheckboxChange(test.id)}
                            disabled={isAlreadySelected}
                            onClick={e => e.stopPropagation()}
                          />
                          <ListItemText
                            primary={test.name}
                            secondary={test.code}
                            sx={{
                              cursor: 'pointer',
                              opacity: isAlreadySelected ? 0.5 : 1
                            }}
                            onClick={() => !isAlreadySelected && handleTestSelect(test)}
                          />
                        </ListItem>
                      )
                    })}
                  </List>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant='h6' gutterBottom>
                  Selected Tests ({formData.selectedTests.length})
                </Typography>
                <TextField
                  fullWidth
                  placeholder='Search selected tests by name or added by...'
                  value={selectedSearchTerm}
                  onChange={e => setSelectedSearchTerm(e.target.value)}
                  sx={{ mb: 2 }}
                  size='small'
                />
                <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    size='small'
                    variant='outlined'
                    onClick={handleSelectAllSelectedTests}
                    disabled={filteredSelectedTests.length === 0}
                  >
                    Select All
                  </Button>
                  <Button
                    size='small'
                    variant='outlined'
                    onClick={handleClearAllSelectedTests}
                    disabled={selectedTestsCheckboxes.length === 0}
                  >
                    Clear All
                  </Button>
                  <Button
                    size='small'
                    variant='contained'
                    color='error'
                    onClick={handleDeleteSelectedTests}
                    disabled={selectedTestsCheckboxes.length === 0}
                  >
                    Delete Selected ({selectedTestsCheckboxes.length})
                  </Button>
                </Box>
                <Paper sx={{ maxHeight: 400, overflow: 'auto' }}>
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId='selectedTests'>
                      {provided => (
                        <List {...provided.droppableProps} ref={provided.innerRef}>
                          {filteredSelectedTests.map((test: any, index: number) => {
                            const isCheckboxSelected = selectedTestsCheckboxes.includes(test.id)

                            return (
                              <Draggable key={test.id} draggableId={test.id.toString()} index={index}>
                                {provided => (
                                  <ListItem
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                  >
                                    <Checkbox
                                      checked={isCheckboxSelected}
                                      onChange={() => handleSelectedTestCheckboxChange(test.id)}
                                      onClick={e => e.stopPropagation()}
                                    />
                                    <DragIndicator sx={{ mr: 1 }} />
                                    <ListItemText
                                      primary={test.testName}
                                      secondary={`Added by: ${test.addedBy} on ${test.addedOn.toLocaleDateString()}`}
                                    />
                                    <IconButton
                                      edge='end'
                                      aria-label='delete'
                                      onClick={() => handleRemoveTest(test.id)}
                                    >
                                      <Delete />
                                    </IconButton>
                                  </ListItem>
                                )}
                              </Draggable>
                            )
                          })}
                          {provided.placeholder}
                        </List>
                      )}
                    </Droppable>
                  </DragDropContext>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button onClick={handleCancel} variant='outlined'>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} variant='contained' color='primary' disabled={saving}>
                    {saving ? <CircularProgress size={20} /> : 'Save'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </LocalizationProvider>
  )
}

export default AccreditationForm
