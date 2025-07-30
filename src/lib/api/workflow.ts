import { Workflow, WorkflowListParams, WorkflowListResponse } from "@/lib/types/workflow"
import { ENV_CONFIG, EnvKey } from "@/lib/env-config"

export class WorkflowApi {
  private workflowUrl: string
  private apiKey: string

  constructor(env: EnvKey) {
    const config = ENV_CONFIG[env]
    this.workflowUrl = config.workflowUrl
    this.apiKey = config.apiKey
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.workflowUrl}${path}`, {
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

  async list(params: WorkflowListParams): Promise<WorkflowListResponse> {
    const query = new URLSearchParams({ limit: params.limit.toString() })
    if (params.lastKey) query.set("lastKey", params.lastKey)
    return this.request(`/events?${query.toString()}`)
  }

  async getOne(id: string): Promise<Workflow> {
    return this.request(`/events/${id}`)
  }

  async create(payload: any): Promise<any> {
    return this.request("/events", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

}
