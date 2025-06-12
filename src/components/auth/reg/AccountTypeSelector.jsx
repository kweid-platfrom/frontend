import { Users, Building2 } from "lucide-react";

const AccountTypeSelector = ({ value, onChange }) => {
    const userTypes = [
        {
            id: "individual",
            label: "Individual",
            description: "Personal testing projects",
            icon: Users
        },
        {
            id: "organization",
            label: "Organization",
            description: "Team collaboration & enterprise features",
            icon: Building2
        }
    ];

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Account Type</h3>
                <p className="text-sm text-slate-600 mb-4">Choose the type that best describes your use case</p>
            </div>
            
            <div className="space-y-3">
                {userTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                        <button
                            key={type.id}
                            type="button"
                            onClick={() => onChange(type.id)}
                            className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                                value === type.id
                                    ? "border-teal-500 bg-teal-50/50 text-teal-700"
                                    : "border-slate-200 hover:border-slate-300 text-slate-600"
                            }`}
                        >
                            <div className="flex items-start space-x-3">
                                <Icon className="w-5 h-5 mt-0.5 shrink-0" />
                                <div className="flex-1">
                                    <div className="font-medium text-slate-900">
                                        {type.label}
                                    </div>
                                    <div className="text-sm text-slate-600 mt-1">
                                        {type.description}
                                    </div>
                                </div>
                                <div className={`w-4 h-4 rounded-full border-2 mt-1 ${
                                    value === type.id
                                        ? "border-teal-500 bg-teal-500"
                                        : "border-slate-300"
                                }`}>
                                    {value === type.id && (
                                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                                    )}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default AccountTypeSelector;