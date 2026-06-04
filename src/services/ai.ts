export async function streamMessage(messages: { role: string, content: string }[], onChunk: (text: string) => void) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ messages })
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) throw new Error('Invalid API Key: AI service unavailable.');
      if (response.status === 429) throw new Error('Rate Limit: AI service is busy. Please try again shortly.');
      throw new Error('Connection failed. Please check your internet connection.');
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
                throw new Error(data.error);
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
    throw new Error(error.message || 'Something went wrong while generating a response.');
  }
}
