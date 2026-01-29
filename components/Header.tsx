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
    // 전체 높이는 유지 (p-4, gap-3 등 구조 고정)
    <header className="sticky top-0 z-50 bg-[#1a1a2e] border-b border-[#3a3a5e] p-4 flex flex-col shadow-2xl transition-all duration-300 gap-3">
      
      {/* 1단: 타이틀(좌) + 날짜/시간(우) */}
      <div className="flex items-center justify-between w-full">
        <div className="flex-1 flex justify-start pr-2 overflow-hidden">
          {isEditingTitle ? (
            <input
              autoFocus
              className="bg-[#2c2c2e] border border-blue-500 rounded px-2 py-1 text-2xl md:text-4xl font-black w-full outline-none text-white"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
            />
          ) : (
            <h1 
              // 텍스트 크기 약 10% 확대 (text-xl -> text-2xl, text-5xl -> text-6xl 등)
              className="text-2xl md:text-5xl lg:text-6xl font-black text-white cursor-pointer hover:text-blue-400 transition-colors whitespace-nowrap overflow-hidden text-ellipsis tracking-tighter"
              onClick={() => setIsEditingTitle(true)}
            >
              {title}
            </h1>
          )}
        </div>

        {/* 1단 우측: 날짜와 시간 (폰트 크기 확대) */}
        <div className="flex flex-col text-right leading-tight shrink-0">
          <span className="text-blue-400 text-[11px] md:text-base font-bold whitespace-nowrap">
            {formatDate(currentTime)}
          </span>
          <span className="text-blue-400 text-base md:text-3xl font-black tracking-tighter whitespace-nowrap">
            {formatTime(currentTime)}
          </span>
        </div>
      </div>

      {/* 2단: 아이콘(좌) + 위치/날씨(우) */}
      <div className="flex items-center justify-between w-full border-t border-[#3a3a5e]/30 pt-2">
        {/* 2단 좌측: 모드 버튼 (아이콘 크기 약 10% 확대) */}
        <div className="flex items-center space-x-2 md:space-x-4">
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
              className={`p-2 md:p-3.5 rounded-xl flex items-center justify-center transition-all ${mode === m ? 'bg-blue-600 scale-105 shadow-lg shadow-blue-900' : 'bg-[#2c2c2e] hover:bg-[#3a3a5e]'}`}
            >
              {/* 아이콘 크기 확대 (w-5 -> w-6, w-8 -> w-9) */}
              <Icon 
                className={`w-6 h-6 md:w-9 md:h-9 ${m === AppMode.YOUTUBE ? 'text-[#FF0000]' : 'text-white'}`} 
              />
            </button>
          ))}
        </div>

        {/* 2단 우측: 위치 및 날씨 정보 (텍스트 크기 확대) */}
        <div className="flex flex-col text-right leading-tight shrink-0">
          {isLoadingWeather ? (
            <div className="animate-pulse flex flex-col items-end space-y-1">
              <div className="h-2.5 bg-[#2c2c2e] rounded w-16"></div>
              <div className="h-4 bg-[#2c2c2e] rounded w-20"></div>
            </div>
          ) : weather ? (
            <>
              <div className="flex items-center justify-end text-blue-400 text-[11px] md:text-sm font-bold whitespace-nowrap space-x-1">
                <span className="text-blue-500">{weather.minTemp}°</span>
                <span className="text-gray-500">/</span>
                <span className="text-rose-500">{weather.maxTemp}°</span>
                <MapPin className="w-3.5 h-3.5 ml-1 text-blue-500" />
                <span>{weather.location}</span>
              </div>
              <div className="flex items-center justify-end text-emerald-400 text-sm md:text-2xl font-black tracking-tighter whitespace-nowrap">
                <CloudSun className="w-5 h-5 md:w-7 md:h-7 mr-1.5" />
                <span>{weather.temp}°C {weather.condition}</span>
              </div>
            </>
          ) : (
            <span className="text-gray-600 text-[11px]">연동 대기</span>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;