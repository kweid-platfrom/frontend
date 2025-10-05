// lib/googleDocsService.js - Server-side Google Docs API wrapper
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
            const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);

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

            console.log('Google Docs Service initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Google Docs Service:', error);
            throw new Error('Google Docs Service initialization failed');
        }
    }

    /**
     * Create a new Google Document
     * @param {string} title - Document title
     * @param {string} content - Initial content (optional)
     * @returns {Promise<{docId: string, url: string, title: string}>}
     */
    async createDocument(title, content = '') {
        this.initialize();

        try {
            // Create blank document
            const createResponse = await this.docs.documents.create({
                requestBody: { title }
            });

            const docId = createResponse.data.documentId;

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
     * Create document from template
     * @param {string} templateId - Template document ID
     * @param {string} title - New document title
     * @param {Object} replacements - Text replacements {placeholder: value}
     * @returns {Promise<Object>}
     */
    async createFromTemplate(templateId, title, replacements = {}) {
        this.initialize();

        try {
            // Copy the template
            const copyResponse = await this.drive.files.copy({
                fileId: templateId,
                requestBody: { name: title }
            });

            const newDocId = copyResponse.data.id;

            // Apply text replacements if provided
            if (Object.keys(replacements).length > 0) {
                const requests = Object.entries(replacements).map(([placeholder, value]) => ({
                    replaceAllText: {
                        containsText: {
                            text: `{{${placeholder}}}`,
                            matchCase: false
                        },
                        replaceText: value
                    }
                }));

                await this.docs.documents.batchUpdate({
                    documentId: newDocId,
                    requestBody: { requests }
                });
            }

            const url = `https://docs.google.com/document/d/${newDocId}/edit`;

            return {
                docId: newDocId,
                url,
                title,
                createdAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error creating document from template:', error);
            throw new Error(`Failed to create from template: ${error.message}`);
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