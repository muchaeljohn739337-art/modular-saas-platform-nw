# Sprint 7: Web3 Reliability v1

## Issue 33: Implement RPC provider pool

**Labels:** `sprint-7`, `web3`, `infrastructure`, `priority-high`

**Description:**  
Add multiple RPC endpoints per chain with health checks and weighted routing to ensure reliable blockchain connectivity.

**Tasks:**
- [ ] Add provider list configuration (primary + fallbacks) for each chain
- [ ] Implement health check loop for RPC providers
- [ ] Add weighted routing logic based on provider performance
- [ ] Implement failover logic when primary provider fails
- [ ] Add provider performance metrics tracking

**Acceptance criteria:**
- [ ] If primary RPC fails, system automatically switches to fallback
- [ ] Health status visible in logs and monitoring dashboard
- [ ] Provider performance metrics collected and stored
- [ ] Weighted routing improves overall reliability

**Technical implementation:**
```typescript
// services/web3/rpcProviderPool.ts
class RPCProviderPool {
  private providers: Map<string, RPCProvider[]>;
  private healthChecks: Map<string, HealthStatus>;
  
  async getBestProvider(chainId: string): Promise<RPCProvider>;
  async healthCheck(): Promise<void>;
  async failover(chainId: string): Promise<void>;
}
```

**Files to modify:**
- `backend/src/services/web3/rpcProviderPool.ts` (new)
- `backend/src/config/web3.ts` (update)
- `backend/src/services/web3/web3Service.ts` (update)

---

## Issue 34: Implement Web3 event ingestion pipeline

**Labels:** `sprint-7`, `web3`, `events`, `priority-high`

**Description:**  
Consume blockchain events reliably and store them for processing.

**Tasks:**
- [ ] Subscribe to contract events for all supported chains
- [ ] Normalize event payloads to standard format
- [ ] Store events in database with metadata
- [ ] Emit `web3.contract_event` to event bus
- [ ] Add event processing error handling

**Acceptance criteria:**
- [ ] Events stored with `tenant_id`, `block_number`, `tx_hash`
- [ ] Events emitted to event bus for downstream processing
- [ ] Event ingestion continues after temporary failures
- [ ] Event payload normalization consistent across chains

**Technical implementation:**
```typescript
// services/web3/eventIngestion.ts
class Web3EventIngestion {
  async subscribeToEvents(): Promise<void>;
  async normalizeEvent(event: RawEvent): Promise<NormalizedEvent>;
  async storeEvent(event: NormalizedEvent): Promise<void>;
  async emitEvent(event: NormalizedEvent): Promise<void>;
}
```

**Files to modify:**
- `backend/src/services/web3/eventIngestion.ts` (new)
- `backend/prisma/schema.prisma` (add web3_events table)
- `backend/src/services/eventBus/eventBus.ts` (update)

---

## Issue 35: Implement event deduplication

**Labels:** `sprint-7`, `web3`, `reliability`, `priority-medium`

**Description:**  
Prevent double-processing of Web3 events using idempotency keys.

**Tasks:**
- [ ] Create `processed_events` table
- [ ] Use `chain + tx_hash + log_index` as idempotency key
- [ ] Skip duplicate events during processing
- [ ] Add deduplication metrics and logging

**Acceptance criteria:**
- [ ] Duplicate events ignored and logged
- [ ] Deduplication visible in logs and metrics
- [ ] No duplicate processing of the same event
- [ ] Performance impact minimal (< 5ms overhead)

**Technical implementation:**
```sql
-- Add to schema.prisma
model ProcessedEvent {
  id          String   @id @default(cuid())
  chainId     String
  txHash      String
  logIndex    Int
  processedAt DateTime @default(now())
  
  @@unique([chainId, txHash, logIndex])
}
```

**Files to modify:**
- `backend/prisma/schema.prisma` (add table)
- `backend/src/services/web3/eventIngestion.ts` (update)
- `backend/src/services/web3/deduplication.ts` (new)

---

## Issue 36: Implement reorg detection + replay

**Labels:** `sprint-7`, `web3`, `reliability`, `priority-high`

**Description:**  
Handle chain reorganizations safely by detecting and replaying affected events.

**Tasks:**
- [ ] Track confirmations for each processed block
- [ ] Detect reorgs (block mismatch between current and stored)
- [ ] Mark affected events as invalid
- [ ] Replay events from safe block height
- [ ] Add reorg recovery metrics

**Acceptance criteria:**
- [ ] Reorgs detected and logged within 1 block
- [ ] Events replayed correctly from safe height
- [ ] Replay events logged with reorg context
- [ ] No data corruption during reorg recovery

**Technical implementation:**
```typescript
// services/web3/reorgHandler.ts
class ReorgHandler {
  async detectReorg(chainId: string): Promise<ReorgInfo | null>;
  async markEventsInvalid(reorgInfo: ReorgInfo): Promise<void>;
  async replayFromSafeBlock(chainId: string, safeBlock: number): Promise<void>;
}
```

**Files to modify:**
- `backend/src/services/web3/reorgHandler.ts` (new)
- `backend/prisma/schema.prisma` (add reorg tracking)
- `backend/src/services/web3/eventIngestion.ts` (update)

---

## Issue 37: Frontend — Web3 event viewer

**Labels:** `sprint-7`, `frontend`, `web3`, `priority-medium`

**Description:**  
Add UI for viewing Web3 events per tenant with filtering and reorg indicators.

**Tasks:**
- [ ] Create Web3 events table component
- [ ] Add filters (contract, event type, block range)
- [ ] Add reorg indicators for affected events
- [ ] Implement real-time event updates
- [ ] Add export functionality for audit

**Acceptance criteria:**
- [ ] Admin/Dev can inspect Web3 events for their tenant
- [ ] Filters work correctly and efficiently
- [ ] Reorg indicators clearly visible
- [ ] Real-time updates work without page refresh

**Technical implementation:**
```typescript
// components/Web3EventViewer.tsx
interface Web3EventViewerProps {
  tenantId: string;
}

const Web3EventViewer: React.FC<Web3EventViewerProps> = ({ tenantId }) => {
  // Component implementation
};
```

**Files to modify:**
- `frontend/components/Web3EventViewer.tsx` (new)
- `frontend/app/admin/web3-events/page.tsx` (new)
- `frontend/lib/api/web3.ts` (new API client)

---

## Sprint 7 Summary

**Focus:** Web3 Reliability v1
**Duration:** 2 weeks
**Priority:** High - Critical for blockchain data integrity

**Key Deliverables:**
- Reliable RPC provider management
- Robust event ingestion pipeline
- Event deduplication and reorg handling
- Web3 event monitoring UI

**Dependencies:**
- Sprint 6 (Monitoring & Security) must be complete
- Event bus infrastructure from Sprint 5
- Database schema supports Web3 events

**Success Metrics:**
- 99.9% RPC uptime with automatic failover
- Zero duplicate event processing
- Reorg recovery within 1 minute
- Complete event visibility for debugging
