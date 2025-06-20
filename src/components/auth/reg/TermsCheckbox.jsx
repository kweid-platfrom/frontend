import Link from "next/link";

const TermsCheckbox = ({ checked, error, onChange }) => {
    return (
        <div className="space-y-2">
            <div className="flex items-start gap-3">
                <input
                    type="checkbox"
                    id="terms"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    className={`mt-1 h-4 w-4 rounded border-2 transition-colors ${
                        error
                            ? "border-red-300 text-red-600 focus:ring-red-500/20"
                            : "border-slate-300 text-teal-600 focus:ring-teal-500/20"
                    } focus:ring-2 focus:ring-offset-2`}
                />
                <label htmlFor="terms" className="text-sm text-slate-600 leading-relaxed">
                    I agree to the{" "}
                    <Link 
                        href="/terms" 
                        className="text-teal-600 font-medium hover:text-teal-700 hover:underline transition-colors"
                        target="_blank"
                    >
                        Terms and Conditions
                    </Link>
                    {" "}and{" "}
                    <Link 
                        href="/privacy" 
                        className="text-teal-600 font-medium hover:text-teal-700 hover:underline transition-colors"
                        target="_blank"
                    >
                        Privacy Policy
                    </Link>
                </label>
            </div>
            {error && (
                <p className="text-red-600 text-xs font-medium ml-7">
                    {error}
                </p>
            )}
        </div>
    );
};

export default TermsCheckbox;