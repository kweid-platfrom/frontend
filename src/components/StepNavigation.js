// components/StepNavigation.jsx
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const StepNavigation = ({ currentStep, totalSteps, onNext, onPrev, canProceed = true }) => {
    if (currentStep >= totalSteps) return null;

    return (
        <div className="flex gap-3 pt-4">
            {currentStep > 1 && (
                <button
                    type="button"
                    onClick={onPrev}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded px-6 py-2 transition-all duration-200 flex justify-center items-center gap-2"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                </button>
            )}

            <button
                type="button"
                onClick={onNext}
                disabled={!canProceed}
                className={`flex-1 font-semibold rounded px-6 py-2 transition-all duration-200 flex justify-center items-center gap-2 shadow-md hover:-translate-y-0.5 ${
                    canProceed 
                        ? "bg-[#00897B] hover:bg-[#00796B] text-white" 
                        : "bg-slate-300 text-slate-500 cursor-not-allowed"
                }`}
            >
                Next
                <ChevronRight className="h-4 w-4" />
            </button>
        </div>
    );
};