import { Navigate } from "react-router-dom";
import { useProject } from "../../context/ProjectContext";

const PrivateRoute = ({ children }) => {
    const { user, isLoading } = useProject();

    // Show loading while auth state is being determined
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    return user ? children : <Navigate to="/Login" replace />;
};

export default PrivateRoute;