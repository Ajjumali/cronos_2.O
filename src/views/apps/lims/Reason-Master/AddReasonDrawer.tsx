import { useState, useEffect } from 'react'
import Drawer from '@mui/material/Drawer'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Switch from '@mui/material/Switch'
import Box from '@mui/material/Box'
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'react-toastify'
import ReasonInputDialog from '@/components/dialogs/ReasonInputDialog/ReasonInputDialog'
import MenuItem from '@mui/material/MenuItem'

import type { ReasonType } from '@/types/apps/limsTypes'

interface Props {
  open: boolean
  handleClose: () => void
  onDataChange?: (reason: ReasonType) => void
  reasonData?: ReasonType[]
  selectedReason?: ReasonType | null
}

type FormValidateType = {
  reasonName: string
  isActive: boolean
  operationId: number
}

const OPERATION_OPTIONS = [
  { value: 1, label: 'Create' },
  { value: 2, label: 'Update' },
  { value: 3, label: 'Delete' },
  { value: 4, label: 'Approve' },
  { value: 5, label: 'Reject' }
]

const AddReasonDrawer = (props: Props) => {
  const { open, handleClose, onDataChange, selectedReason } = props
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
      reasonName: '',
      isActive: true,
      operationId: 0
    }
  })

  useEffect(() => {
    if (open) {
      if (selectedReason) {
        reset({
          reasonName: selectedReason.reasonName,
          isActive: selectedReason.isActive === 'true',
          operationId: selectedReason.operationId
        })
        setIsActive(selectedReason.isActive === 'true')
      } else {
        reset({
          reasonName: '',
          isActive: true,
          operationId: 0
        })
        setIsActive(true)
      }
      setError(null)
    }
  }, [open, selectedReason, reset])

  const onSubmit = async (formData: FormValidateType) => {
    setPendingFormData(formData)
    setIsReasonDialogOpen(true)
  }

  const submitForm = async (formData: FormValidateType, reason?: string) => {
    try {
      setIsSubmitting(true)
      setError(null)
      const now = new Date().toISOString()
      const reasonPayload: ReasonType = {
        reasonId: selectedReason?.reasonId || 0,
        reasonName: formData.reasonName,
        isActive: formData.isActive ? 'true' : 'false',
        operationId: formData.operationId,
        timezoneId: 0,
        createOn: selectedReason ? selectedReason.createOn : now,
        createdBy: '',
        updatedOn: now,
        updatedBy: ''
      }
      onDataChange?.(reasonPayload)
      toast.success(selectedReason ? 'Record updated successfully!' : 'Record created successfully!')
      handleClose()
    } catch (error: any) {
      setError(error.message || 'Failed to save reason. Please try again.')
      toast.error(error.message || 'Failed to save reason. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReasonSubmit = (reason: string) => {
    if (!reason.trim()) {
      toast.error('Please provide a reason')
      return
    }
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
      sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 400 }, maxWidth: '100vw' } }}
    >
      <div className='flex items-center justify-between plb-5 pli-6 border-be'>
        <Typography variant='h5' className='font-medium'>
          {selectedReason ? 'Edit Reason' : 'Add New Reason'}
        </Typography>
        <IconButton size='small' onClick={handleReset}>
          <i className='tabler-x text-xl' />
        </IconButton>
      </div>
      <Divider />
      <Box p={4}>
        {error && (
          <div className='mb-6 p-4 bg-error/10 text-error rounded'>
            <Typography>{error}</Typography>
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
          <div className='space-y-4'>
            <Typography color='text.primary' className='font-medium'>Basic Information</Typography>
            <Controller
              name='reasonName'
              control={control}
              rules={{ required: 'Reason name is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Reason Name'
                  size='small'
                  placeholder='e.g., Correction, Update, etc.'
                  error={!!errors.reasonName}
                  helperText={errors.reasonName?.message}
                  required
                />
              )}
            />
            <Controller
              name='operationId'
              control={control}
              rules={{ required: 'Operation ID is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  label='Operation'
                  size='small'
                  error={!!errors.operationId}
                  helperText={errors.operationId?.message}
                  required
                >
                  <MenuItem value=''>Select Operation</MenuItem>
                  {OPERATION_OPTIONS.map(option => (
                    <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                  ))}
                </TextField>
              )}
            />
            <Box display='flex' alignItems='center' gap={2}>
              <Typography>Status</Typography>
              <Controller
                name='isActive'
                control={control}
                render={({ field }) => (
                  <Switch
                    {...field}
                    checked={field.value}
                    onChange={e => field.onChange(e.target.checked)}
                  />
                )}
              />
              <Typography>{isActive ? 'Active' : 'Inactive'}</Typography>
            </Box>
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
              {isSubmitting ? 'Saving...' : selectedReason ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </Box>
      <ReasonInputDialog
        open={isReasonDialogOpen}
        handleClose={() => {
          setIsReasonDialogOpen(false)
          setPendingFormData(null)
        }}
        handleConfirm={handleReasonSubmit}
        title='Provide Reason for Update'
        description='Please enter a reason for this action.'
      />
    </Drawer>
  )
}

export default AddReasonDrawer
