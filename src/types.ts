/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Course {
  id: string;
  code: string;
  name: string;
  color: string;
}

export interface User {
  id: string;
  name: string;
  major: string;
  year: string;
  avatar: string; // Tailwind color or icon/emoji representation
  code?: string;
}

export interface Comment {
  id: string;
  userName: string;
  userAvatar: string;
  text: string;
  timestamp: string;
}

export interface LectureNote {
  id: string;
  title: string;
  courseId: string;
  author: string;
  authorMajor: string;
  date: string;
  tags: string[];
  description: string;
  content: string;
  likes: number;
  likedByCount: number;
  comments: Comment[];
  summary?: string;
  flashcards?: { question: string; answer: string }[];
  code?: string;
}

export interface ScheduleEvent {
  id: string;
  title: string;
  day: string; // e.g., 'Monday', 'Tuesday'
  time: string; // e.g., '14:00 - 15:30'
  location: string; // e.g., 'Library Room 302' or 'Zoom Zoom'
}

export interface ScheduleProposal {
  id: string;
  day: string; // 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'
  timeSlot: string; // e.g., '15:00 - 17:00'
  votes: string[]; // User IDs who voted for this slot
}

export interface StudyGroup {
  id: string;
  name: string;
  courseId: string;
  description: string;
  membersCount: number;
  joined: boolean;
  upcomingEvent?: ScheduleEvent;
  proposals: ScheduleProposal[];
  code?: string;
}

export interface ChatChannel {
  id: string;
  name: string;
  type: 'course' | 'group';
  targetId: string; // courseId or groupId
  unread?: boolean;
  code?: string;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
  isAi?: boolean;
  image?: string; // Base64 image data
  isWhiteboard?: boolean; // True if message represents a whiteboard snapshot
  whiteboardId?: string; // ID of the referenced whiteboard
  whiteboardThumbnail?: string; // base64 preview image of the board
}

export interface DrawStroke {
  type: 'free' | 'rect' | 'circle' | 'line';
  color: string;
  width: number;
  points: { x: number; y: number }[]; // Coordinates in percentage (0-1)
}

export interface DrawText {
  id: string;
  text: string;
  x: number; // percentage (0-1)
  y: number; // percentage (0-1)
  color: string;
  fontSize: number;
}

export interface WhiteboardData {
  strokes: DrawStroke[];
  texts: DrawText[];
  lastUpdated: number;
}
