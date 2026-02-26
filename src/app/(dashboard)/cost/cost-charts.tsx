"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AppPieChart, AppBarChart } from "@/components/dashboard/chart";

interface CostChartsProps {
  providerData: { name: string; value: number }[];
  operationData: { name: string; value: number }[];
}

export function CostCharts({ providerData, operationData }: CostChartsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Cost by Provider</CardTitle>
        </CardHeader>
        <CardContent>
          <AppPieChart
            data={providerData}
            dataKey="value"
            nameKey="name"
            height={280}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cost by Operation</CardTitle>
        </CardHeader>
        <CardContent>
          <AppBarChart
            data={operationData}
            xKey="name"
            bars={[{ key: "value", label: "Cost (USD)" }]}
            height={280}
          />
        </CardContent>
      </Card>
    </div>
  );
}
