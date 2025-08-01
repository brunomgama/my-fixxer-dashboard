import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface DashboardCardProps {
  title: string;
  count: number;
}

export function DashboardCard({ title, count }: DashboardCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <span className="text-3xl font-bold">{count}</span>
      </CardContent>
    </Card>
  );
}


