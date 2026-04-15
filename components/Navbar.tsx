'use client';

import Link from 'next/link';
import { useGameStore } from '../stores/gameStore';
import { useAuthStore } from '../stores/authStore';
import { UserCircleIcon, ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/solid';

export default function Navbar() {
  const { totalScore, completedLevels } = useGameStore();
  const { user, isAuthenticated, loginWithGitHub, logout } = useAuthStore();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-blue-600">MD Master</span>
          </Link>

          <div className="flex items-center space-x-6">
            <Link href="/levels" className="text-gray-700 hover:text-blue-600 font-medium">
              关卡
            </Link>
            <Link href="/leaderboard" className="text-gray-700 hover:text-blue-600 font-medium">
              排行榜
            </Link>

            {isAuthenticated && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-yellow-50 px-3 py-1 rounded-full">
                  <span className="text-yellow-600 text-sm">积分:</span>
                  <span className="text-yellow-700 font-bold">{totalScore}</span>
                </div>
                <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full">
                  <span className="text-green-600 text-sm">已完成:</span>
                  <span className="text-green-700 font-bold">{completedLevels}</span>
                </div>
              </div>
            )}

            {isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                <Link
                  href="/profile"
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
                  title="个人中心"
                >
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full" />
                  ) : (
                    <UserCircleIcon className="w-7 h-7" />
                  )}
                  <span className="text-sm font-medium max-w-[80px] truncate">
                    {user.nickname || user.display_name || user.username}
                  </span>
                </Link>
                <button
                  onClick={logout}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  title="退出登录"
                >
                  <ArrowRightStartOnRectangleIcon className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={loginWithGitHub}
                className="flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span>GitHub 登录</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
