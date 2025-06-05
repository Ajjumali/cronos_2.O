export type InstrumentType = {
  autoValidate: boolean
  categoryId: number
  categoryName: string
  createdBy: string
  createdOn: string
  instrumentId: number
  instrumentName: string
  instrumentSerialNumber: string
  ipAddress: string
  isActive: boolean
  nameToBePrinted: string
  port: string
  remarks: string
  updatedBy: string
  updatedOn: string
  reason?: string
}

export type InstrumentStatus = 'Active' | 'Inactive' | 'Maintenance' | 'Calibration Due'

export type Category = {
  id: number
  categoryName: string
  categoryOrder?: string
  activeFlag?: string
  timeZoneId: number
  parentId?: number
  modifyBy?: string
  modifyOn?: string
}

export type SpeciesType = {
  speciesId: number
  speciesName: string
  isActive: boolean
  remarks: string
  updatedBy: string
  updatedOn: string
}

export interface StrainType {
  strainId: number
  strainName: string
  remarks: string
  isActive: boolean
  createdBy: string
  createdOn: string
  updatedBy: string
  updatedOn: string
  reason?: string
}

export type AnalyteCodeType = {
  analyteId: number
  instrumentId: number
  sampleTypeId: number
  testId: number
  instrumentName: string
  sampletype: string
  testName: string
  analyteName: string
  analyteCode: string
  remark?: string 
  isActive: boolean
  createdBy?: string
  createdOn?: string
  updatedBy?: string
  updatedOn?: string
}

export type SampleType = {
  sampleId: number
  volunteerId: string
  name: string
  gender: string
  testPanelName: string
  testName: string
  result: string
  unit: string
  referenceRange: string
  status: string
  registrationDateTime: string
  performedBy: string
  performedOn: string
  verifiedBy: string
  verifiedOn: string
  remarks: string
  sampleType: string
  isActive: boolean
  createdBy?: string
  createdOn?: string
  updatedBy?: string
  updatedOn?: string
}

export type TestType = {
  id: number
  testName: string
  isActive: boolean
  createdBy?: string
  createdOn?: string
  updatedBy?: string
  updatedOn?: string
}

// Base types for LIMS entities
export interface TestResultType {
  id: number
  registrationDateTime: string // Registration Date and Time
  sampleId: number
  volunteerId: string
  gender: string
  name: string
  testPanelName: string // Test and Panel Name
  testId: number
  testName: string
  result: string
  unit: string
  referenceRange: string
  status: string
  performedBy: string
  performedOn: string
  verifiedBy: string
  verifiedOn: string
  remarks: string
  activeFlag: string
  modifyBy: string
  modifyOn: string
  projectNo?: string
  study?: string
  studyProtocol?: string
  sampleType?: string
  location?: string
  referenceId?: string
  lab?: string
  period?: string
}

export interface LabDto {
  id: number
  labName: string
  activeFlag: string
}

// Generic API response type
export interface ApiResponse<T> {
  result: T
}


export type TestTypesResponse = ApiResponse<TestType[]>
export type LabsResponse = ApiResponse<LabDto[]>

// Sample related types
export interface SampleTypeDto {
  sampleId: number
  sampleType: string
  activeFlag: string
}

export type SampleResponse = ApiResponse<SampleType>
export type SamplesResponse = ApiResponse<SampleType[]>

// Status types
export type StatusType = 'Pending' | 'In Progress' | 'Received' | 'Rejected'
export type PriorityType = 'Routine' | 'Urgent' | 'STAT'

// Filter types
export interface FilterOptions {
  status?: StatusType
  priority?: PriorityType
  labId?: number
  dateRange?: {
    start: string
    end: string
  }
  search?: string
}

export interface LocationDto {
  id: number
  name: string
  activeFlag: string
}

export interface MethodType {
  methodId: number
  methodName: string
  description?: string
  isActive: boolean
  updatedBy: string
  updatedOn: string
}