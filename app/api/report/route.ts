import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { summary } = await req.json();
  if (!summary) return NextResponse.json({ error: 'missing summary' }, { status: 400 });
  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 800,
      system: `あなたはアンガーマネジメントの専門家AIです。
ユーザーの怒りトリガー診断結果をもとに、パーソナルレポートを生成してください。

以下の構成で、共感的かつ具体的に書いてください（合計300〜400字）：

【あなたの怒りの傾向】
最も反応が強かったトリガーを2〜3つ挙げ、「〈権威からの否定〉と〈不公平感〉に特に敏感です」のような形でまとめる。

【なぜそれに怒りやすいのか】
その怒りパターンの背景にある心理的な理由を優しく説明する。

【実践アドバイス】
その傾向を踏まえた、具体的な対処法を2つ提示する。

マークダウンや記号は使わず、自然な日本語で書いてください。`,
      messages: [{ role: 'user', content: `診断結果：\n${summary}` }],
    });
    const report = (msg.content[0] as { text: string }).text.trim();
    return NextResponse.json({ report });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
