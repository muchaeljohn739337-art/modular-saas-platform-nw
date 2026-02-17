export interface Anomaly {
  id: string;
  tenant_id: string;
  metric_name: string;
  service_name: string;
  anomaly_score: number;
  threshold: number;
  confidence: number;
  detected_at: Date;
  resolved_at?: Date;
  status: "active" | "investigating" | "resolved" | "false_positive";
  metadata: {
    baseline_mean: number;
    baseline_std: number;
    current_value: number;
    z_score: number;
    trend_direction: "increasing" | "decreasing" | "stable";
  };
  created_at: Date;
  updated_at: Date;
}

export interface FraudPrediction {
  id: string;
  tenant_id: string;
  prediction_type: "transaction_volume" | "frequency_anomaly" | "pattern_deviation" | "behavioral_anomaly";
  risk_score: number;
  confidence: number;
  risk_level: "low" | "medium" | "high" | "critical";
  indicators: string[];
  context: {
    transaction_volume?: number;
    transaction_frequency?: number;
    user_behavior_score?: number;
    pattern_deviation_score?: number;
    time_window: string;
  };
  requires_review: boolean;
  reviewed_by?: string;
  reviewed_at?: Date;
  false_positive?: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface OutagePrediction {
  id: string;
  tenant_id: string;
  service_name: string;
  prediction_confidence: number;
  time_to_failure: number; // minutes
  risk_factors: string[];
  affected_metrics: string[];
  recommended_actions: string[];
  status: "predicted" | "mitigated" | "occurred" | "false_positive";
  predicted_at: Date;
  actual_occurrence_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface PredictiveModel {
  id: string;
  name: string;
  type: "anomaly_detection" | "fraud_prediction" | "outage_prediction";
  algorithm: "z_score" | "isolation_forest" | "linear_regression" | "neural_network";
  version: string;
  is_active: boolean;
  accuracy: number;
  last_trained_at: Date;
  training_data_period: string;
  hyperparameters: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}
