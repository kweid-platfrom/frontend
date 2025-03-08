import { Navigate } from "react-router-dom";
import { auth } from "../../config/firebase";

const PrivateRoute = ({ children }) => {
    return auth.currentUser ? children : <Navigate to="/Login" />;
};

export default PrivateRoute;