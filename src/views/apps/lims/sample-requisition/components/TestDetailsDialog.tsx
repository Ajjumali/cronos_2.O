import { useState, useEffect } from 'react';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';

import { getTestDetails, getPanelDetails, type Test, type Panel } from '@/services/testService';

interface TestDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  type: 'test' | 'panel';
  id: string;
}

const TestDetailsDialog = ({ open, onClose, type, id }: TestDetailsDialogProps) => {
  const [details, setDetails] = useState<Test | Panel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);

        const data = type === 'test'
          ? await getTestDetails(id)
          : await getPanelDetails(id);

        setDetails(data);
      } catch (error) {
        console.error('Error fetching details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (open && id) {
      fetchDetails();
    }
  }, [open, id, type]);

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Loading...</DialogTitle>
        <DialogContent>
          <Typography>Please wait while we fetch the details...</Typography>
        </DialogContent>
      </Dialog>
    );
  }

  if (!details) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Error</DialogTitle>
        <DialogContent>
          <Typography>Failed to load details</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {type === 'test' ? (details as Test).name : (details as Panel).name}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" color="text.secondary">
            {details.description}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <List>
          <ListItem>
            <ListItemText
              primary="Category"
              secondary={type === 'test' ? (details as Test).category : 'Panel'}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Price"
              secondary={`$${details.price}`}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Turnaround Time"
              secondary={details.turnaroundTime}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Sample Type"
              secondary={details.sampleType}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Sample Volume"
              secondary={details.sampleVolume}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Container Type"
              secondary={details.containerType}
            />
          </ListItem>
          {details.specialInstructions && (
            <ListItem>
              <ListItemText
                primary="Special Instructions"
                secondary={details.specialInstructions}
              />
            </ListItem>
          )}
        </List>

        {type === 'panel' && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Included Tests
            </Typography>
            <List>
              {(details as Panel).tests.map((test) => (
                <ListItem key={test.id}>
                  <ListItemText
                    primary={test.name}
                    secondary={test.description}
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TestDetailsDialog; 