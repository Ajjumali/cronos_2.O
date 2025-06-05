import { NextResponse } from 'next/server'

// Dummy data for auto-approval
const dummyAutoApprovalData = [
  {
    id: 1,
    testName: 'Complete Blood Count',
    analyteCode: 'CBC',
    instrumentName: 'Hematology Analyzer',
    referenceRange: '4.5-11.0 x10^9/L',
    approvalCondition: 'Within Range',
    effectiveDate: '2024-03-01',
    version: 1,
    status: 'active'
  },
  {
    id: 2,
    testName: 'Glucose',
    analyteCode: 'GLU',
    instrumentName: 'Chemistry Analyzer',
    referenceRange: '70-99 mg/dL',
    approvalCondition: 'Within Range',
    effectiveDate: '2024-03-01',
    version: 1,
    status: 'active'
  },
  {
    id: 3,
    testName: 'Cholesterol',
    analyteCode: 'CHOL',
    instrumentName: 'Chemistry Analyzer',
    referenceRange: '<200 mg/dL',
    approvalCondition: 'Below Range',
    effectiveDate: '2024-03-01',
    version: 1,
    status: 'inactive'
  }
]

export const autoApprovalService = {
  getAllAutoApprovals: async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    return dummyAutoApprovalData
  },

  updateAutoApproval: async (id: number, data: any) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    return { success: true, message: 'Auto-approval updated successfully' }
  },

  createAutoApproval: async (data: any) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    return { success: true, message: 'Auto-approval created successfully' }
  }
}

export async function GET() {
  try {
    const data = await autoApprovalService.getAllAutoApprovals()
    return NextResponse.json({ status: 'success', result: data })
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Failed to fetch auto-approval data' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const result = await autoApprovalService.createAutoApproval(data)
    return NextResponse.json({ status: 'success', result })
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Failed to create auto-approval' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()
    const result = await autoApprovalService.updateAutoApproval(data.id, data)
    return NextResponse.json({ status: 'success', result })
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Failed to update auto-approval' }, { status: 500 })
  }
} 