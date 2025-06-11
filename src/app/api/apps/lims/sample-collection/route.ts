import { NextResponse } from 'next/server'

export type SampleCollectionType = {
  id: number
  sampleId: string
  employeeName: string
  employeeId: string
  collectedBy: string
  collectedOn: string
  sampleType: string
  collectionStatus: 'Pending' | 'Collected' | 'Rejected' | 'Outsourced'
  location: string
  laboratory: string
  remarks?: string
  barcodeId?: string
}

const dummyData: SampleCollectionType[] = [
  {
    id: 1,
    sampleId: 'SAMP001',
    employeeName: 'John Doe',
    employeeId: 'EMP001',
    collectedBy: 'Dr. Smith',
    collectedOn: '2024-03-20',
    sampleType: 'Blood',
    collectionStatus: 'Pending',
    location: 'Main Lab',
    laboratory: 'Central Lab',
    barcodeId: 'BAR001'
  },
  {
    id: 2,
    sampleId: 'SAMP002',
    employeeName: 'Jane Smith',
    employeeId: 'EMP002',
    collectedBy: 'Dr. Johnson',
    collectedOn: '2024-03-20',
    sampleType: 'Urine',
    collectionStatus: 'Collected',
    location: 'Branch Lab',
    laboratory: 'North Lab',
    barcodeId: 'BAR002'
  },
  {
    id: 3,
    sampleId: 'SAMP003',
    employeeName: 'Mike Johnson',
    employeeId: 'EMP003',
    collectedBy: 'Dr. Brown',
    collectedOn: '2024-03-19',
    sampleType: 'Blood',
    collectionStatus: 'Rejected',
    location: 'Main Lab',
    laboratory: 'Central Lab',
    barcodeId: 'BAR003'
  }
]

export async function GET() {
  return NextResponse.json(dummyData)
}

export async function POST(request: Request) {
  const data = await request.json()
  // Here you would typically save the data to a database
  return NextResponse.json({ success: true, data })
}

export async function PUT(request: Request) {
  const data = await request.json()
  // Here you would typically update the data in a database
  return NextResponse.json({ success: true, data })
}

export async function DELETE(request: Request) {
  const data = await request.json()
  // Here you would typically delete the data from a database
  return NextResponse.json({ success: true, data })
}
