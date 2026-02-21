import React, { useState, useEffect } from 'react';
import { useAdvanciaAPI } from '../api/advanciaClient';

const HealthcareAIDashboard = () => {
  const { apiClient, loading, error, withLoading } = useAdvanciaAPI();
  const [aiStats, setAiStats] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    loadAIDashboard();
  }, []);

  const loadAIDashboard = async () => {
    try {
      const result = await withLoading(async () => {
        return await apiClient.getAIDashboard();
      });
      if (result.success) {
        setAiStats(result.data);
      }
    } catch (err) {
      console.error('Failed to load AI dashboard:', err);
    }
  };

  const [medicalCoding, setMedicalCoding] = useState({
    description: '',
    serviceType: 'outpatient',
    result: null
  });

  const [fraudDetection, setFraudDetection] = useState({
    amount: '',
    description: '',
    recipient: '',
    result: null
  });

  const [eligibility, setEligibility] = useState({
    patientName: '',
    insuranceId: '',
    serviceType: '',
    estimatedCost: '',
    result: null
  });

  const handleMedicalCoding = async () => {
    if (!medicalCoding.description) return;
    
    try {
      const result = await withLoading(async () => {
        return await apiClient.analyzeMedicalCoding(
          medicalCoding.description,
          medicalCoding.serviceType
        );
      });
      
      if (result.success) {
        setMedicalCoding(prev => ({ ...prev, result: result.data }));
      }
    } catch (err) {
      console.error('Medical coding failed:', err);
    }
  };

  const handleFraudDetection = async () => {
    if (!fraudDetection.amount || !fraudDetection.description) return;
    
    try {
      const result = await withLoading(async () => {
        return await apiClient.detectFraud({
          amount: parseFloat(fraudDetection.amount),
          currency: 'USD',
          description: fraudDetection.description,
          recipient: fraudDetection.recipient
        });
      });
      
      if (result.success) {
        setFraudDetection(prev => ({ ...prev, result: result.data }));
      }
    } catch (err) {
      console.error('Fraud detection failed:', err);
    }
  };

  const handleEligibilityCheck = async () => {
    if (!eligibility.patientName || !eligibility.insuranceId) return;
    
    try {
      const result = await withLoading(async () => {
        return await apiClient.checkEligibility(
          {
            name: eligibility.patientName,
            insuranceId: eligibility.insuranceId,
            dateOfBirth: '1985-06-15'
          },
          {
            type: eligibility.serviceType,
            estimatedCost: parseFloat(eligibility.estimatedCost)
          }
        );
      });
      
      if (result.success) {
        setEligibility(prev => ({ ...prev, result: result.data }));
      }
    } catch (err) {
      console.error('Eligibility check failed:', err);
    }
  };

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  if (loading && !aiStats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading AI Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏥 Advancia Healthcare AI Dashboard
          </h1>
          <p className="text-gray-600">
            AI-powered medical coding, fraud detection, and insurance verification
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            Error: {error}
          </div>
        )}

        {/* AI Stats Overview */}
        {aiStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Processed</h3>
              <p className="text-2xl font-bold text-gray-900">{aiStats.stats.totalProcessed.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Accuracy Rate</h3>
              <p className="text-2xl font-bold text-green-600">{aiStats.stats.accuracyRate}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Fraud Prevented</h3>
              <p className="text-2xl font-bold text-red-600">{aiStats.stats.fraudPrevented}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Cost Savings</h3>
              <p className="text-2xl font-bold text-blue-600">{aiStats.stats.costSavings}</p>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {['dashboard', 'medical-coding', 'fraud-detection', 'eligibility'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'dashboard' && aiStats && (
              <div>
                <h2 className="text-xl font-semibold mb-4">AI Capabilities</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aiStats.capabilities.map((capability, index) => (
                    <div key={index} className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                        <span className="text-gray-700">{capability}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'medical-coding' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Medical Coding Automation</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Medical Description
                    </label>
                    <textarea
                      value={medicalCoding.description}
                      onChange={(e) => setMedicalCoding(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      rows={4}
                      placeholder="Describe the medical service..."
                    />
                  </div>
                  <button
                    onClick={handleMedicalCoding}
                    disabled={loading}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Analyzing...' : 'Generate Medical Codes'}
                  </button>

                  {medicalCoding.result && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="font-semibold text-green-800 mb-2">Suggested Billing Codes:</h3>
                      {medicalCoding.result.suggestedCodes.map((code, index) => (
                        <div key={index} className="mb-2">
                          <span className="font-mono bg-green-100 px-2 py-1 rounded">
                            {code.code}
                          </span>
                          <span className="ml-2 text-gray-700">{code.description}</span>
                          <span className="ml-2 text-sm text-gray-500">
                            ({(code.confidence * 100).toFixed(1)}% confidence)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'fraud-detection' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Fraud Detection</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Amount ($)
                    </label>
                    <input
                      type="number"
                      value={fraudDetection.amount}
                      onChange={(e) => setFraudDetection(prev => ({ ...prev, amount: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="1000.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={fraudDetection.description}
                      onChange={(e) => setFraudDetection(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="Payment description..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recipient
                    </label>
                    <input
                      type="text"
                      value={fraudDetection.recipient}
                      onChange={(e) => setFraudDetection(prev => ({ ...prev, recipient: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="Payment recipient..."
                    />
                  </div>
                  <button
                    onClick={handleFraudDetection}
                    disabled={loading}
                    className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {loading ? 'Analyzing...' : 'Detect Fraud'}
                  </button>

                  {fraudDetection.result && (
                    <div className={`border rounded-lg p-4 ${getRiskLevelColor(fraudDetection.result.fraudAnalysis.riskLevel)}`}>
                      <h3 className="font-semibold mb-2">
                        Risk Level: {fraudDetection.result.fraudAnalysis.riskLevel.toUpperCase()}
                      </h3>
                      <p className="mb-2">Risk Score: {fraudDetection.result.fraudAnalysis.riskScore}/100</p>
                      <p className="mb-2">Recommendation: {fraudDetection.result.fraudAnalysis.recommendation}</p>
                      {fraudDetection.result.fraudAnalysis.riskFactors.length > 0 && (
                        <div>
                          <strong>Risk Factors:</strong>
                          <ul className="list-disc list-inside mt-1">
                            {fraudDetection.result.fraudAnalysis.riskFactors.map((factor, index) => (
                              <li key={index}>{factor}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'eligibility' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Insurance Eligibility Check</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Patient Name
                    </label>
                    <input
                      type="text"
                      value={eligibility.patientName}
                      onChange={(e) => setEligibility(prev => ({ ...prev, patientName: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Insurance ID
                    </label>
                    <input
                      type="text"
                      value={eligibility.insuranceId}
                      onChange={(e) => setEligibility(prev => ({ ...prev, insuranceId: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="INS123456"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Type
                    </label>
                    <input
                      type="text"
                      value={eligibility.serviceType}
                      onChange={(e) => setEligibility(prev => ({ ...prev, serviceType: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="Specialist consultation"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estimated Cost ($)
                    </label>
                    <input
                      type="number"
                      value={eligibility.estimatedCost}
                      onChange={(e) => setEligibility(prev => ({ ...prev, estimatedCost: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="250.00"
                    />
                  </div>
                  <button
                    onClick={handleEligibilityCheck}
                    disabled={loading}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? 'Checking...' : 'Check Eligibility'}
                  </button>

                  {eligibility.result && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-800 mb-2">Eligibility Results</h3>
                      <p><strong>Insurer:</strong> {eligibility.result.eligibility.insurer}</p>
                      <p><strong>Coverage:</strong> {eligibility.result.eligibility.coverage}</p>
                      <p><strong>Copay:</strong> {eligibility.result.eligibility.copay}</p>
                      <p><strong>Eligible:</strong> {eligibility.result.eligibility.eligible ? 'Yes' : 'No'}</p>
                      <p><strong>Pre-auth Required:</strong> {eligibility.result.eligibility.preAuthRequired ? 'Yes' : 'No'}</p>
                      <p><strong>Estimated Reimbursement:</strong> {eligibility.result.eligibility.estimatedReimbursement}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthcareAIDashboard;
