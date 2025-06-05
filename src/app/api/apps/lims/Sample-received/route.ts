import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';


// eslint-disable-next-line import/no-unresolved
import { authOptions } from '@/libs/auth';

interface APIErrorResult {
  message: string;
}


export interface AuditTrailType {
  actionPerformed: string
  description: string
  triggeredBy: string
  triggeredOn: string
  status: string
  reason?: string
  volunteerId?: string
  barcodeId?: string
  sampleSendBy?: string
  sampleSendOn?: string
}

// export const sampleReceivedService = {
//   async downloadFile(fileType: 'CSV' | 'PDF'): Promise<Blob> {
//     try {
//       const session = await getSession()
//       if (!session?.user) {
//         throw new Error('No active session found')
//       }
//       const token = (session.user as any).accessToken
//       if (!token) {
//         throw new Error('No access token found')
//       }

//       const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/samplereceive/download?fileType=${fileType}`, {
//         method: 'GET',
//         headers: {
//           'Authorization': `Bearer ${token}`
//         }
//       })

//       if (!response.ok) {
//         throw new Error('Failed to download file')
//       }

//       const contentType = fileType === 'CSV' ? 'text/csv' : 'application/pdf'
//       const timestamp = new Date().toISOString().replace(/[:.]/g, '_')
//       const fileName = `Sample_Received_${timestamp}.${fileType.toLowerCase()}`

//       const blob = await response.blob()
//       const url = window.URL.createObjectURL(blob)
//       const a = document.createElement('a')
//       a.href = url
//       a.download = fileName
//       document.body.appendChild(a)
//       a.click()
//       window.URL.revokeObjectURL(url)
//       document.body.removeChild(a)

//       return blob
//     } catch (error) {
//       console.error('Error downloading file:', error)
//       throw error
//     }
//   },
//   async updateStatus(ids: number[], statusId: number, reason?: string): Promise<APIResult<boolean>> {
//     try {
//       const session = await getSession()
//       if (!session?.user) {
//         throw new Error('No active session found')
//       }
//       const token = (session.user as any).accessToken
//       if (!token) {
//         throw new Error('No access token found')
//       }

//       if (statusId === 2 && !reason) {
//         throw new Error('Reason is required for rejection')
//       }

//       const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/samplereceive/update-status`, {
//         method: 'PUT',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//           ids,
//           statusId,
//           reason
//         })
//       })

//       if (!response.ok) {
//         const error = await response.json()
//         throw new Error(error.message || 'Failed to update status')
//       }

//       return await response.json()
//     } catch (error) {
//       console.error('Error updating status:', error)
//       throw error
//     }
//   },
//   async updateRemark(id: number, remark: string): Promise<APIResult<boolean>> {
//     try {
//       const session = await getSession()
//       if (!session?.user) {
//         throw new Error('No active session found')
//       }
//       const token = (session.user as any).accessToken
//       if (!token) {
//         throw new Error('No access token found')
//       }

//       const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/samplereceive/update-remark`, {
//         method: 'PUT',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//           id,
//           remark
//         })
//       })

//       if (!response.ok) {
//         const error = await response.json()
//         throw new Error(error.message || 'Failed to update remark')
//       }

//       return await response.json()
//     } catch (error) {
//       console.error('Error updating remark:', error)
//       throw error
//     }
//   },
  
  
  
//   async getSampleDetails(id: string | number): Promise<APIResult<any>> {
//     try {
//       const session = await getSession()
//       if (!session?.user) {
//         throw new Error('No active session found')
//       }
//       const token = (session.user as any).accessToken
//       if (!token) {
//         throw new Error('No access token found')
//       }

//       const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/samplereceive/${id}`, {
//         method: 'GET',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       })

//       if (!response.ok) {
//         const error = await response.json()
//         throw new Error(error.message || 'Failed to fetch sample details')
//       }

//       return await response.json()
//     } catch (error) {
//       console.error('Error fetching sample details:', error)
//       throw error
//     }
//   },
//   async getSampleReceived() {
//     try {
//       const session = await getSession()
//       if (!session?.user) {
//         throw new Error('No active session found')
//       }
//       const token = (session.user as any).accessToken
//       if (!token) {
//         throw new Error('No access token found')
//       }

//       const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/samplereceive/all`, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       if (!response.ok) {
//         const error = await response.json()
//         throw new Error(error.message || 'Failed to fetch samplereceive')
//       }

//       const data = await response.json()
//       return data.result
//     } catch (error) {
//       console.error('Error fetching samplereceive:', error)
//       throw error
//     }
//   },
//   async getAuditTrail(sampleId: number): Promise<APIResult<AuditTrailType[]>> {
//     try {
//       const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sample-received/${sampleId}/audit-trail`, {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       })

//       if (!response.ok) {
//         throw new Error('Failed to fetch audit trail')
//       }

//       const data = await response.json()
//       return {
//         status: 'success',
//         result: data
//       }
//     } catch (error) {
//       console.error('Error fetching audit trail:', error)
//       return {
//         status: 'error',
//         result: [],
//         message: error instanceof Error ? error.message : 'Failed to fetch audit trail'
//       }
//     }
//   }
// }
 

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

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/receive/all`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();

      
return NextResponse.json({ message: error.message || 'Failed to fetch all samples' }, { status: response.status });
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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = (session.user as any).accessToken;

    if (!token) {
      return NextResponse.json({ message: 'No access token found' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/receive/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();

        
return NextResponse.json({ message: error.message || 'Failed to fetch sample details' }, { status: response.status });
      }

      const data = await response.json();

      
return NextResponse.json(data);
    }

    return GET_ALL();
  } catch (error) {
    return NextResponse.json(
      { message: 'Internal server error' } as APIErrorResult,
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = (session.user as any).accessToken;

    if (!token) {
      return NextResponse.json({ message: 'No access token found' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const body = await request.json();

    if (action === 'status') {
      const { ids, statusId, reason } = body;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/receive/update-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids, statusId, reason })
      });

      if (!response.ok) {
        const error = await response.json();

        
return NextResponse.json({ message: error.message || 'Failed to update status' }, { status: response.status });
      }

      return NextResponse.json(await response.json());
    }

    if (action === 'remark') {
      const { id, remark } = body;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/receive/update-remark`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, remark })
      });

      if (!response.ok) {
        const error = await response.json();

        
return NextResponse.json({ message: error.message || 'Failed to update remark' }, { status: response.status });
      }

      return NextResponse.json(await response.json());
    }

    return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { message: 'Internal server error' } as APIErrorResult,
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = (session.user as any).accessToken;

    if (!token) {
      return NextResponse.json({ message: 'No access token found' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'download') {
      const { fileType } = await request.json();

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/receive/download?fileType=${fileType}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();

        
return NextResponse.json({ message: error.message || 'Failed to download file' }, { status: response.status });
      }

      const blob = await response.blob();

      
return new NextResponse(blob, {
        headers: {
          'Content-Type': fileType === 'CSV' ? 'text/csv' : 'application/pdf',
          'Content-Disposition': `attachment; filename="Sample_Received_${new Date().toISOString().replace(/[:.]/g, '_')}.${fileType.toLowerCase()}"`
        }
      });
    }

    if (action === 'print-barcode') {
      const { sampleId, barcodeId, noOfPrint, printType } = await request.json();
      
      if (!sampleId || !barcodeId) {
        return NextResponse.json({ message: 'Sample ID and Barcode ID are required' }, { status: 400 });
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/receive/print-barcode`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sampleId,
          barcodeId,
          noOfPrint: noOfPrint || 1,
          printType: printType || 'pdf'
        })
      });

      if (!response.ok) {
        const error = await response.json();

        
return NextResponse.json({ message: error.message || 'Failed to print barcode' }, { status: response.status });
      }

      // If printType is 'printer', return success message
      if (printType === 'printer') {
        return NextResponse.json({ message: 'Barcode sent to printer successfully' });
      }

      // For PDF type, return the PDF blob
      const blob = await response.blob();

      
return new NextResponse(blob, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="Barcode_${barcodeId}_${new Date().toISOString().replace(/[:.]/g, '_')}.pdf"`
        }
      });
    }

    return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { message: 'Internal server error' } as APIErrorResult,
      { status: 500 }
    );
  }
}





