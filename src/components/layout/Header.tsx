import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Menu, Sun, Moon, Bell, HelpCircle } from 'lucide-react';
import { HelpModal } from '@/components/HelpModal';

interface HeaderProps {
  title: string;
  onNavigate: (page: string) => void;
}

export function Header({ title, onNavigate }: HeaderProps) {
  const { darkMode, toggleDarkMode, toggleSidebar, notifications } = useStore();
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const [showHelp, setShowHelp] = useState(false);

  return (
    <>
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden">
            <Menu size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleDarkMode}
            className="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {darkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-gray-600" />}
          </button>
          <button
            onClick={() => onNavigate('notifications')}
            className="relative p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Bell size={18} className="text-gray-600 dark:text-gray-300" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowHelp(true)}
            className="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Help"
          >
            <HelpCircle size={18} className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>
    </header>
    <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </>
  );
}
