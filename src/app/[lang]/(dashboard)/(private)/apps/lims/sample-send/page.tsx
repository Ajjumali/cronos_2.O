'use client'

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, Box, Typography, Button, Grid, IconButton, FormControl, InputLabel, Select, MenuItem, TextField } from '@mui/material';
import { toast } from 'react-toastify';
import { GridView, TableRows, FilterList, Print, FileDownload } from '@mui/icons-material';
import SendSampleListTable from '@/views/apps/lims/sample-send/SendSampleListTable';

interface Sample {
  id: string;
  volunteerId: string;
  volunteerName: string;
  age: number;
  screeningDate: string;
  screeningFacility: string;
  barcodeId: string;
  sampleType: string;
  collectedBy: string;
  collectedOn: string;
  sentBy: string;
  sentOn: string;
  status: 'pending' | 'sent' | 'received';
  avatar?: string;
}

export default function SendPage() {
  const { lang } = useParams();
  const [selectedSamples, setSelectedSamples] = useState<Sample[]>([]);
  const [view, setView] = useState<'grid' | 'table'>('table');
  const [lab, setLab] = useState('');
  const [searchText, setSearchText] = useState('');

  const handleSendSamples = async (samples: Sample[]) => {
    try {
      const response = await fetch(`/api/apps/lims/sample-send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          labId: lab || 'lab1',
          sampleIds: samples.map((s) => s.id),
          sentBy: 'current_user_id',
          sentOn: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to send samples');
      }

      const data = await response.json();
      if (data.success) {
        toast.success(`Successfully sent ${samples.length} sample(s) to the lab`);
        setSelectedSamples([]);
        // In a real app, you would refresh the sample list here
        // For now, we'll just log the success
        console.log('Samples sent successfully:', data.data);
      }
    } catch (error) {
      console.error('Error sending samples:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send samples');
    }
  };

  return (
    <Box className="space-y-6">
      {/* Header */}
      <Box className="flex items-center justify-between">
        <Typography variant="h4">Sample Send</Typography>
        <Box className="flex items-center space-x-4">
          <IconButton onClick={() => setView('grid')} color={view === 'grid' ? 'primary' : 'default'}>
            <GridView />
          </IconButton>
          <IconButton onClick={() => setView('table')} color={view === 'table' ? 'primary' : 'default'}>
            <TableRows />
          </IconButton>
          <Button variant="outlined" startIcon={<FilterList />}>
            Filters
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by name or ID"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Lab</InputLabel>
                <Select
                  value={lab}
                  label="Lab"
                  onChange={(e) => setLab(e.target.value as string)}
                >
                  <MenuItem value="lab1">Lab 1</MenuItem>
                  <MenuItem value="lab2">Lab 2</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value="" label="Status">
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="sent">Sent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button fullWidth variant="contained" color="primary">
                Search
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Box className="flex items-center space-x-4">
        <Button variant="outlined" startIcon={<Print />}>
          Print
        </Button>
        <Button variant="outlined" startIcon={<FileDownload />}>
          Export
        </Button>
        <Button 
          variant="contained" 
          color="primary"
          disabled={selectedSamples.length === 0}
          onClick={() => handleSendSamples(selectedSamples)}
        >
          Send to Lab
        </Button>
      </Box>

      {/* Table */}
      <Card>
        <CardContent>
          <SendSampleListTable 
            onSendSamples={handleSendSamples} 
            onSelectSamples={setSelectedSamples}
            searchText={searchText}
            lab={lab}
          />
        </CardContent>
      </Card>
    </Box>
  );
}