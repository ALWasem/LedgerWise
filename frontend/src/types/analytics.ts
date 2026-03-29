export interface MonthlyAggregate {
  year: number;
  month: number;
  label: string;
  total: number;
}

export interface AnalyticsSummary {
  twelveMonthTotal: number;
  monthlyAverage: number;
  highestMonth: MonthlyAggregate;
  lowestMonth: MonthlyAggregate;
  months: MonthlyAggregate[];
}
