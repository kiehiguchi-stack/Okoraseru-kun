'use client';
import { useState, useCallback, useRef } from 'react';

// ── Types ──────────────────────────────────────────────────
type Cat = 'workplace' | 'client' | 'private';
type AppPage = 'home' | 'train-setup' | 'train' | 'train-result' | 'diag-intro' | 'diag' | 'diag-result';
interface ProvokeEntry { nm: string; rl: string; av: string; text: string; }
interface ScoreEntry { calm: number; word: number; emo: number; }
interface DiagScenario { text: string; trigger: string; cat: string; }
interface DiagAnswer { scenario: DiagScenario; level: number; }

// ── Training preset data ───────────────────────────────────
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
      { nm:'木村部長', rl:'直属の上司', av:'木', text:'他の人はとっくに終わってますよ。何をそんなに時間かけてるんですか。' },
    ],
    3: [
      { nm:'木村部長', rl:'直属の上司', av:'木', text:'また同じミスですか。正直あなたに任せると毎回フォローしないといけない。他の担当に変えることも考えています。' },
      { nm:'山田先輩', rl:'同僚（5年先輩）', av:'山', text:'あなたが入ってからチームの雰囲気悪くなった気がするんですよね。' },
      { nm:'木村部長', rl:'直属の上司', av:'木', text:'このクオリティでよく提出できますね。プロ意識ってもの、あります？' },
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
      { nm:'田中部長', rl:'クライアント担当者', av:'田', text:'他社さんはもっとスムーズにやってくれてるんですよ。' },
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

// ── Diagnosis scenarios ────────────────────────────────────
const DIAG_SCENARIOS: DiagScenario[] = [
  { text: '上司に「この程度もできないの？」と言われた。', trigger: '権威からの否定', cat: 'authority' },
  { text: '自分だけ残業を頼まれ、他のメンバーは定時で帰った。', trigger: '不公平感', cat: 'unfairness' },
  { text: '会議で自分の意見が無視され、後から別の人が同じことを言って評価された。', trigger: '存在の軽視', cat: 'disrespect' },
  { text: '「前にも言いましたよね？」と人前で言われた。', trigger: '公開での批判', cat: 'public_criticism' },
  { text: 'ミスをしたとき、謝っても「でもね…」と何度も蒸し返された。', trigger: '執拗な責め', cat: 'persistence' },
  { text: '一生懸命取り組んだ仕事に対して「普通はこのくらいできるよね」と言われた。', trigger: '努力の無視', cat: 'effort_ignored' },
  { text: 'パートナーが約束を忘れて、悪びれもなかった。', trigger: '約束の軽視', cat: 'broken_promise' },
  { text: '自分の話の途中で遮られ、相手の話にすり替わった。', trigger: '話の遮断', cat: 'interruption' },
  { text: '「他の人はもっと上手くやってる」と比べられた。', trigger: '他者との比較', cat: 'comparison' },
  { text: '自分が悪いわけではないのに、責任を押しつけられた。', trigger: '理不尽な責任転嫁', cat: 'blame' },
];

const LV_COLORS = ['', '#22c55e', '#84cc16', '#f59e0b', '#f97316', '#ef4444'];
const card: React.CSSProperties = { background: '#181818', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 20, marginBottom: 14 };
const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#555', textTransform: 'uppercase', marginBottom: 10, display: 'block' };

function pickRandom<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

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
function avgColor(avg: number) { return avg >= 7 ? '#22c55e' : avg >= 5 ? '#f59e0b' : '#ef4444'; }

export default function Home() {
  const [page, setPage] = useState<AppPage>('home');

  // ── Training state ──
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

  // ── Diagnosis state ──
  const [diagIdx, setDiagIdx] = useState(0);
  const [diagLevel, setDiagLevel] = useState(5);
  const [diagAnswers, setDiagAnswers] = useState<DiagAnswer[]>([]);
  const [diagReport, setDiagReport] = useState('');
  const [diagLoading, setDiagLoading] = useState(false);
  const diagScenarios = useRef<DiagScenario[]>([]);

  const goTo = (p: AppPage) => { setPage(p); window.scrollTo(0, 0); };

  // ── Training helpers ──
  const toggleCat = (cat: Cat) => setCats(prev => {
    const n = new Set(prev); if (n.has(cat)) { if (n.size > 1) n.delete(cat); } else n.add(cat); return n;
  });

  const pick = useCallback((level: number): ProvokeEntry => {
    const catList = [...cats] as Cat[];
    for (let i = 0; i < 30; i++) {
      const cat = pickRandom(catList);
      const pool = PROVOCATIONS[cat]?.[level] ?? [];
      if (!pool.length) continue;
      const p = pickRandom(pool);
      if (!used.current.has(p.text)) { used.current.add(p.text); return p; }
    }
    const cat = catList[0];
    return PROVOCATIONS[cat]?.[level]?.[0] ?? { nm: '相手', rl: '-', av: '?', text: '挑発ネタ切れです！' };
  }, [cats]);

  const startTraining = () => {
    setCurTurn(1); setCurLevel(initLevel); setAngerPct(0);
    setClearedTurns(0); setScores([]); setMaxLevel(initLevel);
    setFeedback(null); setRespText(''); used.current.clear();
    setProvoke(pick(initLevel)); goTo('train');
  };

  const advance = (nextLevel: number, newAnger: number, cleared: boolean) => {
    if (cleared) setClearedTurns(c => c + 1);
    if (newAnger >= 100 || curTurn >= targetTurns) {
      setTimeout(() => goTo('train-result'), 10000);
    } else {
      setTimeout(() => {
        setCurTurn(t => t + 1); setProvoke(pick(nextLevel));
        setRespText(''); setFeedback(null);
      }, 10000);
    }
  };

  const submit = async () => {
    if (!respText.trim() || !provoke || scoring) return;
    setScoring(true);
    try {
      const res = await fetch('/api/score', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
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
      if (avg >= 7 && curLevel < 5) { nextLv = curLevel + 1; setCurLevel(nextLv); setMaxLevel(m => Math.max(m, nextLv)); }
      advance(nextLv, newAnger, avg >= 5);
    } catch (e) { alert('評価エラー: ' + String(e)); }
    finally { setScoring(false); }
  };

  const skip = () => {
    const na = Math.min(100, angerPct + 8); setAngerPct(na);
    if (na >= 100 || curTurn >= targetTurns) { goTo('train-result'); return; }
    setCurTurn(t => t + 1); setProvoke(pick(curLevel)); setRespText(''); setFeedback(null);
  };

  // ── Diagnosis helpers ──
  const startDiag = () => {
    const shuffled = [...DIAG_SCENARIOS].sort(() => Math.random() - 0.5).slice(0, 8);
    diagScenarios.current = shuffled;
    setDiagIdx(0); setDiagLevel(5); setDiagAnswers([]); setDiagReport('');
    goTo('diag');
  };

  const answerDiag = () => {
    const scenario = diagScenarios.current[diagIdx];
    const newAnswers = [...diagAnswers, { scenario, level: diagLevel }];
    setDiagAnswers(newAnswers);
    if (diagIdx + 1 >= diagScenarios.current.length) {
      generateReport(newAnswers);
    } else {
      setDiagIdx(i => i + 1);
      setDiagLevel(5);
    }
  };

  const generateReport = async (answers: DiagAnswer[]) => {
    goTo('diag-result');
    setDiagLoading(true);
    const summary = answers.map(a => `・「${a.scenario.text}」→ 怒り度 ${a.level}/10（トリガー：${a.scenario.trigger}）`).join('\n');
    try {
      const res = await fetch('/api/report', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary }),
      });
      const data = await res.json();
      setDiagReport(data.report || 'レポートの生成に失敗しました。');
    } catch (e) { setDiagReport('レポートの生成に失敗しました: ' + String(e)); }
    finally { setDiagLoading(false); }
  };

  // ── Result calc ──
  const n = scores.length || 1;
  const ac = Math.round(scores.reduce((a, s) => a + s.calm, 0) / n);
  const aw = Math.round(scores.reduce((a, s) => a + s.word, 0) / n);
  const ae = Math.round(scores.reduce((a, s) => a + s.emo, 0) / n);
  const at = Math.round((ac + aw + ae) / 3);
  const mColor = angerPct < 40 ? '#22c55e' : angerPct < 70 ? '#f59e0b' : '#ef4444';
  const lvC = LV_COLORS[curLevel] || '#f59e0b';

  const diagProgress = diagScenarios.current.length > 0 ? ((diagIdx) / diagScenarios.current.length) * 100 : 0;
  const topTriggers = [...diagAnswers].sort((a, b) => b.level - a.level).slice(0, 3);

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#f0f0f0', fontFamily: "'Noto Sans JP',sans-serif" }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px' }}>
        <header style={{ padding: '24px 0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 24 }}>
          <div onClick={() => goTo('home')} style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 700, cursor: 'pointer' }}>怒らせる<span style={{ color: '#22c55e' }}>君</span></div>
          <div style={{ fontSize: 11, color: '#555', fontWeight: 700, letterSpacing: '0.05em' }}>ANGER MANAGEMENT TRAINER</div>
        </header>

        {/* ── HOME ── */}
        {page === 'home' && (
          <div>
            <p style={{ fontSize: 26, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em' }}>怒りと向き合おう</p>
            <p style={{ color: '#888', marginBottom: 32, lineHeight: 1.7 }}>2つのモードで、あなたの感情コントロール力を鍛えよう。</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div onClick={() => goTo('train-setup')} style={{ ...card, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 0, transition: 'border-color 0.15s' }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>🛡️</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>挑発耐久トレーニング</div>
                <div style={{ fontSize: 12, color: '#888', lineHeight: 1.6 }}>挑発セリフに実際に返答し、AIがスコアリング。段階的にレベルが上がり、感情コントロール力を実践的に鍛える。</div>
                <div style={{ marginTop: 14, fontSize: 12, color: '#22c55e', fontWeight: 700 }}>始める →</div>
              </div>
              <div onClick={() => goTo('diag-intro')} style={{ ...card, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 0 }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>🔍</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>怒りトリガー診断</div>
                <div style={{ fontSize: 12, color: '#888', lineHeight: 1.6 }}>様々なシナリオへの反応度をスライダーで回答。AIが「あなたが特に反応しやすい怒りのパターン」を分析してレポートを生成。</div>
                <div style={{ marginTop: 14, fontSize: 12, color: '#a78bfa', fontWeight: 700 }}>診断する →</div>
              </div>
            </div>
          </div>
        )}

        {/* ── TRAIN SETUP ── */}
        {page === 'train-setup' && (
          <div>
            <button onClick={() => goTo('home')} style={{ background: 'none', border: 'none', color: '#555', fontSize: 13, cursor: 'pointer', marginBottom: 16, fontFamily: 'inherit', padding: 0 }}>← ホームに戻る</button>
            <p style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>挑発耐久トレーニング</p>
            <p style={{ color: '#888', marginBottom: 24 }}>設定を選んでスタート</p>
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
            <div style={{ marginBottom: 24 }}>
              <span style={lbl}>目標ターン数</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {[5, 10, 15].map(n => (
                  <button key={n} onClick={() => setTargetTurns(n)} style={{ padding: '6px 18px', border: `1px solid ${targetTurns === n ? '#22c55e' : 'rgba(255,255,255,0.15)'}`, borderRadius: 8, fontSize: 13, cursor: 'pointer', background: targetTurns === n ? 'rgba(34,197,94,0.08)' : 'transparent', color: targetTurns === n ? '#22c55e' : '#888', fontFamily: 'inherit' }}>{n}ターン</button>
                ))}
              </div>
            </div>
            <button onClick={startTraining} style={{ width: '100%', padding: 14, background: '#22c55e', color: '#000', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>トレーニング開始</button>
          </div>
        )}

        {/* ── TRAIN ── */}
        {page === 'train' && provoke && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
              <Hud label="ターン" value={`${curTurn}/${targetTurns}`} />
              <Hud label="挑発Lv" value={`Lv.${curLevel}`} color={lvC} />
              <Hud label="冷静維持" value={`${clearedTurns}回`} color="#22c55e" />
            </div>
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#888', marginBottom: 4, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                <span>怒りメーター</span><span style={{ fontFamily: "'Space Grotesk',sans-serif" }}>{Math.round(angerPct)}%</span>
              </div>
              <div style={{ fontSize: 11, color: '#555', marginBottom: 8 }}>あなた自身の怒りの蓄積度。100%になると怒りが爆発してゲームオーバー。</div>
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

        {/* ── TRAIN RESULT ── */}
        {page === 'train-result' && (
          <div style={{ paddingBottom: 40 }}>
            <p style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>トレーニング完了</p>
            <p style={{ color: '#888', marginBottom: 20 }}>お疲れさまでした</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
              <Stat label="冷静維持ターン" value={`${clearedTurns}回`} color="#22c55e" />
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
            <div style={{ ...card, color: '#888', fontSize: 13, lineHeight: 1.7 }}>{['今回は挑発が効きすぎました。低いレベルから繰り返し練習しましょう。', '挑発に引っ張られる場面がありました。深呼吸・事実確認を意識して再挑戦を。', 'なかなかの耐性です。感情コントロールをさらに意識するとより向上できます。', '素晴らしい！高い挑発にも動じない冷静さを発揮できています。'][Math.min(3, Math.floor(at / 3))]}</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => goTo('train-setup')} style={{ flex: 1, padding: 14, background: '#22c55e', color: '#000', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>もう一度挑戦</button>
              <button onClick={() => goTo('home')} style={{ flex: 1, padding: 14, background: 'transparent', color: '#f0f0f0', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>ホームへ</button>
            </div>
          </div>
        )}

        {/* ── DIAG INTRO ── */}
        {page === 'diag-intro' && (
          <div>
            <button onClick={() => goTo('home')} style={{ background: 'none', border: 'none', color: '#555', fontSize: 13, cursor: 'pointer', marginBottom: 16, fontFamily: 'inherit', padding: 0 }}>← ホームに戻る</button>
            <p style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>🔍 怒りトリガー診断</p>
            <div style={{ ...card, lineHeight: 1.8, color: '#aaa', fontSize: 14 }}>
              <p style={{ marginBottom: 12 }}>これから<strong style={{ color: '#f0f0f0' }}>8つのシナリオ</strong>を提示します。</p>
              <p style={{ marginBottom: 12 }}>それぞれ「もし自分がこの状況に置かれたら、どのくらい怒りを感じるか」をスライダーで答えてください。</p>
              <p>回答後、AIがあなたの怒りのパターンを分析した<strong style={{ color: '#a78bfa' }}>パーソナルレポート</strong>を生成します。</p>
            </div>
            <button onClick={startDiag} style={{ width: '100%', padding: 14, background: '#a78bfa', color: '#000', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>診断スタート</button>
          </div>
        )}

        {/* ── DIAG ── */}
        {page === 'diag' && diagScenarios.current.length > 0 && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#555', marginBottom: 6 }}>
                <span>シナリオ {diagIdx + 1} / {diagScenarios.current.length}</span>
                <span>{Math.round(diagProgress)}%</span>
              </div>
              <div style={{ height: 4, background: '#222', borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${diagProgress}%`, background: '#a78bfa', borderRadius: 2, transition: 'width 0.4s' }} />
              </div>
            </div>
            <div style={card}>
              <div style={{ fontSize: 11, color: '#a78bfa', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>シナリオ</div>
              <p style={{ fontSize: 16, lineHeight: 1.8, marginBottom: 24 }}>{diagScenarios.current[diagIdx]?.text}</p>
              <div style={{ fontSize: 13, color: '#888', marginBottom: 10, textAlign: 'center' }}>この状況でどのくらい怒りを感じますか？</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: '#555' }}>全く怒らない</span>
                <input type="range" min={1} max={10} value={diagLevel} step={1} onChange={e => setDiagLevel(Number(e.target.value))} style={{ flex: 1, accentColor: '#a78bfa' }} />
                <span style={{ fontSize: 11, color: '#555' }}>激烈に怒る</span>
              </div>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 36, fontWeight: 700, color: diagLevel <= 3 ? '#22c55e' : diagLevel <= 6 ? '#f59e0b' : '#ef4444' }}>{diagLevel}</span>
                <span style={{ fontSize: 14, color: '#555' }}> / 10</span>
              </div>
              <button onClick={answerDiag} style={{ width: '100%', padding: 12, background: '#a78bfa', color: '#000', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                {diagIdx + 1 >= diagScenarios.current.length ? '診断結果を見る' : '次のシナリオへ →'}
              </button>
            </div>
          </div>
        )}

        {/* ── DIAG RESULT ── */}
        {page === 'diag-result' && (
          <div style={{ paddingBottom: 40 }}>
            <p style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>🔍 診断結果</p>

            {topTriggers.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <span style={lbl}>反応が強かったシナリオ TOP3</span>
                {topTriggers.map((a, i) => (
                  <div key={i} style={{ ...card, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 24, fontWeight: 700, color: i === 0 ? '#ef4444' : i === 1 ? '#f59e0b' : '#f97316', minWidth: 40, textAlign: 'center' }}>{a.level}</div>
                    <div>
                      <div style={{ fontSize: 12, color: '#a78bfa', fontWeight: 700, marginBottom: 2 }}>{a.scenario.trigger}</div>
                      <div style={{ fontSize: 13, color: '#888', lineHeight: 1.5 }}>{a.scenario.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ ...card, minHeight: 200 }}>
              <span style={lbl}>AIパーソナルレポート</span>
              {diagLoading ? (
                <div style={{ color: '#555', fontSize: 13, lineHeight: 1.8, animation: 'pulse 1.5s infinite' }}>
                  <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
                  AIがあなたの怒りパターンを分析中...
                </div>
              ) : (
                <div style={{ fontSize: 14, color: '#ccc', lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>{diagReport}</div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { startDiag(); }} style={{ flex: 1, padding: 14, background: '#a78bfa', color: '#000', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>もう一度診断</button>
              <button onClick={() => goTo('home')} style={{ flex: 1, padding: 14, background: 'transparent', color: '#f0f0f0', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>ホームへ</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
