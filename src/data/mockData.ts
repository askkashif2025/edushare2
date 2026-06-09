/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Course, LectureNote, StudyGroup, ChatChannel, ChatMessage, User } from '../types';

export const COURSES: Course[] = [
  { id: 'c1', code: 'CS 101', name: 'Intro to Software Engineering', color: 'indigo' },
  { id: 'c2', code: 'MATH 201', name: 'Linear Algebra & Calculus', color: 'emerald' },
  { id: 'c3', code: 'BIO 305', name: 'Genetics & Molecular Biology', color: 'rose' },
  { id: 'c4', code: 'LIT 110', name: 'World Literature & Themes', color: 'amber' },
];

export const INITIAL_USER: User = {
  id: 'u_user',
  name: 'Alex Vance',
  major: 'Computer Science',
  year: 'Sophomore',
  avatar: '🍩',
};

export const INITIAL_NOTES: LectureNote[] = [
  {
    id: 'n1',
    title: 'Intro to Big-O Notation & Complexity analysis',
    courseId: 'c1',
    author: 'Sarah Jenkins',
    authorMajor: 'Computer Science',
    date: 'June 02, 2026',
    tags: ['Algorithms', 'Complexity', 'Big-O', 'Study Guide'],
    description: 'A comprehensive guide explaining Time and Space complexity, covering O(1), O(log n), O(n), O(n log n), and O(n²). Includes practical code snippets and loops analysis.',
    content: `# Time Complexity and Space Complexity Guide

## Why care about Algorithms?
An algorithm is a step-by-step procedure to resolve a problem. Big-O notation enables us to measure how an algorithm's execution time or memory footprint scales as input sizes (n) approach infinity.

### Common Complexities from Best to Worst:
1. **O(1) - Constant Time**: Execution time remains unchanged regardless of input size. 
   - *Example*: Array index lookup, push/pop operations.
2. **O(log n) - Logarithmic Time**: Each iteration cuts the problem size in half.
   - *Example*: Binary Search.
3. **O(n) - Linear Time**: Execution time scales proportionally to input size.
   - *Example*: Single loop traversing an array.
4. **O(n log n) - Linearithmic Time**: Often found in divide-and-conquer sorting approaches.
   - *Example*: Merge Sort, Quick Sort (average case).
5. **O(n²) - Quadratic Time**: Execution time grows quadratically. Double nested loops!
   - *Example*: Bubble Sort, Selection Sort.

### Code Demonstration (O(n²)):
\`\`\`typescript
function printPairs(arr: number[]) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length; j++) {
      console.log(arr[i], arr[j]);
    }
  }
}
\`\`\`
Avoid nested loops on massive datasets!`,
    likes: 42,
    likedByCount: 42,
    comments: [
      { id: 'cm1', userName: 'John Doe', userAvatar: '🥑', text: 'This cleared up Binary Search complexity for me! Solid notes.', timestamp: '3 hours ago' },
      { id: 'cm2', userName: 'Emily Smith', userAvatar: '🎨', text: 'Does quicksort ever degrade to O(n²)?', timestamp: 'Yesterday' },
    ],
    summary: 'These lecture notes provide a foundational overview of algorithmic complexity analysis using Big-O notation. It highlights the classification of time and space complexities from best to worst: O(1), O(log n), O(n), O(n log n), and O(n²), with contextual examples and a nested loop code implementation sample to illustrate quadratic runtime hazards.',
    flashcards: [
      { question: 'What is the time complexity of a Binary Search?', answer: 'O(log n) - Logarithmic Time.' },
      { question: 'What complexity describes a single loop traversing an array of size n?', answer: 'O(n) - Linear Time.' },
      { question: 'Provide an example of an O(1) operator.', answer: 'Looking up an array index directly or pulling key elements from a hash map.' }
    ]
  },
  {
    id: 'n2',
    title: 'Linear Systems, Vector Spaces & Matrices',
    courseId: 'c2',
    author: 'Marcus Aurel',
    authorMajor: 'Mathematics',
    date: 'May 28, 2026',
    tags: ['Matrices', 'Linear Space', 'Vectors'],
    description: 'Lecture summary focusing on solving systems of linear equations using Gaussian Elimination, row reduction, and calculating matrix determinants.',
    content: `# Vector Spaces and Matrix Operations

## 1. Linear Systems
A system of linear equations can be represented compactly as $Ax = b$, where:
- $A$ is the coefficient matrix.
- $x$ is the vector of variables.
- $b$ is the constant vector.

## 2. Row Echelon Form (REF)
Using Gaussian elimination, we apply elementary row operations:
- Swap two rows.
- Multiply a row by a non-zero scalar.
- Add/subtract a multiple of one row to another.

## 3. Matrix Determinants
For a $2 \\times 2$ Matrix:
$$\\det(A) = ad - bc$$
If $\\det(A) = 0$, the matrix is singular and does not have an inverse. This relates to linear independence of column vectors.`,
    likes: 18,
    likedByCount: 18,
    comments: [
      { id: 'cm3', userName: 'Sarah Jenkins', userAvatar: '🦁', text: 'Could you add notes on Eigenvalues next week?', timestamp: '2 days ago' }
    ]
  },
  {
    id: 'n3',
    title: 'DNA Replication Mechanisms & Fork Regulation',
    courseId: 'c3',
    author: 'Jane Watson',
    authorMajor: 'Biochemistry',
    date: 'June 05, 2026',
    tags: ['DNA', 'Genetics', 'Replication'],
    description: 'Detailed analysis of the replication fork, leading and lagging strands, Okazaki fragments, and core replication enzymes (Helicase, Polymerase, Ligase).',
    content: `# DNA Replication Mechanistic Overview

Replication is semi-conservative, meaning each original strand acts as a blueprint for a new complementary strand.

## Core Enzymes at the Replication Fork:
1. **Helicase**: Unwinds the double-helix by breaking hydrogen bonds.
2. **Single-Strand Binding Proteins (SSBs)**: Stabilize unwound DNA to prevent snapping back.
3. **DNA Primase**: Lays down an RNA primer needed for DNA Polymerase to begin synthesis.
4. **DNA Polymerase III**: Synthesizes the leading strand continuously ($5' \\rightarrow 3'$) and lagging strand discontinuously ($5' \\rightarrow 3'$).
5. **DNA Ligase**: Joins Okazaki fragments together on the lagging strand by forming phosphodiester bonds.

## Troubleshooting Lagging Strand Synthesis:
Because DNA synthesis must occur from $5'$ to $3'$, the cell builds shortened segments on the lagging template strand, called **Okazaki fragments**. These require constant priming, elongation, primer replacement (via DNA Polymerase I), and ligase stitching.`,
    likes: 29,
    likedByCount: 29,
    comments: []
  }
];

export const INITIAL_GROUPS: StudyGroup[] = [
  {
    id: 'g1',
    name: 'CS101 Algorithmic Hustlers',
    courseId: 'c1',
    description: 'Weekly study clan focusing on sorting, searching, and tree traversals. We solve coding exercises together on Wednesdays and prepare for exams.',
    membersCount: 8,
    joined: true,
    upcomingEvent: {
      id: 'e1',
      title: 'Graph Traversals (BFS/DFS) Session',
      day: 'Wednesday',
      time: '16:00 - 17:30',
      location: 'Science Library Pod B'
    },
    proposals: [
      { id: 'p1', day: 'Wed', timeSlot: '16:00 - 17:30', votes: ['u_user', 'sarah', 'dan'] },
      { id: 'p2', day: 'Thu', timeSlot: '14:00 - 15:30', votes: ['marcus', 'dan'] },
      { id: 'p3', day: 'Fri', timeSlot: '17:00 - 18:30', votes: ['sarah'] }
    ]
  },
  {
    id: 'g2',
    name: 'Determinants & Linear Mappings Prep',
    courseId: 'c2',
    description: 'Cracking matrix vector spaces and transformations before the tricky midterm. Open to anyone who needs help with Linear algebra formulas!',
    membersCount: 5,
    joined: false,
    upcomingEvent: {
      id: 'e2',
      title: 'Eigenvalues and Eigenvectors Drill',
      day: 'Friday',
      time: '13:00 - 15:00',
      location: 'Math Building Room 102'
    },
    proposals: [
      { id: 'p4', day: 'Mon', timeSlot: '13:00 - 15:00', votes: ['marcus', 'james'] },
      { id: 'p5', day: 'Fri', timeSlot: '13:00 - 15:00', votes: ['marcus', 'james', 'fey'] }
    ]
  },
  {
    id: 'g3',
    name: 'DNA replication & Transcription group',
    courseId: 'c3',
    description: 'Active discussion and flashcards testing on molecular biology and genetic mapping.',
    membersCount: 4,
    joined: true,
    upcomingEvent: {
      id: 'e3',
      title: 'Protein Synthesis Flashcard Run',
      day: 'Monday',
      time: '15:00 - 16:30',
      location: 'Student Union Cafeteria'
    },
    proposals: [
      { id: 'p6', day: 'Mon', timeSlot: '15:00 - 16:30', votes: ['u_user', 'jane', 'bob'] },
      { id: 'p7', day: 'Tue', timeSlot: '11:00 - 12:30', votes: ['jane', 'alice'] }
    ]
  }
];

export const INITIAL_CHANNELS: ChatChannel[] = [
  { id: 'ch_c1', name: '#cs101-general', type: 'course', targetId: 'c1' },
  { id: 'ch_c2', name: '#math201-general', type: 'course', targetId: 'c2' },
  { id: 'ch_c3', name: '#bio305-general', type: 'course', targetId: 'c3' },
  { id: 'ch_g1', name: 'CS101 Hustlers Private', type: 'group', targetId: 'g1' },
  { id: 'ch_g3', name: 'DNA replication Group Chat', type: 'group', targetId: 'g3' },
];

export const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'm1',
    channelId: 'ch_c1',
    senderId: 'sarah',
    senderName: 'Sarah Jenkins',
    senderAvatar: '🦁',
    text: 'Hey everyone! I just uploaded my Big-O complexity study sheet in the Notes tab. Let me know if you spot any errors!',
    timestamp: '10:15 AM'
  },
  {
    id: 'm2',
    channelId: 'ch_c1',
    senderId: 'dan',
    senderName: 'Dan Brooks',
    senderAvatar: '🦉',
    text: 'Wow, thanks Sarah! This is incredibly helpful for the coding test next week.',
    timestamp: '10:18 AM'
  },
  {
    id: 'm3',
    channelId: 'ch_c2',
    senderId: 'marcus',
    senderName: 'Marcus Aurel',
    senderAvatar: '⚔️',
    text: 'Does anyone understand how to calculate eigenvectors for $3\\times3$ matrices? It takes me ages.',
    timestamp: '09:30 AM'
  },
  {
    id: 'm4',
    channelId: 'ch_g1',
    senderId: 'sarah',
    senderName: 'Sarah Jenkins',
    senderAvatar: '🦁',
    text: "Hey Hustlers! For tomorrow's Pod B session, should we bring sorting algorithms practice problems?",
    timestamp: 'Yesterday'
  },
  {
    id: 'm5',
    channelId: 'ch_g1',
    senderId: 'dan',
    senderName: 'Dan Brooks',
    senderAvatar: '🦉',
    text: 'Absolutely! Let’s prepare standard Quicksort row tracing questions.',
    timestamp: 'Yesterday'
  }
];

// List of AI Classmates who will respond to our chats
export interface AiStudentPersona {
  id: string;
  name: string;
  avatar: string;
  major: string;
  personality: string;
}

export const AI_CLASSMATES: AiStudentPersona[] = [
  {
    id: 'companion_avery',
    name: 'Avery (Procrastinator)',
    avatar: '🛌',
    major: 'Computer Science',
    personality: 'Stressed, slightly behind on homework, loves coffee, talks fast, uses phrases like "wait, when is this due?!" or "im drinking my 4th espresso". Super friendly but in a state of academic panic.'
  },
  {
    id: 'companion_jordan',
    name: 'Jordan (The Achiever)',
    avatar: '👓',
    major: 'Applied Mathematics',
    personality: 'Detailed, structured, explains everything in extremely clear step-by-step formats, loves tutoring and formula breakdowns, encouraging, uses phrases like "Let us visualize this" or "According to the textbook".'
  },
  {
    id: 'companion_studybuddy',
    name: 'StudyBuddy AI',
    avatar: '🤖',
    major: 'Educational Assistant',
    personality: 'A smart virtual peer built by classmates to act as an on-demand tutor, summarizes topics, crafts flashcards, writes pseudo-code, and analyzes schedule slots optimally.'
  }
];
