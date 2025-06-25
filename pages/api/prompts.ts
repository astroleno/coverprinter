import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type } = req.query;
  
  if (!type || typeof type !== 'string') {
    return res.status(400).json({ error: 'Missing type parameter' });
  }

  try {
    // 读取对应的prompt文件
    const promptPath = path.join(process.cwd(), 'prompt', `${type}.md`);
    
    if (!fs.existsSync(promptPath)) {
      return res.status(404).json({ error: `Prompt file ${type}.md not found` });
    }

    const content = fs.readFileSync(promptPath, 'utf-8');
    
    res.status(200).json({ content });
  } catch (error) {
    console.error('Error reading prompt file:', error);
    res.status(500).json({ error: 'Failed to read prompt file' });
  }
} 