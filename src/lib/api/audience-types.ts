import {
    AudienceType,
    AudienceTypesListParams,
    AudienceTypesListResponse,
    CreateAudienceTypeRequest,
    UpdateAudienceTypeRequest,
  } from "@/lib/types/audience-types"
  import { ENV_CONFIG, EnvKey } from "@/lib/env-config"
  
  export class AudienceTypesApi {
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
    
      const contentType = res.headers.get("content-type") || ""
      const contentLength = res.headers.get("content-length")
    
      if (!res.ok) {
        const message = await res.text()
        throw new Error(`HTTP ${res.status}: ${message}`)
      }
    
      if (!contentLength || contentLength === "0" || !contentType.includes("application/json")) {
        try {
          const text = await res.text()
          if (!text || text.trim() === "" || ["OK", "success", "deleted"].includes(text.trim().toLowerCase())) {
            return undefined as T
          }
  
          return text as unknown as T
        } catch {
          return undefined as T
        }
      }
    
      return res.json()
    }
    
  
    async list(params: AudienceTypesListParams): Promise<AudienceTypesListResponse> {
      const query = new URLSearchParams({ limit: params.limit.toString() })
      if (params.lastKey) query.set("lastKey", params.lastKey)
      if (params.search) query.set("search", params.search)
    
      return this.request(`/audiencetype?${query.toString()}`)
    }
  
    async getOne(id: string): Promise<AudienceType> {
      return this.request(`/audiencetype/${id}`)
    }
  
    async create(data: CreateAudienceTypeRequest): Promise<AudienceType> {
      return this.request(`/audiencetype`, {
        method: "POST",
        body: JSON.stringify(data),
      })
    }
  
    async update(id: string, data: UpdateAudienceTypeRequest): Promise<AudienceType> {
      return this.request(`/audiencetype/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      })
    }
  
    async delete(id: string): Promise<void> {
      await this.request(`/audiencetype/${id}`, {
        method: "DELETE",
      })
    }
  }
  