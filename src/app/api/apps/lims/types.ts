export interface AccreditationTest {
  id: number
  testName: string
  addedBy: string
  addedOn: string
  modifiedBy: string
  modifiedOn: string
  remarks: string
}

export interface AccreditationDetail {
  id: number
  fromDate: string
  toDate: string
  testCount: number
  accreditationType: 'NABL' | 'CAP'
  tests: AccreditationTest[]
}

export interface Test {
  id: number
  name: string
  code: string
} 