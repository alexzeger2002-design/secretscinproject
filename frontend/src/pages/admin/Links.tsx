import { useEffect, useState, useRef } from 'react';
import { linkService } from '../../services/linkService';
import { settingsService } from '../../services/settingsService';
import { AdminNav } from '../../components/AdminNav';
import { Loading } from '../../components/Loading';
import type { Link as LinkType } from '../../services/linkService';

// Кеш на 30 минут для мгновенной загрузки
const CACHE_DURATION = 30 * 60 * 1000;

export function LinksPage() {
  const [links, setLinks] = useState<LinkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '' });
  
  // Состояние для управления ссылкой на бота
  const [botUrl, setBotUrl] = useState<string>('');
  const [botUrlLoading, setBotUrlLoading] = useState(true);
  const [botUrlEditing, setBotUrlEditing] = useState(false);
  const [botUrlError, setBotUrlError] = useState<string>('');
  
  const lastFetchRef = useRef<number>(0);
  const cacheRef = useRef<{ links: LinkType[]; timestamp: number }>({ 
    links: [],
    timestamp: 0
  });

  useEffect(() => {
    loadLinks();
    loadBotUrl();
    
    // Автоматическое обновление каждые 30 минут
    const interval = setInterval(() => {
      loadLinks(true);
    }, CACHE_DURATION);

    return () => clearInterval(interval);
  }, []);

  const loadBotUrl = async () => {
    try {
      setBotUrlLoading(true);
      const url = await settingsService.getTelegramBotUrl();
      setBotUrl(url || '');
    } catch (err) {
      console.error('Failed to load bot URL:', err);
      setBotUrlError('Не удалось загрузить ссылку');
    } finally {
      setBotUrlLoading(false);
    }
  };

  const handleUpdateBotUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setBotUrlError('');
    
    if (!botUrl.trim()) {
      setBotUrlError('Ссылка не может быть пустой');
      return;
    }

    try {
      await settingsService.updateTelegramBotUrl(botUrl);
      setBotUrlEditing(false);
      alert('Ссылка на бота успешно обновлена!');
    } catch (err: any) {
      setBotUrlError(err.response?.data?.error || 'Ошибка обновления ссылки');
    }
  };

  const loadLinks = async (force = false) => {
    const now = Date.now();
    const timeSinceLastFetch = now - cacheRef.current.timestamp;

    // Используем кеш если данные свежие
    if (!force && timeSinceLastFetch < CACHE_DURATION && cacheRef.current.links.length > 0) {
      setLinks(cacheRef.current.links);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await linkService.getAll(true);
      setLinks(data);
      cacheRef.current = { links: data, timestamp: now };
      lastFetchRef.current = now;
    } catch (err) {
      console.error('Failed to load links:', err);
      // При ошибке используем кеш
      if (cacheRef.current.links.length > 0) {
        setLinks(cacheRef.current.links);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await linkService.create(formData);
      setShowModal(false);
      setFormData({ name: '', code: '' });
      loadLinks(true);
    } catch (err: any) {
      
      // Если ошибка 401 - токен истек, нужно перелогиниться
      if (err?.response?.status === 401) {
        // Удаляем токен и редиректим на логин только при явной ошибке аутентификации
        localStorage.removeItem('authToken');
        if (window.confirm('Сессия истекла. Перейти на страницу входа?')) {
          window.location.href = '/admin/login';
        }
      } else {
        // Для других ошибок показываем сообщение
        alert(err.response?.data?.error || err.message || 'Ошибка создания ссылки');
      }
    }
  };

  const handleToggleActive = async (link: LinkType) => {
    try {
      await linkService.update(link.id, { isActive: !link.isActive });
      loadLinks(true);
    } catch (err) {
      console.error('Failed to toggle link:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту ссылку?')) return;
    try {
      await linkService.delete(id);
      loadLinks(true);
    } catch (err) {
      alert('Ошибка удаления');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Скопировано!');
  };

  // Генерируем полную ссылку с кодом
  const getFullLink = (code: string): string => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/?code=${code}`;
  };

  if (loading) {
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
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Управление ссылками</h2>
              <button
                onClick={() => setShowModal(true)}
                className="bg-gradient-to-r from-[#FF007A] to-[#7B2CBF] hover:from-[#FF007A]/90 hover:to-[#7B2CBF]/90 text-white font-semibold py-2 px-4 rounded transition-all"
              >
                + Создать ссылку
              </button>
            </div>
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-200">
                <strong>Как использовать:</strong> Скопируйте ссылку из колонки "Ссылка" и распространяйте её. 
                Все переходы по этой ссылке (с параметром <code className="bg-blue-900/50 px-1 rounded">?code=КОД</code>) 
                будут отслеживаться отдельно для каждой ссылки. Визиты и клики считаются автоматически.
              </p>
            </div>
          </div>

          <div className="bg-[#0F0F1A] border border-white/10 shadow-lg rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-[#05050A]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#94A3B8] uppercase">Код</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#94A3B8] uppercase">Ссылка</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#94A3B8] uppercase">Название</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#94A3B8] uppercase">Статус</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#94A3B8] uppercase">Визиты</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#94A3B8] uppercase">Клики</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#94A3B8] uppercase">Конверсия</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#94A3B8] uppercase">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-[#0F0F1A] divide-y divide-gray-700">
                {links.length > 0 ? (
                  links.map((link) => (
                    <tr key={link.id} className="hover:bg-[#05050A] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm text-white">{link.code}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-[#94A3B8] max-w-xs truncate">
                            {getFullLink(link.code)}
                          </span>
                          <button
                            onClick={() => copyToClipboard(getFullLink(link.code))}
                            className="text-[#00F0FF] hover:text-[#00F0FF]/80 transition-colors flex-shrink-0"
                            title="Копировать ссылку"
                          >
                            📋
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {link.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${link.isActive ? 'bg-green-900/30 text-green-300 border border-green-500/30' : 'bg-red-900/30 text-red-300 border border-red-500/30'}`}>
                          {link.isActive ? 'Активна' : 'Неактивна'}
                        </span>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleToggleActive(link)}
                          className="text-[#00F0FF] hover:text-[#00F0FF]/80 mr-4 transition-colors"
                        >
                          {link.isActive ? 'Деактивировать' : 'Активировать'}
                        </button>
                        <button
                          onClick={() => handleDelete(link.id)}
                          className="text-[#FF007A] hover:text-[#FF007A]/80 transition-colors"
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-sm text-[#94A3B8]">
                      Нет ссылок
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Блок управления ссылкой на бота */}
          <div className="mt-8 bg-[#0F0F1A] border border-white/10 shadow-lg rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Ссылка на Telegram-бота</h3>
                <p className="text-sm text-[#94A3B8]">
                  Эта ссылка используется для всех кнопок на сайте. При изменении ссылки статистика остается единой.
                </p>
              </div>
            </div>
            
            {botUrlLoading ? (
              <div className="text-[#94A3B8]">Загрузка...</div>
            ) : botUrlEditing ? (
              <form onSubmit={handleUpdateBotUrl} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                    URL Telegram-бота
                  </label>
                  <input
                    type="url"
                    value={botUrl}
                    onChange={(e) => {
                      setBotUrl(e.target.value);
                      setBotUrlError('');
                    }}
                    placeholder="https://t.me/your_bot"
                    className="w-full px-4 py-2 border border-gray-700 bg-[#05050A] text-white rounded-md focus:outline-none focus:ring-[#FF007A] focus:border-[#FF007A]"
                    required
                  />
                  {botUrlError && (
                    <p className="mt-2 text-sm text-[#FF007A]">{botUrlError}</p>
                  )}
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBotUrlEditing(false);
                      setBotUrlError('');
                      loadBotUrl();
                    }}
                    className="px-4 py-2 text-[#94A3B8] bg-[#05050A] border border-white/10 rounded hover:bg-[#05050A]/80 transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-white bg-gradient-to-r from-[#FF007A] to-[#7B2CBF] rounded hover:from-[#FF007A]/90 hover:to-[#7B2CBF]/90 transition-all"
                  >
                    Сохранить
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-sm text-white break-all">{botUrl || 'Не установлено'}</span>
                    {botUrl && (
                      <button
                        onClick={() => copyToClipboard(botUrl)}
                        className="text-[#00F0FF] hover:text-[#00F0FF]/80 transition-colors"
                        title="Копировать ссылку"
                      >
                        📋
                      </button>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setBotUrlEditing(true)}
                  className="ml-4 px-4 py-2 text-white bg-gradient-to-r from-[#FF007A] to-[#7B2CBF] rounded hover:from-[#FF007A]/90 hover:to-[#7B2CBF]/90 transition-all"
                >
                  Изменить
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-white/10 w-96 shadow-lg rounded-md bg-[#0F0F1A]">
            <h3 className="text-lg font-bold mb-4 text-white">Создать ссылку</h3>
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#94A3B8] mb-1">Название</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-700 bg-[#05050A] text-white rounded-md focus:outline-none focus:ring-[#FF007A] focus:border-[#FF007A]"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#94A3B8] mb-1">Код (опционально)</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-700 bg-[#05050A] text-white rounded-md focus:outline-none focus:ring-[#FF007A] focus:border-[#FF007A]"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-[#94A3B8] bg-[#05050A] border border-white/10 rounded hover:bg-[#05050A]/80 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-gradient-to-r from-[#FF007A] to-[#7B2CBF] rounded hover:from-[#FF007A]/90 hover:to-[#7B2CBF]/90 transition-all"
                >
                  Создать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
