'use client';

import { SectionCards } from "@/components/cards/section-cards";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DashboardCardsGrid } from "@/components/dashboard-grid-cards";

export default function Home() {

  return (
    <>
      <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              {/* <DataTable data={data} /> */}
            </div>
          </div>
        </div>
      {/* <DashboardCardsGrid
        counts={{
          senders: 10,
          audienceTypes: 3,
          audiences: 200,
          templates: 8,
          campaigns: 5,
          schedulers: 2,
        }}
      /> */}
    </>
  );
}
