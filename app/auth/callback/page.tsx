'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { tokenManager } from '../../../lib/api';
import { useAuthStore } from '../../../stores/authStore';

export default function AuthCallback() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { fetchUser } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(`登录失败: ${errorParam}`);
      return;
    }

    if (token) {
      tokenManager.set(token);
      fetchUser().then(() => {
        router.push('/levels');
      });
    } else {
      setError('未收到登录凭证，请重试');
    }
  }, [searchParams, fetchUser, router]);

  if (error) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="text-red-500 text-5xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">登录出错</h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={() => router.push('/')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          返回首页
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto text-center py-20">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
      <p className="text-gray-600">正在完成登录...</p>
    </div>
  );
}
