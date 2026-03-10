import { useState, useEffect, useRef } from "react";

const GOOGLE_FONTS = `@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Fredoka+One&display=swap');`;

const STORY_STARTERS = [
  { id: 1, emoji: "🏕️", title: "The Camping Trip", prompt: "It was the first time Kai had ever slept under the stars. As he unzipped the tent, he froze — something was rustling in the bushes nearby...", genre: "Adventure" },
  { id: 2, emoji: "🤖", title: "My Robot Friend", prompt: "The cardboard box on the doorstep had holes punched in it. Maya leaned closer and heard a faint beeping sound from inside...", genre: "Sci-Fi" },
  { id: 3, emoji: "🌊", title: "Lost at Sea", prompt: "The fishing boat rocked violently. Ethan gripped the railing as the fog rolled in, swallowing the coastline completely...", genre: "Adventure" },
  { id: 4, emoji: "🎪", title: "The Mysterious Circus", prompt: "The circus had appeared overnight on the empty field. Nobody had seen any trucks arrive. The posters on the gate read: 'One night only — and you will NEVER forget.'", genre: "Mystery" },
  { id: 5, emoji: "🌌", title: "A Strange New World", prompt: "When Sophie stepped through the mirror, she expected to see her bedroom reflected back. Instead, she found herself standing in a golden forest where the trees hummed softly...", genre: "Fantasy" },
];

const GRAMMAR_CHALLENGES = [
  { id: 1, difficulty: 1, question: "She ___ to school every day by bus.", options: ["go", "goes", "going", "gone"], answer: "goes", explanation: "We use 'goes' (third person singular) because the subject is 'She'.", skill: "Subject-Verb Agreement" },
  { id: 2, difficulty: 1, question: "The children ___ playing in the park when it started to rain.", options: ["is", "are", "was", "were"], answer: "were", explanation: "'Were' is the past tense of 'are' — used for plural subjects like 'children' in the past.", skill: "Past Continuous Tense" },
  { id: 3, difficulty: 2, question: "Which sentence is correct?", options: ["Neither the boys nor the girl were ready.", "Neither the boys nor the girl was ready.", "Neither the boys nor the girl are ready.", "Neither the boys nor the girl be ready."], answer: "Neither the boys nor the girl was ready.", explanation: "With 'neither...nor', the verb agrees with the noun closest to it — 'girl' (singular), so we use 'was'.", skill: "Neither...Nor Agreement" },
  { id: 4, difficulty: 1, question: "I have not seen him ___ last Monday.", options: ["for", "since", "from", "at"], answer: "since", explanation: "'Since' is used with a specific point in time (Monday). 'For' is used with a duration (e.g., three days).", skill: "Since vs For" },
  { id: 5, difficulty: 2, question: "By the time the firemen arrived, the fire ___ the entire building.", options: ["destroyed", "has destroyed", "had destroyed", "destroys"], answer: "had destroyed", explanation: "'Had destroyed' (Past Perfect) shows the destroying was completed BEFORE the firemen arrived.", skill: "Past Perfect Tense" },
  { id: 6, difficulty: 2, question: "Pick the sentence with correct punctuation:", options: ['"Watch out!" shouted the boy.', '"Watch out" shouted the boy!', '"Watch out", shouted the boy.', 'Watch out! shouted the boy.'], answer: '"Watch out!" shouted the boy.', explanation: "The exclamation mark goes INSIDE the quotation marks when it belongs to the spoken words.", skill: "Punctuation in Speech" },
  { id: 7, difficulty: 1, question: "She is much ___ than her younger sister.", options: ["tall", "taller", "tallest", "more taller"], answer: "taller", explanation: "Use '-er' (comparative form) when comparing two people or things.", skill: "Comparatives" },
  { id: 8, difficulty: 3, question: "If I ___ a million dollars, I would travel the world.", options: ["have", "had", "has", "will have"], answer: "had", explanation: "This is a hypothetical condition. We use 'had' in the 'if' clause for imaginary situations.", skill: "Conditional Sentences" },
];

const WORD_BOOST = [
  { weak: "said", strong: ["whispered", "exclaimed", "announced", "muttered"], tip: "Instead of 'said', use a more expressive word!" },
  { weak: "walked", strong: ["trudged", "sprinted", "crept", "marched"], tip: "Show HOW someone moved!" },
  { weak: "nice", strong: ["delightful", "magnificent", "charming", "splendid"], tip: "'Nice' is boring — upgrade it!" },
  { weak: "scared", strong: ["terrified", "petrified", "horrified", "trembling"], tip: "Show the intensity of fear!" },
  { weak: "happy", strong: ["overjoyed", "elated", "thrilled", "ecstatic"], tip: "Make the happiness vivid!" },
  { weak: "sad", strong: ["heartbroken", "devastated", "forlorn", "crestfallen"], tip: "Show deep sadness!" },
  { weak: "big", strong: ["enormous", "colossal", "towering", "massive"], tip: "How BIG exactly? Show it!" },
  { weak: "small", strong: ["tiny", "minuscule", "petite", "compact"], tip: "Show how small!" },
];

const BADGES = [
  { id: "first_story", emoji: "✍️", name: "Story Starter", desc: "Wrote your first story!", xp: 50 },
  { id: "grammar_5", emoji: "🎯", name: "Grammar Ace", desc: "Answered 5 grammar questions!", xp: 30 },
  { id: "streak_3", emoji: "🔥", name: "On Fire!", desc: "3 correct answers in a row!", xp: 40 },
  { id: "word_booster", emoji: "💪", name: "Word Power", desc: "Used 5 strong words!", xp: 25 },
  { id: "level_2", emoji: "⭐", name: "Rising Star", desc: "Reached Level 2!", xp: 60 },
  { id: "composition_100", emoji: "📝", name: "100 Words!", desc: "Wrote over 100 words!", xp: 80 },
];

const XP_PER_LEVEL = 100;
const getLevel = (xp) => Math.floor(xp / XP_PER_LEVEL) + 1;
const getProgress = (xp) => ((xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100;

const pill = (color) => ({ background: `${color}22`, border: `1px solid ${color}44`, borderRadius: 20, padding: "4px 12px", fontFamily: "'Nunito',sans-serif", color, fontSize: 13, fontWeight: 800 });
const actionBtn = (color) => ({ background: `linear-gradient(135deg, ${color}, ${color}bb)`, border: "none", borderRadius: 14, cursor: "pointer", fontFamily: "'Fredoka One',cursive", color: "#fff", fontSize: 16, boxShadow: `0 4px 16px ${color}55`, padding: "12px 20px" });
const backBtn = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "8px 14px", color: "#94a3b8", fontFamily: "'Nunito',sans-serif", fontSize: 14, cursor: "pointer", marginBottom: 16, display: "block" };

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

function HomeScreen({ xp, badges, onNav, streak }) {
  return (
    <div style={{ paddingBottom: 30 }}>
      <div style={{ background: "linear-gradient(135deg,#4338ca 0%,#7c3aed 50%,#a855f7 100%)", borderRadius: "0 0 30px 30px", padding: "30px 24px 40px", textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 64, marginBottom: 6 }}>🦸</div>
        <h1 style={{ fontFamily: "'Fredoka One',cursive", color: "#fff", fontSize: 32, margin: "0 0 4px" }}>English Hero!</h1>
        <p style={{ color: "#c4b5fd", fontFamily: "'Nunito',sans-serif", fontSize: 15, margin: 0 }}>
          Level {getLevel(xp)} Writer · {streak > 0 ? `🔥 ${streak} streak` : "Start your streak!"}
        </p>
        <div style={{ marginTop: 16, display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
          {badges.slice(-3).map(b => (
            <span key={b.id} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 20, padding: "4px 12px", fontSize: 13, color: "#e0e7ff", fontFamily: "'Nunito',sans-serif", fontWeight: 700 }}>{b.emoji} {b.name}</span>
          ))}
        </div>
      </div>
      <div style={{ padding: "0 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {[
          { icon: "📖", label: "Story Writing", sub: "Build your composition", color: ["#ec4899","#f97316"], screen: "story" },
          { icon: "🎯", label: "Grammar Quest", sub: "Master English rules", color: ["#06b6d4","#3b82f6"], screen: "grammar" },
          { icon: "💡", label: "Word Power", sub: "Upgrade boring words", color: ["#10b981","#059669"], screen: "wordboost" },
          { icon: "🏆", label: "My Badges", sub: `${badges.length} earned so far`, color: ["#f59e0b","#ef4444"], screen: "badges" },
        ].map(card => (
          <button key={card.screen} onClick={() => onNav(card.screen)}
            style={{ background: `linear-gradient(135deg,${card.color[0]},${card.color[1]})`, border: "none", borderRadius: 18, padding: "20px 14px", textAlign: "center", cursor: "pointer", boxShadow: `0 6px 20px ${card.color[0]}55`, transition: "transform 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
          >
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

// StoryScreen — all hooks at top level, no conditional hook calls
function StoryScreen({ onXP, onBack }) {
  const [step, setStep] = useState("pick");
  const [chosen, setChosen] = useState(null);
  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const storyXpGiven = useRef(false);

  const wordCount = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;

  async function getFeedback() {
    if (!chosen) return;
    setLoading(true);
    let parsed = null;
    try {
      const res = await fetch("https://english-hero-api.wondertreesg.workers.dev", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are a fun, encouraging English teacher for a 10-year-old Primary 4 student in Singapore. Give feedback on their creative writing in a warm, gamified way. Respond in JSON only — no markdown, no code fences — with this exact structure: {"score":7,"star_skill":"Creative storytelling","highlights":["praise1","praise2"],"level_up_tips":["tip1","tip2"],"power_words":["word1","word2","word3"],"encourage":"upbeat sentence here"}`,
          messages: [{ role: "user", content: `Story prompt: "${chosen.prompt}"\n\nStudent writing:\n${text}` }]
        })
      });
      const data = await res.json();
      const raw = data.content.map(b => b.text || "").join("").trim();
      parsed = JSON.parse(raw);
    } catch (e) {
      parsed = { score: 7, star_skill: "Creative imagination!", highlights: ["Great effort keeping the story going!", "You have a vivid sense of what happens next."], level_up_tips: ["Try adding describing words for what your character sees or hears.", "Add a sentence showing how the character FEELS inside."], power_words: ["suddenly", "trembling", "enormous"], encourage: "Amazing work — keep writing every day and you will become a superstar!" };
    }
    setFeedback(parsed);
    if (!storyXpGiven.current) {
      storyXpGiven.current = true;
      onXP(wordCount >= 100 ? 40 : 20, wordCount >= 100 ? "composition_100" : null);
    }
    setLoading(false);
    setStep("feedback");
  }

  function pickStory(s) {
    setChosen(s);
    setText("");
    setFeedback(null);
    storyXpGiven.current = false;
    setStep("write");
  }

  function reset() {
    setChosen(null);
    setText("");
    setFeedback(null);
    storyXpGiven.current = false;
    setStep("pick");
  }

  // Render based on step (no early returns with hooks above)
  const showPick = step === "pick";
  const showWrite = step === "write";
  const showFeedback = step === "feedback";

  return (
    <div style={{ padding: 20 }}>
      {showPick && (
        <div>
          <button onClick={onBack} style={backBtn}>← Back</button>
          <h2 style={{ fontFamily: "'Fredoka One',cursive", color: "#ec4899", fontSize: 24, margin: "0 0 6px" }}>Choose Your Story</h2>
          <p style={{ fontFamily: "'Nunito',sans-serif", color: "#94a3b8", fontSize: 14, margin: "0 0 18px" }}>Pick a story starter and let your imagination fly!</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {STORY_STARTERS.map(s => (
              <button key={s.id} onClick={() => pickStory(s)}
                style={{ background: "rgba(255,255,255,0.06)", border: "2px solid rgba(236,72,153,0.3)", borderRadius: 16, padding: 16, textAlign: "left", cursor: "pointer", transition: "border-color 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#ec4899"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(236,72,153,0.3)"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 28 }}>{s.emoji}</span>
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
      )}

      {showWrite && chosen && (
        <div>
          <button onClick={() => setStep("pick")} style={backBtn}>← Back</button>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 32 }}>{chosen.emoji}</span>
            <h2 style={{ fontFamily: "'Fredoka One',cursive", color: "#f9a8d4", fontSize: 22, margin: 0 }}>{chosen.title}</h2>
          </div>
          <div style={{ background: "linear-gradient(135deg,rgba(236,72,153,0.12),rgba(249,115,22,0.08))", border: "1px solid rgba(236,72,153,0.25)", borderRadius: 14, padding: 14, marginBottom: 14 }}>
            <p style={{ fontFamily: "'Nunito',sans-serif", color: "#e2e8f0", fontSize: 14, margin: 0, lineHeight: 1.6, fontStyle: "italic" }}>{chosen.prompt}</p>
          </div>
          <div style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "'Nunito',sans-serif", color: "#94a3b8", fontSize: 13, fontWeight: 700 }}>Continue the story...</span>
            <span style={{ fontFamily: "'Nunito',sans-serif", fontSize: 13, fontWeight: 800, color: wordCount >= 80 ? "#10b981" : "#f59e0b" }}>
              {wordCount} words {wordCount >= 80 ? "✅" : "(aim for 80+)"}
            </span>
          </div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Start writing here... What happens next? How does the character feel? What do they see, hear, smell?"
            style={{ width: "100%", minHeight: 200, background: "rgba(255,255,255,0.05)", border: "2px solid rgba(236,72,153,0.3)", borderRadius: 14, padding: 14, color: "#e2e8f0", fontFamily: "'Nunito',sans-serif", fontSize: 15, lineHeight: 1.7, resize: "vertical", outline: "none", boxSizing: "border-box" }}
            onFocus={e => { e.target.style.borderColor = "#ec4899"; }}
            onBlur={e => { e.target.style.borderColor = "rgba(236,72,153,0.3)"; }}
          />
          <div style={{ marginTop: 8, marginBottom: 16, padding: "10px 14px", background: "rgba(251,191,36,0.08)", borderRadius: 10, border: "1px solid rgba(251,191,36,0.2)" }}>
            <p style={{ fontFamily: "'Nunito',sans-serif", color: "#fbbf24", fontSize: 12, margin: 0 }}>
              ✨ <strong>Tip:</strong> Show don't tell! Instead of "he was scared", try "his heart pounded and his hands trembled."
            </p>
          </div>
          <button onClick={getFeedback} disabled={wordCount < 20 || loading}
            style={{ width: "100%", padding: 16, background: wordCount < 20 ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg,#ec4899,#f97316)", border: "none", borderRadius: 14, cursor: wordCount < 20 ? "not-allowed" : "pointer", fontFamily: "'Fredoka One',cursive", color: "#fff", fontSize: 18, boxShadow: wordCount >= 20 ? "0 6px 20px rgba(236,72,153,0.4)" : "none" }}>
            {loading ? "✨ Getting Feedback..." : "🚀 Submit for Feedback!"}
          </button>
        </div>
      )}

      {showFeedback && feedback && (
        <div>
          <div style={{ background: "linear-gradient(135deg,#7c3aed,#4338ca)", borderRadius: 20, padding: 20, marginBottom: 16, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 4 }}>{"⭐".repeat(Math.round(feedback.score / 2))}{"☆".repeat(5 - Math.round(feedback.score / 2))}</div>
            <div style={{ fontFamily: "'Fredoka One',cursive", color: "#fbbf24", fontSize: 28 }}>{feedback.score}/10</div>
            <div style={{ fontFamily: "'Nunito',sans-serif", color: "#c4b5fd", fontSize: 14 }}>Superpower: <strong style={{ color: "#fff" }}>{feedback.star_skill}</strong></div>
          </div>
          {[
            { label: "🌟 What You Did Great", items: feedback.highlights, color: "#10b981" },
            { label: "⬆️ Level Up Tips", items: feedback.level_up_tips, color: "#f59e0b" },
            { label: "💪 Power Words to Try", items: feedback.power_words, color: "#a855f7" },
          ].map(section => (
            <div key={section.label} style={{ marginBottom: 12, background: "rgba(255,255,255,0.05)", borderRadius: 14, padding: 14, border: `1px solid ${section.color}33` }}>
              <div style={{ fontFamily: "'Fredoka One',cursive", color: section.color, fontSize: 16, marginBottom: 8 }}>{section.label}</div>
              {(section.items || []).map((item, i) => (
                <div key={i} style={{ fontFamily: "'Nunito',sans-serif", color: "#cbd5e1", fontSize: 14, marginBottom: 6, display: "flex", gap: 8 }}>
                  <span style={{ color: section.color }}>→</span>{item}
                </div>
              ))}
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
      )}
    </div>
  );
}

function GrammarScreen({ onXP, onBack }) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [total, setTotal] = useState(0);

  const q = GRAMMAR_CHALLENGES[idx % GRAMMAR_CHALLENGES.length];
  const diffStars = "★".repeat(q.difficulty) + "☆".repeat(3 - q.difficulty);

  function pick(opt) {
    if (answered) return;
    setSelected(opt);
    setAnswered(true);
    const correct = opt === q.answer;
    if (correct) {
      const ns = streak + 1;
      setStreak(ns);
      setScore(s => s + 1);
      onXP(ns >= 3 ? 20 : 10, ns === 3 ? "streak_3" : null);
    } else {
      setStreak(0);
      onXP(2, null);
    }
    setTotal(t => t + 1);
  }

  function next() {
    setIdx(i => (i + 1) % GRAMMAR_CHALLENGES.length);
    setSelected(null);
    setAnswered(false);
  }

  return (
    <div style={{ padding: 20 }}>
      <button onClick={onBack} style={backBtn}>← Back</button>
      <h2 style={{ fontFamily: "'Fredoka One',cursive", color: "#06b6d4", fontSize: 24, margin: "0 0 12px" }}>Grammar Quest</h2>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <div style={pill("#06b6d4")}>✅ {score}/{total} Correct</div>
        <div style={pill("#f59e0b")}>🔥 Streak: {streak}</div>
        <span style={{ fontFamily: "'Nunito',sans-serif", color: "#fbbf24", fontSize: 14, alignSelf: "center" }}>{diffStars}</span>
      </div>
      <div style={{ background: "rgba(6,182,212,0.08)", border: "2px solid rgba(6,182,212,0.25)", borderRadius: 16, padding: 16, marginBottom: 12 }}>
        <div style={{ fontFamily: "'Nunito',sans-serif", color: "#67e8f9", fontSize: 11, fontWeight: 800, textTransform: "uppercase", marginBottom: 6 }}>Skill: {q.skill}</div>
        <p style={{ fontFamily: "'Nunito',sans-serif", color: "#e2e8f0", fontSize: 16, margin: 0, lineHeight: 1.6, fontWeight: 700 }}>{q.question}</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        {q.options.map(opt => {
          let bg = "rgba(255,255,255,0.05)";
          let border = "1px solid rgba(255,255,255,0.1)";
          let color = "#e2e8f0";
          if (answered) {
            if (opt === q.answer) { bg = "rgba(16,185,129,0.15)"; border = "2px solid #10b981"; color = "#34d399"; }
            else if (opt === selected) { bg = "rgba(239,68,68,0.12)"; border = "2px solid #ef4444"; color = "#fca5a5"; }
          }
          return (
            <button key={opt} onClick={() => pick(opt)}
              style={{ background: bg, border, borderRadius: 12, padding: "14px 16px", textAlign: "left", cursor: answered ? "default" : "pointer", fontFamily: "'Nunito',sans-serif", color, fontSize: 14, fontWeight: 600, transition: "all 0.2s" }}>
              {answered && opt === q.answer && "✅ "}
              {answered && opt === selected && opt !== q.answer && "❌ "}
              {opt}
            </button>
          );
        })}
      </div>
      {answered && (
        <div>
          <div style={{ background: selected === q.answer ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.08)", border: `1px solid ${selected === q.answer ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`, borderRadius: 14, padding: 14, marginBottom: 14 }}>
            <div style={{ fontFamily: "'Fredoka One',cursive", color: selected === q.answer ? "#34d399" : "#f87171", fontSize: 16, marginBottom: 6 }}>
              {selected === q.answer ? "🎉 Correct!" : "💡 Keep Learning!"}
            </div>
            <p style={{ fontFamily: "'Nunito',sans-serif", color: "#cbd5e1", fontSize: 13, margin: 0 }}>{q.explanation}</p>
          </div>
          <button onClick={next} style={{ ...actionBtn("#06b6d4"), width: "100%", padding: 16, fontSize: 17 }}>Next Question →</button>
        </div>
      )}
    </div>
  );
}

function WordBoostScreen({ onXP, onBack }) {
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState(null);
  const [collected, setCollected] = useState([]);
  const [done, setDone] = useState(false);

  const w = WORD_BOOST[idx % WORD_BOOST.length];

  function pick(word) {
    if (chosen) return;
    setChosen(word);
    const nc = [...collected, word];
    setCollected(nc);
    onXP(10, nc.length >= 5 ? "word_booster" : null);
  }

  function next() {
    const ni = idx + 1;
    setChosen(null);
    setIdx(ni);
    if (ni >= WORD_BOOST.length) setDone(true);
  }

  if (done) return (
    <div style={{ padding: 20, textAlign: "center" }}>
      <button onClick={onBack} style={backBtn}>← Back</button>
      <div style={{ fontSize: 64, marginBottom: 12 }}>🏆</div>
      <h2 style={{ fontFamily: "'Fredoka One',cursive", color: "#fbbf24", fontSize: 26, margin: "0 0 8px" }}>Word Master!</h2>
      <p style={{ fontFamily: "'Nunito',sans-serif", color: "#94a3b8", fontSize: 14 }}>You collected {collected.length} powerful words!</p>
      <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 14, padding: 14, marginTop: 16, marginBottom: 20 }}>
        <div style={{ fontFamily: "'Fredoka One',cursive", color: "#a855f7", fontSize: 15, marginBottom: 8 }}>Your Word Collection</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
          {collected.map((word, i) => (
            <span key={i} style={{ background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.4)", borderRadius: 20, padding: "4px 12px", fontFamily: "'Nunito',sans-serif", color: "#c4b5fd", fontSize: 13, fontWeight: 700 }}>{word}</span>
          ))}
        </div>
      </div>
      <button onClick={() => { setIdx(0); setCollected([]); setChosen(null); setDone(false); }} style={{ ...actionBtn("#a855f7"), width: "100%", padding: 14 }}>🔄 Practice Again</button>
    </div>
  );

  return (
    <div style={{ padding: 20 }}>
      <button onClick={onBack} style={backBtn}>← Back</button>
      <h2 style={{ fontFamily: "'Fredoka One',cursive", color: "#10b981", fontSize: 24, margin: "0 0 6px" }}>Word Power</h2>
      <p style={{ fontFamily: "'Nunito',sans-serif", color: "#94a3b8", fontSize: 14, margin: "0 0 18px" }}>Swap boring words for exciting ones!</p>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ display: "inline-block", background: "rgba(239,68,68,0.15)", border: "2px solid rgba(239,68,68,0.4)", borderRadius: 16, padding: "16px 28px", marginBottom: 10 }}>
          <div style={{ fontFamily: "'Nunito',sans-serif", color: "#94a3b8", fontSize: 12, marginBottom: 4 }}>😴 BORING WORD</div>
          <div style={{ fontFamily: "'Fredoka One',cursive", color: "#f87171", fontSize: 32 }}>{w.weak}</div>
        </div>
        <div style={{ color: "#94a3b8", fontSize: 20, marginBottom: 10 }}>↓</div>
        <p style={{ fontFamily: "'Nunito',sans-serif", color: "#fbbf24", fontSize: 13, background: "rgba(251,191,36,0.08)", borderRadius: 10, padding: "8px 14px", margin: "0 0 16px" }}>💡 {w.tip}</p>
      </div>
      <div style={{ fontFamily: "'Fredoka One',cursive", color: "#10b981", fontSize: 16, marginBottom: 10 }}>✨ Choose a BETTER word:</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {w.strong.map(word => (
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
          <button onClick={next} style={{ ...actionBtn("#10b981"), width: "100%", padding: 14 }}>Next Word →</button>
        </div>
      )}
      <div style={{ marginTop: 16, display: "flex", justifyContent: "center", gap: 6 }}>
        {WORD_BOOST.map((_, i) => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i < idx ? "#10b981" : i === idx ? "#34d399" : "rgba(255,255,255,0.15)" }} />
        ))}
      </div>
    </div>
  );
}

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
      <div style={{ marginTop: 20, textAlign: "center", fontFamily: "'Nunito',sans-serif", color: "#94a3b8", fontSize: 13 }}>{badges.length}/{BADGES.length} badges earned · {xp} total XP</div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("home");
  const [xp, setXP] = useState(0);
  const [badges, setBadges] = useState([]);
  const [toast, setToast] = useState(null);
  const [xpBurst, setXpBurst] = useState(false);
  const [streak] = useState(0);
  const grammarCount = useRef(0);
  const storyBadgeDone = useRef(false);

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
    setXP(prev => {
      const newXp = prev + amount;
      if (getLevel(newXp) > getLevel(prev)) setTimeout(() => awardBadge("level_2"), 600);
      return newXp;
    });
    setXpBurst(true);
    setTimeout(() => setXpBurst(false), 800);
    if (badgeId) awardBadge(badgeId);

    if (screen === "grammar") {
      grammarCount.current += 1;
      if (grammarCount.current === 5) awardBadge("grammar_5");
    }
    if (screen === "story" && !storyBadgeDone.current) {
      storyBadgeDone.current = true;
      awardBadge("first_story");
    }
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
      `}</style>
      {toast && <BadgeToast badge={toast} onDone={() => setToast(null)} />}
      <div style={{ maxWidth: "100%", margin: "0 auto", minHeight: "100vh", background: "linear-gradient(180deg,#0f172a 0%,#1e1b4b 100%)" }}>
        <div style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(15,23,42,0.92)", backdropFilter: "blur(12px)", padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <XPBar xp={xp} showBurst={xpBurst} />
        </div>
        {screen === "home" && <HomeScreen xp={xp} badges={badges} onNav={setScreen} streak={streak} />}
        {screen === "story" && <StoryScreen onXP={handleXP} onBack={() => setScreen("home")} />}
        {screen === "grammar" && <GrammarScreen onXP={handleXP} onBack={() => setScreen("home")} />}
        {screen === "wordboost" && <WordBoostScreen onXP={handleXP} onBack={() => setScreen("home")} />}
        {screen === "badges" && <BadgesScreen badges={badges} xp={xp} onBack={() => setScreen("home")} />}
      </div>
    </>
  );
}