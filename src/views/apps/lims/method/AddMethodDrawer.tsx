'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

// Third-party Imports
import PerfectScrollbar from 'react-perfect-scrollbar'
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'react-toastify'

// Type Imports
import type { MethodType } from '@/types/apps/limsTypes'

// Service Imports
import { methodService } from '@/app/api/apps/lims/method/route'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

type FormValidateType = {
  methodName: string
  description: string
  isActive: boolean
}

type Props = {
  open: boolean
  handleClose: () => void
  onDataChange?: (method: MethodType) => void
  methodData?: MethodType[]
  selectedMethod?: MethodType | null
}

const AddMethodDrawer = (props: Props) => {
  const { open, handleClose, onDataChange, methodData = [], selectedMethod } = props
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(true)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormValidateType>({
    defaultValues: {
      methodName: '',
      description: '',
      isActive: true
    }
  })

  // Reset form when drawer opens/closes or selectedMethod changes
  useEffect(() => {
    if (open) {
      if (selectedMethod) {
        // Set form values for edit mode
        reset({
          methodName: selectedMethod.methodName,
          description: selectedMethod.description || '',
          isActive: selectedMethod.isActive
        })
        setIsActive(selectedMethod.isActive)
      } else {
        // Reset form for add mode
        reset({
          methodName: '',
          description: '',
          isActive: true
        })
        setIsActive(true)
      }
      setError(null)
    }
  }, [open, selectedMethod, reset])

  const onSubmit = async (formData: FormValidateType) => {
    setIsSubmitting(true)
    setError(null)

    try {
      if (selectedMethod) {
        // Update existing method
        const updatedMethod = {
          ...selectedMethod,
          ...formData
        }
        onDataChange?.(updatedMethod)
      } else {
        // Create new method
        const newMethod = {
          methodId: 0, // This will be set by the backend
          ...formData,
          updatedBy: 'System', // This should be replaced with actual user
          updatedOn: new Date().toISOString()
        }
        onDataChange?.(newMethod as MethodType)
      }
      handleClose()
    } catch (error) {
      console.error('Error saving method:', error)
      setError('Failed to save method. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    reset()
    handleClose()
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={handleReset}
      ModalProps={{ keepMounted: true }}
      sx={{ 
        '& .MuiDrawer-paper': { 
          width: { xs: '100%', sm: 500 },
          maxWidth: '100vw'
        } 
      }}
    >
      <div className='flex items-center justify-between plb-5 pli-6 border-be'>
        <Typography variant='h5' className='font-medium'>
          {selectedMethod ? 'Edit Test Method' : 'Add New Test Method'}
        </Typography>
        <IconButton size='small' onClick={handleReset}>
          <i className='tabler-x text-xl' />
        </IconButton>
      </div>
      <PerfectScrollbar options={{ wheelPropagation: false }}>
        <div className='p-6'>
          {error && (
            <div className='mb-6 p-4 bg-error/10 text-error rounded'>
              <Typography>{error}</Typography>
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className='flex flex-col gap-6'>
              <Controller
                name='methodName'
                control={control}
                rules={{ required: 'Method name is required' }}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    label='Method Name'
                    placeholder='Enter method name'
                    error={Boolean(errors.methodName)}
                    helperText={errors.methodName?.message}
                    required
                  />
                )}
              />

              <Controller
                name='description'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    label='Description'
                    placeholder='Enter method description'
                    multiline
                    rows={4}
                    error={Boolean(errors.description)}
                    helperText={errors.description?.message}
                  />
                )}
              />

              <div className='flex items-center justify-between'>
                <Typography>Status</Typography>
                <Controller
                  name='isActive'
                  control={control}
                  render={({ field }) => (
                    <Switch
                      {...field}
                      checked={field.value}
                      onChange={e => {
                        field.onChange(e.target.checked)
                        setIsActive(e.target.checked)
                      }}
                    />
                  )}
                />
              </div>
            </div>

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
                {isSubmitting ? 'Saving...' : selectedMethod ? 'Update' : 'Add'}
              </Button>
            </div>
          </form>
        </div>
      </PerfectScrollbar>
    </Drawer>
  )
}

export default AddMethodDrawer
