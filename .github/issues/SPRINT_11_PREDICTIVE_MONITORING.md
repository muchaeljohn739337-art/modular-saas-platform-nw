# Sprint 11: Predictive Monitoring v1

## Issue 53: Implement anomaly detection engine

**Labels:** `sprint-11`, `monitoring`, `ai`, `predictive`, `priority-high`

**Description:**  
Detect anomalies in system metrics using statistical methods and machine learning.

**Tasks:**
- [ ] Implement Z-score anomaly detection algorithm
- [ ] Add threshold-based alerting
- [ ] Create anomaly storage and tracking
- [ ] Implement anomaly scoring system
- [ ] Add anomaly trend analysis

**Acceptance criteria:**
- [ ] Anomalies detected and logged with confidence scores
- [ ] False positive rate < 5%
- [ ] Anomaly detection latency < 30 seconds
- [ ] Anomaly patterns stored for analysis

**Technical implementation:**
```typescript
// services/monitoring/anomalyDetection.ts
class AnomalyDetectionEngine {
  private zScoreThreshold = 3.0;
  private windowSize = 100; // data points
  
  async detectAnomalies(metric: string, dataPoints: MetricDataPoint[]): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];
    
    for (let i = this.windowSize; i < dataPoints.length; i++) {
      const window = dataPoints.slice(i - this.windowSize, i);
      const current = dataPoints[i];
      
      const zScore = this.calculateZScore(current.value, window);
      
      if (Math.abs(zScore) > this.zScoreThreshold) {
        anomalies.push({
          id: generateId(),
          metric,
          timestamp: current.timestamp,
          value: current.value,
          zScore,
          confidence: this.calculateConfidence(zScore),
          severity: this.calculateSeverity(zScore)
        });
      }
    }
    
    return anomalies;
  }
  
  private calculateZScore(value: number, window: MetricDataPoint[]): number {
    const values = window.map(point => point.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
    return (value - mean) / stdDev;
  }
  
  private calculateConfidence(zScore: number): number {
    return Math.min(Math.abs(zScore) / 5, 1.0);
  }
  
  private calculateSeverity(zScore: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const absZ = Math.abs(zScore);
    if (absZ < 3.5) return 'LOW';
    if (absZ < 4.5) return 'MEDIUM';
    if (absZ < 5.5) return 'HIGH';
    return 'CRITICAL';
  }
}

interface Anomaly {
  id: string;
  metric: string;
  timestamp: DateTime;
  value: number;
  zScore: number;
  confidence: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}
```

**Database schema:**
```sql
-- Add to schema.prisma
model Anomaly {
  id         String      @id @default(cuid())
  metric     String
  timestamp  DateTime
  value      Float
  zScore     Float
  confidence Float
  severity   AnomalySeverity
  resolved   Boolean     @default(false)
  createdAt  DateTime    @default(now())
  
  @@index([metric, timestamp])
  @@index([severity, resolved])
}
```

**Files to modify:**
- `backend/src/services/monitoring/anomalyDetection.ts` (new)
- `backend/src/services/monitoring/metricsCollector.ts` (update)
- `backend/prisma/schema.prisma` (add Anomaly table)
- `backend/src/controllers/monitoring.controller.ts` (update)

---

## Issue 54: Implement predictive outage detection

**Labels:** `sprint-11`, `monitoring`, `ai`, `predictive`, `priority-high`

**Description:**  
Predict potential outages based on metric trends and historical patterns.

**Tasks:**
- [ ] Implement EWMA (Exponentially Weighted Moving Average) trend analysis
- [ ] Create predictive scoring algorithm
- [ ] Emit `monitoring.outage_predicted` events
- [ ] Add prediction confidence intervals
- [ ] Implement prediction accuracy tracking

**Acceptance criteria:**
- [ ] Predictions visible in logs with confidence scores
- [ ] Events emitted to event bus for alerting
- [ ] Prediction accuracy > 80%
- [ ] False positive rate < 15%

**Technical implementation:**
```typescript
// services/monitoring/predictiveOutageDetection.ts
class PredictiveOutageDetection {
  private alpha = 0.3; // EWMA smoothing factor
  private predictionWindow = 3600; // 1 hour ahead
  private thresholdMultiplier = 2.0;
  
  async predictOutages(metrics: MetricData[]): Promise<OutagePrediction[]> {
    const predictions: OutagePrediction[] = [];
    
    for (const metric of this.getMonitoredMetrics(metrics)) {
      const trend = this.calculateEWMA(metric.data);
      const volatility = this.calculateVolatility(metric.data);
      const prediction = this.generatePrediction(metric.name, trend, volatility);
      
      if (prediction.probability > 0.7) {
        predictions.push(prediction);
        await this.emitOutagePrediction(prediction);
      }
    }
    
    return predictions;
  }
  
  private calculateEWMA(data: MetricDataPoint[]): EWMAData {
    let ewma = data[0].value;
    const trend: number[] = [];
    
    for (let i = 1; i < data.length; i++) {
      ewma = this.alpha * data[i].value + (1 - this.alpha) * ewma;
      trend.push(ewma);
    }
    
    return { values: trend, lastValue: ewma };
  }
  
  private calculateVolatility(data: MetricDataPoint[]): number {
    const returns = [];
    for (let i = 1; i < data.length; i++) {
      returns.push((data[i].value - data[i-1].value) / data[i-1].value);
    }
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }
  
  private generatePrediction(metric: string, trend: EWMAData, volatility: number): OutagePrediction {
    const projectedValue = this.projectValue(trend.lastValue, volatility, this.predictionWindow);
    const threshold = this.getThreshold(metric);
    const probability = this.calculateProbability(projectedValue, threshold, volatility);
    
    return {
      id: generateId(),
      metric,
      predictedAt: new Date(),
      predictedTime: new Date(Date.now() + this.predictionWindow * 1000),
      projectedValue,
      threshold,
      probability,
      confidence: this.calculateConfidence(probability, volatility)
    };
  }
  
  private async emitOutagePrediction(prediction: OutagePrediction): Promise<void> {
    await this.eventBus.emit('monitoring.outage_predicted', {
      prediction,
      timestamp: new Date(),
      severity: prediction.probability > 0.9 ? 'CRITICAL' : 'HIGH'
    });
  }
}

interface OutagePrediction {
  id: string;
  metric: string;
  predictedAt: DateTime;
  predictedTime: DateTime;
  projectedValue: number;
  threshold: number;
  probability: number;
  confidence: number;
}
```

**Files to modify:**
- `backend/src/services/monitoring/predictiveOutageDetection.ts` (new)
- `backend/src/services/eventBus/eventBus.ts` (update)
- `backend/src/services/monitoring/metricsCollector.ts` (update)

---

## Issue 55: Implement predictive fraud detection (Web3)

**Labels:** `sprint-11`, `web3`, `monitoring`, `security`, `priority-high`

**Description:**  
Detect suspicious wallet and contract activity using behavioral analysis.

**Tasks:**
- [ ] Implement frequency analysis heuristics
- [ ] Add transaction value pattern detection
- [ ] Create behavioral pattern recognition
- [ ] Implement fraud scoring algorithm
- [ ] Emit `monitoring.fraud_predicted` events

**Acceptance criteria:**
- [ ] Fraud predictions logged with risk scores
- [ ] Events emitted to event bus for security team
- [ ] False positive rate < 10%
- [ ] Detection latency < 5 minutes

**Technical implementation:**
```typescript
// services/web3/fraudDetection.ts
class Web3FraudDetection {
  private frequencyThreshold = 100; // transactions per hour
  private valueThreshold = 100000; // USD equivalent
  private patternWindow = 86400; // 24 hours
  
  async analyzeActivity(walletAddress: string, transactions: Web3Transaction[]): Promise<FraudPrediction[]> {
    const predictions: FraudPrediction[] = [];
    
    // Frequency analysis
    const frequencyScore = this.analyzeFrequency(transactions);
    
    // Value pattern analysis
    const valueScore = this.analyzeValuePatterns(transactions);
    
    // Behavioral pattern analysis
    const behaviorScore = this.analyzeBehavioralPatterns(walletAddress, transactions);
    
    // Time-based pattern analysis
    const timeScore = this.analyzeTimePatterns(transactions);
    
    const totalScore = this.calculateTotalScore(frequencyScore, valueScore, behaviorScore, timeScore);
    
    if (totalScore > 0.7) {
      const prediction: FraudPrediction = {
        id: generateId(),
        walletAddress,
        score: totalScore,
        confidence: this.calculateConfidence(totalScore),
        riskFactors: {
          frequency: frequencyScore,
          value: valueScore,
          behavior: behaviorScore,
          time: timeScore
        },
        detectedAt: new Date(),
        transactions: transactions.slice(-10) // Last 10 transactions
      };
      
      predictions.push(prediction);
      await this.emitFraudPrediction(prediction);
    }
    
    return predictions;
  }
  
  private analyzeFrequency(transactions: Web3Transaction[]): number {
    const recentTransactions = transactions.filter(tx => 
      Date.now() - tx.timestamp.getTime() < 3600000 // Last hour
    );
    
    if (recentTransactions.length > this.frequencyThreshold) {
      return Math.min(recentTransactions.length / this.frequencyThreshold, 1.0);
    }
    
    return 0;
  }
  
  private analyzeValuePatterns(transactions: Web3Transaction[]): number {
    const values = transactions.map(tx => tx.valueUSD);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const maxValue = Math.max(...values);
    
    if (maxValue > this.valueThreshold) {
      return Math.min(maxValue / this.valueThreshold, 1.0);
    }
    
    // Check for round numbers (potential money laundering)
    const roundNumbers = values.filter(val => val % 1000 < 1).length;
    const roundNumberRatio = roundNumbers / values.length;
    
    return roundNumberRatio > 0.8 ? 0.6 : 0;
  }
  
  private analyzeBehavioralPatterns(walletAddress: string, transactions: Web3Transaction[]): number {
    // Check for mixing services
    const mixingIndicators = transactions.filter(tx => 
      this.isMixingService(tx.toAddress)
    ).length;
    
    // Check for rapid in/out patterns
    const rapidPatterns = this.detectRapidInOut(transactions);
    
    // Check for unusual contract interactions
    const unusualContracts = transactions.filter(tx => 
      this.isUnusualContract(tx.toAddress)
    ).length;
    
    return Math.min((mixingIndicators + rapidPatterns + unusualContracts) / transactions.length, 1.0);
  }
  
  private async emitFraudPrediction(prediction: FraudPrediction): Promise<void> {
    await this.eventBus.emit('monitoring.fraud_predicted', {
      prediction,
      timestamp: new Date(),
      severity: prediction.score > 0.9 ? 'CRITICAL' : 'HIGH'
    });
  }
}

interface FraudPrediction {
  id: string;
  walletAddress: string;
  score: number;
  confidence: number;
  riskFactors: {
    frequency: number;
    value: number;
    behavior: number;
    time: number;
  };
  detectedAt: DateTime;
  transactions: Web3Transaction[];
}
```

**Files to modify:**
- `backend/src/services/web3/fraudDetection.ts` (new)
- `backend/src/services/eventBus/eventBus.ts` (update)
- `backend/src/services/web3/web3Service.ts` (update)

---

## Issue 56: Frontend — Predictive risk dashboard

**Labels:** `sprint-11`, `frontend`, `monitoring`, `predictive`, `priority-medium`

**Description:**  
Add predictive insights and risk visualization to Admin + Super Admin dashboards.

**Tasks:**
- [ ] Create risk heatmap visualization
- [ ] Add top predicted incidents list
- [ ] Implement trend charts with predictions
- [ ] Add fraud detection alerts interface
- [ ] Create predictive accuracy metrics

**Acceptance criteria:**
- [ ] Predictions visible in UI with confidence scores
- [ ] Risk heatmap shows system vulnerabilities
- [ ] Trend charts include prediction overlays
- [ ] Real-time fraud alerts displayed

**Technical implementation:**
```typescript
// components/PredictiveRiskDashboard.tsx
interface PredictiveRiskDashboardProps {
  tenantId: string;
  userRole: 'admin' | 'super_admin';
}

const PredictiveRiskDashboard: React.FC<PredictiveRiskDashboardProps> = ({ tenantId, userRole }) => {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [outagePredictions, setOutagePredictions] = useState<OutagePrediction[]>([]);
  const [fraudPredictions, setFraudPredictions] = useState<FraudPrediction[]>([]);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics>();
  
  return (
    <div className="predictive-risk-dashboard">
      <RiskHeatmap metrics={riskMetrics} />
      <TopPredictedIncidents 
        outages={outagePredictions} 
        fraud={fraudPredictions}
      />
      <PredictiveTrendCharts anomalies={anomalies} />
      <FraudAlerts predictions={fraudPredictions} />
      <PredictionAccuracyMetrics />
    </div>
  );
};

// components/RiskHeatmap.tsx
const RiskHeatmap: React.FC<{ metrics: RiskMetrics | undefined }> = ({ metrics }) => {
  if (!metrics) return <div>Loading risk metrics...</div>;
  
  return (
    <div className="risk-heatmap">
      <h3>System Risk Heatmap</h3>
      <div className="heatmap-grid">
        {Object.entries(metrics.categories).map(([category, risk]) => (
          <div 
            key={category}
            className={`risk-cell ${getRiskLevel(risk.score)}`}
            title={`${category}: ${risk.score.toFixed(2)}`}
          >
            <span className="category-name">{category}</span>
            <span className="risk-score">{(risk.score * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// components/TopPredictedIncidents.tsx
const TopPredictedIncidents: React.FC<{ 
  outages: OutagePrediction[];
  fraud: FraudPrediction[];
}> = ({ outages, fraud }) => {
  const allPredictions = [
    ...outages.map(o => ({ ...o, type: 'outage' })),
    ...fraud.map(f => ({ ...f, type: 'fraud' }))
  ].sort((a, b) => b.probability - a.probability).slice(0, 10);
  
  return (
    <div className="top-predicted-incidents">
      <h3>Top Predicted Incidents</h3>
      <div className="incidents-list">
        {allPredictions.map(prediction => (
          <div key={prediction.id} className={`incident-item ${prediction.type}`}>
            <div className="incident-type">{prediction.type.toUpperCase()}</div>
            <div className="incident-details">
              <span className="incident-metric">
                {prediction.type === 'outage' ? prediction.metric : prediction.walletAddress}
              </span>
              <span className="incident-probability">
                {(prediction.probability * 100).toFixed(1)}%
              </span>
            </div>
            <div className="incident-time">
              {formatTime(prediction.predictedTime)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

**Files to modify:**
- `frontend/components/PredictiveRiskDashboard.tsx` (new)
- `frontend/components/RiskHeatmap.tsx` (new)
- `frontend/components/TopPredictedIncidents.tsx` (new)
- `frontend/components/PredictiveTrendCharts.tsx` (new)
- `frontend/components/FraudAlerts.tsx` (new)
- `frontend/app/admin/predictive-monitoring/page.tsx` (new)
- `frontend/lib/api/predictiveMonitoring.ts` (new API client)

---

## Sprint 11 Summary

**Focus:** Predictive Monitoring v1
**Duration:** 2 weeks
**Priority:** High - Proactive system protection

**Key Deliverables:**
- Anomaly detection engine with statistical methods
- Predictive outage detection using trend analysis
- Web3 fraud detection with behavioral analysis
- Predictive risk dashboard with visualizations

**Dependencies:**
- Sprint 10 (Role-Based Consoles) must be complete
- Monitoring infrastructure from Sprint 5
- Web3 event pipeline from Sprint 7

**Success Metrics:**
- Anomaly detection accuracy > 90%
- Outage prediction accuracy > 80%
- Fraud detection false positive rate < 10%
- Prediction latency < 30 seconds

**Technical Goals:**
- Real-time anomaly detection
- Machine learning integration ready
- Comprehensive fraud pattern recognition
- Actionable predictive insights

**Business Value:**
- Proactive issue prevention
- Reduced system downtime
- Enhanced security posture
- Better resource planning

**Future Enhancements:**
- Machine learning model integration
- Advanced pattern recognition
- Cross-system correlation analysis
- Automated remediation triggers
