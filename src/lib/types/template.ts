export interface Template {
    id: string
    name: string
    local: string
    audienceTypeId: string
    emailType: string[]
    header: string
    footer: string
    unsubscribe?: string
    previousStatus: string
    status: 'draft' | 'published' | 'archived'
    createDate: string
    createUser: string
    modifyDate: string
    modifyUser: string
}

export interface TemplateListParams {
    limit: number
    lastKey?: string
    search?: string
}

export interface TemplateListResponse {
    results: Template[]
    lastKey?: string
}

export interface CreateTemplateRequest {
    name: string
    local: string
    audienceTypeId: string
    emailType: string[]
    header: string
    footer: string
    unsubscribe?: string
    status: 'draft' | 'published' | 'archived'
    user: string
}

export interface UpdateTemplateRequest extends CreateTemplateRequest {}