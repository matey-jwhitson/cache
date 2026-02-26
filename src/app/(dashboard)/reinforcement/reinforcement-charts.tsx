"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AppLineChart } from "@/components/dashboard/chart";

interface ReinforcementChartsProps {
  providers: string[];
  trendData: Record<string, unknown>[];
}

export function ReinforcementCharts({ providers, trendData }: ReinforcementChartsProps) {
  const lines = providers.map((p) => ({ key: p, label: p }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mention Rate Over Time (%)</CardTitle>
      </CardHeader>
      <CardContent>
        <AppLineChart
          data={trendData}
          xKey="date"
          lines={lines}
          height={350}
        />
      </CardContent>
    </Card>
  );
}
