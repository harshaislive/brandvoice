import promptConfig from '@/config/brand-prompts.json'

export type BrandPromptSet = {
  main: string
  transform: string
  justification: string
}

export type PromptVariables = {
  original_content: string
  transformed_content?: string
  content_type: string
  target_audience: string
  additional_context?: string
}

export const CANONICAL_BRAND_PROMPTS = promptConfig as BrandPromptSet

export const DEFAULT_PROMPT_SETTINGS = {
  'prompts.main': CANONICAL_BRAND_PROMPTS.main,
  'prompts.transform': CANONICAL_BRAND_PROMPTS.transform,
  'prompts.justification': CANONICAL_BRAND_PROMPTS.justification,
}

export function renderBrandPrompt(template: string, variables: PromptVariables) {
  const values: Record<string, string> = {
    original_content: variables.original_content,
    transformed_content: variables.transformed_content || '',
    content_type: variables.content_type,
    target_audience: variables.target_audience,
    additional_context: variables.additional_context?.trim() || 'None provided',
  }

  return template.replace(/\{(original_content|transformed_content|content_type|target_audience|additional_context)\}/g, (_, key: string) => values[key] || '')
}

export function parseJustification(raw: string) {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  const objectStart = cleaned.indexOf('{')
  const objectEnd = cleaned.lastIndexOf('}')
  const jsonCandidate = objectStart >= 0 && objectEnd > objectStart
    ? cleaned.slice(objectStart, objectEnd + 1)
    : cleaned
  const parsed = JSON.parse(jsonCandidate) as Record<string, unknown>
  const score = Number(parsed.quality_score)

  return {
    brand_elements_applied: Array.isArray(parsed.brand_elements_applied)
      ? parsed.brand_elements_applied.map(String).slice(0, 8)
      : [],
    audience_optimization: typeof parsed.audience_optimization === 'string'
      ? parsed.audience_optimization
      : '',
    tone_adjustments: Array.isArray(parsed.tone_adjustments)
      ? parsed.tone_adjustments.map(String).slice(0, 8)
      : [],
    quality_score: Number.isFinite(score) ? Math.max(1, Math.min(5, Math.round(score * 100) / 100)) : 3,
  }
}
