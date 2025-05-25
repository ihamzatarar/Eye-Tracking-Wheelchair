import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

const DocumentationPage: React.FC = () => {
  const [markdown, setMarkdown] = useState('');

  useEffect(() => {
    fetch('/README.md')
      .then((res) => res.text())
      .then(setMarkdown);
  }, []);

  return (
    <div className="pt-20 pb-16 min-h-screen bg-background">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-center">Documentation</h1>
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <ReactMarkdown>{markdown}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default DocumentationPage; 