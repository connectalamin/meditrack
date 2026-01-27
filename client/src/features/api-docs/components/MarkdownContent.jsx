import { useMemo } from 'react';
import CodeBlock from './CodeBlock';

const MarkdownContent = ({ content }) => {
  const parsedContent = useMemo(() => {
    if (!content) return [];

    const lines = content.split('\n');
    const elements = [];
    let currentCodeBlock = null;
    let codeBlockLanguage = '';
    let codeBlockContent = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Handle code blocks
      if (line.startsWith('```')) {
        if (currentCodeBlock === null) {
          // Start of code block
          currentCodeBlock = true;
          codeBlockLanguage = line.substring(3).trim() || 'json';
          codeBlockContent = [];
        } else {
          // End of code block
          elements.push(
            <CodeBlock key={`code-${elements.length}`} language={codeBlockLanguage} title={codeBlockLanguage}>
              {codeBlockContent.join('\n')}
            </CodeBlock>
          );
          currentCodeBlock = null;
          codeBlockLanguage = '';
          codeBlockContent = [];
        }
        continue;
      }

      if (currentCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }

      // Handle headings
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={`h1-${elements.length}`} className="text-4xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-[#F8FAFC]">
            {parseInlineMarkdown(line.substring(2))}
          </h1>
        );
        continue;
      }
      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={`h2-${elements.length}`} className="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-[#F8FAFC]">
            {parseInlineMarkdown(line.substring(3))}
          </h2>
        );
        continue;
      }
      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${elements.length}`} className="text-lg font-semibold mt-6 mb-3 text-slate-900 dark:text-[#F8FAFC]">
            {parseInlineMarkdown(line.substring(4))}
          </h3>
        );
        continue;
      }

      // Handle empty lines
      if (line.trim() === '') {
        elements.push(<br key={`br-${elements.length}`} />);
        continue;
      }

      // Handle lists
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const listItems = [];
        let j = i;
        while (j < lines.length && (lines[j].trim().startsWith('- ') || lines[j].trim().startsWith('* ') || lines[j].trim() === '')) {
          if (lines[j].trim() !== '') {
            const listText = lines[j].trim().substring(2);
            listItems.push(
              <li key={`li-${listItems.length}`} className="mb-1">
                {parseInlineMarkdown(listText)}
              </li>
            );
          }
          j++;
        }
        if (listItems.length > 0) {
          elements.push(
            <ul key={`ul-${elements.length}`} className="list-disc list-inside mb-4 space-y-1 text-slate-600 dark:text-[#94a3b8]">
              {listItems}
            </ul>
          );
          i = j - 1;
          continue;
        }
      }

      // Handle regular paragraphs
      elements.push(
        <p key={`p-${elements.length}`} className="mb-4 text-slate-600 dark:text-[#94a3b8]">
          {parseInlineMarkdown(line)}
        </p>
      );
    }

    // Handle any remaining code block
    if (currentCodeBlock && codeBlockContent.length > 0) {
      elements.push(
        <CodeBlock key={`code-${elements.length}`} language={codeBlockLanguage} title={codeBlockLanguage}>
          {codeBlockContent.join('\n')}
        </CodeBlock>
      );
    }

    return elements;
  }, [content]);

  return <div className="prose prose-slate max-w-none">{parsedContent}</div>;
};

// Parse inline markdown (bold, code, links)
const parseInlineMarkdown = (text) => {
  if (!text) return text;

  const parts = [];
  let currentIndex = 0;

  // Match patterns: **bold**, `code`, [link](url)
  const patterns = [
    { regex: /\*\*([^*]+)\*\*/g, render: (match, content) => <strong key={`strong-${currentIndex++}`} className="font-bold text-slate-900 dark:text-[#F8FAFC]">{content}</strong> },
    { regex: /`([^`]+)`/g, render: (match, content) => <code key={`code-${currentIndex++}`} className="bg-slate-100 dark:bg-[#27335D] px-1.5 py-0.5 rounded text-xs font-mono text-emerald-600 dark:text-[#34D399]">{content}</code> },
    { regex: /\[([^\]]+)\]\(([^)]+)\)/g, render: (match, text, url) => <a key={`link-${currentIndex++}`} href={url} className="text-emerald-600 dark:text-[#34D399] hover:underline">{text}</a> },
  ];

  let lastIndex = 0;
  const matches = [];

  // Collect all matches
  patterns.forEach(({ regex, render }) => {
    let match;
    regex.lastIndex = 0;
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length,
        render: render(match[0], match[1], match[2]),
      });
    }
  });

  // Sort matches by index
  matches.sort((a, b) => a.index - b.index);

  // Build parts array
  matches.forEach((match) => {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    // Add rendered match
    parts.push(match.render);
    lastIndex = match.index + match.length;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
};

export default MarkdownContent;
