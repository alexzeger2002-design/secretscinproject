import { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { visitService } from '../services';
import { settingsService } from '../services/settingsService';
import { generateFingerprint, getUrlParam } from '../utils/fingerprint';
import { LandingProvider } from '../contexts/LandingContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Hero } from '../components/sections/Hero';

// Lazy loading для компонентов - загружаются по мере необходимости
const Chat = lazy(() => import('../components/sections/Chat').then(m => ({ default: m.Chat })));
const Showcase = lazy(() => import('../components/sections/Showcase').then(m => ({ default: m.Showcase })));
const Benefits = lazy(() => import('../components/sections/Benefits').then(m => ({ default: m.Benefits })));
const Stats = lazy(() => import('../components/sections/Stats').then(m => ({ default: m.Stats })));
const Steps = lazy(() => import('../components/sections/Steps').then(m => ({ default: m.Steps })));
const FinalCTA = lazy(() => import('../components/sections/FinalCTA').then(m => ({ default: m.FinalCTA })));

export function Landing() {
  // Начинаем с дефолтного значения, но сразу загрузим правильную ссылку
  const [redirectUrl, setRedirectUrl] = useState<string | null>('https://t.me/SecretScin_bot');
  const [visitId, setVisitId] = useState<number | null>(null);
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [loading] = useState(false); // Начинаем с false, чтобы не показывать загрузку
  const [error] = useState<string | null>(null);
  
  // Флаг для отслеживания, был ли уже создан визит в этой сессии
  const visitCreatedRef = useRef<boolean>(false);
  const lastVisitAttemptRef = useRef<number>(0);
  const VISIT_COOLDOWN = 5 * 60 * 1000; // 5 минут - защита от дубликатов

  // Функция для быстрого получения ссылки на бота (без создания визита)
  const loadBotUrl = async () => {
    try {
      const url = await settingsService.getTelegramBotUrlPublic();
      setRedirectUrl(url);
    } catch (error: any) {
      console.error('Failed to load bot URL:', error);
      // При ошибке оставляем текущую ссылку (не меняем на дефолтную, если уже установлена)
    }
  };

  // Функция для создания визита в фоне (для статистики)
  const createVisitInBackground = async () => {
    try {
      const code = getUrlParam('code');
      const now = Date.now();
      
      // Проверяем, нужно ли создавать визит
      const shouldCreateVisit = !visitCreatedRef.current && 
                                (now - lastVisitAttemptRef.current) > VISIT_COOLDOWN;
      
      if (!shouldCreateVisit) {
        return;
      }

      lastVisitAttemptRef.current = now;
      const fingerprint = generateFingerprint();
      
      // Создаем визит в фоне, не блокируя UI
      try {
        const visitResult = await visitService.createVisit({
          fingerprint,
          referrer: document.referrer || undefined,
          ua: navigator.userAgent,
          linkCode: code || undefined,
        }, code || undefined);
        
        if (visitResult?.visitId !== undefined && visitResult.visitId !== -1) {
          setVisitId(visitResult.visitId);
          visitCreatedRef.current = true;
        }
      } catch (visitError: any) {
        // Игнорируем ошибки создания визита - не критично для работы сайта
        console.error('Failed to create visit:', visitError?.message || visitError);
      }
    } catch (error: any) {
      console.error('Error in createVisitInBackground:', error);
    }
  };

  useEffect(() => {
    const code = getUrlParam('code');
    if (code) setLinkCode(code);

    // Сразу загружаем правильную ссылку (без создания визита)
    // Это гарантирует, что пользователь увидит правильную ссылку как можно быстрее
    loadBotUrl();

    // Затем создаем визит в фоне для статистики (не блокирует UI)
    // Используем небольшую задержку, чтобы не нагружать сервер сразу
    const visitTimeoutId = setTimeout(() => {
      createVisitInBackground();
    }, 1000); // 1 секунда задержка для создания визита (не критично для UI)

    // Обновляем ссылку каждые 30 секунд (на случай, если админ изменил её)
    const interval = setInterval(() => {
      loadBotUrl();
    }, 30000); // 30 секунд

    // Обновляем ссылку при возврате фокуса на страницу
    const handleFocus = () => {
      loadBotUrl();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearTimeout(visitTimeoutId);
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
          <div className="absolute bottom-0 right-[-10%] w-[500px] h-[500px] bg-pink-900/20 rounded-full blur-[100px] animate-pulse-slow" />
        </div>

        {/* Sections */}
        <Hero />
        <ErrorBoundary>
          <Suspense fallback={<div className="min-h-[200px]" />}>
            <Chat />
          </Suspense>
        </ErrorBoundary>
        <Suspense fallback={<div className="min-h-[200px]" />}>
          <Showcase />
        </Suspense>
        <Suspense fallback={<div className="min-h-[200px]" />}>
          <Benefits />
        </Suspense>
        <Suspense fallback={<div className="min-h-[200px]" />}>
          <Stats />
        </Suspense>
        <Suspense fallback={<div className="min-h-[200px]" />}>
          <Steps />
        </Suspense>
        <Suspense fallback={<div className="min-h-[200px]" />}>
          <FinalCTA />
        </Suspense>
      </div>
    </LandingProvider>
  );
}

