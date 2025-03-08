import { AuthProvider } from "../context/AuthProvider";
import "../app/globals.css";

export default function App({ Component, pageProps }) {
    return (
        <AuthProvider>
            <Component {...pageProps} />
        </AuthProvider>
    );
}
