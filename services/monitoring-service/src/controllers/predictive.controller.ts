import { Request, Response, NextFunction } from "express";
import { anomalyDetectionService } from "../services/anomalyDetection.service";
import { fraudDetectionService } from "../services/fraudDetection.service";
import * as metricsService from "../services/metrics.service";

export const detectAnomalyHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = (req as any).tenantId;
    const { serviceName, metricName, value } = req.body;

    // Update baseline data
    anomalyDetectionService.updateBaseline(metricName, value);

    // Detect anomaly
    const anomaly = await anomalyDetectionService.detectAnomaly(tenantId, serviceName, metricName, value);

    res.json({
      anomaly_detected: !!anomaly,
      anomaly,
      baseline_updated: true
    });
  } catch (error) {
    next(error);
  }
};

export const detectOutageRiskHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = (req as any).tenantId;
    const { serviceName, metrics } = req.body;

    const prediction = await anomalyDetectionService.detectOutageRisk(tenantId, serviceName, metrics);

    res.json({
      outage_risk_detected: !!prediction,
      prediction,
      analyzed_metrics: Object.keys(metrics)
    });
  } catch (error) {
    next(error);
  }
};

export const detectFraudHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = (req as any).tenantId;
    const transactionData = req.body;

    const prediction = await fraudDetectionService.detectFraud(tenantId, transactionData);

    res.json({
      fraud_detected: !!prediction,
      prediction,
      risk_assessment: prediction ? {
        risk_level: prediction.risk_level,
        requires_review: prediction.requires_review,
        indicators: prediction.indicators
      } : null
    });
  } catch (error) {
    next(error);
  }
};

export const detectWeb3FraudHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = (req as any).tenantId;
    const web3Activity = req.body;

    const prediction = await fraudDetectionService.detectWeb3SuspiciousActivity(tenantId, web3Activity);

    res.json({
      suspicious_activity_detected: !!prediction,
      prediction,
      web3_risk_factors: prediction ? prediction.indicators : []
    });
  } catch (error) {
    next(error);
  }
};

export const getPredictiveInsightsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = (req as any).tenantId;
    const { timeRange } = req.query;

    // Placeholder for comprehensive insights
    const insights = {
      anomaly_trends: [],
      fraud_predictions: [],
      outage_predictions: [],
      system_health_score: 0.95,
      recommendations: [
        "Monitor CPU usage trends",
        "Review transaction patterns",
        "Check Web3 activity patterns"
      ],
      time_range: timeRange || "24h"
    };

    res.json(insights);
  } catch (error) {
    next(error);
  }
};

export const updateBaselineHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { metricName, value } = req.body;

    anomalyDetectionService.updateBaseline(metricName, value);

    res.json({
      message: "Baseline updated successfully",
      metric_name: metricName,
      value
    });
  } catch (error) {
    next(error);
  }
};
