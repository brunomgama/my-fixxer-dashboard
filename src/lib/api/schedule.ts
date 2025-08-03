import {
    Schedule,
    ScheduleListParams,
    ScheduleListResponse,
    CreateScheduleRequest,
    UpdateScheduleRequest
  } from "@/lib/types/schedule"
  import { ENV_CONFIG, EnvKey } from "@/lib/env-config"
  
  export class ScheduleApi {
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
  
    async list(params: ScheduleListParams): Promise<ScheduleListResponse> {
      const query = new URLSearchParams({ limit: params.limit.toString() })
      if (params.lastKey) query.set("lastKey", params.lastKey)
      if (params.campaignId && params.campaignId.length > 0) {
        params.campaignId.forEach(id => query.append("campaignId", id))
      }
      return this.request(`/schedule?${query.toString()}`)
    }
  
    async getOne(id: string): Promise<Schedule> {
      return this.request(`/schedule/${id}`)
    }

    async count(): Promise<{count: number, active: number}> {
      return this.request(`/schedule/count`)
    }
  
    async create(data: CreateScheduleRequest): Promise<Schedule> {
      console.log("Creating schedule with data:", data)
      
      return this.request(`/schedule`, {
        method: "POST",
        body: JSON.stringify(data),
      })
    }
  
    async update(id: string, data: UpdateScheduleRequest): Promise<Schedule> {
      return this.request(`/schedule/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      })
    }
  
    async delete(id: string): Promise<void> {
      await this.request(`/schedule/${id}`, { method: "DELETE" })
    }
  }