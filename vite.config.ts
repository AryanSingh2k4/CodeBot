import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import https from 'https'
import fs from 'fs'
import path from 'path'

const rateLimitMap = new Map<string, { count: number, resetTime: number }>();

const apiPlugin = () => ({
  name: 'api-plugin',
  configureServer(server: any) {
    server.middlewares.use((req: any, res: any, next: any) => {
      if (req.url === '/api/chat' && req.method === 'POST') {
        const ip = req.socket?.remoteAddress || 'unknown';
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
          res.statusCode = 429;
          return res.end(JSON.stringify({ error: 'Too many requests. Please wait and try again.' }));
        }

        let groqApiKey = '';
        const envPath = path.resolve(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
          const envContent = fs.readFileSync(envPath, 'utf8');
          const match = envContent.match(/GROQ_API_KEY=(.*)/);
          if (match) groqApiKey = match[1].trim();
        }
        
        let body = '';
        req.on('data', (chunk: any) => { 
          body += chunk.toString(); 
          if (body.length > 10 * 1024 * 1024) { // 10MB max body size
            res.statusCode = 413;
            res.end(JSON.stringify({ error: 'Payload too large. Please upload a smaller image.' }));
            req.socket.destroy();
          }
        });
        req.on('end', () => {
          try {
            const parsedBody = JSON.parse(body);
            if (!parsedBody.messages || !Array.isArray(parsedBody.messages)) {
              res.statusCode = 400;
              return res.end(JSON.stringify({ error: 'Malformed request' }));
            }
            if (parsedBody.messages.length > 20) {
              res.statusCode = 400;
              return res.end(JSON.stringify({ error: 'Conversation history too long (max 20 messages)' }));
            }
            let totalChars = 0;
            for (const msg of parsedBody.messages) {
              if (typeof msg.content === 'string') {
                totalChars += msg.content.length;
              } else if (Array.isArray(msg.content)) {
                for (const part of msg.content) {
                  if (part.type === 'text' && typeof part.text === 'string') {
                    totalChars += part.text.length;
                  }
                }
              } else {
                 res.statusCode = 400;
                 return res.end(JSON.stringify({ error: 'Invalid message content' }));
              }
            }
            if (totalChars > 8000) {
              res.statusCode = 400;
              return res.end(JSON.stringify({ error: 'Prompt exceeds maximum allowed size (8000 chars)' }));
            }

            let targetModel = parsedBody.model;
            if (targetModel === 'gpt-oss' || !targetModel) {
              targetModel = 'openai/gpt-oss-120b';
            } else if (targetModel === 'llama') {
              targetModel = 'llama-3.1-8b-instant';
            }

            let hasImage = false;
            for (const msg of parsedBody.messages) {
              if (Array.isArray(msg.content)) {
                for (const part of msg.content) {
                  if (part.type === 'image_url') hasImage = true;
                }
              }
            }

            if (hasImage) {
               targetModel = 'meta-llama/llama-4-scout-17b-16e-instruct';
            }

            const groqReq = https.request('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${groqApiKey}`,
                'Content-Type': 'application/json'
              }
            }, (groqRes) => {
              res.writeHead(groqRes.statusCode || 200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
              });
              groqRes.pipe(res);
            });
            
            groqReq.on('error', () => {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Internal API Error' }));
            });
            
            groqReq.write(JSON.stringify({
              messages: parsedBody.messages,
              model: targetModel,
              temperature: parsedBody.temperature ?? 0.7,
              max_tokens: parsedBody.max_tokens ?? 2048,
              stream: true
            }));
            
            groqReq.end();
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'An error occurred while processing your request' }));
          }
        });
      } else {
        next();
      }
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apiPlugin()],
})
