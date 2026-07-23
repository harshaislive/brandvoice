const RECENT_DRAFT_LABEL_LIMIT = 58

export function getRecentDraftLabel(content: string) {
  const normalized = content.replace(/\s+/g, ' ').trim()
  if (!normalized) return 'Untitled transformation'

  const sentenceMatch = normalized.match(/^.*?[.!?](?=\s|$)/)
  const firstSentence = sentenceMatch?.[0] || normalized

  if (firstSentence.length <= RECENT_DRAFT_LABEL_LIMIT) return firstSentence
  return `${firstSentence.slice(0, RECENT_DRAFT_LABEL_LIMIT - 1).trimEnd()}…`
}

export async function copyRichTransformResult(content: string) {
  const renderedResults = Array.from(
    document.querySelectorAll<HTMLElement>('[data-transform-result-content]'),
  )
  const visibleResult = renderedResults.find((element) => element.getClientRects().length > 0)
  const html = visibleResult?.innerHTML

  if (html && typeof ClipboardItem !== 'undefined' && navigator.clipboard.write) {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/plain': new Blob([content], { type: 'text/plain' }),
        'text/html': new Blob([html], { type: 'text/html' }),
      }),
    ])
    return
  }

  await navigator.clipboard.writeText(content)
}
