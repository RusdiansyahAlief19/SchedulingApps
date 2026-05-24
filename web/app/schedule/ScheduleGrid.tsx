'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { addManualSchedule } from './actions';
import { useRouter } from 'next/navigation';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6:00 to 21:00

export default function ScheduleGrid({ initialSchedules }: { initialSchedules: any[] }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('10:00');
  const [isRecurring, setIsRecurring] = useState(true);

  async function handleAddSchedule(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await addManualSchedule({
        title,
        dayOfWeek,
        startTime,
        endTime,
        isRecurring
      });
      setShowModal(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Gagal menambahkan jadwal');
    } finally {
      setIsSubmitting(false);
    }
  }

  const getColIndex = (dayOfWeek: number) => {
    return dayOfWeek === 0 ? 7 : dayOfWeek;
  };

  const getTimeStyles = (start: string, end: string) => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    
    const startRow = (startH - 6) * 60 + startM;
    const duration = (endH * 60 + endM) - (startH * 60 + startM);
    
    return {
      top: `${startRow}px`,
      height: `${duration}px`
    };
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <header className="px-5 pt-8 pb-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 z-10 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold leading-tight text-black dark:text-white">Jadwal Kalender</h1>
          <p className="text-xs text-zinc-500">Jadwal Akademik & Pribadi</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-md transition-transform active:scale-95"
        >
          <Plus size={20} />
        </button>
      </header>

      <div className="flex-1 overflow-auto relative">
        <div className="min-w-[800px] pb-20">
          
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-zinc-200 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900 z-10">
            <div className="border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950"></div>
            {DAYS.map(day => (
              <div key={day} className="py-2 text-center border-r border-zinc-200 dark:border-zinc-800">
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">{day}</span>
              </div>
            ))}
          </div>

          <div className="relative" style={{ height: `${16 * 60}px` }}>
            {HOURS.map((hour, i) => (
              <div key={hour} className="absolute w-full flex" style={{ top: `${i * 60}px`, height: '60px' }}>
                <div className="w-[60px] flex-shrink-0 border-r border-b border-zinc-200 dark:border-zinc-800 pr-2 pt-1 text-right bg-zinc-50 dark:bg-zinc-950 relative z-10">
                  <span className="text-[10px] font-medium text-zinc-400">{hour}:00</span>
                </div>
                <div className="flex-1 border-b border-zinc-100 dark:border-zinc-800/50 flex">
                  {DAYS.map((_, colIdx) => (
                    <div 
                      key={colIdx} 
                      className="flex-1 border-r border-zinc-100 dark:border-zinc-800/50 cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
                      onClick={() => {
                        setDayOfWeek(colIdx + 1 === 7 ? 0 : colIdx + 1);
                        setStartTime(`${hour.toString().padStart(2, '0')}:00`);
                        setEndTime(`${(hour + 1).toString().padStart(2, '0')}:00`);
                        setShowModal(true);
                      }}
                    ></div>
                  ))}
                </div>
              </div>
            ))}

            {initialSchedules.map(schedule => {
              const col = getColIndex(schedule.day_of_week);
              const { top, height } = getTimeStyles(schedule.start_time, schedule.end_time);
              const isKuliah = schedule.source === 'siam' || schedule.source === 'brone';
              
              const bgColor = isKuliah ? 'bg-blue-100 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700' : 'bg-emerald-100 dark:bg-emerald-900/50 border-emerald-300 dark:border-emerald-700';
              const textColor = isKuliah ? 'text-blue-800 dark:text-blue-100' : 'text-emerald-800 dark:text-emerald-100';

              return (
                <div 
                  key={schedule.id}
                  className={`absolute rounded-md border p-1 shadow-sm overflow-hidden text-xs leading-tight ${bgColor} ${textColor} hover:opacity-90 cursor-pointer transition-opacity z-20`}
                  style={{
                    left: `calc(60px + ${(col - 1) * (100/7)}%)`,
                    width: `calc(${100/7}% - 4px)`,
                    top,
                    height,
                    marginLeft: '2px'
                  }}
                >
                  <div className="font-semibold truncate">
                    {schedule.courses?.name || schedule.title || 'Jadwal'}
                  </div>
                  <div className="text-[9px] opacity-80 mt-0.5 truncate">
                    {schedule.start_time.substring(0,5)} - {schedule.end_time.substring(0,5)}
                  </div>
                  {schedule.room && (
                    <div className="text-[9px] opacity-80 truncate">{schedule.room}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-black dark:text-white">Tambah Jadwal Pribadi</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddSchedule} className="grid gap-4">
              <div>
                <label className="text-xs font-medium text-zinc-500">Nama Kegiatan</label>
                <input 
                  required
                  type="text" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Misal: Olahraga Gym"
                  className="mt-1 w-full rounded-xl border border-zinc-200 p-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-500">Mulai</label>
                  <input 
                    required
                    type="time" 
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-zinc-200 p-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500">Selesai</label>
                  <input 
                    required
                    type="time" 
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-zinc-200 p-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer mt-2">
                <input 
                  type="checkbox" 
                  checked={isRecurring}
                  onChange={e => setIsRecurring(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-black dark:text-white">Ulangi setiap minggu</span>
              </label>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="mt-4 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-blue-400"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Jadwal'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
