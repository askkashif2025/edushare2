/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StudyGroup, Course, User, ScheduleProposal, ScheduleEvent } from '../types';
import { Calendar, Plus, Users, MapPin, Check, Sparkles, Clock, ArrowLeft, Vote, CheckCircle2 } from 'lucide-react';
import { getJoinCode } from '../utils/codeUtils';

interface ScheduleTabProps {
  groups: StudyGroup[];
  onAddGroup: (group: Omit<StudyGroup, 'id' | 'membersCount' | 'joined' | 'proposals'>) => void;
  currentUser: User;
  onUpdateGroup: (updatedGroup: StudyGroup) => void;
  courses: Course[];
  onAddCourse: (name: string, code: string) => void;
}

export default function ScheduleTab({
  groups,
  onAddGroup,
  currentUser,
  onUpdateGroup,
  courses,
  onAddCourse,
}: ScheduleTabProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  
  // Custom group code copy state
  const [copiedGroupId, setCopiedGroupId] = useState<string | null>(null);

  // Group Form States
  const [newName, setNewName] = useState('');
  const [newCourseId, setNewCourseId] = useState(() => (courses && courses.length > 0 ? courses[0].id : ''));
  const [newDesc, setNewDesc] = useState('');
  
  // Inline Custom Subject creation state
  const [showAddSubjectForm, setShowAddSubjectForm] = useState(false);
  const [tempSubjectCode, setTempSubjectCode] = useState('');
  const [tempSubjectName, setTempSubjectName] = useState('');

  React.useEffect(() => {
    if (!newCourseId && courses && courses.length > 0) {
      setNewCourseId(courses[0].id);
    }
  }, [courses, newCourseId]);
  
  // Slot Input Custom Props
  const [propDay1, setPropDay1] = useState('Wed');
  const [propSlot1, setPropSlot1] = useState('16:00 - 17:30');
  const [propDay2, setPropDay2] = useState('Thu');
  const [propSlot2, setPropSlot2] = useState('14:00 - 15:30');

  const selectedGroup = groups.find(g => g.id === selectedGroupId) || null;

  const handleCopyGroupCode = (e: React.MouseEvent, codeVal: string, gId: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(codeVal);
    setCopiedGroupId(gId);
    setTimeout(() => setCopiedGroupId(null), 1500);
  };

  // Toggle Join Group
  const handleToggleJoin = (group: StudyGroup) => {
    const updated = {
      ...group,
      joined: !group.joined,
      membersCount: group.joined ? group.membersCount - 1 : group.membersCount + 1,
    };
    onUpdateGroup(updated);
  };

  // Handle Vote for Schedule Slot Proposal
  const handleVoteProposal = (proposalId: string) => {
    if (!selectedGroup) return;

    const updatedProposals = selectedGroup.proposals.map((prop) => {
      if (prop.id === proposalId) {
        const hasVoted = prop.votes.includes(currentUser.id);
        return {
          ...prop,
          votes: hasVoted
            ? prop.votes.filter((id) => id !== currentUser.id)
            : [...prop.votes, currentUser.id],
        };
      }
      return prop;
    });

    const updatedGroup = {
      ...selectedGroup,
      proposals: updatedProposals,
    };

    onUpdateGroup(updatedGroup);
  };

  // Handle finalize / locks down study meeting schedule option
  const handleLockInEvent = (proposal: ScheduleProposal) => {
    if (!selectedGroup) return;

    const newEvent: ScheduleEvent = {
      id: 'e_' + Date.now(),
      title: 'Study Session',
      day: proposal.day === 'Mon' ? 'Monday' : 
           proposal.day === 'Tue' ? 'Tuesday' : 
           proposal.day === 'Wed' ? 'Wednesday' : 
           proposal.day === 'Thu' ? 'Thursday' : 'Friday',
      time: proposal.timeSlot,
      location: 'Science Library Pod A'
    };

    const updatedGroup = {
      ...selectedGroup,
      upcomingEvent: newEvent,
    };

    onUpdateGroup(updatedGroup);
  };

  // Handle Create New Group Submit
  const handleSubmitGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newDesc.trim()) return;

    // Create a new study group with some standard initial templates
    const newGroupProposals: ScheduleProposal[] = [
      { id: 'p_' + Date.now() + '_1', day: propDay1, timeSlot: propSlot1, votes: [] },
      { id: 'p_' + Date.now() + '_2', day: propDay2, timeSlot: propSlot2, votes: [] },
    ];

    const sampleEvent: ScheduleEvent = {
      id: 'e_init_' + Date.now(),
      title: 'First Meet & Greet',
      day: propDay1 === 'Wed' ? 'Wednesday' : 'Monday',
      time: propSlot1,
      location: 'Student Hub Lounge'
    };

    const addedGroup: StudyGroup = {
      id: 'g_' + Date.now(),
      name: newName.trim(),
      courseId: newCourseId,
      description: newDesc.trim(),
      membersCount: 1, // the user joins automatically
      joined: true,
      upcomingEvent: sampleEvent,
      proposals: newGroupProposals
    };

    onUpdateGroup(addedGroup);

    // Reset Form
    setNewName('');
    setNewDesc('');
    setIsAddingGroup(false);
    setSelectedGroupId(addedGroup.id);
  };

  // Find most voted schedule proposal
  const getTopProposal = (proposals: ScheduleProposal[]): string | null => {
    if (proposals.length === 0) return null;
    let maxVotes = -1;
    let topId: string | null = null;
    proposals.forEach((p) => {
      if (p.votes.length > maxVotes) {
        maxVotes = p.votes.length;
        topId = p.id;
      }
    });
    return topId;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent overflow-hidden relative">
      
      {/* 1. STUDY GROUP COORDINATOR DETAILED WORKSPACE */}
      {selectedGroup ? (
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/95 via-purple-950/95 to-slate-950/95 backdrop-blur-3xl text-white z-20 flex flex-col h-full overflow-y-auto">
          {/* Top Back bar */}
          <div className="bg-white/10 backdrop-blur-xl border-b border-white/10 px-4 py-3 sticky top-0 flex items-center justify-between z-10 shadow-md animate-fade-in">
            <button
              onClick={() => setSelectedGroupId(null)}
              className="p-1 px-3 text-white/90 hover:text-white flex items-center gap-1.5 text-sm font-medium rounded-xl hover:bg-white/10 transition-all"
            >
              <ArrowLeft size={18} />
              <span>Back</span>
            </button>
            <span className="text-xs font-semibold text-white bg-white/20 px-2.5 py-1 rounded-full uppercase tracking-wider font-mono border border-white/20">
              {COURSES.find((c) => c.id === selectedGroup.courseId)?.code}
            </span>
          </div>

          <div className="p-4 flex-1">
            <div className="flex items-start justify-between min-w-0 mb-3">
              <div>
                <h1 className="text-lg font-bold font-sans text-white leading-tight">
                  {selectedGroup.name}
                </h1>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <p className="text-xs text-white/60 font-medium">
                    Active Coordination Hub
                  </p>
                  <span className="text-white/30 text-xs">•</span>
                  <button
                    onClick={(e) => handleCopyGroupCode(e, getJoinCode('GRP', selectedGroup.id), selectedGroup.id)}
                    className="flex items-center gap-1 bg-white/10 hover:bg-white/20 border border-white/10 px-2 py-0.5 rounded text-[9px] font-mono text-indigo-300 transition-all select-none cursor-pointer"
                  >
                    <span>Join Code: {getJoinCode('GRP', selectedGroup.id)}</span>
                    <span className="text-white">{copiedGroupId === selectedGroup.id ? '✓' : '❐'}</span>
                  </button>
                </div>
              </div>
              <button
                onClick={() => handleToggleJoin(selectedGroup)}
                className={`text-xs font-bold py-1.5 px-3.5 rounded-xl shadow-md transition-all active:scale-95 shrink-0 ${
                  selectedGroup.joined
                    ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30'
                    : 'bg-white text-indigo-950 hover:bg-white/90'
                }`}
              >
                {selectedGroup.joined ? 'Leave Group' : 'Join Group'}
              </button>
            </div>

            {/* General Description */}
            <p className="text-xs text-white/90 leading-relaxed mb-5 bg-white/10 backdrop-blur-md border border-white/15 p-3.5 rounded-2xl italic">
              "{selectedGroup.description}"
            </p>

            {/* MEMBER STATISTICS COMPONENT */}
            <div className="flex items-center gap-2 mb-6 bg-white/5 border border-white/5 p-3 rounded-2xl select-none">
              <div className="flex -space-x-1.5 overflow-hidden">
                <span className="w-5 h-5 rounded-full bg-white/20 border border-white/30 text-xs flex items-center justify-center">🍩</span>
                <span className="w-5 h-5 rounded-full bg-white/20 border border-white/30 text-xs flex items-center justify-center">🦉</span>
                <span className="w-5 h-5 rounded-full bg-white/20 border border-white/30 text-xs flex items-center justify-center">🦁</span>
                <span className="w-5 h-5 rounded-full bg-white/20 border border-white/30 text-xs flex items-center justify-center">⚔️</span>
              </div>
              <span className="text-[10px] text-white/70 font-bold tracking-tight">
                {selectedGroup.membersCount} Classmates actively matching times
              </span>
            </div>

            {/* SECTION: CONSOLIDATED EVENT / LATEST RSVP */}
            <div className="mb-6">
              <h3 className="text-xs font-extrabold text-white/60 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400" /> Active Meeting Locked In
              </h3>
              
              {selectedGroup.upcomingEvent ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-3xl">
                  <span className="inline-block bg-emerald-500/20 text-emerald-300 text-[9px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wide mb-2">
                    CONFIRMED SCHEDULE
                  </span>
                  
                  <h4 className="text-xs font-bold text-white leading-snug">
                    {selectedGroup.upcomingEvent.title}
                  </h4>
                  
                  <div className="space-y-1.5 mt-2.5 text-xs text-white/80">
                    <p className="flex items-center gap-2 font-medium">
                      <Clock size={13} className="text-white/40 shrink-0" />
                      <span>{selectedGroup.upcomingEvent.day} • {selectedGroup.upcomingEvent.time}</span>
                    </p>
                    <p className="flex items-center gap-2 font-medium">
                      <MapPin size={13} className="text-white/40 shrink-0" />
                      <span>{selectedGroup.upcomingEvent.location}</span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-white/5 text-white/60 p-4 border border-dashed border-white/10 rounded-3xl text-center text-xs py-6">
                  No active meeting is confirmed yet. Please review schedule proposals and vote below!
                </div>
              )}
            </div>

            {/* SCHEDULE SLOTS COORDINATOR - VOTING MECHANISM */}
            <div className="mb-6">
              <div className="flex items-center gap-1.5 mb-3">
                <Vote size={14} className="text-white/80" />
                <h3 className="text-xs font-extrabold text-white/60 uppercase tracking-widest">
                  Class Availability Matcher
                </h3>
              </div>

              {!selectedGroup.joined && (
                <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl mb-3 text-amber-200 text-[11px] font-medium leading-relaxed">
                  Join the study group to vote on calendar schedule proposals!
                </div>
              )}

              <div className="space-y-2.5">
                {selectedGroup.proposals.map((proposal) => {
                  const hasVoted = proposal.votes.includes(currentUser.id);
                  const totalVotes = proposal.votes.length;
                  const isTopSlot = proposal.id === getTopProposal(selectedGroup.proposals) && totalVotes > 0;

                  return (
                    <div
                      key={proposal.id}
                      onClick={() => selectedGroup.joined && handleVoteProposal(proposal.id)}
                      className={`border p-3.5 rounded-3xl bg-white/10 select-none transition-all flex items-center justify-between gap-3 ${
                        selectedGroup.joined ? 'cursor-pointer hover:shadow-md active:scale-99' : 'opacity-85'
                      } ${
                        hasVoted
                          ? 'border-white/40 bg-white/20 shadow-sm'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-indigo-950 bg-white px-2.5 py-0.5 rounded-lg">
                            {proposal.day}
                          </span>
                          <span className="text-xs font-semibold text-white font-mono">
                            {proposal.timeSlot}
                          </span>
                        </div>

                        {/* Voters dots/names */}
                        <div className="mt-1.5 flex items-center gap-1 select-none">
                          <span className="text-[10px] text-white/50 font-medium">Votes ({totalVotes}):</span>
                          {totalVotes === 0 ? (
                            <span className="text-[10px] text-white/40 italic">No classmate matched yet</span>
                          ) : (
                            <span className="text-[10px] text-white font-bold bg-white/10 px-1.5 py-0.2 rounded">
                              {hasVoted ? 'You + ' : ''}{totalVotes - (hasVoted ? 1 : 0)} classmate{totalVotes - (hasVoted ? 1 : 0) !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Vote interactive status indicator */}
                      <div className="flex items-center gap-2">
                        {isTopSlot && (
                          <span className="bg-amber-500/25 text-amber-200 text-[9px] font-black px-1.5 py-0.5 rounded border border-amber-500/30 uppercase tracking-wide">
                            🔥 Top Pick
                          </span>
                        )}

                        <div
                          className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                            hasVoted
                              ? 'bg-white border-white text-indigo-950'
                              : 'bg-white/10 border-white/10 text-transparent'
                          }`}
                        >
                          <Check size={14} className="stroke-[3]" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* LOCK OPTION ACTIONS FOR MANAGER */}
              {selectedGroup.joined && selectedGroup.proposals.some(p => p.votes.length > 0) && (
                <div className="mt-4 bg-white/5 border border-white/10 p-3.5 rounded-2xl">
                  <p className="text-[10px] text-white/50 font-medium mb-2.5 text-center">
                    (Study coordinators can lock down any proposal slot as the upcoming scheduled event)
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {selectedGroup.proposals
                      .filter((p) => p.votes.length > 0)
                      .map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handleLockInEvent(p)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1 shadow-md transition-all active:scale-99 border border-emerald-500/30"
                        >
                          Confirm & Book for {p.day} • {p.timeSlot} ({p.votes.length} votes)
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* 2. CREATE NEW STUDY PLAN GROUP SHEET */}
      {isAddingGroup ? (
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/95 to-slate-950/95 backdrop-blur-3xl text-white z-20 flex flex-col h-full overflow-y-auto p-5 animate-fade-in relative">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/10">
            <h2 className="text-base font-bold text-white font-sans">Coordinate a Study Group</h2>
            <button
              onClick={() => setIsAddingGroup(false)}
              className="text-white/75 hover:text-white text-xs font-semibold hover:bg-white/10 px-3 py-1.5 rounded-xl transition-all"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmitGroup} className="space-y-4 select-none pb-6">
            {showAddSubjectForm ? (
              <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl space-y-3 animate-fade-in text-left">
                <div className="flex justify-between items-center bg-transparent">
                  <h4 className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Add New Subject</h4>
                  <button 
                    type="button" 
                    onClick={() => setShowAddSubjectForm(false)} 
                    className="text-[10px] text-white/50 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Code e.g. CS 101"
                    value={tempSubjectCode}
                    onChange={(e) => setTempSubjectCode(e.target.value)}
                    className="bg-indigo-950/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Name e.g. Algorithms"
                    value={tempSubjectName}
                    onChange={(e) => setTempSubjectName(e.target.value)}
                    className="bg-indigo-950/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (tempSubjectCode.trim() && tempSubjectName.trim()) {
                      onAddCourse(tempSubjectName.trim(), tempSubjectCode.trim());
                      setTempSubjectCode('');
                      setTempSubjectName('');
                      setShowAddSubjectForm(false);
                    }
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10px] py-1.5 rounded-lg transition-all"
                >
                  Save Subject
                </button>
              </div>
            ) : (
              <div className="flex gap-2 items-end">
                <div className="flex-1 text-left">
                  <label className="block text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1.5">Target Course</label>
                  {courses.length === 0 ? (
                    <div className="text-[10px] p-2.5 rounded-xl border border-dashed border-white/20 bg-white/5 text-amber-300">
                      No subjects added yet. Add one!
                    </div>
                  ) : (
                    <select
                      value={newCourseId}
                      onChange={(e) => setNewCourseId(e.target.value)}
                      className="w-full border border-white/15 rounded-xl px-3 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-white/30 bg-indigo-950 font-medium text-white"
                    >
                      {courses.map((course) => (
                        <option key={course.id} value={course.id} className="bg-indigo-950 text-white">
                          {course.code} - {course.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddSubjectForm(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[11px] h-[42px] px-3 rounded-xl flex items-center gap-1 transition-all shrink-0 active:scale-95"
                  title="Add custom subject"
                >
                  <Plus size={14} />
                  <span>+ Subject</span>
                </button>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1.5">Group Name</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., CS101 Big-O Midnight Hustlers"
                className="w-full border border-white/15 bg-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-white/30 text-white placeholder-white/40"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1.5">Purpose / Agendas</label>
              <textarea
                required
                rows={3}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Suggest what notes you are studying or what test preparation you are doing..."
                className="w-full border border-white/15 bg-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-white/30 text-white placeholder-white/40"
              />
            </div>

            {/* Availability Option Slots Setup */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-white/90 mb-2 uppercase tracking-wide">Propose Availability Slot Options</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] text-white/50 uppercase tracking-wider font-semibold mb-1">Day</label>
                  <input
                    type="text"
                    required
                    value={propDay1}
                    onChange={(e) => setPropDay1(e.target.value)}
                    placeholder="Wed"
                    className="w-full border border-white/15 rounded-xl px-2.5 py-2 text-xs focus:outline-none bg-white/10 text-white placeholder-white/40"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-white/50 uppercase tracking-wider font-semibold mb-1">Time Slot</label>
                  <input
                    type="text"
                    required
                    value={propSlot1}
                    onChange={(e) => setPropSlot1(e.target.value)}
                    placeholder="16:00 - 17:30"
                    className="w-full border border-white/15 rounded-xl px-2.5 py-2 text-xs focus:outline-none bg-white/10 text-white placeholder-white/40"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <label className="block text-[9px] text-white/50 uppercase tracking-wider font-semibold mb-1">Day</label>
                  <input
                    type="text"
                    required
                    value={propDay2}
                    onChange={(e) => setPropDay2(e.target.value)}
                    placeholder="Thu"
                    className="w-full border border-white/15 rounded-xl px-2.5 py-2 text-xs focus:outline-none bg-white/10 text-white placeholder-white/40"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-white/50 uppercase tracking-wider font-semibold mb-1">Time Slot</label>
                  <input
                    type="text"
                    required
                    value={propSlot2}
                    onChange={(e) => setPropSlot2(e.target.value)}
                    placeholder="14:00 - 15:30"
                    className="w-full border border-white/15 rounded-xl px-2.5 py-2 text-xs focus:outline-none bg-white/10 text-white placeholder-white/40"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-white text-indigo-950 hover:bg-white/90 text-xs font-bold py-3 rounded-xl shadow-lg transition-all active:scale-99 mt-2 flex items-center justify-center gap-1.5"
            >
              <Plus size={16} /> Setup Study Group
            </button>
          </form>
        </div>
      ) : null}

      {/* 3. HOME STUDY GROUPS STREAM FEED */}
      <div className="bg-white/10 backdrop-blur-xl border-b border-white/10 px-4 py-4 shrink-0 shadow-lg flex items-center justify-between relative z-10">
        <div>
          <h1 className="text-sm font-extrabold text-white font-sans tracking-tight">Study Coordinators</h1>
          <p className="text-[10px] text-white/60 font-medium uppercase tracking-wider mt-0.5">Match schedules with peers</p>
        </div>
        <button
          onClick={() => setIsAddingGroup(true)}
          className="bg-white text-indigo-950 hover:bg-white/95 py-1.5 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all border border-white/20 shadow-md"
        >
          <Plus size={14} className="stroke-[3.5]" />
          <span>New Clan</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24 relative z-0">
        {groups.map((group) => {
          const course = courses.find((c) => c.id === group.courseId);
          return (
            <div
              key={group.id}
              onClick={() => setSelectedGroupId(group.id)}
              className="bg-white/15 backdrop-blur-xl border border-white/20 hover:border-white/40 p-5 rounded-3xl cursor-pointer shadow-lg hover:shadow-xl transition-all active:scale-98 relative flex flex-col"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[10px] font-mono font-bold text-white uppercase tracking-widest bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/15">
                    {course?.code}
                  </span>
                  <div
                    onClick={(e) => handleCopyGroupCode(e, getJoinCode('GRP', group.id), group.id)}
                    className="flex items-center gap-0.5 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/20 text-indigo-300 text-[8.5px] font-mono px-2 py-0.5 rounded shadow-sm hover:text-white transition-all select-none truncate cursor-pointer"
                  >
                    <span>Code: {getJoinCode('GRP', group.id)}</span>
                    <span className="text-white">{copiedGroupId === group.id ? '✓' : '❐'}</span>
                  </div>
                </div>
                {group.joined && (
                  <span className="bg-emerald-500/25 border border-emerald-500/30 text-emerald-200 text-[9.5px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 select-none shadow-sm">
                    <Check size={10} className="stroke-[3.5]" /> Joined
                  </span>
                )}
              </div>

              <h3 className="text-xs font-bold text-white leading-snug mb-1">
                {group.name}
              </h3>

              <p className="text-[11px] text-white/80 font-medium line-clamp-2 leading-relaxed mb-3">
                {group.description}
              </p>

              {/* Status slot summary card */}
              {group.upcomingEvent ? (
                <div className="bg-white/10 border border-white/10 p-3 rounded-2xl flex items-center justify-between gap-1 mb-2 select-none shadow-inner">
                  <div className="min-w-0">
                    <p className="text-[9.5px] font-extrabold text-white/40 uppercase tracking-widest leading-none mb-1">Confirmed Meet</p>
                    <p className="text-[11px] text-white/90 font-semibold truncate leading-normal">
                      {group.upcomingEvent.day} • {group.upcomingEvent.time}
                    </p>
                  </div>
                  <Calendar size={13} className="text-white/60 shrink-0" />
                </div>
              ) : (
                <div className="bg-amber-500/10 text-amber-200 p-2.5 border border-amber-500/20 rounded-2xl mb-2 text-center text-[10px] font-semibold flex items-center justify-center gap-1 select-none">
                  <Sparkles size={11} className="text-amber-400 animate-pulse" /> Coordinating Slots: Cast your vote!
                </div>
              )}

              {/* Bottom indicators */}
              <div className="flex items-center justify-between border-t border-white/10 pt-2.5 text-[10px] mt-1 text-white/60 font-bold select-none">
                <span className="flex items-center gap-1">
                  <Users size={12} /> {group.membersCount} study members
                </span>
                
                <span className="text-white hover:text-amber-200 font-extrabold flex items-center gap-0.5">
                  Coordinate Availability →
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
