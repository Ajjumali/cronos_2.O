import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/libs/auth';
import { getSession } from 'next-auth/react'
import type {
  TestResultType,
  TestType,
  LabDto,
  TestTypesResponse,
  LabsResponse,
  SampleTypeDto,
  LocationDto,
  ApiResponse
} from '@/types/apps/limsTypes'

// Mock data for test results
const mockTestResults: TestResultType[] = [
  {
    id: 1,
    registrationDateTime: '2024-03-09T10:00:00',
    sampleId: 1,
    volunteerId: '1234567890',
    gender: 'Male',
    name: 'John Doe',
    testPanelName: 'Blood Glucose',
    testId: 1,
    testName: 'Blood Glucose',
    result: '95',
    unit: 'mg/dL',
    referenceRange: '70-100',
    status: 'Completed',
    performedBy: 'John Doe',
    performedOn: '2024-03-09T10:00:00',
    verifiedBy: 'Jane Smith',
    verifiedOn: '2024-03-09T11:00:00',
    remarks: 'Normal range',
    activeFlag: 'Y',
    modifyBy: 'John Doe',
    modifyOn: '2024-03-09T11:00:00',
    projectNo: 'PROJ001',
    study: 'Study A',
    sampleType: 'Blood',
    location: 'Main Lab',
    referenceId: 'REF001',
    lab: 'Main Lab'
  },
  {
    id: 2,
    registrationDateTime: '2024-03-09T10:00:00',
    sampleId: 2,
    volunteerId: '2345678901',
    gender: 'Female',
    name: 'Jane Smith',
    testPanelName: 'Hemoglobin',
    testId: 2,
    testName: 'Hemoglobin',
    result: '14.2',
    unit: 'g/dL',
    referenceRange: '12-16',
    status: 'In Progress',
    performedBy: 'John Doe',
    performedOn: '2024-03-09T10:30:00',
    verifiedBy: '',
    verifiedOn: '',
    remarks: '',
    activeFlag: 'Y',
    modifyBy: 'John Doe',
    modifyOn: '2024-03-09T10:30:00',
    projectNo: 'PROJ002',
    study: 'Study B',
    sampleType: 'Urine',
    location: 'Satellite Lab',
    referenceId: 'REF002',
    lab: 'Satellite Lab'
  },
  {
    id: 3,
    registrationDateTime: '2024-03-09T10:00:00',
    sampleId: 3,
    volunteerId: '3456789012',
    gender: 'Male',
    name: 'Mike Johnson',
    testPanelName: 'Blood Glucose',
    testId: 1,
    testName: 'Blood Glucose',
    result: '120',
    unit: 'mg/dL',
    referenceRange: '70-100',
    status: 'Rejected',
    performedBy: 'Mike Johnson',
    performedOn: '2024-03-09T09:00:00',
    verifiedBy: 'Sarah Wilson',
    verifiedOn: '2024-03-09T09:30:00',
    remarks: 'Sample quality compromised',
    activeFlag: 'Y',
    modifyBy: 'Sarah Wilson',
    modifyOn: '2024-03-09T09:30:00',
    projectNo: 'PROJ003',
    study: 'Study C',
    sampleType: 'Saliva',
    location: 'Research Lab',
    referenceId: 'REF003',
    lab: 'Research Lab'
  },
  {
    id: 4,
    registrationDateTime: '2024-03-09T10:00:00',
    sampleId: 4,
    volunteerId: '4567890123',
    gender: 'Female',
    name: 'Sarah Wilson',
    testPanelName: 'Cholesterol',
    testId: 3,
    testName: 'Cholesterol',
    result: '',
    unit: 'mg/dL',
    referenceRange: '125-200',
    status: 'Pending',
    performedBy: '',
    performedOn: '',
    verifiedBy: '',
    verifiedOn: '',
    remarks: 'Awaiting sample processing',
    activeFlag: 'Y',
    modifyBy: 'System',
    modifyOn: '2024-03-09T08:00:00',
    projectNo: 'PROJ004',
    study: 'Study D',
    sampleType: 'Blood',
    location: 'Main Lab',
    referenceId: 'REF004',
    lab: 'Main Lab'
  },
  {
    id: 5,
    registrationDateTime: '2024-03-09T10:00:00',
    sampleId: 5,
    volunteerId: '5678901234',
    gender: 'Male',
    name: 'David Brown',
    testPanelName: 'Hemoglobin',
    testId: 2,
    testName: 'Hemoglobin',
    result: '15.5',
    unit: 'g/dL',
    referenceRange: '12-16',
    status: 'Completed',
    performedBy: 'Mike Johnson',
    performedOn: '2024-03-09T09:15:00',
    verifiedBy: 'Sarah Wilson',
    verifiedOn: '2024-03-09T09:45:00',
    remarks: 'Within normal range',
    activeFlag: 'Y',
    modifyBy: 'Sarah Wilson',
    modifyOn: '2024-03-09T09:45:00',
    projectNo: 'PROJ005',
    study: 'Study E',
    sampleType: 'Urine',
    location: 'Satellite Lab',
    referenceId: 'REF005',
    lab: 'Satellite Lab'
  }
]

// Mock data for test types
// const mockTestTypes: TestType[] = [
//   {
//     id: 1,
//     testName: 'Blood Glucose',
//     isActive: true,
//     createdBy: 'System',
//     createdOn: '2024-03-09T10:00:00',
//     updatedBy: 'System',
//     updatedOn: '2024-03-09T10:00:00'
//   },
//   {
//     id: 2,
//     testName: 'Hemoglobin',
//     isActive: true,
//     createdBy: 'System',
//     createdOn: '2024-03-09T10:00:00',
//     updatedBy: 'System',
//     updatedOn: '2024-03-09T10:00:00'
//   },
//   {
//     id: 3,
//     testName: 'Cholesterol',
//     isActive: true,
//     createdBy: 'System',
//     createdOn: '2024-03-09T10:00:00',
//     updatedBy: 'System',
//     updatedOn: '2024-03-09T10:00:00'
//   }
// ]

// // Mock data for labs
// const mockLabs: LabDto[] = [
//   {
//     id: 1,
//     labName: 'Main Lab',
//     activeFlag: 'Y'
//   },
//   {
//     id: 2,
//     labName: 'Satellite Lab',
//     activeFlag: 'Y'
//   }
// ]

// // Mock data for sample types
// const mockSampleTypes: SampleTypeDto[] = [
//   {
//     sampleId: 1,
//     sampleType: 'Blood',
//     activeFlag: 'Y'
//   },
//   {
//     sampleId: 2,
//     sampleType: 'Urine',
//     activeFlag: 'Y'
//   },
//   {
//     sampleId: 3,
//     sampleType: 'Saliva',
//     activeFlag: 'Y'
//   }
// ]

// // Mock data for locations
// const mockLocations: LocationDto[] = [
//   {
//     id: 1,
//     name: 'Main Lab',
//     activeFlag: 'Y'
//   },
//   {
//     id: 2,
//     name: 'Satellite Lab',
//     activeFlag: 'Y'
//   },
//   {
//     id: 3,
//     name: 'Research Lab',
//     activeFlag: 'Y'
//   }
// ]

// // Mock data for study protocols
// const mockStudyProtocols = [
//   {
//     id: 1,
//     studyProtocolNumber: 'PROJ001',
//     activeFlag: 'Y'
//   },
//   {
//     id: 2,
//     studyProtocolNumber: 'PROJ002',
//     activeFlag: 'Y'
//   },
//   {
//     id: 3,
//     studyProtocolNumber: 'PROJ003',
//     activeFlag: 'Y'
//   }
// ]

// // Mock data for study sites
// const mockStudySites = [
//   {
//     id: 1,
//     siteStudyNo: 'Study A',
//     activeFlag: 'Y'
//   },
//   {
//     id: 2,
//     siteStudyNo: 'Study B',
//     activeFlag: 'Y'
//   },
//   {
//     id: 3,
//     siteStudyNo: 'Study C',
//     activeFlag: 'Y'
//   }
// ]

interface APIErrorResult {
  message: string;
}

interface APIResult<T> {
  result: T;
  status: string;
  message?: string;
}

export const testResultsService = {
  async downloadFile(fileType: 'CSV' | 'PDF'): Promise<Blob> {
    try {
      const session = await getSession()
      if (!session?.user) {
        throw new Error('No active session found')
      }
      const token = (session.user as any).accessToken
      if (!token) {
        throw new Error('No access token found')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/testresults/download?fileType=${fileType}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to download file')
      }

      const contentType = fileType === 'CSV' ? 'text/csv' : 'application/pdf'
      const timestamp = new Date().toISOString().replace(/[:.]/g, '_')
      const fileName = `Test_Results_${timestamp}.${fileType.toLowerCase()}`

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      return blob
    } catch (error) {
      console.error('Error downloading file:', error)
      throw error
    }
  },

  async updateStatus(ids: number[], statusId: number, reason?: string): Promise<APIResult<boolean>> {
    try {
      const session = await getSession()
      if (!session?.user) {
        throw new Error('No active session found')
      }
      const token = (session.user as any).accessToken
      if (!token) {
        throw new Error('No access token found')
      }

      if (statusId === 2 && !reason) {
        throw new Error('Reason is required for rejection')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/testresults/update-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ids,
          statusId,
          reason
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update status')
      }

      return await response.json()
    } catch (error) {
      console.error('Error updating status:', error)
      throw error
    }
  },

  async updateRemark(id: number, remark: string): Promise<APIResult<boolean>> {
    try {
      const session = await getSession()
      if (!session?.user) {
        throw new Error('No active session found')
      }
      const token = (session.user as any).accessToken
      if (!token) {
        throw new Error('No access token found')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/testresults/update-remark`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id,
          remark
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update remark')
      }

      return await response.json()
    } catch (error) {
      console.error('Error updating remark:', error)
      throw error
    }
  },

  async getTestTypes() {
    try {
      const session = await getSession()
      if (!session?.user) {
        throw new Error('No active session found')
      }
      const token = (session.user as any).accessToken
      if (!token) {
        throw new Error('No access token found')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/testtype`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch test types')
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching test types:', error)
      throw error
    }
  },

  async getTestDetails(id: string | number): Promise<APIResult<any>> {
    try {
      const session = await getSession()
      if (!session?.user) {
        throw new Error('No active session found')
      }
      const token = (session.user as any).accessToken
      if (!token) {
        throw new Error('No access token found')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/testresults/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch test details')
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching test details:', error)
      throw error
    }
  },

  async getTestResults() {
    try {
      const session = await getSession()
      if (!session?.user) {
        throw new Error('No active session found')
      }
      const token = (session.user as any).accessToken
      if (!token) {
        throw new Error('No access token found')
      }

      // For development/testing, return mock data
      return { result: mockTestResults }

      // Uncomment below for actual API call
      // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/testresults/all`, {
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json'
      //   }
      // });

      // if (!response.ok) {
      //   const error = await response.json()
      //   throw new Error(error.message || 'Failed to fetch test results')
      // }

      // const data = await response.json()
      // return data.result
    } catch (error) {
      console.error('Error fetching test results:', error)
      throw error
    }
  },

  

//   getTestResultById: async (id: number): Promise<TestResultResponse> => {
//     const testResult = mockTestResults.find(test => test.id === id)
//     return { result: testResult }
//   },

//   getTests: async (): Promise<TestTypesResponse> => {
//     return { result: mockTestTypes }
//   },

//   getLabs: async (): Promise<LabsResponse> => {
//     return { result: mockLabs }
//   },

//   getSampleTypes: async (): Promise<ApiResponse<SampleTypeDto[]>> => {
//     return { result: mockSampleTypes }
//   },

//   getLocations: async (): Promise<ApiResponse<LocationDto[]>> => {
//     return { result: mockLocations }
//   },

//   updateTestResult: async (id: number, data: Partial<TestResultType>): Promise<TestResultResponse> => {
//     // In a real application, this would be an API call to update the test result
//     const index = mockTestResults.findIndex(test => test.id === id)
//     if (index !== -1) {
//       mockTestResults[index] = { ...mockTestResults[index], ...data }
//       return { result: mockTestResults[index] }
//     }
//     return { result: undefined }
//   },

//   addRemarks: async (id: number, remarks: string): Promise<TestResultResponse> => {
//     const index = mockTestResults.findIndex(test => test.id === id)
//     if (index !== -1) {
//       mockTestResults[index].remarks = remarks
//       return { result: mockTestResults[index] }
//     }
//     return { result: undefined }
//   },

//   getStudyProtocols: async (): Promise<ApiResponse<any[]>> => {
//     // In a real application, this would be an API call
//     return { result: mockStudyProtocols }
//   },

//   getStudyParentSite: async (id: number): Promise<ApiResponse<any[]>> => {
//     // In a real application, this would be an API call
//     return { result: mockStudySites }
//   }
 }

export async function GET_ALL() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = (session.user as any).accessToken;
    if (!token) {
      return NextResponse.json({ message: 'No access token found' }, { status: 401 });
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/testresults/all`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ message: error.message || 'Failed to fetch all test results' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data.result);
  } catch (error) {
    return NextResponse.json(
      { message: 'Internal server error' } as APIErrorResult,
      { status: 500 }
    );
  }
}

// export async function GET(request: NextRequest) {
//   const { searchParams } = new URL(request.url)
//   const id = searchParams.get('id')

//   if (id) {
//     const response = await testResultsService.getTestResultById(Number(id))
//     return NextResponse.json(response)
//   }

//   const response = await testResultsService.getTestResults()
//   return NextResponse.json(response)
// }

// export async function PUT(request: NextRequest) {
//   const { searchParams } = new URL(request.url)
//   const id = searchParams.get('id')
//   const data = await request.json()

//   if (!id) {
//     return NextResponse.json({ error: 'ID is required' }, { status: 400 })
//   }

//   const response = await testResultsService.updateTestResult(Number(id), data)
//   return NextResponse.json(response)
// }

// export async function POST(request: NextRequest) {
//   const { searchParams } = new URL(request.url)
//   const id = searchParams.get('id')
//   const { remarks } = await request.json()

//   if (!id) {
//     return NextResponse.json({ error: 'ID is required' }, { status: 400 })
//   }

//   const response = await testResultsService.addRemarks(Number(id), remarks)
//   return NextResponse.json(response)
// } 