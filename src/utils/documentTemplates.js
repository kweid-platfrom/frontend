
// documentTemplates.js

export const documentTemplates = {
  'general': {
    title: 'Untitled Document',
    html: '<p><br></p>'
  },
  
  'test-plan': {
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
          <tr>
            <td>Integration Testing</td>
            <td>Key workflows</td>
            <td>Manual</td>
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
        <li>☐ Test coverage &gt;= 90%</li>
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
          <tr>
            <td>Bug Fixing & Retesting</td>
            <td></td>
            <td></td>
            <td>Not Started</td>
          </tr>
          <tr>
            <td>Final Sign-off</td>
            <td></td>
            <td></td>
            <td>Not Started</td>
          </tr>
        </tbody>
      </table>
      <p><br></p>
      
      <h2>7. Risks & Mitigation</h2>
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
          <tr>
            <td>Late feature delivery</td>
            <td>High</td>
            <td>Prioritize critical features first</td>
          </tr>
        </tbody>
      </table>
      <p><br></p>
      
      <h2>8. Team & Responsibilities</h2>
      <table border="1" cellpadding="10" cellspacing="0" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="text-align: left;">Name</th>
            <th style="text-align: left;">Role</th>
            <th style="text-align: left;">Responsibility</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td></td>
            <td>Test Lead</td>
            <td>Overall test coordination</td>
          </tr>
          <tr>
            <td></td>
            <td>QA Engineer</td>
            <td>Test execution</td>
          </tr>
          <tr>
            <td></td>
            <td>Automation Engineer</td>
            <td>Script development</td>
          </tr>
        </tbody>
      </table>
    `
  },

  'test-strategy': {
    title: 'Test Strategy',
    html: `
      <h1>Test Strategy Document</h1>
      <p><em>Project Name | ${new Date().toLocaleDateString()}</em></p>
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
            <td>Load time &lt; 2s, Handle 1000 concurrent users</td>
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
          <tr>
            <td>Compatibility Testing</td>
            <td>Browsers, Devices, OS</td>
            <td>BrowserStack, Sauce Labs</td>
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
      
      <h3>Framework & Tools</h3>
      <p><strong>UI Automation:</strong> Selenium WebDriver + TestNG</p>
      <p><strong>API Automation:</strong> RestAssured + Postman</p>
      <p><strong>Mobile Automation:</strong> Appium</p>
      <p><strong>CI/CD Integration:</strong> Jenkins, GitHub Actions</p>
      <p><br></p>
      
      <h2>5. Defect Management</h2>
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
      
      <h3>Bug Workflow</h3>
      <p>New → Assigned → In Progress → Fixed → Ready for Testing → Verified → Closed</p>
      <p><br></p>
      
      <h2>6. Quality Metrics</h2>
      <table border="1" cellpadding="10" cellspacing="0" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="text-align: left;">Metric</th>
            <th style="text-align: left;">Target</th>
            <th style="text-align: left;">Measurement</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Test Coverage</td>
            <td>&gt;= 90%</td>
            <td>Requirements traced to tests</td>
          </tr>
          <tr>
            <td>Defect Density</td>
            <td>&lt; 10 defects per feature</td>
            <td>Total defects / Features</td>
          </tr>
          <tr>
            <td>Test Pass Rate</td>
            <td>&gt;= 95%</td>
            <td>Passed tests / Total tests</td>
          </tr>
          <tr>
            <td>Automation Coverage</td>
            <td>&gt;= 80%</td>
            <td>Automated tests / Total tests</td>
          </tr>
          <tr>
            <td>Defect Leakage</td>
            <td>&lt; 5%</td>
            <td>Production bugs / Total bugs</td>
          </tr>
        </tbody>
      </table>
      <p><br></p>
      
      <h2>7. Test Environment Strategy</h2>
      <table border="1" cellpadding="10" cellspacing="0" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="text-align: left;">Environment</th>
            <th style="text-align: left;">Purpose</th>
            <th style="text-align: left;">Access</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>DEV</td>
            <td>Development and unit testing</td>
            <td>Developers</td>
          </tr>
          <tr>
            <td>QA</td>
            <td>Functional and integration testing</td>
            <td>QA Team</td>
          </tr>
          <tr>
            <td>UAT</td>
            <td>User acceptance testing</td>
            <td>Business Users</td>
          </tr>
          <tr>
            <td>STAGING</td>
            <td>Pre-production validation</td>
            <td>QA + Business</td>
          </tr>
        </tbody>
      </table>
      <p><br></p>
      
      <h2>8. Communication & Reporting</h2>
      <ul>
        <li><strong>Daily Standup:</strong> Test progress, blockers</li>
        <li><strong>Weekly Report:</strong> Test metrics, risk status</li>
        <li><strong>Sprint Review:</strong> Demo tested features</li>
        <li><strong>Release Report:</strong> Final quality sign-off</li>
      </ul>
    `
  },

  'requirement': {
    title: 'Requirements Document',
    html: `
      <h1>Requirements Document</h1>
      <p><em>Project: [Project Name] | Version 1.0 | ${new Date().toLocaleDateString()}</em></p>
      <p><br></p>
      
      <h2>1. Document Overview</h2>
      <p><strong>Purpose:</strong> This document describes the functional and non-functional requirements for [Project Name].</p>
      <p><strong>Audience:</strong> Development Team, QA Team, Product Managers, Stakeholders</p>
      <p><strong>Scope:</strong> </p>
      <p><br></p>
      
      <h2>2. Business Requirements</h2>
      <h3>2.1 Business Objectives</h3>
      <ul>
        <li>Objective 1: </li>
        <li>Objective 2: </li>
        <li>Objective 3: </li>
      </ul>
      
      <h3>2.2 Success Criteria</h3>
      <ul>
        <li>Metric 1: </li>
        <li>Metric 2: </li>
        <li>Metric 3: </li>
      </ul>
      <p><br></p>
      
      <h2>3. Functional Requirements</h2>
      
      <h3>Feature 1: [Feature Name]</h3>
      <p><strong>Description:</strong> </p>
      <p><strong>User Story:</strong> As a [user type], I want to [action] so that [benefit]</p>
      
      <h4>Requirements</h4>
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
          <tr>
            <td>REQ-003</td>
            <td>System shall display...</td>
            <td>Medium</td>
            <td>Draft</td>
          </tr>
        </tbody>
      </table>
      
      <h4>Acceptance Criteria</h4>
      <ul>
        <li>☐ Given [context], when [action], then [expected result]</li>
        <li>☐ Given [context], when [action], then [expected result]</li>
        <li>☐ Given [context], when [action], then [expected result]</li>
      </ul>
      <p><br></p>
      
      <h3>Feature 2: [Feature Name]</h3>
      <p><strong>Description:</strong> </p>
      <p><strong>User Story:</strong> As a [user type], I want to [action] so that [benefit]</p>
      
      <h4>Requirements</h4>
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
            <td>REQ-004</td>
            <td></td>
            <td>High</td>
            <td>Draft</td>
          </tr>
          <tr>
            <td>REQ-005</td>
            <td></td>
            <td>Medium</td>
            <td>Draft</td>
          </tr>
        </tbody>
      </table>
      <p><br></p>
      
      <h2>4. Non-Functional Requirements</h2>
      
      <h3>4.1 Performance</h3>
      <ul>
        <li>Page load time: &lt; 2 seconds</li>
        <li>API response time: &lt; 500ms</li>
        <li>Support 10,000 concurrent users</li>
      </ul>
      
      <h3>4.2 Security</h3>
      <ul>
        <li>Authentication: OAuth 2.0 / JWT</li>
        <li>Data encryption: AES-256 for sensitive data</li>
        <li>Compliance: GDPR, SOC 2</li>
      </ul>
      
      <h3>4.3 Usability</h3>
      <ul>
        <li>Accessibility: WCAG 2.1 Level AA compliance</li>
        <li>Mobile responsive design</li>
        <li>Browser support: Chrome, Firefox, Safari, Edge (latest 2 versions)</li>
      </ul>
      
      <h3>4.4 Reliability</h3>
      <ul>
        <li>Uptime: 99.9% availability</li>
        <li>Error rate: &lt; 0.1%</li>
        <li>Data backup: Daily automated backups</li>
      </ul>
      <p><br></p>
      
      <h2>5. User Interface Requirements</h2>
      <p><strong>Design System:</strong> </p>
      <p><strong>Key Screens:</strong> </p>
      <ul>
        <li>Screen 1: </li>
        <li>Screen 2: </li>
        <li>Screen 3: </li>
      </ul>
      <p><br></p>
      
      <h2>6. Integration Requirements</h2>
      <table border="1" cellpadding="10" cellspacing="0" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="text-align: left;">System</th>
            <th style="text-align: left;">Integration Type</th>
            <th style="text-align: left;">Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Payment Gateway</td>
            <td>API</td>
            <td>Process payments</td>
          </tr>
          <tr>
            <td>Email Service</td>
            <td>API</td>
            <td>Send notifications</td>
          </tr>
          <tr>
            <td>Analytics</td>
            <td>SDK</td>
            <td>Track user behavior</td>
          </tr>
        </tbody>
      </table>
      <p><br></p>
      
      <h2>7. Assumptions & Constraints</h2>
      <h3>Assumptions</h3>
      <ul>
        <li>Users have stable internet connection</li>
        <li>Third-party APIs are available 99.5% of the time</li>
      </ul>
      
      <h3>Constraints</h3>
      <ul>
        <li>Budget: </li>
        <li>Timeline: </li>
        <li>Technology: </li>
      </ul>
      <p><br></p>
      
      <h2>8. Dependencies</h2>
      <ul>
        <li>Dependency 1: </li>
        <li>Dependency 2: </li>
      </ul>
      <p><br></p>
      
      <h2>9. Approval & Sign-off</h2>
      <table border="1" cellpadding="10" cellspacing="0" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="text-align: left;">Name</th>
            <th style="text-align: left;">Role</th>
            <th style="text-align: left;">Date</th>
            <th style="text-align: left;">Signature</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td></td>
            <td>Product Manager</td>
            <td></td>
            <td></td>
          </tr>
          <tr>
            <td></td>
            <td>Tech Lead</td>
            <td></td>
            <td></td>
          </tr>
          <tr>
            <td></td>
            <td>Stakeholder</td>
            <td></td>
            <td></td>
          </tr>
        </tbody>
      </table>
    `
  },

  'specification': {
    title: 'Technical Specification',
    html: `
      <h1>Technical Specification</h1>
      <p><em>Project: [Project Name] | Version 1.0 | ${new Date().toLocaleDateString()}</em></p>
      <p><br></p>
      
      <h2>1. System Overview</h2>
      <p><strong>Purpose:</strong> </p>
      <p><strong>Scope:</strong> </p>
      <p><strong>Tech Stack:</strong> </p>
      <p><br></p>
      
      <h2>2. Architecture</h2>
      <h3>2.1 High-Level Architecture</h3>
      <p>[Describe the overall system architecture - microservices, monolith, serverless, etc.]</p>
      
      <h3>2.2 Technology Stack</h3>
      <table border="1" cellpadding="10" cellspacing="0" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="text-align: left;">Layer</th>
            <th style="text-align: left;">Technology</th>
            <th style="text-align: left;">Version</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Frontend</td>
            <td>React / Vue / Angular</td>
            <td></td>
          </tr>
          <tr>
            <td>Backend</td>
            <td>Node.js / Java / Python</td>
            <td></td>
          </tr>
          <tr>
            <td>Database</td>
            <td>PostgreSQL / MongoDB</td>
            <td></td>
          </tr>
          <tr>
            <td>Cache</td>
            <td>Redis</td>
            <td></td>
          </tr>
          <tr>
            <td>Cloud</td>
            <td>AWS / Azure / GCP</td>
            <td></td>
          </tr>
        </tbody>
      </table>
      <p><br></p>
      
      <h2>3. System Components</h2>
      
      <h3>Component 1: [Component Name]</h3>
      <p><strong>Purpose:</strong> </p>
      <p><strong>Technology:</strong> </p>
      <p><strong>Key Functionality:</strong></p>
      <ul>
        <li>Function 1</li>
        <li>Function 2</li>
        <li>Function 3</li>
      </ul>
      
      <h3>Component 2: [Component Name]</h3>
      <p><strong>Purpose:</strong> </p>
      <p><strong>Technology:</strong> </p>
      <p><strong>Key Functionality:</strong></p>
      <ul>
        <li>Function 1</li>
        <li>Function 2</li>
      </ul>
      <p><br></p>
      
      <h2>4. API Specifications</h2>
      
      <h3>Endpoint 1: Create User</h3>
      <table border="1" cellpadding="10" cellspacing="0" style="width: 100%; border-collapse: collapse;">
        <tbody>
          <tr>
            <td style="background-color: #f3f4f6; font-weight: bold; width: 20%;">Method</td>
            <td>POST</td>
          </tr>
          <tr>
            <td style="background-color: #f3f4f6; font-weight: bold;">Endpoint</td>
            <td>/api/users</td>
          </tr>
          <tr>
            <td style="background-color: #f3f4f6; font-weight: bold;">Authentication</td>
            <td>Required (Bearer Token)</td>
          </tr>
          <tr>
            <td style="background-color: #f3f4f6; font-weight: bold;">Request Body</td>
            <td>{ "name": "string", "email": "string", "role": "string" }</td>
          </tr>
          <tr>
            <td style="background-color: #f3f4f6; font-weight: bold;">Response (200)</td>
            <td>{ "id": "string", "name": "string", "email": "string", "createdAt": "timestamp" }</td>
          </tr>
          <tr>
            <td style="background-color: #f3f4f6; font-weight: bold;">Error Codes</td>
            <td>400: Bad Request, 401: Unauthorized, 409: User already exists</td>
          </tr>
        </tbody>
      </table>
      <p><br></p>
      
      <h3>Endpoint 2: Get User</h3>
      <table border="1" cellpadding="10" cellspacing="0" style="width: 100%; border-collapse: collapse;">
        <tbody>
          <tr>
            <td style="background-color: #f3f4f6; font-weight: bold; width: 20%;">Method</td>
            <td>GET</td>
          </tr>
          <tr>
            <td style="background-color: #f3f4f6; font-weight: bold;">Endpoint</td>
            <td>/api/users/:id</td>
          </tr>
          <tr>
            <td style="background-color: #f3f4f6; font-weight: bold;">Authentication</td>
            <td>Required (Bearer Token)</td>
          </tr>
          <tr>
            <td style="background-color: #f3f4f6; font-weight: bold;">Parameters</td>
            <td>id (path parameter): User ID</td>
          </tr>
          <tr>
            <td style="background-color: #f3f4f6; font-weight: bold;">Response (200)</td>
            <td>{ "id": "string", "name": "string", "email": "string", "role": "string" }</td>
          </tr>
        </tbody>
      </table>
      <p><br></p>
      
      <h2>5. Database Schema</h2>
      
      <h3>Users Table</h3>
      <table border="1" cellpadding="10" cellspacing="0" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="text-align: left;">Column</th>
            <th style="text-align: left;">Type</th>
            <th style="text-align: left;">Constraints</th>
            <th style="text-align: left;">Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>id</td>
            <td>UUID</td>
            <td>PRIMARY KEY</td>
            <td>Unique identifier</td>
          </tr>
          <tr>
            <td>email</td>
            <td>VARCHAR(255)</td>
            <td>UNIQUE, NOT NULL</td>
            <td>User email</td>
          </tr>
          <tr>
            <td>name</td>
            <td>VARCHAR(100)</td>
            <td>NOT NULL</td>
            <td>User name</td>
          </tr>
          <tr>
            <td>password_hash</td>
            <td>VARCHAR(255)</td>
            <td>NOT NULL</td>
            <td>Hashed password</td>
          </tr>
          <tr>
            <td>created_at</td>
            <td>TIMESTAMP</td>
            <td>DEFAULT NOW()</td>
            <td>Creation timestamp</td>
          </tr>
          <tr>
            <td>updated_at</td>
            <td>TIMESTAMP</td>
            <td>DEFAULT NOW()</td>
            <td>Last update timestamp</td>
          </tr>
        </tbody>
      </table>
      <p><br></p>
      
      <h2>6. Security Implementation</h2>
      
      <h3>Authentication</h3>
      <ul>
        <li><strong>Method:</strong> JWT (JSON Web Tokens)</li>
        <li><strong>Token Expiry:</strong> 24 hours</li>
        <li><strong>Refresh Token:</strong> 7 days</li>
      </ul>
      
      <h3>Authorization</h3>
      <table border="1" cellpadding="10" cellspacing="0" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="text-align: left;">Role</th>
            <th style="text-align: left;">Permissions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Admin</td>
            <td>Full access to all resources</td>
          </tr>
          <tr>
            <td>User</td>
            <td>Read/Write own resources</td>
          </tr>
          <tr>
            <td>Guest</td>
            <td>Read-only access</td>
          </tr>
        </tbody>
      </table>
      
      <h3>Data Protection</h3>
      <ul>
        <li>Passwords: bcrypt hashing (salt rounds: 12)</li>
        <li>Sensitive data: AES-256 encryption</li>
        <li>HTTPS: TLS 1.3 for all communications</li>
      </ul>
      <p><br></p>
      
      <h2>7. Error Handling</h2>
      <table border="1" cellpadding="10" cellspacing="0" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="text-align: left;">Error Code</th>
            <th style="text-align: left;">Description</th>
            <th style="text-align: left;">Response Format</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>400</td>
            <td>Bad Request</td>
            <td>{ "error": "Invalid input", "details": [] }</td>
          </tr>
          <tr>
            <td>401</td>
            <td>Unauthorized</td>
            <td>{ "error": "Authentication required" }</td>
          </tr>
          <tr>
            <td>403</td>
            <td>Forbidden</td>
            <td>{ "error": "Insufficient permissions" }</td>
          </tr>
          <tr>
            <td>404</td>
            <td>Not Found</td>
            <td>{ "error": "Resource not found" }</td>
          </tr>
          <tr>
            <td>500</td>
            <td>Internal Server Error</td>
            <td>{ "error": "Internal server error", "requestId": "string" }</td>
          </tr>
        </tbody>
      </table>
      <p><br></p>
      
      <h2>8. Performance Requirements</h2>
      <table border="1" cellpadding="10" cellspacing="0" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="text-align: left;">Metric</th>
            <th style="text-align: left;">Target</th>
            <th style="text-align: left;">Measurement Method</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>API Response Time</td>
            <td>&lt; 200ms (P95)</td>
            <td>APM monitoring</td>
          </tr>
          <tr>
            <td>Database Query Time</td>
            <td>&lt; 50ms (P95)</td>
            <td>Query profiling</td>
          </tr>
          <tr>
            <td>Concurrent Users</td>
            <td>10,000</td>
            <td>Load testing</td>
          </tr>
          <tr>
            <td>Throughput</td>
            <td>1,000 req/sec</td>
            <td>Performance testing</td>
          </tr>
        </tbody>
      </table>
      <p><br></p>
      
      <h2>9. Deployment Strategy</h2>
      <h3>Environments</h3>
      <ul>
        <li><strong>Development:</strong> dev.example.com</li>
        <li><strong>Staging:</strong> staging.example.com</li>
        <li><strong>Production:</strong> app.example.com</li>
      </ul>
      
      <h3>CI/CD Pipeline</h3>
      <ol>
        <li>Code commit triggers build</li>
        <li>Run unit tests</li>
        <li>Run integration tests</li>
        <li>Build Docker image</li>
        <li>Deploy to staging</li>
        <li>Run smoke tests</li>
        <li>Manual approval for production</li>
        <li>Deploy to production (blue-green deployment)</li>
      </ol>
      <p><br></p>
      
      <h2>10. Monitoring & Logging</h2>
      <h3>Monitoring Tools</h3>
      <ul>
        <li><strong>APM:</strong> New Relic / DataDog</li>
        <li><strong>Logging:</strong> ELK Stack / CloudWatch</li>
        <li><strong>Uptime:</strong> Pingdom / UptimeRobot</li>
      </ul>
      
      <h3>Key Metrics</h3>
      <ul>
        <li>Request rate, error rate, response time</li>
        <li>CPU, memory, disk usage</li>
        <li>Database connections, query performance</li>
        <li>Cache hit rate</li>
      </ul>
      <p><br></p>
      
      <h2>11. Dependencies</h2>
      <table border="1" cellpadding="10" cellspacing="0" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="text-align: left;">Service/Library</th>
            <th style="text-align: left;">Version</th>
            <th style="text-align: left;">Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Express.js</td>
            <td>4.x</td>
            <td>Web framework</td>
          </tr>
          <tr>
            <td>Sequelize</td>
            <td>6.x</td>
            <td>ORM</td>
          </tr>
          <tr>
            <td>JWT</td>
            <td>9.x</td>
            <td>Authentication</td>
          </tr>
        </tbody>
      </table>
    `
  },

  'notes': {
    title: 'Notes',
    html: `
      <h1>Notes</h1>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      <p><strong>Topic:</strong> </p>
      <p><br></p>
      
      <h2>Key Takeaways</h2>
      <ul>
        <li></li>
        <li></li>
        <li></li>
      </ul>
      <p><br></p>
      
      <h2>Details</h2>
      <p></p>
      <p><br></p>
      
      <h2>Action Items</h2>
      <table border="1" cellpadding="10" cellspacing="0" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="text-align: left; width: 10%;">Done</th>
            <th style="text-align: left; width: 50%;">Task</th>
            <th style="text-align: left; width: 20%;">Owner</th>
            <th style="text-align: left; width: 20%;">Due Date</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>☐</td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
          <tr>
            <td>☐</td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
          <tr>
            <td>☐</td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
        </tbody>
      </table>
      <p><br></p>
      
      <h2>Questions / Follow-up</h2>
      <ul>
        <li></li>
        <li></li>
      </ul>
      <p><br></p>
      
      <h2>References</h2>
      <ul>
        <li></li>
        <li></li>
      </ul>
    `
  }
};

// Helper function to get template by type
export const getTemplate = (type) => {
  return documentTemplates[type] || documentTemplates['general'];
};

// Helper function to get all template types
export const getTemplateTypes = () => {
  return Object.keys(documentTemplates).map(key => ({
    value: key,
    label: key.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }));
};