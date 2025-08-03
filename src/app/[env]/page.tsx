'use client';

import { useState, useEffect } from "react";
import { SectionCards } from "@/components/cards/section-cards";
import { EmailHealthCards } from "@/components/email-health-cards";
import { EmailTrendCharts } from "@/components/email-trend-charts";
import { TimePeriodSelector } from "@/components/time-period-selector";
import { EmailStatusApi } from "@/lib/api/email-status";
import { useEnvironment } from "@/lib/context/environment";

export default function Home() {
  const { env } = useEnvironment();
  const [selectedDays, setSelectedDays] = useState(14);
  const [trendDays, setTrendDays] = useState(30);
  const [emailHealthData, setEmailHealthData] = useState<{
    bounceRate: number;
    complaintRate: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchCurrentRates() {
      try {
        const api = new EmailStatusApi(env);
        const result = await api.getStatus({
          category: 'global',
          days: selectedDays,
          percent: true
        });
        
        if (cancelled) return;
        
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
  }, [env, selectedDays]);

  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            {/* Existing Chart */}
            {/* <div className="px-4 lg:px-6">
              <ChartAreaInteractive />
            </div> */}

            {/* Email Health Dashboard Section */}
            <div className="px-4 lg:px-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">
                  Email Health Dashboard
                </h2>
                <p className="text-muted-foreground">
                  Monitor your email delivery performance and maintain optimal sender reputation
                </p>
              </div>

              {/* Time Period Controls */}
              <TimePeriodSelector 
                selectedDays={selectedDays}
                onDaysChangeAction={setSelectedDays}
                trendDays={trendDays}
                onTrendDaysChangeAction={setTrendDays}
              />

              {/* Existing Section Cards */}
              <SectionCards />

              {/* Email Health Cards */}
              <div>
                {/* <h3 className="text-lg font-semibold mb-4">Current Metrics</h3> */}
                <EmailHealthCards selectedDays={selectedDays} />
              </div>

              {/* Trend Charts */}
              <div>
                {/* <h3 className="text-lg font-semibold mb-4">Trend Analysis</h3> */}
                <EmailTrendCharts 
                  selectedDays={selectedDays} 
                  trendDays={selectedDays} 
                />
              </div>

              {/* Health Tips and Guidance */}
              {/* {emailHealthData && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Health Guidance</h3>
                  <EmailHealthTips 
                    bounceRate={emailHealthData.bounceRate}
                    complaintRate={emailHealthData.complaintRate}
                  />
                </div>
              )} */}
            </div>

            {/* <DataTable data={data} /> */}
          </div>
        </div>
      </div>
    </>
  );
}
