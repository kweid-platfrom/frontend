/* eslint-disable react-hooks/exhaustive-deps */
'use client'
import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from '../config/firebase';
import { LoaderCircle, Search, Download } from 'lucide-react';
import { useAlert } from '../components/CustomAlert';
import TestCaseCard from '../components/testCase/TestCaseCard';
import TestCaseForm from '../components/testCase/TestCaseForm';
import AIGenerationForm from '../components/testCase/AIGenerationForm';
import RequirementImportForm from '../components/testCase/RequirementImport';
import TraceabilityMatrix from '../components/testCase/TraceabilityMatrix';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TEST_CASE_STATUSES, INITIAL_TEST_CASE } from '../components/constants';
import '../app/globals.css';

// Main component
const TestCaseManagement = () => {
    // Add user state to handle auth
    const [user, setUser] = useState(null);
    const [testCases, setTestCases] = useState([]);
    const [requirements, setRequirements] = useState([]);
    const [newTestCase, setNewTestCase] = useState({ ...INITIAL_TEST_CASE });
    const [loading, setLoading] = useState(false);
    const [importLoading, setImportLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [organizationId, setOrganizationId] = useState(null);
    
    // Use the alert hook
    const { showAlert, alertComponent } = useAlert();

    // Setup auth listener
    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                // Get user's organization ID
                try {
                    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                    if (userDoc.exists()) {
                        setOrganizationId(userDoc.data().organizationId);
                    }
                } catch (err) {
                    console.error("Error fetching user data:", err);
                    showAlert("Failed to fetch user data", "error");
                }
            } else {
                setUser(null);
                setOrganizationId(null);
            }
        });

        return () => unsubscribe();
    }, []);

    // Data fetching
    useEffect(() => {
        if (user) {
            fetchTestCases();
            fetchRequirements();
        }
    }, [user]);

    const fetchTestCases = async () => {
        if (!user) return;

        setLoading(true);
        try {
            // Add security rules check - only fetch documents for user's organization
            const testCasesRef = collection(db, 'testCases');
            // You may need to create a query to filter by organizationId
            const testCasesSnapshot = await getDocs(testCasesRef);
            const testCasesList = testCasesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTestCases(testCasesList);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching test cases:", err);
            showAlert("Failed to load test cases. Please check your database permissions.", "error");
            setLoading(false);
        }
    };

    const fetchRequirements = async () => {
        if (!user) return;

        try {
            // Add similar security rules check for requirements
            const requirementsRef = collection(db, 'requirements');
            // You may need to create a query to filter by organizationId
            const requirementsSnapshot = await getDocs(requirementsRef);
            const requirementsList = requirementsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRequirements(requirementsList);
        } catch (err) {
            console.error("Error fetching requirements:", err);
            showAlert("Failed to load requirements. Please check your database permissions.", "error");
        }
    };

    // Add test case
    const handleAddTestCase = async (testCaseData) => {
        if (!user) {
            showAlert("You must be logged in to create test cases", "error");
            return;
        }

        if (!testCaseData.title) {
            showAlert("Test case title is required", "error");
            return;
        }

        setLoading(true);
        try {
            // Prepare the tags - either split from string or use empty array
            const tags = testCaseData.tags
                ? testCaseData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
                : [];

            const formattedTestCase = {
                title: testCaseData.title,
                description: testCaseData.description || '',
                assignTo: user.uid,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: user.uid,
                isAutomated: false,
                steps: testCaseData.steps || '',
                expectedResult: testCaseData.expectedResult || '',
                tags: tags,
                requirementId: testCaseData.requirementId || '',
                organizationId: organizationId || '', // Ensure organizationId is always set
                priority: testCaseData.priority || 'P2',
                status: testCaseData.status || 'draft',
                testSteps: []
            };

            await addDoc(collection(db, 'testCases'), formattedTestCase);
            setNewTestCase({ ...INITIAL_TEST_CASE });
            fetchTestCases();
            showAlert("Test case added successfully", "success");
        } catch (err) {
            console.error("Error adding test case:", err);
            showAlert("Failed to add test case. Please try again.", "error");
        } finally {
            setLoading(false);
        }
    };

    // Delete test case
    const handleDeleteTestCase = async (id) => {
        if (!user) {
            showAlert("You must be logged in to delete test cases", "error");
            return;
        }

        if (window.confirm("Are you sure you want to delete this test case?")) {
            setLoading(true);
            try {
                await deleteDoc(doc(db, 'testCases', id));
                fetchTestCases();
                showAlert("Test case deleted successfully", "success");
            } catch (err) {
                console.error("Error deleting test case:", err);
                showAlert("Failed to delete test case. Please try again.", "error");
            } finally {
                setLoading(false);
            }
        }
    };

    // Update test case status
    const updateTestCaseStatus = async (id, newStatus) => {
        if (!user) {
            showAlert("You must be logged in to update test cases", "error");
            return;
        }

        setLoading(true);
        try {
            const testCaseRef = doc(db, 'testCases', id);
            await updateDoc(testCaseRef, {
                status: newStatus,
                updatedAt: new Date().toISOString()
            });
            fetchTestCases();
            showAlert("Test case status updated", "success");
        } catch (err) {
            console.error("Error updating test case status:", err);
            showAlert("Failed to update test case status. Please try again.", "error");
        } finally {
            setLoading(false);
        }
    };

    // Generate test cases using AI
    const generateTestCases = async (promptData) => {
        if (!user) {
            showAlert("You must be logged in to generate test cases", "error");
            return;
        }

        if (!promptData.aiPrompt) {
            showAlert("Please enter a prompt for test case generation", "error");
            return;
        }

        setLoading(true);
        try {
            // Get requirements data to provide context for the AI
            let requirementsContext = "";
            if (requirements.length > 0) {
                requirementsContext = "Here are the existing requirements:\n" +
                    requirements.map(req =>
                        `ID: ${req.id} - ${req.title}: ${req.description || 'No description'}`
                    ).join("\n");
            }

            // Call your API endpoint for generating test cases
            const response = await fetch('/api/generate-test-cases', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: promptData.aiPrompt,
                    requirements: requirementsContext,
                    organizationId: organizationId
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate test cases');
            }

            const generatedData = await response.json();

            // Process the generated test cases
            if (generatedData.testCases && Array.isArray(generatedData.testCases)) {
                // Add each test case to Firestore
                for (const testCase of generatedData.testCases) {
                    await addDoc(collection(db, 'testCases'), {
                        title: testCase.title,
                        description: testCase.description || '',
                        steps: testCase.steps || '',
                        expectedResult: testCase.expectedResult || '',
                        tags: testCase.tags || [],
                        priority: testCase.priority || 'P2',
                        status: TEST_CASE_STATUSES.DRAFT,
                        createdBy: user.uid,
                        assignTo: user.uid,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        organizationId: organizationId || '',
                        source: 'ai-generated',
                        requirementId: testCase.requirementId || ''
                    });
                }

                fetchTestCases();
                showAlert(`${generatedData.testCases.length} test cases generated successfully`, "success");
            } else {
                throw new Error('Invalid response format from AI');
            }
        } catch (err) {
            console.error("Error generating test cases:", err);
            showAlert(`Failed to generate test cases: ${err.message}`, "error");
        } finally {
            setLoading(false);
        }
    };

    // Handle document import
    const handleDocumentImport = async (formData) => {
        if (!user) {
            showAlert("You must be logged in to import documents", "error");
            return;
        }

        setImportLoading(true);
        try {
            // Add organization ID to formData
            formData.append('organizationId', organizationId || '');
            
            // Call your API endpoint to process the uploaded document
            const response = await fetch('/api/process-requirement-document', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to process document');
            }

            const result = await response.json();

            // Add imported requirements to Firestore
            if (result.requirements && Array.isArray(result.requirements)) {
                for (const requirement of result.requirements) {
                    await addDoc(collection(db, 'requirements'), {
                        title: requirement.title,
                        description: requirement.description || '',
                        createdBy: user.uid,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        organizationId: organizationId || '',
                        source: 'document-import',
                        status: 'active'
                    });
                }
                
                // Refresh requirements list
                fetchRequirements();
                
                // Generate test cases based on imported requirements if available
                if (result.testCases && Array.isArray(result.testCases)) {
                    for (const testCase of result.testCases) {
                        await addDoc(collection(db, 'testCases'), {
                            title: testCase.title,
                            description: testCase.description || '',
                            steps: testCase.steps || '',
                            expectedResult: testCase.expectedResult || '',
                            tags: testCase.tags || [],
                            priority: testCase.priority || 'P2',
                            status: TEST_CASE_STATUSES.DRAFT,
                            createdBy: user.uid,
                            assignTo: user.uid,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            organizationId: organizationId || '',
                            source: 'document-import',
                            requirementId: testCase.requirementId || ''
                        });
                    }
                    
                    // Refresh test cases list
                    fetchTestCases();
                    
                    showAlert(`${result.requirements.length} requirements and ${result.testCases.length} test cases imported successfully`, "success");
                } else {
                    showAlert(`${result.requirements.length} requirements imported successfully`, "success");
                }
            } else {
                throw new Error('No requirements found in document');
            }
        } catch (err) {
            console.error("Error importing document:", err);
            showAlert(`Failed to import document: ${err.message}`, "error");
        } finally {
            setImportLoading(false);
        }
    };

    // Export test cases
    const exportTestCases = () => {
        const dataStr = JSON.stringify(testCases, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = 'test-cases.json';
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        showAlert("Test cases exported successfully", "success");
    };

    // Export matrix
    const exportMatrix = () => {
        const matrixData = requirements.map(req => {
            const relatedTests = testCases.filter(tc => tc.requirementId === req.id);
            return {
                requirementId: req.id,
                requirementTitle: req.title,
                testCaseCount: relatedTests.length,
                testCases: relatedTests.map(t => ({ id: t.id, title: t.title, status: t.status }))
            };
        });

        const dataStr = JSON.stringify(matrixData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = 'traceability-matrix.json';
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        showAlert("Traceability matrix exported successfully", "success");
    };

    // Filter test cases
    const filteredTestCases = testCases.filter(testCase => {
        const matchesSearch =
            testCase.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            testCase.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || testCase.status === filterStatus;

        return matchesSearch && matchesFilter;
    });

    // Render loading state
    const renderLoading = () => (
        <div className="flex justify-center py-8">
            <LoaderCircle className="h-8 w-8 animate-spin" />
        </div>
    );

    // Tab: All Test Cases
    const renderAllTestCasesTab = () => (
        <TabsContent value="all-tests" className="space-y-4">
            <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Search test cases..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="p-2 border rounded-md"
                >
                    <option value="all">All Statuses</option>
                    {Object.values(TEST_CASE_STATUSES).map(status => (
                        <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                    ))}
                </select>
            </div>

            {loading ? renderLoading() : filteredTestCases.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    No test cases found. Create new test cases or adjust your search filters.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredTestCases.map((testCase) => (
                        <TestCaseCard
                            key={testCase.id}
                            testCase={testCase}
                            onDelete={handleDeleteTestCase}
                            onStatusChange={updateTestCaseStatus}
                        />
                    ))}
                </div>
            )}
        </TabsContent>
    );

    // Main render
    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold mb-8">Test Case Management</h1>

            {!user ? (
                <div className="text-center p-8 bg-gray-50 rounded-lg shadow-sm">
                    <p className="mb-4">Please log in to manage test cases</p>
                </div>
            ) : (
                <Tabs defaultValue="all-tests">
                    <TabsList className="grid grid-cols-5 mb-8">
                        <TabsTrigger value="all-tests">All Test Cases</TabsTrigger>
                        <TabsTrigger value="create-test">Create Test Case</TabsTrigger>
                        <TabsTrigger value="ai-generation">AI Generation</TabsTrigger>
                        <TabsTrigger value="import-requirements">Import Requirements</TabsTrigger>
                        <TabsTrigger value="traceability">Traceability Matrix</TabsTrigger>
                    </TabsList>

                    {renderAllTestCasesTab()}
                    
                    <TabsContent value="create-test">
                        <TestCaseForm 
                            initialTestCase={newTestCase}
                            requirements={requirements}
                            loading={loading}
                            onSubmit={handleAddTestCase}
                        />
                    </TabsContent>
                    
                    <TabsContent value="ai-generation">
                        <AIGenerationForm 
                            requirements={requirements}
                            loading={loading}
                            onGenerate={generateTestCases}
                        />
                    </TabsContent>
                    
                    <TabsContent value="import-requirements">
                        <RequirementImportForm 
                            loading={importLoading} 
                            onImport={handleDocumentImport} 
                        />
                    </TabsContent>
                    
                    <TabsContent value="traceability">
                        <TraceabilityMatrix 
                            requirements={requirements}
                            testCases={testCases}
                            loading={loading}
                            onExport={exportMatrix}
                        />
                    </TabsContent>

                    <div className="flex justify-end mt-4">
                        <Button variant="outline" onClick={exportTestCases}>
                            <Download className="mr-2 h-4 w-4" />
                            Export All Test Cases
                        </Button>
                    </div>
                </Tabs>
            )}
            
            {/* Include the Alert component */}
            {alertComponent}
        </div>
    );
};

export default TestCaseManagement;