// src/app/learn/[topicId]/page.jsx
'use client';

import dynamic from 'next/dynamic';

const TopicDetailPage = dynamic(() => import('@learning-module/app/learn/[topicId]/page'), {
  ssr: false,
});

export default function Topic() {
  return <TopicDetailPage />;
}