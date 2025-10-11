// app/learn/page.jsx
'use client';

import dynamic from 'next/dynamic';

// Lazy-load the submodule’s homepage
const LearningApp = dynamic(() => import('../../learning-module/app/learn/page'), {
  ssr: false,
});

export default function LearnPage() {
  return <LearningApp />;
}
