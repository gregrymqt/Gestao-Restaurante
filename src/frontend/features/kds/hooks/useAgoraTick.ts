import { useEffect, useState } from 'react';

export function useAgoraTick(intervaloMs: number = 1000): number {
  const [agoraMs, setAgoraMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setAgoraMs(Date.now());
    }, intervaloMs);

    return () => clearInterval(timer);
  }, [intervaloMs]);

  return agoraMs;
}
