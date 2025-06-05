import { toast } from 'react-toastify';

export interface Project {
  id: string;
  name: string;
  description: string;
  studyTypes: StudyType[];
}

export interface StudyType {
  id: string;
  name: string;
  description: string;
  visits: Visit[];
}

export interface Visit {
  id: string;
  name: string;
  description: string;
  screenings: Screening[];
}

export interface Screening {
  id: string;
  name: string;
  description: string;
}

// Dummy data for demonstration
const projects: Project[] = [
  {
    id: 'project1',
    name: 'Cardiac Study',
    description: 'Study focusing on cardiac health',
    studyTypes: [
      {
        id: 'type1',
        name: 'Phase 1',
        description: 'Initial phase of the study',
        visits: [
          {
            id: 'visit1',
            name: 'Baseline Visit',
            description: 'Initial visit for baseline measurements',
            screenings: [
              {
                id: 'screening1',
                name: 'Basic Screening',
                description: 'Basic health screening'
              },
              {
                id: 'screening2',
                name: 'Cardiac Screening',
                description: 'Detailed cardiac screening'
              }
            ]
          },
          {
            id: 'visit2',
            name: 'Follow-up Visit',
            description: 'Follow-up visit after 3 months',
            screenings: [
              {
                id: 'screening3',
                name: 'Progress Screening',
                description: 'Progress assessment screening'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'project2',
    name: 'Diabetes Study',
    description: 'Study focusing on diabetes management',
    studyTypes: [
      {
        id: 'type2',
        name: 'Phase 2',
        description: 'Second phase of the study',
        visits: [
          {
            id: 'visit3',
            name: 'Initial Assessment',
            description: 'Initial diabetes assessment',
            screenings: [
              {
                id: 'screening4',
                name: 'Glucose Screening',
                description: 'Blood glucose level screening'
              }
            ]
          }
        ]
      }
    ]
  }
];

export const getProjects = async (): Promise<Project[]> => {
  try {
    // In a real implementation, this would be an API call
    return projects;
  } catch (error) {
    console.error('Error fetching projects:', error);
    toast.error('Failed to fetch projects');
    return [];
  }
};

export const getStudyTypes = async (projectId: string): Promise<StudyType[]> => {
  try {
    const project = projects.find(p => p.id === projectId);
    return project?.studyTypes || [];
  } catch (error) {
    console.error('Error fetching study types:', error);
    toast.error('Failed to fetch study types');
    return [];
  }
};

export const getVisits = async (projectId: string, studyTypeId: string): Promise<Visit[]> => {
  try {
    const project = projects.find(p => p.id === projectId);
    const studyType = project?.studyTypes.find(st => st.id === studyTypeId);
    return studyType?.visits || [];
  } catch (error) {
    console.error('Error fetching visits:', error);
    toast.error('Failed to fetch visits');
    return [];
  }
};

export const getScreenings = async (
  projectId: string,
  studyTypeId: string,
  visitId: string
): Promise<Screening[]> => {
  try {
    const project = projects.find(p => p.id === projectId);
    const studyType = project?.studyTypes.find(st => st.id === studyTypeId);
    const visit = studyType?.visits.find(v => v.id === visitId);
    return visit?.screenings || [];
  } catch (error) {
    console.error('Error fetching screenings:', error);
    toast.error('Failed to fetch screenings');
    return [];
  }
}; 