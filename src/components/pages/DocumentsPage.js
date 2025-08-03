/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppProvider';
import { useUI } from '@/hooks/useUI';
import { List, Grid } from 'lucide-react';

export default function DocumentsPage() {
    const { state } = useApp(); // Keep state for potential other uses
    const { toggleSidebar, sidebarOpen, addNotification } = useUI();
    const router = useRouter();
    const [viewMode, setViewMode] = useState('list'); // Default to list view
    const [documents] = useState([
        // Sample document data (replace with actual data from context or API)
        { id: 'doc1', title: 'Project Plan', createdAt: '2025-07-30', createdBy: 'User A' },
        { id: 'doc2', title: 'Requirements Spec', createdAt: '2025-07-29', createdBy: 'User B' },
    ]);
    const handleCreateDocument = () => {
        console.log('Create Document button clicked, navigating to /documents/create');
        router.push('/documents/create');
    };

    const handleDocumentClick = (docId) => {
        console.log(`Navigating to document: ${docId}`);
        router.push(`/documents/${docId}`);
    };

    const toggleViewMode = () => {
        setViewMode(prevMode => prevMode === 'list' ? 'grid' : 'list');
    };

    return (
        <div className="min-h-screen">
            <div className="max-w-full mx-auto py-6 sm:px-6 lg:px-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div className="flex items-center">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Project Documents</h1>
                        <span className="ml-2 px-2 py-1 bg-gray-200 rounded-full text-xs font-normal">
                            {documents.length} {documents.length === 1 ? 'document' : 'documents'}
                        </span>
                    </div>
                    <div className="flex items-center space-x-2 overflow-x-auto">
                        <button
                            onClick={toggleViewMode}
                            className="inline-flex items-center px-3 py-3 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 whitespace-nowrap transition-colors"
                        >
                            {viewMode === 'list' ? (
                                <>
                                    <Grid className="mr-2 h-4 w-4" />
                                    Grid View
                                </>
                            ) : (
                                <>
                                    <List className="mr-2 h-4 w-4" />
                                    List View
                                </>
                            )}
                        </button>
                        <button
                            onClick={toggleSidebar}
                            className="lg:hidden inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 whitespace-nowrap"
                        >
                            {sidebarOpen ? 'Close' : 'Open'} Sidebar
                        </button>
                        <button
                            onClick={handleCreateDocument}
                            className="inline-flex items-center px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white text-sm leading-4 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 whitespace-nowrap transition-colors"
                            type="button"
                        >
                            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            New
                        </button>
                    </div>
                </div>

                <div className="bg-white shadow rounded-lg p-6">
                    {documents.length === 0 ? (
                        <div className="text-center py-12">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
                            <p className="mt-1 text-sm text-gray-500">Get started by creating a new document.</p>
                            <div className="mt-6">
                                <button
                                    onClick={handleCreateDocument}
                                    className="inline-flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                                >
                                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Create your first document
                                </button>
                            </div>
                        </div>
                    ) : viewMode === 'list' ? (
                        <div className="space-y-2">
                            {documents.map((doc) => (
                                <div
                                    key={doc.id}
                                    className="flex items-center justify-between p-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                                    onClick={() => handleDocumentClick(doc.id)}
                                >
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900">{doc.title}</h3>
                                        <p className="text-xs text-gray-500">
                                            Created by {doc.createdBy} on {new Date(doc.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <button
                                        className="text-sm text-teal-600 hover:text-teal-800"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDocumentClick(doc.id);
                                        }}
                                    >
                                        View
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {documents.map((doc) => (
                                <div
                                    key={doc.id}
                                    className="group relative bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-lg cursor-pointer transition-all duration-200 hover:scale-105"
                                    onClick={() => handleDocumentClick(doc.id)}
                                >
                                    {/* Document Icon/Preview */}
                                    <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 rounded-t-lg p-3 flex flex-col justify-center items-center relative overflow-hidden">
                                        {/* Document lines simulation */}
                                        <div className="w-full space-y-1.5 opacity-30">
                                            <div className="h-0.5 bg-gray-400 rounded w-3/4"></div>
                                            <div className="h-0.5 bg-gray-400 rounded w-full"></div>
                                            <div className="h-0.5 bg-gray-400 rounded w-5/6"></div>
                                            <div className="h-0.5 bg-gray-400 rounded w-2/3"></div>
                                            <div className="h-0.5 bg-gray-400 rounded w-4/5"></div>
                                            <div className="h-0.5 bg-gray-400 rounded w-3/5"></div>
                                        </div>

                                        {/* Document type indicator */}
                                        <div className="absolute top-2 right-2 w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                                            <svg className="w-4 h-4 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                            </svg>
                                        </div>

                                        {/* Hover overlay */}
                                        <div className="absolute inset-0 bg-teal-500 bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-t-lg"></div>
                                    </div>

                                    {/* Document Info */}
                                    <div className="p-3 space-y-1.5">
                                        <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-teal-700 transition-colors">
                                            {doc.title}
                                        </h3>
                                        <div className="space-y-1">
                                            <p className="text-xs text-gray-500 truncate">
                                                By {doc.createdBy}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {new Date(doc.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="pt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                            <button
                                                className="text-xs text-teal-600 hover:text-teal-800 font-medium"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDocumentClick(doc.id);
                                                }}
                                            >
                                                Open Document →
                                            </button>
                                        </div>
                                    </div>

                                    {/* Selection indicator */}
                                    <div className="absolute top-3 left-3 w-4 h-4 border-2 border-gray-300 rounded opacity-0 group-hover:opacity-100 transition-opacity bg-white">
                                        {/* Could be used for selection functionality later */}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}