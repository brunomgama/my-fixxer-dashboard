import {
    Campaign,
    CampaignListParams,
    CampaignListResponse,
    CreateCampaignRequest,
    UpdateCampaignRequest
  } from "@/lib/types/campaign"
  import { ENV_CONFIG, EnvKey } from "@/lib/env-config"
  
  export class CampaignApi {
    private emailUrl: string
    private apiKey: string
  
    constructor(env: EnvKey) {
      const config = ENV_CONFIG[env]
      this.emailUrl = config.emailUrl
      this.apiKey = config.apiKey
    }
  
    private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
      const res = await fetch(`${this.emailUrl}${path}`, {
        ...options,
        headers: {
          "x-api-key": this.apiKey,
          "Content-Type": "application/json",
          ...options.headers,
        },
      })
    
      if (!res.ok) {
        const message = await res.text()
        throw new Error(`HTTP ${res.status}: ${message}`)
      }
    
      const contentType = res.headers.get("content-type") || ""
      const contentLength = res.headers.get("content-length")
    
      if (!contentLength || contentLength === "0") {
        return undefined as T
      }
    
      if (contentType.includes("application/json")) {
        return res.json()
      }
    
      return undefined as T
    }
  
    async list(params: CampaignListParams): Promise<CampaignListResponse> {
      const query = new URLSearchParams({ limit: params.limit.toString() })
      if (params.lastKey) query.set("lastKey", params.lastKey)
      if (params.search) query.set("search", params.search)
      return this.request(`/campaign?${query.toString()}`)
    }
  
    async getOne(id: string): Promise<Campaign> {
      return this.request(`/campaign/${id}`)
    }

    async count(): Promise<{count: number}> {
      return this.request(`/campaign/count`)
    }
  
    async create(data: CreateCampaignRequest): Promise<Campaign> {
      console.log("Creating campaign with data:", data)
      
      return this.request(`/campaign`, {
        method: "POST",
        body: JSON.stringify(data),
      })
    }
  
    async update(id: string, data: UpdateCampaignRequest): Promise<Campaign> {
      return this.request(`/campaign/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      })
    }
  
    async delete(id: string): Promise<void> {
      await this.request(`/campaign/${id}`, { method: "DELETE" })
    }

    async duplicate(id: string): Promise<Campaign> {
      return this.request(`/campaign/${id}`, {
        method: "POST",
        body: JSON.stringify({})})
    }
  }