import { Anomaly, FraudPrediction, OutagePrediction } from "../models/predictive";
import { publishMonitoringEvent } from "../events/monitoring.events";

export class AnomalyDetectionService {
  private baselineData: Map<string, number[]> = new Map();
  private thresholds: Map<string, number> = new Map();

  constructor() {
    this.initializeThresholds();
  }

  private initializeThresholds(): void {
    // Default thresholds for different metric types
    this.thresholds.set("cpu_usage", 2.5); // Z-score threshold
    this.thresholds.set("memory_usage", 2.5);
    this.thresholds.set("response_time", 3.0);
    this.thresholds.set("error_rate", 2.0);
    this.thresholds.set("transaction_volume", 3.5);
    this.thresholds.set("api_calls", 2.5);
  }

  async detectAnomaly(
    tenantId: string,
    serviceName: string,
    metricName: string,
    currentValue: number
  ): Promise<Anomaly | null> {
    const historicalData = this.getHistoricalData(metricName);
    
    if (historicalData.length < 10) {
      // Not enough data for anomaly detection
      return null;
    }

    const analysis = this.calculateZScore(historicalData, currentValue);
    const threshold = this.thresholds.get(metricName) || 2.5;

    if (Math.abs(analysis.zScore) > threshold) {
      const anomaly: Anomaly = {
        id: `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tenant_id: tenantId,
        metric_name: metricName,
        service_name: serviceName,
        anomaly_score: Math.abs(analysis.zScore),
        threshold,
        confidence: this.calculateConfidence(analysis.zScore, historicalData.length),
        detected_at: new Date(),
        status: "active",
        metadata: {
          baseline_mean: analysis.mean,
          baseline_std: analysis.stdDev,
          current_value: currentValue,
          z_score: analysis.zScore,
          trend_direction: this.detectTrend(historicalData)
        },
        created_at: new Date(),
        updated_at: new Date()
      };

      await this.publishAnomalyEvent(anomaly);
      return anomaly;
    }

    return null;
  }

  async detectOutageRisk(
    tenantId: string,
    serviceName: string,
    metrics: Record<string, number>
  ): Promise<OutagePrediction | null> {
    const riskFactors: string[] = [];
    let totalRiskScore = 0;

    // Analyze multiple metrics for outage prediction
    if (metrics.cpu_usage > 85) {
      riskFactors.push("High CPU usage");
      totalRiskScore += 0.3;
    }

    if (metrics.memory_usage > 90) {
      riskFactors.push("High memory usage");
      totalRiskScore += 0.3;
    }

    if (metrics.error_rate > 10) {
      riskFactors.push("High error rate");
      totalRiskScore += 0.4;
    }

    if (metrics.response_time > 2000) {
      riskFactors.push("High response time");
      totalRiskScore += 0.2;
    }

    if (totalRiskScore > 0.6) {
      const prediction: OutagePrediction = {
        id: `outage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tenant_id: tenantId,
        service_name: serviceName,
        prediction_confidence: totalRiskScore,
        time_to_failure: Math.max(5, 60 - (totalRiskScore * 30)), // 5-60 minutes
        risk_factors: riskFactors,
        affected_metrics: Object.keys(metrics),
        recommended_actions: this.generateRecommendations(riskFactors),
        status: "predicted",
        predicted_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      };

      await this.publishOutagePredictionEvent(prediction);
      return prediction;
    }

    return null;
  }

  private getHistoricalData(metricName: string): number[] {
    return this.baselineData.get(metricName) || [];
  }

  private calculateZScore(data: number[], value: number): { mean: number; stdDev: number; zScore: number } {
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);
    const zScore = stdDev === 0 ? 0 : (value - mean) / stdDev;

    return { mean, stdDev, zScore };
  }

  private calculateConfidence(zScore: number, dataPoints: number): number {
    // Confidence increases with higher Z-score and more data points
    const zScoreConfidence = Math.min(Math.abs(zScore) / 4, 1); // Normalize to 0-1
    const dataConfidence = Math.min(dataPoints / 100, 1); // More data = more confidence
    return (zScoreConfidence * 0.7) + (dataConfidence * 0.3);
  }

  private detectTrend(data: number[]): "increasing" | "decreasing" | "stable" {
    if (data.length < 3) return "stable";

    const recent = data.slice(-5);
    const older = data.slice(-10, -5);

    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;

    const change = (recentAvg - olderAvg) / olderAvg;

    if (change > 0.1) return "increasing";
    if (change < -0.1) return "decreasing";
    return "stable";
  }

  private generateRecommendations(riskFactors: string[]): string[] {
    const recommendations: string[] = [];

    if (riskFactors.includes("High CPU usage")) {
      recommendations.push("Scale up compute resources");
      recommendations.push("Optimize CPU-intensive operations");
    }

    if (riskFactors.includes("High memory usage")) {
      recommendations.push("Increase memory allocation");
      recommendations.push("Check for memory leaks");
    }

    if (riskFactors.includes("High error rate")) {
      recommendations.push("Investigate error logs");
      recommendations.push("Roll back recent deployments");
    }

    if (riskFactors.includes("High response time")) {
      recommendations.push("Check database performance");
      recommendations.push("Optimize slow queries");
    }

    return recommendations;
  }

  private async publishAnomalyEvent(anomaly: Anomaly): Promise<void> {
    await publishMonitoringEvent("monitoring.anomaly_detected", {
      anomaly_id: anomaly.id,
      tenant_id: anomaly.tenant_id,
      service_name: anomaly.service_name,
      metric_name: anomaly.metric_name,
      anomaly_score: anomaly.anomaly_score,
      confidence: anomaly.confidence
    });
  }

  private async publishOutagePredictionEvent(prediction: OutagePrediction): Promise<void> {
    await publishMonitoringEvent("monitoring.outage_predicted", {
      prediction_id: prediction.id,
      tenant_id: prediction.tenant_id,
      service_name: prediction.service_name,
      confidence: prediction.prediction_confidence,
      time_to_failure: prediction.time_to_failure,
      risk_factors: prediction.risk_factors
    });
  }

  // Update baseline data with new metrics
  updateBaseline(metricName: string, value: number): void {
    const data = this.baselineData.get(metricName) || [];
    data.push(value);
    
    // Keep only last 100 data points for rolling baseline
    if (data.length > 100) {
      data.shift();
    }
    
    this.baselineData.set(metricName, data);
  }
}

export const anomalyDetectionService = new AnomalyDetectionService();
