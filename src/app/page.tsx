'use client';

import { useUser } from '@/firebase';
import { redirect } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
  
  return null;
}
