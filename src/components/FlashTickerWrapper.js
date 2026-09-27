'use client';
import { usePathname } from 'next/navigation';

export default function FlashTickerWrapper({ children }) {
  const pathname = usePathname();
  if (pathname && pathname.includes('/radio')) return null;
  return children;
}
