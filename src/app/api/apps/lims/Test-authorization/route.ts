import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/libs/auth';
import { getSession } from 'next-auth/react'
import type {
  TestAuthorizationType,
  TestType,
  LabDto,
  TestTypesResponse,
  LabsResponse,
  SampleTypeDto,
  LocationDto,
  ApiResponse
} from '@/types/apps/limsTypes'

// Mock data for test authorizations
const mockTestAuthorizations: TestAuthorizationType[] = [
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
    authorizationStatus: 'Approved',
    authorizedBy: 'Dr. Smith',
    authorizedOn: '2024-03-09T10:30:00',
    remarks: 'All parameters within normal range',
    activeFlag: 'Y',
    modifyBy: 'Dr. Smith',
    modifyOn: '2024-03-09T10:30:00',
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
    authorizationStatus: 'Pending',
    authorizedBy: '',
    authorizedOn: '',
    remarks: 'Awaiting review',
    activeFlag: 'Y',
    modifyBy: 'System',
    modifyOn: '2024-03-09T10:00:00',
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
    authorizationStatus: 'Rejected',
    authorizedBy: 'Dr. Wilson',
    authorizedOn: '2024-03-09T09:30:00',
    remarks: 'Sample quality issues',
    activeFlag: 'Y',
    modifyBy: 'Dr. Wilson',
    modifyOn: '2024-03-09T09:30:00',
    projectNo: 'PROJ003',
    study: 'Study C',
    sampleType: 'Saliva',
    location: 'Research Lab',
    referenceId: 'REF003',
    lab: 'Research Lab'
  }
]

interface APIErrorResult {
  message: string;
}

interface APIResult<T> {
  result: T;
  status: string;
  message?: string;
}

class TestAuthorizationService {
  async downloadFile(fileType: 'CSV' | 'PDF'): Promise<Blob> {
    // Implementation for downloading authorization reports
    const mockData = mockTestAuthorizations;
    const csvContent = this.convertToCSV(mockData);
    return new Blob([csvContent], { type: 'text/csv' });
  }

  private convertToCSV(data: TestAuthorizationType[]): string {
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(item => Object.values(item).join(','));
    return [headers, ...rows].join('\n');
  }

  async updateAuthorizationStatus(ids: number[], status: string, reason?: string): Promise<APIResult<boolean>> {
    try {
      // In a real implementation, this would update the database
      mockTestAuthorizations.forEach(auth => {
        if (ids.includes(auth.id)) {
          auth.authorizationStatus = status;
          auth.remarks = reason || auth.remarks;
          auth.modifyBy = 'Current User'; // This would be the actual user
          auth.modifyOn = new Date().toISOString();
        }
      });

      return {
        result: true,
        status: 'success',
        message: 'Authorization status updated successfully'
      };
    } catch (error) {
      return {
        result: false,
        status: 'error',
        message: 'Failed to update authorization status'
      };
    }
  }

  async updateRemark(id: number, remark: string): Promise<APIResult<boolean>> {
    try {
      const authorization = mockTestAuthorizations.find(auth => auth.id === id);
      if (!authorization) {
        throw new Error('Authorization not found');
      }

      authorization.remarks = remark;
      authorization.modifyBy = 'Current User'; // This would be the actual user
      authorization.modifyOn = new Date().toISOString();

      return {
        result: true,
        status: 'success',
        message: 'Remark updated successfully'
      };
    } catch (error) {
      return {
        result: false,
        status: 'error',
        message: 'Failed to update remark'
      };
    }
  }

  async getTestTypes() {
    // Implementation for getting test types
    return {
      result: [],
      status: 'success'
    };
  }

  async getAuthorizationDetails(id: string | number): Promise<APIResult<any>> {
    try {
      const authorization = mockTestAuthorizations.find(auth => auth.id === Number(id));
      if (!authorization) {
        throw new Error('Authorization not found');
      }

      return {
        result: authorization,
        status: 'success'
      };
    } catch (error) {
      return {
        result: null,
        status: 'error',
        message: 'Failed to fetch authorization details'
      };
    }
  }

  async getTestAuthorizations() {
    try {
      return {
        result: mockTestAuthorizations,
        status: 'success'
      };
    } catch (error) {
      return {
        result: [],
        status: 'error',
        message: 'Failed to fetch test authorizations'
      };
    }
  }
}

export const testAuthorizationService = new TestAuthorizationService();

export async function GET_ALL() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = new TestAuthorizationService();
    const response = await service.getTestAuthorizations();
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const service = new TestAuthorizationService();
    const response = await service.getAuthorizationDetails(id);
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const service = new TestAuthorizationService();

    if (body.action === 'updateStatus') {
      const response = await service.updateAuthorizationStatus(
        body.ids,
        body.status,
        body.reason
      );
      return NextResponse.json(response);
    } else if (body.action === 'updateRemark') {
      const response = await service.updateRemark(body.id, body.remark);
      return NextResponse.json(response);
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 