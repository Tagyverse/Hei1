import { Wrench, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface MaintenanceProps {
  isAdminRoute?: boolean;
}

const TOTAL_DURATION = 15 * 60 * 60;

export default function Maintenance({ isAdminRoute = false }: MaintenanceProps) {
  const [timeRemaining, setTimeRemaining] = useState(TOTAL_DURATION);
  const [startTime, setStartTime] = useState<Date | null>(null);

  useEffect(() => {
    if (!isAdminRoute) return;

    const fetchStartTime = async () => {
      const { data, error } = await supabase
        .from('maintenance_timer')
        .select('start_time')
        .eq('id', 'current')
        .maybeSingle();

      if (data && data.start_time) {
        setStartTime(new Date(data.start_time));
      }
    };

    fetchStartTime();
  }, [isAdminRoute]);

  useEffect(() => {
    if (!isAdminRoute || !startTime) return;

    const calculateTimeRemaining = () => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      const remaining = TOTAL_DURATION - elapsed;
      setTimeRemaining(remaining > 0 ? remaining : 0);
    };

    calculateTimeRemaining();

    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [isAdminRoute, startTime]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 md:p-12 border border-white/20">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-6 animate-pulse">
              <Wrench className="w-12 h-12 text-white" />
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Site Under Update
            </h1>

            <p className="text-xl text-gray-300 mb-6">
              Due to heavy server load, our site is currently being updated.
            </p>

            {isAdminRoute && (
              <div className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/10">
                <div className="space-y-3 text-gray-200">
                  <div className="flex items-center justify-center gap-3">
                    <Clock className="w-5 h-5 text-yellow-400" />
                    <span className="text-lg font-semibold">Server Update Progress</span>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-400 mb-2 font-mono">
                      {formatTime(timeRemaining)}
                    </div>
                    <p className="text-sm text-gray-400">Time Remaining (Estimated)</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4 text-gray-300">
              <p className="text-lg font-medium bg-white/5 rounded-lg p-4 border border-white/10">
                {isAdminRoute
                  ? "Server will try to update new pack within the estimated time. We're trying our best to bring the site back online as quickly as possible."
                  : "Please wait patiently while we optimize our servers and update the site to serve you better."
                }
              </p>
            </div>

            <div className="mt-12 pt-8 border-t border-white/10">
              <p className="text-sm text-gray-400">
                Thank you for your patience and understanding. We appreciate your support!
              </p>
              {isAdminRoute && (
                <p className="text-xs text-gray-500 mt-2">
                  Admin: Access with ?admin=true parameter
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
