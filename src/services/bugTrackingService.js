import { Timestamp, where, orderBy } from 'firebase/firestore';
import { calculateBugMetrics } from '../utils/calculateBugMetrics';
import firestoreService from './firestoreService';
import {
    getTeamMemberName,
    getPriorityFromSeverity,
    getShortBugId,
    isPastDue,
    VALID_BUG_STATUSES,
    VALID_BUG_SEVERITIES,
    VALID_ENVIRONMENTS,
} from '../utils/bugUtils';

class BugTrackingService {
    constructor() {
        this.firestoreService = firestoreService;
    }

    // Get bugs collection path based on suite type
    getBugsCollectionPath(suite, userId) {
        if (!suite?.suite_id || !userId) {
            throw new Error('Invalid suite or user configuration');
        }
        if (suite.accountType === 'individual') {
            return `individualAccounts/${userId}/testSuites/${suite.suite_id}/bugs`;
        }
        if (!suite.org_id) {
            throw new Error('Organization ID missing for organization suite');
        }
        return `organizations/${suite.org_id}/testSuites/${suite.suite_id}/bugs`;
    }

    // Get team members collection path
    getTeamMembersCollectionPath(suite) {
        if (!suite?.org_id) return null;
        return `organizations/${suite.org_id}/members`;
    }

    // Get sprints collection path
    getSprintsCollectionPath(suite) {
        if (!suite?.suite_id || !suite?.org_id) return null;
        return `organizations/${suite.org_id}/testSuites/${suite.suite_id}/sprints`;
    }

    // Create a bug
    async createBug(suite, user, bugData) {
        const bugsCollectionPath = this.getBugsCollectionPath(suite, user.uid);
        const bugId = `bug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const firestoreData = {
            id: bugId,
            suite_id: suite.suite_id,
            created_by: user.uid,
            reportedBy: user.displayName || user.email || 'Unknown User',
            reportedByEmail: user.email || '',
            title: bugData.title.trim(),
            description: bugData.description.trim(),
            actualBehavior: bugData.actualBehavior?.trim() || '',
            stepsToReproduce: bugData.stepsToReproduce?.trim() || '',
            expectedBehavior: bugData.expectedBehavior?.trim() || '',
            workaround: bugData.workaround?.trim() || '',
            status: bugData.status || 'New',
            priority: bugData.priority || getPriorityFromSeverity(bugData.severity),
            severity: bugData.severity || 'Medium',
            category: bugData.category || '',
            tags: bugData.tags || [bugData.category?.toLowerCase().replace(/\s+/g, '_')].filter(Boolean),
            assignedTo: bugData.assignedTo || null,
            source: bugData.source || 'manual',
            environment: bugData.environment || 'Production',
            browserInfo: bugData.browserInfo || {},
            deviceInfo: bugData.deviceInfo || {},
            userAgent: bugData.userAgent || navigator.userAgent,
            frequency: bugData.frequency || 'Once',
            hasConsoleLogs: bugData.hasConsoleLogs || false,
            hasNetworkLogs: bugData.hasNetworkLogs || false,
            hasAttachments: bugData.hasAttachments || (bugData.attachments?.length > 0),
            attachments: bugData.attachments?.map(att => ({
                name: att.name,
                url: att.url || null,
                type: att.type || null,
                size: att.size || null,
            })) || [],
            resolution: bugData.resolution || '',
            resolved_at: bugData.resolvedAt || null,
            resolvedBy: bugData.resolvedBy || null,
            resolvedByName: bugData.resolvedByName || null,
            comments: bugData.comments || [],
            version: 1,
            searchTerms: [
                bugData.title?.toLowerCase(),
                bugData.description?.toLowerCase(),
                bugData.category?.toLowerCase(),
                bugData.severity?.toLowerCase(),
                bugData.status?.toLowerCase(),
                bugData.source?.toLowerCase(),
                bugData.environment?.toLowerCase(),
            ].filter(Boolean),
            resolutionHistory: [],
            commentCount: 0,
            viewCount: 0,
            lastActivity: Timestamp.now(),
            lastActivityBy: user.uid,
            created_at: Timestamp.now(),
            updated_at: Timestamp.now(),
        };
        const result = await this.firestoreService.createDocument(bugsCollectionPath, firestoreData);
        if (!result.success) {
            throw new Error(result.error?.message || 'Failed to create bug');
        }
        return result;
    }

    // Update a bug
    async updateBug(suite, userId, bugId, updates) {
        const bugsCollectionPath = this.getBugsCollectionPath(suite, userId);
        const result = await this.firestoreService.updateDocument(bugsCollectionPath, bugId, {
            ...updates,
            updated_at: Timestamp.now(),
            updated_by: userId,
        });
        if (!result.success) {
            throw new Error(result.error?.message || 'Failed to update bug');
        }
        return result;
    }

    // Fetch bugs
    async fetchBugs(suite, user, filters = {}) {
        const bugsCollectionPath = this.getBugsCollectionPath(suite, user.uid);
        const whereConstraints = [];
        if (filters.timeRange && filters.timeRange !== 'all') {
            const fromDate = new Date(Date.now() - ({
                '1d': 24 * 60 * 60 * 1000,
                '7d': 7 * 24 * 60 * 60 * 1000,
                '30d': 30 * 24 * 60 * 60 * 1000,
                '90d': 90 * 24 * 60 * 60 * 1000,
            }[filters.timeRange] || 7 * 24 * 60 * 60 * 1000));
            whereConstraints.push(where('created_at', '>=', Timestamp.fromDate(fromDate)));
        }
        ['priority', 'severity', 'status', 'source', 'environment'].forEach(field => {
            if (filters[field] && filters[field] !== 'all') {
                whereConstraints.push(where(field, '==', filters[field]));
            }
        });
        const orderConstraints = [orderBy('created_at', 'desc')];
        const queryResult = await this.firestoreService.queryDocuments(
            bugsCollectionPath,
            [...whereConstraints, ...orderConstraints],
            null,
            1000,
        );
        if (!queryResult.success) {
            throw new Error(queryResult.error?.message || 'Failed to fetch bugs');
        }
        return queryResult.data.map(doc => ({
            id: doc.id,
            ...doc,
            createdAt: doc.created_at,
            updatedAt: doc.updated_at,
            resolvedAt: doc.resolved_at,
        }));
    }

    // Subscribe to bugs
    subscribeToBugs(suite, user, callback, errorCallback) {
        const bugsCollectionPath = this.getBugsCollectionPath(suite, user.uid);
        return this.firestoreService.subscribeToCollection(
            bugsCollectionPath,
            [orderBy('created_at', 'desc')],
            (docs) => {
                const bugsData = docs.map(doc => ({
                    id: doc.id,
                    ...doc,
                    createdAt: doc.created_at,
                    updatedAt: doc.updated_at,
                    resolvedAt: doc.resolved_at,
                }));
                callback(bugsData);
            },
            (err) => {
                const message = err.code === 'permission-denied'
                    ? 'You don’t have permission to access bugs in this suite'
                    : 'Failed to load bugs';
                errorCallback?.({ message, originalError: err });
            },
        );
    }

    // Fetch team members
    async fetchTeamMembers(suite) {
        const teamMembersCollectionPath = this.getTeamMembersCollectionPath(suite);
        if (!teamMembersCollectionPath) {
            return [];
        }
        const result = await this.firestoreService.queryDocuments(teamMembersCollectionPath);
        if (!result.success) {
            throw new Error(result.error?.message || 'Failed to fetch team members');
        }
        return result.data.map(doc => ({
            id: doc.id,
            name: getTeamMemberName(doc),
            ...doc,
        }));
    }

    // Subscribe to team members
    subscribeToTeamMembers(suite, callback, errorCallback) {
        const teamMembersCollectionPath = this.getTeamMembersCollectionPath(suite);
        if (!teamMembersCollectionPath) {
            callback([]);
            return null;
        }
        return this.firestoreService.subscribeToCollection(
            teamMembersCollectionPath,
            [],
            (docs) => {
                callback(docs.map(doc => ({
                    id: doc.id,
                    name: getTeamMemberName(doc),
                    ...doc,
                })));
            },
            (err) => {
                const message = err.code === 'permission-denied'
                    ? 'You don’t have permission to access team members'
                    : 'Failed to load team members';
                errorCallback?.({ message, originalError: err });
            },
        );
    }

    // Fetch sprints
    async fetchSprints(suite) {
        const sprintsCollectionPath = this.getSprintsCollectionPath(suite);
        if (!sprintsCollectionPath) {
            return [];
        }
        const result = await this.firestoreService.queryDocuments(sprintsCollectionPath);
        if (!result.success) {
            throw new Error(result.error?.message || 'Failed to fetch sprints');
        }
        return result.data.map(doc => ({
            id: doc.id,
            ...doc,
        }));
    }

    // Subscribe to sprints
    subscribeToSprints(suite, callback, errorCallback) {
        const sprintsCollectionPath = this.getSprintsCollectionPath(suite);
        if (!sprintsCollectionPath) {
            callback([]);
            return null;
        }
        return this.firestoreService.subscribeToCollection(
            sprintsCollectionPath,
            [orderBy('created_at', 'desc')],
            (docs) => {
                callback(docs.map(doc => ({
                    id: doc.id,
                    ...doc,
                })));
            },
            (err) => {
                const message = err.code === 'permission-denied'
                    ? 'You don’t have permission to access sprints'
                    : 'Failed to load sprints';
                errorCallback?.({ message, originalError: err });
            },
        );
    }

    // Create a sprint
    async createSprint(suite, sprintData) {
        const sprintsCollectionPath = this.getSprintsCollectionPath(suite);
        if (!sprintsCollectionPath) {
            throw new Error('Invalid suite configuration');
        }
        const result = await this.firestoreService.createDocument(sprintsCollectionPath, sprintData);
        if (!result.success) {
            throw new Error(result.error?.message || 'Failed to create sprint');
        }
        return result;
    }

    // Fetch bug tracking metrics
    async fetchBugTrackingMetrics(suite, user, filters = {}) {
        const bugsCollectionPath = this.getBugsCollectionPath(suite, user.uid);
        const whereConstraints = [];
        if (filters.timeRange && filters.timeRange !== 'all') {
            const fromDate = new Date(Date.now() - ({
                '1d': 24 * 60 * 60 * 1000,
                '7d': 7 * 24 * 60 * 60 * 1000,
                '30d': 30 * 24 * 60 * 60 * 1000,
                '90d': 90 * 24 * 60 * 60 * 1000,
            }[filters.timeRange] || 7 * 24 * 60 * 60 * 1000));
            whereConstraints.push(where('created_at', '>=', Timestamp.fromDate(fromDate)));
        }
        ['priority', 'severity', 'status', 'source', 'environment'].forEach(field => {
            if (filters[field] && filters[field] !== 'all') {
                whereConstraints.push(where(field, '==', filters[field]));
            }
        });
        const orderConstraints = [orderBy('created_at', 'desc')];
        const queryResult = await this.firestoreService.queryDocuments(
            bugsCollectionPath,
            [...whereConstraints, ...orderConstraints],
            null,
            1000,
        );
        if (!queryResult.success) {
            throw new Error(queryResult.error?.message || 'Failed to fetch bug metrics');
        }
        const bugs = queryResult.data.map(doc => ({
            id: doc.id,
            ...doc,
            createdAt: doc.created_at,
            updatedAt: doc.updated_at,
            resolvedAt: doc.resolved_at,
        }));
        console.log(`Fetched ${bugs.length} bugs for suite ${suite.suite_id}`);
        return calculateBugMetrics(bugs);
    }

    // Export bugs
    async exportBugs(suite, user) {
        const bugsCollectionPath = this.getBugsCollectionPath(suite, user.uid);
        const result = await this.firestoreService.queryDocuments(bugsCollectionPath, [orderBy('created_at', 'desc')]);
        if (!result.success) {
            throw new Error(result.error?.message || 'Failed to export bugs');
        }
        const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bugs-${suite.suite_id}-${new Date().toISOString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        return { success: true };
    }

    // Update bug status
    async updateBugStatus(suite, userId, bugId, status) {
        if (!VALID_BUG_STATUSES.includes(status)) {
            throw new Error('Invalid bug status');
        }
        return await this.updateBug(suite, userId, bugId, { status });
    }

    // Update bug severity
    async updateBugSeverity(suite, userId, bugId, severity) {
        if (!VALID_BUG_SEVERITIES.includes(severity)) {
            throw new Error('Invalid bug severity');
        }
        const priority = getPriorityFromSeverity(severity);
        return await this.updateBug(suite, userId, bugId, { severity, priority });
    }

    // Update bug assignment
    async updateBugAssignment(suite, userId, bugId, assignedTo) {
        return await this.updateBug(suite, userId, bugId, { assignedTo: assignedTo || null });
    }

    // Update bug environment
    async updateBugEnvironment(suite, userId, bugId, environment) {
        if (!VALID_ENVIRONMENTS.includes(environment)) {
            throw new Error('Invalid environment');
        }
        return await this.updateBug(suite, userId, bugId, { environment });
    }

    // Format date
    formatDate(date) {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    }
}

// Create and export singleton instance
const bugTrackingService = new BugTrackingService();
export default bugTrackingService;
export { BugTrackingService, VALID_BUG_STATUSES, VALID_BUG_SEVERITIES, VALID_ENVIRONMENTS, getShortBugId, isPastDue };