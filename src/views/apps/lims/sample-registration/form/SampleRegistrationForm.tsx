import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import dynamic from 'next/dynamic';
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
  Typography,
  Grid,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { printBarcode, downloadBarcode } from '@/services/barcodeService';
import PanelTestSelection from '../components/PanelTestSelection';
import { toast } from 'react-toastify';

const humanSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  employeeLocation: z.string().min(1, 'Location is required'),
  gender: z.string().min(1, 'Gender is required'),
  age: z.string().min(1, 'Age is required'),
  sampleType: z.enum(['fasting', 'random']),
  panels: z.array(z.string()).min(1, 'At least one panel is required'),
  tests: z.array(z.string()).min(1, 'At least one test is required'),
  sampleId: z.string(),
  name: z.string(),
});

const animalSchema = z.object({
  animalId: z.string().min(1, 'Animal ID is required'),
  gender: z.string().min(1, 'Gender is required'),
  species: z.string().min(1, 'Species is required'),
  requestedBy: z.string().min(1, 'Requested By is required'),
  strain: z.string().min(1, 'Strain is required'),
  age: z.string().min(1, 'Age is required'),
  panels: z.array(z.string()).min(1, 'At least one panel is required'),
  tests: z.array(z.string()).min(1, 'At least one test is required'),
  sampleId: z.string(),
  animalName: z.string(),
});

type HumanFormData = z.infer<typeof humanSchema>;
type AnimalFormData = z.infer<typeof animalSchema>;

interface SampleRegistrationFormProps {
  initialData?: any;
  mode?: 'create' | 'edit';
  onClose?: () => void;
}

const SampleRegistrationForm = ({ initialData, mode = 'create', onClose }: SampleRegistrationFormProps) => {
  const [registrationType, setRegistrationType] = useState<'human' | 'animal'>(initialData?.type || 'human');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const humanForm = useForm<HumanFormData>({
    resolver: zodResolver(humanSchema),
    defaultValues: initialData?.type === 'human' ? {
      employeeId: initialData.employeeId || '',
      employeeLocation: initialData.employeeLocation || '',
      gender: initialData.gender || '',
      age: initialData.age || '',
      sampleType: initialData.sampleType || 'fasting',
      panels: initialData.panels || [],
      tests: initialData.tests || [],
      sampleId: initialData.sampleId || '',
      name: initialData.name || '',
    } : {
      employeeId: '',
      employeeLocation: '',
      gender: '',
      age: '',
      sampleType: 'fasting',
      panels: [],
      tests: [],
    },
  });

  const animalForm = useForm<AnimalFormData>({
    resolver: zodResolver(animalSchema),
    defaultValues: initialData?.type === 'animal' ? {
      animalId: initialData.animalId || '',
      gender: initialData.gender || '',
      species: initialData.species || '',
      requestedBy: initialData.requestedBy || '',
      strain: initialData.strain || '',
      age: initialData.age || '',
      panels: initialData.panels || [],
      tests: initialData.tests || [],
      sampleId: initialData.sampleId || '',
      animalName: initialData.animalName || '',
    } : {
      animalId: '',
      gender: '',
      species: '',
      requestedBy: '',
      strain: '',
      age: '',
      panels: [],
      tests: [],
    },
  });

  const handlePrintBarcode = async (data: HumanFormData | AnimalFormData) => {
    try {
      const barcodeData = registrationType === 'human' 
        ? {
            type: registrationType,
            sampleId: (data as HumanFormData).sampleId,
            subjectId: (data as HumanFormData).employeeId,
            name: (data as HumanFormData).name,
          }
        : {
            type: registrationType,
            sampleId: (data as AnimalFormData).sampleId,
            subjectId: (data as AnimalFormData).animalId,
            name: (data as AnimalFormData).animalName,
          };

      // Call the barcode generation API
      const response = await fetch(`/api/apps/lims/sample-registration/${initialData?.id}/print-barcode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(barcodeData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate barcode');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `barcode-${barcodeData.sampleId}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error printing barcode:', error);
      toast.error('Failed to generate barcode');
    }
  };

  const handleDownloadBarcode = async (data: HumanFormData | AnimalFormData) => {
    try {
      const barcodeData = registrationType === 'human' 
        ? {
            type: registrationType,
            sampleId: (data as HumanFormData).sampleId,
            subjectId: (data as HumanFormData).employeeId,
            name: (data as HumanFormData).name,
          }
        : {
            type: registrationType,
            sampleId: (data as AnimalFormData).sampleId,
            subjectId: (data as AnimalFormData).animalId,
            name: (data as AnimalFormData).animalName,
          };

      // Call the barcode generation API
      const response = await fetch(`/api/apps/lims/sample-registration/${initialData?.id}/print-barcode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(barcodeData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate barcode');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `barcode-${barcodeData.sampleId}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading barcode:', error);
      toast.error('Failed to download barcode');
    }
  };

  const onSubmit = async (data: HumanFormData | AnimalFormData) => {
    try {
      // Prepare the request data
      const requestData = {
        type: registrationType,
        ...data,
        registrationDateTime: new Date().toISOString(),
      };

      // Determine the API endpoint and method based on mode
      const url = mode === 'edit' 
        ? `/api/apps/lims/sample-registration/${initialData.id}`
        : '/api/apps/lims/sample-registration';
      
      const method = mode === 'edit' ? 'PUT' : 'POST';

      // Call the appropriate API endpoint
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${mode} sample`);
      }

      const result = await response.json();

      // Generate and print barcode after successful registration
      if (mode === 'create') {
        await handlePrintBarcode(data);
      }
      
      // Show success message
      toast.success(`Sample ${mode === 'edit' ? 'updated' : 'registered'} successfully`);
      
      // Navigate back to list
      handleBack();
    } catch (error) {
      console.error(`Error ${mode}ing sample:`, error);
      toast.error(error instanceof Error ? error.message : `Failed to ${mode} sample`);
    }
  };

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  if (!isClient) {
    return (
      <Card>
        <CardContent>
          <Typography>Loading...</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader 
        title={`${mode === 'edit' ? 'Edit' : 'New'} Sample Registration`} 
        action={
          <Button
            variant="outlined"
            onClick={handleBack}
            sx={{ mr: 2 }}
          >
            Back to List
          </Button>
        }
      />
      <CardContent>
        <Box sx={{ mb: 4 }}>
          <FormControl component="fieldset">
            <RadioGroup
              row
              value={registrationType}
              onChange={(e) => setRegistrationType(e.target.value as 'human' | 'animal')}
            >
              <FormControlLabel value="human" control={<Radio />} label="Human" />
              <FormControlLabel value="animal" control={<Radio />} label="Animal" />
            </RadioGroup>
          </FormControl>
        </Box>

        {registrationType === 'human' ? (
          <form onSubmit={humanForm.handleSubmit(onSubmit)}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Controller
                name="employeeId"
                control={humanForm.control}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    label="Employee ID"
                    error={!!error}
                    helperText={error?.message}
                    fullWidth
                  />
                )}
              />

              <Controller
                name="employeeLocation"
                control={humanForm.control}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    label="Employee Location"
                    error={!!error}
                    helperText={error?.message}
                    fullWidth
                  />
                )}
              />

              <Controller
                name="gender"
                control={humanForm.control}
                render={({ field, fieldState: { error } }) => (
                  <FormControl fullWidth error={!!error}>
                    <InputLabel>Gender</InputLabel>
                    <Select {...field} label="Gender">
                      <MenuItem value="male">Male</MenuItem>
                      <MenuItem value="female">Female</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                    {error && <Typography color="error">{error.message}</Typography>}
                  </FormControl>
                )}
              />

              <Controller
                name="age"
                control={humanForm.control}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    label="Age"
                    type="number"
                    error={!!error}
                    helperText={error?.message}
                    fullWidth
                  />
                )}
              />

              <Controller
                name="sampleType"
                control={humanForm.control}
                render={({ field, fieldState: { error } }) => (
                  <FormControl error={!!error}>
                    <Typography variant="subtitle1" gutterBottom>
                      Sample Type
                    </Typography>
                    <RadioGroup {...field} row>
                      <FormControlLabel value="fasting" control={<Radio />} label="Fasting" />
                      <FormControlLabel value="random" control={<Radio />} label="Random" />
                    </RadioGroup>
                    {error && <Typography color="error">{error.message}</Typography>}
                  </FormControl>
                )}
              />

              <Controller
                name="panels"
                control={humanForm.control}
                render={({ field }) => (
                  <PanelTestSelection
                    selectedPanels={field.value}
                    selectedTests={humanForm.watch('tests')}
                    onPanelsChange={field.onChange}
                    onTestsChange={(tests) => humanForm.setValue('tests', tests)}
                  />
                )}
              />

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    color="primary"
                    type="submit"
                    sx={{ mr: 2 }}
                  >
                    Register Sample
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => handleDownloadBarcode(humanForm.getValues())}
                  >
                    Download Barcode
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </form>
        ) : (
          <form onSubmit={animalForm.handleSubmit(onSubmit)}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Controller
                name="animalId"
                control={animalForm.control}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    label="Animal ID"
                    error={!!error}
                    helperText={error?.message}
                    fullWidth
                  />
                )}
              />

              <Controller
                name="gender"
                control={animalForm.control}
                render={({ field, fieldState: { error } }) => (
                  <FormControl fullWidth error={!!error}>
                    <InputLabel>Gender</InputLabel>
                    <Select {...field} label="Gender">
                      <MenuItem value="male">Male</MenuItem>
                      <MenuItem value="female">Female</MenuItem>
                    </Select>
                    {error && <Typography color="error">{error.message}</Typography>}
                  </FormControl>
                )}
              />

              <Controller
                name="species"
                control={animalForm.control}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    label="Species"
                    error={!!error}
                    helperText={error?.message}
                    fullWidth
                  />
                )}
              />

              <Controller
                name="requestedBy"
                control={animalForm.control}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    label="Requested By"
                    error={!!error}
                    helperText={error?.message}
                    fullWidth
                  />
                )}
              />

              <Controller
                name="strain"
                control={animalForm.control}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    label="Strain"
                    error={!!error}
                    helperText={error?.message}
                    fullWidth
                  />
                )}
              />

              <Controller
                name="age"
                control={animalForm.control}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    label="Age"
                    type="number"
                    error={!!error}
                    helperText={error?.message}
                    fullWidth
                  />
                )}
              />

              <Controller
                name="panels"
                control={animalForm.control}
                render={({ field }) => (
                  <PanelTestSelection
                    selectedPanels={field.value}
                    selectedTests={animalForm.watch('tests')}
                    onPanelsChange={field.onChange}
                    onTestsChange={(tests) => animalForm.setValue('tests', tests)}
                  />
                )}
              />

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    color="primary"
                    type="submit"
                    sx={{ mr: 2 }}
                  >
                    Register Sample
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => handleDownloadBarcode(animalForm.getValues())}
                  >
                    Download Barcode
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

// Export with dynamic import and no SSR
export default dynamic(() => Promise.resolve(SampleRegistrationForm), {
  ssr: false
}); 