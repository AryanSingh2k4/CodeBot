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

export async function searchWeb(query: string): Promise<string> {
  try {
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    });
    
    if (!response.ok) {
      console.error('Search error:', await response.text());
      return '';
    }

    const data = await response.json();
    if (!data.results || data.results.length === 0) return '';

    const searchContext = data.results.map((r: any) => `Source: ${r.url}\n${r.content}`).join('\n\n');
    return `[WEB SEARCH RESULTS FOR "${query}"]\n${searchContext}\n[/WEB SEARCH RESULTS]`;
  } catch (err) {
    console.error('Failed to search web:', err);
    return '';
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

export async function getNonStreamingResponse(messages: any[], model: string): Promise<string> {
  let fullText = '';
  await streamMessage(messages, 0.7, model, (chunk) => { fullText += chunk; });
  return fullText;
}

export async function executeAgenticLoop(userPrompt: string): Promise<string> {
   if (!userPrompt) return '';
   
   // Step 1: Parallel Brainstorming across 4 different models
   const brainstormPrompt = `You are an expert strategist. Provide your best logical approach to solve the following problem. Be concise and focus purely on logic.\n\nProblem:\n${userPrompt}`;
   
   const [approach1, approach2, approach3, approach4] = await Promise.all([
     getNonStreamingResponse([{ role: 'user', content: brainstormPrompt }], 'llama-3.3-70b-versatile').catch(e => `Model 1 error: ${e.message}`),
     getNonStreamingResponse([{ role: 'user', content: brainstormPrompt }], 'meta-llama/llama-4-scout-17b-16e-instruct').catch(e => `Model 2 error: ${e.message}`),
     getNonStreamingResponse([{ role: 'user', content: brainstormPrompt }], 'qwen/qwen3-32b').catch(e => `Model 3 error: ${e.message}`),
     getNonStreamingResponse([{ role: 'user', content: brainstormPrompt }], 'openai/gpt-oss-120b').catch(e => `Model 4 error: ${e.message}`)
   ]);

   // Step 2: Synthesis and Critique by the Heavyweight
   const critiquePrompt = `You are an expert judge. Here are 4 approaches to solve a problem from 4 different AI models. Critique them ruthlessly, find flaws or edge-cases in each, and synthesize the absolute best, flawless combined approach.\n\nProblem:\n${userPrompt}\n\nApproach 1 (Llama 70B):\n${approach1}\n\nApproach 2 (Llama 4 Scout):\n${approach2}\n\nApproach 3 (Qwen Coder):\n${approach3}\n\nApproach 4 (GPT-OSS 120B):\n${approach4}`;
   
   const critique = await getNonStreamingResponse([{ role: 'user', content: critiquePrompt }], 'llama-3.3-70b-versatile').catch(e => `Critique error: ${e.message}`);

   return `[INTERNAL REASONING LOG]\n*** Approach 1 (Llama 70B) ***\n${approach1}\n\n*** Approach 2 (Llama 4 Scout) ***\n${approach2}\n\n*** Approach 3 (Qwen Coder) ***\n${approach3}\n\n*** Approach 4 (GPT-OSS 120B) ***\n${approach4}\n\n*** Synthesis & Final Plan ***\n${critique}\n[/INTERNAL REASONING LOG]`;
}
