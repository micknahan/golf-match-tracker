import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const STORAGE_KEY = "shangri-la-matches-app-v2";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const SCORE_TABLE = "golf_match_sessions";
const SCORE_CHANNEL = "golf-live-scores";

const hasSupabaseConfig = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
const supabase = hasSupabaseConfig
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const matches = [
  {
    id: "match1",
    title: "Day 1 Match",
    subtitle:
      "Heritage / Legends • 18 holes • 4-man teams • Best 2 scores count per hole",
    scoreType: "best2of4",
    players: ["Jeff", "Cauley", "Dexter", "Cliff", "Cody", "Toal", "Mahan", "Wesley"],
    teams: [
      { name: "Team 1", players: ["Jeff", "Cauley", "Dexter", "Cliff"] },
      { name: "Team 2", players: ["Cody", "Toal", "Mahan", "Wesley"] },
    ],
    holes: [
      { hole: 1, par: 4, course: "Heritage" },
      { hole: 2, par: 4, course: "Heritage" },
      { hole: 3, par: 4, course: "Heritage" },
      { hole: 4, par: 5, course: "Heritage" },
      { hole: 5, par: 3, course: "Heritage" },
      { hole: 6, par: 4, course: "Heritage" },
      { hole: 7, par: 4, course: "Heritage" },
      { hole: 8, par: 3, course: "Heritage" },
      { hole: 9, par: 5, course: "Heritage" },
      { hole: 1, par: 5, course: "Legends" },
      { hole: 2, par: 3, course: "Legends" },
      { hole: 3, par: 4, course: "Legends" },
      { hole: 4, par: 3, course: "Legends" },
      { hole: 5, par: 4, course: "Legends" },
      { hole: 6, par: 4, course: "Legends" },
      { hole: 7, par: 5, course: "Legends" },
      { hole: 8, par: 3, course: "Legends" },
      { hole: 9, par: 5, course: "Legends" },
    ],
  },
  {
    id: "match2",
    title: "Day 2 Par 3 Match",
    subtitle:
      "Battlefield • 18 holes • 2-man teams • Best 1 score counts per hole",
    scoreType: "best1of2",
    players: ["Jeff", "Wesley", "Toal", "Cliff", "Mahan", "Cauley", "Cody", "Dexter"],
    teams: [
      { name: "Jeff / Wesley", players: ["Jeff", "Wesley"] },
      { name: "Toal / Cliff", players: ["Toal", "Cliff"] },
      { name: "Mahan / Cauley", players: ["Mahan", "Cauley"] },
      { name: "Cody / Dexter", players: ["Cody", "Dexter"] },
    ],
    holes: Array.from({ length: 18 }, (_, i) => ({
      hole: i + 1,
      par: 3,
      course: "Battlefield",
    })),
  },
  {
    id: "match3",
    title: "Day 2 Afternoon Match",
    subtitle:
      "Champions • 9 holes • 4-man teams • Best 2 scores count per hole",
    scoreType: "best2of4",
    players: ["Cody", "Cliff", "Mahan", "Dexter", "Jeff", "Toal", "Cauley", "Wesley"],
    teams: [
      { name: "Team 1", players: ["Cody", "Cliff", "Mahan", "Dexter"] },
      { name: "Team 2", players: ["Jeff", "Toal", "Cauley", "Wesley"] },
    ],
    holes: [
      { hole: 1, par: 5, course: "Champions" },
      { hole: 2, par: 3, course: "Champions" },
      { hole: 3, par: 4, course: "Champions" },
      { hole: 4, par: 4, course: "Champions" },
      { hole: 5, par: 4, course: "Champions" },
      { hole: 6, par: 3, course: "Champions" },
      { hole: 7, par: 5, course: "Champions" },
      { hole: 8, par: 4, course: "Champions" },
      { hole: 9, par: 4, course: "Champions" },
    ],
  },
];

function createInitialScores() {
  return matches.reduce((acc, match) => {
    acc[match.id] = {};
    match.holes.forEach((_, holeIndex) => {
      acc[match.id][holeIndex] = {};
      match.players.forEach((player) => {
        acc[match.id][holeIndex][player] = "";
      });
    });
    return acc;
  }, {});
}

function toNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function scoreTeamForHole(match, team, holeScores) {
  const values = team.players
    .map((player) => toNumber(holeScores[player]))
    .filter((value) => value !== null)
    .sort((a, b) => a - b);

  if (match.scoreType === "best1of2") return values.length >= 1 ? values[0] : null;
  if (match.scoreType === "best2of4") return values.length >= 2 ? values[0] + values[1] : null;
  return null;
}

function getParForTeam(match, hole) {
  return match.scoreType === "best2of4" ? hole.par * 2 : hole.par;
}

function computeMatchSummary(match, scorebook) {
  const teamTotals = match.teams.map((team) => {
    let total = 0;
    let completedHoles = 0;
    let parTotal = 0;

    match.holes.forEach((hole, index) => {
      const holeScore = scoreTeamForHole(match, team, scorebook[index] || {});
      parTotal += getParForTeam(match, hole);
      if (holeScore !== null) {
        total += holeScore;
        completedHoles += 1;
      }
    });

    return { ...team, total, completedHoles, parTotal, toPar: total - parTotal };
  });

  const completedByHole = match.holes.filter((_, index) => {
    const scores = scorebook[index] || {};
    return match.players.every((player) => toNumber(scores[player]) !== null);
  }).length;

  return { teamTotals, completedByHole };
}

function formatToPar(value) {
  if (value === 0) return "E";
  return value > 0 ? `+${value}` : `${value}`;
}

function deepMergeScores(base, incoming) {
  const merged = JSON.parse(JSON.stringify(base));
  Object.entries(incoming || {}).forEach(([matchId, holeMap]) => {
    if (!merged[matchId]) merged[matchId] = {};
    Object.entries(holeMap || {}).forEach(([holeIndex, playerMap]) => {
      if (!merged[matchId][holeIndex]) merged[matchId][holeIndex] = {};
      Object.entries(playerMap || {}).forEach(([player, value]) => {
        merged[matchId][holeIndex][player] = value;
      });
    });
  });
  return merged;
}

function makeShareUrl(sessionId) {
  const url = new URL(window.location.href);
  url.searchParams.set("session", sessionId);
  return url.toString();
}

const styles = {
  page: { fontFamily: "Arial, sans-serif", background: "#f5f7fb", minHeight: "100vh", padding: 16, color: "#111827" },
  wrap: { maxWidth: 1400, margin: "0 auto" },
  card: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 16, marginBottom: 16 },
  row: { display: "flex", gap: 12, flexWrap: "wrap" },
  button: { padding: "10px 14px", borderRadius: 10, border: "1px solid #d1d5db", background: "#111827", color: "#fff", cursor: "pointer" },
  buttonAlt: { padding: "10px 14px", borderRadius: 10, border: "1px solid #d1d5db", background: "#fff", color: "#111827", cursor: "pointer" },
  input: { padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db", minWidth: 220 },
  smallInput: { width: 54, padding: 6, textAlign: "center", borderRadius: 8, border: "1px solid #d1d5db" },
  tableWrap: { overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: 16, background: "#fff" },
  table: { borderCollapse: "collapse", width: "100%", minWidth: 1100 },
  th: { padding: 8, borderBottom: "1px solid #e5e7eb", background: "#f3f4f6", textAlign: "center", whiteSpace: "nowrap", fontSize: 13 },
  td: { padding: 8, borderBottom: "1px solid #e5e7eb", textAlign: "center", fontSize: 13 },
  badge: { display: "inline-block", padding: "4px 8px", borderRadius: 999, background: "#eef2ff", fontSize: 12 },
  tab: (active) => ({
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    background: active ? "#111827" : "#fff",
    color: active ? "#fff" : "#111827",
    cursor: "pointer",
  }),
};

export default function App() {
  const [scores, setScores] = useState(createInitialScores);
  const [activeTab, setActiveTab] = useState(matches[0].id);
  const [sessionId, setSessionId] = useState("shangri-la-2026");
  const [sessionInput, setSessionInput] = useState("shangri-la-2026");
  const [syncStatus, setSyncStatus] = useState(hasSupabaseConfig ? "Connecting..." : "Local only");
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const params = new URLSearchParams(window.location.search);
    const sessionFromUrl = params.get("session");

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.scores) setScores((current) => deepMergeScores(current, parsed.scores));
        if (parsed.sessionId && !sessionFromUrl) {
          setSessionId(parsed.sessionId);
          setSessionInput(parsed.sessionId);
        }
      } catch {}
    }

    if (sessionFromUrl) {
      setSessionId(sessionFromUrl);
      setSessionInput(sessionFromUrl);
    }

    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ sessionId, scores, lastSavedAt: Date.now() }));
  }, [scores, sessionId, isHydrated]);

  useEffect(() => {
    if (!isHydrated || !hasSupabaseConfig || !supabase || !sessionId) return;

    let isMounted = true;
    let channel;

    async function loadSession() {
      setSyncStatus("Loading shared session...");
      const { data, error } = await supabase
        .from(SCORE_TABLE)
        .select("session_id, scores, updated_at")
        .eq("session_id", sessionId)
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        setSyncStatus("Sync error");
        return;
      }

      if (data?.scores) {
        setScores((current) => deepMergeScores(current, data.scores));
        setLastSavedAt(data.updated_at || null);
      } else {
        await supabase.from(SCORE_TABLE).upsert(
          { session_id: sessionId, scores: createInitialScores(), updated_at: new Date().toISOString() },
          { onConflict: "session_id" }
        );
      }

      setSyncStatus("Live sync connected");

      channel = supabase
        .channel(`${SCORE_CHANNEL}-${sessionId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: SCORE_TABLE, filter: `session_id=eq.${sessionId}` },
          (payload) => {
            if (!isMounted) return;
            if (payload.new?.scores) {
              setScores((current) => deepMergeScores(current, payload.new.scores));
              setLastSavedAt(payload.new.updated_at || null);
              setSyncStatus("Live sync connected");
            }
          }
        )
        .subscribe();
    }

    loadSession();

    return () => {
      isMounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [sessionId, isHydrated]);

  const pushSharedScores = async (nextScores) => {
    if (!hasSupabaseConfig || !supabase || !sessionId) return;
    const updated_at = new Date().toISOString();
    const { error } = await supabase
      .from(SCORE_TABLE)
      .upsert({ session_id: sessionId, scores: nextScores, updated_at }, { onConflict: "session_id" });

    if (!error) {
      setLastSavedAt(updated_at);
      setSyncStatus("Live sync connected");
    } else {
      setSyncStatus("Sync error");
    }
  };

  const summaries = useMemo(() => {
    return matches.reduce((acc, match) => {
      acc[match.id] = computeMatchSummary(match, scores[match.id] || {});
      return acc;
    }, {});
  }, [scores]);

  const updateScore = (matchId, holeIndex, player, value) => {
    const cleaned = value.replace(/[^0-9]/g, "");
    setScores((prev) => {
      const next = {
        ...prev,
        [matchId]: {
          ...prev[matchId],
          [holeIndex]: {
            ...prev[matchId][holeIndex],
            [player]: cleaned,
          },
        },
      };
      void pushSharedScores(next);
      return next;
    });
  };

  const resetMatch = (matchId) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;

    const cleared = {};
    match.holes.forEach((_, holeIndex) => {
      cleared[holeIndex] = {};
      match.players.forEach((player) => {
        cleared[holeIndex][player] = "";
      });
    });

    setScores((prev) => {
      const next = { ...prev, [matchId]: cleared };
      void pushSharedScores(next);
      return next;
    });
  };

  const applySession = () => {
    const cleaned = sessionInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const nextSession = cleaned || "shangri-la-2026";
    setSessionId(nextSession);
    const url = new URL(window.location.href);
    url.searchParams.set("session", nextSession);
    window.history.replaceState({}, "", url.toString());
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(makeShareUrl(sessionId));
      alert("Share link copied");
    } catch {
      alert("Could not copy link");
    }
  };

  const activeMatch = matches.find((m) => m.id === activeTab);
  const activeSummary = summaries[activeTab];
  const sortedTeams = [...activeSummary.teamTotals].sort(
    (a, b) => a.total - b.total || b.completedHoles - a.completedHoles
  );

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <div style={{ ...styles.card }}>
          <h1 style={{ marginTop: 0 }}>Shangri-La Match Tracker</h1>
          <p>Enter scores hole-by-hole and share the same session link with the group.</p>
          <div style={styles.row}>
            <input
              style={styles.input}
              value={sessionInput}
              onChange={(e) => setSessionInput(e.target.value)}
              placeholder="Session ID"
            />
            <button style={styles.button} onClick={applySession}>Join / create session</button>
            <button style={styles.buttonAlt} onClick={copyShareLink}>Copy share link</button>
          </div>
          <div style={{ marginTop: 10, fontSize: 13 }}>
            <strong>Current session:</strong> {sessionId}
          </div>
          <div style={{ marginTop: 6, fontSize: 13 }}>
            <strong>Status:</strong> {syncStatus}
            {lastSavedAt ? ` • Last save: ${new Date(lastSavedAt).toLocaleString()}` : ""}
          </div>
        </div>

        <div style={{ ...styles.row, marginBottom: 16 }}>
          {matches.map((match) => (
            <button
              key={match.id}
              style={styles.tab(activeTab === match.id)}
              onClick={() => setActiveTab(match.id)}
            >
              {match.title}
            </button>
          ))}
        </div>

        <div style={styles.card}>
          <h2 style={{ marginTop: 0 }}>{activeMatch.title}</h2>
          <div style={{ marginBottom: 12 }}>{activeMatch.subtitle}</div>
          <div style={{ ...styles.row, marginBottom: 16 }}>
            {sortedTeams.map((team) => (
              <div key={team.name} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, background: "#fafafa" }}>
                <div style={{ fontWeight: 700 }}>{team.name}</div>
                <div>{team.players.join(" • ")}</div>
                <div style={{ marginTop: 6 }}>Total: <strong>{team.total}</strong></div>
                <div>To par: <strong>{formatToPar(team.toPar)}</strong></div>
                <div>Completed holes: {team.completedHoles}/{activeMatch.holes.length}</div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 12 }}>
            <button style={styles.buttonAlt} onClick={() => resetMatch(activeMatch.id)}>
              Reset this match
            </button>
          </div>

          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Hole</th>
                  <th style={styles.th}>Par</th>
                  <th style={styles.th}>Course</th>
                  {activeMatch.players.map((player) => (
                    <th key={player} style={styles.th}>{player}</th>
                  ))}
                  {activeMatch.teams.map((team) => (
                    <th key={team.name} style={styles.th}>{team.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeMatch.holes.map((hole, holeIndex) => {
                  const holeScores = scores[activeMatch.id]?.[holeIndex] || {};
                  const teamScores = activeMatch.teams.map((team) =>
                    scoreTeamForHole(activeMatch, team, holeScores)
                  );

                  return (
                    <tr key={`${activeMatch.id}-${holeIndex}`}>
                      <td style={styles.td}>{hole.hole}</td>
                      <td style={styles.td}>{hole.par}</td>
                      <td style={styles.td}>{hole.course}</td>
                      {activeMatch.players.map((player) => (
                        <td key={`${holeIndex}-${player}`} style={styles.td}>
                          <input
                            style={styles.smallInput}
                            inputMode="numeric"
                            value={holeScores[player] ?? ""}
                            onChange={(e) =>
                              updateScore(activeMatch.id, holeIndex, player, e.target.value)
                            }
                          />
                        </td>
                      ))}
                      {activeMatch.teams.map((team, i) => (
                        <td key={`${holeIndex}-${team.name}`} style={styles.td}>
                          {teamScores[i] ?? "-"}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}