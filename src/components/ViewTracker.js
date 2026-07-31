'use client';

import { useEffect, useRef } from 'react';
import { incrementView } from '@/app/actions/analytics';

export default function ViewTracker({ articleId }) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!hasTracked.current && articleId) {
      hasTracked.current = true;
      incrementView(articleId);
    }
  }, [articleId]);

  return null;
}
