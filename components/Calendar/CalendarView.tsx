import React, { useState, useRef } from 'react';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, eachDayOfInterval, getDay
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { 
  ChevronLeft, ChevronRight, Copy, Trash2, MousePointer2, 
  RotateCcw, ClipboardCheck, FileDown, FileUp 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Schedule } from '../../types';
import { COLORS } from '../../constants';

interface CalendarViewProps {
  schedules: Schedule[];
  onDateClick: (date: Date) => void;
  onUpdateSchedules: (newSchedules: Schedule[]) => void;
}

type WorkMode = 'normal' | 'copy' | 'delete';

const HOLIDAY_LABELS_2026: Record<string, string> = {
  '2026-01-01': '신정', '2026-02-17': '설날', '2026-03-01': '삼일절',
  '2026-05-05': '어린이날', '2026-05-24': '석가탄신일', '2026-06-06': '현충일',
  '2026-08-15': '광복절', '2026-09-25': '추석', '2026-10-03': '개천절',
  '2026-10-09': '한글날', '2026-12-25': '성탄절',
};

const RED_DAYS_2026 = new Set([
  '2026-01-01', '2026-02-16', '2026-02-17', '2026-02-18', '2026-03-01', 
  '2026-03-02', '2026-05-05', '2026-05-24', '2026-05-25', '2026-06-06',
  '2026-08-15', '2026-08-17', '2026-09-24', '2026-09-25', '2026-09-26',
  '2026-10-03', '2026-10-05', '2026-10-09', '2026-12-25',
]);

const CalendarView: React.FC<CalendarViewProps> = ({ schedules, onDateClick, onUpdateSchedules }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarTitle, setCalendarTitle] = useState('Schedule Board');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [mode, setMode] = useState<WorkMode>('normal');
  const [clipboard, setClipboard] = useState<Schedule[]>([]); 
  const [undoStack, setUndoStack] = useState<Schedule[][]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const getDayStatus = (day: Date) => {
    const formatted = format(day, 'yyyy-MM-dd');
    const dayOfWeek = getDay(day);
    const isRedDay = RED_DAYS_2026.has(formatted) || dayOfWeek === 0;
    const isSaturday = dayOfWeek === 6;
    const label = HOLIDAY_LABELS_2026[formatted];
    return { isRedDay, isSaturday, label };
  };

  // ... (exportToExcel, importFromExcel, handleCopyAction, handleDeleteAction, handleUndo 함수는 변경 없음) ...

  return (
    <div className="flex flex-col h-full bg-[#121212] text-gray-200 w-full">
      <div className="flex flex-col w-full mb-1 px-1.5 sm:px-2 md:px-4 lg:px-6">

        {/* 타이틀 + 툴바 영역 */}
        <div className="flex items-center justify-between w-full h-10">
          <div className="flex-1 overflow-hidden">
            {isEditingTitle ? (
              <input 
                autoFocus 
                className="bg-[#2c2c2e] border border-blue-500 rounded px-2 py-1 text-base md:text-lg font-black text-white outline-none w-fit max-w-full" 
                value={calendarTitle} 
                onChange={(e) => setCalendarTitle(e.target.value)} 
                onBlur={() => setIsEditingTitle(false)} 
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)} 
              />
            ) : (
              <h2 
                className="text-lg md:text-2xl font-black text-white cursor-pointer tracking-tighter truncate w-fit hover:text-blue-400 transition-colors" 
                onClick={() => setIsEditingTitle(true)}
              >
                {calendarTitle}
              </h2>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <div className="flex bg-[#1a1a2e] p-1 rounded border border-[#3a3a5e] shadow-lg">
              <button onClick={() => { setMode('normal'); setClipboard([]); }} 
                className={`p-1.5 sm:p-2 rounded transition-all ${mode === 'normal' ? 'bg-blue-600 shadow-md' : 'hover:bg-[#2c2c2e]'}`}>
                <MousePointer2 className="w-5 h-5 text-amber-400" />
              </button>
              <button onClick={() => setMode('copy')} 
                className={`p-1.5 sm:p-2 rounded transition-all ${mode === 'copy' ? 'bg-blue-600 shadow-md' : 'hover:bg-[#2c2c2e]'}`}>
                <Copy className="w-5 h-5 text-cyan-400" />
              </button>
              <button onClick={() => setMode('delete')} 
                className={`p-1.5 sm:p-2 rounded transition-all ${mode === 'delete' ? 'bg-blue-600 shadow-md' : 'hover:bg-[#2c2c2e]'}`}>
                <Trash2 className="w-5 h-5 text-rose-500" />
              </button>
            </div>
            <button onClick={handleUndo} className="p-1.5 sm:p-2 bg-[#1a1a2e] border border-[#3a3a5e] rounded text-emerald-400 relative">
              <RotateCcw className="w-5 h-5" />
              {undoStack.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-black">
                  {undoStack.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 월 이동 + 내보내기 영역 */}
        <div className="flex items-center justify-between w-full h-11 sm:h-12 border-t border-[#3a3a5e]/30 pt-1.5 mt-1">
          <div className="flex items-center bg-[#1a1a2e] rounded p-0.5 border border-[#3a3a5e] shadow-md">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 sm:p-2 hover:bg-[#2c2c2e] rounded">
              <ChevronLeft className="w-6 h-6 text-blue-400" />
            </button>
            <span className="text-lg sm:text-2xl md:text-3xl font-black px-3 sm:px-4 min-w-[110px] sm:min-w-[140px] md:min-w-[180px] text-center text-white tabular-nums">
              {format(currentMonth, 'yyyy. MM', { locale: ko })}
            </span>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 sm:p-2 hover:bg-[#2c2c2e] rounded">
              <ChevronRight className="w-6 h-6 text-blue-400" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button onClick={exportToExcel} className="p-1.5 sm:p-2 bg-emerald-800/70 border border-emerald-600/50 rounded text-white shadow-sm hover:bg-emerald-700/70" title="월간 저장">
              <FileDown className="w-5 h-5" />
            </button>
            <label className="p-1.5 sm:p-2 bg-[#1a1a2e] border border-[#3a3a5e] rounded cursor-pointer hover:bg-[#3a3a5e]" title="엑셀 업로드">
              <FileUp className="w-5 h-5 text-emerald-400" />
              <input type="file" ref={fileInputRef} onChange={importFromExcel} accept=".xlsx,.xls" className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* 달력 그리드 본문 - 좌우 여백 최소화 */}
      <div className="flex-grow overflow-auto bg-[#1a1a2e] border-t border-[#3a3a5e] mx-0.5 sm:mx-1 md:mx-3 lg:mx-5 mb-1.5 md:mb-3">
        <div className="grid grid-cols-7 gap-px divide-x divide-[#3a3a5e]/40 bg-[#252545]">
          {/* 요일 헤더 */}
          {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
            <div 
              key={day}
              className="text-center font-black py-2 sm:py-2.5 text-xs sm:text-sm bg-[#1f1f38] border-b border-[#3a3a5e]/70"
              style={{ color: idx === 0 ? '#ef4444' : idx === 6 ? '#60a5fa' : '#9ca3af' }}
            >
              {day}
            </div>
          ))}

          {/* 날짜 셀 */}
          {calendarDays.map((day) => {
            const daySchedules = schedules.filter(s => isSameDay(new Date(s.date), day));
            const isCurrentMonth = isSameMonth(day, monthStart);
            const { isRedDay, isSaturday, label } = getDayStatus(day);
            let dayColor = '#e5e7eb';
            if (isRedDay) dayColor = '#ef4444';
            else if (isSaturday) dayColor = '#60a5fa';
            if (!isCurrentMonth) dayColor = 'rgba(156,163,175,0.3)';

            return (
              <div 
                key={day.toString()}
                onClick={() => {
                  if (mode === 'normal') onDateClick(day);
                  else if (mode === 'copy') handleCopyAction(day);
                  else if (mode === 'delete') handleDeleteAction(day);
                }}
                className={`
                  min-h-[100px] sm:min-h-[120px] md:min-h-[140px]
                  p-1.5 sm:p-2
                  flex flex-col
                  relative
                  transition-colors duration-150
                  border-b border-[#3a3a5e]/40
                  ${isCurrentMonth 
                    ? 'bg-[#1a1a2e]' 
                    : 'bg-[#111122] opacity-60'
                  }
                  ${mode === 'delete' && daySchedules.length > 0 
                    ? 'hover:bg-rose-950/40' 
                    : 'hover:bg-[#2a2a45]'
                  }
                  ${isSameDay(day, new Date()) 
                    ? 'ring-1 ring-blue-500/60 bg-blue-950/20' 
                    : ''
                  }
                  cursor-pointer
                `}
              >
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-xl sm:text-2xl font-black tabular-nums" style={{ color: dayColor }}>
                    {format(day, 'd')}
                  </span>
                  {isCurrentMonth && label && (
                    <span className="text-[10px] sm:text-xs font-bold text-red-400/90 truncate max-w-[60%]">
                      {label}
                    </span>
                  )}
                </div>

                <div className="flex-1 space-y-1 overflow-hidden text-[10px] sm:text-xs">
                  {daySchedules.slice(0, 5).map((s) => (
                    <div 
                      key={s.id}
                      className="px-1.5 py-0.5 bg-blue-950/40 text-blue-200 rounded-sm border border-blue-900/30 truncate font-medium"
                    >
                      {s.title}
                    </div>
                  ))}
                  {daySchedules.length > 5 && (
                    <div className="text-[10px] text-gray-500 pl-1 font-bold">
                      +{daySchedules.length - 5}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 복사 대기 알림 */}
      {clipboard.length > 0 && mode === 'copy' && (
        <div className="fixed bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-[#2c2c2e]/90 backdrop-blur-sm text-cyan-300 rounded-full shadow-2xl border border-cyan-800/50 text-sm font-medium">
            <ClipboardCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            {clipboard.length}개 복사 대기 중
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;