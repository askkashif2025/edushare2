/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ChatChannel, ChatMessage, User, Course } from '../types';
import { HelpCircle, Send, Users, AlertTriangle, Sparkles, Loader2, Bot, AlertCircle, Image, Palette, Mic, Square, Trash2 } from 'lucide-react';
import { AiStudentPersona } from '../data/mockData';
import WhiteboardModal from './WhiteboardModal';
import { getJoinCode } from '../utils/codeUtils';

function VoicePlayButton({ msgId, duration }: { msgId: string; duration: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<any>(null);

  const togglePlay = () => {
    if (isPlaying) {
      clearInterval(intervalRef.current);
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      // Play brief synth cue
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(329.63, ctx.currentTime); // E4 cue
          osc.frequency.exponentialRampToValueAtTime(440.00, ctx.currentTime + 0.12); // A4 cue
          gain.gain.setValueAtTime(0.04, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.2);
        }
      } catch (e) {
        // Safe to ignore autoplay policies
      }

      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(intervalRef.current);
            setIsPlaying(false);
            return 0;
          }
          return prev + 5;
        });
      }, 250);
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="flex items-center gap-2.5 p-2 bg-white/10 border border-white/10 rounded-2xl max-w-[220px] select-none text-white my-1 text-left">
      <button
        type="button"
        onClick={togglePlay}
        className="w-7 h-7 rounded-full bg-white text-indigo-950 flex items-center justify-center hover:scale-105 active:scale-95 transition-all outline-none shrink-0"
      >
        {isPlaying ? (
          <span className="flex gap-0.5 justify-center items-center">
            <span className="w-[2px] h-3 bg-indigo-950 rounded-full animate-pulse" />
            <span className="w-[2px] h-3 bg-indigo-950 rounded-full animate-pulse" />
          </span>
        ) : (
          <span className="ml-0.5 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[8px] border-l-indigo-950" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between text-[7px] text-white/60 mb-0.5 uppercase tracking-wide font-mono font-bold">
          <span className="flex items-center gap-0.5 text-indigo-300">
            <span className={`w-1 h-1 rounded-full bg-rose-500 ${isPlaying ? 'animate-ping' : ''}`} />
            <span>{isPlaying ? 'PLAYING AUDIO' : 'VOICE RECORDING'}</span>
          </span>
          <span>{duration}</span>
        </div>
        
        {/* Wavy seeker slider bar bar code wave */}
        <div className="h-3 flex items-center gap-[2px] relative overflow-hidden">
          {[12, 18, 6, 24, 14, 8, 20, 10, 16, 22, 10, 15, 7, 21, 13, 9, 18].map((val, idx) => {
            const isPlayed = progress > (idx / 17) * 100;
            return (
              <div
                key={idx}
                className="w-[1.5px] rounded-full transition-colors"
                style={{
                  height: `${isPlaying ? Math.max(3, val + Math.sin(progress/5 + idx)*4) : val}px`,
                  backgroundColor: isPlayed ? 'rgb(129, 140, 248)' : 'rgba(255, 255, 255, 0.3)'
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface ChatTabProps {
  channels: ChatChannel[];
  messages: ChatMessage[];
  onSendMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  currentUser: User;
  onReceiveAiMessage: (message: ChatMessage) => void;
  courses: Course[];
  allUsers: User[];
}

export default function ChatTab({
  channels,
  messages,
  onSendMessage,
  currentUser,
  onReceiveAiMessage,
  courses,
  allUsers,
}: ChatTabProps) {
  const [selectedChannelId, setSelectedChannelId] = useState(() => channels.length > 0 ? channels[0].id : '');
  const [newMsgText, setNewMsgText] = useState('');
  
  // Dynamic added friends check
  const addedFriends = allUsers.filter((u) => u.id !== currentUser.id);

  const [activePersona, setActivePersona] = useState<AiStudentPersona>(() => {
    if (addedFriends.length > 0) {
      const first = addedFriends[0];
      return {
        id: first.id,
        name: first.name,
        avatar: first.avatar || '🎓',
        major: first.major || 'Classmate',
        personality: `${first.name} is a classmate majoring in ${first.major}.`
      };
    }
    return {
      id: 'companion_schoolmate_ai',
      name: 'Classmate AI',
      avatar: '🤖',
      major: 'Peer Companion',
      personality: 'A friendly and supportive classmate assistant that helps answer studying questions.'
    };
  });

  const [typingState, setTypingState] = useState<string | null>(null);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState<boolean>(false);
  
  // Custom channel copy state
  const [copiedChannelId, setCopiedChannelId] = useState<string | null>(null);

  // Voice Recording simulation states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<any>(null);

  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecording]);

  useEffect(() => {
    if (addedFriends.length > 0) {
      const isStillFriend = addedFriends.some((f) => f.id === activePersona.id);
      if (!isStillFriend) {
        const first = addedFriends[0];
        setActivePersona({
          id: first.id,
          name: first.name,
          avatar: first.avatar || '🎓',
          major: first.major || 'Classmate',
          personality: `${first.name} is a classmate majoring in ${first.major}.`
        });
      }
    }
  }, [allUsers, currentUser]);

  useEffect(() => {
    if (!selectedChannelId && channels.length > 0) {
      setSelectedChannelId(channels[0].id);
    }
  }, [channels, selectedChannelId]);

  const activeChannel = channels.find((ch) => ch.id === selectedChannelId);

  // Filter messages belonging to active channel
  const filteredMessages = messages.filter((msg) => msg.channelId === selectedChannelId);

  // Scrolling reference
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedChannelId, typingState]);

  // Handle simulated AI responder fetch
  const triggerAiResponseSim = async (userMsgText: string) => {
    if (!activeChannel) return;
    setTypingState(activePersona.name);

    setTimeout(async () => {
      try {
        // Get recent conversation matching this channel for stateful context
        const recentMessages = messages
          .filter(m => m.channelId === selectedChannelId)
          .concat({
            id: 'temp_user',
            channelId: selectedChannelId,
            senderId: currentUser.id,
            senderName: currentUser.name,
            senderAvatar: currentUser.avatar,
            text: userMsgText,
            timestamp: 'Just now'
          });

        const response = await fetch('/api/gemini/companion-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: recentMessages,
            targetPersona: activePersona,
            channelName: activeChannel.name
          }),
        });

        const data = await response.json();

        // Dispatch simulated classmate AI response to main state
        const aiResponseMsg: ChatMessage = {
          id: 'msg_ai_' + Date.now(),
          channelId: selectedChannelId,
          senderId: activePersona.id,
          senderName: `${activePersona.name} (${activePersona.major})`,
          senderAvatar: activePersona.avatar,
          text: data.text,
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          isAi: true,
        };

        onReceiveAiMessage(aiResponseMsg);
      } catch (err) {
        console.error('Failed to get roommate chatbot response:', err);
      } finally {
        setTypingState(null);
      }
    }, 1200); // Small, realistic delay to feel like a phone interface
  };

  // Handle send message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsgText.trim() || !activeChannel) return;

    const userMsgText = newMsgText.trim();
    setNewMsgText('');

    // Send user message
    onSendMessage({
      channelId: selectedChannelId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      text: userMsgText,
    });

    triggerAiResponseSim(userMsgText);
  };

  const startVoiceRecording = () => {
    // Synth trigger feedback beep
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch (_) {}

    setIsRecording(true);
    setRecordingSeconds(0);
  };

  const cancelRecording = () => {
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const finishAndSendVoice = () => {
    if (recordingSeconds === 0) {
      setIsRecording(false);
      return;
    }
    const finalDuration = `${Math.floor(recordingSeconds / 60)}:${(recordingSeconds % 60).toString().padStart(2, '0')}`;
    setIsRecording(false);
    setRecordingSeconds(0);

    // Send mock voice note chat message!
    onSendMessage({
      channelId: selectedChannelId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      text: `🎤 Shared a Voice Note (${finalDuration})`,
      isVoice: true,
      voiceDuration: finalDuration,
    });

    triggerAiResponseSim(`[Voice message sent by ${currentUser.name} of duration ${finalDuration}. React with enthusiasm as a support studying peer!]`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64Str = reader.result as string;
      onSendMessage({
        channelId: selectedChannelId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar,
        text: '📸 Shared a picture with the squad',
        image: base64Str,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleWhiteboardShare = (thumbnail: string) => {
    onSendMessage({
      channelId: selectedChannelId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      text: '🎨 Active whiteboard co-sketch session posted. Click Co-Draw below to participate!',
      isWhiteboard: true,
      whiteboardId: selectedChannelId,
      whiteboardThumbnail: thumbnail,
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent overflow-hidden">
      
      {/* 1. CHANNELS DRAWER HEADER AT TOP OF TAB */}
      <div className="bg-white/10 backdrop-blur-xl border-b border-white/10 p-3 shrink-0 shadow-lg relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
            <h2 className="text-xs font-extrabold text-white uppercase tracking-widest flex items-center gap-1.5 shrink-0">
              💬 Active Collaborations
            </h2>
            {activeChannel && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(getJoinCode('CH', activeChannel.id));
                  setCopiedChannelId(activeChannel.id);
                  setTimeout(() => setCopiedChannelId(null), 1500);
                }}
                className="bg-indigo-500/20 hover:bg-indigo-500/35 border border-indigo-400/20 text-indigo-300 text-[8.5px] font-mono px-2 py-0.5 rounded shadow-sm hover:text-white transition-all flex items-center gap-0.5 select-none cursor-pointer truncate max-w-[140px]"
                title="Click to copy Chat Channel Code"
              >
                <span>Code: {getJoinCode('CH', activeChannel.id)}</span>
                <span className="text-white">{copiedChannelId === activeChannel.id ? '✓' : '❐'}</span>
              </button>
            )}
          </div>
          <span className="text-[9px] text-white/70 font-bold bg-white/15 px-2 py-0.5 rounded-md border border-white/10 shrink-0 ml-1">
            {channels.length} Rooms
          </span>
        </div>

        {/* Channels horizontal filter lists */}
        <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar select-none">
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setSelectedChannelId(channel.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all border ${
                selectedChannelId === channel.id
                  ? 'bg-white text-indigo-950 border-white shadow-md'
                  : 'bg-white/10 border-white/10 text-white/80 hover:bg-white/20 hover:text-white'
              }`}
            >
              {channel.type === 'course' ? '#' : '👥 '} {channel.name.replace('#', '')}
            </button>
          ))}
        </div>
      </div>

      {/* 2. CHAT FEED COMPONENT */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-transparent min-h-0 relative z-0">
        
        {/* ROOM INTRODUCTION GUIDE */}
        <div className="text-center py-4 bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl mx-auto max-w-[340px] px-4 select-none shadow-md">
          <Sparkles size={16} className="text-amber-400 mx-auto animate-pulse mb-1.5" />
          <h3 className="text-xs font-bold text-white leading-none">
            Welcome to {activeChannel?.name || 'Class Discussion'}!
          </h3>
          <p className="text-[10px] text-white/70 leading-normal mt-1.5 max-w-[280px] mx-auto">
            Classmates collaborate here in real-time. Ask a question or suggest study plans, and see classmates respond instantly below.
          </p>
        </div>

        {filteredMessages.map((message) => {
          const isMe = message.senderId === currentUser.id;
          return (
            <div
              key={message.id}
              className={`flex gap-2 items-start ${isMe ? 'flex-row-reverse' : ''}`}
            >
              {/* Profile Avatar */}
              <span className="text-lg leading-none p-1.5 bg-white/20 backdrop-blur-md border border-white/15 rounded-xl shadow-sm shrink-0 m-0 select-none">
                {message.senderAvatar}
              </span>

              {/* Message Content wrap */}
              <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-1.5 mb-0.5 select-none">
                  <span className="text-[10px] font-extrabold text-white/90 leading-none">
                    {message.senderName}
                  </span>
                  <span className="text-[8px] text-white/50 leading-none">{message.timestamp}</span>
                </div>

                 <div
                  className={`px-3.5 py-2.5 rounded-2xl text-[11px] leading-relaxed shadow-lg break-words ${
                    isMe
                      ? 'bg-white/30 backdrop-blur-md border border-white/30 text-white rounded-tr-none'
                      : message.isAi
                      ? 'bg-violet-950/40 backdrop-blur-md border border-violet-500/30 text-emerald-100 rounded-tl-none font-sans font-medium'
                      : 'bg-white/15 backdrop-blur-md border border-white/11 text-white rounded-tl-none'
                  }`}
                >
                  {message.isVoice ? (
                    <VoicePlayButton msgId={message.id} duration={message.voiceDuration || "0:05"} />
                  ) : (
                    <div>{message.text}</div>
                  )}

                  {/* Shared Picture Photo Asset */}
                  {message.image && (
                    <div className="mt-2 rounded-xl overflow-hidden border border-white/20 shadow-inner max-w-full">
                      <img
                        src={message.image}
                        alt="Shared image"
                        className="max-h-48 object-cover w-full cursor-zoom-in hover:opacity-95 transition-all"
                        referrerPolicy="no-referrer"
                        onClick={() => {
                          const w = window.open();
                          if (w) {
                            w.document.write(`<img src="${message.image}" style="max-width:100%; max-height:100vh; display:block; margin:auto; background:#0f172a;"/>`);
                          }
                        }}
                      />
                    </div>
                  )}

                  {/* Shared Whiteboard Session interactive blueprint card */}
                  {message.isWhiteboard && message.whiteboardThumbnail && (
                    <div className="mt-2.5 bg-slate-900/90 border border-white/10 rounded-2xl p-3 text-white max-w-[240px] shadow-2xl overflow-hidden select-none">
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-300">Live whiteboard room</span>
                      </div>
                      
                      <div className="rounded-xl overflow-hidden border border-white/15 bg-slate-950 aspect-[4/3] relative">
                        <img
                          src={message.whiteboardThumbnail}
                          alt="Whiteboard state preview"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsWhiteboardOpen(true)}
                        className="mt-2.5 w-full py-2 bg-white hover:bg-white/95 text-indigo-950 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md cursor-pointer"
                      >
                        <Palette size={11} className="text-indigo-600 shrink-0" />
                        <span>Co-Draw Desk</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing and simulation state */}
        {typingState && (
          <div className="flex gap-2 items-center animate-pulse select-none">
            <span className="text-xs bg-white/10 text-white font-semibold px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1.5 animate-pulse">
              <Loader2 size={10} className="animate-spin text-white" />
              {typingState} is entering study replies...
            </span>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* 3. PEER CHATBOT SELECTION BAR (SIMULATE CLASSMATES CONTROLLER) */}
      <div className="bg-slate-950/70 backdrop-blur-xl px-4 py-3 shrink-0 border-t border-white/10 text-white select-none text-left">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Bot size={14} className="text-indigo-300" />
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">
              My Added Friends ({addedFriends.length})
            </span>
          </div>
          <span className="text-[9px] text-slate-400 italic">Conversing with:</span>
        </div>

        {/* Persona toggle grid buttons */}
        {addedFriends.length === 0 ? (
          <div className="text-[9px] text-white/50 bg-white/5 p-2 rounded-xl border border-white/5 text-center font-medium mt-1.5 leading-snug">
            ⚠️ No classmates added yet. Enter a friend's sharing code (e.g. USR-XYZ) in the "Connect" input at the top to add friends!
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5 mt-1.5">
            {addedFriends.map((friend) => (
              <button
                key={friend.id}
                onClick={() => setActivePersona({
                  id: friend.id,
                  name: friend.name,
                  avatar: friend.avatar || '🎓',
                  major: friend.major || 'Undergrad',
                  personality: `${friend.name} is a student majoring in ${friend.major}. They study collaboratively with you.`
                })}
                className={`py-1.5 px-2.5 rounded-xl text-[10px] transition-all flex items-center justify-start gap-1.5 font-semibold border ${
                  activePersona.id === friend.id
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md font-extrabold scale-102'
                    : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                }`}
                title={`${friend.name} - ${friend.major}`}
              >
                <span className="text-sm leading-none">{friend.avatar || '🎓'}</span>
                <span className="truncate">{friend.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 4. CHAT INPUT BAR */}
      <div className="bg-white/10 backdrop-blur-xl border-t border-white/20 px-3 py-3 shrink-0 z-10 shadow-[0_-8px_32px_rgba(0,0,0,0.1)] relative text-left">
        {isRecording ? (
          <div className="flex gap-2 items-center justify-between animate-fade-in py-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
              <span className="text-xs font-mono font-extrabold text-white uppercase tracking-wider">
                Rec: {Math.floor(recordingSeconds / 60)}:${(recordingSeconds % 60).toString().padStart(2, '0')}
              </span>
              <span className="text-[10px] text-indigo-300 italic animate-pulse hidden sm:inline font-mono">Simulated mic wave...</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={cancelRecording}
                className="bg-white/10 hover:bg-white/15 text-rose-300 hover:text-rose-400 p-2 rounded-xl transition-all active:scale-95 flex items-center justify-center border border-white/10 shadow-md"
                title="Discard recording"
              >
                <Trash2 size={13} />
              </button>
              
              <button
                type="button"
                onClick={finishAndSendVoice}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-2 px-3.5 rounded-xl transition-all active:scale-95 flex items-center gap-1.5 shadow-lg select-none"
              >
                <Square size={10} className="fill-white font-black" />
                <span>Stop & Send</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex gap-2 items-center">
            {/* Hidden File Picker Tag for Image Sharing */}
            <input
              type="file"
              id="chat-photo-picker"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="chat-photo-picker"
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-md shrink-0"
              title="Share picture/photo"
            >
              <Image size={14} />
            </label>

            {/* Real-time board co-sketching launcher button */}
            <button
              type="button"
              onClick={() => setIsWhiteboardOpen(true)}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-md shrink-0"
              title="Open shared whiteboard"
            >
              <Palette size={14} />
            </button>

            {/* Microphone Button */}
            <button
              type="button"
              onClick={startVoiceRecording}
              className="p-2.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 border border-indigo-500/30 text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-md shrink-0"
              title="Record Voice Note"
            >
              <Mic size={14} />
            </button>

            <input
              type="text"
              value={newMsgText}
              onChange={(e) => setNewMsgText(e.target.value)}
              placeholder={`Message ${activeChannel?.name || 'Class discussions'}...`}
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-white/40 text-white placeholder-white/50 min-w-0"
            />
            
            <button
              type="submit"
              disabled={!newMsgText.trim() || typingState !== null}
              className="bg-white text-indigo-950 hover:bg-white/90 disabled:opacity-50 p-2.5 px-4 rounded-xl flex items-center justify-center shadow transition-all active:scale-95 text-xs font-black uppercase tracking-wider gap-1.5 shrink-0"
            >
              <Send size={11} className="stroke-[2.5]" />
              <span>Send</span>
            </button>
          </form>
        )}
      </div>

      {/* RENDER MODAL WHITEBOARD CHAT WORKSPACE OVERLAY */}
      {isWhiteboardOpen && activeChannel && (
        <WhiteboardModal
          channelId={selectedChannelId}
          channelName={activeChannel.name}
          currentUser={currentUser}
          onClose={() => setIsWhiteboardOpen(false)}
          onShareToChat={handleWhiteboardShare}
        />
      )}
    </div>
  );
}
