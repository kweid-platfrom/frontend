import React, { useMemo } from 'react';
import { Download, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { TEST_CASE_STATUSES } from '../constants';

const TraceabilityMatrix = ({ requirements, testCases, onExport, error }) => {
    // Calculate coverage metrics
    const coverageMetrics = useMemo(() => {
        const totalRequirements = requirements.length;
        let coveredRequirements = 0;
        let totalTestCases = testCases.length;
        let passedTestCases = 0;
        
        // Map of requirement ID to its test cases
        const requirementCoverage = requirements.reduce((acc, req) => {
            const relatedTests = testCases.filter(tc => tc.requirementId === req.id);
            
            if (relatedTests.length > 0) {
                coveredRequirements++;
            }
            
            const passed = relatedTests.filter(tc => tc.status === TEST_CASE_STATUSES.PASSED).length;
            passedTestCases += passed;
            
            acc[req.id] = {
                total: relatedTests.length,
                passed: passed,
                tests: relatedTests
            };
            
            return acc;
        }, {});
        
        return {
            requirementCoverage,
            coveragePercentage: totalRequirements > 0 ? (coveredRequirements / totalRequirements) * 100 : 0,
            passRate: totalTestCases > 0 ? (passedTestCases / totalTestCases) * 100 : 0,
            totalTestCases,
            totalRequirements,
            coveredRequirements
        };
    }, [requirements, testCases]);

    // Get color based on coverage percentage
    const getCoverageColor = (percentage) => {
        if (percentage === 0) return "bg-gray-200";
        if (percentage < 50) return "bg-red-200";
        if (percentage < 80) return "bg-yellow-200";
        return "bg-green-200";
    };

    // Get status badge color
    const getStatusColor = (status) => {
        switch (status) {
            case TEST_CASE_STATUSES.PASSED:
                return "bg-green-100 text-green-800";
            case TEST_CASE_STATUSES.FAILED:
                return "bg-red-100 text-red-800";
            case TEST_CASE_STATUSES.BLOCKED:
                return "bg-orange-100 text-orange-800";
            case TEST_CASE_STATUSES.IN_PROGRESS:
                return "bg-blue-100 text-blue-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <div className="space-y-6">
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Requirement Coverage</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {coverageMetrics.coveragePercentage.toFixed(1)}%
                        </div>
                        <p className="text-xs text-gray-500">
                            {coverageMetrics.coveredRequirements} of {coverageMetrics.totalRequirements} requirements covered
                        </p>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Test Pass Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {coverageMetrics.passRate.toFixed(1)}%
                        </div>
                        <p className="text-xs text-gray-500">
                            Based on {coverageMetrics.totalTestCases} test cases
                        </p>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {coverageMetrics.totalTestCases}
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={onExport} className="w-full bg-[#00897B] hover:bg-[#00695C] rounded">
                            <Download className="h-4 w-4 mr-2" />
                            Export Matrix
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Matrix Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Requirements Traceability Matrix</CardTitle>
                </CardHeader>
                <CardContent>
                    {requirements.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No requirements found. Please add requirements before creating a traceability matrix.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-1/4">Requirement</TableHead>
                                    <TableHead className="w-1/6">Coverage</TableHead>
                                    <TableHead>Associated Test Cases</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requirements.map((req) => {
                                    const coverage = coverageMetrics.requirementCoverage[req.id];
                                    const coveragePercentage = coverage?.total > 0 ? 
                                        (coverage.passed / coverage.total) * 100 : 0;
                                    
                                    return (
                                        <TableRow key={req.id}>
                                            <TableCell className="align-top">
                                                <div className="font-medium">{req.title}</div>
                                                <div className="text-xs text-gray-500">{req.id}</div>
                                            </TableCell>
                                            <TableCell className="align-top">
                                                {coverage?.total > 0 ? (
                                                    <>
                                                        <div className={`inline-block px-2 py-1 rounded ${getCoverageColor(coveragePercentage)}`}>
                                                            {coverage.passed} / {coverage.total}
                                                        </div>
                                                        <div className="text-xs mt-1">
                                                            {coveragePercentage.toFixed(0)}% passed
                                                        </div>
                                                    </>
                                                ) : (
                                                    <Badge variant="outline" className="bg-gray-100">No tests</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="align-top">
                                                {coverage?.tests?.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {coverage.tests.map((test) => (
                                                            <div key={test.id} className="flex items-center">
                                                                <FileText className="h-3 w-3 mr-2 text-gray-400" />
                                                                <span className="flex-1 text-sm">{test.title}</span>
                                                                <Badge className={getStatusColor(test.status)}>
                                                                    {test.status}
                                                                </Badge>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-500 text-sm">No associated tests</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default TraceabilityMatrix;