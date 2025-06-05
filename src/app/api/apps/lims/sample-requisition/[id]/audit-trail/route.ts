import { NextResponse } from 'next/server';

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

// Dummy data for demonstration
const auditTrailData: { [key: number]: AuditTrailEntry[] } = {
  1: [
    {
      id: 1,
      action: 'Create',
      description: 'Sample requisition created',
      triggeredBy: 'John Doe',
      triggeredOn: '2024-03-20T10:30:00Z',
      status: 'Success',
      volunteerId: 'VOL001',
      barcodeId: 'BAR001'
    },
    {
      id: 2,
      action: 'Approve',
      description: 'Sample requisition approved',
      triggeredBy: 'Jane Smith',
      triggeredOn: '2024-03-20T11:00:00Z',
      status: 'Success',
      volunteerId: 'VOL001',
      barcodeId: 'BAR001'
    }
  ]
};

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid requisition ID' }, { status: 400 });
  }

  const auditTrail = auditTrailData[id] || [];
  
  return NextResponse.json(auditTrail);
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid requisition ID' }, { status: 400 });
  }

  const body = await request.json();
  
  const newEntry: AuditTrailEntry = {
    id: (auditTrailData[id]?.length || 0) + 1,
    ...body,
    triggeredOn: new Date().toISOString()
  };

  if (!auditTrailData[id]) {
    auditTrailData[id] = [];
  }

  auditTrailData[id].push(newEntry);

  return NextResponse.json(newEntry);
} 