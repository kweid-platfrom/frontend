const FormInput = ({ 
    label, 
    type = "text", 
    placeholder, 
    value, 
    error, 
    helperText,
    onChange 
}) => {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 block">
                {label}
            </label>
            <input
                className={`w-full px-4 py-2.5 border rounded text-slate-900 placeholder-slate-400 transition-all duration-200 ${
                    error
                        ? "border-red-300 focus:border-red-500 focus:bg-red-50/50"
                        : "border-slate-200 focus:border-teal-500 focus:bg-white"
                } focus:outline-none focus:ring focus:ring-teal-500/10`}
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
            {error && (
                <p className="text-red-600 text-xs font-medium">
                    {error}
                </p>
            )}
            {helperText && !error && (
                <p className="text-slate-500 text-xs">
                    {helperText}
                </p>
            )}
        </div>
    );
};

export default FormInput;