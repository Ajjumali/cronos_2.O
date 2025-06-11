/* eslint-disable import/no-unresolved */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/libs/auth';

// Types
interface Sample {
  id: string;
  registrationDateTime: string;
  sampleId: string;
  subjectId: string;
  gender: string;
  name: string;
  company: string;
  branch: string;
  type: 'human' | 'animal';
  laboratory: string;
  department: string;
  testStatus: string;
  test: string;
  panel: string;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
  auditTrail?: Array<{
    action: string;
    timestamp: string;
    user: string;
    details: string;
    status: string;
    reason?: string;
  }>;
}

interface APIErrorResult {
  message: string;
  details?: string;
}

// Dummy data for sample registration
const samples: Sample[] = [
  {
    id: '1',
    registrationDateTime: '2024-03-20 10:00',
    sampleId: 'SAMP001',
    subjectId: 'EMP001',
    gender: 'Male',
    name: 'John Doe',
    company: 'Company A',
    branch: 'Branch 1',
    type: 'human',
    laboratory: 'lab1',
    department: 'dept1',
    testStatus: 'pending',
    test: 'test1',
    panel: 'panel1',
  },
  {
    id: '2',
    registrationDateTime: '2024-03-20 11:00',
    sampleId: 'SAMP002',
    subjectId: 'ANI001',
    gender: 'Female',
    name: 'Lab Rat 1',
    company: 'Research Lab',
    branch: 'Branch 2',
    type: 'animal',
    laboratory: 'lab2',
    department: 'dept2',
    testStatus: 'completed',
    test: 'test2',
    panel: 'panel2',
  },
  {
    id: '3',
    registrationDateTime: '2024-03-20 12:30',
    sampleId: 'SAMP003',
    subjectId: 'EMP002',
    gender: 'Female',
    name: 'Jane Smith',
    company: 'Company B',
    branch: 'Branch 3',
    type: 'human',
    laboratory: 'lab1',
    department: 'dept3',
    testStatus: 'in_progress',
    test: 'test3',
    panel: 'panel1',
  },
  {
    id: '4',
    registrationDateTime: '2024-03-20 13:45',
    sampleId: 'SAMP004',
    subjectId: 'ANI002',
    gender: 'Male',
    name: 'Lab Mouse 1',
    company: 'Research Lab',
    branch: 'Branch 2',
    type: 'animal',
    laboratory: 'lab2',
    department: 'dept2',
    testStatus: 'pending',
    test: 'test4',
    panel: 'panel3',
  },
  {
    id: '5',
    registrationDateTime: '2024-03-20 14:15',
    sampleId: 'SAMP005',
    subjectId: 'EMP003',
    gender: 'Male',
    name: 'Robert Johnson',
    company: 'Company A',
    branch: 'Branch 1',
    type: 'human',
    laboratory: 'lab3',
    department: 'dept1',
    testStatus: 'completed',
    test: 'test1',
    panel: 'panel2',
  },
  {
    id: '6',
    registrationDateTime: '2024-03-20 15:00',
    sampleId: 'SAMP006',
    subjectId: 'EMP004',
    gender: 'Female',
    name: 'Sarah Williams',
    company: 'Company C',
    branch: 'Branch 4',
    type: 'human',
    laboratory: 'lab1',
    department: 'dept4',
    testStatus: 'in_progress',
    test: 'test5',
    panel: 'panel1',
  },
  {
    id: '7',
    registrationDateTime: '2024-03-20 16:20',
    sampleId: 'SAMP007',
    subjectId: 'ANI003',
    gender: 'Female',
    name: 'Lab Rabbit 1',
    company: 'Research Lab',
    branch: 'Branch 2',
    type: 'animal',
    laboratory: 'lab2',
    department: 'dept2',
    testStatus: 'pending',
    test: 'test6',
    panel: 'panel3',
  },
  {
    id: '8',
    registrationDateTime: '2024-03-20 17:30',
    sampleId: 'SAMP008',
    subjectId: 'EMP005',
    gender: 'Male',
    name: 'Michael Brown',
    company: 'Company B',
    branch: 'Branch 3',
    type: 'human',
    laboratory: 'lab3',
    department: 'dept3',
    testStatus: 'completed',
    test: 'test2',
    panel: 'panel2',
  }
];

// Helper function to filter samples
function filterSamples(samples: Sample[], searchParams: URLSearchParams): Sample[] {
  let filteredSamples = [...samples];

  const fromDate = searchParams.get('fromDate');
  const toDate = searchParams.get('toDate');
  const laboratory = searchParams.get('laboratory');
  const subjectId = searchParams.get('subjectId');
  const department = searchParams.get('department');
  const testStatus = searchParams.get('testStatus');
  const test = searchParams.get('test');
  const panel = searchParams.get('panel');

  if (fromDate) {
    filteredSamples = filteredSamples.filter(sample => 
      new Date(sample.registrationDateTime) >= new Date(fromDate)
    );
  }

  if (toDate) {
    filteredSamples = filteredSamples.filter(sample => 
      new Date(sample.registrationDateTime) <= new Date(toDate)
    );
  }

  if (laboratory) {
    filteredSamples = filteredSamples.filter(sample => 
      sample.laboratory === laboratory
    );
  }

  if (subjectId) {
    filteredSamples = filteredSamples.filter(sample => 
      sample.subjectId === subjectId
    );
  }

  if (department) {
    filteredSamples = filteredSamples.filter(sample => 
      sample.department === department
    );
  }

  if (testStatus) {
    filteredSamples = filteredSamples.filter(sample => 
      sample.testStatus === testStatus
    );
  }

  if (test) {
    filteredSamples = filteredSamples.filter(sample => 
      sample.test === test
    );
  }

  if (panel) {
    filteredSamples = filteredSamples.filter(sample => 
      sample.panel === panel
    );
  }

  return filteredSamples;
}

// // Helper function to add audit trail
function addAuditTrail(sample: Sample, action: string, details: string, status: string = 'success', reason?: string) {
  if (!sample.auditTrail) {
    sample.auditTrail = [];
  }
  
  sample.auditTrail.push({
    action,
    timestamp: new Date().toISOString(),
    user: 'current-user', // Replace with actual user
    details,
    status,
    reason
  });
}

// Helper function to handle errors
function handleError(error: any, action: string) {
  console.error(`Error during ${action}:`, error);
  
return NextResponse.json({ 
    error: `Failed to ${action}`,
    details: error.message 
  }, { status: 500 });
}

// GET /api/apps/lims/sample-registration
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Return the dummy data
    return NextResponse.json(samples);
  } catch (error) {
    return NextResponse.json(
      { message: 'Internal server error' } as APIErrorResult,
      { status: 500 }
    );
  }
}

// // GET /api/apps/lims/sample-registration/[id]
// export async function GET_BY_ID(request: NextRequest, { params }: { params: { id: string } }) {
//   try {
//     const sample = samples.find(s => s.id === params.id);

//     if (!sample) {
//       return NextResponse.json({ error: 'Sample not found' }, { status: 404 });
//     }
    
//     // Log the view action
//     console.log(`Sample ${params.id} viewed`);
    
//     return NextResponse.json(sample);
//   } catch (error) {
//     return handleError(error, 'get sample');
//   }
// }

// // POST /api/apps/lims/sample-registration
// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json();
    
//     // Validate required fields
//     if (!body.sampleId || !body.subjectId || !body.type) {
//       return NextResponse.json({ 
//         error: 'Missing required fields',
//         required: ['sampleId', 'subjectId', 'type']
//       }, { status: 400 });
//     }

//     const newSample: Sample = {
//       id: (samples.length + 1).toString(),
//       registrationDateTime: new Date().toISOString(),
//       ...body,
//       lastModifiedBy: 'current-user', // Replace with actual user
//       lastModifiedAt: new Date().toISOString()
//     };

//     // Add initial audit trail
//     addAuditTrail(newSample, 'Created', 'Sample registered successfully');
    
//     samples.push(newSample);
    
//     // Log the creation
//     console.log(`New sample created: ${newSample.sampleId}`);
    
//     return NextResponse.json(newSample, { status: 201 });
//   } catch (error) {
//     return handleError(error, 'create sample');
//   }
// }

// // PUT /api/apps/lims/sample-registration/[id]
// export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
//   try {
//     const body = await request.json();
//     const index = samples.findIndex(s => s.id === params.id);
    
//     if (index === -1) {
//       return NextResponse.json({ error: 'Sample not found' }, { status: 404 });
//     }

//     const oldSample = samples[index];

//     const updatedSample: Sample = {
//       ...oldSample,
//       ...body,
//       lastModifiedBy: 'current-user', // Replace with actual user
//       lastModifiedAt: new Date().toISOString()
//     };

//     // Add audit trail for changes
//     const changes = Object.keys(body).filter(key => oldSample[key as keyof Sample] !== body[key]);

//     if (changes.length > 0) {
//       addAuditTrail(updatedSample, 'Updated', `Fields updated: ${changes.join(', ')}`);
//     }

//     samples[index] = updatedSample;
    
//     // Log the update
//     console.log(`Sample ${params.id} updated: ${changes.join(', ')}`);
    
//     return NextResponse.json(updatedSample);
//   } catch (error) {
//     return handleError(error, 'update sample');
//   }
// }

// // DELETE /api/apps/lims/sample-registration/[id]
// export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
//   try {
//     const index = samples.findIndex(s => s.id === params.id);
    
//     if (index === -1) {
//       return NextResponse.json({ error: 'Sample not found' }, { status: 404 });
//     }

//     const sample = samples[index];
    
//     // Add audit trail before deletion
//     addAuditTrail(sample, 'Deleted', 'Sample deleted');
    
//     samples.splice(index, 1);
    
//     // Log the deletion
//     console.log(`Sample ${params.id} deleted`);
    
//     return NextResponse.json({ message: 'Sample deleted successfully' });
//   } catch (error) {
//     return handleError(error, 'delete sample');
//   }
// }

// // GET /api/apps/lims/sample-registration/[id]/audit-trail
// export async function GET_AUDIT_TRAIL(request: NextRequest, { params }: { params: { id: string } }) {
//   try {
//     const sample = samples.find(s => s.id === params.id);
    
//     if (!sample) {
//       return NextResponse.json({ error: 'Sample not found' }, { status: 404 });
//     }

//     // Log the audit trail view
//     console.log(`Audit trail viewed for sample ${params.id}`);
    
//     return NextResponse.json(sample.auditTrail || []);
//   } catch (error) {
//     return handleError(error, 'get audit trail');
//   }
// }

// // GET /api/apps/lims/sample-registration/export/pdf
// export async function EXPORT_PDF(request: NextRequest) {
//   try {
//     const searchParams = request.nextUrl.searchParams;
    
//     // Log the PDF export
//     console.log('PDF export requested with filters:', Object.fromEntries(searchParams.entries()));
    
//     // TODO: Implement PDF generation
//     return NextResponse.json({ message: 'PDF export not implemented' });
//   } catch (error) {
//     return handleError(error, 'export PDF');
//   }
// }

// // GET /api/apps/lims/sample-registration/export/excel
// export async function EXPORT_EXCEL(request: NextRequest) {
//   try {
//     const searchParams = request.nextUrl.searchParams;
    
//     // Log the Excel export
//     console.log('Excel export requested with filters:', Object.fromEntries(searchParams.entries()));
    
//     // TODO: Implement Excel generation
//     return NextResponse.json({ message: 'Excel export not implemented' });
//   } catch (error) {
//     return handleError(error, 'export Excel');
//   }
// }

// // POST /api/apps/lims/sample-registration/[id]/print-barcode
// export async function PRINT_BARCODE(request: NextRequest, { params }: { params: { id: string } }) {
//   try {
//     const sample = samples.find(s => s.id === params.id);
    
//     if (!sample) {
//       return NextResponse.json({ error: 'Sample not found' }, { status: 404 });
//     }

//     // Log the barcode print
//     console.log(`Barcode print requested for sample ${params.id}`);
    
//     // TODO: Implement barcode generation
//     return NextResponse.json({ message: 'Barcode generation not implemented' });
//   } catch (error) {
//     return handleError(error, 'print barcode');
//   }
// }

