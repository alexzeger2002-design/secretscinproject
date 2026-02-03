export function generateFingerprint(): string {
  // Проверяем, есть ли уже сохраненный fingerprint в sessionStorage
  const storedFingerprint = sessionStorage.getItem('browserFingerprint');
  if (storedFingerprint) {
    return storedFingerprint;
  }

  // Генерируем новый fingerprint только если его нет
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Fingerprint', 2, 2);
  }
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL(),
  ].join('|');
  
  // Простой хеш
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const fingerprintHash = `fp_${Math.abs(hash)}`;
  
  // Сохраняем в sessionStorage для этой сессии
  sessionStorage.setItem('browserFingerprint', fingerprintHash);
  
  return fingerprintHash;
}

export function getUrlParam(param: string): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}
