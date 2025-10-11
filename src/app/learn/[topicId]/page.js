// app/learn/page.jsx
'use client';

import dynamic from 'next/dynamic';

// Lazy-load the submodule’s homepage
const TopicDetailPage = dynamic(() => import('../../../learning-module/app/learn/[topicId]/page'), {
  ssr: false,
});

export default function Topic() {
  return <TopicDetailPage />;
}
