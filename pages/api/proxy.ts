import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { url, apiKey, ...rest } = req.body;
  try {
    const apiRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}),
        'User-Agent': 'DMXAPI/1.0.0 (https://www.dmxapi.com)'
      },
      body: JSON.stringify(rest)
    });
    res.status(apiRes.status).send(await apiRes.text());
  } catch (e) {
    res.status(500).json({ error: e?.toString() });
  }
}
