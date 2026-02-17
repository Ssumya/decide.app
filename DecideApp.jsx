import { useState, useEffect, useRef } from "react";

const CATEGORIES = [
  { id: "meals", label: "Eat", icon: "🍽️", color: "#E8693A", suggestions: ["Pasta carbonara", "Grilled salmon", "Caesar salad", "Tacos", "Stir fry", "Pizza", "Ramen", "Sushi", "Burgers", "Soup & bread"] },
  { id: "outfits", label: "Wear", icon: "👔", color: "#4A7FA5", suggestions: ["Casual jeans + tee", "Smart casual blazer", "Athleisure", "Business formal", "Summer dress", "Cozy sweater + trousers", "Monochrome look", "Smart sneakers + chinos"] },
  { id: "activities", label: "Do", icon: "⚡", color: "#7B5EA7", suggestions: ["30-min walk", "Read a chapter", "Call a friend", "Watch a documentary", "Cook something new", "Journal", "Stretch / yoga", "Visit a local spot"] },
  { id: "work", label: "Focus", icon: "🎯", color: "#2A9D8F", suggestions: ["Deep work block", "Clear inbox to zero", "One key project task", "Team check-ins", "Plan tomorrow", "Review goals", "Learn something new", "Brainstorm session"] },
  { id: "custom", label: "Custom", icon: "✦", color: "#C9A84C", suggestions: [] },
];

const MOODS = ["😴 Tired", "😊 Good", "🔥 Energized", "😤 Stressed", "🌀 Overwhelmed"];

function Spinner({ active }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "6px",
      opacity: active ? 1 : 0, transition: "opacity 0.3s"
    }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          width: 8, height: 8, borderRadius: "50%",
          background: "#C9A84C",
          animation: active ? `bounce 0.9s ${i * 0.15}s infinite ease-in-out` : "none"
        }} />
      ))}
    </div>
  );
}

function DecisionCard({ decision, category, onAccept, onReject, onNew }) {
  const cat = CATEGORIES.find(c => c.id === category);
  return (
    <div style={{
      background: "#1A1A1A",
      border: `1px solid ${cat.color}33`,
      borderRadius: 20,
      padding: "36px 32px",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${cat.color}, ${cat.color}44)`
      }} />
      <div style={{ fontSize: 13, color: "#666", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12, fontFamily: "'DM Mono', monospace" }}>
        {cat.icon} Today's {cat.label} Decision
      </div>
      <div style={{
        fontSize: 32, fontWeight: 700, color: "#F0EDE6",
        fontFamily: "'Playfair Display', serif",
        lineHeight: 1.25, marginBottom: 20,
        letterSpacing: "-0.02em"
      }}>
        {decision.choice}
      </div>
      {decision.reasoning && (
        <div style={{
          fontSize: 14, color: "#888", lineHeight: 1.7,
          marginBottom: 28, fontFamily: "'DM Sans', sans-serif",
          padding: "14px 16px", background: "#111", borderRadius: 10,
          borderLeft: `3px solid ${cat.color}66`
        }}>
          {decision.reasoning}
        </div>
      )}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onAccept} style={{
          flex: 1, padding: "12px 0", borderRadius: 10,
          background: cat.color, color: "#fff", border: "none",
          fontSize: 14, fontWeight: 600, cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.03em",
          transition: "opacity 0.2s"
        }}>
          ✓ Done, I'll do this
        </button>
        <button onClick={onNew} style={{
          padding: "12px 18px", borderRadius: 10,
          background: "transparent", color: "#888",
          border: "1px solid #2A2A2A", fontSize: 14,
          cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
          transition: "border-color 0.2s"
        }}>
          ↻ New
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [activeCategory, setActiveCategory] = useState("meals");
  const [mood, setMood] = useState(null);
  const [customItems, setCustomItems] = useState([]);
  const [customInput, setCustomInput] = useState("");
  const [decisions, setDecisions] = useState({});
  const [loading, setLoading] = useState({});
  const [accepted, setAccepted] = useState({});
  const [history, setHistory] = useState([]);
  const [view, setView] = useState("home"); // home | history
  const [error, setError] = useState(null);

  const cat = CATEGORIES.find(c => c.id === activeCategory);

  async function getDecision(categoryId) {
    const c = CATEGORIES.find(x => x.id === categoryId);
    const pool = categoryId === "custom" ? customItems : c.suggestions;

    if (categoryId === "custom" && pool.length === 0) {
      setError("Add at least one option to your custom list first.");
      return;
    }

    setError(null);
    setLoading(prev => ({ ...prev, [categoryId]: true }));
    setDecisions(prev => ({ ...prev, [categoryId]: null }));

    const moodText = mood ? `\nUser's current mood/energy: ${mood}` : "";
    const prompt = `You are a calm, decisive assistant that eliminates decision fatigue. 
Pick ONE option from this list and give a SHORT, confident reason (1–2 sentences max) for WHY it's the right call right now.
Category: ${c.label}
Options: ${pool.join(", ")}${moodText}

Respond ONLY in this JSON format (no markdown):
{"choice": "...", "reasoning": "..."}`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "x-api-key": "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",
            "anthropic-version": "2023-06-01",},
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }]
        })
      });

      const data = await response.json();
      const text = data.content?.map(b => b.text || "").join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setDecisions(prev => ({ ...prev, [categoryId]: parsed }));
    } catch (e) {
      setError("Couldn't reach AI. Try again.");
    } finally {
      setLoading(prev => ({ ...prev, [categoryId]: false }));
    }
  }

  function acceptDecision() {
    const d = decisions[activeCategory];
    if (!d) return;
    const entry = {
      id: Date.now(),
      category: activeCategory,
      icon: cat.icon,
      label: cat.label,
      choice: d.choice,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      date: new Date().toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }),
    };
    setHistory(prev => [entry, ...prev]);
    setAccepted(prev => ({ ...prev, [activeCategory]: true }));
  }

  function addCustomItem() {
    const val = customInput.trim();
    if (!val || customItems.includes(val)) return;
    setCustomItems(prev => [...prev, val]);
    setCustomInput("");
  }

  const allDone = CATEGORIES.filter(c => c.id !== "custom").every(c => accepted[c.id]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0E0E0E; }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-8px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        button:hover { opacity: 0.85; }
        input:focus { outline: none; }
      `}</style>

      <div style={{
        minHeight: "100vh", background: "#0E0E0E",
        fontFamily: "'DM Sans', sans-serif", color: "#F0EDE6",
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "0 16px 60px"
      }}>
        {/* Header */}
        <div style={{
          width: "100%", maxWidth: 540,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "28px 0 24px"
        }}>
          <div>
            <div style={{
              fontSize: 22, fontWeight: 900, letterSpacing: "-0.03em",
              fontFamily: "'Playfair Display', serif", color: "#F0EDE6"
            }}>
              Decide<span style={{ color: "#C9A84C" }}>.</span>
            </div>
            <div style={{ fontSize: 12, color: "#555", letterSpacing: "0.08em", fontFamily: "'DM Mono', monospace", marginTop: 2 }}>
              {new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" }).toUpperCase()}
            </div>
          </div>
          <button onClick={() => setView(view === "home" ? "history" : "home")} style={{
            background: "transparent", border: "1px solid #2A2A2A",
            color: "#888", padding: "8px 14px", borderRadius: 8,
            fontSize: 12, cursor: "pointer", fontFamily: "'DM Mono', monospace",
            letterSpacing: "0.05em"
          }}>
            {view === "home" ? `LOG (${history.length})` : "← BACK"}
          </button>
        </div>

        <div style={{ width: "100%", maxWidth: 540 }}>

          {view === "history" ? (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Playfair Display', serif", marginBottom: 6 }}>Today's Decisions</div>
              <div style={{ fontSize: 13, color: "#555", marginBottom: 24 }}>Everything you've committed to.</div>
              {history.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#444", fontSize: 14 }}>
                  No decisions logged yet.<br />Go make one!
                </div>
              ) : history.map((h, i) => {
                const hCat = CATEGORIES.find(c => c.id === h.category);
                return (
                  <div key={h.id} style={{
                    background: "#141414", border: "1px solid #222",
                    borderRadius: 14, padding: "16px 20px",
                    marginBottom: 10, display: "flex", alignItems: "center", gap: 16,
                    animation: `slideIn 0.3s ${i * 0.04}s both ease`
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: `${hCat?.color}22`, display: "flex",
                      alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0
                    }}>
                      {h.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "#F0EDE6" }}>{h.choice}</div>
                      <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{h.label} · {h.time}</div>
                    </div>
                    <div style={{ fontSize: 18, color: hCat?.color }}>✓</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <>
              {/* Mood selector */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 11, color: "#555", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>
                  How are you feeling?
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {MOODS.map(m => (
                    <button key={m} onClick={() => setMood(mood === m ? null : m)} style={{
                      padding: "7px 14px", borderRadius: 20, fontSize: 13,
                      cursor: "pointer", transition: "all 0.2s",
                      background: mood === m ? "#C9A84C22" : "transparent",
                      border: `1px solid ${mood === m ? "#C9A84C" : "#2A2A2A"}`,
                      color: mood === m ? "#C9A84C" : "#666",
                      fontFamily: "'DM Sans', sans-serif"
                    }}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category tabs */}
              <div style={{ display: "flex", gap: 6, marginBottom: 24, overflowX: "auto", paddingBottom: 4 }}>
                {CATEGORIES.map(c => (
                  <button key={c.id} onClick={() => { setActiveCategory(c.id); setError(null); }} style={{
                    padding: "9px 16px", borderRadius: 10, fontSize: 13,
                    fontWeight: 500, cursor: "pointer", transition: "all 0.2s",
                    flexShrink: 0, fontFamily: "'DM Sans', sans-serif",
                    background: activeCategory === c.id ? c.color : "#141414",
                    border: `1px solid ${activeCategory === c.id ? c.color : "#222"}`,
                    color: activeCategory === c.id ? "#fff" : "#666",
                  }}>
                    {c.icon} {c.label}
                    {accepted[c.id] && <span style={{ marginLeft: 6, fontSize: 11 }}>✓</span>}
                  </button>
                ))}
              </div>

              {/* Custom list builder */}
              {activeCategory === "custom" && (
                <div style={{
                  background: "#141414", border: "1px solid #222",
                  borderRadius: 14, padding: "20px", marginBottom: 20,
                  animation: "fadeIn 0.25s ease"
                }}>
                  <div style={{ fontSize: 12, color: "#555", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>
                    Your options
                  </div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                    <input
                      value={customInput}
                      onChange={e => setCustomInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addCustomItem()}
                      placeholder="Add an option..."
                      style={{
                        flex: 1, background: "#1A1A1A", border: "1px solid #2A2A2A",
                        borderRadius: 8, padding: "10px 14px", color: "#F0EDE6",
                        fontSize: 14, fontFamily: "'DM Sans', sans-serif"
                      }}
                    />
                    <button onClick={addCustomItem} style={{
                      background: "#C9A84C", border: "none", borderRadius: 8,
                      color: "#000", fontWeight: 700, fontSize: 18,
                      width: 42, cursor: "pointer"
                    }}>+</button>
                  </div>
                  {customItems.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {customItems.map(item => (
                        <span key={item} style={{
                          background: "#1A1A1A", border: "1px solid #2A2A2A",
                          borderRadius: 20, padding: "5px 12px", fontSize: 13, color: "#AAA",
                          display: "flex", alignItems: "center", gap: 8
                        }}>
                          {item}
                          <span onClick={() => setCustomItems(p => p.filter(x => x !== item))}
                            style={{ cursor: "pointer", color: "#555", fontSize: 16 }}>×</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Decision area */}
              <div style={{ minHeight: 200 }}>
                {error && (
                  <div style={{ color: "#E8693A", fontSize: 13, marginBottom: 16, padding: "12px 16px", background: "#E8693A11", borderRadius: 10, border: "1px solid #E8693A33" }}>
                    {error}
                  </div>
                )}

                {!decisions[activeCategory] && !loading[activeCategory] && (
                  <div style={{ animation: "fadeIn 0.3s ease" }}>
                    <div style={{
                      textAlign: "center", padding: "40px 0 32px",
                      color: "#333", fontSize: 48
                    }}>
                      {cat.icon}
                    </div>
                    <div style={{ textAlign: "center", color: "#444", fontSize: 14, marginBottom: 28 }}>
                      {activeCategory === "custom" && customItems.length === 0
                        ? "Add your options above, then let AI decide."
                        : `AI will pick the best ${cat.label.toLowerCase()} decision for you${mood ? " based on your mood" : ""}.`}
                    </div>
                    <button
                      onClick={() => getDecision(activeCategory)}
                      style={{
                        width: "100%", padding: "16px", borderRadius: 14,
                        background: cat.color, border: "none", color: "#fff",
                        fontSize: 16, fontWeight: 700, cursor: "pointer",
                        fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.02em",
                        transition: "opacity 0.2s"
                      }}>
                      Decide for me →
                    </button>
                  </div>
                )}

                {loading[activeCategory] && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 16, animation: "fadeIn 0.2s ease" }}>
                    <Spinner active={true} />
                    <div style={{ fontSize: 13, color: "#444", fontFamily: "'DM Mono', monospace" }}>
                      thinking...
                    </div>
                  </div>
                )}

                {decisions[activeCategory] && !loading[activeCategory] && (
                  <div style={{ animation: "fadeIn 0.35s ease" }}>
                    {accepted[activeCategory] ? (
                      <div style={{
                        background: "#141414", border: `1px solid ${cat.color}44`,
                        borderRadius: 20, padding: "32px", textAlign: "center"
                      }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
                        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display', serif", color: cat.color, marginBottom: 8 }}>
                          {decisions[activeCategory].choice}
                        </div>
                        <div style={{ fontSize: 13, color: "#555", marginBottom: 24 }}>Logged to your decisions.</div>
                        <button onClick={() => {
                          setAccepted(p => ({ ...p, [activeCategory]: false }));
                          setDecisions(p => ({ ...p, [activeCategory]: null }));
                        }} style={{
                          background: "transparent", border: "1px solid #2A2A2A",
                          color: "#666", padding: "10px 20px", borderRadius: 8,
                          fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif"
                        }}>
                          Decide again
                        </button>
                      </div>
                    ) : (
                      <DecisionCard
                        decision={decisions[activeCategory]}
                        category={activeCategory}
                        onAccept={acceptDecision}
                        onNew={() => getDecision(activeCategory)}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* All done banner */}
              {allDone && (
                <div style={{
                  marginTop: 32, padding: "20px 24px",
                  background: "#C9A84C11", border: "1px solid #C9A84C44",
                  borderRadius: 14, textAlign: "center", animation: "fadeIn 0.4s ease"
                }}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>🎉</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "#C9A84C", fontFamily: "'Playfair Display', serif" }}>
                    All decided. Zero fatigue.
                  </div>
                  <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
                    You can stop thinking now.
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
