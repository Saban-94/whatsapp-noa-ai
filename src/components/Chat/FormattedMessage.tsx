import React from 'react';

interface FormattedMessageProps {
  text: string;
  className?: string;
}

export const FormattedMessage: React.FC<FormattedMessageProps> = ({ text, className = '' }) => {
  if (!text) return null;

  // Regex for matching URLs (http, https, waze, www)
  const urlRegex = /(https?:\/\/[^\s]+|waze:\/\/[^\s]+|www\.[^\s]+)/gi;

  const parseTextWithLinks = (content: string): React.ReactNode[] => {
    const parts = content.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        // Strip trailing punctuation if attached to the URL
        let urlString = part;
        let trailingPunctuation = '';

        const trailingMatch = urlString.match(/([.,!?:;)\]]+)$/);
        if (trailingMatch) {
          trailingPunctuation = trailingMatch[1];
          urlString = urlString.slice(0, -trailingPunctuation.length);
        }

        let href = urlString;
        if (!href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('waze://')) {
          href = `https://${href}`;
        }

        const lowerUrl = urlString.toLowerCase();

        // Serialized Link Labels & Icons
        let displayLabel = urlString;
        let icon = '🔗';

        if (lowerUrl.includes('waze.com') || lowerUrl.includes('waze://')) {
          icon = '🗺️';
          displayLabel = 'לחץ לניווט ב-Waze';
        } else if (
          lowerUrl.includes('maps.google.com') ||
          lowerUrl.includes('maps.app.goo.gl') ||
          lowerUrl.includes('google.com/maps') ||
          lowerUrl.includes('goo.gl/maps')
        ) {
          icon = '📍';
          displayLabel = 'פתח ב-Google Maps';
        } else {
          try {
            const urlObj = new URL(href);
            const pathSnippet = urlObj.pathname !== '/' ? urlObj.pathname.slice(0, 16) + '...' : '';
            displayLabel = `${urlObj.hostname}${pathSnippet}`;
            icon = '🌐';
          } catch {
            displayLabel = urlString;
          }
        }

        return (
          <React.Fragment key={index}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-[#53bdeb] hover:text-[#84d5f8] underline transition-colors mx-1 px-1.5 py-0.5 bg-[#53bdeb]/15 hover:bg-[#53bdeb]/25 rounded-md dir-ltr align-middle"
              onClick={(e) => e.stopPropagation()}
            >
              <span>{icon}</span>
              <span>{displayLabel}</span>
            </a>
            {trailingPunctuation && <span>{trailingPunctuation}</span>}
          </React.Fragment>
        );
      }

      return parseWhatsAppFormatting(part, index);
    });
  };

  // WhatsApp Formatting: ```code```, *bold*, _italic_, ~strikethrough~
  const parseWhatsAppFormatting = (subText: string, keyPrefix: string | number): React.ReactNode => {
    // Process code blocks first ```code```
    const codeRegex = /```([^`]+)```/g;
    const codeChunks = subText.split(codeRegex);

    if (codeChunks.length > 1) {
      return (
        <span key={`code-block-${keyPrefix}`}>
          {codeChunks.map((chunk, i) => {
            if (i % 2 === 1) {
              return (
                <code
                  key={i}
                  className="font-mono bg-black/40 text-[#53bdeb] px-2 py-0.5 rounded text-[12px] border border-[#53bdeb]/30 dir-ltr inline-block my-0.5 font-bold"
                >
                  {chunk}
                </code>
              );
            }
            return parseStyles(chunk, `${keyPrefix}-${i}`);
          })}
        </span>
      );
    }

    return parseStyles(subText, keyPrefix);
  };

  const parseStyles = (subText: string, keyPrefix: string | number): React.ReactNode => {
    // Regex matching *bold*, _italic_, ~strikethrough~
    const styleRegex = /(\*[^*]+\*|_[^_]+_|~[^~]+~)/g;
    const chunks = subText.split(styleRegex);

    return (
      <span key={`styles-${keyPrefix}`}>
        {chunks.map((chunk, i) => {
          if (!chunk) return null;

          if (chunk.startsWith('*') && chunk.endsWith('*') && chunk.length > 2) {
            return (
              <strong key={i} className="font-extrabold text-white">
                {chunk.slice(1, -1)}
              </strong>
            );
          }

          if (chunk.startsWith('_') && chunk.endsWith('_') && chunk.length > 2) {
            return (
              <em key={i} className="italic text-[#e9edef]/90 font-medium">
                {chunk.slice(1, -1)}
              </em>
            );
          }

          if (chunk.startsWith('~') && chunk.endsWith('~') && chunk.length > 2) {
            return (
              <del key={i} className="line-through opacity-70">
                {chunk.slice(1, -1)}
              </del>
            );
          }

          return chunk;
        })}
      </span>
    );
  };

  return (
    <div className={`whitespace-pre-wrap leading-relaxed break-words dir-rtl ${className}`}>
      {parseTextWithLinks(text)}
    </div>
  );
};

