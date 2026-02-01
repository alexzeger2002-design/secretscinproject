import { useEffect, useState, useRef } from 'react';
import { statsService } from '../../services/statsService';
import { linkService } from '../../services/linkService';
import { exportService } from '../../services/exportService';
import { StatCard } from '../../components/StatCard';
import { StatsChart } from '../../components/StatsChart';
import { AdminNav } from '../../components/AdminNav';
import { Loading } from '../../components/Loading';
import type { StatsResponse } from '../../services/statsService';
import type { Link as LinkType } from '../../services/linkService';

// Кеш на 5 минут для более актуальных данных (можно обновить вручную)
const CACHE_DURATION = 5 * 60 * 1000;

export function StatsPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [links, setLinks] = useState<LinkType[]>([]);
  const [selectedLinkId, setSelectedLinkId] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    country: '',
  });
  const lastFetchRef = useRef<number>(0);
  const cacheKeyRef = useRef<string>('');
  const cacheRef = useRef<{ data: StatsResponse | null; timestamp: number }>({ 
    data: null,
    timestamp: 0
  });

  useEffect(() => {
    loadLinks();
  }, []);

  useEffect(() => {
    loadData();
    
    // Автоматическое обновление каждые 5 минут
    const interval = setInterval(() => {
      loadData(true);
    }, CACHE_DURATION);

    return () => clearInterval(interval);
  }, [selectedLinkId, filters]);

  const loadData = async (force = false) => {
    const cacheKey = `${selectedLinkId || 'all'}-${filters.startDate}-${filters.endDate}-${filters.country}`;
    const now = Date.now();
    const timeSinceLastFetch = now - cacheRef.current.timestamp;

    // Используем кеш если данные свежие и ключ совпадает
    if (!force && timeSinceLastFetch < CACHE_DURATION && cacheKeyRef.current === cacheKey && cacheRef.current.data) {
      setStats(cacheRef.current.data);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let data: StatsResponse;
      if (selectedLinkId) {
        data = await statsService.getLinkStats(selectedLinkId, filters);
      } else {
        data = await statsService.getStats(filters);
      }
      setStats(data);
      cacheRef.current = { data, timestamp: now };
      cacheKeyRef.current = cacheKey;
      lastFetchRef.current = now;
    } catch (err) {
      console.error('Failed to load stats:', err);
      // При ошибке используем кеш
      if (cacheRef.current.data) {
        setStats(cacheRef.current.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadLinks = async () => {
    try {
      const data = await linkService.getAll();
      setLinks(data);
    } catch (err) {
      console.error('Failed to load links:', err);
    }
  };

  const handleExportCSV = async () => {
    try {
      await exportService.exportCSV({
        linkId: selectedLinkId,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      });
    } catch (err) {
      alert('Ошибка экспорта');
    }
  };

  const handleExportExcel = async () => {
    try {
      await exportService.exportExcel({
        linkId: selectedLinkId,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      });
    } catch (err) {
      alert('Ошибка экспорта');
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-[#05050A]">
        <AdminNav />
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05050A]">
      <AdminNav />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Статистика</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => loadData(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-600/90 hover:to-blue-700/90 text-white font-semibold py-2 px-4 rounded transition-all"
                title="Обновить статистику"
              >
                🔄 Обновить
              </button>
              <button
                onClick={handleExportCSV}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-600/90 hover:to-green-700/90 text-white font-semibold py-2 px-4 rounded transition-all"
              >
                📊 Экспорт CSV
              </button>
              <button
                onClick={handleExportExcel}
                className="bg-gradient-to-r from-[#FF007A] to-[#7B2CBF] hover:from-[#FF007A]/90 hover:to-[#7B2CBF]/90 text-white font-semibold py-2 px-4 rounded transition-all"
              >
                📈 Экспорт Excel
              </button>
            </div>
          </div>

          <div className="bg-[#0F0F1A] border border-white/10 shadow-lg rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-white">Фильтры</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-1">Ссылка</label>
                <select
                  value={selectedLinkId || ''}
                  onChange={(e) => setSelectedLinkId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-700 bg-[#05050A] text-white rounded-md focus:outline-none focus:ring-[#FF007A] focus:border-[#FF007A]"
                >
                  <option value="">Все ссылки</option>
                  {links.map((link) => (
                    <option key={link.id} value={link.id}>
                      {link.name || link.code}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-1">Начальная дата</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-700 bg-[#05050A] text-white rounded-md focus:outline-none focus:ring-[#FF007A] focus:border-[#FF007A]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-1">Конечная дата</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-700 bg-[#05050A] text-white rounded-md focus:outline-none focus:ring-[#FF007A] focus:border-[#FF007A]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-1">Страна</label>
                <input
                  type="text"
                  value={filters.country}
                  onChange={(e) => setFilters({ ...filters, country: e.target.value })}
                  placeholder="US, RU..."
                  className="w-full px-3 py-2 border border-gray-700 bg-[#05050A] text-white placeholder-gray-500 rounded-md focus:outline-none focus:ring-[#FF007A] focus:border-[#FF007A]"
                />
              </div>
            </div>
          </div>

          {stats && (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <StatCard title="Всего визитов" value={stats.totalVisits} />
                <StatCard title="Уникальных посетителей" value={stats.uniqueVisitors} />
                <StatCard title="Кликов" value={stats.totalClicks} />
                <StatCard title="Конверсия" value={`${stats.conversionRate.toFixed(1)}%`} />
              </div>

              <StatsChart stats={stats} />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
