/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Signal, User as UserIcon, BookOpen, Calendar, MessageSquare, AlertCircle } from 'lucide-react';

interface AndroidFrameProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  aiStatus: 'active' | 'demo';
  userAvatar: string;
  hideNavigation?: boolean;
}

export default function AndroidFrame({
  children,
  activeTab,
  setActiveTab,
  aiStatus,
  userAvatar,
  hideNavigation = false,
}: AndroidFrameProps) {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      setCurrentTime(`${hours}:${minutes} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000 * 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-0 md:p-6 font-sans antialiased text-slate-800 selection:bg-indigo-200">
      {/* Phone Case Bezel - Hidden on small layouts matching real touch targets, responsive phone wrapper */}
      <div className="w-full max-w-md h-screen md:h-[840px] bg-slate-950 md:rounded-[40px] md:shadow-[0_24px_50px_rgba(0,0,0,0.8)] md:border-[10px] md:border-slate-800 relative flex flex-col overflow-hidden">
        
        {/* Physical Camera Notch (simulated) */}
        <div className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 w-40 h-6 bg-slate-850 rounded-b-2xl z-50">
          <div className="absolute top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-black rounded-full border border-slate-700" />
        </div>

        {/* Status Bar */}
        <div className="bg-slate-950/70 backdrop-blur-md text-white text-xs px-6 pt-3 pb-2 flex justify-between items-center select-none shrink-0 z-40 border-b border-white/5">
          <span className="font-semibold tracking-wide text-[11px] text-white/90">{currentTime}</span>
          
          {/* Hardware status icons */}
          <div className="flex items-center gap-2">
            {aiStatus === 'demo' && (
              <span className="bg-amber-500/80 backdrop-blur-md text-[9px] text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider scale-95 mr-1 flex items-center gap-0.5 animate-pulse">
                <AlertCircle size={8} /> Demo Mode
              </span>
            )}
            <Signal size={12} className="text-white/80" />
            <Wifi size={12} className="text-white/80" />
            <div className="flex items-center gap-0.5">
              <span className="text-[10px] text-white/80 mr-0.5">88%</span>
              <Battery size={14} className="text-emerald-400 fill-emerald-400/30 rotate-0" />
            </div>
          </div>
        </div>

        {/* Content Node Stage */}
        <div className="flex-1 overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 relative flex flex-col">
          {children}
        </div>

        {/* Bottom Navigation Drawer */}
        {!hideNavigation && (
          <div className="bg-white/10 backdrop-blur-2xl border-t border-white/20 px-4 py-3 flex justify-around items-center shrink-0 shadow-[0_-8px_32px_rgba(0,0,0,0.15)] z-40">
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex flex-col items-center gap-0.5 py-1 px-3.5 rounded-2xl transition-all duration-200 ${
                activeTab === 'notes'
                  ? 'text-white bg-white/20 border border-white/30 font-bold scale-105 shadow-inner'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <BookOpen size={20} className={activeTab === 'notes' ? 'stroke-[2.5]' : 'stroke-[1.5]'} />
              <span className="text-[10px] tracking-wide font-medium">Notes</span>
            </button>

            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex flex-col items-center gap-0.5 py-1 px-3.5 rounded-2xl transition-all duration-200 ${
                activeTab === 'schedule'
                  ? 'text-white bg-white/20 border border-white/30 font-bold scale-105 shadow-inner'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar size={20} className={activeTab === 'schedule' ? 'stroke-[2.5]' : 'stroke-[1.5]'} />
              <span className="text-[10px] tracking-wide font-medium">Schedules</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`flex flex-col items-center gap-0.5 py-1 px-3.5 rounded-2xl transition-all duration-200 ${
                activeTab === 'chat'
                  ? 'text-white bg-white/20 border border-white/30 font-bold scale-105 shadow-inner'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="relative">
                <MessageSquare size={20} className={activeTab === 'chat' ? 'stroke-[2.5]' : 'stroke-[1.5]'} />
                <div className="absolute -top-1 -right-1.5 w-2 h-2 bg-emerald-400 rounded-full border border-white animate-ping" />
                <div className="absolute -top-1 -right-1.5 w-2 h-2 bg-emerald-400 rounded-full border border-white" />
              </div>
              <span className="text-[10px] tracking-wide font-medium">Chat</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center gap-0.5 py-1 px-3.5 rounded-2xl transition-all duration-200 ${
                activeTab === 'profile'
                  ? 'text-white bg-white/20 border border-white/30 font-bold scale-105 shadow-inner'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-lg leading-none filter drop-shadow-sm mb-0.5">{userAvatar}</span>
              <span className="text-[10px] tracking-wide font-medium">Profile</span>
            </button>
          </div>
        )}

        {/* Physical Bottom Android Navigation Bar (simulated) */}
        <div className="bg-slate-950 py-1.5 flex justify-center items-center shrink-0 z-40 select-none">
          <div className="w-28 h-1 bg-slate-700 rounded-full" />
        </div>
      </div>
    </div>
  );
}
