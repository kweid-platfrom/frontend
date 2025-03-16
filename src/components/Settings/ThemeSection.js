import React from 'react';

const ThemeSection = ({ theme, onThemeChange }) => {
    const themes = [
        { id: 'light', name: 'Light', colorClass: 'bg-white', textClass: 'text-gray-800' },
        { id: 'dark', name: 'Dark', colorClass: 'bg-gray-800', textClass: 'text-white' },
        { id: 'teal', name: 'Teal', colorClass: 'bg-teal-600', textClass: 'text-white' },
        { id: 'purple', name: 'Purple', colorClass: 'bg-purple-600', textClass: 'text-white' }
    ];

    return (
        <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Theme Preferences</h2>
            <p className="text-gray-600 mb-6">
                Choose a theme that suits your style and improves your productivity.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {themes.map((themeOption) => (
                    <div
                        key={themeOption.id}
                        className={`
              p-4 rounded-lg border-2 cursor-pointer transition-all
              ${theme === themeOption.id ? 'border-[#00897b]' : 'border-gray-200'}
              ${themeOption.colorClass}
            `}
                        onClick={() => onThemeChange(themeOption.id)}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className={`font-medium ${themeOption.textClass}`}>{themeOption.name}</span>
                            {theme === themeOption.id && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={themeOption.textClass}>
                                    <path d="M20 6L9 17l-5-5"></path>
                                </svg>
                            )}
                        </div>
                        <div className="h-20 flex items-center justify-center">
                            <div className={`h-16 w-16 rounded-full ${themeOption.colorClass === 'bg-white' ? 'bg-gray-100' : 'bg-opacity-50'} ${themeOption.textClass}`}>
                                <div className="h-full w-full flex items-center justify-center">
                                    <span className="text-xs">Preview</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8">
                <h3 className="text-lg font-medium mb-3">Font Size</h3>
                <div className="flex items-center">
                    <span className="text-gray-600 text-sm mr-2">A</span>
                    <input
                        type="range"
                        min="12"
                        max="20"
                        defaultValue="16"
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-gray-600 text-base ml-2">A</span>
                </div>
            </div>
        </div>
    );
};

export default ThemeSection;