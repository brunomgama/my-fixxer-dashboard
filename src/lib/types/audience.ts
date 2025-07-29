export interface Audience {
    id: string
    name: string
    local: string
    definition?: string
    audienceTypeId: string
    emailType: 'campaign' | 'automation' | 'functional'
    sql: string
    countRecipients: number
    active: boolean
    createDate: string
    createUser: string
    modifyDate: string
    modifyUser: string
  }
  
  export interface AudienceListParams {
    limit: number
    lastKey?: string
    search?: string
  }
  
  export interface AudienceListResponse {
    results: Audience[]
    lastKey?: string
  }
  
  export interface CreateAudienceRequest {
    name: string
    local: string
    definition?: string
    audienceTypeId: string
    emailType: 'campaign' | 'automation' | 'functional'
    sql: string
    active: boolean
    user: string
  }
  
  export interface UpdateAudienceRequest extends CreateAudienceRequest {}
  