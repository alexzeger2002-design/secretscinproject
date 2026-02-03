import { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { visitService } from '../services';
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
  // Устанавливаем дефолтный URL сразу, чтобы не показывать загрузку
  const [redirectUrl, setRedirectUrl] = useState<string | null>('https://t.me/SecretScin_bot');
  const [visitId] = useState<number | null>(null);
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [loading] = useState(false); // Начинаем с false, чтобы не показывать загрузку
  const [error] = useState<string | null>(null);
  
  // Флаг для отслеживания, был ли уже создан визит в этой сессии
  const visitCreatedRef = useRef<boolean>(false);
  const lastVisitAttemptRef = useRef<number>(0);
  const VISIT_COOLDOWN = 5 * 60 * 1000; // 5 минут - защита от дубликатов

  // Функция для получения ссылки на бота и создания визита
  const updateBotUrl = async (skipVisitCreation = false) => {
    try {
      const code = getUrlParam('code');
      
      // Проверяем, нужно ли создавать визит
      const now = Date.now();
      const shouldCreateVisit = !skipVisitCreation && 
                                !visitCreatedRef.current && 
                                (now - lastVisitAttemptRef.current) > VISIT_COOLDOWN;
      
      if (shouldCreateVisit) {
        lastVisitAttemptRef.current = now;
        const fingerprint = generateFingerprint();
        
        // Создаем визит БЕЗ retry, чтобы избежать дубликатов
        try {
          const visitResult = await Promise.race([
            visitService.createVisit({
              fingerprint,
              referrer: document.referrer || undefined,
              ua: navigator.userAgent,
              linkCode: code || undefined,
            }, code || undefined),
            new Promise<{ redirectUrl: string; visitId: number }>((resolve) => 
              setTimeout(() => resolve({ 
                redirectUrl: redirectUrl || 'https://t.me/SecretScin_bot', 
                visitId: -1 
              }), 4000) // Fallback через 4 секунды
            )
          ]);
          
          if (visitResult?.redirectUrl) {
            setRedirectUrl(visitResult.redirectUrl);
          }
          
          // Помечаем, что визит был создан (даже если visitId = -1)
          if (visitResult?.visitId !== undefined) {
            visitCreatedRef.current = true;
          }
        } catch (visitError: any) {
          // Игнорируем ошибки создания визита - не критично
          console.error('Failed to create visit:', visitError?.message || visitError);
        }
      } else if (!skipVisitCreation) {
        // Если визит уже был создан, но нужно обновить URL
        // Используем простой запрос без создания визита
        try {
          const result = await Promise.race([
            visitService.createVisit({
              fingerprint: generateFingerprint(),
              referrer: document.referrer || undefined,
              ua: navigator.userAgent,
              linkCode: code || undefined,
            }, code || undefined).catch(() => ({ redirectUrl: redirectUrl || 'https://t.me/SecretScin_bot', visitId: -1 })),
            new Promise<{ redirectUrl: string; visitId: number }>((resolve) => 
              setTimeout(() => resolve({ 
                redirectUrl: redirectUrl || 'https://t.me/SecretScin_bot', 
                visitId: -1 
              }), 2000) // Быстрый fallback для обновления URL
            )
          ]);
          
          if (result?.redirectUrl) {
            setRedirectUrl(result.redirectUrl);
          }
        } catch (error) {
          // Игнорируем ошибки - не критично
        }
      }
      // Если skipVisitCreation = true, просто ничего не делаем (URL уже установлен)
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

    // Первоначальная загрузка ссылки - с задержкой чтобы не блокировать рендер
    // Визит создается автоматически на бэкенде при запросе ссылки через updateBotUrl
    // НЕ создаем визит отдельно, чтобы избежать дублирования
    // Используем setTimeout чтобы не блокировать первоначальный рендер
    const timeoutId = setTimeout(() => {
      updateBotUrl();
    }, 100); // Небольшая задержка для первоначального рендера

    // Обновляем ссылку каждые 30 секунд (увеличено с 10 для снижения нагрузки)
    // НЕ создаем визит при обновлении - только обновляем URL
    const interval = setInterval(() => {
      updateBotUrl(true); // skipVisitCreation = true
    }, 30000); // 30 секунд

    // Обновляем ссылку при возврате фокуса на страницу (когда пользователь возвращается на вкладку)
    // НЕ создаем визит при возврате фокуса - только обновляем URL
    const handleFocus = () => {
      updateBotUrl(true); // skipVisitCreation = true
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearTimeout(timeoutId);
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

