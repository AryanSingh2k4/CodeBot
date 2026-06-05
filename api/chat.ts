import Groq from 'groq-sdk';

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
    if (textBody.length > 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'Payload too large' }), { status: 413 });
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
      if (typeof msg.content !== 'string') {
          return new Response(JSON.stringify({ error: 'Invalid message content' }), { status: 400 });
      }
      totalChars += msg.content.length;
    }
    if (totalChars > 8000) {
      return new Response(JSON.stringify({ error: 'Prompt exceeds maximum allowed size (8000 chars)' }), { status: 400 });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completion = await groq.chat.completions.create({
      messages,
      model: model || 'llama-3.1-8b-instant',
      temperature: temperature ?? 0.7,
      max_tokens: max_tokens || 2048,
      stream: true,
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              const payload = { choices: [{ delta: { content } }] };
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`));
            }
          }
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error: any) {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ error: 'Stream error occurred' })}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
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
