import React, { useState, useEffect } from "react";
import { Edit, Link, Send, Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { doc, updateDoc, arrayUnion, Timestamp, collection, onSnapshot } from "firebase/firestore";
import { db, auth } from "../../config/firebase";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Image from "next/image";

// Alert component for success/error notifications
const Alert = ({ type, message, onClose }) => {
    const bgColor = type === "success" ? "bg-green-100" : "bg-red-100";
    const textColor = type === "success" ? "text-green-800" : "text-red-800";
    const Icon = type === "success" ? CheckCircle : AlertTriangle;

    return (
        <div className={`${bgColor} ${textColor} p-4 rounded-md mb-4 flex items-start`}>
            <Icon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <div className="flex-1">{message}</div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                &times;
            </button>
        </div>
    );
};

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
    const [comments, setComments] = useState(bug.messages || []);

    // Add state for alert
    const [alert, setAlert] = useState(null);

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

    // Set up real-time listeners for bug data and test cases
    useEffect(() => {
        const bugRef = doc(db, "bugReports", bug.id);

        // Listen for changes to this specific bug
        const unsubscribeBug = onSnapshot(bugRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                const bugData = docSnapshot.data();
                setEditedBug({ id: docSnapshot.id, ...bugData });
                setComments(bugData.messages || []);
            }
        }, (error) => {
            console.error("Error listening to bug updates:", error);
            setAlert({
                type: "error",
                message: "Error loading bug data: " + error.message
            });
        });

        // Listen for test cases
        const testCasesCollection = collection(db, "testCases");
        const unsubscribeTestCases = onSnapshot(testCasesCollection, (snapshot) => {
            const testCasesList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTestCases(testCasesList);
        }, (error) => {
            console.error("Error listening to test cases:", error);
        });

        // Clean up listeners on unmount
        return () => {
            unsubscribeBug();
            unsubscribeTestCases();
        };
    }, [bug.id]);

    const handleSaveChanges = async () => {
        try {
            setLoading(true);
            const bugRef = doc(db, "bugReports", bug.id);

            // Create updated bug object without messages (to avoid overwriting them)
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { messages, ...bugDataToUpdate } = editedBug;

            // Sanitize data before saving - ensure Firestore compatible data types
            // Convert any Date objects to Firestore Timestamps
            const sanitizedData = Object.entries(bugDataToUpdate).reduce((acc, [key, value]) => {
                // Skip undefined values
                if (value === undefined) return acc;

                // Convert Date objects to Timestamps
                if (value instanceof Date) {
                    acc[key] = Timestamp.fromDate(value);
                } else if (key === 'dueDate' && value && typeof value === 'object' && !value.seconds) {
                    // Handle case where dueDate might be a Date-like object but not a Firestore Timestamp
                    acc[key] = Timestamp.fromDate(new Date(value));
                } else {
                    acc[key] = value;
                }
                return acc;
            }, {});

            // Update the bug data
            await updateDoc(bugRef, {
                ...sanitizedData,
                lastUpdated: Timestamp.now()
            });

            // Add to activity log
            await updateDoc(bugRef, {
                activityLog: arrayUnion({
                    action: "updated",
                    user: auth.currentUser?.displayName || auth.currentUser?.email || auth.currentUser?.uid,
                    timestamp: Timestamp.now()
                })
            });

            // Update parent state
            updateBugStatus(bug.id, editedBug.status);

            // Show success alert
            setAlert({
                type: "success",
                message: "Bug updated successfully!"
            });

            // Exit edit mode
            setEditMode(false);
        } catch (error) {
            console.error("Error updating bug:", error);

            // Show error alert
            setAlert({
                type: "error",
                message: `Error updating bug: ${error.message}`
            });
        } finally {
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
        } catch (error) {
            console.error("Error sending message:", error);
            setAlert({
                type: "error",
                message: `Error sending message: ${error.message}`
            });
        } finally {
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

            setAlert({
                type: "success",
                message: "Test case linked successfully!"
            });
        } catch (error) {
            console.error("Error linking test case:", error);
            setAlert({
                type: "error",
                message: `Error linking test case: ${error.message}`
            });
        } finally {
            setLoading(false);
        }
    };

    const priority = getPriorityFromSeverity(editedBug.severity || "Low");

    return (
        <div className="p-4 bg-gray-50 border-t">
            {/* Alert notification */}
            {alert && (
                <Alert
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert(null)}
                />
            )}

            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                {/* Left Column: Bug Details */}
                <div className={`flex-1 ${editMode ? "bg-gray-100 p-4 rounded-lg shadow-inner" : ""}`}>
                    {editMode ? (
                        <div className="space-y-4">
                            {/* Edit form */}
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-lg font-medium">Edit Bug Details</h3>
                                <button
                                    className="p-2 rounded-full hover:bg-gray-200"
                                    onClick={() => setEditMode(false)}
                                    disabled={loading}
                                >
                                    <span className="text-sm text-gray-500">Cancel</span>
                                </button>
                            </div>

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
                                                dueDate: date
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
                                        className={`w-full p-2 border rounded bg-gray-100 ${editedBug.isAutomated ? "text-green-700" : "text-gray-700"
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

                            {/* Attachment section - preserving space for it */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Attachments</label>
                                <div className="border-2 border-dashed rounded-md p-4 text-center text-gray-400">
                                    {(editedBug.attachments && editedBug.attachments.length > 0) ? (
                                        <div className="grid grid-cols-2 gap-2">
                                            {editedBug.attachments.map((attachment, index) => (
                                                <div key={index} className="border p-2 rounded">
                                                    {attachment.type.startsWith('image/') ? (
                                                        <Image
                                                            src={attachment.url}
                                                            alt={`Attachment ${index + 1}`}
                                                            width={100}
                                                            height={100}
                                                            className="w-full h-auto max-h-20 object-contain"
                                                        />
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
                                    ) : (
                                        <span>No attachments</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end mt-4">
                                <button
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 flex items-center"
                                    onClick={handleSaveChanges}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : "Save Changes"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* View mode */}
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-lg font-medium">{editedBug.title}</h3>
                                <button
                                    onClick={() => setEditMode(true)}
                                    className="p-2 rounded-full hover:bg-gray-200"
                                    disabled={loading}
                                >
                                    <Edit className="h-5 w-5 text-gray-500" />
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">Category</h4>
                                    <p className="mt-1">{editedBug.category}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">Status</h4>
                                    <p className="mt-1">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(editedBug.status)}`}>
                                            {editedBug.status}
                                        </span>
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">Severity</h4>
                                    <p className="mt-1">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(editedBug.severity)}`}>
                                            {editedBug.severity}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            {/* Attachments section */}
                            {editedBug.attachments && editedBug.attachments.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 mb-2">Attachments</h4>
                                    <div className="grid grid-cols-2 gap-4 max-h-40 overflow-y-auto">
                                        {editedBug.attachments.map((attachment, index) => (
                                            <div key={index} className="border p-2 rounded">
                                                {attachment.type.startsWith('image/') ? (
                                                    <Image
                                                        src={attachment.url}
                                                        alt={`Attachment ${index + 1}`}
                                                        width={100}
                                                        height={100}
                                                        className="w-full h-auto max-h-20 object-contain"
                                                    />
                                                ) : attachment.type.startsWith('video/') ? (
                                                    <video
                                                        controls
                                                        className="w-full h-auto max-h-20"
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
                                <p className="mt-1 whitespace-pre-line">{editedBug.description}</p>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-gray-500">Steps to Reproduce</h4>
                                <p className="mt-1 whitespace-pre-line">{editedBug.stepsToReproduce}</p>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">Assigned To</h4>
                                    <p className="mt-1">{editedBug.assignedTo || "Unassigned"}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">Due Date</h4>
                                    <p className="mt-1">{formatDate(editedBug.dueDate) || "N/A"}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">Created At</h4>
                                    <p className="mt-1">{formatDate(editedBug.createdAt) || "N/A"}</p>
                                </div>
                            </div>

                            {editedBug.testCaseName && (
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500">Test Case</h4>
                                        <p className="mt-1">{editedBug.testCaseName}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500">Test Status</h4>
                                        <p className="mt-1">{editedBug.testStatus || "N/A"}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500">Automated</h4>
                                        <p className="mt-1">
                                            {editedBug.isAutomated ?
                                                <span className="px-2 py-0.5 rounded-full text-xs font-medium text-green-700 bg-green-100">Yes</span> :
                                                <span className="px-2 py-0.5 rounded-full text-xs font-medium text-gray-700 bg-gray-100">No</span>
                                            }
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Column: Comments Section (always visible regardless of edit mode) */}
                <div className="flex-1 border-l pl-4">
                    <h3 className="text-lg font-medium mb-4">Comments</h3>

                    {/* Comments display area */}
                    <div className="h-96 overflow-y-auto mb-4 p-2 bg-white rounded border">
                        {comments && comments.length > 0 ? (
                            <div className="space-y-3">
                                {comments.map((message, index) => (
                                    <div key={index} className="bg-gray-50 p-3 rounded border">
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
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">
                                No comments yet
                            </div>
                        )}
                    </div>

                    {/* Add comment form - always visible and independent of edit mode */}
                    <div className="flex items-center">
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
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BugItemDetails;
