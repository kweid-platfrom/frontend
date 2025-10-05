// lib/firebaseAuthMiddleware.js - Verify Firebase tokens in API routes
import admin from './firebaseAdmin';

/**
 * Verify Firebase ID token from request headers
 * @param {Request} request - Next.js request object
 * @returns {Promise<{user: Object, error: null} | {user: null, error: string}>}
 */
export async function verifyFirebaseAuth(request) {
    try {
        // Get authorization header
        const authHeader = request.headers.get('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return { user: null, error: 'No authorization token provided' };
        }

        // Extract token
        const token = authHeader.split('Bearer ')[1];

        // Verify the token with Firebase Admin
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        return { 
            user: {
                uid: decodedToken.uid,
                email: decodedToken.email,
                name: decodedToken.name,
                picture: decodedToken.picture
            }, 
            error: null 
        };
    } catch (error) {
        console.error('Firebase auth verification error:', error);
        return { user: null, error: 'Invalid or expired token' };
    }
}

/**
 * Wrapper for API routes that require authentication
 * @param {Function} handler - The API route handler function
 * @returns {Function} Wrapped handler with authentication
 */
export function withAuth(handler) {
    return async (request, context) => {
        const { user, error } = await verifyFirebaseAuth(request);

        if (error || !user) {
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    error: { message: error || 'Authentication required' } 
                }),
                { 
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Add user to context for the handler
        const enhancedContext = { ...context, user };
        
        return handler(request, enhancedContext);
    };
}