export interface Sender {
  id: string
  email: string
  alias: string[]
  emailType: string[]
  active: boolean
  createDate: string
  createUser: string
  modifyDate: string
  modifyUser: string
}

export interface CreateSenderRequest {
  email: string
  alias: string[]
  emailType: string[]
  active: boolean
  user: string
}

export interface UpdateSenderRequest extends CreateSenderRequest {}

export interface SenderListParams {
  limit: number
  lastKey?: string
  search?: string
}

export interface SenderListResponse {
  results: Sender[]
  nextLastKey?: string
}
