// app/recordings/[id]/page.jsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRecordings } from '@/hooks/useRecording';
import RecordingViewerModal from '@/components/viewer/RecordingViewerModal';

export default function SharedRecordingPage() {
  const params = useParams();
  const router = useRouter();
  const recordingsHook = useRecordings();
  const [isReady, setIsReady] = useState(false);

  const recordingId = params?.id;
  
  // Wrap recordings initialization in useMemo to prevent dependency issues
  const recordings = useMemo(() => recordingsHook.recordings || [], [recordingsHook.recordings]);
  const isLoading = recordingsHook.loading;

  const recording = useMemo(() => {
    return recordings.find(r => r.id === recordingId);
  }, [recordings, recordingId]);

  useEffect(() => {
    if (!isLoading && recordings.length >= 0) {
      setIsReady(true);
    }
  }, [isLoading, recordings.length]);

  if (!isReady || isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-8 text-center shadow-xl">
          <div className="animate-spin w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading recording...</div>
        </div>
      </div>
    );
  }

  if (!recording) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-8 max-w-md text-center shadow-xl">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Recording Not Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            This recording could not be found or you don&apos;t have permission to view it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <RecordingViewerModal 
        recording={recording}
        onClose={() => router.push('/recordings')}
      />
    </div>
  );
}