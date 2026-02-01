import { useEffect, useState, useRef } from 'react';
import { statsService } from '../../services/statsService';
import { linkService } from '../../services/linkService';
import { StatCard } from '../../components/StatCard';
import { Loading } from '../../components/Loading';
import { StatsChart } from '../../components/StatsChart';
import { AdminNav } from '../../components/AdminNav';
import type { StatsResponse } from '../../services/statsService';
import type { Link as LinkType } from '../../services/linkService';

// Кеш на 5 минут для более актуальных данных
const CACHE_DURATION = 5 * 60 * 1000;

export function Dashboard() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [links, setLinks] = useState<LinkType[]>([]);
  const [loading, setLoading] = useState(true);
  const lastFetchRef = useRef<number>(0);
  const cacheRef = useRef<{ stats: StatsResponse | null; links: LinkType[]; timestamp: number }>({ 
    stats: null, 
    links: [],
    timestamp: 0
  });

  useEffect(() => {
    loadData();
    
    // Автоматическое обновление каждые 5 минут
    const interval = setInterval(() => {
      loadData(true);
    }, CACHE_DURATION);

    return () => clearInterval(interval);
  }, []);

  const loadData = async (force = false) => {
    const now = Date.now();
    const timeSinceLastFetch = now - cacheRef.current.timestamp;

    // Используем кеш если данные свежие (менее 30 минут) и не принудительное обновление
    if (!force && timeSinceLastFetch < CACHE_DURATION && cacheRef.current.stats) {
      setStats(cacheRef.current.stats);
      setLinks(cacheRef.current.links);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [statsData, linksData] = await Promise.all([
        statsService.getStats(),
        linkService.getAll(true),
      ]);
      
      // Проверяем что данные не пустые (все нули) - это может быть ошибка БД
      // Если все нули и есть кеш - используем кеш вместо нулей
      const isEmpty = statsData && 
        statsData.totalVisits === 0 && 
        statsData.uniqueVisitors === 0 && 
        statsData.totalClicks === 0 &&
        (!statsData.visitsByDate || statsData.visitsByDate.length === 0);
      
      if (isEmpty && cacheRef.current.stats) {
        console.warn('[Dashboard] Received empty stats (likely DB error), using cached data instead');
        setStats(cacheRef.current.stats);
        setLinks(cacheRef.current.links);
      } else {
        // Данные валидные - используем их
        setStats(statsData);
        setLinks(linksData);
      }
      cacheRef.current = { 
        stats: statsData, 
        links: linksData,
        timestamp: now
      };
      lastFetchRef.current = now;
    } catch (err: any) {
      console.error('Failed to load data:', err);
      
      // При ошибке используем кеш если есть
      if (cacheRef.current.stats) {
        setStats(cacheRef.current.stats);
        setLinks(cacheRef.current.links);
      } else {
        // Если кеша нет и ошибка - НЕ устанавливаем нули
        // Оставляем текущее состояние (null) чтобы показать "Нет данных"
        // Это предотвращает показ нулей когда данные просто не загрузились из-за ошибки БД
        console.warn('[Dashboard] No cached data available after error, keeping current state');
        // Не устанавливаем stats = null, чтобы не сбрасывать уже загруженные данные
      }
    } finally {
      setLoading(false);
    }
  };

  // Показываем загрузку только если нет данных и идет загрузка
  if (loading && !stats && !cacheRef.current.stats) {
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
            <h2 className="text-2xl font-bold text-white">Общая статистика</h2>
            <button
              onClick={() => loadData(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-600/90 hover:to-blue-700/90 text-white font-semibold py-2 px-4 rounded transition-all"
              title="Обновить статистику"
            >
              🔄 Обновить
            </button>
          </div>
          
          {stats ? (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <StatCard
                  title="Всего визитов"
                  value={stats.totalVisits}
                  icon="👁️"
                />
                <StatCard
                  title="Уникальных посетителей"
                  value={stats.uniqueVisitors}
                  icon="👤"
                />
                <StatCard
                  title="Кликов"
                  value={stats.totalClicks}
                  icon="🖱️"
                />
                <StatCard
                  title="Конверсия"
                  value={`${stats.conversionRate.toFixed(1)}%`}
                  icon="📊"
                />
              </div>

              <div className="mb-8">
              <StatsChart stats={stats} />
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-semibold text-white mb-4">Топ стран</h3>
                <div className="bg-[#0F0F1A] border border-white/10 shadow-lg rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-[#05050A]">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#94A3B8] uppercase tracking-wider">
                          Страна
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#94A3B8] uppercase tracking-wider">
                          Визиты
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#94A3B8] uppercase tracking-wider">
                          Процент
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-[#0F0F1A] divide-y divide-gray-700">
                      {stats.topCountries && stats.topCountries.length > 0 ? (
                        stats.topCountries.slice(0, 10).map((item, idx) => (
                        <tr key={idx} className="hover:bg-[#05050A] transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                            {item.country || 'Неизвестно'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#94A3B8]">
                            {item.count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#94A3B8]">
                            {item.percentage.toFixed(1)}%
                          </td>
                        </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-6 py-4 text-center text-sm text-[#94A3B8]">
                            Нет данных
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-semibold text-white mb-4">Активные ссылки</h3>
                <div className="bg-[#0F0F1A] border border-white/10 shadow-lg rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-[#05050A]">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#94A3B8] uppercase tracking-wider">
                          Код
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#94A3B8] uppercase tracking-wider">
                          Название
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#94A3B8] uppercase tracking-wider">
                          Визиты
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#94A3B8] uppercase tracking-wider">
                          Клики
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#94A3B8] uppercase tracking-wider">
                          Конверсия
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-[#0F0F1A] divide-y divide-gray-700">
                      {links && links.length > 0 ? (
                        links.slice(0, 5).map((link) => (
                        <tr key={link.id} className="hover:bg-[#05050A] transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                            {link.code}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#94A3B8]">
                            {link.name || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#94A3B8]">
                            {link.stats?.visits || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#94A3B8]">
                            {link.stats?.clicks || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#94A3B8]">
                            {link.stats ? `${link.stats.conversionRate.toFixed(1)}%` : '0%'}
                          </td>
                        </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-sm text-[#94A3B8]">
                            Нет ссылок
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-[#94A3B8] text-lg mb-2">Нет данных для отображения</p>
              <p className="text-[#94A3B8] text-sm mb-4">
                Это нормально если сайт только что запущен или еще не было визитов
              </p>
              <button
                onClick={() => loadData(true)}
                className="px-4 py-2 bg-gradient-to-r from-[#FF007A] to-[#7B2CBF] text-white rounded hover:from-[#FF007A]/90 hover:to-[#7B2CBF]/90 transition-all"
              >
                Обновить данные
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
