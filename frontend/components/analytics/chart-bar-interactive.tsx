"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { ActivityTimelinePoint } from "@/lib/query/analytics.query";

const chartConfig = {
  views: {
    label: "Total Volume",
  },
  registrations: {
    label: "Registrations",
    color: "var(--chart-1)",
  },
  attendance: {
    label: "Check-ins",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

interface ChartBarInteractiveProps {
  title?: string;
  description?: string;
  data: ActivityTimelinePoint[];
  totalRegistrations?: number;
  totalAttendance?: number;
}

export function ChartBarInteractive({
  title = "Registration & Check-in Velocity",
  description = "Showing daily participant registrations and checked-in attendance for the last 30 days",
  data,
  totalRegistrations,
  totalAttendance,
}: ChartBarInteractiveProps) {
  const [activeChart, setActiveChart] =
    React.useState<"registrations" | "attendance">("registrations");

  const total = React.useMemo(() => {
    return {
      registrations:
        totalRegistrations ??
        data.reduce((acc, curr) => acc + (curr.registrations || 0), 0),
      attendance:
        totalAttendance ??
        data.reduce((acc, curr) => acc + (curr.attendance || 0), 0),
    };
  }, [data, totalRegistrations, totalAttendance]);

  return (
    <Card className="py-0 overflow-hidden border-border bg-card">
      <CardHeader className="flex flex-col items-stretch border-b border-border p-0! sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:py-6">
          <CardTitle className="text-base font-bold text-foreground">
            {title}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {description}
          </CardDescription>
        </div>
        <div className="flex border-t border-border sm:border-t-0">
          {(["registrations", "attendance"] as const).map((key) => {
            return (
              <button
                key={key}
                type="button"
                data-active={activeChart === key}
                className="relative z-30 flex flex-1 flex-col justify-center gap-1 px-6 py-4 text-left border-border even:border-l data-[active=true]:bg-muted/40 transition-colors sm:px-8 sm:py-6"
                onClick={() => setActiveChart(key)}
              >
                <span className="text-xs font-medium text-muted-foreground">
                  {chartConfig[key].label}
                </span>
                <span className="text-lg leading-none font-bold text-foreground sm:text-2xl">
                  {total[key].toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[260px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
              top: 8,
              bottom: 8,
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
              tickFormatter={(value: string) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[160px]"
                  nameKey="views"
                  labelFormatter={(value) => {
                    return new Date(String(value)).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                  }}
                />
              }
            />
            <Bar
              dataKey={activeChart}
              fill={`var(--color-${activeChart})`}
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
