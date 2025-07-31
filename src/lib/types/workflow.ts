export type Workflow = {
  id: string;
  name: string;
  arn: string;
  input: string;
  startAt: string;
  version: string;
  active: boolean;
  createDate: string;
  createUser: string;
  modifyDate: string;
  modifyUser: string;
  steps: Step[];
}
  
export interface WorkflowListParams {
  limit: number
  lastKey?: string
}
  
export interface WorkflowListResponse {
  lastEvaluatedKey?: string
  results: Workflow[]
}
  

export type Step = {
  name: string;
  action: string;
  Next?: string;
}