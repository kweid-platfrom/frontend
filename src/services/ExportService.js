// services/exportService.js
// Handles exporting test cases in various formats

export class ExportService {
    static exportTestCases(testCases, documentTitle, format, includeMetadata = false) {
        const exportData = includeMetadata ? {
            metadata: {
                documentTitle,
                generatedAt: new Date().toISOString(),
                summary: testCases.summary
            },
            testCases: testCases.testCases
        } : testCases;

        switch (format) {
            case 'json':
                return this.exportAsJSON(exportData, documentTitle);
            case 'csv':
                return this.exportAsCSV(testCases, documentTitle);
            case 'markdown':
                return this.exportAsMarkdown(testCases, documentTitle, includeMetadata);
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    static exportAsJSON(data, documentTitle) {
        const content = JSON.stringify(data, null, 2);
        const filename = `test-cases-${this.sanitizeFilename(documentTitle)}-${Date.now()}.json`;
        const mimeType = 'application/json';

        return { content, filename, mimeType };
    }

    static exportAsCSV(testCases, documentTitle) {
        const headers = [
            'ID', 'Title', 'Priority', 'Type', 'Category', 'Description',
            'Preconditions', 'Steps', 'Expected Result', 'Test Data',
            'Automation Potential', 'Risk Level', 'Estimated Time'
        ];

        const rows = testCases.testCases.map(tc => [
            tc.id, tc.title, tc.priority, tc.type, tc.category,
            tc.description, tc.preconditions,
            tc.steps.join(' | '), tc.expectedResult, tc.testData,
            tc.automationPotential, tc.riskLevel, tc.estimatedTime
        ]);

        const content = [headers, ...rows].map(row =>
            row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')
        ).join('\n');

        const filename = `test-cases-${this.sanitizeFilename(documentTitle)}-${Date.now()}.csv`;
        const mimeType = 'text/csv';

        return { content, filename, mimeType };
    }

    static exportAsMarkdown(testCases, documentTitle, includeMetadata) {
        let markdown = `# Test Cases for ${documentTitle}\n\n`;

        if (includeMetadata) {
            markdown += `## Generation Details\n`;
            markdown += `- **Generated At:** ${new Date().toISOString()}\n`;
            markdown += `- **Total Test Cases:** ${testCases.testCases.length}\n`;
            markdown += `- **Coverage Areas:** ${testCases.summary.coverageAreas.join(', ')}\n\n`;
        }

        markdown += `## Summary\n`;
        markdown += `- **Total Tests:** ${testCases.summary.totalTests}\n`;
        markdown += `- **High Priority:** ${testCases.qualityGates.highPriorityTests}\n`;
        markdown += `- **Automation Candidates:** ${testCases.qualityGates.automationCandidates}\n\n`;

        markdown += `## Test Cases\n\n`;

        testCases.testCases.forEach((tc) => {
            markdown += `### ${tc.id}: ${tc.title}\n\n`;
            markdown += `**Priority:** ${tc.priority} | **Type:** ${tc.type} | **Category:** ${tc.category}\n\n`;
            markdown += `**Description:** ${tc.description}\n\n`;
            markdown += `**Preconditions:** ${tc.preconditions}\n\n`;
            markdown += `**Test Steps:**\n`;
            tc.steps.forEach((step, stepIndex) => {
                markdown += `${stepIndex + 1}. ${step}\n`;
            });
            markdown += `\n**Expected Result:** ${tc.expectedResult}\n\n`;
            if (tc.testData) {
                markdown += `**Test Data:** ${tc.testData}\n\n`;
            }
            markdown += `**Automation Potential:** ${tc.automationPotential} | **Risk Level:** ${tc.riskLevel}\n\n`;
            markdown += `---\n\n`;
        });

        const content = markdown;
        const filename = `test-cases-${this.sanitizeFilename(documentTitle)}-${Date.now()}.md`;
        const mimeType = 'text/markdown';

        return { content, filename, mimeType };
    }

    static downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    static sanitizeFilename(filename) {
        return filename.replace(/[^a-zA-Z0-9]/g, '-');
    }
}