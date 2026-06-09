import React, { useState } from 'react';
import { User } from '../types';
import { Sparkles, UserPlus, BookOpen, Users, Check, ArrowRight, Search, Clipboard, Copy } from 'lucide-react';
import { getJoinCode } from '../utils/codeUtils';

interface OnboardingScreenProps {
  onSelectUser: (user: User) => void;
  existingUsers: User[];
  onCreateUser: (newUser: User) => void;
}

const AVATAR_OPTIONS = ['🍩', '🥑', '🛸', '🎨', '⚔️', '🦉', '🦁', '🛌', '🤖', '🎓', '🧪', '👾', '🦊', '🐼', '🍕', '🚀'];

const DEFAULT_MAJORS = [
  'Computer Science',
  'Applied Mathematics',
  'Biochemistry',
  'World Literature',
  'Electrical Engineering',
  'Physics',
  'Psychology'
];

export default function OnboardingScreen({
  onSelectUser,
  existingUsers,
  onCreateUser,
}: OnboardingScreenProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMajor, setNewMajor] = useState(DEFAULT_MAJORS[0]);
  const [customMajor, setCustomMajor] = useState('');
  const [newYear, setNewYear] = useState('Freshman');
  const [newAvatar, setNewAvatar] = useState('🎓');
  const [errorMsg, setErrorMsg] = useState('');

  // Invite code states
  const [inviteCode, setInviteCode] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [successFeedback, setSuccessFeedback] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleVerifyInviteCode = () => {
    setInviteError('');
    setSuccessFeedback('');
    
    if (!inviteCode.trim()) {
      setInviteError('Please enter a join code first.');
      return;
    }
    
    const code = inviteCode.trim().toUpperCase();
    
    // Check if it's a student invite code
    const foundUser = existingUsers.find(u => getJoinCode('USR', u.id) === code);
    if (foundUser) {
      setSuccessFeedback(`Found Classmate ${foundUser.name}! Opening profile...`);
      setTimeout(() => {
        onSelectUser(foundUser);
      }, 700);
      return;
    }
    
    if (code.startsWith('GRP-')) {
      setInviteError(`Group found! Choose any profile below first to login and join.`);
    } else if (code.startsWith('NOT-')) {
      setInviteError(`Lecture Notes found! Log in below first to open.`);
    } else if (code.startsWith('CH-')) {
      setInviteError(`Channel found! Log in to connect and chat.`);
    } else {
      setInviteError(`Could not find entity for code "${code}". Hint: Look at classmate codes below.`);
    }
  };

  const handleCopyCode = (e: React.MouseEvent, codeVal: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(codeVal);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedName = newName.trim();
    if (!trimmedName) {
      setErrorMsg('Please enter a student name.');
      return;
    }

    const finalMajor = newMajor === 'Custom' ? customMajor.trim() : newMajor;
    if (!finalMajor) {
      setErrorMsg('Please specify your degree major.');
      return;
    }

    const newUser: User = {
      id: 'u_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name: trimmedName,
      major: finalMajor,
      year: newYear,
      avatar: newAvatar,
    };

    onCreateUser(newUser);
    onSelectUser(newUser);
  };

  return (
    <div className="w-full h-full bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 flex flex-col justify-between overflow-y-auto px-5 py-6 text-white text-center select-none">
      
      {/* 1. BRAND HERO HEADER */}
      <div className="my-auto pt-6 pb-4 shrink-0 transition-all duration-300">
        <div className="inline-flex p-3 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-md mb-4 animate-pulse">
          <span className="text-3xl leading-none">🎓</span>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight leading-none">
          EduShare Live
        </h1>
        <p className="text-[11px] font-bold text-indigo-300 tracking-widest uppercase mt-2">
          Collaborative Study Hub & Companion
        </p>
        <p className="text-xs text-white/70 max-w-[280px] mx-auto mt-2 leading-relaxed font-medium">
          Multi-user real-time workspace. Select your student identity or create a new profile to participate in notes sharing, whiteboard labs, and scheduling.
        </p>
      </div>

      {/* 2. PROFILE CONTAINER SWITCHING CONTROLLERS */}
      <div className="w-full my-auto transition-all duration-300">
        {!showCreateForm ? (
          <div className="space-y-4">
            {/* Join Code Search Panel */}
            <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl p-3 max-w-[320px] mx-auto text-left border border-white/10 shadow-lg">
              <label className="text-[9px] font-black tracking-widest text-indigo-300 uppercase block mb-1 select-none">
                ⚡ Got an Invite or Classmate Code?
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="e.g. USR-JO5381"
                  value={inviteCode}
                  onChange={(e) => {
                    setInviteCode(e.target.value);
                    setInviteError('');
                    setSuccessFeedback('');
                  }}
                  className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1 text-xs text-white placeholder-white/20 uppercase font-mono tracking-wider focus:outline-none focus:border-indigo-400"
                />
                <button
                  type="button"
                  onClick={handleVerifyInviteCode}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10px] px-3.5 py-1 rounded-xl transition-all cursor-pointer shadow-md active:scale-95"
                >
                  Connect
                </button>
              </div>
              {inviteError && (
                <p className="text-[9px] text-rose-400 font-semibold mt-1">
                  ⚠️ {inviteError}
                </p>
              )}
              {successFeedback && (
                <p className="text-[9px] text-emerald-400 font-bold mt-1">
                  ✨ {successFeedback}
                </p>
              )}
            </div>

            <h2 className="text-xs font-black text-indigo-200 uppercase tracking-widest flex items-center justify-center gap-1.5 pt-1">
              <span>👥 Who is studying today?</span>
            </h2>

            {/* Profiles Grid */}
            <div className="grid grid-cols-2 gap-3 max-w-[320px] mx-auto">
              {existingUsers.map((usr) => (
                <button
                  key={usr.id}
                  onClick={() => onSelectUser(usr)}
                  style={{ contentVisibility: 'auto' }}
                  className="flex flex-col items-center bg-white/10 hover:bg-white/15 active:scale-97 transition-all border border-white/10 hover:border-white/25 p-3 rounded-3xl shadow-lg relative group text-left w-full cursor-pointer overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-12 h-12 bg-white/5 rounded-full blur-md pointer-events-none group-hover:bg-white/10" />
                  
                  {/* Avatar Bubble */}
                  <div className="text-2xl p-1.5 bg-white/10 rounded-2xl mb-1.5 group-hover:scale-105 transition-all outline-none">
                    {usr.avatar}
                  </div>

                  {/* Info */}
                  <div className="w-full text-center">
                    <h3 className="text-[11px] font-extrabold text-white truncate max-w-full leading-tight">
                      {usr.name}
                    </h3>
                    <p className="text-[8px] text-white/50 font-medium mt-0.5 truncate max-w-full">
                      {usr.year} • {usr.major}
                    </p>
                    
                    {/* Shareable Code Badge */}
                    <div 
                      className="mt-2 inline-flex items-center gap-1 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-md text-[8px] font-mono hover:bg-white/20 transition-all text-white/80 w-full justify-center"
                      onClick={(e) => handleCopyCode(e, getJoinCode('USR', usr.id), usr.id)}
                    >
                      <span className="truncate">Code: {getJoinCode('USR', usr.id)}</span>
                      <span className="text-indigo-300 transform scale-90">
                        {copiedId === usr.id ? '✓' : '❐'}
                      </span>
                    </div>
                  </div>
                </button>
              ))}

              {/* Create new profile tile loader */}
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex flex-col items-center justify-center border-2 border-dashed border-white/25 hover:border-white/40 hover:bg-white/5 active:scale-97 transition-all p-4 rounded-3xl cursor-pointer hover:shadow-xl shrink-0 h-full text-center"
              >
                <div className="p-2.5 bg-white/10 text-white rounded-2xl mb-2">
                  <UserPlus size={18} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-200">
                  New Student
                </span>
                <span className="text-[8px] text-white/40 mt-0.5">Create account</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-[325px] mx-auto bg-white/5 backdrop-blur-xl border border-white/15 p-5 rounded-3xl shadow-2xl relative text-left">
            
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
              <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                <UserPlus size={14} className="text-indigo-300" />
                <span>Create Student Profile</span>
              </h3>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setErrorMsg('');
                }}
                className="text-[9px] text-white/50 hover:text-white font-extrabold tracking-wider bg-white/10 px-2 py-0.5 rounded-lg uppercase"
              >
                Cancel
              </button>
            </div>

            {errorMsg && (
              <div className="mb-3 text-[10px] font-bold text-red-400 bg-red-950/40 p-2 rounded-xl border border-red-500/20 text-center select-none animate-shake">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              
              {/* Avatar options selection grid */}
              <div>
                <label className="block text-[9px] font-black text-indigo-200 uppercase tracking-wider mb-1.5">
                  1. Choose Avatar Ident
                </label>
                <div className="grid grid-cols-6 gap-1.5 bg-slate-950/50 p-2 rounded-xl border border-white/5 max-h-[72px] overflow-y-auto w-full no-scrollbar">
                  {AVATAR_OPTIONS.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setNewAvatar(av)}
                      className={`text-base p-1 rounded-lg transition-all ${
                        newAvatar === av
                          ? 'bg-white text-indigo-950 scale-110 shadow-md font-bold'
                          : 'hover:bg-white/10'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              {/* Student Name */}
              <div>
                <label className="block text-[9px] font-black text-indigo-200 uppercase tracking-wider mb-1">
                  2. Student Full Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Rachel Green"
                  className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 font-bold"
                  maxLength={25}
                  required
                />
              </div>

              {/* Major Title preset or custom */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-black text-indigo-200 uppercase tracking-wider mb-1">
                    3. Degree Major
                  </label>
                  <select
                    value={newMajor}
                    onChange={(e) => setNewMajor(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-white/30 font-medium"
                  >
                    {DEFAULT_MAJORS.map((m) => (
                      <option key={m} value={m} className="bg-indigo-950 text-white">{m}</option>
                    ))}
                    <option value="Custom" className="bg-indigo-950 text-white">Custom...</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-indigo-200 uppercase tracking-wider mb-1">
                    4. Academic Year
                  </label>
                  <select
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-white/30 font-medium"
                  >
                    <option value="Freshman" className="bg-indigo-950 text-white">Freshman</option>
                    <option value="Sophomore" className="bg-indigo-950 text-white">Sophomore</option>
                    <option value="Junior" className="bg-indigo-950 text-white">Junior</option>
                    <option value="Senior" className="bg-indigo-950 text-white">Senior</option>
                  </select>
                </div>
              </div>

              {newMajor === 'Custom' && (
                <div className="animate-fade-in">
                  <label className="block text-[9px] font-black text-indigo-200 uppercase tracking-wider mb-1">
                    Specify Custom Major
                  </label>
                  <input
                    type="text"
                    value={customMajor}
                    onChange={(e) => setCustomMajor(e.target.value)}
                    placeholder="e.g. Aerospace Systems"
                    className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/30"
                    maxLength={30}
                    required
                  />
                </div>
              )}

              {/* Create Profile Loader submission button */}
              <button
                type="submit"
                className="w-full bg-white text-indigo-950 hover:bg-white/95 text-xs font-black uppercase tracking-wider py-2.5 mt-2 rounded-2xl shadow-xl transition-all active:scale-97 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Initialize Portfolio</span>
                <ArrowRight size={13} className="stroke-[2.5]" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* 3. APP FOOTER STATS */}
      <div className="mt-auto pt-6 shrink-0 select-none pb-2">
        <div className="flex items-center justify-center gap-3 text-[10px] text-indigo-300 font-bold tracking-widest uppercase">
          <span className="flex items-center gap-1">
            <BookOpen size={11} className="text-white/40" /> Notes Shared
          </span>
          <span className="text-white/20">•</span>
          <span className="flex items-center gap-1">
            <Users size={11} className="text-white/40" /> Study Clans
          </span>
        </div>
        <p className="text-[8px] text-white/35 font-mono mt-1.5">
          EduShare Node Engine v4.0 • Sandbox Cloud Secure
        </p>
      </div>

    </div>
  );
}
