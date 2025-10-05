import React, { useState } from 'react';
import { X, Copy, Check, Mail, Globe, Lock, Users } from 'lucide-react';

export default function ShareModal({ isOpen, onClose, documentTitle, onShare }) {
  const [emails, setEmails] = useState('');
  const [role, setRole] = useState('reader');
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [shareMethod, setShareMethod] = useState('email'); // 'email' or 'link'

  const handleShare = async () => {
    if (shareMethod === 'email') {
      const emailList = emails.split(',').map(e => e.trim()).filter(e => e);
      if (emailList.length === 0) {
        alert('Please enter at least one email address');
        return;
      }
      await onShare({ emails: emailList, role });
      setEmails('');
    } else {
      // Generate shareable link
      const link = `${window.location.origin}/documents/${Math.random().toString(36).substring(7)}`;
      setShareLink(link);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Share Document</h3>
            <p className="text-sm text-gray-600 mt-1">{documentTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Share Method Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setShareMethod('email')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              shareMethod === 'email'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Mail className="w-4 h-4 inline mr-2" />
            Share via Email
          </button>
          <button
            onClick={() => setShareMethod('link')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              shareMethod === 'link'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Globe className="w-4 h-4 inline mr-2" />
            Get Link
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {shareMethod === 'email' ? (
            <>
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email addresses
                </label>
                <textarea
                  value={emails}
                  onChange={(e) => setEmails(e.target.value)}
                  placeholder="Enter email addresses separated by commas"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate multiple emails with commas
                </p>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access level
                </label>
                <div className="space-y-2">
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      value="reader"
                      checked={role === 'reader'}
                      onChange={(e) => setRole(e.target.value)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-900">Can view</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Recipients can only view the document
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      value="commenter"
                      checked={role === 'commenter'}
                      onChange={(e) => setRole(e.target.value)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-900">Can comment</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Recipients can view and add comments
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      value="writer"
                      checked={role === 'writer'}
                      onChange={(e) => setRole(e.target.value)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-900">Can edit</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Recipients can view, comment, and edit
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Link Generation */}
              {!shareLink ? (
                <div className="text-center py-8">
                  <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="font-medium text-gray-900 mb-2">
                    Create a shareable link
                  </h4>
                  <p className="text-sm text-gray-600 mb-6">
                    Anyone with the link can access this document
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shareable link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={shareLink}
                      readOnly
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
                    />
                    <button
                      onClick={copyLink}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    This link will work for anyone who has it
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            {shareMethod === 'email' ? 'Send Invites' : 'Generate Link'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .animate-scale-in {
          animation: scaleIn 0.2s ease-out;
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}