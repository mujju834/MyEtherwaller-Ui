"use client"
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import Link from 'next/link';

const MainClientComponent = dynamic(() => import('./Components/Main.client'), {
  suspense: true,
});

export default function Home() {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <MainClientComponent />
      </Suspense>

    </div>
  );
}