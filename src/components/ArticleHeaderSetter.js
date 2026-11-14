'use client';
import { useEffect } from 'react';
import { useArticleHeader } from '@/context/ArticleHeaderContext';

export default function ArticleHeaderSetter({ badge, category, pubDate }) {
  const { setArticleHeader } = useArticleHeader();

  useEffect(() => {
    setArticleHeader({
      badge: badge || 'News',
      category: category || 'Actualité',
      pubDate: pubDate || null,
    });

    return () => {
      setArticleHeader(null);
    };
  }, [badge, category, pubDate, setArticleHeader]);

  return null;
}
