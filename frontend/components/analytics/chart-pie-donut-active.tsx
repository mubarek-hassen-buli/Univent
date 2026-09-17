"use client";

import * as React from "react";
import { TrendingUp } from "lucide-react";
import { Pie, PieChart, Sector } from "recharts";
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

export interface DonutDataItem {
  name: string;
  value: number;
  fill?: string;
}

interface ChartPieDonutActiveProps {
  title?: string;
  description?: string;
  data: DonutDataItem[];
  footerTrend?: string;
  footerDescription?: string;
}

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function ChartPieDonutActive({
  title = "Category Distribution",
  description = "Campus engagement across activity domains",
  data,
  footerTrend,
  footerDescription = "Live distribution of current platform events",
}: ChartPieDonutActiveProps) {
  const [activeIndex, setActiveIndex] = React.useState<number>(0);

  // Assign consistent palette colors to slices if not explicitly provided
  const chartData = React.useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      fill: item.fill || PALETTE[index % PALETTE.length],
    }));
  }, [data]);

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      value: {
        label: "Events",
      },
    };
    chartData.forEach((item, index) => {
      config[item.name.toLowerCase().replace(/[^a-z0-9]/g, "-")] = {
        label: item.name,
        color: PALETTE[index % PALETTE.length],
      };
    });
    return config;
  }, [chartData]);

  const totalValue = React.useMemo(
    () => chartData.reduce((acc, curr) => acc + curr.value, 0),
    [chartData]
  );

  const dominantItem = React.useMemo(() => {
    if (!chartData.length) return null;
    return [...chartData].sort((a, b) => b.value - a.value)[0];
  }, [chartData]);

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
      <CardContent className="flex-1 pb-0">
        {chartData.length === 0 || totalValue === 0 ? (
          <div className="flex h-[240px] items-center justify-center text-xs text-muted-foreground">
            No events registered yet
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[240px]"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                strokeWidth={4}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                shape={(props: unknown) => {
                  const p = props as { index?: number; outerRadius?: number };
                  const outerRadius = p.outerRadius ?? 0;
                  return (
                    <Sector
                      {...(props as React.ComponentProps<typeof Sector>)}
                      outerRadius={
                        p.index === activeIndex ? outerRadius + 8 : outerRadius
                      }
                    />
                  );
                }}
              />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="flex-col gap-1.5 text-center text-xs pt-4 border-t border-border/50">
        <div className="flex items-center justify-center gap-1.5 font-medium text-foreground">
          {footerTrend ? (
            <>
              {footerTrend} <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            </>
          ) : dominantItem && totalValue > 0 ? (
            <>
              <span className="font-semibold text-primary">{dominantItem.name}</span> leads with{" "}
              {Math.round((dominantItem.value / totalValue) * 100)}% volume{" "}
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            </>
          ) : (
            <span>Equally distributed</span>
          )}
        </div>
        <div className="text-[11px] text-muted-foreground">
          {footerDescription}
        </div>
      </CardFooter>
    </Card>
  );
}
