// components/AttachmentsList.js
import React, { useState } from "react";
import { Download, FileText, Image as ImageIcon, File, X, ZoomIn } from "lucide-react";
import Image from "next/image";

const AttachmentsList = ({ attachments }) => {
    const [selectedImage, setSelectedImage] = useState(null);

    const getFileIcon = (fileName) => {
        const extension = fileName?.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
            return <ImageIcon className="h-4 w-4" />;
        } else if (['pdf', 'doc', 'docx', 'txt'].includes(extension)) {
            return <FileText className="h-4 w-4" />;
        }
        return <File className="h-4 w-4" />;
    };

    const isImage = (fileName) => {
        const extension = fileName?.split('.').pop().toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension);
    };

    const ImagePreviewModal = ({ imageUrl, imageName, onClose }) => (
        <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div className="relative max-w-4xl max-h-[90vh] m-4">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
                >
                    <X className="h-6 w-6" />
                </button>
                {imageUrl && (
                    <Image
                        src={imageUrl}
                        alt={imageName}
                        width={1000}
                        height={1000}
                        className="max-w-full max-h-full object-contain rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />
                )}
                <div className="absolute bottom-4 left-4 right-4 text-white text-sm bg-black bg-opacity-50 rounded px-3 py-2">
                    {imageName}
                </div>
            </div>
        </div>
    );

    return (
        <>
            <div className="space-y-4">
                {attachments?.map((attachment, index) => {
                    const isValidImage = isImage(attachment?.name) && !!attachment?.url;

                    return (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg border space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                    <div className="text-gray-500 flex-shrink-0">
                                        {getFileIcon(attachment?.name)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {attachment?.name || 'Unnamed file'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {attachment?.size ? `${(attachment.size / 1024).toFixed(1)} KB` : 'Size unknown'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 ml-3">
                                    {isValidImage && (
                                        <button
                                            onClick={() => setSelectedImage(attachment)}
                                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                                            title="Expand"
                                        >
                                            <ZoomIn className="h-4 w-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => window.open(attachment.url, '_blank')}
                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                                        title="Download"
                                    >
                                        <Download className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {isValidImage && (
                                <Image
                                    src={attachment.url}
                                    alt={attachment.name}
                                    width={300}
                                    height={200}
                                    className="w-full max-w-xs rounded border object-cover cursor-pointer hover:opacity-90 transition"
                                    onClick={() => setSelectedImage(attachment)}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

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
// This component renders a list of attachments with options to view images in a modal and download files.
// It uses Lucide icons for visual representation and Next.js Image component for optimized image loading.
//                         >