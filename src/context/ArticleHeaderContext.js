'use client';
import { createContext, useContext, useState } from 'react';

const ArticleHeaderContext = createContext({
  articleHeader: null,
  setArticleHeader: () => {},
});

export function ArticleHeaderProvider({ children }) {
  const [articleHeader, setArticleHeader] = useState(null);

  return (
    <ArticleHeaderContext.Provider value={{ articleHeader, setArticleHeader }}>
      {children}
    </ArticleHeaderContext.Provider>
  );
}

export function useArticleHeader() {
  return useContext(ArticleHeaderContext);
}
