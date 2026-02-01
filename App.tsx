/**
 * App.tsx - 레이아웃 규격화 및 폭 동기화 적용
 */
import React, { useState, useEffect } from 'react';
import { AppMode, Schedule, Member, Note } from './types';
import Header from './components/Header';
import CalendarView from './components/Calendar/CalendarView';
import ScheduleDetail from './components/Calendar/ScheduleDetail';
import MemberView from './components/Member/MemberView';
import NoteView from './components/Note/NoteView';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.CALENDAR);
  const [appTitle, setAppTitle] = useState('Smart Workspace'); 
  const [noteTitle, setNoteTitle] = useState('Standard Note'); 

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [notes, setNotes] = useState<Note[]>([]); 
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    const savedSchedules = localStorage.getItem('metal_schedules');
    const savedMembers = localStorage.getItem('metal_members');
    const savedNotes = localStorage.getItem('metal_notes');
    const savedAppTitle = localStorage.getItem('app_main_title'); 
    const savedNoteTitle = localStorage.getItem('app_note_title');
    
    if (savedSchedules) setSchedules(JSON.parse(savedSchedules));
    if (savedMembers) setMembers(JSON.parse(savedMembers));
    if (savedNotes) setNotes(JSON.parse(savedNotes));
    if (savedAppTitle) setAppTitle(savedAppTitle);
    if (savedNoteTitle) setNoteTitle(savedNoteTitle);
  }, []);

  useEffect(() => {
    localStorage.setItem('metal_schedules', JSON.stringify(schedules));
    localStorage.setItem('metal_members', JSON.stringify(members));
    localStorage.setItem('metal_notes', JSON.stringify(notes));
    localStorage.setItem('app_main_title', appTitle);
    localStorage.setItem('app_note_title', noteTitle);
  }, [schedules, members, notes, appTitle, noteTitle]);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setMode(AppMode.SCHEDULE_DETAIL);
  };

  const renderContent = () => {
    switch (mode) {
      case AppMode.CALENDAR:
        return <CalendarView schedules={schedules} onDateClick={handleDateClick} onUpdateSchedules={setSchedules} />;
      case AppMode.SCHEDULE_DETAIL:
        return selectedDate ? <ScheduleDetail selectedDate={selectedDate} schedules={schedules} onBack={() => setMode(AppMode.CALENDAR)} onSave={setSchedules} /> : null;
      case AppMode.MEMBER:
        return <MemberView members={members} setMembers={setMembers} onHome={() => setMode(AppMode.CALENDAR)} />;
      case AppMode.NOTE:
        return <NoteView notes={notes} setNotes={setNotes} noteTitle={noteTitle} setNoteTitle={setNoteTitle} />;
      case AppMode.YOUTUBE:
        return (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <h2 className="text-4xl font-black mb-4 tracking-tighter">YOUTUBE MODULE</h2>
            <p className="text-xl italic">추후 연동될 모듈입니다.</p>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col transition-colors duration-500 text-gray-200">
      {/* Header 컨테이너: App의 메인 폭과 일치시킴 */}
      <div className="w-full bg-[#1a1a2e] border-b border-[#3a3a5e] sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto">
          <Header mode={mode} setMode={setMode} title={appTitle} setTitle={setAppTitle} />
        </div>
      </div>
      
      {/* 메인 콘텐츠 영역: Header와 동일한 max-width 및 px 적용 */}
      <main className="flex-grow flex flex-col w-full max-w-[1600px] mx-auto px-2 md:px-4 py-4 overflow-x-hidden">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;