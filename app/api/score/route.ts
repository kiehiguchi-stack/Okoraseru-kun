import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { provoke, response } = await req.json();
  if (!provoke || !response) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 });
  }
  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 256,
      system: `あなたはアンガーマネジメントトレーニングの評価AIです。
挑発に対する返答を3軸で評価し、必ずJSONのみで返してください。前置き・説明・マークダウン不要。
形式: {"calm":1-10,"word":1-10,"emo":1-10,"comment":"日本語で50字以内のコメント"}`,
      messages: [{ role: 'user', content: `挑発：「${provoke}」\n返答：「${response}」` }],
    });
    const raw = (msg.content[0] as { text: string }).text.trim();
    const json = JSON.parse(raw.replace(/```json|```/g, '').trim());
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
