'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import SampleRegistrationForm from '../../../../../../../../../views/apps/lims/sample-registration/form/SampleRegistrationForm';
import { Card, CardContent, Typography } from '@mui/material';

const EditSampleRegistration = () => {
  const { id } = useParams();
  const [sampleData, setSampleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSampleData = async () => {
      try {
        const response = await fetch(`/api/apps/lims/sample-registration/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch sample data');
        }
        const data = await response.json();
        setSampleData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch sample data');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSampleData();
    }
  }, [id]);

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography>Loading...</Typography>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  return <SampleRegistrationForm initialData={sampleData} mode="edit" />;
};

export default EditSampleRegistration; 