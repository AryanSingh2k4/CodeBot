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
          if (body.length > 1024 * 1024) { // 1MB max body size
            res.statusCode = 413;
            res.end(JSON.stringify({ error: 'Payload too large' }));
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
              if (typeof msg.content !== 'string') {
                 res.statusCode = 400;
                 return res.end(JSON.stringify({ error: 'Invalid message content' }));
              }
              totalChars += msg.content.length;
            }
            if (totalChars > 8000) {
              res.statusCode = 400;
              return res.end(JSON.stringify({ error: 'Prompt exceeds maximum allowed size (8000 chars)' }));
            }

            let targetModel = parsedBody.model;
            if (targetModel === 'gpt-oss' || !targetModel) {
              targetModel = 'openai/gpt-oss-120b:free';
            } else if (targetModel === 'llama') {
              targetModel = 'llama-3.1-8b-instant';
            }

            let openRouterApiKey = '';
            if (fs.existsSync(envPath)) {
               const envContent = fs.readFileSync(envPath, 'utf8');
               const match = envContent.match(/OPENROUTER_API_KEY=(.*)/);
               if (match) openRouterApiKey = match[1].trim();
            }

            const useOpenRouter = targetModel.includes('openai/') || targetModel.includes('openrouter/') || (!groqApiKey && openRouterApiKey);

            if (useOpenRouter) {
               const orReq = https.request('https://openrouter.ai/api/v1/chat/completions', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${openRouterApiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://github.com/AryanSingh2k4/CodeBot',
                    'X-Title': 'CodeBot',
                  }
               }, (orRes) => {
                  res.writeHead(orRes.statusCode || 200, {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive'
                  });
                  orRes.pipe(res);
               });

               orReq.on('error', () => {
                 res.statusCode = 500;
                 res.end(JSON.stringify({ error: 'Internal API Error' }));
               });

               orReq.write(JSON.stringify({
                 messages: parsedBody.messages,
                 model: targetModel,
                 temperature: parsedBody.temperature ?? 0.7,
                 max_tokens: parsedBody.max_tokens ?? 2048,
                 stream: true
               }));
               
               orReq.end();
            } else {
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
            }
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
