export interface NotificationData {
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  userId?: string;
  metadata?: Record<string, any>;
}

export interface BacktestNotificationData extends NotificationData {
  jobId: string;
  resultId?: string;
  strategyName: string;
  symbol: string;
  startDate: string;
  endDate: string;
}
