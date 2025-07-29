export interface Workflow {
    id: string
    name: string
    arn: string
    active: boolean
    createDate: string
    createUser: string
  }
  
  export interface WorkflowListParams {
    limit: number
    lastKey?: string
  }
  
  export interface WorkflowListResponse {
    lastEvaluatedKey?: string
    results: Workflow[]
  }
  