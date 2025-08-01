export interface Campaign {
    id: string
    name: string
    local: string
    audienceId: string
    senderId: string
    senderAlias: string
    subject: string
    content: string
    templateId: string
    status: 'draft' | 'planned' | 'archived' | 'sending' | 'sent'
    previousStatus: string
    createDate: string
    createUser: string
    modifyDate: string
    modifyUser: string
}

export interface CampaignListParams {
    limit: number
    lastKey?: string
    search?: string
}

export interface CampaignListResponse {
    results: Campaign[]
    lastKey?: string
}

export interface CreateCampaignRequest {
    name: string
    local: string
    audienceId: string
    senderId: string
    senderAlias: string
    subject: string
    content: string
    templateId: string
    status: 'draft' | 'planned' | 'archived' | 'sending' | 'sent'
    user: string
}

export interface UpdateCampaignRequest extends CreateCampaignRequest {}