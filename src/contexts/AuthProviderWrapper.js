// AuthProviderWrapper.js
import dynamic from 'next/dynamic';

const AuthProvider = dynamic(() => import('./AuthProvider'), {
    ssr: false,
    loading: () => <div>Loading authentication...</div>
});

export default AuthProvider;