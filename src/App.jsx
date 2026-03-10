import { useState, useEffect, useRef } from "react";

const GOOGLE_FONTS = `@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Fredoka+One&display=swap');`;
const WORKER = "https://english-hero-api.wondertreesg.workers.dev";

// ── helpers ──────────────────────────────────────────────────────────────────
const XP_PER_LEVEL = 100;
const getLevel = (xp) => Math.floor(xp / XP_PER_LEVEL) + 1;
const getProgress = (xp) => ((xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100;
const ls = { get: (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };

const pill = (color) => ({ background: `${color}22`, border: `1px solid ${color}44`, borderRadius: 20, padding: "4px 12px", fontFamily: "'Nunito',sans-serif", color, fontSize: 13, fontWeight: 800 });
const actionBtn = (color) => ({ background: `linear-gradient(135deg, ${color}, ${color}bb)`, border: "none", borderRadius: 14, cursor: "pointer", fontFamily: "'Fredoka One',cursive", color: "#fff", fontSize: 16, boxShadow: `0 4px 16px ${color}55`, padding: "12px 20px" });
const backBtn = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "8px 14px", color: "#94a3b8", fontFamily: "'Nunito',sans-serif", fontSize: 14, cursor: "pointer", marginBottom: 16, display: "block" };

async function callAI(system, user, maxTokens = 3000) {
  const res = await fetch(WORKER, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] })
  });
  const data = await res.json();
  return data.content.map(b => b.text || "").join("").trim();
}

// ── cache helpers ─────────────────────────────────────────────────────────────
function useBank(cacheKey, seenKey, generateFn, minSize = 40) {
  const [bank, setBank] = useState(() => ls.get(cacheKey) || []);
  const [queue, setQueue] = useState([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const genRef = useRef(false);

  function getSeen() { return ls.get(seenKey) || []; }
  function addSeen(id) { const s = getSeen(); ls.set(seenKey, [...s, id].slice(-300)); }

  function buildQueue(b) {
    const seen = getSeen();
    const fresh = b.filter(q => !seen.includes(q._id));
    const pool = fresh.length >= 5 ? fresh : b;
    return [...pool].sort(() => Math.random() - 0.5);
  }

  async function grow(current) {
    if (genRef.current) return current;
    genRef.current = true;
    setGenerating(true);
    try {
      const existing = current.slice(-15).map(q => q._id || q.question || q.weak).join(", ");
      const newItems = await generateFn(existing);
      if (newItems && newItems.length > 0) {
        const tagged = newItems.map((q, i) => ({ ...q, _id: `${cacheKey}_${Date.now()}_${i}` }));
        const newBank = [...current, ...tagged];
        ls.set(cacheKey, newBank.slice(-500));
        setBank(newBank);
        genRef.current = false;
        setGenerating(false);
        return newBank;
      }
    } catch (e) {}
    genRef.current = false;
    setGenerating(false);
    return current;
  }

  useEffect(() => {
    async function init() {
      let b = ls.get(cacheKey) || [];
      if (b.length < minSize) {
        setLoading(true);
        b = await grow(b);
        if (b.length < minSize) b = await grow(b);
        setLoading(false);
      }
      const q = buildQueue(b);
      setQueue(q);
      setIdx(0);
      if (b.length < 100) grow(b);
    }
    init();
  }, []);

  function next() {
    const cur = ls.get(cacheKey) || bank;
    if (queue[idx]) addSeen(queue[idx]._id);
    const nextIdx = idx + 1;
    if (nextIdx >= queue.length) {
      const q = buildQueue(cur);
      setQueue(q);
      setIdx(0);
    } else {
      setIdx(nextIdx);
    }
    if (nextIdx >= queue.length - 5) grow(cur);
  }

  return { item: queue[idx], loading, generating, next, bankSize: bank.length };
}

// ── BADGES ────────────────────────────────────────────────────────────────────
const BADGES = [
  { id: "first_story", emoji: "✍️", name: "Story Starter", desc: "Wrote your first story!", xp: 50 },
  { id: "grammar_5", emoji: "🎯", name: "Grammar Ace", desc: "Answered 5 grammar questions!", xp: 30 },
  { id: "streak_3", emoji: "🔥", name: "On Fire!", desc: "3 correct answers in a row!", xp: 40 },
  { id: "word_booster", emoji: "💪", name: "Word Power", desc: "Used 5 strong words!", xp: 25 },
  { id: "level_2", emoji: "⭐", name: "Rising Star", desc: "Reached Level 2!", xp: 60 },
  { id: "composition_100", emoji: "📝", name: "100 Words!", desc: "Wrote over 100 words!", xp: 80 },
];

// ── XPBar ─────────────────────────────────────────────────────────────────────
function XPBar({ xp, showBurst }) {
  const level = getLevel(xp);
  const prog = getProgress(xp);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ background: "linear-gradient(135deg,#f59e0b,#ef4444)", borderRadius: 20, padding: "4px 12px", fontFamily: "'Fredoka One',cursive", color: "#fff", fontSize: 15 }}>Lv {level}</div>
      <div style={{ flex: 1, background: "rgba(255,255,255,0.2)", borderRadius: 20, height: 14, overflow: "hidden" }}>
        <div style={{ width: `${prog}%`, height: "100%", background: "linear-gradient(90deg,#fbbf24,#f59e0b)", borderRadius: 20, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ color: "#fbbf24", fontWeight: 800, fontSize: 13, fontFamily: "'Nunito',sans-serif" }}>{xp} XP</span>
      {showBurst && <span style={{ fontSize: 20, animation: "pop 0.5s ease" }}>✨</span>}
    </div>
  );
}

// ── BadgeToast ────────────────────────────────────────────────────────────────
function BadgeToast({ badge, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, []);
  return (
    <div style={{ position: "fixed", top: 80, right: 20, zIndex: 1000, background: "linear-gradient(135deg,#1e1b4b,#312e81)", border: "2px solid #6366f1", borderRadius: 16, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 8px 32px rgba(99,102,241,0.5)", animation: "slideIn 0.4s ease" }}>
      <span style={{ fontSize: 36 }}>{badge.emoji}</span>
      <div>
        <div style={{ color: "#fbbf24", fontFamily: "'Fredoka One',cursive", fontSize: 16 }}>Badge Unlocked!</div>
        <div style={{ color: "#e0e7ff", fontFamily: "'Nunito',sans-serif", fontWeight: 700 }}>{badge.name}</div>
        <div style={{ color: "#a5b4fc", fontFamily: "'Nunito',sans-serif", fontSize: 12 }}>+{badge.xp} XP</div>
      </div>
    </div>
  );
}

// ── LoadingScreen ─────────────────────────────────────────────────────────────
function LoadingScreen({ emoji, color, message, sub, onBack }) {
  return (
    <div style={{ padding: 20, textAlign: "center" }}>
      <button onClick={onBack} style={backBtn}>← Back</button>
      <div style={{ marginTop: 60 }}>
        <div style={{ fontSize: 56, marginBottom: 16, animation: "pop 1.2s infinite" }}>{emoji}</div>
        <div style={{ fontFamily: "'Fredoka One',cursive", color, fontSize: 22, marginBottom: 8 }}>{message}</div>
        <div style={{ fontFamily: "'Nunito',sans-serif", color: "#94a3b8", fontSize: 14 }}>{sub}</div>
      </div>
    </div>
  );
}

// ── HomeScreen ────────────────────────────────────────────────────────────────
function HomeScreen({ xp, badges, onNav }) {
  return (
    <div style={{ paddingBottom: 30 }}>
      <div style={{ background: "linear-gradient(135deg,#4338ca 0%,#7c3aed 50%,#a855f7 100%)", borderRadius: "0 0 30px 30px", padding: "30px 24px 40px", textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 64, marginBottom: 6 }}>🦸</div>
        <h1 style={{ fontFamily: "'Fredoka One',cursive", color: "#fff", fontSize: 32, margin: "0 0 4px" }}>English Hero!</h1>
        <p style={{ color: "#c4b5fd", fontFamily: "'Nunito',sans-serif", fontSize: 15, margin: 0 }}>Level {getLevel(xp)} Writer · {xp} XP</p>
        <div style={{ marginTop: 12, display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
          {badges.slice(-3).map(b => (
            <span key={b.id} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 20, padding: "4px 12px", fontSize: 13, color: "#e0e7ff", fontFamily: "'Nunito',sans-serif", fontWeight: 700 }}>{b.emoji} {b.name}</span>
          ))}
        </div>
      </div>
      <div className="card-grid">
        {[
          { icon: "📖", label: "Story Writing", sub: "AI story prompts", color: ["#ec4899","#f97316"], screen: "story" },
          { icon: "🎯", label: "Grammar Quest", sub: "Infinite questions", color: ["#06b6d4","#3b82f6"], screen: "grammar" },
          { icon: "💡", label: "Word Power", sub: "Upgrade boring words", color: ["#10b981","#059669"], screen: "wordboost" },
          { icon: "🏆", label: "My Badges", sub: `${badges.length} earned`, color: ["#f59e0b","#ef4444"], screen: "badges" },
        ].map(card => (
          <button key={card.screen} onClick={() => onNav(card.screen)}
            style={{ background: `linear-gradient(135deg,${card.color[0]},${card.color[1]})`, border: "none", borderRadius: 18, padding: "20px 14px", textAlign: "center", cursor: "pointer", boxShadow: `0 6px 20px ${card.color[0]}55`, transition: "transform 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}>
            <div style={{ fontSize: 38, marginBottom: 6 }}>{card.icon}</div>
            <div style={{ fontFamily: "'Fredoka One',cursive", color: "#fff", fontSize: 16, marginBottom: 2 }}>{card.label}</div>
            <div style={{ fontFamily: "'Nunito',sans-serif", color: "rgba(255,255,255,0.85)", fontSize: 12 }}>{card.sub}</div>
          </button>
        ))}
      </div>
      <div style={{ padding: "20px 20px 0", textAlign: "center" }}>
        <p style={{ fontFamily: "'Nunito',sans-serif", color: "#94a3b8", fontSize: 13, background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "10px 16px" }}>
          💬 <strong style={{ color: "#c4b5fd" }}>Tip:</strong> Good writers SHOW feelings, not just tell them!
        </p>
      </div>
    </div>
  );
}

// ── StoryScreen ───────────────────────────────────────────────────────────────
async function generateStories(existing) {
  const raw = await callAI(
    `You create gripping story starters for Primary 4 students (age 10) in Singapore. Return ONLY a valid JSON array. Each item: title (string), prompt (2-3 exciting sentences ending with ...), genre (Adventure/Mystery/Fantasy/Sci-Fi/Horror/Friendship/Sports/Animal), emoji (one emoji). No markdown.`,
    `Generate 8 fresh story starters. Do NOT repeat these: ${existing || "none"}. Start in the middle of the action. Use sensory details. End on a cliffhanger. Some set in Singapore or Asia. Return ONLY a JSON array.`
  );
  return JSON.parse(raw);
}

function StoryScreen({ onXP, onBack }) {
  const { item: stories, loading, generating, next: nextStories, bankSize } = useBank("eh_stories_v3", "eh_stories_seen_v3", generateStories, 8);
  const [step, setStep] = useState("pick");
  const [chosen, setChosen] = useState(null);
  const [allStories, setAllStories] = useState([]);
  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [fbLoading, setFbLoading] = useState(false);
  const xpGiven = useRef(false);

  // Load all cached stories for the pick screen
  useEffect(() => {
    const cached = ls.get("eh_stories_v3") || [];
    if (cached.length > 0) setAllStories(cached.slice(-12).sort(() => Math.random() - 0.5));
  }, [loading]);

  const wordCount = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;

  async function getFeedback() {
    setFbLoading(true);
    try {
      const raw = await callAI(
        `You are a fun encouraging English teacher for a 10-year-old P4 student in Singapore. Give feedback on creative writing. Return JSON only, no markdown: {"score":7,"star_skill":"string","highlights":["s1","s2"],"level_up_tips":["t1","t2"],"power_words":["w1","w2","w3"],"encourage":"string"}`,
        `Story prompt: "${chosen.prompt}"\n\nStudent writing:\n${text}`, 1000
      );
      setFeedback(JSON.parse(raw));
    } catch {
      setFeedback({ score: 7, star_skill: "Creative imagination!", highlights: ["Great effort!", "Vivid imagination!"], level_up_tips: ["Add more describing words.", "Show how characters feel inside."], power_words: ["suddenly", "trembling", "enormous"], encourage: "Amazing work — keep writing every day!" });
    }
    if (!xpGiven.current) { xpGiven.current = true; onXP(wordCount >= 100 ? 40 : 20, wordCount >= 100 ? "composition_100" : null); }
    setFbLoading(false);
    setStep("feedback");
  }

  function pickStory(s) { setChosen(s); setText(""); setFeedback(null); xpGiven.current = false; setStep("write"); }

  function reset() {
    const cached = ls.get("eh_stories_v3") || [];
    setAllStories(cached.slice(-12).sort(() => Math.random() - 0.5));
    setChosen(null); setText(""); setFeedback(null); xpGiven.current = false; setStep("pick");
  }

  if (loading) return <LoadingScreen emoji="✍️" color="#ec4899" message="Crafting fresh stories..." sub="This only happens once! Future visits are instant." onBack={onBack} />;

  if (step === "pick") return (
    <div style={{ padding: 20 }}>
      <button onClick={onBack} style={backBtn}>← Back</button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <h2 style={{ fontFamily: "'Fredoka One',cursive", color: "#ec4899", fontSize: 24, margin: 0 }}>Choose Your Story</h2>
        <button onClick={reset} style={{ background: "rgba(236,72,153,0.15)", border: "1px solid rgba(236,72,153,0.3)", borderRadius: 10, padding: "6px 12px", color: "#ec4899", fontFamily: "'Nunito',sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          {generating ? "⏳..." : "🔄 Shuffle"}
        </button>
      </div>
      <p style={{ fontFamily: "'Nunito',sans-serif", color: "#94a3b8", fontSize: 13, margin: "0 0 4px" }}>📚 {bankSize} stories in your bank</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
        {allStories.map((s, i) => (
          <button key={i} onClick={() => pickStory(s)}
            style={{ background: "rgba(255,255,255,0.06)", border: "2px solid rgba(236,72,153,0.3)", borderRadius: 16, padding: 16, textAlign: "left", cursor: "pointer" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#ec4899"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(236,72,153,0.3)"; }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 28 }}>{s.emoji || "📖"}</span>
              <div>
                <div style={{ fontFamily: "'Fredoka One',cursive", color: "#f9a8d4", fontSize: 17 }}>{s.title}</div>
                <div style={{ background: "rgba(236,72,153,0.2)", borderRadius: 8, padding: "2px 8px", display: "inline-block", fontSize: 11, color: "#ec4899", fontFamily: "'Nunito',sans-serif", fontWeight: 700 }}>{s.genre}</div>
              </div>
            </div>
            <p style={{ fontFamily: "'Nunito',sans-serif", color: "#cbd5e1", fontSize: 13, margin: 0, lineHeight: 1.5 }}>{s.prompt}</p>
          </button>
        ))}
      </div>
    </div>
  );

  if (step === "write") return (
    <div style={{ padding: 20 }}>
      <button onClick={() => setStep("pick")} style={backBtn}>← Back</button>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 32 }}>{chosen.emoji}</span>
        <h2 style={{ fontFamily: "'Fredoka One',cursive", color: "#f9a8d4", fontSize: 22, margin: 0 }}>{chosen.title}</h2>
      </div>
      <div style={{ background: "linear-gradient(135deg,rgba(236,72,153,0.12),rgba(249,115,22,0.08))", border: "1px solid rgba(236,72,153,0.25)", borderRadius: 14, padding: 14, marginBottom: 14 }}>
        <p style={{ fontFamily: "'Nunito',sans-serif", color: "#e2e8f0", fontSize: 14, margin: 0, lineHeight: 1.6, fontStyle: "italic" }}>{chosen.prompt}</p>
      </div>
      <div style={{ marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "'Nunito',sans-serif", color: "#94a3b8", fontSize: 13 }}>Continue the story...</span>
        <span style={{ fontFamily: "'Nunito',sans-serif", fontSize: 13, fontWeight: 800, color: wordCount >= 80 ? "#10b981" : "#f59e0b" }}>{wordCount} words {wordCount >= 80 ? "✅" : "(aim for 80+)"}</span>
      </div>
      <textarea value={text} onChange={e => setText(e.target.value)}
        placeholder="Start writing here... What happens next? How does the character feel?"
        style={{ width: "100%", minHeight: 200, background: "rgba(255,255,255,0.05)", border: "2px solid rgba(236,72,153,0.3)", borderRadius: 14, padding: 14, color: "#e2e8f0", fontFamily: "'Nunito',sans-serif", fontSize: 15, lineHeight: 1.7, resize: "vertical", outline: "none", boxSizing: "border-box" }}
        onFocus={e => { e.target.style.borderColor = "#ec4899"; }} onBlur={e => { e.target.style.borderColor = "rgba(236,72,153,0.3)"; }} />
      <div style={{ marginTop: 8, marginBottom: 16, padding: "10px 14px", background: "rgba(251,191,36,0.08)", borderRadius: 10, border: "1px solid rgba(251,191,36,0.2)" }}>
        <p style={{ fontFamily: "'Nunito',sans-serif", color: "#fbbf24", fontSize: 12, margin: 0 }}>✨ <strong>Tip:</strong> Instead of "he was scared", try "his heart pounded and his hands trembled."</p>
      </div>
      <button onClick={getFeedback} disabled={wordCount < 20 || fbLoading}
        style={{ width: "100%", padding: 16, background: wordCount < 20 ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg,#ec4899,#f97316)", border: "none", borderRadius: 14, cursor: wordCount < 20 ? "not-allowed" : "pointer", fontFamily: "'Fredoka One',cursive", color: "#fff", fontSize: 18 }}>
        {fbLoading ? "✨ Getting Feedback..." : "🚀 Submit for Feedback!"}
      </button>
    </div>
  );

  return (
    <div style={{ padding: 20 }}>
      <div style={{ background: "linear-gradient(135deg,#7c3aed,#4338ca)", borderRadius: 20, padding: 20, marginBottom: 16, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 4 }}>{"⭐".repeat(Math.round(feedback.score / 2))}{"☆".repeat(5 - Math.round(feedback.score / 2))}</div>
        <div style={{ fontFamily: "'Fredoka One',cursive", color: "#fbbf24", fontSize: 28 }}>{feedback.score}/10</div>
        <div style={{ fontFamily: "'Nunito',sans-serif", color: "#c4b5fd", fontSize: 14 }}>Superpower: <strong style={{ color: "#fff" }}>{feedback.star_skill}</strong></div>
      </div>
      {[{ label: "🌟 What You Did Great", items: feedback.highlights, color: "#10b981" }, { label: "⬆️ Level Up Tips", items: feedback.level_up_tips, color: "#f59e0b" }, { label: "💪 Power Words to Try", items: feedback.power_words, color: "#a855f7" }].map(s => (
        <div key={s.label} style={{ marginBottom: 12, background: "rgba(255,255,255,0.05)", borderRadius: 14, padding: 14, border: `1px solid ${s.color}33` }}>
          <div style={{ fontFamily: "'Fredoka One',cursive", color: s.color, fontSize: 16, marginBottom: 8 }}>{s.label}</div>
          {(s.items || []).map((item, i) => <div key={i} style={{ fontFamily: "'Nunito',sans-serif", color: "#cbd5e1", fontSize: 14, marginBottom: 6, display: "flex", gap: 8 }}><span style={{ color: s.color }}>→</span>{item}</div>)}
        </div>
      ))}
      <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 14, padding: 14, marginBottom: 16, textAlign: "center" }}>
        <p style={{ fontFamily: "'Nunito',sans-serif", color: "#34d399", fontSize: 14, margin: 0, fontWeight: 700 }}>{feedback.encourage}</p>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => { setFeedback(null); setStep("write"); }} style={{ ...actionBtn("#6366f1"), flex: 1, textAlign: "center" }}>✍️ Rewrite</button>
        <button onClick={reset} style={{ ...actionBtn("#ec4899"), flex: 1, textAlign: "center" }}>📖 New Story</button>
      </div>
    </div>
  );
}

// ── GrammarScreen ─────────────────────────────────────────────────────────────
const GRAMMAR_SKILLS = [
  "Subject-Verb Agreement", "Simple Past Tense", "Past Continuous Tense",
  "Present Perfect Tense", "Past Perfect Tense", "Future Tense",
  "Comparatives", "Superlatives", "Articles (a, an, the)", "Prepositions",
  "Modal Verbs", "Passive Voice", "Reported Speech", "Conditional Sentences",
  "Since vs For", "Punctuation", "Conjunctions", "Gerunds", "Adverbs",
  "Neither...Nor", "So vs Such", "Wishes", "Future Perfect", "Correlative Conjunctions"
];

async function generateGrammar(existing) {
  const skills = [...GRAMMAR_SKILLS].sort(() => Math.random() - 0.5).slice(0, 8).join(", ");
  const raw = await callAI(
    `You generate English grammar questions for Primary 4 students in Singapore (MOE syllabus). Return ONLY a valid JSON array. Each item: question (string, use ___ for blanks), options (array of exactly 4 strings — NO nested quotes inside strings, use simple words only), answer (exact match to one option), explanation (simple, for a 10-year-old), skill (string), difficulty (1, 2, or 3). IMPORTANT: never use quotation marks inside option strings.`,
    `Generate 25 grammar questions for skills: ${skills}. Do NOT repeat these recent ones: ${existing || "none"}. Mix difficulty 1-3. Return ONLY a JSON array.`, 4000
  );
  return JSON.parse(raw);
}

function GrammarScreen({ onXP, onBack }) {
  const { item: q, loading, generating, next, bankSize } = useBank("eh_grammar_v3", "eh_grammar_seen_v3", generateGrammar, 40);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [total, setTotal] = useState(0);
  const grammarCount = useRef(0);

  if (loading) return <LoadingScreen emoji="🎯" color="#06b6d4" message="Building question bank..." sub="Generating 40+ questions — only happens once!" onBack={onBack} />;

  function pick(opt) {
    if (answered || !q) return;
    setSelected(opt);
    setAnswered(true);
    const correct = opt === q.answer;
    if (correct) { const ns = streak + 1; setStreak(ns); setScore(s => s + 1); onXP(ns >= 3 ? 20 : 10, ns === 3 ? "streak_3" : null); }
    else { setStreak(0); onXP(2, null); }
    setTotal(t => t + 1);
    grammarCount.current += 1;
    if (grammarCount.current === 5) onXP(0, "grammar_5");
  }

  function doNext() { setSelected(null); setAnswered(false); next(); }

  return (
    <div style={{ padding: 20 }}>
      <button onClick={onBack} style={backBtn}>← Back</button>
      <h2 style={{ fontFamily: "'Fredoka One',cursive", color: "#06b6d4", fontSize: 24, margin: "0 0 12px" }}>Grammar Quest</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        <div style={pill("#06b6d4")}>✅ {score}/{total}</div>
        <div style={pill("#f59e0b")}>🔥 Streak: {streak}</div>
        <div style={pill("#a855f7")}>📚 {bankSize} saved</div>
        {generating && <div style={pill("#10b981")}>⚙️ Generating more...</div>}
      </div>
      {q && (
        <>
          <div style={{ background: "rgba(6,182,212,0.08)", border: "2px solid rgba(6,182,212,0.25)", borderRadius: 16, padding: 16, marginBottom: 12 }}>
            <div style={{ fontFamily: "'Nunito',sans-serif", color: "#67e8f9", fontSize: 11, fontWeight: 800, textTransform: "uppercase", marginBottom: 6 }}>
              {q.skill} · {"★".repeat(q.difficulty || 1)}{"☆".repeat(3 - (q.difficulty || 1))}
            </div>
            <p style={{ fontFamily: "'Nunito',sans-serif", color: "#e2e8f0", fontSize: 16, margin: 0, lineHeight: 1.6, fontWeight: 700 }}>{q.question}</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {(q.options || []).map(opt => {
              let bg = "rgba(255,255,255,0.05)", border = "1px solid rgba(255,255,255,0.1)", color = "#e2e8f0";
              if (answered) {
                if (opt === q.answer) { bg = "rgba(16,185,129,0.15)"; border = "2px solid #10b981"; color = "#34d399"; }
                else if (opt === selected) { bg = "rgba(239,68,68,0.12)"; border = "2px solid #ef4444"; color = "#fca5a5"; }
              }
              return (
                <button key={opt} onClick={() => pick(opt)}
                  style={{ background: bg, border, borderRadius: 12, padding: "14px 16px", textAlign: "left", cursor: answered ? "default" : "pointer", fontFamily: "'Nunito',sans-serif", color, fontSize: 14, fontWeight: 600, transition: "all 0.2s" }}>
                  {answered && opt === q.answer && "✅ "}{answered && opt === selected && opt !== q.answer && "❌ "}{opt}
                </button>
              );
            })}
          </div>
          {answered && (
            <div>
              <div style={{ background: selected === q.answer ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.08)", border: `1px solid ${selected === q.answer ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`, borderRadius: 14, padding: 14, marginBottom: 14 }}>
                <div style={{ fontFamily: "'Fredoka One',cursive", color: selected === q.answer ? "#34d399" : "#f87171", fontSize: 16, marginBottom: 6 }}>{selected === q.answer ? "🎉 Correct!" : "💡 Keep Learning!"}</div>
                <p style={{ fontFamily: "'Nunito',sans-serif", color: "#cbd5e1", fontSize: 13, margin: 0 }}>{q.explanation}</p>
              </div>
              <button onClick={doNext} style={{ ...actionBtn("#06b6d4"), width: "100%", padding: 16, fontSize: 17 }}>Next Question →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── WordBoostScreen ───────────────────────────────────────────────────────────
async function generateWords(existing) {
  const raw = await callAI(
    `You generate vocabulary upgrade exercises for Primary 4 students in Singapore. Return ONLY a valid JSON array. Each item: weak (one boring overused word), strong (array of exactly 4 vivid alternatives for age 10), tip (fun encouragement under 10 words). No markdown.`,
    `Generate 20 word upgrade exercises. Do NOT repeat these weak words: ${existing || "none"}. Use words students commonly overuse. Return ONLY a JSON array.`, 2000
  );
  return JSON.parse(raw);
}

function WordBoostScreen({ onXP, onBack }) {
  const { item: w, loading, generating, next, bankSize } = useBank("eh_words_v3", "eh_words_seen_v3", generateWords, 30);
  const [chosen, setChosen] = useState(null);
  const [collected, setCollected] = useState([]);

  if (loading) return <LoadingScreen emoji="💡" color="#10b981" message="Building word bank..." sub="Generating 30+ word exercises — only happens once!" onBack={onBack} />;

  function pick(word) {
    if (chosen || !w) return;
    setChosen(word);
    const nc = [...collected, word];
    setCollected(nc);
    onXP(10, nc.length >= 5 ? "word_booster" : null);
  }

  function doNext() { setChosen(null); next(); }

  return (
    <div style={{ padding: 20 }}>
      <button onClick={onBack} style={backBtn}>← Back</button>
      <h2 style={{ fontFamily: "'Fredoka One',cursive", color: "#10b981", fontSize: 24, margin: "0 0 6px" }}>Word Power</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        <div style={pill("#10b981")}>🌟 {collected.length} collected</div>
        <div style={pill("#a855f7")}>📚 {bankSize} saved</div>
        {generating && <div style={pill("#06b6d4")}>⚙️ Generating more...</div>}
      </div>
      {w && (
        <>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ display: "inline-block", background: "rgba(239,68,68,0.15)", border: "2px solid rgba(239,68,68,0.4)", borderRadius: 16, padding: "16px 28px", marginBottom: 10 }}>
              <div style={{ fontFamily: "'Nunito',sans-serif", color: "#94a3b8", fontSize: 12, marginBottom: 4 }}>😴 BORING WORD</div>
              <div style={{ fontFamily: "'Fredoka One',cursive", color: "#f87171", fontSize: 36 }}>{w.weak}</div>
            </div>
            <p style={{ fontFamily: "'Nunito',sans-serif", color: "#fbbf24", fontSize: 13, background: "rgba(251,191,36,0.08)", borderRadius: 10, padding: "8px 14px", margin: "0 0 16px" }}>💡 {w.tip}</p>
          </div>
          <div style={{ fontFamily: "'Fredoka One',cursive", color: "#10b981", fontSize: 16, marginBottom: 10 }}>✨ Choose a BETTER word:</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            {(w.strong || []).map(word => (
              <button key={word} onClick={() => pick(word)}
                style={{ background: chosen === word ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.06)", border: `2px solid ${chosen === word ? "#10b981" : "rgba(16,185,129,0.2)"}`, borderRadius: 14, padding: "14px 10px", cursor: chosen ? "default" : "pointer", fontFamily: "'Nunito',sans-serif", color: chosen === word ? "#34d399" : "#e2e8f0", fontSize: 15, fontWeight: 700, textAlign: "center", transition: "all 0.2s" }}>
                {chosen === word ? "✅ " : ""}{word}
              </button>
            ))}
          </div>
          {chosen && (
            <div>
              <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 12, padding: 12, marginBottom: 14 }}>
                <p style={{ fontFamily: "'Nunito',sans-serif", color: "#34d399", fontSize: 13, margin: 0 }}>🌟 <strong>"{chosen}"</strong> is a great choice! Try using it in your next composition.</p>
              </div>
              <button onClick={doNext} style={{ ...actionBtn("#10b981"), width: "100%", padding: 14 }}>Next Word →</button>
            </div>
          )}
          {collected.length > 0 && (
            <div style={{ marginTop: 20, background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 14, padding: 14 }}>
              <div style={{ fontFamily: "'Fredoka One',cursive", color: "#a855f7", fontSize: 14, marginBottom: 8 }}>Your Word Collection</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {collected.map((word, i) => <span key={i} style={{ background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.4)", borderRadius: 20, padding: "3px 10px", fontFamily: "'Nunito',sans-serif", color: "#c4b5fd", fontSize: 12, fontWeight: 700 }}>{word}</span>)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── BadgesScreen ──────────────────────────────────────────────────────────────
function BadgesScreen({ badges, xp, onBack }) {
  return (
    <div style={{ padding: 20 }}>
      <button onClick={onBack} style={backBtn}>← Back</button>
      <h2 style={{ fontFamily: "'Fredoka One',cursive", color: "#f59e0b", fontSize: 24, margin: "0 0 6px" }}>My Badges</h2>
      <p style={{ fontFamily: "'Nunito',sans-serif", color: "#94a3b8", fontSize: 14, margin: "0 0 18px" }}>Earn badges by practising every day!</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {BADGES.map(b => {
          const earned = badges.some(e => e.id === b.id);
          return (
            <div key={b.id} style={{ background: earned ? "rgba(251,191,36,0.12)" : "rgba(255,255,255,0.04)", border: `2px solid ${earned ? "rgba(251,191,36,0.4)" : "rgba(255,255,255,0.08)"}`, borderRadius: 16, padding: 14, textAlign: "center", opacity: earned ? 1 : 0.5 }}>
              <div style={{ fontSize: 36, marginBottom: 4, filter: earned ? "none" : "grayscale(1)" }}>{b.emoji}</div>
              <div style={{ fontFamily: "'Fredoka One',cursive", color: earned ? "#fbbf24" : "#64748b", fontSize: 14, marginBottom: 4 }}>{b.name}</div>
              <div style={{ fontFamily: "'Nunito',sans-serif", color: "#94a3b8", fontSize: 11 }}>{b.desc}</div>
              {earned && <div style={{ fontFamily: "'Nunito',sans-serif", color: "#fbbf24", fontSize: 11, fontWeight: 800, marginTop: 4 }}>+{b.xp} XP ✅</div>}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 20, textAlign: "center", fontFamily: "'Nunito',sans-serif", color: "#94a3b8", fontSize: 13 }}>{badges.length}/{BADGES.length} badges · {xp} XP total</div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("home");
  const [xp, setXP] = useState(() => ls.get("eh_xp") || 0);
  const [badges, setBadges] = useState(() => ls.get("eh_badges") || []);
  const [toast, setToast] = useState(null);
  const [xpBurst, setXpBurst] = useState(false);

  useEffect(() => { ls.set("eh_xp", xp); }, [xp]);
  useEffect(() => { ls.set("eh_badges", badges); }, [badges]);

  function awardBadge(id) {
    const badge = BADGES.find(b => b.id === id);
    if (!badge) return;
    setBadges(prev => {
      if (prev.some(b => b.id === id)) return prev;
      setToast(badge);
      return [...prev, badge];
    });
  }

  function handleXP(amount, badgeId) {
    if (amount > 0) {
      setXP(prev => {
        const nx = prev + amount;
        if (getLevel(nx) > getLevel(prev)) setTimeout(() => awardBadge("level_2"), 600);
        return nx;
      });
      setXpBurst(true);
      setTimeout(() => setXpBurst(false), 800);
    }
    if (badgeId) awardBadge(badgeId);
    if (screen === "story") awardBadge("first_story");
  }

  return (
    <>
      <style>{GOOGLE_FONTS}{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0f172a; }
        @keyframes pop { 0%{transform:scale(0.5);opacity:0} 70%{transform:scale(1.2)} 100%{transform:scale(1);opacity:1} }
        @keyframes slideIn { from{transform:translateX(100px);opacity:0} to{transform:translateX(0);opacity:1} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
        .card-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; padding: 0 20px; }
        @media (max-width: 768px) { .card-grid { grid-template-columns: repeat(2,1fr); } }
      `}</style>
      {toast && <BadgeToast badge={toast} onDone={() => setToast(null)} />}
      <div style={{ width: "100%", minHeight: "100vh", background: "linear-gradient(180deg,#0f172a 0%,#1e1b4b 100%)" }}>
        <div style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(15,23,42,0.92)", backdropFilter: "blur(12px)", padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <XPBar xp={xp} showBurst={xpBurst} />
        </div>
        {screen === "home" && <HomeScreen xp={xp} badges={badges} onNav={setScreen} />}
        {screen === "story" && <StoryScreen onXP={handleXP} onBack={() => setScreen("home")} />}
        {screen === "grammar" && <GrammarScreen onXP={handleXP} onBack={() => setScreen("home")} />}
        {screen === "wordboost" && <WordBoostScreen onXP={handleXP} onBack={() => setScreen("home")} />}
        {screen === "badges" && <BadgesScreen badges={badges} xp={xp} onBack={() => setScreen("home")} />}
      </div>
    </>
  );
}
