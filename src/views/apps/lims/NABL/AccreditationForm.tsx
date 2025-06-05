import { useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import { Delete, DragIndicator } from '@mui/icons-material'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'

interface Test {
  id: number
  name: string
  code: string
}

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: any) => void
  initialData?: any
  availableTests: Test[]
}

const AccreditationForm = ({ open, onClose, onSave, initialData, availableTests }: Props) => {
  const [formData, setFormData] = useState({
    fromDate: initialData?.fromDate || new Date(),
    toDate: initialData?.toDate || new Date(),
    accreditationType: initialData?.accreditationType || 'NABL',
    selectedTests: initialData?.tests || []
  })

  const [selectedTest, setSelectedTest] = useState<Test | null>(null)

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

  const handleRemoveTest = (testId: number) => {
    setFormData({
      ...formData,
      selectedTests: formData.selectedTests.filter(test => test.id !== testId)
    })
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

  const handleSave = () => {
    onSave({
      ...formData,
      testCount: formData.selectedTests.length
    })
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {initialData ? 'Edit Accreditation' : 'Add Accreditation'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <DatePicker
              label="From Date"
              value={formData.fromDate}
              onChange={(newValue) => setFormData({ ...formData, fromDate: newValue })}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <DatePicker
              label="To Date"
              value={formData.toDate}
              onChange={(newValue) => setFormData({ ...formData, toDate: newValue })}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Accreditation Type</InputLabel>
              <Select
                value={formData.accreditationType}
                onChange={(e) => setFormData({ ...formData, accreditationType: e.target.value })}
                label="Accreditation Type"
              >
                <MenuItem value="NABL">NABL</MenuItem>
                <MenuItem value="CAP">CAP</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Available Tests
            </Typography>
            <Paper sx={{ maxHeight: 400, overflow: 'auto' }}>
              <List>
                {availableTests.map((test) => (
                  <ListItem
                    key={test.id}
                    button
                    onClick={() => handleTestSelect(test)}
                    disabled={formData.selectedTests.some(t => t.id === test.id)}
                  >
                    <ListItemText
                      primary={test.name}
                      secondary={test.code}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Selected Tests
            </Typography>
            <Paper sx={{ maxHeight: 400, overflow: 'auto' }}>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="selectedTests">
                  {(provided) => (
                    <List {...provided.droppableProps} ref={provided.innerRef}>
                      {formData.selectedTests.map((test, index) => (
                        <Draggable key={test.id} draggableId={test.id.toString()} index={index}>
                          {(provided) => (
                            <ListItem
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <DragIndicator sx={{ mr: 1 }} />
                              <ListItemText
                                primary={test.testName}
                                secondary={`Added by: ${test.addedBy} on ${new Date(test.addedOn).toLocaleDateString()}`}
                              />
                              <ListItemSecondaryAction>
                                <IconButton
                                  edge="end"
                                  aria-label="delete"
                                  onClick={() => handleRemoveTest(test.id)}
                                >
                                  <Delete />
                                </IconButton>
                              </ListItemSecondaryAction>
                            </ListItem>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </List>
                  )}
                </Droppable>
              </DragDropContext>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AccreditationForm 