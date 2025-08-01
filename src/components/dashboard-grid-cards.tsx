import { DashboardCard } from "./cards/dashboard-cards";
import HolographicCard from "./cards/holographic-card";

interface DashboardCounts {
  senders: number;
  audienceTypes: number;
  audiences: number;
  templates: number;
  campaigns: number;
  schedulers: number;
}

export function DashboardCardsGrid({
  counts,
}: {
  counts: DashboardCounts;
}) {
  const cardData = [
    { title: "Senders", count: counts.senders },
    { title: "Audience Types", count: counts.audienceTypes },
    { title: "Audiences", count: counts.audiences },
    { title: "Templates", count: counts.templates },
    { title: "Campaigns", count: counts.campaigns },
    { title: "Schedulers", count: counts.schedulers },
  ];

  return (
    
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {cardData.map((item) => (
        <DashboardCard key={item.title} title={item.title} count={item.count} />
        // <DashboardHoloCard key={item.title} title={item.title} count={item.count} />
      ))}
    </div>
  );
}
