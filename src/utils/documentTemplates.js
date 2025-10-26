// documentTemplates.js

export const DOCUMENT_TYPES = {
  GENERAL: 'general',
  TEST_PLAN: 'test-plan',
  TEST_STRATEGY: 'test-strategy',
  REQUIREMENT: 'requirement',
  SPECIFICATION: 'specification',
  NOTES: 'notes',
  TEST_REPORT: 'test-report',
  BUG_ANALYSIS: 'bug-analysis'
};

export const documentTemplates = {
  [DOCUMENT_TYPES.GENERAL]: {
    title: 'Untitled Document',
    html: '<p><br></p>',
    metadata: {
      linkedTestRuns: [],
      linkedTestCases: [],
      linkedBugs: []
    }
  },
  
  [DOCUMENT_TYPES.TEST_PLAN]: {
    title: 'Test Plan',
    html: `
      <h1>Test Plan</h1>
      <p><em>Project Name | Version 1.0 | ${new Date().toLocaleDateString()}</em></p>
      <p><br></p>
      
      <h2>1. Test Overview</h2>
      <p><strong>Project:</strong> </p>
      <p><strong>Sprint/Release:</strong> </p>
      <p><strong>Test Lead:</strong> </p>
      <p><strong>Testing Period:</strong> </p>
      <p><strong>Status:</strong> <span class="status-badge" data-status="draft">Draft</span></p>
      <p><br></p>
      
      <h2>2. Scope</h2>
      <h3>Features to Test</h3>
      <ul>
        <li>Feature A - Description</li>
        <li>Feature B - Description</li>
        <li>Feature C - Description</li>
      </ul>
      
      <h3>Out of Scope</h3>
      <ul>
        <li>Third-party integrations (covered separately)</li>
        <li>Performance testing (dedicated sprint)</li>
      </ul>
      <p><br></p>
      
      <h2>3. Test Strategy</h2>
      <table border="1" cellpadding="10" cellspacing="0" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="text-align: left;">Test Type</th>
            <th style="text-align: left;">Coverage</th>
            <th style="text-align: left;">Tools</th>
            <th style="text-align: left;">Owner</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Functional Testing</td>
            <td>All user stories</td>
            <td>Manual + Selenium</td>
            <td></td>
          </tr>
          <tr>
            <td>API Testing</td>
            <td>All endpoints</td>
            <td>Postman</td>
            <td></td>
          </tr>
          <tr>
            <td>Regression Testing</td>
            <td>Critical paths</td>
            <td>Automated suite</td>
            <td></td>
          </tr>
        </tbody>
      </table>
      <p><br></p>
      
      <h2>4. Test Environment</h2>
      <p><strong>Test URL:</strong> </p>
      <p><strong>Database:</strong> </p>
      <p><strong>Test Data:</strong> </p>
      <p><strong>Browser/Device Coverage:</strong> Chrome, Firefox, Safari | iOS, Android</p>
      <p><br></p>
      
      <h2>5. Entry & Exit Criteria</h2>
      <h3>Entry Criteria</h3>
      <ul>
        <li>☐ All features deployed to test environment</li>
        <li>☐ Test cases reviewed and approved</li>
        <li>☐ Test data prepared</li>
        <li>☐ Environment stable and accessible</li>
      </ul>
      
      <h3>Exit Criteria</h3>
      <ul>
        <li>☐ 100% test cases executed</li>
        <li>☐ No critical/high severity bugs open</li>
        <li>☐ Test coverage >= 90%</li>
        <li>☐ Sign-off from stakeholders</li>
      </ul>
      <p><br></p>
      
      <h2>6. Schedule</h2>
      <table border="1" cellpadding="10" cellspacing="0" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="text-align: left;">Activity</th>
            <th style="text-align: left;">Start Date</th>
            <th style="text-align: left;">End Date</th>
            <th style="text-align: left;">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Test Planning</td>
            <td></td>
            <td></td>
            <td>Not Started</td>
          </tr>
          <tr>
            <td>Test Case Design</td>
            <td></td>
            <td></td>
            <td>Not Started</td>
          </tr>
          <tr>
            <td>Test Execution</td>
            <td></td>
            <td></td>
            <td>Not Started</td>
          </tr>
        </tbody>
      </table>
      <p><br></p>
      
      <h2>7. Test Run Linkage</h2>
      <div class="test-run-links" data-type="test-runs">
        <p><em>No test runs linked yet. Link test runs to track execution against this plan.</em></p>
      </div>
      <p><br></p>
      
      <h2>8. Risks & Mitigation</h2>
      <table border="1" cellpadding="10" cellspacing="0" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="text-align: left;">Risk</th>
            <th style="text-align: left;">Impact</th>
            <th style="text-align: left;">Mitigation</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Environment instability</td>
            <td>High</td>
            <td>Backup environment ready</td>
          </tr>
          <tr>
            <td>Resource unavailability</td>
            <td>Medium</td>
            <td>Cross-training team members</td>
          </tr>
        </tbody>
      </table>
    `,
    metadata: {
      linkedTestRuns: [],
      linkedTestCases: [],
      linkedBugs: [],
      status: 'draft',
      approvers: [],
      testLead: null
    }
  },

  [DOCUMENT_TYPES.TEST_STRATEGY]: {
    title: 'Test Strategy',
    html: `
      <h1>Test Strategy Document</h1>
      <p><em>Project Name | ${new Date().toLocaleDateString()}</em></p>
      <p><strong>Status:</strong> <span class="status-badge" data-status="draft">Draft</span></p>
      <p><br></p>
      
      <h2>1. Executive Summary</h2>
      <p>This document outlines the comprehensive testing approach for [Project Name]. It defines our testing methodology, automation strategy, tools, and quality metrics to ensure delivery of a high-quality product.</p>
      <p><br></p>
      
      <h2>2. Testing Approach</h2>
      <h3>Test Pyramid Strategy</h3>
      <table border="1" cellpadding="10" cellspacing="0" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="text-align: left;">Level</th>
            <th style="text-align: left;">Coverage %</th>
            <th style="text-align: left;">Type</th>
            <th style="text-align: left;">Tools</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Unit Tests</td>
            <td>70%</td>
            <td>Automated</td>
            <td>Jest, JUnit</td>
          </tr>
          <tr>
            <td>Integration Tests</td>
            <td>20%</td>
            <td>Automated</td>
            <td>Postman, REST Assured</td>
          </tr>
          <tr>
            <td>E2E Tests</td>
            <td>10%</td>
            <td>Automated + Manual</td>
            <td>Selenium, Cypress</td>
          </tr>
        </tbody>
      </table>
      <p><br></p>
      
      <h2>3. Test Types & Coverage</h2>
      <h3>Functional Testing</h3>
      <ul>
        <li><strong>Scope:</strong> Verify all user stories and acceptance criteria</li>
        <li><strong>Approach:</strong> Test case based, data-driven</li>
        <li><strong>Frequency:</strong> Every sprint</li>
      </ul>
      
      <h3>Non-Functional Testing</h3>
      <table border="1" cellpadding="10" cellspacing="0" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="text-align: left;">Type</th>
            <th style="text-align: left;">Focus</th>
            <th style="text-align: left;">Tools</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Performance Testing</td>
            <td>Load time < 2s, Handle 1000 concurrent users</td>
            <td>JMeter, LoadRunner</td>
          </tr>
          <tr>
            <td>Security Testing</td>
            <td>OWASP Top 10, Authentication, Authorization</td>
            <td>OWASP ZAP, Burp Suite</td>
          </tr>
          <tr>
            <td>Usability Testing</td>
            <td>User experience, Accessibility (WCAG 2.1)</td>
            <td>Manual, User feedback</td>
          </tr>
        </tbody>
      </table>
      <p><br></p>
      
      <h2>4. Automation Strategy</h2>
      <h3>Automation Goals</h3>
      <ul>
        <li>Achieve 80% test automation for regression suite</li>
        <li>Reduce manual testing effort by 60%</li>
        <li>Enable continuous testing in CI/CD pipeline</li>
      </ul>
      <p><br></p>
      
      <h2>5. Quality Metrics</h2>
      <table border="1" cellpadding="10" cellspacing="0" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="text-align: left;">Metric</th>
            <th style="text-align: left;">Target</th>
            <th style="text-align: left;">Current</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Test Coverage</td>
            <td>>= 90%</td>
            <td><span class="metric-value" data-metric="coverage">--</span></td>
          </tr>
          <tr>
            <td>Defect Density</td>
            <td>< 10 defects per feature</td>
            <td><span class="metric-value" data-metric="defect-density">--</span></td>
          </tr>
          <tr>
            <td>Test Pass Rate</td>
            <td>>= 95%</td>
            <td><span class="metric-value" data-metric="pass-rate">--</span></td>
          </tr>
          <tr>
            <td>Automation Coverage</td>
            <td>>= 80%</td>
            <td><span class="metric-value" data-metric="automation">--</span></td>
          </tr>
        </tbody>
      </table>
      <p><br></p>
      
      <h2>6. Linked Test Plans</h2>
      <div class="test-plan-links" data-type="test-plans">
        <p><em>No test plans linked yet. Link test plans that implement this strategy.</em></p>
      </div>
      <p><br></p>
      
      <h2>7. Defect Management</h2>
      <h3>Severity Levels</h3>
      <table border="1" cellpadding="10" cellspacing="0" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="text-align: left;">Severity</th>
            <th style="text-align: left;">Description</th>
            <th style="text-align: left;">Resolution Time</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Critical</td>
            <td>System crash, data loss, security breach</td>
            <td>24 hours</td>
          </tr>
          <tr>
            <td>High</td>
            <td>Major feature not working, no workaround</td>
            <td>48 hours</td>
          </tr>
          <tr>
            <td>Medium</td>
            <td>Feature partially working, workaround available</td>
            <td>1 week</td>
          </tr>
          <tr>
            <td>Low</td>
            <td>Minor issues, cosmetic bugs</td>
            <td>Next release</td>
          </tr>
        </tbody>
      </table>
    `,
    metadata: {
      linkedTestPlans: [],
      linkedTestRuns: [],
      status: 'draft',
      approvers: [],
      version: '1.0'
    }
  },

  [DOCUMENT_TYPES.TEST_REPORT]: {
    title: 'Test Execution Report',
    html: `
      <h1>Test Execution Report</h1>
      <p><em>Generated: ${new Date().toLocaleDateString()}</em></p>
      <p><br></p>
      
      <h2>1. Executive Summary</h2>
      <table border="1" cellpadding="10" cellspacing="0" style="width: 100%; border-collapse: collapse;">
        <tbody>
          <tr>
            <td style="background-color: #f3f4f6; font-weight: bold; width: 30%;">Test Run ID</td>
            <td><span class="dynamic-field" data-field="testRunId">--</span></td>
          </tr>
          <tr>
            <td style="background-color: #f3f4f6; font-weight: bold;">Test Plan</td>
            <td><span class="dynamic-field" data-field="testPlanName">--</span></td>
          </tr>
          <tr>
            <td style="background-color: #f3f4f6; font-weight: bold;">Execution Period</td>
            <td><span class="dynamic-field" data-field="executionPeriod">--</span></td>
          </tr>
          <tr>
            <td style="background-color: #f3f4f6; font-weight: bold;">Status</td>
            <td><span class="dynamic-field status-badge" data-field="status">--</span></td>
          </tr>
        </tbody>
      </table>
      <p><br></p>
      
      <h2>2. Test Execution Summary</h2>
      <table border="1" cellpadding="10" cellspacing="0" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="text-align: left;">Metric</th>
            <th style="text-align: center;">Count</th>
            <th style="text-align: center;">Percentage</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Total Test Cases</td>
            <td style="text-align: center;"><span class="dynamic-field" data-field="totalTests">0</span></td>
            <td style="text-align: center;">100%</td>
          </tr>
          <tr>
            <td>Passed</td>
            <td style="text-align: center; color: #10b981;"><span class="dynamic-field" data-field="passedTests">0</span></td>
            <td style="text-align: center;"><span class="dynamic-field" data-field="passPercentage">0%</span></td>
          </tr>
          <tr>
            <td>Failed</td>
            <td style="text-align: center; color: #ef4444;"><span class="dynamic-field" data-field="failedTests">0</span></td>
            <td style="text-align: center;"><span class="dynamic-field" data-field="failPercentage">0%</span></td>
          </tr>
          <tr>
            <td>Blocked</td>
            <td style="text-align: center; color: #f59e0b;"><span class="dynamic-field" data-field="blockedTests">0</span></td>
            <td style="text-align: center;"><span class="dynamic-field" data-field="blockedPercentage">0%</span></td>
          </tr>
          <tr>
            <td>Not Executed</td>
            <td style="text-align: center; color: #6b7280;"><span class="dynamic-field" data-field="notExecutedTests">0</span></td>
            <td style="text-align: center;"><span class="dynamic-field" data-field="notExecutedPercentage">0%</span></td>
          </tr>
        </tbody>
      </table>
      <p><br></p>
      
      <h2>3. Defects Summary</h2>
      <table border="1" cellpadding="10" cellspacing="0" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="text-align: left;">Severity</th>
            <th style="text-align: center;">Open</th>
            <th style="text-align: center;">Fixed</th>
            <th style="text-align: center;">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Critical</td>
            <td style="text-align: center;"><span class="dynamic-field" data-field="criticalOpen">0</span></td>
            <td style="text-align: center;"><span class="dynamic-field" data-field="criticalFixed">0</span></td>
            <td style="text-align: center;"><span class="dynamic-field" data-field="criticalTotal">0</span></td>
          </tr>
          <tr>
            <td>High</td>
            <td style="text-align: center;"><span class="dynamic-field" data-field="highOpen">0</span></td>
            <td style="text-align: center;"><span class="dynamic-field" data-field="highFixed">0</span></td>
            <td style="text-align: center;"><span class="dynamic-field" data-field="highTotal">0</span></td>
          </tr>
          <tr>
            <td>Medium</td>
            <td style="text-align: center;"><span class="dynamic-field" data-field="mediumOpen">0</span></td>
            <td style="text-align: center;"><span class="dynamic-field" data-field="mediumFixed">0</span></td>
            <td style="text-align: center;"><span class="dynamic-field" data-field="mediumTotal">0</span></td>
          </tr>
          <tr>
            <td>Low</td>
            <td style="text-align: center;"><span class="dynamic-field" data-field="lowOpen">0</span></td>
            <td style="text-align: center;"><span class="dynamic-field" data-field="lowFixed">0</span></td>
            <td style="text-align: center;"><span class="dynamic-field" data-field="lowTotal">0</span></td>
          </tr>
        </tbody>
      </table>
      <p><br></p>
      
      <h2>4. Test Environment</h2>
      <p><strong>Environment:</strong> <span class="dynamic-field" data-field="environment">--</span></p>
      <p><strong>Build Version:</strong> <span class="dynamic-field" data-field="buildVersion">--</span></p>
      <p><strong>Test Data Set:</strong> <span class="dynamic-field" data-field="testDataSet">--</span></p>
      <p><br></p>
      
      <h2>5. Recommendations</h2>
      <ul>
        <li>Address all critical and high severity defects before release</li>
        <li>Review failed test cases and update where necessary</li>
        <li>Ensure blocked tests are unblocked and executed</li>
      </ul>
    `,
    metadata: {
      linkedTestRun: null,
      linkedTestPlan: null,
      linkedBugs: [],
      generatedAt: new Date().toISOString(),
      metrics: {}
    }
  },

  [DOCUMENT_TYPES.REQUIREMENT]: {
    title: 'Requirements Document',
    html: `
      <h1>Requirements Document</h1>
      <p><em>Project: [Project Name] | Version 1.0 | ${new Date().toLocaleDateString()}</em></p>
      <p><br></p>
      
      <h2>1. Document Overview</h2>
      <p><strong>Purpose:</strong> This document describes the functional and non-functional requirements.</p>
      <p><strong>Status:</strong> <span class="status-badge" data-status="draft">Draft</span></p>
      <p><br></p>
      
      <h2>2. Functional Requirements</h2>
      <table border="1" cellpadding="10" cellspacing="0" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="text-align: left; width: 15%;">ID</th>
            <th style="text-align: left; width: 50%;">Requirement</th>
            <th style="text-align: left; width: 15%;">Priority</th>
            <th style="text-align: left; width: 20%;">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>REQ-001</td>
            <td>System shall allow users to...</td>
            <td>High</td>
            <td>Draft</td>
          </tr>
          <tr>
            <td>REQ-002</td>
            <td>System shall validate...</td>
            <td>High</td>
            <td>Draft</td>
          </tr>
        </tbody>
      </table>
      <p><br></p>
      
      <h2>3. Test Coverage</h2>
      <div class="test-case-links" data-type="test-cases">
        <p><em>No test cases linked yet. Link test cases that validate these requirements.</em></p>
      </div>
    `,
    metadata: {
      linkedTestCases: [],
      linkedTestPlans: [],
      status: 'draft',
      version: '1.0'
    }
  },

  [DOCUMENT_TYPES.SPECIFICATION]: {
    title: 'Technical Specification',
    html: `
      <h1>Technical Specification</h1>
      <p><em>Project: [Project Name] | ${new Date().toLocaleDateString()}</em></p>
      <p><br></p>
      
      <h2>1. System Overview</h2>
      <p><strong>Purpose:</strong> </p>
      <p><strong>Scope:</strong> </p>
      <p><br></p>
      
      <h2>2. Architecture</h2>
      <p>[Describe system architecture]</p>
      <p><br></p>
      
      <h2>3. API Specifications</h2>
      <p>[API details]</p>
      <p><br></p>
      
      <h2>4. Test Integration</h2>
      <div class="test-case-links" data-type="integration-tests">
        <p><em>Link integration and API test cases here.</em></p>
      </div>
    `,
    metadata: {
      linkedTestCases: [],
      version: '1.0'
    }
  },

  [DOCUMENT_TYPES.NOTES]: {
    title: 'Notes',
    html: `
      <h1>Notes</h1>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      <p><br></p>
      
      <h2>Key Points</h2>
      <ul>
        <li></li>
      </ul>
      <p><br></p>
      
      <h2>Action Items</h2>
      <ul>
        <li>☐ </li>
      </ul>
    `,
    metadata: {
      linkedItems: []
    }
  },

  [DOCUMENT_TYPES.BUG_ANALYSIS]: {
    title: 'Bug Analysis Report',
    html: `
      <h1>Bug Analysis Report</h1>
      <p><em>Period: [Date Range] | ${new Date().toLocaleDateString()}</em></p>
      <p><br></p>
      
      <h2>1. Overview</h2>
      <table border="1" cellpadding="10" cellspacing="0" style="width: 100%; border-collapse: collapse;">
        <tbody>
          <tr>
            <td style="background-color: #f3f4f6; font-weight: bold; width: 30%;">Total Bugs</td>
            <td><span class="dynamic-field" data-field="totalBugs">0</span></td>
          </tr>
          <tr>
            <td style="background-color: #f3f4f6; font-weight: bold;">Open Bugs</td>
            <td><span class="dynamic-field" data-field="openBugs">0</span></td>
          </tr>
          <tr>
            <td style="background-color: #f3f4f6; font-weight: bold;">Resolved Bugs</td>
            <td><span class="dynamic-field" data-field="resolvedBugs">0</span></td>
          </tr>
          <tr>
            <td style="background-color: #f3f4f6; font-weight: bold;">Average Resolution Time</td>
            <td><span class="dynamic-field" data-field="avgResolutionTime">-- days</span></td>
          </tr>
        </tbody>
      </table>
      <p><br></p>
      
      <h2>2. Bugs by Severity</h2>
      <table border="1" cellpadding="10" cellspacing="0" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="text-align: left;">Severity</th>
            <th style="text-align: center;">Count</th>
            <th style="text-align: center;">% of Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Critical</td>
            <td style="text-align: center;"><span class="dynamic-field" data-field="criticalCount">0</span></td>
            <td style="text-align: center;"><span class="dynamic-field" data-field="criticalPercent">0%</span></td>
          </tr>
          <tr>
            <td>High</td>
            <td style="text-align: center;"><span class="dynamic-field" data-field="highCount">0</span></td>
            <td style="text-align: center;"><span class="dynamic-field" data-field="highPercent">0%</span></td>
          </tr>
          <tr>
            <td>Medium</td>
            <td style="text-align: center;"><span class="dynamic-field" data-field="mediumCount">0</span></td>
            <td style="text-align: center;"><span class="dynamic-field" data-field="mediumPercent">0%</span></td>
          </tr>
          <tr>
            <td>Low</td>
            <td style="text-align: center;"><span class="dynamic-field" data-field="lowCount">0</span></td>
            <td style="text-align: center;"><span class="dynamic-field" data-field="lowPercent">0%</span></td>
          </tr>
        </tbody>
      </table>
      <p><br></p>
      
      <h2>3. Root Cause Analysis</h2>
      <p>[Analysis of common bug patterns and root causes]</p>
      <p><br></p>
      
      <h2>4. Linked Bugs</h2>
      <div class="bug-links" data-type="bugs">
        <p><em>Bugs will be automatically linked based on the analysis period.</em></p>
      </div>
    `,
    metadata: {
      linkedBugs: [],
      analysisperiod: null,
      metrics: {}
    }
  }
};

// Helper function to get template by type
export const getTemplate = (type) => {
  return documentTemplates[type] || documentTemplates[DOCUMENT_TYPES.GENERAL];
};

// Helper function to get all template types
export const getTemplateTypes = () => {
  return Object.values(DOCUMENT_TYPES).map(type => ({
    value: type,
    label: type.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }));
};

// Helper to check if document type supports test run linking
export const supportsTestRunLinking = (type) => {
  return [
    DOCUMENT_TYPES.TEST_PLAN,
    DOCUMENT_TYPES.TEST_STRATEGY,
    DOCUMENT_TYPES.TEST_REPORT
  ].includes(type);
};

// Helper to check if document type supports test case linking
export const supportsTestCaseLinking = (type) => {
  return [
    DOCUMENT_TYPES.TEST_PLAN,
    DOCUMENT_TYPES.REQUIREMENT,
    DOCUMENT_TYPES.SPECIFICATION
  ].includes(type);
};

// Helper to check if document type supports bug linking
export const supportsBugLinking = (type) => {
  return [
    DOCUMENT_TYPES.TEST_PLAN,
    DOCUMENT_TYPES.TEST_REPORT,
    DOCUMENT_TYPES.BUG_ANALYSIS
  ].includes(type);
};