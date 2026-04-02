export interface MonthlyAggregate {
  year: number;
  month: number;
  label: string;
  total: number;
}

export type AnalyticsTimePeriod = '6m' | '12m' | 'ytd' | 'all';

export interface AnalyticsSummary {
  periodTotal: number;
  monthlyAverage: number;
  highestMonth: MonthlyAggregate;
  lowestMonth: MonthlyAggregate;
  months: MonthlyAggregate[];
}
