import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

// API: /api/styles
// 返回所有style目录下的风格文件名、第一行label和全部内容
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 兼容Vercel/Next.js云端和本地路径
    let styleDir = path.resolve(__dirname, '../../../style');
    if (!fs.existsSync(styleDir)) {
      styleDir = path.join(process.cwd(), 'style');
    }
    if (!fs.existsSync(styleDir)) {
      return res.status(500).json({ error: 'style目录不存在' });
    }
    const files = fs.readdirSync(styleDir).filter(f => f.endsWith('.md'));
    const data = files.map(name => {
      const content = fs.readFileSync(path.join(styleDir, name), 'utf-8');
      const firstLine = content.split('\n')[0].replace(/^#\s*/, '').trim();
      return {
        name,
        label: firstLine || name,
        content
      };
    });
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: '读取风格文件失败' });
  }
} 