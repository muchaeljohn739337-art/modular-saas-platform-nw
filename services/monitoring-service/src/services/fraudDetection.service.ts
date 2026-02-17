import { FraudPrediction } from "../models/predictive";
import { publishMonitoringEvent } from "../events/monitoring.events";

export class FraudDetectionService {
  private userBehaviorPatterns: Map<string, UserBehaviorProfile> = new Map();
  private transactionPatterns: Map<string, TransactionPattern> = new Map();

  async detectFraud(
    tenantId: string,
    transactionData: TransactionData
  ): Promise<FraudPrediction | null> {
    const risks: FraudRisk[] = [];

    // Analyze transaction volume
    const volumeRisk = await this.analyzeTransactionVolume(tenantId, transactionData);
    if (volumeRisk) risks.push(volumeRisk);

    // Analyze transaction frequency
    const frequencyRisk = await this.analyzeTransactionFrequency(tenantId, transactionData);
    if (frequencyRisk) risks.push(frequencyRisk);

    // Analyze behavioral patterns
    const behaviorRisk = await this.analyzeBehavioralPattern(tenantId, transactionData);
    if (behaviorRisk) risks.push(behaviorRisk);

    // Analyze pattern deviations
    const patternRisk = await this.analyzePatternDeviation(tenantId, transactionData);
    if (patternRisk) risks.push(patternRisk);

    if (risks.length === 0) {
      return null;
    }

    // Calculate overall risk score
    const overallRisk = this.calculateOverallRisk(risks);
    
    if (overallRisk.score > 0.7) { // High risk threshold
      const prediction: FraudPrediction = {
        id: `fraud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tenant_id: tenantId,
        prediction_type: this.getPrimaryRiskType(risks),
        risk_score: overallRisk.score,
        confidence: overallRisk.confidence,
        risk_level: this.getRiskLevel(overallRisk.score),
        indicators: risks.map(r => r.indicator),
        context: {
          transaction_volume: transactionData.volume,
          transaction_frequency: transactionData.frequency,
          user_behavior_score: risks.find(r => r.type === "behavioral")?.score || 0,
          pattern_deviation_score: risks.find(r => r.type === "pattern")?.score || 0,
          time_window: transactionData.timeWindow
        },
        requires_review: overallRisk.score > 0.8,
        created_at: new Date(),
        updated_at: new Date()
      };

      await this.publishFraudPredictionEvent(prediction);
      return prediction;
    }

    return null;
  }

  async detectWeb3SuspiciousActivity(
    tenantId: string,
    web3Activity: Web3ActivityData
  ): Promise<FraudPrediction | null> {
    const risks: FraudRisk[] = [];

    // Analyze wallet activity patterns
    if (web3Activity.walletTransactionCount > 100) {
      risks.push({
        type: "frequency_anomaly",
        indicator: "High wallet transaction frequency",
        score: 0.6,
        confidence: 0.8
      });
    }

    // Analyze transaction amounts
    if (web3Activity.largeTransactionCount > 10) {
      risks.push({
        type: "transaction_volume",
        indicator: "Unusual number of large transactions",
        score: 0.7,
        confidence: 0.9
      });
    }

    // Analyze contract interactions
    if (web3Activity.suspiciousContractInteractions > 0) {
      risks.push({
        type: "pattern_deviation",
        indicator: "Suspicious contract interactions detected",
        score: 0.8,
        confidence: 0.95
      });
    }

    // Analyze gas usage patterns
    if (web3Activity.abnormalGasUsage) {
      risks.push({
        type: "behavioral_anomaly",
        indicator: "Abnormal gas usage patterns",
        score: 0.5,
        confidence: 0.7
      });
    }

    if (risks.length === 0) {
      return null;
    }

    const overallRisk = this.calculateOverallRisk(risks);
    
    if (overallRisk.score > 0.6) {
      const prediction: FraudPrediction = {
        id: `web3_fraud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tenant_id: tenantId,
        prediction_type: "behavioral_anomaly",
        risk_score: overallRisk.score,
        confidence: overallRisk.confidence,
        risk_level: this.getRiskLevel(overallRisk.score),
        indicators: risks.map(r => r.indicator),
        context: {
          transaction_volume: web3Activity.totalVolume,
          transaction_frequency: web3Activity.walletTransactionCount,
          time_window: web3Activity.timeWindow
        },
        requires_review: overallRisk.score > 0.7,
        created_at: new Date(),
        updated_at: new Date()
      };

      await this.publishFraudPredictionEvent(prediction);
      return prediction;
    }

    return null;
  }

  private async analyzeTransactionVolume(tenantId: string, data: TransactionData): Promise<FraudRisk | null> {
    const baseline = this.getTransactionVolumeBaseline(tenantId);
    const threshold = baseline * 5; // 5x normal volume triggers alert

    if (data.volume > threshold) {
      return {
        type: "transaction_volume",
        indicator: `Transaction volume ${data.volume} exceeds baseline ${baseline}`,
        score: Math.min(data.volume / threshold, 1.0),
        confidence: 0.85
      };
    }

    return null;
  }

  private async analyzeTransactionFrequency(tenantId: string, data: TransactionData): Promise<FraudRisk | null> {
    const baseline = this.getTransactionFrequencyBaseline(tenantId);
    const threshold = baseline * 3; // 3x normal frequency triggers alert

    if (data.frequency > threshold) {
      return {
        type: "frequency_anomaly",
        indicator: `Transaction frequency ${data.frequency} exceeds baseline ${baseline}`,
        score: Math.min(data.frequency / threshold, 1.0),
        confidence: 0.9
      };
    }

    return null;
  }

  private async analyzeBehavioralPattern(tenantId: string, data: TransactionData): Promise<FraudRisk | null> {
    const userProfile = this.userBehaviorProfiles.get(tenantId);
    
    if (!userProfile) {
      return null;
    }

    const deviation = this.calculateBehavioralDeviation(userProfile, data);
    
    if (deviation > 0.7) {
      return {
        type: "behavioral_anomaly",
        indicator: "Unusual user behavior pattern detected",
        score: deviation,
        confidence: 0.8
      };
    }

    return null;
  }

  private async analyzePatternDeviation(tenantId: string, data: TransactionData): Promise<FraudRisk | null> {
    const pattern = this.transactionPatterns.get(tenantId);
    
    if (!pattern) {
      return null;
    }

    const deviation = this.calculatePatternDeviation(pattern, data);
    
    if (deviation > 0.8) {
      return {
        type: "pattern_deviation",
        indicator: "Significant deviation from normal transaction patterns",
        score: deviation,
        confidence: 0.95
      };
    }

    return null;
  }

  private calculateOverallRisk(risks: FraudRisk[]): { score: number; confidence: number } {
    const totalScore = risks.reduce((sum, risk) => sum + (risk.score * risk.confidence), 0);
    const totalConfidence = risks.reduce((sum, risk) => sum + risk.confidence, 0);
    
    return {
      score: totalConfidence > 0 ? totalScore / totalConfidence : 0,
      confidence: totalConfidence / risks.length
    };
  }

  private getPrimaryRiskType(risks: FraudRisk[]): string {
    const highestRisk = risks.reduce((max, risk) => 
      risk.score > max.score ? risk : max
    );
    return highestRisk.type;
  }

  private getRiskLevel(score: number): "low" | "medium" | "high" | "critical" {
    if (score < 0.3) return "low";
    if (score < 0.6) return "medium";
    if (score < 0.8) return "high";
    return "critical";
  }

  private getTransactionVolumeBaseline(tenantId: string): number {
    // Placeholder - would fetch from database
    return 10000; // $10,000 baseline
  }

  private getTransactionFrequencyBaseline(tenantId: string): number {
    // Placeholder - would fetch from database
    return 50; // 50 transactions baseline
  }

  private calculateBehavioralDeviation(profile: UserBehaviorProfile, data: TransactionData): number {
    // Simplified behavioral analysis
    const timeDeviation = Math.abs(data.averageTimeBetweenTransactions - profile.avgTimeBetweenTx) / profile.avgTimeBetweenTx;
    const amountDeviation = Math.abs(data.averageAmount - profile.avgAmount) / profile.avgAmount;
    
    return (timeDeviation + amountDeviation) / 2;
  }

  private calculatePatternDeviation(pattern: TransactionPattern, data: TransactionData): number {
    // Simplified pattern analysis
    const volumeDeviation = Math.abs(data.volume - pattern.typicalVolume) / pattern.typicalVolume;
    const frequencyDeviation = Math.abs(data.frequency - pattern.typicalFrequency) / pattern.typicalFrequency;
    
    return (volumeDeviation + frequencyDeviation) / 2;
  }

  private async publishFraudPredictionEvent(prediction: FraudPrediction): Promise<void> {
    await publishMonitoringEvent("monitoring.fraud_predicted", {
      prediction_id: prediction.id,
      tenant_id: prediction.tenant_id,
      prediction_type: prediction.prediction_type,
      risk_score: prediction.risk_score,
      risk_level: prediction.risk_level,
      requires_review: prediction.requires_review,
      indicators: prediction.indicators
    });
  }
}

// Helper interfaces
interface UserBehaviorProfile {
  userId: string;
  avgTimeBetweenTx: number;
  avgAmount: number;
  typicalHours: number[];
  riskScore: number;
}

interface TransactionPattern {
  tenantId: string;
  typicalVolume: number;
  typicalFrequency: number;
  typicalAmountRange: { min: number; max: number };
  peakHours: number[];
}

interface TransactionData {
  volume: number;
  frequency: number;
  averageAmount: number;
  averageTimeBetweenTransactions: number;
  timeWindow: string;
}

interface Web3ActivityData {
  walletTransactionCount: number;
  largeTransactionCount: number;
  suspiciousContractInteractions: number;
  abnormalGasUsage: boolean;
  totalVolume: number;
  timeWindow: string;
}

interface FraudRisk {
  type: string;
  indicator: string;
  score: number;
  confidence: number;
}

export const fraudDetectionService = new FraudDetectionService();
