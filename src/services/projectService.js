// services/projectService.js
import { db } from '../config/firebase';
import { 
    collection, 
    addDoc, 
    query, 
    where, 
    getDocs, 
    serverTimestamp
} from 'firebase/firestore';
import { validateProjectName } from '../utils/onboardingUtils';

/**
 * Check if project name exists (case-insensitive)
 */
export const checkProjectNameExists = async (name, userId, organizationId = null) => {
    try {
        const validation = validateProjectName(name);
        if (!validation.isValid) {
            throw new Error(validation.errors[0]);
        }

        // Query projects with the same normalized name
        let q;
        if (organizationId) {
            q = query(
                collection(db, 'projects'),
                where('normalizedName', '==', validation.normalizedName),
                where('organizationId', '==', organizationId)
            );
        } else {
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
 */
export const createProject = async (projectData, userId, organizationId = null) => {
    try {
        const { name, description = '' } = projectData;
        
        // Validate project name
        const validation = validateProjectName(name);
        if (!validation.isValid) {
            throw new Error(validation.errors[0]);
        }

        // Check if name already exists
        const nameExists = await checkProjectNameExists(name, userId, organizationId);
        if (nameExists) {
            throw new Error('A project with this name already exists. Please choose a different name.');
        }

        const newProjectData = {
            name: name.trim(),
            normalizedName: validation.normalizedName,
            description: description.trim(),
            createdBy: userId,
            organizationId: organizationId || null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
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

        const docRef = await addDoc(collection(db, 'projects'), newProjectData);
        return {
            success: true,
            projectId: docRef.id,
            project: { id: docRef.id, ...newProjectData }
        };
    } catch (error) {
        console.error('Error creating project:', error);
        return {
            success: false,
            error: error.message
        };
    }
};