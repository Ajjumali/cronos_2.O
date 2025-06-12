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


export interface TestResultType {
  id: number
  registrationDate: string
  sampleTypeId?: number
  sampleType?: string
  receivedBy?: string
  receivedByName?: string
  receivedOn?: string
  subjectId: string
  gender: string
  VolunteerName: string
  StatusID: number
  testPanelName?: string
  testId?: number
  testName?: string
  result?: string
  unit?: string
  referenceRange?: string
  performedBy?: string
  performedOn?: string
  verifiedBy?: string
  verifiedOn?: string
  remarks?: string
  activeFlag?: string
  modifyBy?: string
  modifyOn?: string
  projectNo?: string
  study?: string
  location?: string
  referenceId?: string
  lab?: string
  period?: string
}

export interface TestType {
  id: number
  name: string
  description?: string
  unit?: string
  referenceRange?: string
  activeFlag: string
  modifyBy?: string
  modifyOn?: string
}

export interface LabDto {
  id: number
  name: string
  code: string
  address?: string
  activeFlag: string
  modifyBy?: string
  modifyOn?: string
}

export interface TestTypesResponse {
  result: TestType[]
  status: string
  message?: string
}

export interface LabsResponse {
  result: LabDto[]
  status: string
  message?: string
}

export interface SampleTypeDto {
  id: number
  name: string
  code: string
  description?: string
  activeFlag: string
  modifyBy?: string
  modifyOn?: string
}

export interface LocationDto {
  id: number
  name: string
  code: string
  description?: string
  activeFlag: string
  modifyBy?: string
  modifyOn?: string
}

export interface ApiResponse<T> {
  result: T
  status: string
  message?: string
}

export type StatusType = 'Pending' | 'In Progress' | 'Completed' | 'Rejected'
export type PriorityType = 'Routine' | 'Urgent' | 'STAT'

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

export interface MethodType {
  methodId: number
  methodName: string
  description?: string
  isActive: boolean
  updatedBy: string
  updatedOn: string
}

export interface TestAuthorizationType {
  id: number
  registrationDateTime: string
  sampleId: number
  volunteerId: string
  gender: string
  name: string
  testPanelName: string
  testId: number
  testName: string
  authorizationStatus: string
  authorizedBy: string
  authorizedOn: string
  remarks: string
  activeFlag: string
  modifyBy: string
  modifyOn: string
  projectNo: string
  study: string
  sampleType: string
  location: string
  referenceId: string
  lab: string
}