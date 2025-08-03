import { ENV_CONFIG, EnvKey } from "@/lib/env-config"

export interface EmailStatusParams {
  category?: string
  days?: number
  trends?: boolean
  trend_days?: number
  percent?: boolean
}

export interface EmailStatusSummary {
  sent: number
  bounces: number
  complaints: number
  rejects: number
  bounce_rate: number
  complaint_rate: number
  reject_rate: number
  console_bounce_rate: number
  console_complaint_rate: number
}

export interface EmailStatusTrendItem {
  date: string
  averageRate: number
}

export interface EmailStatusResponse extends EmailStatusSummary {
  console_bounce_rate_trend?: EmailStatusTrendItem[]
  console_complaint_rate_trend?: EmailStatusTrendItem[]
  period_days?: number
  trend_period_days?: number
}

export interface EmailHealthThresholds {
  bounce: {
    warning: number // 5%
    danger: number  // 10%
  }
  complaint: {
    warning: number // 0.1%
    danger: number  // 0.5%
  }
}

export const EMAIL_HEALTH_THRESHOLDS: EmailHealthThresholds = {
  bounce: {
    warning: 5,
    danger: 10
  },
  complaint: {
    warning: 0.1,
    danger: 0.5
  }
}

export type HealthStatus = 'healthy' | 'warning' | 'danger'

export class EmailStatusApi {
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

  private buildQueryParams(params: EmailStatusParams): string {
    const query = new URLSearchParams()
    
    if (params.category) query.set('category', params.category)
    if (params.days) query.set('days', params.days.toString())
    if (params.trends) query.set('trends', 'true')
    if (params.trend_days) query.set('trend_days', params.trend_days.toString())
    if (params.percent) query.set('percent', 'true')
    
    return query.toString()
  }

  async getStatus(params: EmailStatusParams = {}): Promise<EmailStatusResponse> {
    const queryString = this.buildQueryParams(params)
    const url = `/status${queryString ? `?${queryString}` : ''}`
    return this.request<EmailStatusResponse>(url)
  }

  normalizeValue(value: string | number): number {
    if (typeof value === 'string') {
      value = value.replace('%', '');
      value = parseFloat(value);
      if (value > 1) value = value / 100;
    }
    return value;
  }
  
  getHealthStatus(rawValue: string | number, type: 'bounce' | 'complaint'): HealthStatus {
    const thresholds = EMAIL_HEALTH_THRESHOLDS[type]
    const value = this.normalizeValue(rawValue);
    if (value >= thresholds.danger) return 'danger';
    if (value >= thresholds.warning) return 'warning';
    return 'healthy';
  }

  getOverallHealthStatus(bounceRate: number, complaintRate: number): HealthStatus {
    const bounceHealth = this.getHealthStatus(bounceRate, 'bounce')
    const complaintHealth = this.getHealthStatus(complaintRate, 'complaint')
    
    if (bounceHealth === 'danger' || complaintHealth === 'danger') return 'danger'
    if (bounceHealth === 'warning' || complaintHealth === 'warning') return 'warning'
    return 'healthy'
  }
}