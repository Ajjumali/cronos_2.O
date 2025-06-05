'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Drawer from '@mui/material/Drawer'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography' 
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import CircularProgress from '@mui/material/CircularProgress'

// Type Imports
import type { SpeciesType } from '@/types/apps/limsTypes'

// Service Imports
import { toast } from 'react-toastify'
import ReasonInputDialog from '@/components/dialogs/ReasonInputDialog/ReasonInputDialog'

type Props = {
  open: boolean
  handleClose: () => void
  onDataChange?: () => void
  selectedSpecies: SpeciesType | null
}

const AddSpeciesDrawer = ({ open, handleClose, onDataChange, selectedSpecies }: Props) => {
  // States
  const [formData, setFormData] = useState<Partial<SpeciesType>>({
    speciesName: '',
    remarks: '',
    isActive: true
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isReasonDialogOpen, setIsReasonDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Reset form when drawer opens/closes or selected species changes
  useEffect(() => {
    if (open) {
      if (selectedSpecies) {
        setFormData({
          speciesName: selectedSpecies.speciesName,
          remarks: selectedSpecies.remarks || '',
          isActive: selectedSpecies.isActive
        })
      } else {
        setFormData({
          speciesName: '',
          remarks: '',
          isActive: true
        })
      }
    }
  }, [open, selectedSpecies])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (selectedSpecies) {
        setIsReasonDialogOpen(true)
      } else {
        const response = await fetch('/api/apps/lims/Species-master', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        })
        const result = await response.json()
        
        if (result.success) {
          toast.success(result.message)
          onDataChange?.()
          handleClose()
        } else {
          toast.error(result.message)
        }
      }
    } catch (error: any) {
      console.error('Error saving species:', error)
      toast.error(error.message || 'Failed to add species')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReasonSubmit = async (reason: string) => {
    setIsReasonDialogOpen(false)
    setIsSubmitting(true)

    try {
      if (selectedSpecies) {
        const response = await fetch(`/api/apps/lims/Species-master/${selectedSpecies.speciesId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...formData,
            reason
          })
        })
        const result = await response.json()
        
        if (result.success) {
          toast.success(result.message)
          onDataChange?.()
          handleClose()
        } else {
          toast.error(result.message)
        }
      }
    } catch (error: any) {
      console.error('Error updating species:', error)
      toast.error(error.message || 'Failed to update species')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: keyof SpeciesType) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      onClose={handleClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 400 } }
      }}
    >
      <Box className='p-6'>
        <div className='flex items-center justify-between mb-6'>
          <Typography variant='h5'>{selectedSpecies ? 'Edit Species' : 'Add New Species'}</Typography>
          <IconButton onClick={handleClose} disabled={isSubmitting}>
            <i className='tabler-x' />
          </IconButton>
        </div>

        <form onSubmit={handleSubmit} className='space-y-6'>
          <TextField
            fullWidth
            label='Species Name'
            value={formData.speciesName}
            onChange={handleChange('speciesName')}
            required
            disabled={isSubmitting}
          />

          <TextField
            fullWidth
            label='Remarks'
            value={formData.remarks}
            onChange={handleChange('remarks')}
            multiline
            rows={4}
            disabled={isSubmitting}
          />

          <div className='flex items-center justify-between pt-6 border-t mb-6'>
            <Button
              variant='tonal'
              color='error'
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              variant='contained'
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {isSubmitting ? 'Saving...' : selectedSpecies ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </Box>

      <ReasonInputDialog
        open={isReasonDialogOpen}
        handleClose={() => setIsReasonDialogOpen(false)}
        handleConfirm={handleReasonSubmit}
        title='Provide Reason for Update'
        description='Please provide a reason for updating this species.'
      />
    </Drawer>
  )
}

export default AddSpeciesDrawer 
