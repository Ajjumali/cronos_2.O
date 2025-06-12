import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/libs/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = (session.user as any).accessToken;
    if (!token) {
      return NextResponse.json({ message: 'No access token found' }, { status: 401 });
    }

    const { studyId } = await request.json();
    if (!studyId) {
      return NextResponse.json({ message: 'Study ID is required' }, { status: 400 });
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/personal/setstudy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ studyId })
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ message: error.message || 'Failed to set study' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 