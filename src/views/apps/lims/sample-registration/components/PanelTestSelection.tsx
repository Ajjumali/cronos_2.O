import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

interface PanelTestSelectionProps {
  selectedPanels: string[];
  selectedTests: string[];
  onPanelsChange: (panels: string[]) => void;
  onTestsChange: (tests: string[]) => void;
}

interface Panel {
  id: number;
  panelName: string;
  activeFlag: string;
}

interface Test {
  id: number;
  testName: string;
  activeFlag: string;
}

export default function PanelTestSelection({
  selectedPanels,
  selectedTests,
  onPanelsChange,
  onTestsChange,
}: PanelTestSelectionProps) {
  const [selectedPanel, setSelectedPanel] = useState('');
  const [selectedTest, setSelectedTest] = useState('');
  const [availablePanels, setAvailablePanels] = useState<Panel[]>([]);
  const [availableTests, setAvailableTests] = useState<Test[]>([]);

  useEffect(() => {
    const fetchPanels = async () => {
      try {
        const response = await fetch('/api/apps/lims/panel-master');
        if (!response.ok) throw new Error('Failed to fetch panels');
        const data = await response.json();
        if (data.result) {
          setAvailablePanels(data.result);
        }
      } catch (error) {
        console.error('Error fetching panels:', error);
        setAvailablePanels([]);
      }
    };

    const fetchTests = async () => {
      try {
        const response = await fetch('/api/apps/lims/test-master');
        if (!response.ok) throw new Error('Failed to fetch tests');
        const data = await response.json();
        if (data.result) {
          setAvailableTests(data.result);
        }
      } catch (error) {
        console.error('Error fetching tests:', error);
        setAvailableTests([]);
      }
    };

    fetchPanels();
    fetchTests();
  }, []);

  const handleAddPanel = () => {
    if (selectedPanel && !selectedPanels.includes(selectedPanel)) {
      onPanelsChange([...selectedPanels, selectedPanel]);
      setSelectedPanel('');
    }
  };

  const handleRemovePanel = (panelId: string) => {
    onPanelsChange(selectedPanels.filter(id => id !== panelId));
  };

  const handleAddTest = () => {
    if (selectedTest && !selectedTests.includes(selectedTest)) {
      onTestsChange([...selectedTests, selectedTest]);
      setSelectedTest('');
    }
  };

  const handleRemoveTest = (testId: string) => {
    onTestsChange(selectedTests.filter(id => id !== testId));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Panel Selection
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Select Panel</InputLabel>
            <Select
              value={selectedPanel}
              label="Select Panel"
              onChange={(e) => setSelectedPanel(e.target.value)}
            >
              {availablePanels.map((panel) => (
                <MenuItem key={panel.id} value={panel.id.toString()}>
                  {panel.panelName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddPanel}
            disabled={!selectedPanel}
          >
            Add
          </Button>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {selectedPanels.map((panelId) => {
            const panel = availablePanels.find(p => p.id.toString() === panelId);
            return (
              <Chip
                key={panelId}
                label={panel?.panelName}
                onDelete={() => handleRemovePanel(panelId)}
                color="primary"
                variant="outlined"
              />
            );
          })}
        </Box>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Test Selection
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Select Test</InputLabel>
            <Select
              value={selectedTest}
              label="Select Test"
              onChange={(e) => setSelectedTest(e.target.value)}
            >
              {availableTests.map((test) => (
                <MenuItem key={test.id} value={test.id.toString()}>
                  {test.testName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddTest}
            disabled={!selectedTest}
          >
            Add
          </Button>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {selectedTests.map((testId) => {
            const test = availableTests.find(t => t.id.toString() === testId);
            return (
              <Chip
                key={testId}
                label={test?.testName}
                onDelete={() => handleRemoveTest(testId)}
                color="primary"
                variant="outlined"
              />
            );
          })}
        </Box>
      </Paper>
    </Box>
  );
} 