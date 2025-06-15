// components/ImageUpload.js
import React, { useState, useRef } from "react";
import { Upload, X, Camera, Image } from "lucide-react";

const ImageUpload = ({ onImageUpload, onClose }) => {
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    const handleFiles = (files) => {
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const imageData = {
                        name: file.name,
                        url: e.target.result,
                        size: file.size,
                        type: file.type
                    };
                    onImageUpload(imageData);
                };
                reader.readAsDataURL(file);
            }
        });
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleFileInput = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFiles(e.target.files);
        }
    };

    const pasteFromClipboard = async () => {
        try {
            const items = await navigator.clipboard.read();
            for (const item of items) {
                for (const type of item.types) {
                    if (type.startsWith('image/')) {
                        const blob = await item.getType(type);
                        const file = new File([blob], `clipboard-image-${Date.now()}.png`, { type });
                        handleFiles([file]);
                        return;
                    }
                }
            }
        } catch (err) {
            console.log('Failed to read clipboard:', err);
        }
    };

    return (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-700">Upload Image</h4>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
            
            <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActive 
                        ? 'border-blue-400 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <div className="space-y-3">
                    <div className="flex justify-center">
                        <Upload className="h-10 w-10 text-gray-400" />
                    </div>
                    
                    <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                            Drag and drop images here, or
                        </p>
                        
                        <div className="flex justify-center space-x-2">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="inline-flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
                            >
                                <Image className="h-4 w-4" alt="" />
                                <span>Browse files</span>
                            </button>
                            
                            <button
                                onClick={pasteFromClipboard}
                                className="inline-flex items-center space-x-1 px-3 py-1 text-sm text-green-600 hover:text-green-800 border border-green-300 rounded hover:bg-green-50 transition-colors"
                            >
                                <Camera className="h-4 w-4" />
                                <span>Paste from clipboard</span>
                            </button>
                        </div>
                    </div>
                    
                    <p className="text-xs text-gray-500">
                        Supports: PNG, JPG, GIF, WebP (max 10MB)
                    </p>
                </div>
            </div>
            
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
            />
        </div>
    );
};

export default ImageUpload;