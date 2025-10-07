// services/CommentsService.js - Manage document comments in Firestore
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  doc,
  getFirestore
} from 'firebase/firestore';
import { auth } from '@/config/firebase';

export class CommentsService {
  constructor(testSuiteService) {
    this.testSuiteService = testSuiteService;
    this.db = getFirestore();
  }

  getCurrentUserId() {
    return auth.currentUser?.uid || null;
  }

  /**
   * Get comments collection path
   */
  getCommentsPath(suiteId, documentId, sprintId = null) {
    if (sprintId) {
      return `testSuites/${suiteId}/sprints/${sprintId}/documents/${documentId}/comments`;
    }
    return `testSuites/${suiteId}/documents/${documentId}/comments`;
  }

  /**
   * Add a comment to a document
   */
  async addComment(suiteId, documentId, commentData, sprintId = null) {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return { success: false, error: { message: 'User not authenticated' } };
    }

    const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'read');
    if (!hasAccess) {
      return { success: false, error: { message: 'Insufficient permissions' } };
    }

    try {
      const commentsPath = this.getCommentsPath(suiteId, documentId, sprintId);
      
      const comment = {
        text: commentData.text,
        userId,
        userName: commentData.userName || 'Anonymous',
        userAvatar: commentData.userAvatar || null,
        documentId,
        timestamp: serverTimestamp(),
        parentId: commentData.parentId || null, // For threaded replies
        
        // Optional: For text-specific comments
        textSelection: commentData.textSelection || null,
        
        // Metadata
        edited: false,
        editedAt: null
      };

      const docRef = await addDoc(collection(this.db, commentsPath), comment);

      return {
        success: true,
        data: {
          id: docRef.id,
          ...comment,
          timestamp: new Date() // Return Date object for immediate UI use
        }
      };

    } catch (error) {
      console.error('Error adding comment:', error);
      return {
        success: false,
        error: {
          message: `Failed to add comment: ${error.message}`,
          code: error.code
        }
      };
    }
  }

  /**
   * Delete a comment
   */
  async deleteComment(suiteId, documentId, commentId, sprintId = null) {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return { success: false, error: { message: 'User not authenticated' } };
    }

    try {
      const commentsPath = this.getCommentsPath(suiteId, documentId, sprintId);
      await deleteDoc(doc(this.db, commentsPath, commentId));

      return { success: true };

    } catch (error) {
      console.error('Error deleting comment:', error);
      return {
        success: false,
        error: {
          message: `Failed to delete comment: ${error.message}`,
          code: error.code
        }
      };
    }
  }

  /**
   * Subscribe to real-time comments
   */
  subscribeToComments(suiteId, documentId, callback, errorCallback = null, sprintId = null) {
    const commentsPath = this.getCommentsPath(suiteId, documentId, sprintId);
    
    const q = query(
      collection(this.db, commentsPath),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const comments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        }));
        callback(comments);
      },
      (error) => {
        console.error('Error subscribing to comments:', error);
        if (errorCallback) {
          errorCallback(error);
        }
      }
    );

    return unsubscribe;
  }

  /**
   * Get comment count for a document
   */
  async getCommentCount(suiteId, documentId, sprintId = null) {
    try {
      const commentsPath = this.getCommentsPath(suiteId, documentId, sprintId);
      const result = await this.queryDocuments(commentsPath, []);
      
      return {
        success: true,
        data: { count: result.data?.length || 0 }
      };

    } catch (error) {
      console.error('Error getting comment count:', error);
      return {
        success: false,
        error: {
          message: `Failed to get comment count: ${error.message}`
        }
      };
    }
  }
}

export default CommentsService;