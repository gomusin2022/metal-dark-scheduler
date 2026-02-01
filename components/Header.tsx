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

  const menuItems = [
    { mode: AppMode.CALENDAR, icon: Calendar },
    { mode: AppMode.MEMBER, icon: Users },
    { mode: AppMode.NOTE, icon: StickyNote },
    { mode: AppMode.YOUTUBE, icon: Youtube },
  ];

  return (
    <header className="w-full py-4 flex flex-col md:flex-row items-center justify-between gap-4">
      {/* 로고 및 타이틀 섹션 */}
      <div className="flex flex-col shrink-0 items-center md:items-start leading-tight">
        {isEditingTitle ? (
          <input
            autoFocus
            className="bg-transparent border-b border-blue-500 text-2xl md:text-4xl font-black outline-none w-full max-w-[300px]"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setIsEditingTitle(false)}
            onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
          />
        ) : (
          <h1 
            className="text-2xl md:text-4xl font-black tracking-tighter cursor-pointer hover:text-blue-400 transition-colors whitespace-nowrap"
            onDoubleClick={() => setIsEditingTitle(true)}
          >
            {title}
          </h1>
        )}
        <div className="flex items-center space-x-2 text-gray-400 mt-1 uppercase tracking-widest text-[10px] md:text-sm font-bold">
          <span className="text-blue-500">Digital</span>
          <span className="w-1 h-1 bg-gray-600 rounded-full" />
          <span>Management</span>
          <span className="w-1 h-1 bg-gray-600 rounded-full" />
          <span className="text-emerald-500">System</span>
        </div>
      </div>

      {/* 중앙 메뉴 버튼 섹션 */}
      <div className="flex items-center bg-[#252545] p-1.5 rounded-2xl border border-[#3a3a5e] shadow-inner">
        {menuItems.map(({ mode: m, icon: Icon }) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`p-2.5 md:p-3.5 rounded-xl transition-all duration-300 ${
              mode === m 
              ? 'bg-blue-600 text-white shadow-lg scale-105' 
              : 'text-gray-400 hover:text-white hover:bg-[#3a3a5e]'}`}
          >
            <Icon 
              className={`w-6 h-6 md:w-9 md:h-9 ${m === AppMode.YOUTUBE ? 'text-[#FF0000]' : 'text-white'}`} 
            />
          </button>
        ))}
      </div>

      {/* 우측 시간 및 날씨 정보 섹션 */}
      <div className="flex flex-col text-right leading-tight shrink-0 min-w-[150px]">
        {!weather || isLoadingWeather ? (
          <div className="animate-pulse flex flex-col items-end space-y-1">
            <div className="h-3 bg-[#2c2c2e] rounded w-20"></div>
            <div className="h-5 bg-[#2c2c2e] rounded w-24"></div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-end text-blue-400 text-[13px] md:text-lg font-bold whitespace-nowrap space-x-1">
              <span className="text-blue-500">{weather.minTemp}°</span>
              <span className="text-gray-500">/</span>
              <span className="text-rose-500">{weather.maxTemp}°</span>
              <MapPin className="w-4 h-4 ml-1 text-blue-500" />
              <span>{weather.location}</span>
            </div>
            <div className="flex items-center justify-end text-emerald-400 text-base md:text-[28px] font-black tracking-tighter whitespace-nowrap">
              <CloudSun className="w-6 h-6 md:w-9 md:h-9 mr-2 text-emerald-500" />
              <span>{currentTime.toLocaleTimeString('ko-KR', { hour12: false })}</span>
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;