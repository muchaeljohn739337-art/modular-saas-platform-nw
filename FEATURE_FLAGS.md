# Advancia PayLedger - Feature Flags Implementation Guide

**Purpose**: Manage feature rollout and experimentation  
**Audience**: Backend Engineers, Product Managers  
**Last Updated**: March 9, 2026

---

## Feature Flag Architecture

### Flag Types

#### 1. Release Flags
Enable/disable features during deployment

```typescript
// services/featureFlags.ts
interface ReleaseFlag {
  name: string;
  enabled: boolean;
  rolloutPercentage: number;
  targetUsers?: string[];
}

const releaseFlags: Record<string, ReleaseFlag> = {
  newPaymentFlow: {
    name: 'newPaymentFlow',
    enabled: true,
    rolloutPercentage: 100,
    targetUsers: []
  },
  advancedReporting: {
    name: 'advancedReporting',
    enabled: true,
    rolloutPercentage: 50,
    targetUsers: []
  }
};
```

#### 2. Experiment Flags
A/B testing and experimentation

```typescript
interface ExperimentFlag {
  name: string;
  enabled: boolean;
  variants: {
    control: number;
    treatment: number;
  };
  targetUsers?: string[];
}

const experimentFlags: Record<string, ExperimentFlag> = {
  paymentUIVariant: {
    name: 'paymentUIVariant',
    enabled: true,
    variants: {
      control: 50,
      treatment: 50
    }
  }
};
```

#### 3. Permission Flags
Control access to features

```typescript
interface PermissionFlag {
  name: string;
  enabled: boolean;
  roles: string[];
  permissions: string[];
}

const permissionFlags: Record<string, PermissionFlag> = {
  adminDashboard: {
    name: 'adminDashboard',
    enabled: true,
    roles: ['ADMIN', 'SUPER_ADMIN'],
    permissions: ['admin:read', 'admin:write']
  }
};
```

---

## Implementation

### Feature Flag Service

```typescript
// services/featureFlagService.ts
import Redis from 'redis';

class FeatureFlagService {
  private redis: Redis.RedisClient;
  private flags: Map<string, any>;

  constructor() {
    this.redis = Redis.createClient({ url: process.env.REDIS_URL });
    this.flags = new Map();
    this.loadFlags();
  }

  async loadFlags() {
    // Load from cache first
    const cached = await this.redis.get('feature-flags');
    if (cached) {
      this.flags = new Map(JSON.parse(cached));
      return;
    }

    // Load from database
    const dbFlags = await this.loadFromDatabase();
    this.flags = new Map(dbFlags);

    // Cache for 1 hour
    await this.redis.setex(
      'feature-flags',
      3600,
      JSON.stringify(Array.from(this.flags.entries()))
    );
  }

  isEnabled(flagName: string, context?: any): boolean {
    const flag = this.flags.get(flagName);
    if (!flag) return false;

    if (!flag.enabled) return false;

    // Check rollout percentage
    if (context?.userId) {
      const hash = this.hashUserId(context.userId);
      const percentage = hash % 100;
      return percentage < flag.rolloutPercentage;
    }

    return true;
  }

  getVariant(flagName: string, context?: any): string {
    const flag = this.flags.get(flagName);
    if (!flag || !flag.variants) return 'control';

    if (context?.userId) {
      const hash = this.hashUserId(context.userId);
      const percentage = hash % 100;

      if (percentage < flag.variants.control) {
        return 'control';
      } else {
        return 'treatment';
      }
    }

    return 'control';
  }

  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  async updateFlag(flagName: string, updates: any) {
    const flag = this.flags.get(flagName);
    if (!flag) throw new Error(`Flag not found: ${flagName}`);

    const updated = { ...flag, ...updates };
    this.flags.set(flagName, updated);

    // Update database
    await this.saveToDatabase(flagName, updated);

    // Invalidate cache
    await this.redis.del('feature-flags');
  }

  private async loadFromDatabase() {
    // Implementation depends on database
    const flags = await prisma.featureFlag.findMany();
    return flags.map(f => [f.name, f.config]);
  }

  private async saveToDatabase(name: string, config: any) {
    await prisma.featureFlag.upsert({
      where: { name },
      update: { config },
      create: { name, config }
    });
  }
}

export const featureFlagService = new FeatureFlagService();
```

### Middleware Integration

```typescript
// middleware/featureFlags.ts
import { featureFlagService } from '@/services/featureFlagService';

export function withFeatureFlag(flagName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const context = {
      userId: req.user?.id,
      role: req.user?.role,
      organization: req.user?.organization
    };

    const isEnabled = featureFlagService.isEnabled(flagName, context);

    if (!isEnabled) {
      return res.status(404).json({ error: 'Feature not found' });
    }

    req.featureContext = { flagName, isEnabled };
    next();
  };
}

// Usage in routes
router.get('/api/advanced-reporting', withFeatureFlag('advancedReporting'), (req, res) => {
  // Feature is enabled
  res.json({ data: [] });
});
```

### Client-Side Feature Flags

```typescript
// hooks/useFeatureFlag.ts
import { useEffect, useState } from 'react';

export function useFeatureFlag(flagName: string) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [variant, setVariant] = useState('control');

  useEffect(() => {
    // Fetch flag status from API
    fetch(`/api/feature-flags/${flagName}`)
      .then(res => res.json())
      .then(data => {
        setIsEnabled(data.enabled);
        setVariant(data.variant);
      });
  }, [flagName]);

  return { isEnabled, variant };
}

// Usage in component
function PaymentForm() {
  const { isEnabled, variant } = useFeatureFlag('newPaymentFlow');

  if (isEnabled && variant === 'treatment') {
    return <NewPaymentFlow />;
  }

  return <LegacyPaymentFlow />;
}
```

---

## Rollout Strategies

### Gradual Rollout

```typescript
// Gradually increase rollout percentage
const rolloutSchedule = [
  { date: '2026-03-10', percentage: 10 },
  { date: '2026-03-12', percentage: 25 },
  { date: '2026-03-15', percentage: 50 },
  { date: '2026-03-18', percentage: 75 },
  { date: '2026-03-20', percentage: 100 }
];

async function executeRolloutSchedule() {
  for (const { date, percentage } of rolloutSchedule) {
    if (new Date() >= new Date(date)) {
      await featureFlagService.updateFlag('newPaymentFlow', {
        rolloutPercentage: percentage
      });
    }
  }
}
```

### Canary Deployment

```typescript
// Deploy to specific users first
const canaryUsers = [
  'user-admin-1',
  'user-admin-2',
  'user-test-1'
];

const isCanaryUser = (userId: string) => canaryUsers.includes(userId);

function isFeatureEnabled(flagName: string, userId: string) {
  if (isCanaryUser(userId)) {
    return true; // Always enable for canary users
  }

  return featureFlagService.isEnabled(flagName, { userId });
}
```

### Blue-Green Deployment

```typescript
// Feature flag for blue-green deployment
const deploymentFlags = {
  useNewBackend: {
    enabled: true,
    percentage: 50
  }
};

// Route requests based on flag
function getBackendUrl(userId: string) {
  const variant = featureFlagService.getVariant('useNewBackend', { userId });

  if (variant === 'treatment') {
    return 'https://new-backend.advancia.com';
  }

  return 'https://old-backend.advancia.com';
}
```

---

## Monitoring & Analytics

### Flag Usage Tracking

```typescript
// services/flagAnalytics.ts
async function trackFlagUsage(flagName: string, userId: string, enabled: boolean) {
  await prisma.flagUsageLog.create({
    data: {
      flagName,
      userId,
      enabled,
      timestamp: new Date()
    }
  });

  // Publish to analytics
  await publishEvent('feature_flag_used', {
    flagName,
    userId,
    enabled
  });
}
```

### Metrics Collection

```typescript
// Collect flag metrics
async function getFlagMetrics(flagName: string, startDate: Date, endDate: Date) {
  const logs = await prisma.flagUsageLog.findMany({
    where: {
      flagName,
      timestamp: {
        gte: startDate,
        lte: endDate
      }
    }
  });

  const enabled = logs.filter(l => l.enabled).length;
  const total = logs.length;
  const enabledPercentage = (enabled / total) * 100;

  return {
    flagName,
    total,
    enabled,
    disabled: total - enabled,
    enabledPercentage,
    uniqueUsers: new Set(logs.map(l => l.userId)).size
  };
}
```

### Dashboard

```typescript
// pages/admin/feature-flags.tsx
export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState([]);
  const [metrics, setMetrics] = useState({});

  useEffect(() => {
    // Fetch flags and metrics
    Promise.all([
      fetch('/api/admin/feature-flags').then(r => r.json()),
      fetch('/api/admin/feature-flags/metrics').then(r => r.json())
    ]).then(([flagsData, metricsData]) => {
      setFlags(flagsData);
      setMetrics(metricsData);
    });
  }, []);

  return (
    <div>
      <h1>Feature Flags</h1>
      <table>
        <thead>
          <tr>
            <th>Flag Name</th>
            <th>Enabled</th>
            <th>Rollout %</th>
            <th>Users</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {flags.map(flag => (
            <tr key={flag.name}>
              <td>{flag.name}</td>
              <td>{flag.enabled ? 'Yes' : 'No'}</td>
              <td>{flag.rolloutPercentage}%</td>
              <td>{metrics[flag.name]?.uniqueUsers || 0}</td>
              <td>
                <button onClick={() => toggleFlag(flag.name)}>Toggle</button>
                <button onClick={() => editFlag(flag.name)}>Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## Best Practices

### 1. Flag Naming Convention
```
{feature}_{type}_{variant}
newPaymentFlow_release_v1
advancedReporting_experiment_uiA
adminPanel_permission_superAdmin
```

### 2. Flag Lifecycle
```
1. Create flag (disabled)
2. Test in development
3. Enable for canary users (10%)
4. Gradual rollout (25% → 50% → 75% → 100%)
5. Monitor metrics
6. Remove flag after 2 weeks at 100%
```

### 3. Monitoring Checklist
- [ ] Flag enabled/disabled correctly
- [ ] No performance degradation
- [ ] Error rates normal
- [ ] User feedback positive
- [ ] Metrics collected

### 4. Cleanup
```typescript
// Remove old flags
async function cleanupOldFlags() {
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  await prisma.featureFlag.deleteMany({
    where: {
      rolloutPercentage: 100,
      createdAt: { lt: twoWeeksAgo }
    }
  });
}
```

---

## API Endpoints

### Admin Endpoints

```typescript
// GET /api/admin/feature-flags
// List all feature flags

// POST /api/admin/feature-flags
// Create new feature flag

// PUT /api/admin/feature-flags/:name
// Update feature flag

// DELETE /api/admin/feature-flags/:name
// Delete feature flag

// GET /api/admin/feature-flags/:name/metrics
// Get metrics for flag
```

### Client Endpoints

```typescript
// GET /api/feature-flags/:name
// Check if flag is enabled for current user

// GET /api/feature-flags/:name/variant
// Get variant for A/B test
```

---

**Last Updated**: March 9, 2026  
**Status**: Production Ready
