'use client';
import { useState, useCallback, useRef } from 'react';

type Mode = 'endurance' | 'immunity';
type Cat = 'workplace' | 'client' | 'private';
type Page = 'setup' | 'train' | 'result';
interface ProvokeEntry { nm: string; rl: string; av: string; text: string; }
interface ScoreEntry { calm: number; word: number; emo: number; }

const PROVOCATIONS: Record<Cat, Record<number, ProvokeEntry[]>> = {
  workplace: {
    1: [
      { nm:'山田先輩', rl:'同僚（5年先輩）', av:'山', text:'あれ、まだここで詰まってるんですか？ちょっと時間かかりすぎじゃないですかね。' },
      { nm:'木村部長', rl:'直属の上司', av:'木', text:'この資料、もう少し見やすくまとめてほしかったな。' },
    ],
    2: [
      { nm:'山田先輩', rl:'同僚（5年先輩）', av:'山', text:'それ、前にも言いましたよね？なんで覚えてないんですか。' },
      { nm:'木村部長', rl:'直属の上司', av:'木', text:'やる気あるんですか？この程度のことに何時間かけてるんだ。' },
      { nm:'鈴木さん', rl:'隣の部署の先輩', av:'鈴', text:'普通わかりますよね、これ。説明するの、正直疲れます。' },
    ],
    3: [
      { nm:'木村部長', rl:'直属の上司', av:'木', text:'また同じミスですか。正直あなたに任せると毎回フォローしないといけない。他の担当に変えることも考えています。' },
      { nm:'山田先輩', rl:'同僚（5年先輩）', av:'山', text:'あなたが入ってからチームの雰囲気悪くなった気がするんですよね。' },
    ],
    4: [
      { nm:'木村部長', rl:'直属の上司', av:'木', text:'あなたのせいでプロジェクトが遅れてるって、わかってますよね。チームの足を引っ張るくらいなら最初から言ってください。' },
      { nm:'山田先輩', rl:'同僚（5年先輩）', av:'山', text:'正直、あなたがいないほうが仕事が回るって思ってる人、何人かいると思いますよ。' },
    ],
    5: [
      { nm:'木村部長', rl:'直属の上司', av:'木', text:'あなたみたいな人を採用したこと、会社として失敗だったと思いますよ。' },
      { nm:'山田先輩', rl:'同僚（5年先輩）', av:'山', text:'はっきり言います。あなたはこの仕事に向いていないと思います。' },
    ],
  },
  client: {
    1: [
      { nm:'田中部長', rl:'クライアント担当者', av:'田', text:'先日の提案書、もう少し質を上げてほしかったですね。' },
      { nm:'佐藤社長', rl:'クライアント経営者', av:'佐', text:'この程度の内容で通ると思ってたんですか？' },
    ],
    2: [
      { nm:'田中部長', rl:'クライアント担当者', av:'田', text:'先週の資料、もう少し丁寧に作れませんかね。毎回修正に時間を取られてるんですよ。' },
      { nm:'佐藤社長', rl:'クライアント経営者', av:'佐', text:'うちの担当者でもこのくらいは作れますよ。プロとして頼んでる意味あるんですかね。' },
    ],
    3: [
      { nm:'田中部長', rl:'クライアント担当者', av:'田', text:'また同じミスですか。担当者変えてもらうことも考えてます。' },
      { nm:'佐藤社長', rl:'クライアント経営者', av:'佐', text:'これだけのフィーを払ってこのアウトプットは、さすがに納得できないですよ。' },
    ],
    4: [
      { nm:'田中部長', rl:'クライアント担当者', av:'田', text:'上司に報告させてもらいます。この対応は看過できないレベルです。' },
      { nm:'佐藤社長', rl:'クライアント経営者', av:'佐', text:'契約解除も視野に入れて検討しています。' },
    ],
    5: [
      { nm:'田中部長', rl:'クライアント担当者', av:'田', text:'正式にクレームを入れます。今後一切、あなたとは仕事しません。' },
      { nm:'佐藤社長', rl:'クライアント経営者', av:'佐', text:'損害賠償についても弁護士に相談します。それだけ迷惑をかけられた。' },
    ],
  },
  private: {
    1: [
      { nm:'パートナー', rl:'配偶者', av:'パ', text:'また遅くなるの？最近ほんとに帰り遅いよね。' },
      { nm:'お義母さん', rl:'配偶者の母', av:'親', text:'料理、もう少し頑張れるといいわね。' },
    ],
    2: [
      { nm:'パートナー', rl:'配偶者', av:'パ', text:'いつも私ばかり家事して、あなたって本当に楽してるよね。なんで気づかないの？' },
      { nm:'お義母さん', rl:'配偶者の母', av:'親', text:'あなた、また料理に時間かかってるの？他のお嫁さんはもうとっくに準備できてるわよ。' },
    ],
    3: [
      { nm:'パートナー', rl:'配偶者', av:'パ', text:'正直、結婚して後悔してる部分もあるって言ったら怒る？' },
      { nm:'お義母さん', rl:'配偶者の母', av:'親', text:'息子があなたと結婚してから、なんか元気なくなった気がするのよね。' },
    ],
    4: [
      { nm:'パートナー', rl:'配偶者', av:'パ', text:'もう一緒にいるのが疲れた。正直そう思うこと増えてる。' },
      { nm:'お義母さん', rl:'配偶者の母', av:'親', text:'息子には、もっといい人がいたと今でも思ってるわ。' },
    ],
    5: [
      { nm:'パートナー', rl:'配偶者', av:'パ', text:'離婚を真剣に考えてる。あなたと話してても何も変わらないから。' },
      { nm:'お義母さん', rl:'配偶者の母', av:'親', text:'あなたがいる限り、この家は幸せになれないと思ってる。' },
    ],
  },
};

const IMMUNITY_LINES: Record<Cat, ProvokeEntry[]> = {
  workplace: [
    { nm:'山田先輩', rl:'同僚（5年先輩）', av:'山', text:'それ、前にも言いましたよね？やる気あるんですか。新人でももう少し早く覚えますよ。' },
    { nm:'木村部長', rl:'直属の上司', av:'木', text:'こんな簡単なことも、まだできないんですか。他の人はとっくに終わってますよ。' },
    { nm:'鈴木さん', rl:'隣の部署の先輩', av:'鈴', text:'普通わかりますよね、これ。前にも同じこと聞きませんでしたっけ？' },
    { nm:'木村部長', rl:'直属の上司', av:'木', text:'他の部署の新人でもこのくらいできますよ。何のために研修を受けたんですか。' },
  ],
  client: [
    { nm:'田中部長', rl:'クライアント担当者', av:'田', text:'前にも同じことを指摘しましたよね。他社の担当者はこういうミスしないんですよ。' },
    { nm:'佐藤社長', rl:'クライアント経営者', av:'佐', text:'うちの担当者でもこのくらいは作れますよ。プロとして頼んでる意味あるんですかね。' },
    { nm:'田中部長', rl:'クライアント担当者', av:'田', text:'他社さんはもっとスムーズにやってくれてるんですよ。やる気を疑いますよ。' },
  ],
  private: [
    { nm:'パートナー', rl:'配偶者', av:'パ', text:'前にも言ったよね？なんで同じこと繰り返すの。やる気あるの？' },
    { nm:'お義母さん', rl:'配偶者の母', av:'親', text:'あなた、また同じ失敗？他のお嫁さんはもうとっくにできてるわよ。前にも言ったけど。' },
    { nm:'パートナー', rl:'配偶者', av:'パ', text:'いつも私ばかりやってる。あなたって本当に気がつかないよね。やる気あるの？' },
    { nm:'お義母さん', rl:'配偶者の母', av:'親', text:'普通わかるものよ、こういうことは。前にも言ったでしょ。他の人はちゃんとできてるのに。' },
  ],
};

const LV_COLORS = ['', '#22c55e', '#84cc16', '#f59e0b', '#f97316', '#ef4444'];
const card: React.CSSProperties = { background: '#181818', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 20, marginBottom: 14 };
const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#555', textTransform: 'uppercase', marginBottom: 10, display: 'block' };

function pickRandom<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function clamp(v: number) { return Math.min(10, Math.max(1, isNaN(v) ? 5 : v)); }
function avgColor(avg: number) { return avg >= 7 ? '#22c55e' : avg >= 5 ? '#f59e0b' : '#ef4444'; }

function Hud({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return <div style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px 14px' }}>
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#555', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", color: color || '#f0f0f0' }}>{value}</div>
  </div>;
}

function Stat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return <div style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
    <div style={{ fontSize: 32, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", color }}>{value}</div>
    <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{label}</div>
  </div>;
}

export default function Home() {
  const [page, setPage] = useState<Page>('setup');
  const [mode, setMode] = useState<Mode>('endurance');
  const [cats, setCats] = useState<Set<Cat>>(new Set(['workplace', 'client', 'private']));
  const [initLevel, setInitLevel] = useState(2);
  const [targetTurns, setTargetTurns] = useState(5);
  const [curTurn, setCurTurn] = useState(0);
  const [curLevel, setCurLevel] = useState(2);
  const [angerPct, setAngerPct] = useState(0);
  const [clearedTurns, setClearedTurns] = useState(0);
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [maxLevel, setMaxLevel] = useState(2);
  const [provoke, setProvoke] = useState<ProvokeEntry | null>(null);
  const [respText, setRespText] = useState('');
  const [scoring, setScoring] = useState(false);
  const [feedback, setFeedback] = useState<(ScoreEntry & { comment: string }) | null>(null);
  const used = useRef<Set<string>>(new Set());

  const toggleCat = (cat: Cat) => setCats(prev => {
    const n = new Set(prev);
    if (n.has(cat)) { if (n.size > 1) n.delete(cat); } else n.add(cat);
    return n;
  });

  const pick = useCallback((level: number): ProvokeEntry => {
    const catList = [...cats] as Cat[];
    if (mode === 'immunity') {
      const all = catList.flatMap(c => IMMUNITY_LINES[c]);
      const pool = all.filter(p => !used.current.has(p.text));
      const p = pickRandom(pool.length > 0 ? pool : all);
      used.current.add(p.text); return p;
    }
    for (let i = 0; i < 30; i++) {
      const cat = pickRandom(catList);
      const pool = PROVOCATIONS[cat]?.[level] ?? [];
      if (!pool.length) continue;
      const p = pickRandom(pool);
      if (!used.current.has(p.text)) { used.current.add(p.text); return p; }
    }
    const cat = catList[0];
    return PROVOCATIONS[cat]?.[level]?.[0] ?? { nm: '相手', rl: '-', av: '?', text: 'もう挑発ネタがありません！' };
  }, [cats, mode]);

  const start = () => {
    setCurTurn(1); setCurLevel(initLevel); setAngerPct(0);
    setClearedTurns(0); setScores([]); setMaxLevel(initLevel);
    setFeedback(null); setRespText('');
    used.current.clear();
    setProvoke(pick(initLevel));
    setPage('train');
  };

  const advance = (nextLevel: number, newAnger: number, cleared: boolean) => {
    if (cleared) setClearedTurns(c => c + 1);
    if (newAnger >= 100 || curTurn >= targetTurns) {
      setTimeout(() => setPage('result'), 2200);
    } else {
      setTimeout(() => {
        setCurTurn(t => t + 1);
        setProvoke(pick(nextLevel));
        setRespText(''); setFeedback(null);
      }, 2200);
    }
  };

  const submit = async () => {
    if (!respText.trim() || !provoke || scoring) return;
    setScoring(true);
    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provoke: provoke.text, response: respText }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const { calm, word, emo, comment } = data;
      const avg = Math.round((calm + word + emo) / 3);
      setFeedback({ calm, word, emo, comment });
      setScores(prev => [...prev, { calm, word, emo }]);
      const newAnger = Math.min(100, Math.max(0, angerPct + Math.round((10 - avg) * 1.8)));
      setAngerPct(newAnger);
      let nextLv = curLevel;
      if (mode === 'endurance' && avg >= 7 && curLevel < 5) {
        nextLv = curLevel + 1; setCurLevel(nextLv); setMaxLevel(m => Math.max(m, nextLv));
      }
      advance(nextLv, newAnger, avg >= 5);
    } catch (e) {
      alert('評価エラー: ' + String(e));
    } finally {
      setScoring(false);
    }
  };

  const skip = () => {
    const na = Math.min(100, angerPct + 8); setAngerPct(na);
    if (na >= 100 || curTurn >= targetTurns) { setPage('result'); return; }
    setCurTurn(t => t + 1); setProvoke(pick(curLevel));
    setRespText(''); setFeedback(null);
  };

  const n = scores.length || 1;
  const ac = Math.round(scores.reduce((a, s) => a + s.calm, 0) / n);
  const aw = Math.round(scores.reduce((a, s) => a + s.word, 0) / n);
  const ae = Math.round(scores.reduce((a, s) => a + s.emo, 0) / n);
  const at = Math.round((ac + aw + ae) / 3);
  const mColor = angerPct < 40 ? '#22c55e' : angerPct < 70 ? '#f59e0b' : '#ef4444';
  const lvC = LV_COLORS[curLevel] || '#f59e0b';

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#f0f0f0', fontFamily: "'Noto Sans JP',sans-serif" }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px' }}>
        <header style={{ padding: '24px 0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 24 }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 700 }}>怒らせる<span style={{ color: '#22c55e' }}>君</span></div>
          <div style={{ fontSize: 11, color: '#555', fontWeight: 700, letterSpacing: '0.05em' }}>ANGER IMMUNITY TRAINER</div>
        </header>

        {page === 'setup' && (
          <div>
            <p style={{ fontSize: 24, fontWeight: 700, marginBottom: 6, letterSpacing: '-0.02em' }}>怒り耐性トレーニング</p>
            <p style={{ color: '#888', marginBottom: 28 }}>挑発に耐えて、感情コントロールスキルを鍛えよう</p>
            <span style={lbl}>モードを選択</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              {([['endurance', '🛡️', '怒り耐久チャレンジ', '段階的に挑発レベルが上がる。何ターン冷静を保てるかが勝負。'],
                 ['immunity',  '💉', '怒り免疫トレーニング',  '職場の地雷ワードを連続で浴びて耐性をつけるモード。']] as const).map(([m, icon, title, desc]) => (
                <div key={m} onClick={() => setMode(m)} style={{ ...card, marginBottom: 0, cursor: 'pointer', border: `1px solid ${mode === m ? '#22c55e' : 'rgba(255,255,255,0.08)'}`, background: mode === m ? 'rgba(34,197,94,0.06)' : '#181818' }}>
                  <div style={{ fontSize: 24, marginBottom: 10 }}>{icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{title}</div>
                  <div style={{ fontSize: 12, color: '#888', lineHeight: 1.5 }}>{desc}</div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 20 }}>
              <span style={lbl}>シナリオカテゴリ</span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {([['workplace', '🏢 職場'], ['client', '💼 クライアント'], ['private', '🏠 プライベート']] as [Cat, string][]).map(([c, label]) => (
                  <button key={c} onClick={() => toggleCat(c)} style={{ padding: '6px 14px', border: `1px solid ${cats.has(c) ? '#22c55e' : 'rgba(255,255,255,0.15)'}`, borderRadius: 99, fontSize: 12, cursor: 'pointer', background: cats.has(c) ? 'rgba(34,197,94,0.08)' : 'transparent', color: cats.has(c) ? '#22c55e' : '#888', fontFamily: 'inherit' }}>{label}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <span style={lbl}>初期挑発レベル</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 11, color: '#555' }}>穏やか</span>
                <input type="range" min={1} max={5} value={initLevel} step={1} onChange={e => setInitLevel(Number(e.target.value))} style={{ flex: 1, accentColor: '#22c55e' }} />
                <span style={{ fontSize: 11, color: '#555' }}>極限</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#22c55e', minWidth: 100 }}>{['','Lv.1 ふんわり','Lv.2 チクチク','Lv.3 グサッ','Lv.4 ガンガン','Lv.5 極限'][initLevel]}</span>
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <span style={lbl}>目標ターン数</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {[5, 10, 15].map(n => (
                  <button key={n} onClick={() => setTargetTurns(n)} style={{ padding: '6px 18px', border: `1px solid ${targetTurns === n ? '#22c55e' : 'rgba(255,255,255,0.15)'}`, borderRadius: 8, fontSize: 13, cursor: 'pointer', background: targetTurns === n ? 'rgba(34,197,94,0.08)' : 'transparent', color: targetTurns === n ? '#22c55e' : '#888', fontFamily: 'inherit' }}>{n}ターン</button>
                ))}
              </div>
            </div>
            <button onClick={start} style={{ width: '100%', padding: 14, background: '#22c55e', color: '#000', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>トレーニング開始</button>
          </div>
        )}

        {page === 'train' && provoke && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
              <Hud label="ターン" value={`${curTurn}/${targetTurns}`} />
              <Hud label="挑発Lv" value={`Lv.${curLevel}`} color={lvC} />
              <Hud label="クリア" value={`${clearedTurns}T`} color="#22c55e" />
            </div>
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#888', marginBottom: 8, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                <span>怒りメーター</span><span style={{ fontFamily: "'Space Grotesk',sans-serif" }}>{Math.round(angerPct)}%</span>
              </div>
              <div style={{ height: 8, background: '#222', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${angerPct}%`, background: mColor, borderRadius: 4, transition: 'width 0.6s ease, background 0.4s' }} />
              </div>
            </div>
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#2a1a1a', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#ef4444', flexShrink: 0 }}>{provoke.av}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{provoke.nm}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{provoke.rl}</div>
                </div>
                <div style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, color: lvC, background: lvC + '1a', border: `1px solid ${lvC}44` }}>Lv.{curLevel}</div>
              </div>
              <div style={{ fontSize: 15, lineHeight: 1.7, padding: 14, background: '#222', borderRadius: 8, borderLeft: '3px solid #ef4444' }}>{provoke.text}</div>
            </div>
            {feedback && (
              <div style={{ ...card, borderLeft: `3px solid ${avgColor(Math.round((feedback.calm + feedback.word + feedback.emo) / 3))}` }}>
                <div style={{ display: 'flex', gap: 20, marginBottom: 8 }}>
                  {([['冷静さ', feedback.calm, '#22c55e'], ['言葉', feedback.word, '#3b82f6'], ['感情制御', feedback.emo, '#a78bfa']] as const).map(([l, v, c]) => (
                    <div key={l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 700, color: c }}>{v}/10</span>
                      <span style={{ fontSize: 10, color: '#555' }}>{l}</span>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 13, color: '#888', lineHeight: 1.6 }}>{feedback.comment}</div>
              </div>
            )}
            {!feedback && (
              <div style={card}>
                <span style={lbl}>あなたの返答</span>
                <textarea value={respText} onChange={e => setRespText(e.target.value)} onKeyDown={e => { if (e.ctrlKey && e.key === 'Enter') submit(); }} placeholder="冷静に返答してください... (Ctrl+Enter で送信)" style={{ width: '100%', minHeight: 80, resize: 'vertical', background: '#222', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#f0f0f0', fontFamily: 'inherit', fontSize: 14, padding: 12, outline: 'none', lineHeight: 1.6 }} />
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={submit} disabled={scoring || !respText.trim()} style={{ padding: '10px 20px', background: '#22c55e', color: '#000', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: scoring || !respText.trim() ? 0.5 : 1 }}>{scoring ? 'AI評価中...' : '返答して評価を受ける'}</button>
                  <button onClick={skip} style={{ padding: '10px 16px', background: 'transparent', color: '#888', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>スキップ (+8%)</button>
                </div>
              </div>
            )}
          </div>
        )}

        {page === 'result' && (
          <div style={{ paddingBottom: 40 }}>
            <p style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>トレーニング完了</p>
            <p style={{ color: '#888', marginBottom: 20 }}>お疲れさまでした</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
              <Stat label="クリアターン" value={clearedTurns} color="#22c55e" />
              <Stat label="平均スコア" value={`${at}/10`} color="#f59e0b" />
              <Stat label="到達レベル" value={`Lv.${maxLevel}`} color="#ef4444" />
            </div>
            <div style={card}>
              {([['冷静さ', ac, '#22c55e'], ['言葉の適切さ', aw, '#3b82f6'], ['感情コントロール', ae, '#a78bfa']] as const).map(([l, v, c]) => (
                <div key={l} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', marginBottom: 6 }}>
                    <span>{l}</span><span style={{ fontWeight: 700, color: '#f0f0f0', fontFamily: "'Space Grotesk',sans-serif" }}>{v}/10</span>
                  </div>
                  <div style={{ height: 6, background: '#222', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${v * 10}%`, background: c, borderRadius: 3, transition: 'width 0.8s' }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ ...card, color: '#888', fontSize: 13, lineHeight: 1.7 }}>{['今回は挑発が効きすぎました。低いレベルから繰り返し練習しましょう。','挑発に引っ張られる場面がありました。深呼吸・事実確認を意識して再挑戦を。','なかなかの耐性です。感情コントロールをさらに意識するとより向上できます。','素晴らしい！高い挑発にも動じない冷静さを発揮できています。'][Math.min(3, Math.floor(at / 3))]}</div>
            <button onClick={() => setPage('setup')} style={{ width: '100%', padding: 14, background: 'transparent', color: '#f0f0f0', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>もう一度挑戦する</button>
          </div>
        )}
      </div>
    </div>
  );
}
