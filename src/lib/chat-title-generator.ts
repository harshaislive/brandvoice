// Utility to generate smart chat titles from the first message

export function generateChatTitle(message: string): string {
  // Remove extra whitespace and normalize
  const cleaned = message.trim().replace(/\s+/g, ' ')
  
  // If message is very short, use it as is (up to 4 words)
  const words = cleaned.split(' ')
  if (words.length <= 4) {
    return cleaned.slice(0, 30) // Max 30 characters
  }
  
  // For longer messages, extract key terms and create a meaningful title
  const stopWords = new Set([
    'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours',
    'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers',
    'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves',
    'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are',
    'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does',
    'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until',
    'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into',
    'through', 'during', 'before', 'after', 'above', 'below', 'up', 'down', 'in', 'out',
    'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'can', 'could',
    'would', 'should', 'may', 'might', 'will', 'shall'
  ])
  
  // Extract meaningful words
  const meaningfulWords = words
    .filter(word => {
      const lower = word.toLowerCase().replace(/[^\w]/g, '')
      return lower.length > 2 && !stopWords.has(lower)
    })
    .slice(0, 4) // Take up to 4 meaningful words
  
  if (meaningfulWords.length === 0) {
    // Fallback: use first few words
    return words.slice(0, 3).join(' ').slice(0, 30)
  }
  
  // Join meaningful words and capitalize first letter
  const title = meaningfulWords.join(' ').slice(0, 30)
  return title.charAt(0).toUpperCase() + title.slice(1).toLowerCase()
}

// Generate title specifically for new conversations
export function generateNewConversationTitle(firstMessage: string): string {
  const title = generateChatTitle(firstMessage)
  
  // Ensure it's not too generic
  if (title.toLowerCase().includes('hello') || title.toLowerCase().includes('hi')) {
    return 'New Conversation'
  }
  
  return title
}