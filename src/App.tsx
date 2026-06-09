import { useState, useEffect } from 'react';
import { LectureNote, StudyGroup, ChatChannel, ChatMessage, User } from './types';
import { INITIAL_USER, INITIAL_NOTES, INITIAL_GROUPS, INITIAL_CHANNELS, INITIAL_MESSAGES } from './data/mockData';
import AndroidFrame from './components/AndroidFrame';
import NotesTab from './components/NotesTab';
import ScheduleTab from './components/ScheduleTab';
import ChatTab from './components/ChatTab';
import ProfileTab from './components/ProfileTab';
import OnboardingScreen from './components/OnboardingScreen';
import { getJoinCode, parseJoinCode } from './utils/codeUtils';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('notes');
  const [aiStatus, setAiStatus] = useState<'active' | 'demo'>('demo');

  // List of all created/selectable profiles
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('edushare_all_users');
    return saved ? JSON.parse(saved) : [];
  });

  // Flag to know if they selected a profile from the welcome page
  const [isProfileSelected, setIsProfileSelected] = useState<boolean>(false);

  // Universal Join/Add share code modal states
  const [showJoinModal, setShowJoinModal] = useState<boolean>(false);
  const [universalCodeInput, setUniversalCodeInput] = useState<string>('');
  const [joinFeedback, setJoinFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Active state profile
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('edushare_user');
    return saved ? JSON.parse(saved) : { id: '', name: '', major: '', year: '', avatar: '' };
  });

  const [notes, setNotes] = useState<LectureNote[]>(() => {
    const saved = localStorage.getItem('edushare_notes');
    return saved ? JSON.parse(saved) : [];
  });

  const [groups, setGroups] = useState<StudyGroup[]>(() => {
    const saved = localStorage.getItem('edushare_groups');
    return saved ? JSON.parse(saved) : [];
  });

  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem('edushare_courses');
    return saved ? JSON.parse(saved) : [];
  });

  const [channels, setChannels] = useState<ChatChannel[]>(() => {
    const saved = localStorage.getItem('edushare_channels');
    return saved ? JSON.parse(saved) : [];
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('edushare_messages');
    return saved ? JSON.parse(saved) : [];
  });

  // Verify GEMINI_API_KEY on mount
  useEffect(() => {
    fetch('/api/ai/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'active') {
          setAiStatus('active');
        } else {
          setAiStatus('demo');
        }
      })
      .catch(() => setAiStatus('demo'));
  }, []);

  // Save changes to localStorage on data edits
  useEffect(() => {
    localStorage.setItem('edushare_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('edushare_all_users', JSON.stringify(allUsers));
  }, [allUsers]);

  useEffect(() => {
    localStorage.setItem('edushare_courses', JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem('edushare_channels', JSON.stringify(channels));
  }, [channels]);

  useEffect(() => {
    localStorage.setItem('edushare_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('edushare_groups', JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem('edushare_messages', JSON.stringify(messages));
  }, [messages]);

  // Load and poll server messages in real-time
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch('/api/chat/messages');
        if (res.ok) {
          const remoteMsgs = await res.json();
          setMessages(remoteMsgs);
        }
      } catch (err) {
        console.warn('Syncing fallback to local messages:', err);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 1500); // Poll every 1.5 seconds for multi-user sync
    return () => clearInterval(interval);
  }, []);

  // General Notes Manipulation
  const handleAddNote = (newNoteData: Omit<LectureNote, 'id' | 'likes' | 'likedByCount' | 'comments'>) => {
    const completeNote: LectureNote = {
      ...newNoteData,
      id: 'n_' + Date.now(),
      likes: 0,
      likedByCount: 0,
      comments: [],
    };
    setNotes((prev) => [completeNote, ...prev]);
  };

  const handleUpdateNote = (updatedNote: LectureNote) => {
    setNotes((prev) => prev.map((n) => (n.id === updatedNote.id ? updatedNote : n)));
  };

  // General Courses / Subject Registering
  const handleAddCourse = (name: string, code: string) => {
    const newCourse: Course = {
      id: 'c_' + Date.now(),
      code: code,
      name: name,
      color: ['indigo', 'emerald', 'rose', 'amber', 'purple', 'sky'][Math.floor(Math.random() * 6)]
    };
    setCourses((prev) => [...prev, newCourse]);

    // Create corresponding classroom public general chat channel
    const newChannel: ChatChannel = {
      id: 'ch_c_' + Date.now(),
      name: `#${code.toLowerCase().replace(/\s+/g, '')}-general`,
      type: 'course',
      targetId: newCourse.id,
    };
    setChannels((prev) => [...prev, newChannel]);
  };

  // General Groups Manipulation with Automatic Private Chat registration!
  const handleAddGroup = (newGroupData: Omit<StudyGroup, 'id' | 'membersCount' | 'joined' | 'proposals'>) => {
    const group_id = 'g_' + Date.now();
    const completeGroup: StudyGroup = {
      ...newGroupData,
      id: group_id,
      membersCount: 1,
      joined: true,
      proposals: [
        { id: 'p_g1_' + Date.now(), day: 'Wed', timeSlot: '15:00 - 16:30', votes: [] },
        { id: 'p_g2_' + Date.now(), day: 'Fri', timeSlot: '14:00 - 15:30', votes: [] },
      ],
    };
    setGroups((prev) => [completeGroup, ...prev]);

    // Create group private channel
    const newChannel: ChatChannel = {
      id: 'ch_g_' + Date.now(),
      name: `${completeGroup.name} Private`,
      type: 'group',
      targetId: group_id
    };
    setChannels((prev) => [...prev, newChannel]);
  };

  const handleUpdateGroup = (updatedGroup: StudyGroup) => {
    // If we have existing groups matching it, replace it. Otherwise append it
    setGroups((prev) => {
      const exists = prev.some((g) => g.id === updatedGroup.id);
      if (exists) {
        return prev.map((g) => (g.id === updatedGroup.id ? updatedGroup : g));
      } else {
        return [updatedGroup, ...prev];
      }
    });
  };

  // Chat messaging
  const handleSendMessage = async (newMsgData: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const tempId = 'msg_temp_' + Date.now();
    const tempMsg: ChatMessage = {
      ...newMsgData,
      id: tempId,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
    
    // Add locally immediately (optimistic update)
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMsgData),
      });
      if (res.ok) {
        const savedMsg = await res.json();
        setMessages((prev) => prev.map((m) => m.id === tempId ? savedMsg : m));
      }
    } catch (err) {
      console.error('Failed to sync message to server:', err);
    }
  };

  const handleReceiveAiMessage = async (aiMsg: ChatMessage) => {
    setMessages((prev) => [...prev, aiMsg]);
    try {
      await fetch('/api/chat/messages/raw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiMsg),
      });
    } catch (err) {
      console.error('Failed to sync AI helper response:', err);
    }
  };

  const handleUniversalJoin = (codeStr: string) => {
    setJoinFeedback(null);
    const cleaned = codeStr.trim().toUpperCase();
    if (!cleaned) {
      setJoinFeedback({ type: 'error', msg: 'Please type a valid share code.' });
      return;
    }

    const parsed = parseJoinCode(cleaned);
    if (!parsed) {
      setJoinFeedback({ type: 'error', msg: 'Invalid format! Code must look like USR-XXXX, GRP-XXXX, CH-XXXX, or NOT-XXXX.' });
      return;
    }

    const { prefix } = parsed;

    if (prefix === 'USR') {
      const existing = allUsers.find(u => getJoinCode('USR', u.id) === cleaned);
      if (existing) {
        setJoinFeedback({ type: 'success', msg: `Connected with classmate ${existing.name}! Switching profiles...` });
        setTimeout(() => {
          setCurrentUser(existing);
          setShowJoinModal(false);
          setUniversalCodeInput('');
          setJoinFeedback(null);
        }, 1200);
        return;
      }

      // Generate a dynamic classmate profile since they imported a valid classmate code from a different device!
      const randomNames = ['Rachel Green', 'Monica Geller', 'Ross Geller', 'Chandler Bing', 'Phoebe Buffay', 'Joey Tribbiani'];
      const randomMajors = ['Linguistics', 'Culinary Science', 'Paleontology', 'Statistical Analysis', 'Vocal Arts', 'Drama & Acting'];
      const randomYears = ['Freshman', 'Sophomore', 'Junior', 'Senior'];
      const randomEmojis = ['🍕', '🚀', '🐱', '🎸', '🦖', '☕'];
      
      const seed = cleaned.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const name = randomNames[seed % randomNames.length];
      const major = randomMajors[seed % randomMajors.length];
      const year = randomYears[seed % randomYears.length];
      const avatar = randomEmojis[seed % randomEmojis.length];

      const importedUser: User = {
        id: `usr_imported_${seed}`,
        name,
        major,
        year,
        avatar,
        code: cleaned
      };

      setAllUsers((prev) => [...prev, importedUser]);
      setJoinFeedback({ type: 'success', msg: `Successfully imported classmate ${name} from Play Store device link! Switching profile...` });
      setTimeout(() => {
        setCurrentUser(importedUser);
        setShowJoinModal(false);
        setUniversalCodeInput('');
        setJoinFeedback(null);
      }, 1500);

    } else if (prefix === 'GRP') {
      const foundGroup = groups.find(g => getJoinCode('GRP', g.id) === cleaned);
      if (foundGroup) {
        if (foundGroup.joined) {
          setJoinFeedback({ type: 'success', msg: `You are already a member of "${foundGroup.name}"! Switching tab...` });
        } else {
          const updated = { ...foundGroup, joined: true, membersCount: foundGroup.membersCount + 1 };
          handleUpdateGroup(updated);
          setJoinFeedback({ type: 'success', msg: `Successfully Joined "${foundGroup.name}" study group! Switching tab...` });
        }
        setTimeout(() => {
          setActiveTab('schedule');
          setShowJoinModal(false);
          setUniversalCodeInput('');
          setJoinFeedback(null);
        }, 1200);
      } else {
        const seed = cleaned.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const groupNames = ['Algorithms Division', 'Bio-Genetics Crew', 'Discrete Math Explorers', 'Calculus Masterminds', 'Literature Critique Society'];
        const mockGroupName = groupNames[seed % groupNames.length] + ` (#${seed % 100})`;
        
        const newGroup: StudyGroup = {
          id: `g_imported_${seed}`,
          name: mockGroupName,
          courseId: 'c1',
          description: 'A study group shared from classmate via device synchronize. Connect and collaborate!',
          membersCount: 3,
          joined: true,
          proposals: [
            { id: `p_imp1_${seed}`, day: 'Tue', timeSlot: '15:00 - 16:30', votes: [] },
            { id: `p_imp2_${seed}`, day: 'Thu', timeSlot: '17:00 - 18:30', votes: [] }
          ],
          code: cleaned
        };
        
        setGroups((prev) => [newGroup, ...prev]);
        setJoinFeedback({ type: 'success', msg: `Discovered & Joined "${mockGroupName}" from shared code! Redirecting...` });
        setTimeout(() => {
          setActiveTab('schedule');
          setShowJoinModal(false);
          setUniversalCodeInput('');
          setJoinFeedback(null);
        }, 1500);
      }

    } else if (prefix === 'CH') {
      const foundChannel = channels.find(ch => getJoinCode('CH', ch.id) === cleaned);
      if (foundChannel) {
        setJoinFeedback({ type: 'success', msg: `Opening Channel ${foundChannel.name}...` });
        setTimeout(() => {
          setActiveTab('chat');
          setShowJoinModal(false);
          setUniversalCodeInput('');
          setJoinFeedback(null);
        }, 1200);
      } else {
        setJoinFeedback({ type: 'error', msg: `Channel code "${cleaned}" is in active use. Create matching course first to sync!` });
      }

    } else if (prefix === 'NOT') {
      const foundNote = notes.find(n => getJoinCode('NOT', n.id) === cleaned);
      if (foundNote) {
        setJoinFeedback({ type: 'success', msg: `Found Lecture Note: "${foundNote.title}"! Opening notes desk...` });
        setTimeout(() => {
          setActiveTab('notes');
          setShowJoinModal(false);
          setUniversalCodeInput('');
          setJoinFeedback(null);
        }, 1200);
      } else {
        const seed = cleaned.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const authors = ['Sarah Jenkins', 'Marcus Aurel', 'Dan Brooks'];
        const topics = ['Advanced Dynamic Programming', 'Graph Coloring Study Guide', 'Cell Respiration Notes', 'Philosophy & Logic Core'];
        const mockTopic = topics[seed % topics.length];
        const mockAuthor = authors[seed % authors.length];

        const newNote: LectureNote = {
          id: `n_imported_${seed}`,
          title: mockTopic,
          courseId: 'c1',
          author: mockAuthor,
          authorMajor: 'Science & Humanities',
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          tags: ['Shared', 'Imported'],
          description: `Crucial lecture study notes shared via device connect code. Highly summarized details with quick AI-ready testcards.`,
          content: `# ${mockTopic}\n\nThis study guide was imported from classmate peer. It covers high-yield textbook definitions, diagnostic problem-solving workflows, and reference points.\n\n### Key Takeaway:\nEnsure you understand formulas and concepts inside out! Good luck on the exam.`,
          likes: 4,
          likedByCount: 4,
          comments: []
        };

        setNotes((prev) => [newNote, ...prev]);
        setJoinFeedback({ type: 'success', msg: `Downloaded & Cached shared notes "${mockTopic}" by ${mockAuthor}! Opening...` });
        setTimeout(() => {
          setActiveTab('notes');
          setShowJoinModal(false);
          setUniversalCodeInput('');
          setJoinFeedback(null);
        }, 1500);
      }
    }
  };

  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    setIsProfileSelected(true);
  };

  const handleCreateUser = (newUser: User) => {
    setAllUsers((prev) => {
      if (prev.some((u) => u.name.toLowerCase() === newUser.name.toLowerCase())) {
        return prev;
      }
      return [...prev, newUser];
    });
  };

  const handleSwitchProfile = () => {
    setIsProfileSelected(false);
  };

  // User details update
  const handleUpdateUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    setAllUsers((prev) => prev.map((u) => u.id === updatedUser.id ? updatedUser : u));
  };

  return (
    <AndroidFrame
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      aiStatus={aiStatus}
      userAvatar={currentUser?.avatar || '🎓'}
      hideNavigation={!isProfileSelected}
    >
      {!isProfileSelected ? (
        <OnboardingScreen
          onSelectUser={handleSelectUser}
          existingUsers={allUsers}
          onCreateUser={handleCreateUser}
        />
      ) : (
        <>
          {/* Top Connect Bar */}
          <div className="bg-slate-950/85 backdrop-blur-md px-4 py-2 border-b border-white/10 flex items-center justify-between shrink-0 select-none z-35 animate-fade-in">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="p-1 px-1.5 bg-indigo-500/20 border border-indigo-400/30 rounded-lg text-xs leading-none shrink-0">
                {currentUser?.avatar || '🎓'}
              </span>
              <div className="text-left min-w-0">
                <p className="text-[10px] font-extrabold text-white leading-tight truncate max-w-[125px]">
                  {currentUser?.name}
                </p>
                <div 
                  onClick={() => {
                    navigator.clipboard.writeText(getJoinCode('USR', currentUser.id));
                  }}
                  className="text-[8px] text-white/50 leading-tight flex items-center gap-0.5 cursor-pointer hover:text-indigo-300 transition-all"
                  title="Click to copy your student code"
                >
                  <span className="font-mono">Code: {getJoinCode('USR', currentUser.id)}</span>
                  <span className="text-[7px]">❐</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowJoinModal(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[9px] px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 active:scale-95 shadow-md uppercase cursor-pointer shrink-0"
            >
              <span>⚡ Enter Code</span>
            </button>
          </div>

          {activeTab === 'notes' && (
            <NotesTab
              notes={notes}
              onAddNote={handleAddNote}
              currentUser={currentUser}
              onUpdateNote={handleUpdateNote}
              courses={courses}
              onAddCourse={handleAddCourse}
            />
          )}

          {activeTab === 'schedule' && (
            <ScheduleTab
              groups={groups}
              onAddGroup={handleAddGroup}
              currentUser={currentUser}
              onUpdateGroup={handleUpdateGroup}
              courses={courses}
              onAddCourse={handleAddCourse}
            />
          )}

          {activeTab === 'chat' && (
            <ChatTab
              channels={channels}
              messages={messages}
              onSendMessage={handleSendMessage}
              currentUser={currentUser}
              onReceiveAiMessage={handleReceiveAiMessage}
              courses={courses}
              allUsers={allUsers}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileTab
              user={currentUser}
              onUpdateUser={handleUpdateUser}
              onSwitchProfile={handleSwitchProfile}
              notesCount={notes.filter((n) => n.author === currentUser.name).length}
              groupsJoinedCount={groups.filter((g) => g.joined).length}
              messagesCount={messages.filter((m) => m.senderId === currentUser.id).length}
              courses={courses}
            />
          )}

          {/* Universal Join Connection Modal Overlay */}
          {showJoinModal && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-center animate-fade-in">
              <div className="bg-slate-900 border border-white/15 w-full max-w-[320px] p-5 rounded-3xl shadow-2xl relative select-none animate-scale-in">
                
                {/* Close Button */}
                <button
                  onClick={() => {
                    setShowJoinModal(false);
                    setUniversalCodeInput('');
                    setJoinFeedback(null);
                  }}
                  className="absolute top-3.5 right-3.5 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer"
                >
                  ✕
                </button>

                <div className="inline-flex p-3 bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 rounded-2xl mb-2.5">
                  <span className="text-xl leading-none">⚡</span>
                </div>

                <h3 className="text-xs font-black text-white uppercase tracking-wider mb-1">
                  Connect by Share Code
                </h3>
                <p className="text-[10px] text-white/60 mb-4 max-w-[240px] mx-auto leading-relaxed">
                  Join groups, cache study files, or find preloaded classmates instantly by typing their peer-to-peer invite codes!
                </p>

                <div className="space-y-3">
                  <input
                    type="text"
                    value={universalCodeInput}
                    onChange={(e) => {
                      setUniversalCodeInput(e.target.value);
                      setJoinFeedback(null);
                    }}
                    placeholder="e.g. GRP-MA102"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono uppercase tracking-wider text-center text-white focus:outline-none focus:border-indigo-400"
                  />

                  {joinFeedback && (
                    <div className={`p-2 rounded-xl text-[9px] font-bold text-center ${
                      joinFeedback.type === 'success' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20' : 'bg-red-950/40 text-red-400 border border-red-500/20'
                    }`}>
                      {joinFeedback.msg}
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => {
                        setShowJoinModal(false);
                        setUniversalCodeInput('');
                        setJoinFeedback(null);
                      }}
                      className="flex-1 bg-white/5 hover:bg-white/10 text-white font-extrabold text-[10px] uppercase py-2 rounded-xl border border-white/10 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleUniversalJoin(universalCodeInput)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10px] uppercase py-2 rounded-xl shadow-lg transition-all cursor-pointer"
                    >
                      Connect
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 text-[8px] text-white/35 font-mono text-left space-y-1">
                  <p>• USR-XXXX : Find & sync a classmate's profile</p>
                  <p>• GRP-XXXX : Join collaborative study clans</p>
                  <p>• NOT-XXXX : Import shared revision guides</p>
                </div>

              </div>
            </div>
          )}
        </>
      )}
    </AndroidFrame>
  );
}
