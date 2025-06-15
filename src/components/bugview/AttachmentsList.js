// components/AttachmentsList.js
import React, { useState } from "react";
import { Download, FileText, Image, File, X, ZoomIn } from "lucide-react";

const AttachmentsList = ({ attachments }) => {
    const [selectedImage, setSelectedImage] = useState(null);

    const getFileIcon = (fileName) => {
        const extension = fileName.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
            return <Image className="h-4 w-4" alt="" />;
        } else if (['pdf', 'doc', 'docx', 'txt'].includes(extension)) {
            return <FileText className="h-4 w-4" />;
        }
        return <File className="h-4 w-4" />;
    };

    const isImage = (fileName) => {
        const extension = fileName.split('.').pop().toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension);
    };

    const ImagePreviewModal = ({ imageUrl, imageName, onClose }) => (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
            <div className="relative max-w-4xl max-h-4xl m-4">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
                >
                    <X className="h-6 w-6" />
                </button>
                <Image
                    src={imageUrl}
                    alt={imageName}
                    className="max-w-full max-h-full object-contain"
                    onClick={(e) => e.stopPropagation()}
                />
                <div className="absolute bottom-4 left-4 right-4 text-white text-sm bg-black bg-opacity-50 rounded px-3 py-2">
                    {imageName}
                </div>
            </div>
        </div>
    );

    return (
        <>
            <div className="space-y-2">
                {attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className="text-gray-500 flex-shrink-0">
                                {getFileIcon(attachment.name)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {attachment.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : 'Size unknown'}
                                </p>
                            </div>
                            {isImage(attachment.name) && (
                                <div className="flex-shrink-0">
                                    <Image
                                        src={attachment.url}
                                        alt={attachment.name}
                                        className="w-12 h-12 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => setSelectedImage(attachment)}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0 ml-3">
                            {isImage(attachment.name) && (
                                <button
                                    onClick={() => setSelectedImage(attachment)}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                    title="Preview image"
                                >
                                    <ZoomIn className="h-4 w-4" />
                                </button>
                            )}
                            <button
                                onClick={() => window.open(attachment.url, '_blank')}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                title="Download"
                            >
                                <Download className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Image Preview Modal */}
            {selectedImage && (
                <ImagePreviewModal
                    imageUrl={selectedImage.url}
                    imageName={selectedImage.name}
                    onClose={() => setSelectedImage(null)}
                />
            )}
        </>
    );
};

export default AttachmentsList;