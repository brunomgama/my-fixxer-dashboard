import { EmailEventList } from "@/lib/types/events-emails"
import { ENV_CONFIG, EnvKey } from "@/lib/env-config"

export class EventsEmailsApi {
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

  /**
   * Runs an Athena query and returns the result as EmailEventList.
   * You pass the full SQL query string.
   */
  async runQuery(query: string): Promise<EmailEventList> {
    return this.request<EmailEventList>("/athena", {
      method: "POST",
      body: JSON.stringify({ query }),
    })
  }
}
