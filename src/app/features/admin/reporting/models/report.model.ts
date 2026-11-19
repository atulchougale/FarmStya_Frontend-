export interface ReportColumn { key: string; label: string; kind: 'text' | 'date' | 'money' | 'number'; }
export interface ReportDefinition { key: string; title: string; description: string; columns: ReportColumn[]; canExport: boolean; }
export interface ReportFilter {
  period: 'range' | 'month' | 'year' | 'all'; fromDate: string; toDate: string;
  month: number; year: number; bookingType: string; source: string; search: string; page: number; pageSize: number;
}
export interface ReportPage { columns: ReportColumn[]; rows: Record<string, unknown>[]; total: number; page: number; pageSize: number; periodLabel: string; }
