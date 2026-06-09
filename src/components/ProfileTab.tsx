/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { User, Course } from '../types';
import { Award, BookOpen, MessageSquare, ShieldAlert, KeyRound, Sparkles, Check, UserCheck, CheckCircle } from 'lucide-react';

const AVATAR_OPTIONS = ['🍩', '🥑', '🛸', '🎨', '⚔️', '🦉', '🦁', '🛌', '🤖', '🎓', '🧪', '👾'];

interface ProfileTabProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onSwitchProfile: () => void;
  notesCount: number;
  groupsJoinedCount: number;
  messagesCount: number;
  courses: Course[];
}

export default function ProfileTab({
  user,
  onUpdateUser,
  onSwitchProfile,
  notesCount,
  groupsJoinedCount,
  messagesCount,
  courses,
}: ProfileTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user.name);
  const [editedMajor, setEditedMajor] = useState(user.major);
  const [editedYear, setEditedYear] = useState(user.year);
  const [editedAvatar, setEditedAvatar] = useState(user.avatar);
  const [showSavedToast, setShowSavedToast] = useState(false);

  const handleSave = () => {
    if (!editedName.trim() || !editedMajor.trim()) return;
    
    onUpdateUser({
      ...user,
      name: editedName.trim(),
      major: editedMajor.trim(),
      year: editedYear,
      avatar: editedAvatar,
    });
    
    setIsEditing(false);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2500);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-transparent p-4 pb-24 h-full relative z-0">
      
      {/* Profiler Toast alert */}
      {showSavedToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-emerald-500/80 backdrop-blur-md border border-emerald-400/30 text-white text-[11px] font-bold py-1.5 px-4 rounded-xl shadow-lg flex items-center gap-1.5 z-30 animate-bounce select-none">
          <CheckCircle size={14} /> Profile Saved Successfully!
        </div>
      )}

      {/* Main visual header */}
      <div className="text-center py-3 bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg rounded-3xl p-5 mb-5 relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
        
        {/* BIG AVATAR WRAPPER */}
        <div className="relative inline-block mb-3 select-none">
          <div className="text-4xl p-5 bg-white/15 border border-white/15 rounded-3xl shadow-inner inline-block">
            {editedAvatar}
          </div>
          {isEditing && (
            <span className="absolute -bottom-1 -right-1 bg-white text-indigo-950 border border-white px-1.5 py-0.5 rounded-lg text-[8px] font-bold uppercase tracking-wider">
              EDIT
            </span>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-3 mt-2 text-left">
            {/* Emojis selection */}
            <div>
              <label className="block text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1.5">Select Avatar Identity</label>
              <div className="grid grid-cols-6 gap-2">
                {AVATAR_OPTIONS.map((av) => (
                  <button
                    key={av}
                    onClick={() => setEditedAvatar(av)}
                    className={`text-xl p-1.5 rounded-xl transition-all ${
                      editedAvatar === av
                        ? 'bg-white text-indigo-950 border border-white scale-110 shadow-md'
                        : 'bg-white/10 border border-white/10 hover:bg-white/20'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1.5">Your Full Name</label>
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="w-full border border-white/15 bg-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-white/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1.5">Degree Title</label>
                <input
                  type="text"
                  value={editedMajor}
                  onChange={(e) => setEditedMajor(e.target.value)}
                  className="w-full border border-white/15 bg-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-white/30"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1.5">Academic Year</label>
                <select
                  value={editedYear}
                  onChange={(e) => setEditedYear(e.target.value)}
                  className="w-full border border-white/15 bg-indigo-950 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-white/30 font-medium"
                >
                  <option value="Freshman" className="bg-indigo-950 text-white">Freshman</option>
                  <option value="Sophomore" className="bg-indigo-950 text-white">Sophomore</option>
                  <option value="Junior" className="bg-indigo-950 text-white">Junior</option>
                  <option value="Senior" className="bg-indigo-950 text-white">Senior</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleSave}
              className="w-full bg-white text-indigo-950 hover:bg-white/95 text-xs font-bold py-2.5 rounded-xl shadow-md transition-all active:scale-99 flex items-center justify-center gap-1.5 mt-2"
            >
              <UserCheck size={14} /> Update Identity
            </button>
          </div>
        ) : (
          <div>
            <h2 className="text-base font-black text-white leading-tight tracking-tight">{user.name}</h2>
            <p className="text-xs font-medium text-white/75 mt-1.5">
              {user.year} • {user.major}
            </p>
            <div className="flex justify-center gap-2 mt-3.5 flex-wrap">
              <button
                onClick={() => setIsEditing(true)}
                className="bg-white/20 hover:bg-white/30 border border-white/15 text-white text-[10px] font-extrabold px-3.5 py-1.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Edit Student Card
              </button>
              <button
                onClick={onSwitchProfile}
                className="bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/30 text-white text-[10px] font-extrabold px-3.5 py-1.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Switch Profile 🔄
              </button>
            </div>
          </div>
        )}
      </div>

      {/* STATS BENTO ROW */}
      <div className="grid grid-cols-3 gap-2.5 mb-5 select-none">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-3 text-center self-stretch flex flex-col justify-center shadow-lg">
          <BookOpen size={16} className="text-white/80 mx-auto mb-1" />
          <span className="block text-base font-extrabold text-white leading-none">{notesCount}</span>
          <span className="block text-[8px] text-white/60 font-bold uppercase tracking-wider mt-1.5">Notes Shared</span>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-3 text-center self-stretch flex flex-col justify-center shadow-lg">
          <Award size={16} className="text-amber-300 mx-auto mb-1" />
          <span className="block text-base font-extrabold text-white leading-none">{groupsJoinedCount}</span>
          <span className="block text-[8px] text-white/60 font-bold uppercase tracking-wider mt-1.5">Study Clans</span>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-3 text-center self-stretch flex flex-col justify-center shadow-lg">
          <MessageSquare size={16} className="text-pink-300 mx-auto mb-1" />
          <span className="block text-base font-extrabold text-white leading-none">{messagesCount}</span>
          <span className="block text-[8px] text-white/60 font-bold uppercase tracking-wider mt-1.5">Chats Shared</span>
        </div>
      </div>

      {/* ENROLLED IN PROGRESS CARD MODULE */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-4 mb-5 select-none shadow-lg text-left">
        <h3 className="text-xs font-black text-white uppercase tracking-widest mb-3">
          📚 Registered Semesters ({courses.length})
        </h3>
        
        <div className="space-y-2">
          {courses.length === 0 ? (
            <div className="text-[10px] text-white/40 italic p-4 text-center">
              No registered subjects. Add some custom subjects from the Lecture Notes or Study Coordinators tab!
            </div>
          ) : (
            courses.map((course) => (
              <div key={course.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-2xl">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider font-mono bg-white/15 px-2 py-0.5 rounded border border-white/10">
                    {course.code}
                  </span>
                  <p className="text-xs font-bold text-white truncate leading-snug mt-1.5">
                    {course.name}
                  </p>
                </div>
                <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full border border-white animate-pulse shrink-0 block" title="Enrolled & Active" />
              </div>
            ))
          )}
        </div>
      </div>

      {/* SECURITY / SYSTEM INTEGRATION BOARD */}
      <div className="bg-gradient-to-br from-indigo-950 to-slate-900 text-indigo-50 rounded-3xl p-4 shadow-md">
        <div className="flex items-start gap-2.5">
          <div className="bg-white/10 p-1.5 rounded-lg text-amber-400 shrink-0">
            <KeyRound size={16} />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-white tracking-wide flex items-center gap-1.5">
              <span>Settings & SECRETS Configuration</span>
              <Sparkles size={11} className="text-amber-400 animate-pulse" />
            </h4>
            <p className="text-[10px] text-indigo-200 leading-relaxed mt-1.5">
              EduShare operates on top of server-side Gemini 3.5 models. If your summaries show generic templates or fallback student comments, insert your own **GEMINI_API_KEY** under the **Secrets pane** located in the upper right Settings sidebar in AI Studio.
            </p>
            
            <p className="text-[9px] text-indigo-300 font-bold italic mt-2.5">
              *The workspace variables are injected automatically upon saving!*
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
