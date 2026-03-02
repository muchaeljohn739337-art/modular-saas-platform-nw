import { logger } from '../utils/logger';

interface FraudAnalysisRequest {
  userId: string;
  invoiceId: string;
  amount: number;
  method: string;
  ipAddress?: string;
  userAgent?: string;
}

interface FraudAnalysisResult {
  isSuspicious: boolean;
  riskScore: number;
  reason?: string;
  flags: string[];
}

export class FraudDetectionService {
  private readonly RISK_THRESHOLDS = {
    HIGH_RISK: 80,
    MEDIUM_RISK: 60,
    LOW_RISK: 40
  };

  private readonly MAX_AMOUNT_PER_TRANSACTION = 10000; // $10,000
  private readonly MAX_TRANSACTIONS_PER_HOUR = 10;
  private readonly MAX_TRANSACTIONS_PER_DAY = 50;

  async analyzePayment(request: FraudAnalysisRequest): Promise<FraudAnalysisResult> {
    try {
      const flags: string[] = [];
      let riskScore = 0;

      // Check 1: Amount analysis
      const amountRisk = this.analyzeAmount(request.amount);
      riskScore += amountRisk.score;
      flags.push(...amountRisk.flags);

      // Check 2: Velocity analysis (frequency of transactions)
      const velocityRisk = await this.analyzeVelocity(request.userId);
      riskScore += velocityRisk.score;
      flags.push(...velocityRisk.flags);

      // Check 3: Location analysis
      const locationRisk = this.analyzeLocation(request.ipAddress);
      riskScore += locationRisk.score;
      flags.push(...locationRisk.flags);

      // Check 4: Device analysis
      const deviceRisk = this.analyzeDevice(request.userAgent);
      riskScore += deviceRisk.score;
      flags.push(...deviceRisk.flags);

      // Check 5: Payment method analysis
      const methodRisk = this.analyzePaymentMethod(request.method);
      riskScore += methodRisk.score;
      flags.push(...methodRisk.flags);

      // Normalize risk score to 0-100
      riskScore = Math.min(100, Math.max(0, riskScore));

      const isSuspicious = riskScore >= this.RISK_THRESHOLDS.HIGH_RISK;
      const reason = isSuspicious ? this.generateReason(flags, riskScore) : undefined;

      logger.info(`Fraud analysis completed for user ${request.userId}:`, {
        riskScore,
        isSuspicious,
        flags,
        amount: request.amount,
        method: request.method
      });

      return {
        isSuspicious,
        riskScore,
        reason,
        flags
      };
    } catch (error) {
      logger.error('Fraud analysis error:', error);
      // Default to allowing payment if fraud detection fails
      return {
        isSuspicious: false,
        riskScore: 0,
        flags: []
      };
    }
  }

  private analyzeAmount(amount: number): { score: number; flags: string[] } {
    const flags: string[] = [];
    let score = 0;

    // Very high amount threshold
    if (amount > this.MAX_AMOUNT_PER_TRANSACTION) {
      score += 40;
      flags.push('HIGH_AMOUNT_TRANSACTION');
    } else if (amount > 5000) {
      score += 20;
      flags.push('ELEVATED_AMOUNT_TRANSACTION');
    }

    // Round number analysis (potential testing)
    if (amount % 100 === 0 && amount > 1000) {
      score += 10;
      flags.push('ROUND_AMOUNT_PATTERN');
    }

    return { score, flags };
  }

  private async analyzeVelocity(userId: string): Promise<{ score: number; flags: string[] }> {
    const flags: string[] = [];
    let score = 0;

    try {
      // In a real implementation, you would query your database
      // for recent transactions by this user
      const recentTransactions = await this.getRecentTransactions(userId);

      // Check transactions per hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const transactionsLastHour = recentTransactions.filter(
        t => new Date(t.createdAt) > oneHourAgo
      ).length;

      if (transactionsLastHour > this.MAX_TRANSACTIONS_PER_HOUR) {
        score += 30;
        flags.push('HIGH_VELOCITY_HOURLY');
      }

      // Check transactions per day
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const transactionsLastDay = recentTransactions.filter(
        t => new Date(t.createdAt) > oneDayAgo
      ).length;

      if (transactionsLastDay > this.MAX_TRANSACTIONS_PER_DAY) {
        score += 25;
        flags.push('HIGH_VELOCITY_DAILY');
      }

      // Check for rapid successive transactions
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const transactionsLast5Minutes = recentTransactions.filter(
        t => new Date(t.createdAt) > fiveMinutesAgo
      ).length;

      if (transactionsLast5Minutes > 3) {
        score += 20;
        flags.push('RAPID_SUCCESSIVE_TRANSACTIONS');
      }
    } catch (error) {
      logger.error('Velocity analysis error:', error);
    }

    return { score, flags };
  }

  private analyzeLocation(ipAddress?: string): { score: number; flags: string[] } {
    const flags: string[] = [];
    let score = 0;

    if (!ipAddress) {
      return { score: 5, flags: ['MISSING_IP_ADDRESS'] };
    }

    // Check for suspicious IP patterns
    if (this.isPrivateIP(ipAddress)) {
      score += 5;
      flags.push('PRIVATE_IP_ADDRESS');
    }

    if (this.isKnownProxy(ipAddress)) {
      score += 15;
      flags.push('PROXY_DETECTED');
    }

    // In a real implementation, you would:
    // - Check geolocation against user's typical locations
    // - Check for high-risk countries
    // - Compare with previous IP addresses

    return { score, flags };
  }

  private analyzeDevice(userAgent?: string): { score: number; flags: string[] } {
    const flags: string[] = [];
    let score = 0;

    if (!userAgent) {
      return { score: 10, flags: ['MISSING_USER_AGENT'] };
    }

    // Check for suspicious user agent patterns
    if (this.isBotUserAgent(userAgent)) {
      score += 25;
      flags.push('SUSPICIOUS_USER_AGENT');
    }

    // In a real implementation, you would:
    // - Compare against known devices for the user
    // - Check for new device patterns
    // - Analyze device fingerprint

    return { score, flags };
  }

  private analyzePaymentMethod(method: string): { score: number; flags: string[] } {
    const flags: string[] = [];
    let score = 0;

    // Different risk levels for different payment methods
    switch (method) {
      case 'CREDIT_CARD':
        score += 5; // Low risk
        break;
      case 'DEBIT_CARD':
        score += 3; // Very low risk
        break;
      case 'ACH_TRANSFER':
        score += 10; // Medium risk
        break;
      case 'HEALTH_SAVINGS_ACCOUNT':
      case 'FLEXIBLE_SPENDING_ACCOUNT':
        score += 8; // Low-medium risk
        break;
      default:
        score += 15; // Unknown method - higher risk
        flags.push('UNKNOWN_PAYMENT_METHOD');
    }

    return { score, flags };
  }

  private generateReason(flags: string[], riskScore: number): string {
    if (riskScore >= 90) {
      return 'High-risk transaction detected due to multiple suspicious factors';
    } else if (riskScore >= 80) {
      return 'Elevated risk detected - manual review recommended';
    } else {
      return `Suspicious activity detected: ${flags.join(', ')}`;
    }
  }

  private isPrivateIP(ip: string): boolean {
    // Simple check for private IP ranges
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^127\./
    ];

    return privateRanges.some(range => range.test(ip));
  }

  private isKnownProxy(ip: string): boolean {
    // In a real implementation, you would check against known proxy/VPN databases
    return false;
  }

  private isBotUserAgent(userAgent: string): boolean {
    const botPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i
    ];

    return botPatterns.some(pattern => pattern.test(userAgent));
  }

  private async getRecentTransactions(userId: string): Promise<any[]> {
    // In a real implementation, you would query your database
    // For now, return empty array
    return [];
  }

  async reportSuspiciousActivity(userId: string, activity: any): Promise<void> {
    try {
      logger.warn(`Suspicious activity reported for user ${userId}:`, activity);
      
      // In a real implementation, you would:
      // - Store the report in your database
      // - Send alerts to security team
      // - Potentially block the user temporarily
      // - Update risk scores
      
      // Example: Send to monitoring service
      // await monitoringService.alert({
      //   type: 'FRAUD_SUSPICIOUS_ACTIVITY',
      //   userId,
      //   activity,
      //   timestamp: new Date()
      // });
    } catch (error) {
      logger.error('Report suspicious activity error:', error);
    }
  }

  async updateUserRiskProfile(userId: string, riskScore: number): Promise<void> {
    try {
      logger.info(`Updating risk profile for user ${userId}: ${riskScore}`);
      
      // In a real implementation, you would:
      // - Update user's risk score in database
      // - Adjust monitoring levels
      // - Update fraud detection thresholds for this user
      
    } catch (error) {
      logger.error('Update user risk profile error:', error);
    }
  }
}
