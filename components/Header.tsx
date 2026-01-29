import React, { useState, useEffect } from 'react';
import { Calendar, Users, MapPin, CloudSun, StickyNote, Youtube } from 'lucide-react';
import { AppMode, WeatherInfo } from '../types';
import { getWeatherData } from '../services/geminiService';

interface HeaderProps {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  title: string;
  setTitle: (title: string) => void;
}

const Header: React.FC<HeaderProps> = ({ mode, setMode, title, setTitle }) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      setIsLoadingWeather(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const data = await getWeatherData(pos.coords.latitude, pos.coords.longitude);
            if (data) setWeather(data);
          } catch (e) {
            console.error("Weather fetching error:", e);
          } finally {
            setIsLoadingWeather(false);
          }
        },
        () => setIsLoadingWeather(false)
      );
    };
    fetchWeather();
  }, []);

  const formatDate = (date: Date) => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')} (${days[date.getDay()]})`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  };

  return (
    <header className="sticky top-0 z-50 bg-[#1a1a2e] border-b border-[#3a3a5e] p-4 flex flex-col shadow-2xl transition-all duration-300 gap-4">
      
      {/* 1단: 타이틀(좌) + 날짜/날씨(우) */}
      <div className="flex items-center justify-between w-full">
        {/* LEFT: 타이틀 (flex-1로 남는 공간 차지) */}
        <div className="flex-1 flex justify-start pr-4 overflow-hidden">
          {isEditingTitle ? (
            <input
              autoFocus
              className="bg-[#2c2c2e] border border-blue-500 rounded px-4 py-1 text-xl md:text-3xl font-black w-full outline-none text-white"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
            />
          ) : (
            <h1 
              className="text-xl md:text-4xl lg:text-5xl font-black text-white cursor-pointer hover:text-blue-400 transition-colors whitespace-nowrap overflow-hidden text-ellipsis"
              onClick={() => setIsEditingTitle(true)}
            >
              {title}
            </h1>
          )}
        </div>

        {/* RIGHT: 날짜 및 날씨 (hidden 제거하여 항상 보이게 설정) */}
        <div className="flex items-center space-x-4 md:space-x-6 shrink-0">
          <div className="flex flex-col text-right leading-tight min-w-[100px] md:min-w-[140px] justify-center">
            <span className="text-blue-400 text-[10px] md:text-sm font-bold whitespace-nowrap">
              {formatDate(currentTime)}
            </span>
            <span className="text-blue-400 text-sm md:text-2xl font-black tracking-tight whitespace-nowrap">
              {formatTime(currentTime)}
            </span>
          </div>

          <div className="flex flex-col text-right leading-tight border-l border-[#3a3a5e] pl-4 md:pl-6 justify-center min-w-[120px] md:min-w-[180px]">
            {isLoadingWeather ? (
              <div className="animate-pulse space-y-1 md:space-y-2">
                <div className="h-3 bg-[#2c2c2e] rounded w-24 ml-auto"></div>
                <div className="h-5 bg-[#2c2c2e] rounded w-32 ml-auto"></div>
              </div>
            ) : weather ? (
              <>
                <div className="flex items-center justify-end text-blue-400 text-[10px] md:text-sm font-bold whitespace-nowrap space-x-1 md:space-x-2">
                  <div className="flex items-center mr-1 md:mr-2 space-x-1 border-r border-[#3a3a5e] pr-1 md:pr-2">
                    <span className="text-blue-500">{weather.minTemp}°</span>
                    <span className="text-gray-500 px-0.5">/</span>
                    <span className="text-rose-500">{weather.maxTemp}°</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-3 h-3 md:w-4 md:h-4 mr-1 text-blue-500" />
                    <span className="hidden sm:inline">{weather.location}</span>
                  </div>
                </div>
                <div className="flex items-center justify-end text-emerald-400 text-sm md:text-2xl font-black tracking-tight whitespace-nowrap">
                  <CloudSun className="w-4 h-4 md:w-6 md:h-6 mr-1" />
                  <span>{weather.temp}°C <span className="hidden sm:inline">{weather.condition}</span></span>
                </div>
              </>
            ) : (
              <div className="text-gray-600 text-xs text-right">대기 중</div>
            )}
          </div>
        </div>
      </div>

      {/* 2단: 모드 전환 버튼 (좌측 정렬) */}
      <div className="flex items-center space-x-3 w-full border-t border-[#3a3a5e]/30 pt-2">
        {[
          { mode: AppMode.CALENDAR, Icon: Calendar },
          { mode: AppMode.MEMBER, Icon: Users },
          { mode: AppMode.NOTE, Icon: StickyNote },
          { mode: AppMode.YOUTUBE, Icon: Youtube }
        ].map(({ mode: m, Icon }) => (
          <button
            key={m}
            onClick={() => {
              if (m === AppMode.YOUTUBE) {
                window.open("https://www.youtube.com/channel/UCkJOv1qeGXiaVjrA81UQj-w", "_blank");
              } else {
                setMode(m);
              }
            }}
            className={`p-2 md:p-3 rounded-xl flex items-center justify-center transition-all ${mode === m ? 'bg-blue-600 scale-105 shadow-lg shadow-blue-900' : 'bg-[#2c2c2e] hover:bg-[#3a3a5e]'}`}
          >
            <Icon 
              className={`w-5 h-5 md:w-8 md:h-8 ${m === AppMode.YOUTUBE ? 'text-[#FF0000]' : 'text-white'}`} 
            />
          </button>
        ))}
      </div>
    </header>
  );
};

export default Header;