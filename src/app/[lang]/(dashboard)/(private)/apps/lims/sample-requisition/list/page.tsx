'use client'

import { Box, CircularProgress } from '@mui/material';
import { useState, useEffect } from 'react';
import SampleRequisitionListTable from '@/views/apps/lims/sample-requisition/list/SampleRequisitionListTable';
import { Requisition } from '@/app/api/apps/lims/sample-requisition/route';

export default function SampleRequisitionListPage() {
  const [data, setData] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/apps/lims/sample-requisition');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div className='p-6'>
      <SampleRequisitionListTable requisitionData={data} onDataChange={fetchData} />
    </div>
  );
}
