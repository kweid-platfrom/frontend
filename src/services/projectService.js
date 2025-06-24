// services/projectService.js
import { db } from '../config/firebase';
import { 
    collection, 
    doc,
    addDoc, 
    getDocs,
    getDoc,
    updateDoc,
    deleteDoc,
    query, 
    where, 
    orderBy,
    onSnapshot,
    serverTimestamp
} from 'firebase/firestore';
import { validateProjectName } from '../utils/onboardingUtils';
import { 
    createPermissionChecker,
    PERMISSIONS,
    isIndividualAccount,
    isOrganizationAccount
} from './permissionService';

/**
 * Error classes for better error handling
 */
class ProjectPermissionError extends Error {
    constructor(message, code = 'PERMISSION_DENIED') {
        super(message);
        this.name = 'ProjectPermissionError';
        this.code = code;
    }
}

class ProjectValidationError extends Error {
    constructor(message, code = 'VALIDATION_ERROR') {
        super(message);
        this.name = 'ProjectValidationError';
        this.code = code;
    }
}

/**
 * Get user profile - This should be implemented based on your user service
 * For now, assuming it exists or needs to be implemented
 */
const getUserProfile = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
            throw new Error('User not found');
        }
        
        return { uid: userId, ...userDoc.data() };
    } catch (error) {
        console.error('Error fetching user profile:', error);
        throw error;
    }
};

/**
 * Validate user permissions for project operations
 */
const validateProjectPermissions = async (userId, operation, context = {}) => {
    try {
        const userProfile = await getUserProfile(userId);
        const permissionChecker = createPermissionChecker(userProfile);
        const { organizationId, projectId } = context;

        switch (operation) {
            case 'create':
                if (!permissionChecker.can(PERMISSIONS.CREATE_PROJECTS)) {
                    throw new ProjectPermissionError('You do not have permission to create projects');
                }

                // Individual users cannot create projects in organizations
                if (organizationId && isIndividualAccount(userProfile)) {
                    throw new ProjectPermissionError(
                        'Individual accounts cannot create projects in organizations. Upgrade to an organization account to access team features.',
                        'UPGRADE_REQUIRED'
                    );
                }

                // Organization users must be members of the target org
                if (organizationId && userProfile.organizationId !== organizationId) {
                    throw new ProjectPermissionError('You are not a member of this organization');
                }
                break;

            case 'read':
                if (!permissionChecker.can(PERMISSIONS.READ_PROJECTS)) {
                    throw new ProjectPermissionError('You do not have permission to view projects');
                }
                break;

            case 'update':
                if (!permissionChecker.can(PERMISSIONS.WRITE_PROJECTS)) {
                    throw new ProjectPermissionError('You do not have permission to update projects');
                }

                // Additional context-based validation for specific project
                if (projectId && !permissionChecker.canAccessProject('write', context)) {
                    throw new ProjectPermissionError('You do not have permission to update this project');
                }
                break;

            case 'delete':
                if (!permissionChecker.can(PERMISSIONS.DELETE_PROJECTS)) {
                    throw new ProjectPermissionError('You do not have permission to delete projects');
                }

                // Additional context-based validation for specific project
                if (projectId && !permissionChecker.canAccessProject('delete', context)) {
                    throw new ProjectPermissionError('You do not have permission to delete this project');
                }
                break;

            default:
                throw new ProjectValidationError(`Invalid operation: ${operation}`);
        }

        return { userProfile, permissionChecker };
    } catch (error) {
        if (error instanceof ProjectPermissionError || error instanceof ProjectValidationError) {
            throw error;
        }
        console.error('Error validating project permissions:', error);
        throw new ProjectPermissionError('Permission validation failed');
    }
};

/**
 * Check if project name exists (case-insensitive)
 * Supports both flat structure and subcollection structure
 */
export const checkProjectNameExists = async (name, userId, organizationId = null) => {
    try {
        // Validate permissions first
        await validateProjectPermissions(userId, 'read', { organizationId });

        const validation = validateProjectName(name);
        if (!validation.isValid) {
            throw new ProjectValidationError(validation.errors[0]);
        }

        let q;
        if (organizationId) {
            // Check in organization's subcollection (new structure)
            const projectsRef = collection(db, 'organizations', organizationId, 'projects');
            q = query(
                projectsRef,
                where('normalizedName', '==', validation.normalizedName)
            );
        } else {
            // Check in flat projects collection (existing structure)
            q = query(
                collection(db, 'projects'),
                where('normalizedName', '==', validation.normalizedName),
                where('createdBy', '==', userId),
                where('organizationId', '==', null)
            );
        }

        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    } catch (error) {
        console.error('Error checking project name:', error);
        throw error;
    }
};

/**
 * Create a new project
 * Supports both flat structure and subcollection structure
 */
export const createProject = async (projectData, userId, organizationId = null) => {
    try {
        const { name, description = '' } = projectData;
        
        // Validate project name
        const validation = validateProjectName(name);
        if (!validation.isValid) {
            throw new ProjectValidationError(validation.errors[0]);
        }

        // Validate permissions
        await validateProjectPermissions(userId, 'create', { 
            organizationId, 
            projectData 
        });

        // Check if name already exists
        const nameExists = await checkProjectNameExists(name, userId, organizationId);
        if (nameExists) {
            throw new ProjectValidationError('A project with this name already exists. Please choose a different name.');
        }

        const baseProjectData = {
            name: name.trim(),
            normalizedName: validation.normalizedName,
            description: description.trim(),
            createdBy: userId,
            organizationId: organizationId || null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            members: [userId], // Creator is automatically a member
            status: 'active',
            settings: {
                defaultAssignee: userId,
                testCasePrefix: 'TC',
                bugReportPrefix: 'BUG',
                enableAIGeneration: true,
                enableScreenRecording: true
            },
            stats: {
                totalTestCases: 0,
                totalBugReports: 0,
                automatedTests: 0,
                lastActivity: serverTimestamp()
            }
        };

        let docRef;
        if (organizationId) {
            // Create in organization's subcollection (new structure)
            const projectsRef = collection(db, 'organizations', organizationId, 'projects');
            docRef = await addDoc(projectsRef, baseProjectData);
            
            // Update organization's project count
            const orgRef = doc(db, 'organizations', organizationId);
            const orgDoc = await getDoc(orgRef);
            
            if (orgDoc.exists()) {
                const currentProjectCount = orgDoc.data().projectCount || 0;
                await updateDoc(orgRef, {
                    projectCount: currentProjectCount + 1,
                    updatedAt: serverTimestamp()
                });
            }
        } else {
            // Create in flat projects collection (existing structure)
            docRef = await addDoc(collection(db, 'projects'), baseProjectData);
        }

        return {
            success: true,
            projectId: docRef.id,
            project: { id: docRef.id, ...baseProjectData }
        };
    } catch (error) {
        console.error('Error creating project:', error);
        
        if (error instanceof ProjectPermissionError || error instanceof ProjectValidationError) {
            return {
                success: false,
                error: error.message,
                code: error.code
            };
        }
        
        return {
            success: false,
            error: 'Failed to create project. Please try again.',
            code: 'UNKNOWN_ERROR'
        };
    }
};

/**
 * Get all projects for a specific organization
 */
export const getOrganizationProjects = async (organizationId, userId) => {
    try {
        if (!organizationId) {
            throw new ProjectValidationError('Organization ID is required');
        }

        // Validate permissions
        await validateProjectPermissions(userId, 'read', { organizationId });

        const projectsRef = collection(db, 'organizations', organizationId, 'projects');
        const q = query(projectsRef, orderBy('createdAt', 'desc'));
        
        const querySnapshot = await getDocs(q);
        const projects = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return projects;
    } catch (error) {
        console.error('Error fetching organization projects:', error);
        throw error;
    }
};

/**
 * Get all projects for a user across all organizations and personal projects
 */
export const getUserProjects = async (userId) => {
    try {
        // Validate permissions
        const { userProfile } = await validateProjectPermissions(userId, 'read');
        const userProjects = [];

        // Get personal projects (flat structure) - only for individual accounts
        if (isIndividualAccount(userProfile) || !userProfile.organizationId) {
            try {
                const personalProjectsQuery = query(
                    collection(db, 'projects'),
                    where('createdBy', '==', userId),
                    where('organizationId', '==', null),
                    orderBy('createdAt', 'desc')
                );
                
                const personalSnapshot = await getDocs(personalProjectsQuery);
                personalSnapshot.docs.forEach(projectDoc => {
                    userProjects.push({
                        id: projectDoc.id,
                        ...projectDoc.data(),
                        organizationName: null,
                        organizationId: null
                    });
                });
            } catch (error) {
                console.warn('Error fetching personal projects:', error);
                // Continue execution even if personal projects fail
            }
        }

        // Get organization projects (subcollection structure)
        if (isOrganizationAccount(userProfile)) {
            try {
                const orgsQuery = query(
                    collection(db, 'organizations'),
                    where('members', 'array-contains', userId)
                );
                
                const orgsSnapshot = await getDocs(orgsQuery);

                for (const orgDoc of orgsSnapshot.docs) {
                    const orgId = orgDoc.id;
                    const orgData = orgDoc.data();
                    
                    const projectsRef = collection(db, 'organizations', orgId, 'projects');
                    const projectsQuery = query(
                        projectsRef, 
                        where('members', 'array-contains', userId),
                        orderBy('createdAt', 'desc')
                    );
                    
                    const projectsSnapshot = await getDocs(projectsQuery);
                    
                    projectsSnapshot.docs.forEach(projectDoc => {
                        userProjects.push({
                            id: projectDoc.id,
                            ...projectDoc.data(),
                            organizationName: orgData.name,
                            organizationId: orgId
                        });
                    });
                }
            } catch (error) {
                console.warn('Error fetching organization projects:', error);
                // Continue execution even if org projects fail
            }
        }

        // Sort all projects by creation date
        return userProjects.sort((a, b) => {
            const aDate = a.createdAt?.toDate?.() || new Date(a.createdAt);
            const bDate = b.createdAt?.toDate?.() || new Date(b.createdAt);
            return bDate - aDate;
        });
    } catch (error) {
        console.error('Error fetching user projects:', error);
        throw error;
    }
};

/**
 * Get a specific project
 * Supports both flat structure and subcollection structure
 */
export const getProject = async (projectId, organizationId = null, userId = null) => {
    try {
        if (!projectId) {
            throw new ProjectValidationError('Project ID is required');
        }

        let projectRef;
        if (organizationId) {
            // Get from organization's subcollection
            projectRef = doc(db, 'organizations', organizationId, 'projects', projectId);
        } else {
            // Get from flat projects collection
            projectRef = doc(db, 'projects', projectId);
        }

        const projectDoc = await getDoc(projectRef);

        if (!projectDoc.exists()) {
            throw new ProjectValidationError('Project not found');
        }

        const projectData = {
            id: projectDoc.id,
            ...projectDoc.data()
        };

        // Validate permissions if userId is provided
        if (userId) {
            await validateProjectPermissions(userId, 'read', {
                projectId,
                organizationId,
                projectOwnerId: projectData.createdBy,
                isPublic: projectData.isPublic || false
            });
        }

        return projectData;
    } catch (error) {
        console.error('Error fetching project:', error);
        throw error;
    }
};

/**
 * Update project
 * Supports both flat structure and subcollection structure
 */
export const updateProject = async (projectId, updates, userId, organizationId = null) => {
    try {
        if (!projectId) {
            throw new ProjectValidationError('Project ID is required');
        }

        // Get existing project first to validate ownership
        const existingProject = await getProject(projectId, organizationId);

        // Validate permissions
        await validateProjectPermissions(userId, 'update', {
            projectId,
            organizationId,
            projectOwnerId: existingProject.createdBy,
            isPublic: existingProject.isPublic || false
        });

        let projectRef;
        if (organizationId) {
            projectRef = doc(db, 'organizations', organizationId, 'projects', projectId);
        } else {
            projectRef = doc(db, 'projects', projectId);
        }

        const updateData = {
            ...updates,
            updatedAt: serverTimestamp()
        };

        await updateDoc(projectRef, updateData);
        
        return {
            success: true,
            project: {
                id: projectId,
                ...existingProject,
                ...updateData
            }
        };
    } catch (error) {
        console.error('Error updating project:', error);
        
        if (error instanceof ProjectPermissionError || error instanceof ProjectValidationError) {
            return {
                success: false,
                error: error.message,
                code: error.code
            };
        }
        
        return {
            success: false,
            error: 'Failed to update project. Please try again.',
            code: 'UNKNOWN_ERROR'
        };
    }
};

/**
 * Delete project
 * Supports both flat structure and subcollection structure
 */
export const deleteProject = async (projectId, userId, organizationId = null) => {
    try {
        if (!projectId) {
            throw new ProjectValidationError('Project ID is required');
        }

        // Get existing project first to validate ownership
        const existingProject = await getProject(projectId, organizationId);

        // Validate permissions
        await validateProjectPermissions(userId, 'delete', {
            projectId,
            organizationId,
            projectOwnerId: existingProject.createdBy,
            isPublic: existingProject.isPublic || false
        });

        let projectRef;
        if (organizationId) {
            projectRef = doc(db, 'organizations', organizationId, 'projects', projectId);
            
            // Update organization's project count
            const orgRef = doc(db, 'organizations', organizationId);
            const orgDoc = await getDoc(orgRef);
            
            if (orgDoc.exists()) {
                const currentProjectCount = orgDoc.data().projectCount || 0;
                await updateDoc(orgRef, {
                    projectCount: Math.max(0, currentProjectCount - 1),
                    updatedAt: serverTimestamp()
                });
            }
        } else {
            projectRef = doc(db, 'projects', projectId);
        }

        await deleteDoc(projectRef);
        
        return {
            success: true,
            message: 'Project deleted successfully'
        };
    } catch (error) {
        console.error('Error deleting project:', error);
        
        if (error instanceof ProjectPermissionError || error instanceof ProjectValidationError) {
            return {
                success: false,
                error: error.message,
                code: error.code
            };
        }
        
        return {
            success: false,
            error: 'Failed to delete project. Please try again.',
            code: 'UNKNOWN_ERROR'
        };
    }
};

/**
 * Listen to project changes
 * Supports both flat structure and subcollection structure
 */
export const subscribeToProjects = (callback, organizationId = null, userId = null) => {
    try {
        if (!userId) {
            throw new ProjectValidationError('User ID is required for subscription');
        }

        let q;
        
        if (organizationId) {
            // Subscribe to organization projects
            const projectsRef = collection(db, 'organizations', organizationId, 'projects');
            q = query(projectsRef, orderBy('createdAt', 'desc'));
        } else {
            // Subscribe to personal projects
            q = query(
                collection(db, 'projects'),
                where('createdBy', '==', userId),
                where('organizationId', '==', null),
                orderBy('createdAt', 'desc')
            );
        }
        
        return onSnapshot(q, 
            (querySnapshot) => {
                const projects = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(projects);
            },
            (error) => {
                console.error('Error in project subscription:', error);
                callback([]); // Return empty array on error
            }
        );
    } catch (error) {
        console.error('Error subscribing to projects:', error);
        throw error;
    }
};

/**
 * Switch user's active project (NEW FUNCTIONALITY)
 * Note: This uses in-memory storage instead of localStorage for Claude.ai compatibility
 */
let currentProjectData = {};

export const switchProject = async (userId, projectId, organizationId = null) => {
    try {
        // Validate that user can access this project
        await getProject(projectId, organizationId, userId);

        const projectData = {
            organizationId,
            projectId,
            timestamp: new Date().toISOString()
        };

        // Store in memory instead of localStorage
        currentProjectData[userId] = projectData;

        // Update user's profile with last accessed project
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            lastAccessedProject: {
                organizationId,
                projectId,
                accessedAt: serverTimestamp()
            },
            updatedAt: serverTimestamp()
        });

        return {
            success: true,
            project: projectData
        };
    } catch (error) {
        console.error('Error switching project:', error);
        
        return {
            success: false,
            error: error.message || 'Failed to switch project'
        };
    }
};

/**
 * Get user's current project selection (NEW FUNCTIONALITY)
 */
export const getCurrentProject = (userId) => {
    try {
        return currentProjectData[userId] || null;
    } catch (error) {
        console.error('Error getting current project:', error);
        return null;
    }
};

// Export all functions in an object for backward compatibility
export const projectService = {
    createProject,
    checkProjectNameExists,
    getOrganizationProjects,
    getUserProjects,
    getProject,
    updateProject,
    deleteProject,
    subscribeToProjects,
    switchProject,
    getCurrentProject
};

// Default export for backward compatibility
export default projectService;