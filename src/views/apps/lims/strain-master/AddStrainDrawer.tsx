// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'

// Third-party Imports
import PerfectScrollbar from 'react-perfect-scrollbar'
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'react-toastify'

// Type Imports
import type { StrainType } from '@/types/apps/limsTypes'

// Service Imports
import { strainService } from '@/app/api/apps/lims/Strain-master/route'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import ReasonInputDialog from '@/components/dialogs/ReasonInputDialog/ReasonInputDialog'
import { Box, TextField } from '@mui/material'

type Props = {
  open: boolean
  handleClose: () => void
  onDataChange?: () => void
  selectedStrain?: StrainType | null
}

type FormValidateType = {
  strainName: string
  remarks: string
  isActive: boolean
}

const AddStrainDrawer = (props: Props) => {
  const { open, handleClose, onDataChange, selectedStrain } = props
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(true)
  const [isReasonDialogOpen, setIsReasonDialogOpen] = useState(false)
  const [pendingFormData, setPendingFormData] = useState<FormValidateType | null>(null)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormValidateType>({
    defaultValues: {
      strainName: '',
      remarks: '',
      isActive: true
    }
  })

  // Reset form when drawer opens/closes or selectedStrain changes
  useEffect(() => {
    if (open) {
      if (selectedStrain) {
        // Set form values for edit mode
        reset({
          strainName: selectedStrain.strainName,
          remarks: selectedStrain.remarks,
          isActive: selectedStrain.isActive
        })
        setIsActive(selectedStrain.isActive)
      } else {
        // Reset form for add mode
        reset({
          strainName: '',
          remarks: '',
          isActive: true
        })
        setIsActive(true)
      }
      setError(null)
    }
  }, [open, selectedStrain, reset])

  const onSubmit = async (formData: FormValidateType) => {
    if (selectedStrain) {
      // For updates, show reason dialog first
      setPendingFormData(formData)
      setIsReasonDialogOpen(true)
    } else {
      // For new strains, proceed with submission
      await submitForm(formData)
    }
  }

  const submitForm = async (formData: FormValidateType, reason?: string) => {
    try {
      setIsSubmitting(true)
      setError(null)

      const strainPayload: StrainType = {
        strainId: selectedStrain?.strainId || 0,
        strainName: formData.strainName,
        remarks: formData.remarks,
        isActive: isActive,
        createdBy: 'System',
        createdOn: new Date().toISOString(),
        updatedBy: 'System',
        updatedOn: new Date().toISOString()
      }

      if (selectedStrain) {
        await strainService.updateStrain(selectedStrain.strainId, { ...strainPayload, reason })
        toast.success('Record Updated successfully')
      } else {
        await strainService.addStrain(strainPayload)
        toast.success('Record created successfully')
      }
      onDataChange?.()
      handleClose()
    } catch (error) {
      setError('Failed to save strain. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReasonSubmit = (reason: string) => {
    if (pendingFormData) {
      submitForm(pendingFormData, reason)
    }
    setIsReasonDialogOpen(false)
    setPendingFormData(null)
  }

  const handleReset = () => {
    handleClose()
    reset()
    setIsActive(true)
    setError(null)
    setIsSubmitting(false)
    setIsReasonDialogOpen(false)
    setPendingFormData(null)
  }

  function handleChange(arg0: string) {
    throw new Error('Function not implemented.')
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
            <Typography variant='h5'>{selectedStrain ? 'Edit Strain' : 'Add New Strain'}</Typography>
            <IconButton onClick={handleClose}>
              <i className='tabler-x' />
            </IconButton>
          </div>
  
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            <TextField
              fullWidth
              label='Strain Name'
              value={control._defaultValues.strainName}
              onChange={(e) => reset({ ...control._defaultValues, strainName: e.target.value })}
              required
            />
  
            <TextField
              fullWidth
              label='Remarks'
              value={control._defaultValues.remarks}
              onChange={(e) => reset({ ...control._defaultValues, remarks: e.target.value })}
              multiline
              rows={4}
            />
  
            
          <div className='flex items-center justify-between pt-6 border-t mb-6'>
              <Button
                variant='tonal'
                color='error'
                onClick={handleReset}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                variant='contained'
                disabled={isSubmitting}
                startIcon={isSubmitting ? <i className='tabler-loader animate-spin' /> : null}
              >
                {isSubmitting ? 'Saving...' : selectedStrain ? 'Update' : 'Add'}
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

export default AddStrainDrawer 
