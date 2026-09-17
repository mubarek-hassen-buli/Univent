"use client";

import * as React from "react";
import { TrendingUp } from "lucide-react";
import {
  Label,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig = {
  attended: {
    label: "Admitted Check-ins",
    color: "var(--chart-2)",
  },
  pending: {
    label: "Pending Attendance",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

interface ChartRadialStackedProps {
  title?: string;
  description?: string;
  attended: number;
  totalRegistrations: number;
  turnoutRate?: number;
  footerDescription?: string;
}

export function ChartRadialStacked({
  title = "Turnout & Attendance Gauge",
  description = "Admitted participants vs pending check-ins",
  attended,
  totalRegistrations,
  turnoutRate,
  footerDescription = "Showing live entrance check-in ratio",
}: ChartRadialStackedProps) {
  const pending = Math.max(0, totalRegistrations - attended);
  const calculatedRate =
    turnoutRate ??
    (totalRegistrations > 0
      ? Math.round((attended / totalRegistrations) * 100)
      : 0);

  const chartData = React.useMemo(() => {
    // If both are 0, supply a nominal 0 baseline so chart renders cleanly
    return [
      {
        metric: "participation",
        attended: attended || 0,
        pending: pending || 0,
      },
    ];
  }, [attended, pending]);

  return (
    <Card className="flex flex-col border-border bg-card">
      <CardHeader className="items-center pb-2 text-center">
        <CardTitle className="text-base font-bold text-foreground">
          {title}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 items-center pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[240px]"
        >
          <RadialBarChart
            data={chartData}
            endAngle={180}
            innerRadius={80}
            outerRadius={110}
          >
            <RadialBar
              dataKey="pending"
              fill="var(--color-pending)"
              stackId="a"
              cornerRadius={5}
              className="stroke-transparent stroke-2"
            />
            <RadialBar
              dataKey="attended"
              stackId="a"
              cornerRadius={5}
              fill="var(--color-attended)"
              className="stroke-transparent stroke-2"
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) - 16}
                          className="fill-foreground text-2xl font-extrabold"
                        >
                          {totalRegistrations.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 4}
                          className="fill-muted-foreground text-xs"
                        >
                          Total Registrations
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-1.5 text-center text-xs pt-4 border-t border-border/50">
        <div className="flex items-center justify-center gap-1.5 font-medium text-foreground">
          Turnout efficiency at {calculatedRate}%
          <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
        </div>
        <div className="text-[11px] text-muted-foreground">
          {footerDescription} &bull; {attended} checked in of {totalRegistrations}
        </div>
      </CardFooter>
    </Card>
  );
}
