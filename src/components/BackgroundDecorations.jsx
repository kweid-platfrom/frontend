import React, { useState, useEffect } from 'react';

const BackgroundDecorations = () => {
    const [bubbles, setBubbles] = useState([]);

    useEffect(() => {
        // Generate random bubbles
        const generateBubbles = () => {
            const newBubbles = [];
            for (let i = 0; i < 25; i++) {
                newBubbles.push({
                    id: i,
                    size: Math.random() * 120 + 20, // 20-140px
                    x: Math.random() * 100, // 0-100%
                    y: Math.random() * 100, // 0-100%
                    opacity: Math.random() * 0.4 + 0.1, // 0.1-0.5
                    animationDelay: Math.random() * 20, // 0-20s
                    animationDuration: Math.random() * 15 + 10, // 10-25s
                    color: Math.random() > 0.5 ? 'teal' : 'cyan'
                });
            }
            setBubbles(newBubbles);
        };

        generateBubbles();
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Gradient Background using theme colors */}
            <div className="absolute inset-0 bg-gradient-to-br from-muted/30 via-teal-50/20 to-teal-100/30"></div>

            {/* Floating Bubbles using theme colors */}
            {bubbles.map((bubble) => (
                <div
                    key={bubble.id}
                    className={`absolute rounded-full ${bubble.color === 'teal'
                        ? 'bg-gradient-to-br from-teal-100/30 to-teal-300/20 border border-teal-300/40'
                        : 'bg-gradient-to-br from-teal-50/30 to-teal-300/20 border border-teal-300/40'
                        } backdrop-blur-sm`}
                    style={{
                        width: `${bubble.size}px`,
                        height: `${bubble.size}px`,
                        left: `${bubble.x}%`,
                        top: `${bubble.y}%`,
                        opacity: bubble.opacity,
                        animation: `float ${bubble.animationDuration}s ease-in-out infinite`,
                        animationDelay: `${bubble.animationDelay}s`,
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    {/* Inner glow effect using theme colors */}
                    <div
                        className={`absolute inset-2 rounded-full ${bubble.color === 'teal'
                            ? 'bg-gradient-to-br from-teal-50/50 to-transparent'
                            : 'bg-gradient-to-br from-teal-50/50 to-transparent'
                            }`}
                    ></div>

                    {/* Shine effect using theme-aware white */}
                    <div
                        className="absolute top-2 left-2 w-1/3 h-1/3 rounded-full bg-background/40"
                        style={{ filter: 'blur(2px)' }}
                    ></div>
                </div>
            ))}

            {/* Animated Gradient Waves using theme colors */}
            <div className="absolute inset-0">
                <div
                    className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-teal-50/20 to-transparent"
                    style={{
                        animation: 'wave 12s ease-in-out infinite',
                        clipPath: 'polygon(0 100%, 100% 100%, 100% 70%, 80% 60%, 60% 70%, 40% 60%, 20% 70%, 0 60%)'
                    }}
                ></div>

                <div
                    className="absolute bottom-0 left-0 w-full h-1/4 bg-gradient-to-t from-teal-100/15 to-transparent"
                    style={{
                        animation: 'wave 8s ease-in-out infinite reverse',
                        animationDelay: '2s',
                        clipPath: 'polygon(0 100%, 100% 100%, 100% 80%, 90% 70%, 70% 80%, 50% 70%, 30% 80%, 10% 70%, 0 80%)'
                    }}
                ></div>
            </div>

            {/* Subtle Particle Effects using theme colors */}
            <div className="absolute inset-0">
                {[...Array(15)].map((_, i) => (
                    <div
                        key={`particle-${i}`}
                        className="absolute w-1 h-1 bg-teal-300/60 rounded-full"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animation: `sparkle 4s ease-in-out infinite`,
                            animationDelay: `${Math.random() * 4}s`
                        }}
                    ></div>
                ))}
            </div>

            {/* CSS Animations */}
            <style jsx>{`
        @keyframes float {
          0%, 100% { 
            transform: translate(-50%, -50%) translateY(0px) scale(1);
          }
          25% { 
            transform: translate(-50%, -50%) translateY(-20px) scale(1.05);
          }
          50% { 
            transform: translate(-50%, -50%) translateY(-10px) scale(0.95);
          }
          75% { 
            transform: translate(-50%, -50%) translateY(-30px) scale(1.02);
          }
        }
        
        @keyframes wave {
          0%, 100% {
            clip-path: polygon(0 100%, 100% 100%, 100% 70%, 80% 60%, 60% 70%, 40% 60%, 20% 70%, 0 60%);
          }
          50% {
            clip-path: polygon(0 100%, 100% 100%, 100% 60%, 80% 70%, 60% 60%, 40% 70%, 20% 60%, 0 70%);
          }
        }
        
        @keyframes sparkle {
          0%, 100% { 
            opacity: 0;
            transform: scale(0);
          }
          50% { 
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
        </div>
    );
};

export default BackgroundDecorations;