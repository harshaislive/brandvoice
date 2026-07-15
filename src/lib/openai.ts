import { OpenAI } from 'openai'

let openai: OpenAI | undefined

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.AZURE_OPENAI_KEY
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION

  if (!apiKey || !endpoint || !deployment || !apiVersion) {
    throw new Error('Azure OpenAI environment variables are incomplete')
  }

  if (!openai) {
    openai = new OpenAI({
      apiKey,
      baseURL: `${endpoint.replace(/\/$/, '')}/openai/deployments/${deployment}`,
      defaultQuery: { 'api-version': apiVersion },
      defaultHeaders: { 'api-key': apiKey },
    })
  }

  return openai
}

// Streaming chat completion function with optional web search
export async function createStreamingChatCompletion({
  messages,
  maxTokens = 1000,
}: {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  maxTokens?: number
  enableWebSearch?: boolean
  userLocation?: {
    country?: string
    city?: string
    region?: string
  }
}) {
  try {
    console.log('Azure OpenAI Configuration:')
    console.log('- Endpoint:', process.env.AZURE_OPENAI_ENDPOINT)
    console.log('- Deployment:', process.env.AZURE_OPENAI_DEPLOYMENT_NAME)
    console.log('- API Version:', process.env.AZURE_OPENAI_API_VERSION)
    console.log('- Full URL:', `${process.env.AZURE_OPENAI_ENDPOINT}openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`)
    
    const requestBody: Record<string, unknown> = {
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
      messages,
      max_tokens: maxTokens,
      temperature: 1,
      top_p: 1,
      stream: true,
    }

    // Add web search tool if enabled
    // Note: web_search_preview not supported in this Azure deployment
    // Commenting out for now
    /*
    if (enableWebSearch) {
      requestBody.tools = [{
        type: "web_search_preview",
        user_location: {
          type: "approximate",
          country: userLocation?.country || "US",
          city: userLocation?.city || "New York",
          region: userLocation?.region || "New York"
        }
      }]
    }
    */

    // @ts-expect-error - OpenAI SDK type mismatch with our custom Record type
    const stream = await getOpenAIClient().chat.completions.create(requestBody)

    return stream
  } catch (error) {
    console.error('OpenAI Streaming API Error:', error)
    throw new Error('Failed to generate streaming AI response')
  }
}

// Non-streaming function (for backwards compatibility)
export async function createChatCompletion({
  messages,
  maxTokens = 1000,
}: {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  maxTokens?: number
}) {
  try {
    const completion = await getOpenAIClient().chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
      messages,
      max_tokens: maxTokens,
      temperature: 1,
      top_p: 1,
    })

    return completion.choices[0]?.message?.content || ''
  } catch (error) {
    console.error('OpenAI API Error:', error)
    throw new Error('Failed to generate AI response')
  }
}
