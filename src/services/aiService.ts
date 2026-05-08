import { GoogleGenerativeAI } from "@google/generative-ai";
import { Project, FileNode, AISettings } from "../types";

export interface AIResponse {
  message: string;
  filesToUpdate?: { path: string; content: string }[];
}

export const aiService = {
  async chat(
    message: string,
    settings: AISettings,
    project: Project,
    currentFile: FileNode | null,
    history: { role: 'user' | 'assistant'; content: string }[]
  ): Promise<AIResponse> {
    const systemPrompt = `You are an AI assistant in a web-based IDE (App Studio).
Your goal is to help the user develop their project.
Current project framework: ${project.framework}
Project structure: ${project.files.map(f => f.path).join(', ')}
${currentFile ? `Current open file: ${currentFile.path}\nContent:\n${currentFile.content}` : 'No file currently open.'}

You can suggest code changes. If you want to update one or more files, use the following format at the end of your response:
[UPDATE_FILES]
{"files": [{"path": "src/App.tsx", "content": "..."}]}
[/UPDATE_FILES]

The "content" must be the FULL content of the file.
Always respond in the user's language (Russian if they ask in Russian, otherwise English).`;

    if (settings.provider === 'google') {
      try {
        const genAI = new GoogleGenerativeAI(settings.apiKey);
        const model = genAI.getGenerativeModel({ model: settings.model });
        
        const chat = model.startChat({
          history: [
            { role: 'user', parts: [{ text: systemPrompt }] },
            { role: 'model', parts: [{ text: 'Understood. I will help you with your project.' }] },
            ...history.map(h => ({
              role: h.role === 'user' ? 'user' : 'model',
              parts: [{ text: h.content }]
            }))
          ]
        });

        const result = await chat.sendMessage(message);
        const response = result.response.text();
        return this.parseResponse(response);
      } catch (error) {
        console.error('Gemini error:', error);
        throw error;
      }
    } else if (settings.provider === 'openai') {
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.apiKey}`
          },
          body: JSON.stringify({
            model: settings.model,
            messages: [
              { role: 'system', content: systemPrompt },
              ...history.map(h => ({ role: h.role, content: h.content })),
              { role: 'user', content: message }
            ]
          })
        });
        const data = await res.json();
        return this.parseResponse(data.choices[0].message.content);
      } catch (error) {
        console.error('OpenAI error:', error);
        throw error;
      }
    } else if (settings.provider === 'anthropic') {
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': settings.apiKey,
            'anthropic-version': '2023-06-01',
            'dangerously-allow-browser': 'true'
          },
          body: JSON.stringify({
            model: settings.model,
            messages: [
              ...history.map(h => ({ role: h.role, content: h.content })),
              { role: 'user', content: message }
            ],
            system: systemPrompt,
            max_tokens: 4096
          })
        });
        const data = await res.json();
        return this.parseResponse(data.content[0].text);
      } catch (error) {
        console.error('Anthropic error:', error);
        throw error;
      }
    }

    throw new Error('Unsupported AI Provider');
  },

  parseResponse(text: string): AIResponse {
    const updateRegex = /\[UPDATE_FILES\]\s*([\s\S]*?)\s*\[\/UPDATE_FILES\]/;
    const match = text.match(updateRegex);
    
    let message = text.replace(updateRegex, '').trim();
    let filesToUpdate: { path: string; content: string }[] | undefined;

    if (match) {
      try {
        const data = JSON.parse(match[1]);
        if (data.files) {
          filesToUpdate = data.files;
        }
      } catch (e) {
        console.error('Failed to parse file updates from AI response', e);
      }
    }

    return { message, filesToUpdate };
  }
};
