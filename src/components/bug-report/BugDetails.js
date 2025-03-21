import React, { useState, useEffect } from "react";
import { Edit, Link, MessageSquare } from "lucide-react";
import { doc, updateDoc, arrayUnion, Timestamp, collection, onSnapshot } from "firebase/firestore";
import { db, auth } from "../../config/firebase";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Image from "next/image";

const BugItemDetails = ({
    bug,
    teamMembers,
    updateBugStatus,
    getSeverityColor,
    getStatusColor,
    getPriorityFromSeverity,
    formatDate
}) => {
    const [editMode, setEditMode] = useState(false);
    const [editedBug, setEditedBug] = useState({ ...bug });
    const [chatMessage, setChatMessage] = useState("");
    const [testCases, setTestCases] = useState([]);
    const [showTestCaseSelector, setShowTestCaseSelector] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Categories for dropdown
    const categories = [
        "UI", "Functionality", "Performance", "Security", "Documentation", "Other"
    ];

    // Status options for dropdown
    const statusOptions = [
        "New", "In Progress", "Blocked", "Resolved", "Closed"
    ];

    // Severity options for dropdown
    const severityOptions = [
        "Critical", "High", "Medium", "Low"
    ];
    
    // Fetch test cases from database on component mount
    useEffect(() => {
        const fetchTestCases = async () => {
            try {
                setLoading(true);
                const testCasesCollection = collection(db, "testCases");
                
                // Set up real-time listener for test cases
                const unsubscribe = onSnapshot(testCasesCollection, (snapshot) => {
                    const testCasesList = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setTestCases(testCasesList);
                    setLoading(false);
                }, (error) => {
                    console.error("Error listening to test cases:", error);
                    setLoading(false);
                });
                
                // Clean up the listener on component unmount
                return () => unsubscribe();
            } catch (error) {
                console.error("Error fetching test cases:", error);
                setLoading(false);
            }
        };

        fetchTestCases();
    }, []);

    const handleSaveChanges = async () => {
        try {
            setLoading(true);
            const bugRef = doc(db, "bugReports", bug.id);
            await updateDoc(bugRef, {
                ...editedBug,
                lastUpdated: Timestamp.now()
            });

            // Set edit mode to false
            setEditMode(false);

            // Add to activity log
            await updateDoc(bugRef, {
                activityLog: arrayUnion({
                    action: "updated",
                    user: auth.currentUser?.displayName || auth.currentUser?.email || auth.currentUser?.uid, 
                    timestamp: Timestamp.now()
                })
            });

            // Update a parent state
            updateBugStatus(bug.id, editedBug.status);
            setLoading(false);
        } catch (error) {
            console.error("Error updating bug:", error);
            setLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!chatMessage.trim()) return;
        
        setLoading(true);
        const newMessage = {
            text: chatMessage,
            user: auth.currentUser?.displayName || auth.currentUser?.email || auth.currentUser?.uid, 
            timestamp: Timestamp.now()
        };
        
        try {
            const bugRef = doc(db, "bugReports", bug.id);
            await updateDoc(bugRef, {
                messages: arrayUnion(newMessage)
            });
            
            setChatMessage("");
            
            // Add to activity log
            await updateDoc(bugRef, {
                activityLog: arrayUnion({
                    action: "commented",
                    user: auth.currentUser?.displayName || auth.currentUser?.email || auth.currentUser?.uid,
                    timestamp: Timestamp.now()
                })
            });
            setLoading(false);
        } catch (error) {
            console.error("Error sending message:", error);
            setLoading(false);
        }
    };

    const handleSeverityChange = (severity) => {
        const priority = getPriorityFromSeverity(severity);
        setEditedBug({
            ...editedBug, 
            severity: severity,
            priority: priority.level
        });
    };

    const linkTestCase = async (testCase) => {
        try {
            setLoading(true);
            const updatedBugData = {
                ...editedBug,
                testCaseId: testCase.id,
                testCaseName: testCase.name,
                testStatus: testCase.status,
                isAutomated: testCase.isAutomated,
                scriptLink: testCase.scriptLink || ""
            };
            
            setEditedBug(updatedBugData);
            
            // Update in Firebase immediately
            const bugRef = doc(db, "bugReports", bug.id);
            await updateDoc(bugRef, updatedBugData);
            
            setShowTestCaseSelector(false);
            setLoading(false);
        } catch (error) {
            console.error("Error linking test case:", error);
            setLoading(false);
        }
    };

    const priority = getPriorityFromSeverity(editedBug.severity || "Low");

    return (
        <div className="p-4 bg-gray-50 border-t">
            {editMode ? (
                <div className="space-y-4">
                    {/* Edit form */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input
                                type="text"
                                className="w-full p-2 border rounded"
                                value={editedBug.title}
                                onChange={(e) => setEditedBug({ ...editedBug, title: e.target.value })}
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                            <input
                                type="text"
                                className="w-full p-2 border rounded bg-gray-100"
                                value={bug.id}
                                disabled
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            className="w-full p-2 border rounded min-h-24"
                            value={editedBug.description}
                            onChange={(e) => setEditedBug({ ...editedBug, description: e.target.value })}
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Steps to Reproduce</label>
                        <textarea
                            className="w-full p-2 border rounded min-h-24"
                            value={editedBug.stepsToReproduce}
                            onChange={(e) => setEditedBug({ ...editedBug, stepsToReproduce: e.target.value })}
                            disabled={loading}
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select
                                className="w-full p-2 border rounded"
                                value={editedBug.category}
                                onChange={(e) => setEditedBug({ ...editedBug, category: e.target.value })}
                                disabled={loading}
                            >
                                {categories.map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                            <select
                                className="w-full p-2 border rounded"
                                value={editedBug.assignedTo || ""}
                                onChange={(e) => setEditedBug({ ...editedBug, assignedTo: e.target.value })}
                                disabled={loading}
                            >
                                <option value="">Unassigned</option>
                                {teamMembers && teamMembers.map((member) => (
                                    <option key={member.id} value={member.name}>
                                        {member.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                className="w-full p-2 border rounded"
                                value={editedBug.status}
                                onChange={(e) => setEditedBug({ ...editedBug, status: e.target.value })}
                                disabled={loading}
                            >
                                {statusOptions.map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                            <select
                                className="w-full p-2 border rounded"
                                value={editedBug.severity}
                                onChange={(e) => handleSeverityChange(e.target.value)}
                                disabled={loading}
                            >
                                {severityOptions.map(severity => (
                                    <option key={severity} value={severity}>{severity}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                            <input
                                type="text"
                                className={`w-full p-2 border rounded ${priority.color}`}
                                value={editedBug.priority || priority.level}
                                disabled
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                            <DatePicker
                                selected={editedBug.dueDate ? 
                                    (editedBug.dueDate.seconds ? 
                                        new Date(editedBug.dueDate.seconds * 1000) : 
                                        new Date(editedBug.dueDate)) : 
                                    null}
                                onChange={(date) => {
                                    setEditedBug({
                                        ...editedBug,
                                        dueDate: date ? Timestamp.fromDate(date) : null
                                    });
                                }}
                                className="w-full p-2 border rounded"
                                dateFormat="MM/dd/yyyy"
                                placeholderText="Select due date"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Epic/Test Case</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded cursor-pointer bg-gray-50"
                                    value={editedBug.testCaseName || "Click to select test case"}
                                    onClick={() => !loading && setShowTestCaseSelector(!showTestCaseSelector)}
                                    readOnly
                                    disabled={loading}
                                />
                                {showTestCaseSelector && (
                                    <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-60 overflow-auto">
                                        {testCases.map((testCase) => (
                                            <div
                                                key={testCase.id}
                                                className="p-2 hover:bg-gray-100 cursor-pointer"
                                                onClick={() => linkTestCase(testCase)}
                                            >
                                                {testCase.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Test Status</label>
                            <input
                                type="text"
                                className="w-full p-2 border rounded bg-gray-100"
                                value={editedBug.testStatus || "N/A"}
                                disabled
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Is Automated</label>
                            <input
                                type="text"
                                className={`w-full p-2 border rounded bg-gray-100 ${
                                    editedBug.isAutomated ? "text-green-700" : "text-gray-700"
                                }`}
                                value={editedBug.isAutomated ? "Yes" : "No"}
                                disabled
                            />
                        </div>
                    </div>

                    {editedBug.isAutomated && editedBug.scriptLink && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Script Link</label>
                            <div className="flex items-center">
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded bg-gray-100"
                                    value={editedBug.scriptLink}
                                    disabled
                                />
                                <a
                                    href={editedBug.scriptLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                    <Link className="h-5 w-5" />
                                </a>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end space-x-2 mt-4">
                        <button
                            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                            onClick={() => setEditMode(false)}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                            onClick={handleSaveChanges}
                            disabled={loading}
                        >
                            {loading ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* View mode */}
                    <div className="flex justify-between">
                        <h3 className="text-lg font-medium">{bug.title}</h3>
                        <button
                            onClick={() => setEditMode(true)}
                            className="p-2 rounded-full hover:bg-gray-200"
                            disabled={loading}
                        >
                            <Edit className="h-5 w-5 text-gray-500" />
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <div>
                            <h4 className="text-sm font-medium text-gray-500">Category</h4>
                            <p className="mt-1">{bug.category}</p>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-gray-500">Status</h4>
                            <p className="mt-1">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bug.status)}`}>
                                    {bug.status}
                                </span>
                            </p>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-gray-500">Severity</h4>
                            <p className="mt-1">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(bug.severity)}`}>
                                    {bug.severity}
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Media section (for attached images/videos) */}
                    {bug.attachments && bug.attachments.length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-2">Attachments</h4>
                            <div className="grid grid-cols-2 gap-4">
                                {bug.attachments.map((attachment, index) => (
                                    <div key={index} className="border p-2 rounded">
                                        {attachment.type.startsWith('image/') ? (
                                            <Image 
                                                src={attachment.url} 
                                                alt={`Attachment ${index + 1}`}
                                                className="w-full h-auto max-h-40 object-contain"
                                            />
                                        ) : attachment.type.startsWith('video/') ? (
                                            <video 
                                                controls 
                                                className="w-full h-auto max-h-40"
                                            >
                                                <source src={attachment.url} type={attachment.type} />
                                                Your browser does not support the video tag.
                                            </video>
                                        ) : (
                                            <a 
                                                href={attachment.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-blue-500 hover:underline"
                                            >
                                                {attachment.name || `Attachment ${index + 1}`}
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <h4 className="text-sm font-medium text-gray-500">Description</h4>
                        <p className="mt-1 whitespace-pre-line">{bug.description}</p>
                    </div>

                    <div>
                        <h4 className="text-sm font-medium text-gray-500">Steps to Reproduce</h4>
                        <p className="mt-1 whitespace-pre-line">{bug.stepsToReproduce}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <div>
                        <h4 className="text-sm font-medium text-gray-500">Assigned To</h4>
                            <p className="mt-1">{bug.assignedTo || "Unassigned"}</p>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-gray-500">Due Date</h4>
                            <p className="mt-1">{formatDate(bug.dueDate) || "N/A"}</p>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-gray-500">Created At</h4>
                            <p className="mt-1">{formatDate(bug.createdAt) || "N/A"}</p>
                        </div>
                    </div>

                    {bug.testCaseName && (
                        <div className="grid grid-cols-3 gap-6">
                            <div>
                                <h4 className="text-sm font-medium text-gray-500">Test Case</h4>
                                <p className="mt-1">{bug.testCaseName}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-500">Test Status</h4>
                                <p className="mt-1">{bug.testStatus || "N/A"}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-500">Automated</h4>
                                <p className="mt-1">
                                    {bug.isAutomated ? 
                                        <span className="px-2 py-0.5 rounded-full text-xs font-medium text-green-700 bg-green-100">Yes</span> :
                                        <span className="px-2 py-0.5 rounded-full text-xs font-medium text-gray-700 bg-gray-100">No</span>
                                    }
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Display messages/comments */}
                    {bug.messages && bug.messages.length > 0 && (
                        <div className="mt-6">
                            <h4 className="text-sm font-medium text-gray-500 mb-2">Comments</h4>
                            <div className="space-y-3 max-h-60 overflow-y-auto">
                                {bug.messages.map((message, index) => (
                                    <div key={index} className="bg-white p-3 rounded border">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-medium">{message.user}</span>
                                            <span className="text-xs text-gray-500">
                                                {message.timestamp ? new Date(message.timestamp.seconds * 1000).toLocaleString() : 'N/A'}
                                            </span>
                                        </div>
                                        <p className="text-sm">{message.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Add comment form */}
                    <div className="mt-4">
                        <div className="flex items-center">
                            <MessageSquare className="h-5 w-5 text-gray-500 mr-2" />
                            <input
                                type="text"
                                placeholder="Add a comment..."
                                className="flex-1 bg-gray-100 p-2 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={chatMessage}
                                onChange={(e) => setChatMessage(e.target.value)}
                                disabled={loading}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && chatMessage.trim()) {
                                        handleSendMessage();
                                    }
                                }}
                            />
                            <button
                                className="bg-blue-500 text-white p-2 rounded-r-md hover:bg-blue-600 disabled:opacity-50 transition-colors"
                                onClick={handleSendMessage}
                                disabled={loading || !chatMessage.trim()}
                            >
                                {loading ? "Sending..." : "Send"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BugItemDetails;