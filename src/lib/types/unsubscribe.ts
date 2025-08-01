export interface Unsubscribe {
    email: string
    emailType: string
    unsubscribedAt: string
}

export interface UnsubscribeListParams {
    limit?: number
    lastKey?: string
    sortBy?: string
    sortOrder?: string
    condition?: string
    email?: string[]
    emailType?: string[]
    unsubscribedAt?: string[]
}

export interface UnsubscribeListResponse {
    results: Unsubscribe[]
    lastEvaluatedKey?: string
    count: number
}