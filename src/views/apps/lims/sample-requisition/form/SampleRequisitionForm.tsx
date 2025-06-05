import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { toast } from 'react-toastify';
import { getProjects, getStudyTypes, getVisits, getScreenings, type Project, type StudyType, type Visit, type Screening } from '@/services/projectService';
import { getTests, getPanels, type Test, type Panel } from '@/services/testService';
import TestDetailsDialog from '../components/TestDetailsDialog';
import { useRouter, useParams } from 'next/navigation';
import { getLocalizedUrl } from '@/utils/i18n';
import PanelTestSelection from '../../sample-registration/components/PanelTestSelection';

const requisitionSchema = z.object({
  referenceId: z.string().min(1, 'Reference ID is required'),
  fatherHusbandName: z.string().min(1, 'Father/Husband Name is required'),
  lastScreeningDate: z.date(),
  lastStudyCompletionDate: z.date(),
  age: z.number().min(0, 'Age must be positive'),
  mobileNumber: z.string().min(10, 'Valid mobile number required'),
  projectType: z.enum(['existing', 'new', 'na']),
  project: z.string().optional(),
  studyType: z.string().optional(),
  visit: z.string().optional(),
  screening: z.string().optional(),
  hivCounsellingDone: z.enum(['yes', 'no', 'na']),
  fastingSince: z.date(),
  fastingHours: z.number().min(0, 'Fasting hours must be positive'),
  tests: z.array(z.string()).min(1, 'At least one test is required'),
  panels: z.array(z.string()).min(1, 'At least one panel is required'),
  remarks: z.string().optional(),
});

type RequisitionFormData = z.infer<typeof requisitionSchema>;

interface RequisitionResponse {
  id: number;
  sampleId: string;
  status: string;
}

const SampleRequisitionForm = () => {
  const router = useRouter();
  const { lang: locale } = useParams();
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [selectedPanels, setSelectedPanels] = useState<string[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [studyTypes, setStudyTypes] = useState<StudyType[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [tests, setTests] = useState<Test[]>([]);
  const [panels, setPanels] = useState<Panel[]>([]);
  const [showTestDetails, setShowTestDetails] = useState(false);
  const [showPanelDetails, setShowPanelDetails] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<string>('');
  const [selectedPanelId, setSelectedPanelId] = useState<string>('');

  const form = useForm<RequisitionFormData>({
    resolver: zodResolver(requisitionSchema),
    defaultValues: {
      referenceId: '',
      fatherHusbandName: '',
      lastScreeningDate: new Date(),
      lastStudyCompletionDate: new Date(),
      age: 0,
      mobileNumber: '',
      projectType: 'existing',
      hivCounsellingDone: 'no',
      fastingSince: new Date(),
      fastingHours: 0,
      tests: [],
      panels: [],
      remarks: '',
    },
  });

  // Fetch projects on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      const data = await getProjects();
      setProjects(data);
    };
    fetchProjects();
  }, []);

  // Update study types when project changes
  useEffect(() => {
    const projectId = form.watch('project');
    if (projectId) {
      const fetchStudyTypes = async () => {
        const data = await getStudyTypes(projectId);
        setStudyTypes(data);
        // Reset dependent fields
        form.setValue('studyType', '');
        form.setValue('visit', '');
        form.setValue('screening', '');
      };
      fetchStudyTypes();
    } else {
      setStudyTypes([]);
    }
  }, [form.watch('project')]);

  // Update visits when study type changes
  useEffect(() => {
    const projectId = form.watch('project');
    const studyTypeId = form.watch('studyType');
    if (projectId && studyTypeId) {
      const fetchVisits = async () => {
        const data = await getVisits(projectId, studyTypeId);
        setVisits(data);
        // Reset dependent fields
        form.setValue('visit', '');
        form.setValue('screening', '');
      };
      fetchVisits();
    } else {
      setVisits([]);
    }
  }, [form.watch('studyType')]);

  // Update screenings when visit changes
  useEffect(() => {
    const projectId = form.watch('project');
    const studyTypeId = form.watch('studyType');
    const visitId = form.watch('visit');
    if (projectId && studyTypeId && visitId) {
      const fetchScreenings = async () => {
        const data = await getScreenings(projectId, studyTypeId, visitId);
        setScreenings(data);
        // Reset screening field
        form.setValue('screening', '');
      };
      fetchScreenings();
    } else {
      setScreenings([]);
    }
  }, [form.watch('visit')]);

  const onSubmit = async (data: RequisitionFormData) => {
    try {
      setLoading(true);

      // Prepare the submission data
      const submissionData = {
        ...data,
        tests: selectedTests.map(testId => {
          const test = tests.find(t => t.id === testId);
          return {
            id: testId,
            name: test?.name || '',
            category: test?.category || '',
            price: test?.price || 0,
            sampleType: test?.sampleType || '',
            sampleVolume: test?.sampleVolume || '',
            containerType: test?.containerType || '',
            specialInstructions: test?.specialInstructions || ''
          };
        }),
        panels: selectedPanels.map(panelId => {
          const panel = panels.find(p => p.id === panelId);
          return {
            id: panelId,
            name: panel?.name || '',
            price: panel?.price || 0,
            sampleType: panel?.sampleType || '',
            sampleVolume: panel?.sampleVolume || '',
            containerType: panel?.containerType || '',
            specialInstructions: panel?.specialInstructions || '',
            tests: panel?.tests.map(test => ({
              id: test.id,
              name: test.name,
              category: test.category,
              price: test.price,
              sampleType: test.sampleType,
              sampleVolume: test.sampleVolume,
              containerType: test.containerType,
              specialInstructions: test.specialInstructions
            })) || []
          };
        }),
        projectDetails: form.watch('projectType') === 'existing' ? {
          project: projects.find(p => p.id === data.project)?.name || '',
          studyType: studyTypes.find(st => st.id === data.studyType)?.name || '',
          visit: visits.find(v => v.id === data.visit)?.name || '',
          screening: screenings.find(s => s.id === data.screening)?.name || ''
        } : null
      };

      // Submit the requisition
      const response = await fetch('/api/apps/lims/sample-requisition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        throw new Error('Failed to create requisition');
      }

      const result: RequisitionResponse = await response.json();
      setShowSuccessDialog(true);
      
      // Print barcode automatically
      await printBarcode(result.sampleId);
      
      // Reset form
      form.reset();
      setSelectedTests([]);
      setSelectedPanels([]);

      // Set redirecting state to true
      setRedirecting(true);

      // Navigate back to list after a short delay
      setTimeout(() => {
        router.push('/apps/lims/sample-requisition/list');
      }, 2000);
    } catch (error: unknown) {
      toast.error('Failed to create requisition');
      console.error('Error creating requisition:', error);
    } finally {
      setLoading(false);
    }
  };

  const printBarcode = async (sampleId: string) => {
    try {
      const response = await fetch('/api/apps/lims/print-barcode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sampleId }),
      });

      if (!response.ok) {
        throw new Error('Failed to print barcode');
      }

      toast.success('Barcode printed successfully');
    } catch (error) {
      toast.error('Failed to print barcode');
      console.error('Error printing barcode:', error);
    }
  };

  const handleBack = () => {
    setRedirecting(true);
    try {
      router.push(getLocalizedUrl(`/apps/lims/sample-requisition/list`, String(locale)));
    } catch (error: unknown) {
      console.error('Navigation error:', error);
      setRedirecting(false);
      toast.error('Failed to navigate to list page');
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      {redirecting ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Redirecting to list page...</Typography>
        </Box>
      ) : (
        <Card>
          <CardHeader 
            title="Create Sample Requisition"
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
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Grid container spacing={3}>
                {/* Basic Information */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom textAlign="center">
                    Volunteer Details
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="referenceId"
                    control={form.control}
                    render={({ field, fieldState: { error } }) => (
                      <TextField
                        {...field}
                        label="Reference ID"
                        error={!!error}
                        helperText={error?.message}
                        fullWidth
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="fatherHusbandName"
                    control={form.control}
                    render={({ field, fieldState: { error } }) => (
                      <TextField
                        {...field}
                        label="Father/Husband Name"
                        error={!!error}
                        helperText={error?.message}
                        fullWidth
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom textAlign="center">
                    Screening Details
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="lastScreeningDate"
                    control={form.control}
                    render={({ field, fieldState: { error } }) => (
                      <DatePicker
                        label="Last Screening Date"
                        value={field.value}
                        onChange={field.onChange}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!error,
                            helperText: error?.message,
                          },
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="lastStudyCompletionDate"
                    control={form.control}
                    render={({ field, fieldState: { error } }) => (
                      <DatePicker
                        label="Last Study Completion Date"
                        value={field.value}
                        onChange={field.onChange}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!error,
                            helperText: error?.message,
                          },
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="age"
                    control={form.control}
                    render={({ field, fieldState: { error } }) => (
                      <TextField
                        {...field}
                        type="number"
                        label="Age"
                        error={!!error}
                        helperText={error?.message}
                        fullWidth
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="mobileNumber"
                    control={form.control}
                    render={({ field, fieldState: { error } }) => (
                      <TextField
                        {...field}
                        label="Mobile Number"
                        error={!!error}
                        helperText={error?.message}
                        fullWidth
                      />
                    )}
                  />
                </Grid>

                {/* Project Information */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom textAlign="center">
                    Project Information
                  </Typography>
                  <Controller
                    name="projectType"
                    control={form.control}
                    render={({ field }) => (
                      <FormControl component="fieldset">
                        <RadioGroup
                          row
                          value={field.value}
                          onChange={field.onChange}
                        >
                          <FormControlLabel value="existing" control={<Radio />} label="Existing Project" />
                          <FormControlLabel value="new" control={<Radio />} label="New Study" />
                          <FormControlLabel value="na" control={<Radio />} label="N/A" />
                        </RadioGroup>
                      </FormControl>
                    )}
                  />
                </Grid>

                {form.watch('projectType') === 'existing' && (
                  <>
                    <Grid item xs={12} md={6}>
                      <Controller
                        name="project"
                        control={form.control}
                        render={({ field, fieldState: { error } }) => (
                          <FormControl fullWidth error={!!error}>
                            <InputLabel>Project</InputLabel>
                            <Select {...field} label="Project">
                              {projects.map((project) => (
                                <MenuItem key={project.id} value={project.id}>
                                  {project.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Controller
                        name="studyType"
                        control={form.control}
                        render={({ field, fieldState: { error } }) => (
                          <FormControl fullWidth error={!!error}>
                            <InputLabel>Study Type</InputLabel>
                            <Select {...field} label="Study Type" disabled={!form.watch('project')}>
                              {studyTypes.map((type) => (
                                <MenuItem key={type.id} value={type.id}>
                                  {type.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Controller
                        name="visit"
                        control={form.control}
                        render={({ field, fieldState: { error } }) => (
                          <FormControl fullWidth error={!!error}>
                            <InputLabel>Visit</InputLabel>
                            <Select {...field} label="Visit" disabled={!form.watch('studyType')}>
                              {visits.map((visit) => (
                                <MenuItem key={visit.id} value={visit.id}>
                                  {visit.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Controller
                        name="screening"
                        control={form.control}
                        render={({ field, fieldState: { error } }) => (
                          <FormControl fullWidth error={!!error}>
                            <InputLabel>Screening</InputLabel>
                            <Select {...field} label="Screening" disabled={!form.watch('visit')}>
                              {screenings.map((screening) => (
                                <MenuItem key={screening.id} value={screening.id}>
                                  {screening.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      />
                    </Grid>
                  </>
                )}

                {/* HIV Counselling */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom textAlign="center">
                    HIV Counselling
                  </Typography>
                  <Controller
                    name="hivCounsellingDone"
                    control={form.control}
                    render={({ field }) => (
                      <FormControl component="fieldset">
                        <RadioGroup
                          row
                          value={field.value}
                          onChange={field.onChange}
                        >
                          <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                          <FormControlLabel value="no" control={<Radio />} label="No" />
                          <FormControlLabel value="na" control={<Radio />} label="N/A" />
                        </RadioGroup>
                      </FormControl>
                    )}
                  />
                </Grid>

                {/* Fasting Information */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom textAlign="center">
                    Fasting Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Controller
                        name="fastingSince"
                        control={form.control}
                        render={({ field, fieldState: { error } }) => (
                          <DatePicker
                            label="Fasting Since"
                            value={field.value}
                            onChange={field.onChange}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                error: !!error,
                                helperText: error?.message,
                              },
                            }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Controller
                        name="fastingHours"
                        control={form.control}
                        render={({ field, fieldState: { error } }) => (
                          <TextField
                            {...field}
                            type="number"
                            label="Fasting Hours"
                            error={!!error}
                            helperText={error?.message}
                            fullWidth
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </Grid>

                {/* Tests and Panels */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom textAlign="center">
                    Tests and Panels
                  </Typography>
                  <Controller
                    name="panels"
                    control={form.control}
                    render={({ field }) => (
                      <PanelTestSelection
                        selectedPanels={field.value}
                        selectedTests={form.watch('tests')}
                        onPanelsChange={field.onChange}
                        onTestsChange={(tests) => form.setValue('tests', tests)}
                      />
                    )}
                  />
                </Grid>

                {/* Remarks */}
                <Grid item xs={12}>
                  <Controller
                    name="remarks"
                    control={form.control}
                    render={({ field, fieldState: { error } }) => (
                      <TextField
                        {...field}
                        label="Remarks"
                        multiline
                        rows={4}
                        error={!!error}
                        helperText={error?.message}
                        fullWidth
                      />
                    )}
                  />
                </Grid>

                {/* Submit Button */}
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                  >
                    {loading ? 'Creating Requisition...' : 'Create Requisition'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onClose={() => setShowSuccessDialog(false)}>
        <DialogTitle>Success</DialogTitle>
        <DialogContent>
          <Typography>
            Requisition Request Created Successfully
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSuccessDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default SampleRequisitionForm; 