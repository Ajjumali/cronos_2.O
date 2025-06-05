import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
} from '@mui/material';
import { format } from 'date-fns';

interface AuditTrailEntry {
  id: number;
  action: string;
  description: string;
  triggeredBy: string;
  triggeredOn: string;
  status: string;
  reason?: string;
  volunteerId: string;
  barcodeId: string;
}

interface AuditTrailDialogProps {
  open: boolean;
  onClose: () => void;
  requisitionId: number;
}

const AuditTrailDialog = ({ open, onClose, requisitionId }: AuditTrailDialogProps) => {
  const [auditTrail, setAuditTrail] = useState<AuditTrailEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuditTrail = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/apps/lims/sample-requisition/${requisitionId}/audit-trail`);
        if (!response.ok) {
          throw new Error('Failed to fetch audit trail');
        }
        const data = await response.json();
        setAuditTrail(data);
      } catch (error) {
        console.error('Error fetching audit trail:', error);
      } finally {
        setLoading(false);
      }
    };

    if (open && requisitionId) {
      fetchAuditTrail();
    }
  }, [open, requisitionId]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Audit Trail</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <Typography>Loading...</Typography>
          </Box>
        ) : auditTrail.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <Typography>No audit trail entries found</Typography>
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Action</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Triggered By</TableCell>
                  <TableCell>Triggered On</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Volunteer ID</TableCell>
                  <TableCell>Barcode ID</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {auditTrail.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.action}</TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell>{entry.triggeredBy}</TableCell>
                    <TableCell>
                      {format(new Date(entry.triggeredOn), 'yyyy-MM-dd HH:mm:ss')}
                    </TableCell>
                    <TableCell>{entry.status}</TableCell>
                    <TableCell>{entry.reason || '-'}</TableCell>
                    <TableCell>{entry.volunteerId}</TableCell>
                    <TableCell>{entry.barcodeId}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AuditTrailDialog; 