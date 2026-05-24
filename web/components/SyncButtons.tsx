'use client';

import { useState } from 'react';
import { RefreshCw, Download } from 'lucide-react';

export function SyncButtons() {
  const [syncingClassroom, setSyncingClassroom] = useState(false);
  const [syncingBrone, setSyncingBrone] = useState(false);
  const [message, setMessage] = useState('');

  const handleSyncClassroom = async () => {
    setSyncingClassroom(true);
    setMessage('Menyinkronkan Classroom...');
    try {
      const res = await fetch('/api/sync/classroom');
      const data = await res.json();
      if (data.success) {
        setMessage('Sinkronisasi Classroom selesai!');
      } else {
        setMessage('Gagal: ' + (data.error || 'Terjadi kesalahan'));
      }
    } catch (err) {
      setMessage('Error saat menghubungi server.');
    }
    setSyncingClassroom(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleSyncBrone = async () => {
    setSyncingBrone(true);
    setMessage('Menyinkronkan Brone...');
    try {
      const res = await fetch('/api/sync/brone');
      const data = await res.json();
      if (data.success) {
        setMessage('Sinkronisasi Brone selesai!');
      } else {
        setMessage('Gagal: ' + (data.error || 'Terjadi kesalahan'));
      }
    } catch (err) {
      setMessage('Error saat menghubungi server.');
    }
    setSyncingBrone(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleSyncSiam = async () => {
    setSyncingBrone(true); // Reusing syncingBrone state or create new one
    setMessage('Menyinkronkan SIAM...');
    try {
      const res = await fetch('/api/sync/siam');
      const data = await res.json();
      if (data.success) {
        setMessage('Sinkronisasi SIAM selesai!');
      } else {
        setMessage('Gagal: ' + (data.error || 'Terjadi kesalahan'));
      }
    } catch (err) {
      setMessage('Error saat menghubungi server.');
    }
    setSyncingBrone(false);
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="grid gap-2">
      <button 
        onClick={handleSyncClassroom} 
        disabled={syncingClassroom}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:bg-green-400"
      >
        <RefreshCw size={16} className={syncingClassroom ? "animate-spin" : ""} />
        {syncingClassroom ? "Sinkronisasi..." : "Sync Classroom"}
      </button>
      
      <button 
        onClick={handleSyncBrone} 
        disabled={syncingBrone}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-blue-400"
      >
        <Download size={16} className={syncingBrone ? "animate-spin" : ""} />
        {syncingBrone ? "Sinkronisasi..." : "Sync Brone (Moodle)"}
      </button>

      <button 
        onClick={handleSyncSiam} 
        disabled={syncingBrone}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:bg-indigo-400"
      >
        <Download size={16} className={syncingBrone ? "animate-spin" : ""} />
        {syncingBrone ? "Sinkronisasi..." : "Sync SIAM (Absen & Jadwal)"}
      </button>

      {message && (
        <div className="mt-2 text-center text-xs font-medium text-zinc-600 dark:text-zinc-300">
          {message}
        </div>
      )}
    </div>
  );
}
