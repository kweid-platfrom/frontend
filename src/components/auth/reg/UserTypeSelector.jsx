import { Users, Building2 } from "lucide-react";

const UserTypeSelector = ({ value, onChange }) => {
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
        <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 block">
                Account Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {userTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                        <button
                            key={type.id}
                            type="button"
                            onClick={() => onChange(type.id)}
                            className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                                value === type.id
                                    ? "border-teal-500 bg-teal-50/50 text-teal-700"
                                    : "border-slate-200 hover:border-slate-300 text-slate-600"
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <Icon className={`h-5 w-5 mt-0.5 ${
                                    value === type.id ? "text-teal-600" : "text-slate-400"
                                }`} />
                                <div className="flex-1">
                                    <div className={`font-medium text-sm ${
                                        value === type.id ? "text-teal-700" : "text-slate-700"
                                    }`}>
                                        {type.label}
                                    </div>
                                    <div className={`text-xs mt-1 ${
                                        value === type.id ? "text-teal-600" : "text-slate-500"
                                    }`}>
                                        {type.description}
                                    </div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default UserTypeSelector;