export type DashboardChartPoint = {
  name: string;
  sales: number;
  visits: number;
};

export type DashboardProductionItem = {
  label: string;
  value: number;
};

export type DashboardSummary = {
  businessName: string;
  stats: {
    receiptTotal: number;
    paymentTotal: number;
    peopleCount: number;
    avgDeliveryDays: number | null;
  };
  chartData: DashboardChartPoint[];
  productionStatus: DashboardProductionItem[];
};
