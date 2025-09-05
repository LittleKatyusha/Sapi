/**
 * CORS Test Panel Component
 * Provides a UI for testing and debugging CORS configuration
 */

import React, { useState, useEffect } from 'react';
import { validateApiCors, testCorsConnectivity, generateCorsTroubleshooting } from '../utils/corsHelper';
import { API_BASE_URL } from '../config/api';

const CorsTestPanel = () => {
  const [testResults, setTestResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [troubleshooting, setTroubleshooting] = useState(null);
  const [customApiUrl, setCustomApiUrl] = useState(API_BASE_URL || '');

  useEffect(() => {
    // Generate troubleshooting info on component mount
    setTroubleshooting(generateCorsTroubleshooting());
  }, []);

  const runCorsTest = async () => {
    setIsLoading(true);
    try {
      const results = await validateApiCors(customApiUrl);
      setTestResults(results);
    } catch (error) {
      setTestResults({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testConnectivity = async () => {
    setIsLoading(true);
    try {
      const results = await testCorsConnectivity(customApiUrl);
      setTestResults({ connectivity: results });
    } catch (error) {
      setTestResults({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (passed) => {
    return passed ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (passed) => {
    return passed ? '✅' : '❌';
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">CORS Configuration Test Panel</h1>
      
      {/* API URL Input */}
      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="font-semibold mb-2">API Configuration</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={customApiUrl}
            onChange={(e) => setCustomApiUrl(e.target.value)}
            placeholder="Enter API URL to test..."
            className="flex-1 px-3 py-2 border rounded"
          />
          <button
            onClick={runCorsTest}
            disabled={isLoading || !customApiUrl}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test CORS'}
          </button>
          <button
            onClick={testConnectivity}
            disabled={isLoading || !customApiUrl}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            Test Connectivity
          </button>
        </div>
      </div>

      {/* Troubleshooting Information */}
      {troubleshooting && (
        <div className="mb-6 p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Configuration Status</h3>
          
          {/* Configuration Validation */}
          <div className="mb-4">
            <h4 className="font-medium mb-2">
              {getStatusIcon(troubleshooting.configuration.isValid)} Configuration
            </h4>
            {troubleshooting.configuration.issues.length > 0 && (
              <ul className="list-disc list-inside text-sm text-red-600 ml-4">
                {troubleshooting.configuration.issues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Origin Check */}
          <div className="mb-4">
            <h4 className="font-medium mb-2">
              {getStatusIcon(troubleshooting.origin.isAllowed)} Origin Check
            </h4>
            <p className="text-sm text-gray-600">
              Current Origin: <code className="bg-gray-100 px-1 rounded">{troubleshooting.origin.origin}</code>
            </p>
            <p className="text-sm text-gray-600">
              Status: <span className={getStatusColor(troubleshooting.origin.isAllowed)}>
                {troubleshooting.origin.isAllowed ? 'Allowed' : 'Not Allowed'}
              </span>
            </p>
          </div>

          {/* Recommendations */}
          {troubleshooting.recommendations.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium mb-2">Recommendations</h4>
              <ul className="space-y-2">
                {troubleshooting.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm">
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                      rec.priority === 'high' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}></span>
                    <span className="font-medium">{rec.type}:</span> {rec.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Test Results */}
      {testResults && (
        <div className="mb-6 p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Test Results</h3>
          
          {testResults.error ? (
            <div className="text-red-600">
              <p className="font-medium">Error:</p>
              <p className="text-sm">{testResults.error}</p>
            </div>
          ) : (
            <>
              {/* Overall Status */}
              {testResults.overall !== undefined && (
                <div className="mb-4">
                  <p className={`font-medium ${getStatusColor(testResults.overall)}`}>
                    {getStatusIcon(testResults.overall)} Overall Status: {testResults.overall ? 'PASSED' : 'FAILED'}
                  </p>
                </div>
              )}

              {/* Individual Tests */}
              {testResults.tests && (
                <div className="space-y-3">
                  {testResults.tests.map((test, index) => (
                    <div key={index} className="border-l-4 border-gray-200 pl-4">
                      <h4 className={`font-medium ${getStatusColor(test.passed)}`}>
                        {getStatusIcon(test.passed)} {test.name}
                      </h4>
                      
                      {/* Connectivity Test Results */}
                      {test.result.tests && (
                        <div className="mt-2 space-y-2">
                          {test.result.tests.map((subTest, subIndex) => (
                            <div key={subIndex} className="text-sm">
                              <span className={getStatusColor(subTest.success)}>
                                {getStatusIcon(subTest.success)} {subTest.test}
                              </span>
                              {subTest.status && (
                                <span className="ml-2 text-gray-600">
                                  (Status: {subTest.status})
                                </span>
                              )}
                              {subTest.error && (
                                <p className="text-red-600 text-xs mt-1 ml-4">
                                  Error: {subTest.error}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Configuration Test Results */}
                      {test.result.issues && (
                        <div className="mt-2">
                          {test.result.issues.map((issue, issueIndex) => (
                            <p key={issueIndex} className="text-sm text-red-600">
                              • {issue}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Connectivity Only Results */}
              {testResults.connectivity && (
                <div className="space-y-3">
                  <h4 className="font-medium">Connectivity Test Results</h4>
                  {testResults.connectivity.tests.map((test, index) => (
                    <div key={index} className="border-l-4 border-gray-200 pl-4">
                      <p className={`font-medium ${getStatusColor(test.success)}`}>
                        {getStatusIcon(test.success)} {test.test}
                      </p>
                      {test.status && (
                        <p className="text-sm text-gray-600">Status: {test.status}</p>
                      )}
                      {test.error && (
                        <p className="text-sm text-red-600">Error: {test.error}</p>
                      )}
                      {test.headers && Object.keys(test.headers).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-sm cursor-pointer">Response Headers</summary>
                          <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                            {JSON.stringify(test.headers, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          
          <p className="text-xs text-gray-500 mt-4">
            Test completed at: {testResults.timestamp}
          </p>
        </div>
      )}

      {/* Usage Instructions */}
      <div className="p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">How to Use</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p><strong>Test CORS:</strong> Runs comprehensive CORS validation including configuration, origin, and connectivity tests.</p>
          <p><strong>Test Connectivity:</strong> Tests basic connectivity to the API endpoint with CORS headers.</p>
          <p><strong>Configuration Status:</strong> Shows current CORS configuration and any issues that need to be resolved.</p>
          <p><strong>Development Mode:</strong> Additional CORS monitoring and logging is available in development mode.</p>
        </div>
      </div>
    </div>
  );
};

export default CorsTestPanel;
