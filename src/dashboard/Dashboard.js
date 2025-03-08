import { useAuth } from "../context/AuthProvider";
import { useRouter } from "next/router";

const Dashboard = () => {
    const { user, logout } = useAuth();
    const router = useRouter();

    if (!user) {
        return <p>Loading...</p>;
    }

    return (
        <div>
            <h2>Welcome, {user.email}</h2>
            <button onClick={() => { logout(); router.push("/login"); }}>Logout</button>
        </div>
    );
};

export default Dashboard;
