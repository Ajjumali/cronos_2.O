import { NextResponse } from 'next/server';

export interface Requisition {
  id: number;
  requisitionDateTime: string;
  sampleId: string;
  referenceNumber: string;
  patientName: string;
  gender: string;
  age: number;
  department: string;
  status: string;
  tests: string[];
  panels: string[];
  fatherHusbandName: string;
  lastScreeningDate: string;
  lastStudyCompletionDate: string;
  mobileNumber: string;
  hivCounsellingDone: string;
  fastingSince: string;
  fastingHours: number;
  cancellationReason?: string;
}

// Dummy data for demonstration
let requisitions: Requisition[] = [
  {
    id: 1,
    requisitionDateTime: '2024-03-20 10:30:00',
    sampleId: 'SAMP001',
    referenceNumber: 'REF001',
    patientName: 'John Doe',
    gender: 'Male',
    age: 35,
    department: 'Cardiology',
    status: 'Pending Approval',
    tests: ['Blood Test', 'ECG'],
    panels: ['Cardiac Panel'],
    fatherHusbandName: 'James Doe',
    lastScreeningDate: '2024-02-15',
    lastStudyCompletionDate: '2024-01-30',
    mobileNumber: '1234567890',
    hivCounsellingDone: 'Yes',
    fastingSince: '2024-03-20 08:00:00',
    fastingHours: 2,
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters = {
    date: searchParams.get('date') || '',
    referenceNumber: searchParams.get('referenceNumber') || '',
    name: searchParams.get('name') || '',
    department: searchParams.get('department') || '',
    status: searchParams.get('status') || '',
    test: searchParams.get('test') || '',
    panel: searchParams.get('panel') || '',
  };

  // Apply filters
  let filteredRequisitions = [...requisitions];
  if (filters.date) {
    filteredRequisitions = filteredRequisitions.filter(
      req => req.requisitionDateTime.startsWith(filters.date)
    );
  }
  if (filters.referenceNumber) {
    filteredRequisitions = filteredRequisitions.filter(
      req => req.referenceNumber.includes(filters.referenceNumber)
    );
  }
  if (filters.name) {
    filteredRequisitions = filteredRequisitions.filter(
      req => req.patientName.toLowerCase().includes(filters.name.toLowerCase())
    );
  }
  if (filters.department) {
    filteredRequisitions = filteredRequisitions.filter(
      req => req.department === filters.department
    );
  }
  if (filters.status) {
    filteredRequisitions = filteredRequisitions.filter(
      req => req.status === filters.status
    );
  }
  if (filters.test) {
    filteredRequisitions = filteredRequisitions.filter(
      req => req.tests.includes(filters.test)
    );
  }
  if (filters.panel) {
    filteredRequisitions = filteredRequisitions.filter(
      req => req.panels.includes(filters.panel)
    );
  }

  return NextResponse.json(filteredRequisitions);
}

export async function POST(request: Request) {
  const body = await request.json();
  
  // Generate new sample ID
  const newSampleId = `SAMP${String(requisitions.length + 1).padStart(3, '0')}`;
  
  const newRequisition: Requisition = {
    id: requisitions.length + 1,
    sampleId: newSampleId,
    status: 'Pending Approval',
    ...body,
  } as Requisition;

  requisitions.push(newRequisition);

  return NextResponse.json(newRequisition);
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, action, ...updateData } = body;

  const requisitionIndex = requisitions.findIndex(req => req.id === id);
  if (requisitionIndex === -1) {
    return NextResponse.json({ error: 'Requisition not found' }, { status: 404 });
  }

  switch (action) {
    case 'approve':
      requisitions[requisitionIndex].status = 'Approved';
      break;
    case 'cancel':
      requisitions[requisitionIndex].status = 'Cancelled';
      requisitions[requisitionIndex].cancellationReason = updateData.reason;
      break;
    case 'update':
      requisitions[requisitionIndex] = {
        ...requisitions[requisitionIndex],
        ...updateData,
      };
      break;
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  return NextResponse.json(requisitions[requisitionIndex]);
}
