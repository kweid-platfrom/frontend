import Link from "next/link";

const Navbar = () => {
    return (
        <nav className="bg-green-700 text-white p-4 flex justify-between">
            <div className="text-xl font-bold">LOGO</div>
            <div className="space-x-4">
                <Link href="/login" className="hover:underline">Login</Link>
                <Link href="/register" className="hover:underline">Register</Link>
                <Link href="/dashboard" className="hover:underline">Dashboard</Link>
            </div>
        </nav>
    );
};

export default Navbar;
