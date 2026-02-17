import { publishEvent } from "./eventBus";

export const publishMonitoringEvent = async (eventType: string, payload: any) => {
  return publishEvent(eventType, {
    ...payload,
    timestamp: new Date().toISOString(),
    service: "monitoring-service"
  });
};

export const MONITORING_EVENTS = {
  ANOMALY_DETECTED: "monitoring.anomaly_detected",
  OUTAGE_PREDICTED: "monitoring.outage_predicted",
  FRAUD_PREDICTED: "monitoring.fraud_predicted",
  WEB3_SUSPICIOUS_ACTIVITY: "monitoring.web3_suspicious_activity",
  BASELINE_UPDATED: "monitoring.baseline_updated",
  INSIGHTS_GENERATED: "monitoring.insights_generated"
} as const;
