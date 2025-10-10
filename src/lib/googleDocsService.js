// lib/googleDocsService.js - Server-side Google Docs API wrapper with folder management
import { google } from 'googleapis';

class GoogleDocsService {
    constructor() {
        this.auth = null;
        this.docs = null;
        this.drive = null;
        this.initialized = false;
    }

    /**
     * Initialize Google API clients with service account
     */
    initialize() {
        if (this.initialized) return;

        try {
            let credentials;

            // Try Base64 encoded service account first (RECOMMENDED)
            if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
                console.log('Using FIREBASE_SERVICE_ACCOUNT_BASE64 for Google API');
                const serviceAccountJson = Buffer.from(
                    process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 
                    'base64'
                ).toString('utf8');
                credentials = JSON.parse(serviceAccountJson);
            }
            // Try SERVICE_ACCOUNT_KEY (legacy)
            else if (process.env.SERVICE_ACCOUNT_KEY) {
                console.log('Using SERVICE_ACCOUNT_KEY for Google API');
                credentials = JSON.parse(process.env.SERVICE_ACCOUNT_KEY);
            }
            // Try FIREBASE_SERVICE_ACCOUNT_KEY
            else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
                console.log('Using FIREBASE_SERVICE_ACCOUNT_KEY for Google API');
                let serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
                
                // Remove outer quotes if present
                serviceAccountString = serviceAccountString.trim();
                if (serviceAccountString.startsWith('"') && serviceAccountString.endsWith('"')) {
                    serviceAccountString = serviceAccountString.slice(1, -1);
                }
                if (serviceAccountString.startsWith("'") && serviceAccountString.endsWith("'")) {
                    serviceAccountString = serviceAccountString.slice(1, -1);
                }
                
                // Fix escaped characters
                serviceAccountString = serviceAccountString
                    .replace(/\\n/g, '\n')
                    .replace(/\\"/g, '"')
                    .replace(/\\'/g, "'")
                    .replace(/\\\\/g, '\\');
                
                credentials = JSON.parse(serviceAccountString);
            }
            // Try individual environment variables
            else if (process.env.FIREBASE_PRIVATE_KEY) {
                console.log('Using individual Firebase env vars for Google API');
                credentials = {
                    type: 'service_account',
                    project_id: process.env.FIREBASE_PROJECT_ID,
                    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                    client_email: process.env.FIREBASE_CLIENT_EMAIL,
                };
            }
            else {
                throw new Error('No service account credentials found. Set FIREBASE_SERVICE_ACCOUNT_BASE64, SERVICE_ACCOUNT_KEY, FIREBASE_SERVICE_ACCOUNT_KEY, or individual Firebase env vars.');
            }

            this.auth = new google.auth.GoogleAuth({
                credentials,
                scopes: [
                    'https://www.googleapis.com/auth/documents',
                    'https://www.googleapis.com/auth/drive',
                    'https://www.googleapis.com/auth/drive.file'
                ]
            });

            this.docs = google.docs({ version: 'v1', auth: this.auth });
            this.drive = google.drive({ version: 'v3', auth: this.auth });
            this.initialized = true;
            
            console.log('✅ Google Docs Service initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Google Docs Service:', error.message);
            console.error('Error details:', error);
            throw new Error(`Google Docs Service initialization failed: ${error.message}`);
        }
    }

    /**
     * Get or create a folder in Google Drive
     * @param {string} folderName - Name of the folder
     * @param {string} parentFolderId - Parent folder ID (optional)
     * @returns {Promise<string>} - Folder ID
     */
    async getOrCreateFolder(folderName, parentFolderId = null) {
        this.initialize();

        try {
            // Search for existing folder
            const query = parentFolderId 
                ? `name='${folderName}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
                : `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

            const searchResponse = await this.drive.files.list({
                q: query,
                fields: 'files(id, name)',
                spaces: 'drive'
            });

            if (searchResponse.data.files && searchResponse.data.files.length > 0) {
                return searchResponse.data.files[0].id;
            }

            // Create new folder if not found
            const folderMetadata = {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
                ...(parentFolderId && { parents: [parentFolderId] })
            };

            const folderResponse = await this.drive.files.create({
                requestBody: folderMetadata,
                fields: 'id'
            });

            return folderResponse.data.id;
        } catch (error) {
            console.error('Error getting/creating folder:', error);
            throw new Error(`Failed to get/create folder: ${error.message}`);
        }
    }

    /**
     * Move a file to a specific folder
     * @param {string} fileId - File ID to move
     * @param {string} folderId - Target folder ID
     * @returns {Promise<void>}
     */
    async moveToFolder(fileId, folderId) {
        this.initialize();

        try {
            // Get current parents
            const file = await this.drive.files.get({
                fileId: fileId,
                fields: 'parents'
            });

            const previousParents = file.data.parents ? file.data.parents.join(',') : '';

            // Move the file
            await this.drive.files.update({
                fileId: fileId,
                addParents: folderId,
                removeParents: previousParents,
                fields: 'id, parents'
            });
        } catch (error) {
            console.error('Error moving file to folder:', error);
            throw new Error(`Failed to move file to folder: ${error.message}`);
        }
    }

    /**
     * Create a new Google Document
     * @param {string} title - Document title
     * @param {string} content - Initial content (optional)
     * @param {string} parentFolderId - Parent folder ID (optional)
     * @returns {Promise<{docId: string, url: string, title: string}>}
     */
    async createDocument(title, content = '', parentFolderId = null) {
        this.initialize();

        try {
            console.log('🔍 createDocument called with:');
            console.log('   - title:', title);
            console.log('   - parentFolderId:', parentFolderId);
            console.log('   - GOOGLE_DRIVE_ROOT_FOLDER_ID env:', process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID);
            
            
            // If we have a parent folder, create via Drive API
            let docId;
            if (parentFolderId) {
                console.log('✅ Creating document IN FOLDER:', parentFolderId);
                const driveResponse = await this.drive.files.create({
                    requestBody: {
                        name: title,
                        mimeType: 'application/vnd.google-apps.document',
                        parents: [parentFolderId]
                    },
                    fields: 'id'
                });
                docId = driveResponse.data.id;
            } else {
                // Fallback to Docs API (may fail without proper permissions)
                const createResponse = await this.docs.documents.create({
                    requestBody: { title }
                });
                docId = createResponse.data.documentId;
            }

            // Insert content if provided
            if (content && content.trim()) {
                await this.docs.documents.batchUpdate({
                    documentId: docId,
                    requestBody: {
                        requests: [
                            {
                                insertText: {
                                    location: { index: 1 },
                                    text: content
                                }
                            }
                        ]
                    }
                });
            }

            const url = `https://docs.google.com/document/d/${docId}/edit`;

            return {
                docId,
                url,
                title,
                createdAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error creating Google Doc:', error);
            throw new Error(`Failed to create document: ${error.message}`);
        }
    }

    /**
     * Update document content
     * @param {string} docId - Google Docs document ID
     * @param {string} content - New content to replace existing
     * @returns {Promise<{success: boolean, docId: string}>}
     */
    async updateDocument(docId, content) {
        this.initialize();

        try {
            // Get current document to find end index
            const doc = await this.docs.documents.get({ documentId: docId });
            const endIndex = doc.data.body.content[doc.data.body.content.length - 1].endIndex;

            // Replace all content
            await this.docs.documents.batchUpdate({
                documentId: docId,
                requestBody: {
                    requests: [
                        {
                            deleteContentRange: {
                                range: {
                                    startIndex: 1,
                                    endIndex: endIndex - 1
                                }
                            }
                        },
                        {
                            insertText: {
                                location: { index: 1 },
                                text: content
                            }
                        }
                    ]
                }
            });

            return {
                success: true,
                docId,
                updatedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error updating Google Doc:', error);
            throw new Error(`Failed to update document: ${error.message}`);
        }
    }

    /**
     * Get document metadata and content
     * @param {string} docId - Google Docs document ID
     * @returns {Promise<Object>}
     */
    async getDocument(docId) {
        this.initialize();

        try {
            const response = await this.docs.documents.get({ documentId: docId });

            // Extract text content
            let content = '';
            if (response.data.body && response.data.body.content) {
                response.data.body.content.forEach(element => {
                    if (element.paragraph) {
                        element.paragraph.elements.forEach(elem => {
                            if (elem.textRun) {
                                content += elem.textRun.content;
                            }
                        });
                    }
                });
            }

            return {
                docId: response.data.documentId,
                title: response.data.title,
                content: content.trim(),
                revisionId: response.data.revisionId,
                url: `https://docs.google.com/document/d/${docId}/edit`
            };
        } catch (error) {
            console.error('Error getting Google Doc:', error);
            throw new Error(`Failed to get document: ${error.message}`);
        }
    }

    /**
     * Delete (trash) a document
     * @param {string} docId - Google Docs document ID
     * @returns {Promise<{success: boolean, docId: string}>}
     */
    async deleteDocument(docId) {
        this.initialize();

        try {
            await this.drive.files.update({
                fileId: docId,
                requestBody: { trashed: true }
            });

            return {
                success: true,
                docId,
                deletedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error deleting Google Doc:', error);
            throw new Error(`Failed to delete document: ${error.message}`);
        }
    }

    /**
     * Share document with users
     * @param {string} docId - Google Docs document ID
     * @param {string[]} emails - Array of email addresses
     * @param {string} role - Permission role: 'reader', 'writer', 'commenter'
     * @returns {Promise<Object>}
     */
    async shareDocument(docId, emails, role = 'reader') {
        this.initialize();

        try {
            const permissions = [];

            for (const email of emails) {
                const permission = await this.drive.permissions.create({
                    fileId: docId,
                    requestBody: {
                        type: 'user',
                        role: role,
                        emailAddress: email
                    },
                    sendNotificationEmail: true
                });

                permissions.push({
                    email,
                    role,
                    permissionId: permission.data.id
                });
            }

            return {
                success: true,
                docId,
                permissions,
                sharedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error sharing Google Doc:', error);
            throw new Error(`Failed to share document: ${error.message}`);
        }
    }

    /**
     * List all documents (filtered by query)
     * @param {Object} options - Query options
     * @returns {Promise<Array>}
     */
    async listDocuments(options = {}) {
        this.initialize();

        try {
            const query = options.query || "mimeType='application/vnd.google-apps.document' and trashed=false";

            const response = await this.drive.files.list({
                q: query,
                fields: 'files(id, name, createdTime, modifiedTime, webViewLink, owners)',
                orderBy: options.orderBy || 'modifiedTime desc',
                pageSize: options.pageSize || 100
            });

            return response.data.files || [];
        } catch (error) {
            console.error('Error listing Google Docs:', error);
            throw new Error(`Failed to list documents: ${error.message}`);
        }
    }

    /**
     * Export document in different formats
     * @param {string} docId - Google Docs document ID
     * @param {string} mimeType - Export format (application/pdf, text/plain, etc.)
     * @returns {Promise<Buffer>}
     */
    async exportDocument(docId, mimeType = 'application/pdf') {
        this.initialize();

        try {
            const response = await this.drive.files.export({
                fileId: docId,
                mimeType: mimeType
            }, {
                responseType: 'arraybuffer'
            });

            return Buffer.from(response.data);
        } catch (error) {
            console.error('Error exporting Google Doc:', error);
            throw new Error(`Failed to export document: ${error.message}`);
        }
    }

    /**
     * Get document permissions
     * @param {string} docId - Google Docs document ID
     * @returns {Promise<Array>}
     */
    async getPermissions(docId) {
        this.initialize();

        try {
            const response = await this.drive.permissions.list({
                fileId: docId,
                fields: 'permissions(id, type, role, emailAddress, displayName)'
            });

            return response.data.permissions || [];
        } catch (error) {
            console.error('Error getting document permissions:', error);
            throw new Error(`Failed to get permissions: ${error.message}`);
        }
    }

    /**
     * Remove document permission
     * @param {string} docId - Google Docs document ID
     * @param {string} permissionId - Permission ID to remove
     * @returns {Promise<{success: boolean}>}
     */
    async removePermission(docId, permissionId) {
        this.initialize();

        try {
            await this.drive.permissions.delete({
                fileId: docId,
                permissionId: permissionId
            });

            return {
                success: true,
                docId,
                permissionId,
                removedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error removing permission:', error);
            throw new Error(`Failed to remove permission: ${error.message}`);
        }
    }
}

// Export singleton instance
const googleDocsService = new GoogleDocsService();
export default googleDocsService;