import {
  Unsubscribe,
  UnsubscribeListParams,
  UnsubscribeListResponse
} from "@/lib/types/unsubscribe"
import { ENV_CONFIG, EnvKey } from "@/lib/env-config"

export class UnsubscribeApi {
  private emailUrl: string
  private apiKey: string

  constructor(env: EnvKey) {
    const config = ENV_CONFIG[env]
    this.emailUrl = config.emailUrl
    this.apiKey = config.apiKey
    
    // Debug logging
    // console.log('UnsubscribeApi initialized:', {
    //   env,
    //   emailUrl: this.emailUrl,
    //   hasApiKey: !!this.apiKey
    // })
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const fullUrl = `${this.emailUrl}${path}`
    
    // console.log('Making request:', {
    //   url: fullUrl,
    //   method: options.method || 'GET',
    //   headers: {
    //     'x-api-key': this.apiKey ? '[PRESENT]' : '[MISSING]',
    //     'Content-Type': 'application/json'
    //   }
    // })

    const res = await fetch(fullUrl, {
      ...options,
      headers: {
        "x-api-key": this.apiKey,
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    // console.log('Response received:', {
    //   status: res.status,
    //   statusText: res.statusText,
    //   contentType: res.headers.get('content-type'),
    //   contentLength: res.headers.get('content-length')
    // })

    if (!res.ok) {
      const message = await res.text()
      console.error('Request failed:', message)
      throw new Error(`HTTP ${res.status}: ${message}`)
    }

    const contentType = res.headers.get("content-type") || ""
    
    if (contentType.includes("application/json")) {
      try {
        const jsonData = await res.json()
        // console.log('JSON response:', jsonData)
        return jsonData
      } catch (error) {
        console.error('Failed to parse JSON:', error)
        return undefined as T
      }
    }

    const text = await res.text()
    // console.log('Text response:', text)
    
    if (text.trim()) {
      try {
        const jsonData = JSON.parse(text)
        // console.log('Parsed text as JSON:', jsonData)
        return jsonData
      } catch {
        // console.log('Returning text as-is:', text)
        return text as T
      }
    }

    // console.log('Returning undefined for empty response')
    return undefined as T
  }

  private buildQueryParams(params: UnsubscribeListParams): string {
    const query = new URLSearchParams()
    
    if (params.limit) query.set('limit', params.limit.toString())
    if (params.lastKey) query.set('lastKey', params.lastKey)
    if (params.sortBy) query.set('sortBy', params.sortBy)
    if (params.sortOrder) query.set('sortOrder', params.sortOrder)
    if (params.condition) query.set('condition', params.condition)
    
    // Handle array parameters
    if (params.email && params.email.length > 0) {
      params.email.forEach(email => query.append('email', email))
    }
    if (params.emailType && params.emailType.length > 0) {
      params.emailType.forEach(type => query.append('emailType', type))
    }
    if (params.unsubscribedAt && params.unsubscribedAt.length > 0) {
      params.unsubscribedAt.forEach(date => query.append('unsubscribedAt', date))
    }
    
    const queryString = query.toString()
    // console.log('Built query params:', queryString)
    return queryString
  }

  async list(params: UnsubscribeListParams = {}): Promise<UnsubscribeListResponse> {
    const queryString = this.buildQueryParams(params)
    const url = `/unsubscribedata${queryString ? `?${queryString}` : ''}`

    // console.log("Unsubscribe API list URL:", url)
    // console.log("Unsubscribe API list params:", params)
    
    const result = await this.request<UnsubscribeListResponse>(url)
    
    // Ensure we return a valid response structure
    const response: UnsubscribeListResponse = {
      results: result?.results || [],
      lastEvaluatedKey: result?.lastEvaluatedKey || '',
      count: result?.count || 0
    }
    
    // console.log("Final response:", response)
    return response
  }

  async searchByEmail(email: string, emailType: string): Promise<Unsubscribe> {
    return this.request(`/unsubscribedata/${encodeURIComponent(email)}/${encodeURIComponent(emailType)}`)
  }

  async count(params: UnsubscribeListParams = {}): Promise<{count: number}> {
    const queryString = this.buildQueryParams(params)
    const url = `/unsubscribedata/count${queryString ? `?${queryString}` : ''}`
    return this.request(url)
  }

  async delete(email: string, emailType: string): Promise<void> {
    await this.request(`/unsubscribedata/${encodeURIComponent(email)}/${encodeURIComponent(emailType)}`, { 
      method: "DELETE" 
    })
  }
}