/**
 * COMPLETE MOCK EXAMPLE - AI GOVERNANCE SYSTEM
 * 
 * This demonstrates all components working together
 * 100% MOCK - NO real database, NO real APIs
 * 
 * Run: node complete-mock-example.js
 * 
 * @mock-only - For demonstration purposes only
 */

// Mock imports (in real system, these would be actual imports)
// For demo purposes, we'll define inline

// ============================================================================
// MOCK: AIGovernanceController (simplified)
// ============================================================================
class MockAIGovernanceController {
  static registeredAgents = new Map();
  static activeOperations = new Map();

  static initialize() {
    console.log('🔐 [MOCK] Initializing AI Governance System...');
    console.log('✅ [MOCK] AI Governance System initialized\n');
  }

  static register(agentId, agentName, capabilities) {
    const agent = {
      id: agentId,
      name: agentName,
      capabilities,
      registeredAt: new Date(),
      status: 'idle',
      operationCount: 0
    };

    this.registeredAgents.set(agentId, agent);
    console.log(`✅ [MOCK] AI Agent registered: ${agentName} (${agentId})`);
  }

  static startOperation(operation) {
    this.activeOperations.set(operation.id, operation);
    const agent = this.registeredAgents.get(operation.agentId);
    agent.status = 'active';
    agent.operationCount++;
    console.log(`⏳ [MOCK] Operation started: ${operation.operation}`);
  }

  static completeOperation(operationId, success) {
    const operation = this.activeOperations.get(operationId);
    const agent = this.registeredAgents.get(operation.agentId);
    agent.status = 'idle';
    this.activeOperations.delete(operationId);
    console.log(`✅ [MOCK] Operation completed: ${operation.operation} (Success: ${success})\n`);
  }

  static getStatus() {
    return {
      registeredAgents: this.registeredAgents.size,
      activeOperations: this.activeOperations.size
    };
  }

  static getRegisteredAgents() {
    return Array.from(this.registeredAgents.values());
  }
}

// ============================================================================
// MOCK: DataProtectionLayer (simplified)
// ============================================================================
class MockDataProtectionLayer {
  static async sanitize(data) {
    console.log('🛡️  [MOCK] Sanitizing data...');
    
    // Mock: Remove sensitive fields
    const sanitized = { ...data };
    delete sanitized.ssn;
    delete sanitized.patientName;
    delete sanitized.creditCard;
    
    // Mock: Tokenize
    if (data.patientName) {
      sanitized.patientToken = `TOKEN_${Date.now()}`;
    }
    
    console.log('   Removed: ssn, patientName, creditCard');
    console.log('   Tokenized: patientName -> patientToken');
    console.log('✅ [MOCK] Data sanitized\n');
    
    return sanitized;
  }

  static detectLeak(dataString) {
    // Mock: Simple pattern check
    const hasSSN = /\d{3}-\d{2}-\d{4}/.test(dataString);
    if (hasSSN) {
      console.error('🚨 [MOCK] Data leak detected: SSN pattern found!');
      return true;
    }
    return false;
  }
}

// ============================================================================
// MOCK: BaseGovernedAgent (simplified)
// ============================================================================
class MockBaseGovernedAgent {
  constructor(config) {
    this.agentId = config.agentId;
    this.agentName = config.agentName;
    this.capabilities = config.capabilities;
    
    // Auto-register
    MockAIGovernanceController.register(
      this.agentId,
      this.agentName,
      this.capabilities
    );
  }

  async executeGoverned(operation, data, processor) {
    const operationId = `${this.agentId}-${Date.now()}`;
    
    const operationRecord = {
      id: operationId,
      agentId: this.agentId,
      operation,
      data,
      timestamp: new Date(),
      sanitized: false
    };

    try {
      // Step 1: Sanitize data
      const sanitizedData = await MockDataProtectionLayer.sanitize(data);
      operationRecord.data = sanitizedData;
      operationRecord.sanitized = true;

      // Step 2: Start operation
      MockAIGovernanceController.startOperation(operationRecord);

      // Step 3: Execute processor
      const result = await processor(sanitizedData);

      // Step 4: Complete operation
      MockAIGovernanceController.completeOperation(operationId, true);

      return result;
    } catch (error) {
      MockAIGovernanceController.completeOperation(operationId, false);
      throw error;
    }
  }
}

// ============================================================================
// MOCK: ClaimsAgent Example
// ============================================================================
class MockClaimsAgent extends MockBaseGovernedAgent {
  constructor() {
    super({
      agentId: 'claims-processing-agent',
      agentName: 'Claims Processing Agent',
      capabilities: ['claim_analysis', 'approval_decision']
    });
  }

  async process(input) {
    console.log('📋 [MOCK] Processing claim...\n');
    
    return await this.executeGoverned(
      'analyze_claim',
      input,
      async (sanitizedData) => {
        // Mock: AI processing
        console.log('🤖 [MOCK] AI analyzing claim...');
        console.log('   Input:', JSON.stringify(sanitizedData, null, 2));
        
        // Mock: Simulate AI response
        await this.mockDelay(1000);
        
        const result = {
          claimId: sanitizedData.claimId,
          approved: true,
          approvedAmount: sanitizedData.amount,
          confidence: 0.95
        };
        
        console.log('   Result:', JSON.stringify(result, null, 2));
        return result;
      }
    );
  }

  mockDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// MOCK: EligibilityAgent Example
// ============================================================================
class MockEligibilityAgent extends MockBaseGovernedAgent {
  constructor() {
    super({
      agentId: 'eligibility-verification-agent',
      agentName: 'Eligibility Verification Agent',
      capabilities: ['eligibility_check', 'insurance_verification']
    });
  }

  async process(input) {
    console.log('🔍 [MOCK] Checking eligibility...\n');
    
    return await this.executeGoverned(
      'check_eligibility',
      input,
      async (sanitizedData) => {
        // Mock: AI processing
        console.log('🤖 [MOCK] AI verifying eligibility...');
        console.log('   Input:', JSON.stringify(sanitizedData, null, 2));
        
        await this.mockDelay(800);
        
        const result = {
          eligible: true,
          coverageLevel: 'full',
          reason: 'Active insurance verified'
        };
        
        console.log('   Result:', JSON.stringify(result, null, 2));
        return result;
      }
    );
  }

  mockDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// MOCK: DEMO EXECUTION
// ============================================================================
async function runMockDemo() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                                                          ║');
  console.log('║  ADVANCIA PAY LEDGER - AI GOVERNANCE MOCK DEMO          ║');
  console.log('║                                                          ║');
  console.log('║  100% MOCK - No real database, No real APIs             ║');
  console.log('║                                                          ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('\n');

  // Initialize governance system
  MockAIGovernanceController.initialize();

  // Create agents (they auto-register)
  console.log('📦 Creating AI Agents...\n');
  const claimsAgent = new MockClaimsAgent();
  const eligibilityAgent = new MockEligibilityAgent();
  console.log('');

  // Show registered agents
  console.log('📊 Registered Agents:');
  const agents = MockAIGovernanceController.getRegisteredAgents();
  agents.forEach(agent => {
    console.log(`   - ${agent.name} (${agent.id})`);
  });
  console.log('\n');

  // Process a claim (with sensitive data that will be sanitized)
  console.log('═══════════════════════════════════════════════════════════');
  console.log('SCENARIO 1: Process Healthcare Claim');
  console.log('═══════════════════════════════════════════════════════════\n');

  const claimData = {
    claimId: 'CLAIM-12345',
    patientName: 'John Doe',  // Will be sanitized
    ssn: '123-45-6789',       // Will be removed
    amount: 1500,
    serviceCode: 'X1234'
  };

  console.log('📝 Input (includes sensitive data):');
  console.log(JSON.stringify(claimData, null, 2));
  console.log('\n');

  const claimResult = await claimsAgent.process(claimData);

  console.log('🎉 Final Result:');
  console.log(JSON.stringify(claimResult, null, 2));
  console.log('\n');

  // Check eligibility
  console.log('═══════════════════════════════════════════════════════════');
  console.log('SCENARIO 2: Check Patient Eligibility');
  console.log('═══════════════════════════════════════════════════════════\n');

  const eligibilityData = {
    patientName: 'Jane Smith',  // Will be sanitized
    insuranceId: 'INS-98765',
    creditCard: '4532-1234-5678-9012'  // Will be removed
  };

  console.log('📝 Input (includes sensitive data):');
  console.log(JSON.stringify(eligibilityData, null, 2));
  console.log('\n');

  const eligibilityResult = await eligibilityAgent.process(eligibilityData);

  console.log('🎉 Final Result:');
  console.log(JSON.stringify(eligibilityResult, null, 2));
  console.log('\n');

  // Show final governance status
  console.log('═══════════════════════════════════════════════════════════');
  console.log('GOVERNANCE STATUS');
  console.log('═══════════════════════════════════════════════════════════\n');

  const status = MockAIGovernanceController.getStatus();
  console.log('📊 System Status:');
  console.log(`   Registered Agents: ${status.registeredAgents}`);
  console.log(`   Active Operations: ${status.activeOperations}`);
  console.log('\n');

  console.log('📋 Agent Details:');
  agents.forEach(agent => {
    console.log(`   ${agent.name}:`);
    console.log(`      Status: ${agent.status}`);
    console.log(`      Operations: ${agent.operationCount}`);
    console.log(`      Capabilities: ${agent.capabilities.join(', ')}`);
  });
  console.log('\n');

  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                                                          ║');
  console.log('║  ✅ MOCK DEMO COMPLETE                                   ║');
  console.log('║                                                          ║');
  console.log('║  Key Points:                                             ║');
  console.log('║  - All agents auto-registered                            ║');
  console.log('║  - Sensitive data auto-sanitized                         ║');
  console.log('║  - All operations tracked                                ║');
  console.log('║  - Zero database or API calls                            ║');
  console.log('║  - Everything in memory only                             ║');
  console.log('║                                                          ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
}

// Run the demo
runMockDemo().catch(console.error);
