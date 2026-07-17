'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const MARKDOWN_PATTERN = /(\*\*|__|##|###|\[.*\]\(.*\)|`.*`|\n[-*]|\n\d+\.)/

export function TransformResultContent({ content, streaming = false }: { content: string; streaming?: boolean }) {
  const hasMarkdown = MARKDOWN_PATTERN.test(content)

  if (!hasMarkdown) {
    return (
      <p className="whitespace-pre-wrap text-[16px] leading-8 text-[#39372f]">
        {content}
        {streaming ? <span className="ml-1 inline-block h-[1.05em] w-px translate-y-[2px] animate-pulse bg-[#315d3c]" aria-hidden="true" /> : null}
      </p>
    )
  }

  return (
    <div className="prose max-w-none prose-headings:font-serif prose-p:leading-8 prose-p:text-[#39372f] prose-li:text-[#39372f]">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      {streaming ? <span className="inline-block h-[1.05em] w-px animate-pulse bg-[#315d3c]" aria-hidden="true" /> : null}
    </div>
  )
}
