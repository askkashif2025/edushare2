/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LectureNote, Course, User, Comment } from '../types';
import { Search, Plus, Sparkles, SlidersHorizontal, ArrowLeft, ThumbsUp, Send, Loader2, BookOpen, AlertCircle, RefreshCw } from 'lucide-react';
import { getJoinCode } from '../utils/codeUtils';

interface NotesTabProps {
  notes: LectureNote[];
  onAddNote: (note: Omit<LectureNote, 'id' | 'likes' | 'likedByCount' | 'comments'>) => void;
  currentUser: User;
  onUpdateNote: (updatedNote: LectureNote) => void;
  courses: Course[];
  onAddCourse: (name: string, code: string) => void;
}

export default function NotesTab({
  notes,
  onAddNote,
  currentUser,
  onUpdateNote,
  courses,
  onAddCourse,
}: NotesTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [selectedNote, setSelectedNote] = useState<LectureNote | null>(null);
  
  // Custom copy states
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  const handleCopyNoteCode = (e: React.MouseEvent, codeVal: string, nId: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(codeVal);
    setCopiedNoteId(nId);
    setTimeout(() => setCopiedNoteId(null), 1500);
  };

  // New Note Form States
  const [newTitle, setNewTitle] = useState('');
  const [newCourseId, setNewCourseId] = useState(() => (courses && courses.length > 0 ? courses[0].id : ''));
  const [newDescription, setNewDescription] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTagsStr, setNewTagsStr] = useState('');

  // Inline Custom Subject creation state
  const [showAddSubjectForm, setShowAddSubjectForm] = useState(false);
  const [tempSubjectCode, setTempSubjectCode] = useState('');
  const [tempSubjectName, setTempSubjectName] = useState('');

  React.useEffect(() => {
    if (!newCourseId && courses && courses.length > 0) {
      setNewCourseId(courses[0].id);
    }
  }, [courses, newCourseId]);

  // Comment Form State
  const [newCommentText, setNewCommentText] = useState('');

  // AI Summary States
  const [aiLoading, setAiLoading] = useState(false);
  const [activeFlashcardIndex, setActiveFlashcardIndex] = useState<number | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  // Filter & Search Logic
  const filteredNotes = notes.filter((note) => {
    const matchesCourse = selectedCourseId ? note.courseId === selectedCourseId : true;
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      note.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCourse && matchesSearch;
  });

  // Handle Like
  const handleLike = (note: LectureNote) => {
    const isAlreadyLiked = note.likedByCount > note.likes; // Just a mock toggle check
    const updated = {
      ...note,
      likes: isAlreadyLiked ? note.likes : note.likes + 1,
      likedByCount: isAlreadyLiked ? note.likedByCount - 1 : note.likedByCount + 1,
    };
    onUpdateNote(updated);
    if (selectedNote?.id === note.id) {
      setSelectedNote(updated);
    }
  };

  // Add Comment
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedNote) return;

    const newComment: Comment = {
      id: 'com_' + Date.now(),
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      text: newCommentText.trim(),
      timestamp: 'Just now',
    };

    const updatedNote = {
      ...selectedNote,
      comments: [newComment, ...selectedNote.comments],
    };

    onUpdateNote(updatedNote);
    setSelectedNote(updatedNote);
    setNewCommentText('');
  };

  // Trigger Gemini AI Helper (REST call)
  const triggerAiSummary = async (note: LectureNote) => {
    setAiLoading(true);
    setActiveFlashcardIndex(null);
    setIsFlipped(false);
    
    const matchedCourse = courses.find(c => c.id === note.courseId);

    try {
      const response = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: note.title,
          content: note.content,
          course: matchedCourse ? `${matchedCourse.code} - ${matchedCourse.name}` : ''
        }),
      });

      const data = await response.json();
      const updatedNote: LectureNote = {
        ...note,
        summary: data.summary,
        flashcards: data.flashcards
      };

      onUpdateNote(updatedNote);
      setSelectedNote(updatedNote);
    } catch (err) {
      console.error('Trigger summarizer failed:', err);
    } finally {
      setAiLoading(false);
    }
  };

  // Handle Submit New Note
  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    onAddNote({
      title: newTitle.trim(),
      courseId: newCourseId,
      author: currentUser.name,
      authorMajor: currentUser.major,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      tags: newTagsStr.split(',').map((t) => t.trim()).filter((t) => t.length > 0),
      description: newDescription.trim() || newContent.trim().substring(0, 100) + '...',
      content: newContent,
    });

    // Reset Form
    setNewTitle('');
    setNewDescription('');
    setNewContent('');
    setNewTagsStr('');
    setIsAddingNote(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent overflow-hidden relative">
      {/* 1. DETAIL VIEW SCREEN */}
      {selectedNote ? (
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/95 via-purple-950/95 to-slate-950/95 backdrop-blur-3xl text-white z-20 flex flex-col h-full overflow-y-auto">
          {/* Header */}
          <div className="bg-white/10 backdrop-blur-xl border-b border-white/10 px-4 py-3 sticky top-0 flex items-center justify-between z-10 shadow-md">
            <button
              onClick={() => setSelectedNote(null)}
              className="p-1 px-3 text-white/90 hover:text-white flex items-center gap-1.5 text-sm font-medium rounded-xl hover:bg-white/10 transition-all"
            >
              <ArrowLeft size={18} />
              <span>Back</span>
            </button>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-white bg-white/20 px-2.5 py-1 rounded-full border border-white/20">
              {courses.find((c) => c.id === selectedNote.courseId)?.code || 'Subject'}
            </span>
          </div>

          <div className="p-4 flex-1">
            {/* Metadata info */}
            <div className="mb-4">
              <h1 className="text-xl font-bold font-sans text-white tracking-tight leading-snug mb-2">
                {selectedNote.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-xs text-white/70 font-medium">
                <span className="bg-white/20 border border-white/10 text-white px-2 py-0.5 rounded-md font-bold">{selectedNote.author}</span>
                <span>•</span>
                <span>{selectedNote.date}</span>
                <span>•</span>
                <span className="italic text-white/60">{selectedNote.authorMajor}</span>
                <span>•</span>
                <button
                  onClick={(e) => handleCopyNoteCode(e, getJoinCode('NOT', selectedNote.id), selectedNote.id)}
                  className="flex items-center gap-1 bg-white/10 hover:bg-white/20 border border-white/10 px-2 py-0.5 rounded text-[10px] font-mono text-indigo-300 transition-all select-none cursor-pointer"
                >
                  <span>Share Code: {getJoinCode('NOT', selectedNote.id)}</span>
                  <span className="text-white">{copiedNoteId === selectedNote.id ? '✓' : '❐'}</span>
                </button>
              </div>
            </div>

            {/* Micro Tags Display */}
            <div className="flex flex-wrap gap-1.5 mb-5 pb-4 border-b border-white/10">
              {selectedNote.tags.map((tag) => (
                <span key={tag} className="text-[11px] font-medium bg-white/10 border border-white/10 px-2.5 py-0.5 rounded-md text-white/95">
                  #{tag}
                </span>
              ))}
            </div>

            {/* Note Body Text Content */}
            <div className="prose prose-invert max-w-none text-sm text-white/95 leading-relaxed mb-6 bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-xl font-mono whitespace-pre-wrap">
              {selectedNote.content}
            </div>

            {/* AI SMART PANEL WITH FLOATING SPARKS (GEMINI INTEGRATION) */}
            <div className="mb-6 p-4 bg-gradient-to-br from-indigo-950 to-slate-900 rounded-2xl text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-purple-500/15 rounded-full blur-xl pointer-events-none" />
              
              <div className="flex items-start justify-between mb-3 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="bg-indigo-600 p-1.5 rounded-lg text-white shadow-md">
                    <Sparkles size={16} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold tracking-tight">Gemini Study Companion</h3>
                    <p className="text-[11px] text-indigo-200">Instant AI summarization & flashcard quiz</p>
                  </div>
                </div>

                {!selectedNote.summary && !aiLoading && (
                  <button
                    onClick={() => triggerAiSummary(selectedNote)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-1.5 px-3 rounded-lg shadow-sm hover:scale-102 flex items-center gap-1 transition-all"
                  >
                    <span>Analyze Notes</span>
                  </button>
                )}

                {selectedNote.summary && !aiLoading && (
                  <button
                    onClick={() => triggerAiSummary(selectedNote)}
                    className="bg-white/10 hover:bg-white/20 text-indigo-100 font-semibold text-xs py-1 px-2 rounded-md flex items-center gap-1 transition-all"
                    title="Regenerate Summary"
                  >
                    <RefreshCw size={11} />
                    <span>Redo</span>
                  </button>
                )}
              </div>

              {/* LOADING STATE */}
              {aiLoading && (
                <div className="py-8 flex flex-col items-center justify-center gap-3 relative z-10">
                  <Loader2 size={24} className="text-indigo-400 animate-spin" />
                  <div className="text-center">
                    <p className="text-xs font-semibold text-white">Classmate AI is analyzing concepts...</p>
                    <p className="text-[10px] text-indigo-300">Organizing outline & formulating flashcards.</p>
                  </div>
                </div>
              )}

              {/* RENDER DYNAMIC AI SUMMARY */}
              {selectedNote.summary && !aiLoading && (
                <div className="text-xs text-indigo-50 leading-relaxed font-sans mt-3 space-y-3 relative z-10 border-t border-white/10 pt-3">
                  <div className="bg-indigo-900/40 p-3 rounded-xl border border-white/5">
                    <h4 className="font-bold text-white mb-1.5 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen size={12} className="text-indigo-300" /> Executive Note Summary:
                    </h4>
                    <div className="whitespace-pre-line text-indigo-100">{selectedNote.summary}</div>
                  </div>

                  {/* FLASHCARD ACADEMIC MINI MODULE */}
                  {selectedNote.flashcards && selectedNote.flashcards.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-bold text-white mb-2 text-xs uppercase tracking-wider flex items-center gap-1">
                        🔖 Active Recall Quiz ({selectedNote.flashcards.length} cards)
                      </h4>
                      
                      <div className="flex gap-1.5 mb-3">
                        {selectedNote.flashcards.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setActiveFlashcardIndex(idx);
                              setIsFlipped(false);
                            }}
                            className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${
                              activeFlashcardIndex === idx
                                ? 'bg-indigo-500 text-white shadow'
                                : 'bg-white/10 text-indigo-200 hover:bg-white/15'
                            }`}
                          >
                            Card {idx + 1}
                          </button>
                        ))}
                      </div>

                      {activeFlashcardIndex !== null && (
                        <div
                          onClick={() => setIsFlipped(!isFlipped)}
                          className="w-full bg-gradient-to-br from-indigo-50 to-white text-slate-900 p-4 rounded-xl border border-indigo-200 cursor-pointer min-h-[96px] flex flex-col justify-between hover:border-indigo-400 active:scale-99 transition-all relative select-none"
                        >
                          <span className="absolute top-1.5 right-2 text-[9px] font-bold text-indigo-400 uppercase tracking-widest">
                            {isFlipped ? 'Answer' : 'Question'}
                          </span>
                          
                          <p className="text-xs text-center font-semibold text-indigo-950 my-auto">
                            {isFlipped
                              ? selectedNote.flashcards[activeFlashcardIndex].answer
                              : selectedNote.flashcards[activeFlashcardIndex].question}
                          </p>
                          
                          <p className="text-[9px] text-center text-slate-400 mt-2">
                            (Click card to flip between question and answer)
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* LIKING & INTERACTIVE TOOLS */}
            <div className="flex items-center gap-4 py-3 border-y border-white/10 mb-6 bg-white/5 px-4 rounded-xl">
              <button
                onClick={() => handleLike(selectedNote)}
                className="flex items-center gap-1.5 text-xs font-bold text-white/90 hover:text-amber-300 active:scale-95 transition-all"
              >
                <ThumbsUp size={16} className="text-amber-400 stroke-[2.5]" />
                <span>Verify Helpful ({selectedNote.likes})</span>
              </button>
              <span className="text-white/20">|</span>
              <span className="text-xs text-white/70 font-medium">
                {selectedNote.comments.length} Class Comments
              </span>
            </div>

            {/* CLASS COMMENTS CORE ELEMENT */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-white mb-3">Discussion Board</h3>

              {/* Feed comments */}
              <div className="space-y-3 mb-4 max-h-[220px] overflow-y-auto pr-1">
                {selectedNote.comments.length === 0 ? (
                  <p className="text-xs text-white/55 py-4 text-center border border-dashed border-white/20 rounded-2xl bg-white/5">
                    No comments yet. Start the course discussion below!
                  </p>
                ) : (
                  selectedNote.comments.map((comment) => (
                    <div key={comment.id} className="bg-white/10 border border-white/10 p-3 rounded-2xl flex gap-2.5 items-start">
                      <span className="text-lg leading-none p-1.5 bg-white/20 backdrop-blur-md shadow-sm border border-white/15 rounded-xl">
                        {comment.userAvatar}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-bold text-white">{comment.userName}</span>
                          <span className="text-[10px] text-white/50 font-medium">{comment.timestamp}</span>
                        </div>
                        <p className="text-xs text-white/80 leading-normal">{comment.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Entry box */}
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Ask a question or thank author..."
                  className="flex-1 bg-white/10 border border-white/25 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-white/45 text-white placeholder-white/50"
                />
                <button
                  type="submit"
                  disabled={!newCommentText.trim()}
                  className="bg-white/20 hover:bg-white/30 border border-white/25 disabled:opacity-50 text-white p-2 rounded-xl flex items-center justify-center transition-all shadow active:scale-95"
                >
                  <Send size={15} />
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      {/* 2. ADD NOTE SHEET */}
      {isAddingNote ? (
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/95 to-slate-950/95 backdrop-blur-3xl text-white z-20 flex flex-col h-full overflow-y-auto p-5 animate-fade-in relative">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/10">
            <h2 className="text-base font-bold text-white">Share Lecture Notes</h2>
            <button
              onClick={() => setIsAddingNote(false)}
              className="text-white/75 hover:text-white text-sm font-semibold hover:bg-white/10 px-3 py-1 rounded-xl transition-all"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmitNote} className="space-y-4 pb-6 select-none">
            {showAddSubjectForm ? (
              <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl space-y-3 animate-fade-in">
                <div className="flex justify-between items-center">
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
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1.5">Select Course</label>
                  {courses.length === 0 ? (
                    <div className="text-[10px] p-2.5 rounded-xl border border-dashed border-white/20 bg-white/5 text-amber-300">
                      No subjects added yet. Add one!
                    </div>
                  ) : (
                    <select
                      value={newCourseId}
                      onChange={(e) => setNewCourseId(e.target.value)}
                      className="w-full border border-white/15 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-white/30 bg-indigo-950 font-medium text-white"
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
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[11px] h-[37px] px-3 rounded-xl flex items-center gap-1 transition-all shrink-0 active:scale-95"
                  title="Add custom subject"
                >
                  <Plus size={14} />
                  <span>+ Subject</span>
                </button>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1.5">Lecture Title</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., DNA replication Mechanics or Big-O analysis"
                className="w-full border border-white/15 bg-white/10 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-white/30 text-white placeholder-white/40"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1.5">Brief Description</label>
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Quick line on what concepts are covered so classmates can find it..."
                className="w-full border border-white/15 bg-white/10 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-white/30 text-white placeholder-white/40"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1.5">Notes Content (Markdown/Text)</label>
              <textarea
                required
                rows={10}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Paste your lecture notes, markdown definitions, summaries, diagrams data here..."
                className="w-full border border-white/15 bg-white/10 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-white/30 text-white placeholder-white/40 font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1.5">Search Keywords (Comma Separated)</label>
              <input
                type="text"
                value={newTagsStr}
                onChange={(e) => setNewTagsStr(e.target.value)}
                placeholder="Algorithms, Big-O, Calculus, DNA (no hashtags)"
                className="w-full border border-white/15 bg-white/10 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-white/30 text-white placeholder-white/40"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-white text-indigo-950 hover:bg-white/90 text-xs font-bold py-3 rounded-xl shadow-lg transition-all active:scale-99 mt-2 flex items-center justify-center gap-1.5"
            >
              <Plus size={16} /> Save & Share Note
            </button>
          </form>
        </div>
      ) : null}

      {/* 3. HOME NOTES FEED LISTING */}
      {/* Mobile-styled dynamic filter header */}
      <div className="bg-white/10 backdrop-blur-xl border-b border-white/10 px-4 pt-4 pb-3 shrink-0 shadow-lg relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 bg-white/15 backdrop-blur-md border border-white/20 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-inner">
            <Search size={15} className="text-white/70 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search lectures notes, tags..."
              className="bg-transparent border-none text-xs w-full focus:outline-none text-white placeholder-white/50"
            />
          </div>
          <button
            onClick={() => {
              setSelectedCourseId(null);
              setSearchQuery('');
            }}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            title="Reset Filters"
          >
            <SlidersHorizontal size={17} />
          </button>
        </div>

        {/* Scrollable Horizontal Course Chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none items-center">
          <button
            onClick={() => setSelectedCourseId(null)}
            className={`px-3.5 py-1 rounded-xl text-xs font-bold tracking-wide transition-all shrink-0 border ${
              selectedCourseId === null
                ? 'bg-white text-indigo-950 border-white'
                : 'bg-white/10 text-white/80 border-white/10 hover:bg-white/20 hover:text-white'
            }`}
          >
            All Courses
          </button>
          {courses.map((course) => (
            <button
              key={course.id}
              onClick={() => setSelectedCourseId(course.id)}
              className={`px-3.5 py-1 rounded-xl text-xs font-bold tracking-wide transition-all shrink-0 border ${
                selectedCourseId === course.id
                  ? 'bg-white text-indigo-950 border-white shadow-sm'
                  : 'bg-white/10 text-white/80 border-white/10 hover:bg-white/20 hover:text-white'
              }`}
            >
              {course.code}
            </button>
          ))}
          <button
            onClick={() => {
              setIsAddingNote(true);
              setShowAddSubjectForm(true);
            }}
            className="px-3 py-1 rounded-xl text-xs font-bold tracking-wide transition-all shrink-0 border bg-indigo-600 hover:bg-indigo-500 border-indigo-500 text-white shadow flex items-center gap-1 active:scale-95 cursor-pointer"
          >
            <Plus size={11} />
            <span>Add Subject</span>
          </button>
        </div>
      </div>

      {/* Notes Stream Grid */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24 relative z-0">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white/10 backdrop-blur-md border border-white/10 rounded-3xl">
            <BookOpen size={30} className="mx-auto text-white/30 mb-2" />
            <p className="text-xs font-bold text-white">No lecture notes found</p>
            <p className="text-[11px] text-white/60 mt-1 max-w-[200px] mx-auto">
              Be the first to upload lecture notes for this course!
            </p>
            <button
              onClick={() => setIsAddingNote(true)}
              className="mt-3 bg-white text-indigo-950 text-[11px] font-bold px-3 py-1.5 rounded-lg hover:bg-white/90 transition-all border border-white/20"
            >
              Upload Note
            </button>
          </div>
        ) : (
          filteredNotes.map((note) => {
            const course = courses.find((c) => c.id === note.courseId);
            return (
              <div
                key={note.id}
                onClick={() => {
                  setSelectedNote(note);
                  window.scrollTo({ top: 0 });
                }}
                className="bg-white/15 backdrop-blur-xl border border-white/20 hover:border-white/40 p-5 rounded-3xl cursor-pointer shadow-lg hover:shadow-xl transition-all active:scale-98 relative group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[10px] font-mono font-bold text-white uppercase tracking-widest bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/15">
                      {course?.code}
                    </span>
                    <div
                      onClick={(e) => handleCopyNoteCode(e, getJoinCode('NOT', note.id), note.id)}
                      className="flex items-center gap-0.5 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/20 text-indigo-300 text-[8.5px] font-mono px-2 py-0.5 rounded shadow-sm hover:text-white transition-all select-none truncate cursor-pointer"
                    >
                      <span>Code: {getJoinCode('NOT', note.id)}</span>
                      <span className="text-white">{copiedNoteId === note.id ? '✓' : '❐'}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-white/65 font-medium">{note.date}</span>
                </div>

                <h3 className="text-xs font-bold text-white leading-snug mb-1 group-hover:text-amber-300 transition-colors">
                  {note.title}
                </h3>
                
                <p className="text-[11px] text-white/80 font-medium line-clamp-2 mb-3 leading-relaxed">
                  {note.description}
                </p>

                {/* Footer labels */}
                <div className="flex items-center justify-between border-t border-white/10 pt-2.5 text-[10px] text-white/60 font-semibold select-none">
                  <div className="flex items-center gap-1.5 text-white/95 font-bold">
                    <span className="bg-white/15 px-2 py-0.5 rounded border border-white/10">By: {note.author}</span>
                  </div>
                  
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center gap-0.5 bg-white/10 px-2 py-0.5 rounded border border-white/10">
                      ⭐ {note.likes} Helpfuls
                    </span>
                    <span>•</span>
                    <span>💬 {note.comments.length} Comments</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Button (FAB) matches Material Design 3 */}
      <button
        onClick={() => setIsAddingNote(true)}
        className="absolute bottom-6 right-6 w-12 h-12 bg-white text-indigo-950 rounded-full flex items-center justify-center shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95 transition-all z-10 border border-white/20 hover:bg-white/95"
        title="Share Note"
      >
        <Plus size={22} className="stroke-[2.5]" />
      </button>
    </div>
  );
}
