export interface AudienceType {
    id: string
    name: string
    createDate: string
    createUser: string
    modifyDate: string
    modifyUser: string
  }
  
  export interface AudienceTypesListResponse {
    results: AudienceType[]
    lastEvaluatedKey?: string
  }
  
  export interface AudienceTypesListParams {
    limit: number
    lastKey?: string
    search?: string
  }
  
  export interface CreateAudienceTypeRequest {
    name: string
    user: string
  }
  
  export interface UpdateAudienceTypeRequest {
    name: string
    user: string
  }
  