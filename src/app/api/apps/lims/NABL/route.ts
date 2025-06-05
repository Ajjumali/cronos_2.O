import { NextResponse } from 'next/server'

// Mock data store (replace with actual database in production)
let accreditationData = [
  {
    id: 1,
    fromDate: '2024-01-01',
    toDate: '2024-12-31',
    testCount: 3,
    accreditationType: 'NABL',
    tests: [
      {
        id: 1,
        testName: 'Blood Test',
        addedBy: 'John Doe',
        addedOn: '2024-01-01',
        modifiedBy: 'John Doe',
        modifiedOn: '2024-01-01',
        remarks: 'Initial test'
      },
      {
        id: 2,
        testName: 'Urine Test',
        addedBy: 'John Doe',
        addedOn: '2024-01-01',
        modifiedBy: 'John Doe',
        modifiedOn: '2024-01-01',
        remarks: 'Initial test'
      },
      {
        id: 3,
        testName: 'X-Ray',
        addedBy: 'John Doe',
        addedOn: '2024-01-01',
        modifiedBy: 'John Doe',
        modifiedOn: '2024-01-01',
        remarks: 'Initial test'
      }
    ]
  },
  {
    id: 2,
    fromDate: '2024-02-01',
    toDate: '2025-01-31',
    testCount: 2,
    accreditationType: 'NABL',
    tests: [
      {
        id: 1,
        testName: 'MRI Scan',
        addedBy: 'Jane Smith',
        addedOn: '2024-02-01',
        modifiedBy: 'Jane Smith',
        modifiedOn: '2024-02-01',
        remarks: 'New test added'
      },
      {
        id: 2,
        testName: 'CT Scan',
        addedBy: 'Jane Smith',
        addedOn: '2024-02-01',
        modifiedBy: 'Jane Smith',
        modifiedOn: '2024-02-01',
        remarks: 'New test added'
      }
    ]
  },
  {
    id: 3,
    fromDate: '2024-03-01',
    toDate: '2025-02-28',
    testCount: 4,
    accreditationType: 'NABL',
    tests: [
      {
        id: 1,
        testName: 'ECG',
        addedBy: 'Mike Johnson',
        addedOn: '2024-03-01',
        modifiedBy: 'Mike Johnson',
        modifiedOn: '2024-03-01',
        remarks: 'Cardiac test'
      },
      {
        id: 2,
        testName: 'Echocardiogram',
        addedBy: 'Mike Johnson',
        addedOn: '2024-03-01',
        modifiedBy: 'Mike Johnson',
        modifiedOn: '2024-03-01',
        remarks: 'Cardiac test'
      },
      {
        id: 3,
        testName: 'Stress Test',
        addedBy: 'Mike Johnson',
        addedOn: '2024-03-01',
        modifiedBy: 'Mike Johnson',
        modifiedOn: '2024-03-01',
        remarks: 'Cardiac test'
      },
      {
        id: 4,
        testName: 'Holter Monitor',
        addedBy: 'Mike Johnson',
        addedOn: '2024-03-01',
        modifiedBy: 'Mike Johnson',
        modifiedOn: '2024-03-01',
        remarks: 'Cardiac test'
      }
    ]
  },
  {
    id: 4,
    fromDate: '2024-04-01',
    toDate: '2025-03-31',
    testCount: 3,
    accreditationType: 'NABL',
    tests: [
      {
        id: 1,
        testName: 'Ultrasound',
        addedBy: 'Sarah Wilson',
        addedOn: '2024-04-01',
        modifiedBy: 'Sarah Wilson',
        modifiedOn: '2024-04-01',
        remarks: 'Imaging test'
      },
      {
        id: 2,
        testName: 'Mammography',
        addedBy: 'Sarah Wilson',
        addedOn: '2024-04-01',
        modifiedBy: 'Sarah Wilson',
        modifiedOn: '2024-04-01',
        remarks: 'Imaging test'
      },
      {
        id: 3,
        testName: 'Bone Density',
        addedBy: 'Sarah Wilson',
        addedOn: '2024-04-01',
        modifiedBy: 'Sarah Wilson',
        modifiedOn: '2024-04-01',
        remarks: 'Imaging test'
      }
    ]
  }
]

// GET all accreditations
export async function GET() {
  return NextResponse.json(accreditationData)
}

// POST new accreditation
export async function POST(request: Request) {
  const data = await request.json()
  const newAccreditation = {
    id: Date.now(),
    ...data
  }
  accreditationData.push(newAccreditation)
  return NextResponse.json(newAccreditation)
}

// PUT update accreditation
export async function PUT(request: Request) {
  const data = await request.json()
  const index = accreditationData.findIndex(item => item.id === data.id)
  if (index !== -1) {
    accreditationData[index] = data
    return NextResponse.json(data)
  }
  return NextResponse.json({ error: 'Accreditation not found' }, { status: 404 })
}

// DELETE accreditation
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = parseInt(searchParams.get('id') || '0')
  const index = accreditationData.findIndex(item => item.id === id)
  if (index !== -1) {
    const deleted = accreditationData.splice(index, 1)[0]
    return NextResponse.json(deleted)
  }
  return NextResponse.json({ error: 'Accreditation not found' }, { status: 404 })
}
