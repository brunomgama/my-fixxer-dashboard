// Email Health Data Cache Management
import { EmailStatusResponse } from "@/lib/api/email-status"

interface CacheEntry {
  data: EmailStatusResponse
  timestamp: number
  env: string
}

interface TrendCacheEntry {
  data: EmailStatusResponse
  timestamp: number
  env: string
  trendDays: number
}

const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

class EmailHealthCache {
  private healthCache = new Map<string, CacheEntry>()
  private trendCache = new Map<string, TrendCacheEntry>()

  private getHealthCacheKey(env: string, days: number): string {
    return `health-${env}-${days}`
  }

  private getTrendCacheKey(env: string, days: number, trendDays: number): string {
    return `trend-${env}-${days}-${trendDays}`
  }

  private isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > CACHE_DURATION
  }

  // Health data cache methods
  getHealthData(env: string, days: number): EmailStatusResponse | null {
    const key = this.getHealthCacheKey(env, days)
    const entry = this.healthCache.get(key)
    
    if (!entry || this.isExpired(entry.timestamp) || entry.env !== env) {
      this.healthCache.delete(key)
      return null
    }
    
    return entry.data
  }

  setHealthData(env: string, days: number, data: EmailStatusResponse): void {
    const key = this.getHealthCacheKey(env, days)
    this.healthCache.set(key, {
      data,
      timestamp: Date.now(),
      env
    })
  }

  // Trend data cache methods
  getTrendData(env: string, days: number, trendDays: number): EmailStatusResponse | null {
    const key = this.getTrendCacheKey(env, days, trendDays)
    const entry = this.trendCache.get(key)
    
    if (!entry || this.isExpired(entry.timestamp) || entry.env !== env || entry.trendDays !== trendDays) {
      this.trendCache.delete(key)
      return null
    }
    
    return entry.data
  }

  setTrendData(env: string, days: number, trendDays: number, data: EmailStatusResponse): void {
    const key = this.getTrendCacheKey(env, days, trendDays)
    this.trendCache.set(key, {
      data,
      timestamp: Date.now(),
      env,
      trendDays
    })
  }

  // Clear all cache
  clearAll(): void {
    this.healthCache.clear()
    this.trendCache.clear()
  }

  // Clear cache for specific environment
  clearEnvironment(env: string): void {
    // Clear health cache
    for (const [key, entry] of this.healthCache.entries()) {
      if (entry.env === env) {
        this.healthCache.delete(key)
      }
    }
    
    // Clear trend cache
    for (const [key, entry] of this.trendCache.entries()) {
      if (entry.env === env) {
        this.trendCache.delete(key)
      }
    }
  }

  // Get cache statistics
  getCacheInfo() {
    const healthEntries = Array.from(this.healthCache.entries()).map(([key, entry]) => ({
      key,
      env: entry.env,
      timestamp: entry.timestamp,
      expired: this.isExpired(entry.timestamp)
    }))
    
    const trendEntries = Array.from(this.trendCache.entries()).map(([key, entry]) => ({
      key,
      env: entry.env,
      trendDays: entry.trendDays,
      timestamp: entry.timestamp,
      expired: this.isExpired(entry.timestamp)
    }))
    
    return {
      health: healthEntries,
      trend: trendEntries,
      totalEntries: this.healthCache.size + this.trendCache.size
    }
  }
}

// Export singleton instance
export const emailHealthCache = new EmailHealthCache()