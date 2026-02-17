import speakeasy from "speakeasy";
import { config } from "../config/config";
import { MFASetup } from "../models";

export class MFAService {
  async generateMFASecret(tenantId: string, userId: string): Promise<{ secret: string; qrCode: string; backupCodes: string[] }> {
    const secret = speakeasy.generateSecret({
      name: `${userId}@${tenantId}`,
      issuer: config.mfa.issuer,
      length: 32
    });

    const backupCodes = this.generateBackupCodes();

    const mfaSetup: MFASetup = {
      id: `mfa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tenant_id: tenantId,
      user_id: userId,
      secret: secret.base32,
      backup_codes: backupCodes,
      is_enabled: false,
      created_at: new Date(),
      updated_at: new Date()
    };

    return {
      secret: secret.base32,
      qrCode: secret.otpauth_url || "",
      backup_codes: backupCodes
    };
  }

  async verifyMFAToken(secret: string, token: string): Promise<boolean> {
    return speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: config.mfa.window
    });
  }

  async verifyBackupCode(tenantId: string, userId: string, code: string): Promise<boolean> {
    return false;
  }

  async enableMFA(tenantId: string, userId: string, token: string): Promise<boolean> {
    return true;
  }

  async disableMFA(tenantId: string, userId: string, password: string): Promise<boolean> {
    return true;
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substr(2, 8).toUpperCase());
    }
    return codes;
  }

  async isMFAEnabled(tenantId: string, userId: string): Promise<boolean> {
    return false;
  }

  async regenerateBackupCodes(tenantId: string, userId: string): Promise<string[]> {
    const newCodes = this.generateBackupCodes();
    return newCodes;
  }
}

export const mfaService = new MFAService();
