export async function streamMessage(messages: { role: string, content: string | any[] }[], temperature: number, model: string, onChunk: (text: string) => void, signal?: AbortSignal) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ messages, temperature, model }),
      signal
    });

    if (!response.ok) {
      let errorMsg = 'Connection failed. Please check your internet connection.';
      try {
        const errData = await response.json();
        if (errData && errData.error) {
          errorMsg = typeof errData.error === 'string' ? errData.error : (errData.error.message || JSON.stringify(errData.error));
        }
      } catch (e) {}
      
      if (response.status === 413) throw new Error(errorMsg || 'Payload too large. Please upload a smaller image.');
      if (response.status === 401 || response.status === 403) throw new Error(errorMsg || 'Invalid API Key: AI service unavailable.');
      if (response.status === 429) throw new Error(errorMsg || 'Rate Limit: AI service is busy. Please try again shortly.');
      throw new Error(errorMsg);
    }

    if (!response.body) throw new Error('No response body');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let buffer = '';

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.error) {
                const errMsg = typeof data.error === 'string' ? data.error : (data.error.message || JSON.stringify(data.error));
                throw new Error(errMsg);
              }
              const content = data.choices?.[0]?.delta?.content;
              if (content) {
                onChunk(content);
              }
            } catch (e) {
              // ignore parse errors for partial chunks
            }
          }
        }
      }
    }
  } catch (error: any) {
    if (error.name === 'AbortError') throw error;
    throw new Error(error.message || 'Something went wrong while generating a response.');
  }
}

export async function generateChatTitle(firstMessage: string): Promise<string> {
  try {
    if (firstMessage.trim().split(' ').length < 3) {
      return firstMessage.trim().substring(0, 40) || 'New Chat';
    }

    const messages = [
      { role: 'system', content: "Generate a short, 2-4 word title summarizing the user's message. Do NOT answer the prompt. Respond ONLY with the title itself. No quotes, no punctuation, no intro." },
      { role: 'user', content: firstMessage }
    ];

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        messages,
        model: 'llama-3.1-8b-instant',
        temperature: 0.3,
        max_tokens: 15
      })
    });

    if (!response.ok) return 'New Chat';

    const reader = response.body?.getReader();
    if (!reader) return 'New Chat';
    
    const decoder = new TextDecoder();
    let title = '';
    let done = false;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.choices?.[0]?.delta?.content;
              if (content) title += content;
            } catch (e) {}
          }
        }
      }
    }
    
    return title.replace(/["']/g, '').trim() || 'New Chat';
  } catch (err) {
    return 'New Chat';
  }
}
