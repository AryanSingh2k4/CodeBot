
export const config = {
  runtime: 'edge',
};

const rateLimitMap = new Map<string, { count: number, resetTime: number }>();

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  const limitInfo = rateLimitMap.get(ip) || { count: 0, resetTime: now + 60000 };
  
  if (now > limitInfo.resetTime) {
    limitInfo.count = 1;
    limitInfo.resetTime = now + 60000;
  } else {
    limitInfo.count++;
  }
  rateLimitMap.set(ip, limitInfo);
  
  if (limitInfo.count > 10) {
    return new Response(JSON.stringify({ error: 'Too many requests. Please wait and try again.' }), { 
      status: 429, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  try {
    const textBody = await req.text();
    if (textBody.length > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'Payload too large. Please upload a smaller image.' }), { status: 413 });
    }
    const { messages, model, temperature, max_tokens } = JSON.parse(textBody);

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Malformed request' }), { status: 400 });
    }
    if (messages.length > 20) {
      return new Response(JSON.stringify({ error: 'Conversation history too long (max 20 messages)' }), { status: 400 });
    }
    let totalChars = 0;
    for (const msg of messages) {
      if (typeof msg.content === 'string') {
        totalChars += msg.content.length;
      } else if (Array.isArray(msg.content)) {
        for (const part of msg.content) {
          if (part.type === 'text' && typeof part.text === 'string') {
            totalChars += part.text.length;
          }
        }
      } else {
        return new Response(JSON.stringify({ error: 'Invalid message content' }), { status: 400 });
      }
    }
    if (totalChars > 500000) {
      return new Response(JSON.stringify({ error: 'Prompt exceeds maximum allowed size (500000 chars)' }), { status: 400 });
    }

    const groqApiKey = process.env.GROQ_API_KEY;

    let targetModel = model;
    if (targetModel === 'gpt-oss' || !targetModel) {
      targetModel = 'openai/gpt-oss-120b';
    } else if (targetModel === 'llama') {
      targetModel = 'llama-3.1-8b-instant';
    }

    let hasImage = false;
    for (const msg of messages) {
      if (Array.isArray(msg.content)) {
        for (const part of msg.content) {
          if (part.type === 'image_url') hasImage = true;
        }
      }
    }

    if (hasImage) {
       targetModel = 'meta-llama/llama-4-scout-17b-16e-instruct';
    }
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        model: targetModel,
        temperature: temperature ?? 0.7,
        max_tokens: max_tokens || 2048,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errData = (await response.json().catch(() => ({}))) as any;
      return new Response(JSON.stringify({ error: errData.error?.message || errData.error || 'Groq API error' }), { 
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'An error occurred while processing your request' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
