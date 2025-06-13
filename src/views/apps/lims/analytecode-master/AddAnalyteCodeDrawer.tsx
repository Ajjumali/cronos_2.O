import { useState, useEffect } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'

// Third-party Imports
import PerfectScrollbar from 'react-perfect-scrollbar'
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'react-toastify'

// Type Imports
import type { AnalyteCodeType } from '@/types/apps/limsTypes'
import type { InstrumentType } from '@/types/apps/limsTypes'
import type { SampleType } from '@/types/apps/limsTypes'
import type { TestType } from '@/types/apps/limsTypes'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import CustomAutocomplete from '@/@core/components/mui/Autocomplete'
import UpdateReasonDialog from '@/components/dialogs/UpdateReasonDialog/UpdateReasonDialog'

type Props = {
  open: boolean
  handleClose: () => void
  onDataChange?: () => void
  analyteCodeData?: AnalyteCodeType[]
  selectedAnalyteCode?: AnalyteCodeType | null
}

type FormValidateType = {
  analyteName: string
  analyteCode: string
  instrumentId: number | null
  sampleTypeId: number | null
  testId: number | null
  remark: string
  isActive: boolean
}

const AddAnalyteCodeDrawer = (props: Props) => {
  const { open, handleClose, onDataChange, analyteCodeData = [], selectedAnalyteCode } = props
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(true)
  const [instrumentList, setInstrumentList] = useState<InstrumentType[]>([])
  const [sampleTypeList, setSampleTypeList] = useState<SampleType[]>([])
  const [testList, setTestList] = useState<TestType[]>([])
  const [isUpdateReasonDialogOpen, setIsUpdateReasonDialogOpen] = useState(false)
  const [formDataToSubmit, setFormDataToSubmit] = useState<FormValidateType | null>(null)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormValidateType>({
    defaultValues: {
      analyteName: '',
      analyteCode: '',
      instrumentId: null,
      sampleTypeId: null,
      testId: null,
      remark: '',
      isActive: true
    }
  })

  // Reset form when drawer opens/closes or selectedAnalyteCode changes
  useEffect(() => {
    if (open) {
      if (selectedAnalyteCode) {
        // Set form values for edit mode
        reset({
          analyteName: selectedAnalyteCode.analyteName,
          analyteCode: selectedAnalyteCode.analyteCode,
          instrumentId: selectedAnalyteCode.instrumentId,
          sampleTypeId: selectedAnalyteCode.sampleTypeId,
          testId: selectedAnalyteCode.testId,
          remark: selectedAnalyteCode.remark || '',
          isActive: selectedAnalyteCode.isActive
        })
        setIsActive(selectedAnalyteCode.isActive)
      } else {
        // Reset form for add mode
        reset({
          analyteName: '',
          analyteCode: '',
          instrumentId: null,
          sampleTypeId: null,
          testId: null,
          remark: '',
          isActive: true
        })
        setIsActive(true)
      }
      setError(null)
    }
  }, [open, selectedAnalyteCode, reset])

  // Fetch lists when drawer opens
  useEffect(() => {
    const fetchLists = async () => {
      try {
        const [instrumentsResponse, sampleTypesResponse, testsResponse] = await Promise.all([
          fetch('/api/apps/lims/Analytecode-master?endpoint=instruments'),
          fetch('/api/apps/lims/Analytecode-master?endpoint=sampletypes'),
          fetch('/api/apps/lims/Analytecode-master?endpoint=tests')
        ])

        if (!instrumentsResponse.ok || !sampleTypesResponse.ok || !testsResponse.ok) {
          throw new Error('Failed to fetch data')
        }

        const [instruments, sampleTypes, tests] = await Promise.all([
          instrumentsResponse.json(),
          sampleTypesResponse.json(),
          testsResponse.json()
        ])

        setInstrumentList(instruments)
        setSampleTypeList(sampleTypes)
        setTestList(tests)
      } catch (error) {
        console.error('Error fetching lists:', error)
        setError('Failed to load data. Please try again later.')
      }
    }

    if (open) {
      fetchLists()
    }
  }, [open])

  const onSubmit = async (formData: FormValidateType) => {
    if (selectedAnalyteCode) {
      // For updates, show the reason dialog first
      setFormDataToSubmit(formData)
      setIsUpdateReasonDialogOpen(true)
    } else {
      // For new records, proceed with normal submission
      await submitFormData(formData)
    }
  }

  const submitFormData = async (formData: FormValidateType, updateReason?: string) => {
    try {
      setIsSubmitting(true)
      setError(null)

      const analyteCodePayload: AnalyteCodeType = {
        analyteId: selectedAnalyteCode?.analyteId || 0,
        analyteName: formData.analyteName,
        analyteCode: formData.analyteCode,
        instrumentId: formData.instrumentId || 0,
        sampleTypeId: formData.sampleTypeId || 0,
        testId: formData.testId || 0,
        instrumentName: instrumentList.find(i => i.instrumentId === formData.instrumentId)?.instrumentName || '',
        sampletype: sampleTypeList.find(s => s.sampleId === formData.sampleTypeId)?.sampleType || '',
        testName: testList.find(t => t.id === formData.testId)?.name || '',
        remark: formData.remark,
        isActive: formData.isActive,
        createdBy: selectedAnalyteCode?.createdBy || 'System',
        createdOn: selectedAnalyteCode?.createdOn || new Date().toISOString(),
        updatedBy: 'System',
        updatedOn: new Date().toISOString()
      }

      if (selectedAnalyteCode) {
        if (!updateReason) {
          throw new Error('Update reason is required')
        }

        const response = await fetch(`/api/apps/lims/Analytecode-master`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id: selectedAnalyteCode.analyteId,
            analyteCode: analyteCodePayload,
            reason: updateReason
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Failed to update record')
        }

        const result = await response.json()
        if (result.success) {
          toast.success('Record updated successfully!')
        } else {
          throw new Error(result.message)
        }
      } else {
        const response = await fetch('/api/apps/lims/Analytecode-master', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(analyteCodePayload)
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Failed to add record')
        }

        const result = await response.json()
        if (result.success) {
          toast.success('Record added successfully!')
        } else {
          throw new Error(result.message)
        }
      }
      onDataChange?.()
      handleClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save analyte code. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateReasonConfirm = async (reason: string) => {
    if (formDataToSubmit) {
      await submitFormData(formDataToSubmit, reason)
      setFormDataToSubmit(null)
      setIsUpdateReasonDialogOpen(false)
    }
  }

  const handleUpdateReasonClose = () => {
    setFormDataToSubmit(null)
    setIsUpdateReasonDialogOpen(false)
  }

  const handleReset = () => {
    handleClose()
    reset()
    setIsActive(true)
    setError(null)
    setIsSubmitting(false)
  }

  function handleChange(
    arg0: string
  ): import('react').ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> | undefined {
    throw new Error('Function not implemented.')
  }

  return (
    <>
      <Drawer
        open={open}
        anchor='right'
        variant='temporary'
        onClose={handleReset}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '100%', sm: 400 },
            maxWidth: '100vw'
          }
        }}
      >
        <div className='flex items-center justify-between plb-5 pli-6 border-be'>
          <Typography variant='h5' className='font-medium'>
            {selectedAnalyteCode ? 'Edit Analyte Code' : 'Add New Analyte Code'}
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

                <div className='grid grid-col-1 sm:grid-cols-2 gap-4'>
                  <Controller
                    name='analyteName'
                    control={control}
                    rules={{ required: 'Analyte name is required' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        size='small'
                        label='Analyte Name'
                        placeholder='Enter analyte name'
                        error={!!errors.analyteName}
                        helperText={errors.analyteName?.message}
                        required
                      />
                    )}
                  />

                  <Controller
                    name='analyteCode'
                    control={control}
                    rules={{ required: 'Analyte code is required' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        size='small' // Makes the TextField smaller row-wise
                        label='Analyte Code'
                        placeholder='e.g., GLU'
                        error={!!errors.analyteCode}
                        helperText={errors.analyteCode?.message}
                        required
                      />
                    )}
                  />
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <Controller
                    name='instrumentId'
                    control={control}
                    rules={{ required: 'Instrument is required' }}
                    render={({ field }) => (
                      <CustomAutocomplete
                        options={instrumentList}
                        getOptionLabel={option => option?.instrumentName || ''}
                        isOptionEqualToValue={(option, value) => option?.instrumentId === value?.instrumentId}
                        value={instrumentList.find(inst => inst.instrumentId === field.value) || null}
                        onChange={(_, newValue) => {
                          field.onChange(newValue?.instrumentId || null)
                        }}
                        renderInput={params => (
                          <TextField
                            {...params}
                            label='Instrument'
                            size='small'
                            placeholder='Select Instrument'
                            error={!!errors.instrumentId}
                            helperText={errors.instrumentId?.message}
                            required
                          />
                        )}
                        noOptionsText='No instruments found'
                      />
                    )}
                  />

                  <Controller
                    name='sampleTypeId'
                    control={control}
                    rules={{ required: 'Sample type is required' }}
                    render={({ field }) => (
                      <CustomAutocomplete
                        options={sampleTypeList}
                        getOptionLabel={option => option?.sampleType || ''}
                        isOptionEqualToValue={(option, value) => option?.sampleId === value?.sampleId}
                        value={sampleTypeList.find(sample => sample.sampleId === field.value) || null}
                        onChange={(_, newValue) => {
                          field.onChange(newValue?.sampleId || null)
                        }}
                        renderInput={params => (
                          <TextField
                            {...params}
                            label='Sample Type'
                            size='small'
                            placeholder='Select Sample Type'
                            error={!!errors.sampleTypeId}
                            helperText={errors.sampleTypeId?.message}
                            required
                          />
                        )}
                        noOptionsText='No sample types found'
                      />
                    )}
                  />
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <Controller
                    name='testId'
                    control={control}
                    rules={{ required: 'Test is required' }}
                    render={({ field }) => (
                      <CustomAutocomplete
                        options={testList}
                        getOptionLabel={option => option?.name || ''}
                        isOptionEqualToValue={(option, value) => option?.id === value?.id}
                        value={testList.find(test => test.id === field.value) || null}
                        onChange={(_, newValue) => {
                          field.onChange(newValue?.id || null)
                        }}
                        renderInput={params => (
                          <TextField
                            {...params}
                            label='Test'
                            size='small'
                            placeholder='Select Test'
                            error={!!errors.testId}
                            helperText={errors.testId?.message}
                            required
                          />
                        )}
                        noOptionsText='No tests found'
                      />
                    )}
                  />
                </div>

                <div className='space-y-4'>
                  <Controller
                    name='remark'
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        multiline
                        rows={3}
                        label='Remarks'
                        size='small'
                        placeholder='Additional notes about the analyte code'
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
                  {isSubmitting ? 'Saving...' : selectedAnalyteCode ? 'Update' : 'Add'}
                </Button>
              </div>
            </form>
          </div>
        </PerfectScrollbar>
      </Drawer>

      <UpdateReasonDialog
        open={isUpdateReasonDialogOpen}
        handleClose={handleUpdateReasonClose}
        handleConfirm={handleUpdateReasonConfirm}
        title='Update Reason Required'
        description='Please provide a reason for updating this analyte code. This will be recorded in the audit trail.'
      />
    </>
  )
}

export default AddAnalyteCodeDrawer
