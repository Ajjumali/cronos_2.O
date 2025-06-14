// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

// Third-party Imports
import PerfectScrollbar from 'react-perfect-scrollbar'
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'react-toastify'

// Type Imports
import type { InstrumentType } from '@/types/apps/limsTypes'
import type { Category } from '@/types/apps/limsTypes'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import CustomAutocomplete from '@/@core/components/mui/Autocomplete'
import ReasonInputDialog from '@/components/dialogs/ReasonInputDialog/ReasonInputDialog'

// Add these interfaces at the top of the file, after the imports
interface APIResponse<T> {
  Result: T
  Status: string
}

interface LabTestCategoryDto {
  id: number
  name?: string
  categoryName?: string
  isActive?: boolean
}

type Props = {
  open: boolean
  handleClose: () => void
  onDataChange?: (instrument: InstrumentType) => void
  instrumentData?: InstrumentType[]
  selectedInstrument?: InstrumentType | null
}

type FormValidateType = {
  instrumentName: string
  instrumentSerialNumber: string
  ipAddress: string
  port: string
  categoryId: number | null
  nameToBePrinted: string
  remarks: string
  autoValidate: boolean
}

const AddInstrumentDrawer = (props: Props) => {
  const { open, handleClose, onDataChange, instrumentData = [], selectedInstrument } = props
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(true)
  const [categoryList, setCategoryList] = useState<Category[]>([])
  const [isReasonDialogOpen, setIsReasonDialogOpen] = useState(false)
  const [pendingFormData, setPendingFormData] = useState<FormValidateType | null>(null)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormValidateType>({
    defaultValues: {
      instrumentName: '',
      categoryId: 0,
      port: '',
      ipAddress: '',
      instrumentSerialNumber: '',
      nameToBePrinted: '',
      remarks: '',
      autoValidate: false
    }
  })

  // Reset form when drawer opens/closes or selectedInstrument changes
  useEffect(() => {
    if (open) {
      if (selectedInstrument) {
        // Set form values for edit mode
        reset({
          instrumentName: selectedInstrument.instrumentName,
          categoryId: selectedInstrument.categoryId,
          port: selectedInstrument.port || '',
          ipAddress: selectedInstrument.ipAddress || '',
          instrumentSerialNumber: selectedInstrument.instrumentSerialNumber || '',
          nameToBePrinted: selectedInstrument.nameToBePrinted || '',
          remarks: selectedInstrument.remarks || '',
          autoValidate: selectedInstrument.autoValidate
        })
        setIsActive(selectedInstrument.isActive)
      } else {
        // Reset form for add mode
        reset({
          instrumentName: '',
          categoryId: 0,
          port: '',
          ipAddress: '',
          instrumentSerialNumber: '',
          nameToBePrinted: '',
          remarks: '',
          autoValidate: false
        })
        setIsActive(true)
      }
      setError(null)
    }
  }, [open, selectedInstrument, reset])

  // Fetch categories when drawer opens
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/apps/lims/Test-categories', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          credentials: 'same-origin'
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('API Error Response:', errorText)
          throw new Error(`Failed to fetch categories: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        if (data && data.result) {
          setCategoryList(data.result)
        } else {
          throw new Error('Invalid response format')
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
        setError('Failed to load categories. Please try again later.')
      }
    }

    if (open) {
      fetchCategories()
    }
  }, [open])

  const onSubmit = async (formData: FormValidateType) => {
    if (selectedInstrument) {
      // For updates, show reason dialog first
      setPendingFormData(formData)
      setIsReasonDialogOpen(true)
    } else {
      // For new instruments, proceed with submission
      await submitForm(formData)
    }
  }

  const submitForm = async (formData: FormValidateType, reason?: string) => {
    try {
      setIsSubmitting(true)
      setError(null)

      const instrumentPayload: InstrumentType = {
        autoValidate: formData.autoValidate,
        categoryId: formData.categoryId || 0,
        categoryName: '',
        createdBy: 'System',
        createdOn: new Date().toISOString(),
        instrumentId: selectedInstrument?.instrumentId || 0,
        instrumentName: formData.instrumentName,
        instrumentSerialNumber: formData.instrumentSerialNumber,
        ipAddress: formData.ipAddress,
        isActive: isActive,
        nameToBePrinted: formData.nameToBePrinted,
        port: formData.port,
        remarks: formData.remarks,
        updatedBy: 'System',
        updatedOn: new Date().toISOString()
      }

      if (selectedInstrument) {
        const response = await fetch(`/api/apps/lims/Instrument-master/${selectedInstrument.instrumentId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ ...instrumentPayload, reason })
        })

        const responseData = await response.json()

        if (!response.ok) {
          throw new Error(responseData.error || 'Failed to update instrument')
        }

        toast.success(responseData.message || 'Record Updated successfully')
        onDataChange?.(responseData.data || instrumentPayload)
      } else {
        const response = await fetch('/api/apps/lims/Instrument-master', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(instrumentPayload)
        })

        const responseData = await response.json()

        if (!response.ok) {
          throw new Error(responseData.error || 'Failed to add instrument')
        }

        toast.success(responseData.message || 'Record created successfully!')
        onDataChange?.(responseData.data || instrumentPayload)
      }
      handleClose()
    } catch (error: any) {
      setError(error.message || 'Failed to save instrument. Please try again.')
      toast.error(error.message || 'Failed to save instrument. Please try again.')
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
          {selectedInstrument ? 'Edit Instrument' : 'Add New Instrument'}
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
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            <div className='space-y-4'>
              <Typography color='text.primary' className='font-medium'>
                Basic Information
              </Typography>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <Controller
                  name='instrumentName'
                  control={control}
                  rules={{ required: 'Instrument name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label='Instrument Name'
                      size='small'
                      placeholder='e.g., HPLC System'
                      error={!!errors.instrumentName}
                      helperText={errors.instrumentName?.message}
                      required
                    />
                  )}
                />

                <Controller
                  name='categoryId'
                  control={control}
                  rules={{ required: 'Category is required' }}
                  render={({ field }) => (
                    <CustomAutocomplete
                      options={categoryList}
                      getOptionLabel={option => option?.categoryName || ''}
                      isOptionEqualToValue={(option, value) => option?.id === value?.id}
                      value={categoryList.find(cat => cat.id === field.value) || null}
                      onChange={(_, newValue) => {
                        field.onChange(newValue?.id || null)
                      }}
                      renderInput={params => (
                        <TextField
                          {...params}
                          label='Category'
                          size='small'
                          placeholder='Select Category'
                          error={!!errors.categoryId}
                          helperText={errors.categoryId?.message}
                          required
                        />
                      )}
                      noOptionsText='No categories found'
                    />
                  )}
                />
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <Controller
                  name='instrumentSerialNumber'
                  control={control}
                  rules={{ required: 'Serial number is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label='Serial Number'
                      size='small'
                      placeholder='e.g., SN123456'
                      error={!!errors.instrumentSerialNumber}
                      helperText={errors.instrumentSerialNumber?.message}
                      required
                    />
                  )}
                />

                <Controller
                  name='nameToBePrinted'
                  control={control}
                  rules={{ required: 'Print name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label='Name to be Printed'
                      size='small'
                      placeholder='e.g., HPLC-001'
                      error={!!errors.nameToBePrinted}
                      helperText={errors.nameToBePrinted?.message}
                      required
                    />
                  )}
                />
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <Controller
                  name='ipAddress'
                  control={control}
                  rules={{ required: 'IP address is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label='IP Address'
                      size='small'
                      placeholder='e.g., 192.168.1.1'
                      error={!!errors.ipAddress}
                      helperText={errors.ipAddress?.message}
                      required
                    />
                  )}
                />

                <Controller
                  name='port'
                  control={control}
                  rules={{ required: 'Port is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label='Port'
                      size='small'
                      placeholder='e.g., 8080'
                      error={!!errors.port}
                      helperText={errors.port?.message}
                      required
                    />
                  )}
                />
              </div>

              <div className='space-y-4'>
                <Controller
                  name='remarks'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      multiline
                      rows={3}
                      label='Remarks'
                      size='small'
                      placeholder='Additional notes about the instrument'
                    />
                  )}
                />
              </div>
            </div>

            <div className='flex items-center justify-between pt-6 border-t mb-6'>
              <Button variant='tonal' color='error' onClick={handleReset} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type='submit'
                variant='contained'
                disabled={isSubmitting}
                startIcon={isSubmitting ? <i className='tabler-loader animate-spin' /> : null}
              >
                {isSubmitting ? 'Saving...' : selectedInstrument ? 'Update' : 'Add'}
              </Button>
            </div>
          </form>
        </div>
      </PerfectScrollbar>

      <ReasonInputDialog
        open={isReasonDialogOpen}
        handleClose={() => {
          setIsReasonDialogOpen(false)
          setPendingFormData(null)
        }}
        handleConfirm={handleReasonSubmit}
        title='Provide Reason for Update'
        description='Please provide a reason for updating this instrument:'
      />
    </Drawer>
  )
}

export default AddInstrumentDrawer
