import { useEffect, useState } from 'react';
import { visitService } from '../services';
import { generateFingerprint, getUrlParam } from '../utils/fingerprint';
import { LandingProvider } from '../contexts/LandingContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Hero } from '../components/sections/Hero';
import { Chat } from '../components/sections/Chat';
import { Showcase } from '../components/sections/Showcase';
import { Benefits } from '../components/sections/Benefits';
import { Stats } from '../components/sections/Stats';
import { Steps } from '../components/sections/Steps';
import { FinalCTA } from '../components/sections/FinalCTA';

export function Landing() {
  // Устанавливаем дефолтный URL сразу, чтобы не показывать загрузку
  const [redirectUrl, setRedirectUrl] = useState<string | null>('https://t.me/SecretScin_bot');
  const [visitId] = useState<number | null>(null);
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [loading] = useState(false); // Начинаем с false, чтобы не показывать загрузку
  const [error] = useState<string | null>(null);

  // Функция для получения ссылки на бота и создания визита
  const updateBotUrl = async () => {
    try {
      const code = getUrlParam('code');
      const fingerprint = generateFingerprint();
      
      // Получаем ссылку И создаем визит одновременно через visitService
      // Это гарантирует что визит создается только один раз
      const result = await visitService.createVisit({
        fingerprint,
        referrer: document.referrer || undefined,
        ua: navigator.userAgent,
        linkCode: code || undefined,
      }, code || undefined);
      
      if (result?.redirectUrl) {
        setRedirectUrl(result.redirectUrl);
      }
    } catch (apiError: any) {
      console.error('Failed to get bot URL:', apiError?.message || apiError);
      // При ошибке используем текущую ссылку или дефолтную
      if (!redirectUrl) {
        setRedirectUrl('https://t.me/SecretScin_bot');
      }
    }
  };

  useEffect(() => {
    // Страница уже загружена с дефолтным URL - мгновенная загрузка!
    const code = getUrlParam('code');
    if (code) setLinkCode(code);

    // Первоначальная загрузка ссылки
    // Визит создается автоматически на бэкенде при запросе ссылки через updateBotUrl
    // НЕ создаем визит отдельно, чтобы избежать дублирования
    updateBotUrl();

    // Обновляем ссылку каждые 10 секунд, чтобы всегда была актуальная
    const interval = setInterval(() => {
      updateBotUrl();
    }, 10000); // 10 секунд

    // Обновляем ссылку при возврате фокуса на страницу (когда пользователь возвращается на вкладку)
    const handleFocus = () => {
      updateBotUrl();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Пустой массив зависимостей - выполняется только при монтировании

  const handleTelegramClick = async () => {
    // Всегда пытаемся зарегистрировать клик, даже если visitId = -1
    // Если есть linkCode, клик будет сохранен
    try {
      await visitService.createClick(visitId || -1, linkCode || undefined);
    } catch (err: any) {
      console.error('Failed to track click:', err);
      // Не блокируем переход даже если клик не зарегистрировался
    }
    
    if (redirectUrl) {
      window.open(redirectUrl, '_blank');
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-[#05050A] flex items-center justify-center">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  if (error && !redirectUrl) {
    return (
      <div className="min-h-screen bg-[#05050A] flex items-center justify-center">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <LandingProvider 
      redirectUrl={redirectUrl} 
      visitId={visitId} 
      linkCode={linkCode}
      onTelegramClick={handleTelegramClick}
    >
      <div className="min-h-screen bg-[#05050A] text-white font-sans overflow-x-hidden selection:bg-[#FF007A] selection:text-white pb-20 md:pb-32">
        {/* Background Effects */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-900/30 rounded-full blur-[120px] animate-pulse-slow" />
          <div className="absolute bottom-0 right-[-10%] w-[500px] h-[500px] bg-pink-900/20 rounded-full blur-[100px]" />
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03]" />
        </div>

        {/* Sections */}
        <Hero />
        <ErrorBoundary>
          <Chat />
        </ErrorBoundary>
        <Showcase />
        <Benefits />
        <Stats />
        <Steps />
        <FinalCTA />
      </div>
    </LandingProvider>
  );
}

