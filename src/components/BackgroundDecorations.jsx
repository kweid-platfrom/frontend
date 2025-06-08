const BackgroundDecorations = () => {
    return (
        <>
            {/* Diagonal Zigzag Background Decoration */}
            <svg
                className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
            >
                <defs>
                    <linearGradient id="zigzagGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.3" />
                        <stop offset="50%" stopColor="#0891b2" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.1" />
                    </linearGradient>
                </defs>
                <path
                    d="M-10,10 L20,40 L50,10 L80,40 L110,10 L110,25 L80,55 L50,25 L20,55 L-10,25 Z"
                    fill="url(#zigzagGradient)"
                />
                <path
                    d="M-10,50 L20,80 L50,50 L80,80 L110,50 L110,65 L80,95 L50,65 L20,95 L-10,65 Z"
                    fill="url(#zigzagGradient)"
                />
            </svg>

            {/* Subtle Gradient Lines */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-teal-200/40 to-transparent transform rotate-12"></div>
                <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-200/30 to-transparent transform -rotate-12"></div>
            </div>

            {/* Minimal Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-0 w-px h-32 bg-gradient-to-b from-transparent via-teal-200/60 to-transparent"></div>
                <div className="absolute top-40 right-10 w-px h-24 bg-gradient-to-b from-transparent via-slate-200/50 to-transparent"></div>
                <div className="absolute bottom-32 left-20 w-16 h-px bg-gradient-to-r from-transparent via-teal-200/50 to-transparent"></div>
                <div className="absolute bottom-20 right-0 w-20 h-px bg-gradient-to-r from-transparent via-slate-200/40 to-transparent"></div>
                <div className="absolute top-1/3 left-1/4 w-px h-16 bg-gradient-to-b from-transparent via-slate-200/40 to-transparent transform rotate-45"></div>
                <div className="absolute top-2/3 right-1/4 w-12 h-px bg-gradient-to-r from-transparent via-teal-200/50 to-transparent transform rotate-45"></div>
            </div>
        </>
    );
};

export default BackgroundDecorations;