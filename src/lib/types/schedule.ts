export interface Schedule {
    id: string
    campaignId: string
    emailReceiver: string[]
    scheduled_time: string
    variables: Record<string, string>
}

export interface ScheduleListParams {
    limit: number
    lastKey?: string
    campaignId?: string[]
}

export interface ScheduleListResponse {
    results: Schedule[]
    lastEvaluatedKey?: string
}

export interface CreateScheduleRequest {
    campaignId: string
    emailReceiver: string[]
    scheduled_time: string
    variables: Record<string, string>
}

export interface UpdateScheduleRequest extends CreateScheduleRequest {}