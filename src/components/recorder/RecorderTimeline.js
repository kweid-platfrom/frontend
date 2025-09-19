import React from 'react';

const RecorderTimeline = ({ duration, detectedIssues, videoRef }) => {
  const formatTime = (s) => {
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    const min = Math.floor(s / 60).toString();
    return `${min}:${sec}`;
  };

  const durationSeconds = duration.includes(':') 
    ? parseInt(duration.split(':')[0]) * 60 + parseInt(duration.split(':')[1]) 
    : 0;

  const seekTo = (seconds) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = seconds;
    videoRef.current.play();
  };

  return (
    <div className="h-6 bg-gray-200 dark:bg-gray-700 relative">
      <div
        className="h-6 bg-blue-500 transition-all duration-300"
        style={{ width: videoRef.current ? `${(videoRef.current.currentTime / durationSeconds) * 100}%` : '0%' }}
      />
      {detectedIssues.map(issue => (
        <div
          key={issue.id}
          onClick={() => seekTo(new Date(issue.time).getTime() / 1000 - new Date().getTimezoneOffset() * 60)}
          className="absolute w-2 h-6 bg-red-600 cursor-pointer"
          style={{ left: `${(new Date(issue.time).getTime() / 1000 - new Date().getTimezoneOffset() * 60) / durationSeconds * 100}%` }}
          title={issue.message}
        />
      ))}
    </div>
  );
};

export default RecorderTimeline;