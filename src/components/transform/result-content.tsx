'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function TransformResultContent({ content, streaming = false }: { content: string; streaming?: boolean }) {
  return (
    <div
      data-transform-result-content
      className="max-w-none text-[16px] leading-8 text-[#39372f]"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="mb-5 mt-8 font-serif text-[30px] font-medium leading-tight first:mt-0">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-4 mt-7 font-serif text-[25px] font-medium leading-tight first:mt-0">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-3 mt-6 font-serif text-[20px] font-medium leading-snug first:mt-0">{children}</h3>,
          p: ({ children }) => <p className="mb-5 whitespace-pre-wrap last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="mb-5 list-disc space-y-2 pl-6">{children}</ul>,
          ol: ({ children }) => <ol className="mb-5 list-decimal space-y-2 pl-6">{children}</ol>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-[#26372b]">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          blockquote: ({ children }) => <blockquote className="my-5 border-l-2 border-[#7f9b82] pl-5 italic text-[#526357]">{children}</blockquote>,
          a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-[#315d3c] underline decoration-[#8faa91] underline-offset-4 hover:text-[#203c2c]">{children}</a>,
        }}
      >
        {content}
      </ReactMarkdown>
      {streaming ? <span className="inline-block h-[1.05em] w-px animate-pulse bg-[#315d3c]" aria-hidden="true" /> : null}
    </div>
  )
}
