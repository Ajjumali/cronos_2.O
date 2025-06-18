'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Box, Card, CardContent } from '@mui/material'
import { toast } from 'react-toastify'
import SendSampleListTable from '@/views/apps/lims/sample-send/SendSampleListTable'
import TableFilters from '@/views/apps/lims/sample-send/TableFilters'

interface Sample {
  id: string
  volunteerId: string
  volunteerName: string
  age: number
  screeningDate: string
  screeningFacility: string
  barcodeId: string
  sampleType: string
  collectedBy: string
  collectedOn: string
  sentBy: string
  sentOn: string
  status: 'pending' | 'sent' | 'received'
  avatar?: string
}

export default function SendPage() {
  const { lang } = useParams()
  const [selectedSamples, setSelectedSamples] = useState<Sample[]>([])
  const [filteredData, setFilteredData] = useState<Sample[]>([])

  const handleSendSamples = async (samples: Sample[]) => {
    try {
      const response = await fetch(`/api/apps/lims/sample-send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          labId: 'lab1',
          sampleIds: samples.map(s => s.id),
          sentBy: 'current_user_id',
          sentOn: new Date().toISOString()
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to send samples')
      }

      const data = await response.json()
      if (data.success) {
        toast.success(`Successfully sent ${samples.length} sample(s) to the lab`)
        setSelectedSamples([])
        console.log('Samples sent successfully:', data.data)
      }
    } catch (error) {
      console.error('Error sending samples:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send samples')
    }
  }

  return (
    <Card>
      <CardContent sx={{ p: '0 !important' }}>
        <Box sx={{ p: 6 }}>
          <TableFilters
            setData={setFilteredData}
            sampleData={[]} // TODO: Add your sample data here
            selectedSamples={selectedSamples}
            handleSendSamples={handleSendSamples}
            onSelectSamples={setSelectedSamples}
          />
        </Box>

        <Box sx={{ px: 6, pb: 6 }}>
          <SendSampleListTable
            onSendSamples={handleSendSamples}
            onSelectSamples={setSelectedSamples}
            searchText=''
            lab=''
          />
        </Box>
      </CardContent>
    </Card>
  )
}
