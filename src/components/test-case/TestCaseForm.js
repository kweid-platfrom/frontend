import React, { useState } from 'react';

const TestCaseForm = ({ testCase, onSave, onCancel }) => {
    const initialState = testCase || {
        title: '',
        description: '',
        priority: 'Medium',
        module: '',
        status: 'Draft',
        createdBy: 'John Doe',
        steps: []
    };

    const [formData, setFormData] = useState(initialState);
    const [newStep, setNewStep] = useState({ description: '', expectedResult: '' });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleStepChange = (index, field, value) => {
        const updatedSteps = [...formData.steps];
        updatedSteps[index][field] = value;
        setFormData({ ...formData, steps: updatedSteps });
    };

    const handleAddStep = () => {
        if (newStep.description && newStep.expectedResult) {
            setFormData({
                ...formData,
                steps: [...formData.steps, { ...newStep, id: formData.steps.length + 1 }]
            });
            setNewStep({ description: '', expectedResult: '' });
        }
    };

    const handleRemoveStep = (index) => {
        const updatedSteps = formData.steps.filter((_, i) => i !== index);
        setFormData({ ...formData, steps: updatedSteps });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
            <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
                <div className="sticky top-0 bg-white px-8 py-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">
                        {testCase ? 'Edit Test Case' : 'Create New Test Case'}
                    </h2>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-500"
                    >
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-[#00897B] focus:border-[#00897c]"
                                />
                            </div>

                            <div>
                                <label htmlFor="module" className="block text-sm font-medium text-gray-700">Module</label>
                                <input
                                    type="text"
                                    id="module"
                                    name="module"
                                    value={formData.module}
                                    onChange={handleChange}
                                    required
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00897B] focus:border-[#00897B]"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00897B] focus:border-[#00897B]"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
                                <select
                                    id="priority"
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-[#00897B] focus:border-[#00897B]"
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                                <select
                                    id="status"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-[#00897B] focus:border-[#00897B]"
                                >
                                    <option value="Draft">Draft</option>
                                    <option value="Active">Active</option>
                                    <option value="Deprecated">Deprecated</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-medium text-gray-900">Test Steps</h3>
                            <div className="mt-4 space-y-4">
                                {formData.steps.map((step, index) => (
                                    <div key={index} className="flex flex-col md:flex-row gap-4 p-4 border border-gray-200 rounded-md">
                                        <div className="flex-grow">
                                            <label className="block text-sm font-medium text-gray-700">Step {index + 1}</label>
                                            <input
                                                type="text"
                                                value={step.description}
                                                onChange={(e) => handleStepChange(index, 'description', e.target.value)}
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-[#00897B]focus:border-[#00897B]"
                                                placeholder="Step description"
                                            />
                                        </div>
                                        <div className="flex-grow">
                                            <label className="block text-sm font-medium text-gray-700">Expected Result</label>
                                            <input
                                                type="text"
                                                value={step.expectedResult}
                                                onChange={(e) => handleStepChange(index, 'expectedResult', e.target.value)}
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-[#00897B] focus:border-[#00897B]"
                                                placeholder="Expected result"
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveStep(index)}
                                                className="px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <div className="flex flex-col md:flex-row gap-4 p-4 border border-dashed border-gray-300 rounded-md">
                                    <div className="flex-grow">
                                        <label className="block text-sm font-medium text-gray-700">New Step</label>
                                        <input
                                            type="text"
                                            value={newStep.description}
                                            onChange={(e) => setNewStep({ ...newStep, description: e.target.value })}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-[#00897B] focus:border-[#00897B]"
                                            placeholder="Step description"
                                        />
                                    </div>
                                    <div className="flex-grow">
                                        <label className="block text-sm font-medium text-gray-700">Expected Result</label>
                                        <input
                                            type="text"
                                            value={newStep.expectedResult}
                                            onChange={(e) => setNewStep({ ...newStep, expectedResult: e.target.value })}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-[#00897B] focus:border-[#00897B]"
                                            placeholder="Expected result"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <button
                                            type="button"
                                            onClick={handleAddStep}
                                            className="px-3 py-2 bg-green-100 text-green-600 rounded hover:bg-green-200"
                                        >
                                            Add Step
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 mr-4 border border-gray-300 rounded shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-[#00897B] hover:bg-[#00897C]"
                        >
                            {testCase ? 'Update Test Case' : 'Create Test Case'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TestCaseForm;