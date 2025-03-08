import { AuthProvider } from "@/context/AuthProvider"; // Ensure correct import
import "@/styles/globals.css"; // Global styles

export default function App({ Component, pageProps }) {
    return (
        <AuthProvider>
            <Component {...pageProps} />
        </AuthProvider>
    );
}
