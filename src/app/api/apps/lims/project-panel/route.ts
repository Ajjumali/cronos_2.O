import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/libs/auth';

export interface SiteItem  {
  studyNo: string | null;
  siteName: string | null;
};

export interface ProjectStudyItem  {
  studyNo: string | null;
  shortTitle: string;
  isEnabled: boolean;
  rowNo: number;
  sites: SiteItem[];
};

interface ProjectStudyApiResponse {
  result: ProjectStudyItem[];
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = (session.user as any).accessToken;
    if (!token) {
      return NextResponse.json({ message: 'No access token found' }, { status: 401 });
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/personal/getdutydelegation?userId=${(session.user as any).iUserId}&userTypeId=${(session.user as any).userTypeId}&pageIndex=1&queryText=`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ message: error.message || 'Failed to fetch project list' }, { status: response.status });
    }

    const data = await response.json() as ProjectStudyApiResponse;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}