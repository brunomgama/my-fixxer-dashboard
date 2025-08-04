'use client';

import { useState, useEffect } from "react";
import { SectionCards } from "@/components/cards/section-cards";
import { EmailHealthCards } from "@/components/email-health-cards";
import { EmailTrendCharts } from "@/components/email-trend-charts";
import { TimePeriodSelector } from "@/components/time-period-selector";
import { EmailStatusApi } from "@/lib/api/email-status";
import { useEnvironment } from "@/lib/context/environment";
import { emailHealthCache } from "@/lib/cache/email-health-cache";
import { useTranslation } from "@/lib/context/translation";

export default function Home() {
  const { env } = useEnvironment();
  const { t } = useTranslation();

  const [selectedDays, setSelectedDays] = useState(14);
  const [trendDays, setTrendDays] = useState(30);
  const [emailHealthData, setEmailHealthData] = useState<{
    bounceRate: number;
    complaintRate: number;
  } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setForceRefresh(true);
  };

  const handleRefreshComplete = () => {
    setIsRefreshing(false);
    setForceRefresh(false);
  };

  useEffect(() => {
    let cancelled = false;

    async function fetchCurrentRates() {
      try {
        // Check cache first unless force refresh is requested
        if (!forceRefresh) {
          const cachedData = emailHealthCache.getHealthData(env, selectedDays);
          if (cachedData) {
            if (cancelled) return;
            setEmailHealthData({
              bounceRate: cachedData.console_bounce_rate,
              complaintRate: cachedData.console_complaint_rate
            });
            return;
          }
        }

        const api = new EmailStatusApi(env);
        const result = await api.getStatus({
          category: 'global',
          days: selectedDays,
          percent: true
        });
        
        if (cancelled) return;
        
        // Cache the result
        emailHealthCache.setHealthData(env, selectedDays, result);
        
        setEmailHealthData({
          bounceRate: result.console_bounce_rate,
          complaintRate: result.console_complaint_rate
        });
      } catch (err) {
        console.error('Failed to fetch current rates:', err);
        if (!cancelled) {
          setEmailHealthData(null);
        }
      }
    }

    fetchCurrentRates();
    return () => { cancelled = true };
  }, [env, selectedDays, forceRefresh]);

  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            {/* Email Health Dashboard Section */}
            <div className="px-4 lg:px-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">
                  {t('home_dashboard.title')}
                </h2>
                <p className="text-muted-foreground">
                  {t('home_dashboard.title')}
                </p>
              </div>

              {/* Time Period Controls */}
              <TimePeriodSelector 
                selectedDays={selectedDays}
                onDaysChangeAction={setSelectedDays}
                trendDays={trendDays}
                onTrendDaysChangeAction={setTrendDays}
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
              />

              {/* Existing Section Cards */}
              <SectionCards />

              {/* Email Health Cards */}
              <div>
                <EmailHealthCards 
                  selectedDays={selectedDays} 
                  forceRefresh={forceRefresh}
                  onRefreshComplete={handleRefreshComplete}
                />
              </div>

              {/* Trend Charts */}
              <div>
                <EmailTrendCharts 
                  selectedDays={selectedDays} 
                  trendDays={selectedDays}
                  forceRefresh={forceRefresh}
                  onRefreshComplete={handleRefreshComplete}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
