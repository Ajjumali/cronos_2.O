import { toast } from 'react-toastify';

export interface Test {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  turnaroundTime: string;
  sampleType: string;
  sampleVolume: string;
  containerType: string;
  specialInstructions?: string;
}

export interface Panel {
  id: string;
  name: string;
  description: string;
  tests: Test[];
  price: number;
  turnaroundTime: string;
  sampleType: string;
  sampleVolume: string;
  containerType: string;
  specialInstructions?: string;
}

// Dummy data for demonstration
const tests: Test[] = [
  {
    id: 'test1',
    name: 'Complete Blood Count (CBC)',
    description: 'Measures various components of blood',
    category: 'Hematology',
    price: 50,
    turnaroundTime: '24 hours',
    sampleType: 'Blood',
    sampleVolume: '2 mL',
    containerType: 'EDTA Tube',
    specialInstructions: 'Fasting required'
  },
  {
    id: 'test2',
    name: 'Basic Metabolic Panel',
    description: 'Measures kidney function, blood sugar, and electrolyte levels',
    category: 'Chemistry',
    price: 75,
    turnaroundTime: '24 hours',
    sampleType: 'Blood',
    sampleVolume: '3 mL',
    containerType: 'SST Tube'
  },
  {
    id: 'test3',
    name: 'Lipid Panel',
    description: 'Measures cholesterol and triglycerides',
    category: 'Chemistry',
    price: 60,
    turnaroundTime: '24 hours',
    sampleType: 'Blood',
    sampleVolume: '2 mL',
    containerType: 'SST Tube',
    specialInstructions: '12-hour fasting required'
  }
];

const panels: Panel[] = [
  {
    id: 'panel1',
    name: 'Cardiac Panel',
    description: 'Comprehensive cardiac health assessment',
    tests: [tests[0], tests[1], tests[2]],
    price: 150,
    turnaroundTime: '24 hours',
    sampleType: 'Blood',
    sampleVolume: '5 mL',
    containerType: 'Multiple tubes required',
    specialInstructions: '12-hour fasting required'
  },
  {
    id: 'panel2',
    name: 'Basic Health Panel',
    description: 'General health assessment',
    tests: [tests[0], tests[1]],
    price: 100,
    turnaroundTime: '24 hours',
    sampleType: 'Blood',
    sampleVolume: '4 mL',
    containerType: 'Multiple tubes required'
  }
];

export const getTests = async (): Promise<Test[]> => {
  try {
    // In a real implementation, this would be an API call
    return tests;
  } catch (error) {
    console.error('Error fetching tests:', error);
    toast.error('Failed to fetch tests');
    return [];
  }
};

export const getPanels = async (): Promise<Panel[]> => {
  try {
    // In a real implementation, this would be an API call
    return panels;
  } catch (error) {
    console.error('Error fetching panels:', error);
    toast.error('Failed to fetch panels');
    return [];
  }
};

export const getTestDetails = async (testId: string): Promise<Test | null> => {
  try {
    const test = tests.find(t => t.id === testId);
    return test || null;
  } catch (error) {
    console.error('Error fetching test details:', error);
    toast.error('Failed to fetch test details');
    return null;
  }
};

export const getPanelDetails = async (panelId: string): Promise<Panel | null> => {
  try {
    const panel = panels.find(p => p.id === panelId);
    return panel || null;
  } catch (error) {
    console.error('Error fetching panel details:', error);
    toast.error('Failed to fetch panel details');
    return null;
  }
}; 