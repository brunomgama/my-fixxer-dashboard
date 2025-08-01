import {
  Sender,
  SenderListParams,
  SenderListResponse,
  CreateSenderRequest,
  UpdateSenderRequest
} from "@/lib/types/sender"
import { ENV_CONFIG, EnvKey } from "@/lib/env-config"

export class SenderApi {
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

    const contentType = res.headers.get("content-type")
    const contentLength = res.headers.get("content-length")

    if (!res.ok) {
      const message = await res.text()
      throw new Error(`HTTP ${res.status}: ${message}`)
    }

    if (contentLength === "0" || !contentType?.includes("application/json")) {
      const text = await res.text()
      if (!text || text.trim() === "" || ["success", "deleted"].includes(text)) {
        return undefined as T
      }
      return text as T
    }

    return res.json()
  }

  async list(params: SenderListParams): Promise<SenderListResponse> {
    const query = new URLSearchParams({ limit: params.limit.toString() })
    if (params.lastKey) query.set("lastKey", params.lastKey)
    if (params.search) query.set("search", params.search)
    return this.request(`/senders?${query.toString()}`)
  }

  async getOne(id: string): Promise<Sender> {
    return this.request(`/senders/${id}`)
  }

  async count(): Promise<{count: number}> {
    return this.request(`/senders/count`)
  }

  async create(data: CreateSenderRequest): Promise<Sender> {
    return this.request(`/senders`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async update(id: string, data: UpdateSenderRequest): Promise<Sender> {
    return this.request(`/senders/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async delete(id: string): Promise<void> {
    await this.request(`/senders/${id}`, { method: "DELETE" })
  }
}
