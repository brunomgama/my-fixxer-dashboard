import {
    Audience,
    AudienceListParams,
    AudienceListResponse,
    CreateAudienceRequest,
    UpdateAudienceRequest
  } from "@/lib/types/audience"
  import { ENV_CONFIG, EnvKey } from "@/lib/env-config"
  
  export class AudienceApi {
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
  
    async list(params: AudienceListParams): Promise<AudienceListResponse> {
      const query = new URLSearchParams({ limit: params.limit.toString() })
      if (params.lastKey) query.set("lastKey", params.lastKey)
      if (params.search) query.set("search", params.search)
      return this.request(`/audience?${query.toString()}`)
    }
  
    async getOne(id: string): Promise<Audience> {
      return this.request(`/audience/${id}`)
    }
  
    async create(data: CreateAudienceRequest): Promise<Audience> {
      console.log("Creating audience with data:", data)
      
      return this.request(`/audience`, {
        method: "POST",
        body: JSON.stringify(data),
      })
    }
  
    async update(id: string, data: UpdateAudienceRequest): Promise<Audience> {
      return this.request(`/audience/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      })
    }
  
    async delete(id: string): Promise<void> {
      await this.request(`/audience/${id}`, { method: "DELETE" })
    }
  }
  