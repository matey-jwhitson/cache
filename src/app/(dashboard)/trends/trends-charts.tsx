"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AppLineChart } from "@/components/dashboard/chart";

interface TrendsChartsProps {
  providers: string[];
  mentionData: Record<string, unknown>[];
  similarityData: Record<string, unknown>[];
}

export function TrendsCharts({ providers, mentionData, similarityData }: TrendsChartsProps) {
  const lines = providers.map((p) => ({ key: p, label: p }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mention Rate Over Time (%)</CardTitle>
        </CardHeader>
        <CardContent>
          <AppLineChart
            data={mentionData}
            xKey="date"
            lines={lines}
            height={350}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Similarity Over Time (%)</CardTitle>
        </CardHeader>
        <CardContent>
          <AppLineChart
            data={similarityData}
            xKey="date"
            lines={lines}
            height={350}
          />
        </CardContent>
      </Card>
    </div>
  );
}
