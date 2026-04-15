'use client';

import { useEffect } from 'react';
import Navbar from './Navbar';
import { useAuthStore } from '../stores/authStore';
import { useGameStore } from '../stores/gameStore';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { fetchUser, isLoading } = useAuthStore();
  const { fetchLevels, fetchProgress } = useGameStore();

  useEffect(() => {
    fetchUser();
    fetchLevels();
  }, [fetchUser, fetchLevels]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) {
      fetchProgress();
    }
  }, [fetchProgress]);

  return (
    <>
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="text-center py-12">加载中...</div>
        ) : (
          children
        )}
      </main>
    </>
  );
}
