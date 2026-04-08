import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const STORAGE_KEY = "shangri-la-matches-app-v5";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const SCORE_TABLE = "golf_match_sessions";
const SCORE_CHANNEL = "golf-live-scores";

const hasSupabaseConfig = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
const supabase = hasSupabaseConfig ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const MATCH_STAKE_PER_PERSON = 50;
const SIDE_BET_STAKE_PER_PERSON = 100;

const SIDE_BET = {
  name: "Mahan / Toal vs Jeff / Dexter",
  teamAName: "Mahan / Toal",
  teamBName: "Jeff / Dexter",
  teamAPlayers: ["Mahan", "Toal"],
  teamBPlayers: ["Jeff", "Dexter"],
};

const matches = [
  {
    id: "match1",
    title: "Day 1 Match",
    subtitle: "Heritage / Legends • 18 holes • 4-man teams • Best 2 scores count per hole",
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
    subtitle: "Battlefield • 18 holes • 2-man teams • Best 1 score counts per hole",
    scoreType: "best1of2",
    players: ["Jeff", "Wesley", "Toal", "Cliff", "Mahan", "Cauley", "Cody", "Dexter"],
    teams: [
      { name: "Jeff / Wesley", players: ["Jeff", "Wesley"] },
      { name: "Toal / Cliff", players: ["Toal", "Cliff"] },
      { name: "Mahan / Cauley", players: ["Mahan", "Cauley"] },
      { name: "Cody / Dexter", players: ["Cody", "Dexter"] },
    ],
    holes: Array.from({ length: 18 }, (_, i) => ({ hole: i + 1, par: 3, course: "Battlefield" })),
  },
  {
    id: "match3",
    title: "Day 2 Afternoon Match",
    subtitle: "Champions • 9 holes • 4-man teams • Best 2 scores count per hole",
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

function scoreNamedPlayersBestOne(players, holeScores) {
  const values = players
    .map((player) => toNumber(holeScores[player]))
    .filter((value) => value !== null)
    .sort((a, b) => a - b);
  return values.length >= 1 ? values[0] : null;
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
      if (holeScore !== null) {
        total += holeScore;
        completedHoles += 1;
        parTotal += getParForTeam(match, hole);
      }
    });

    return { ...team, total, completedHoles, parTotal, toPar: total - parTotal };
  });

  const playerTotals = match.players.map((player) => {
    let total = 0;
    let entered = 0;
    let parTotal = 0;

    match.holes.forEach((hole, index) => {
      const value = toNumber(scorebook[index]?.[player]);
      if (value !== null) {
        total += value;
        entered += 1;
        parTotal += hole.par;
      }
    });

    return {
      player,
      total,
      entered,
      parTotal,
      toPar: entered ? total - parTotal : null,
      isComplete: entered === match.holes.length,
    };
  });

  const completedByHole = match.holes.filter((_, index) => {
    const scores = scorebook[index] || {};
    return match.players.every((player) => toNumber(scores[player]) !== null);
  }).length;

  return { teamTotals, playerTotals, completedByHole };
}

function computeSideBet(scores) {
  const holes = [];
  let teamATotal = 0;
  let teamBTotal = 0;
  let teamAHolesWon = 0;
  let teamBHolesWon = 0;
  let ties = 0;

  matches.forEach((match) => {
    match.holes.forEach((hole, holeIndex) => {
      const holeScores = scores[match.id]?.[holeIndex] || {};
      const teamAScore = scoreNamedPlayersBestOne(SIDE_BET.teamAPlayers, holeScores);
      const teamBScore = scoreNamedPlayersBestOne(SIDE_BET.teamBPlayers, holeScores);

      let winner = "";
      if (teamAScore !== null && teamBScore !== null) {
        teamATotal += teamAScore;
        teamBTotal += teamBScore;
        if (teamAScore < teamBScore) {
          winner = SIDE_BET.teamAName;
          teamAHolesWon += 1;
        } else if (teamBScore < teamAScore) {
          winner = SIDE_BET.teamBName;
          teamBHolesWon += 1;
        } else {
          winner = "Tie";
          ties += 1;
        }
      }

      holes.push({
        key: `${match.id}-${holeIndex}`,
        matchTitle: match.title,
        holeLabel: `${hole.course} ${hole.hole}`,
        teamAScore,
        teamBScore,
        winner,
      });
    });
  });

  return { holes, teamATotal, teamBTotal, teamAHolesWon, teamBHolesWon, ties };
}

function computeResults(scores) {
  const holeResults = [];
  const roundResults = [];

  matches.forEach((match) => {
    match.holes.forEach((hole, holeIndex) => {
      const holeScores = scores[match.id]?.[holeIndex] || {};
      match.players.forEach((player) => {
        const score = toNumber(holeScores[player]);
        if (score !== null) {
          holeResults.push({
            matchTitle: match.title,
            course: hole.course,
            hole: hole.hole,
            player,
            score,
            toPar: score - hole.par,
          });
        }
      });
    });

    match.players.forEach((player) => {
      let total = 0;
      let parTotal = 0;
      let entered = 0;
      match.holes.forEach((hole, holeIndex) => {
        const score = toNumber(scores[match.id]?.[holeIndex]?.[player]);
        if (score !== null) {
          total += score;
          parTotal += hole.par;
          entered += 1;
        }
      });

      if (entered === match.holes.length) {
        roundResults.push({
          matchTitle: match.title,
          player,
          total,
          parTotal,
          toPar: total - parTotal,
        });
      }
    });
  });

  const highestHole = holeResults.length
    ? holeResults.reduce((worst, current) => (current.score > worst.score ? current : worst))
    : null;

  const lowestHoleToPar = holeResults.length
    ? holeResults.reduce((best, current) => (current.toPar < best.toPar ? current : best))
    : null;

  const highestRoundToPar = roundResults.length
    ? roundResults.reduce((worst, current) => (current.toPar > worst.toPar ? current : worst))
    : null;

  const lowestRoundToPar = roundResults.length
    ? roundResults.reduce((best, current) => (current.toPar < best.toPar ? current : best))
    : null;

  return { highestHole, lowestHoleToPar, highestRoundToPar, lowestRoundToPar, roundResults };
}

function computePayouts(summaries, sideBet) {
  const ledger = {};
  const allPlayers = Array.from(new Set(matches.flatMap((m) => m.players)));
  allPlayers.forEach((player) => {
    ledger[player] = 0;
  });

  const matchSettlements = [];

  matches.forEach((match) => {
    const summary = summaries[match.id];
    const rankedTeams = [...summary.teamTotals].sort((a, b) => a.total - b.total);
    if (rankedTeams.length < 2) return;

    const winningScore = rankedTeams[0].total;
    const winners = rankedTeams.filter((team) => team.completedHoles === match.holes.length && team.total === winningScore);
    const allComplete = rankedTeams.every((team) => team.completedHoles === match.holes.length);

    if (!allComplete) {
      matchSettlements.push({ matchTitle: match.title, status: "In progress" });
      return;
    }

    if (winners.length !== 1) {
      matchSettlements.push({ matchTitle: match.title, status: "Tie" });
      return;
    }

    const winnerTeam = winners[0];
    const loserTeams = rankedTeams.filter((team) => team.name !== winnerTeam.name);
    if (loserTeams.length !== 1) {
      matchSettlements.push({ matchTitle: match.title, status: "Multiple team payout not supported" });
      return;
    }

    const loserTeam = loserTeams[0];
    winnerTeam.players.forEach((player) => {
      ledger[player] += MATCH_STAKE_PER_PERSON;
    });
    loserTeam.players.forEach((player) => {
      ledger[player] -= MATCH_STAKE_PER_PERSON;
    });

    matchSettlements.push({
      matchTitle: match.title,
      status: `${winnerTeam.name} wins`,
      winners: winnerTeam.players,
      losers: loserTeam.players,
      amountPerPerson: MATCH_STAKE_PER_PERSON,
    });
  });

  let sideBetSettlement = { status: "In progress" };
  const sideBetComplete = sideBet.holes.every((hole) => hole.teamAScore !== null && hole.teamBScore !== null);
  if (sideBetComplete) {
    if (sideBet.teamAHolesWon > sideBet.teamBHolesWon) {
      SIDE_BET.teamAPlayers.forEach((player) => {
        ledger[player] += SIDE_BET_STAKE_PER_PERSON;
      });
      SIDE_BET.teamBPlayers.forEach((player) => {
        ledger[player] -= SIDE_BET_STAKE_PER_PERSON;
      });
      sideBetSettlement = {
        status: `${SIDE_BET.teamAName} wins`,
        winners: SIDE_BET.teamAPlayers,
        losers: SIDE_BET.teamBPlayers,
        amountPerPerson: SIDE_BET_STAKE_PER_PERSON,
      };
    } else if (sideBet.teamBHolesWon > sideBet.teamAHolesWon) {
      SIDE_BET.teamBPlayers.forEach((player) => {
        ledger[player] += SIDE_BET_STAKE_PER_PERSON;
      });
      SIDE_BET.teamAPlayers.forEach((player) => {
        ledger[player] -= SIDE_BET_STAKE_PER_PERSON;
      });
      sideBetSettlement = {
        status: `${SIDE_BET.teamBName} wins`,
        winners: SIDE_BET.teamBPlayers,
        losers: SIDE_BET.teamAPlayers,
        amountPerPerson: SIDE_BET_STAKE_PER_PERSON,
      };
    } else {
      sideBetSettlement = { status: "Tie" };
    }
  }

  const netPayouts = Object.entries(ledger)
    .map(([player, amount]) => ({ player, amount }))
    .filter((item) => item.amount !== 0)
    .sort((a, b) => b.amount - a.amount);

  return { matchSettlements, sideBetSettlement, netPayouts };
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

function formatToPar(value) {
  if (value === null || value === undefined) return "-";
  if (value === 0) return "E";
  return value > 0 ? `+${value}` : `${value}`;
}

function formatMoney(value) {
  const abs = Math.abs(value);
  return `${value < 0 ? "-" : ""}$${abs.toFixed(0)}`;
}

const styles = {
  page: {
    fontFamily: "Arial, sans-serif",
    background: `
      radial-gradient(circle at 10% 20%, rgba(255, 182, 193, 0.25) 0px, transparent 120px),
      radial-gradient(circle at 80% 30%, rgba(255, 105, 180, 0.2) 0px, transparent 140px),
      radial-gradient(circle at 30% 80%, rgba(255, 192, 203, 0.25) 0px, transparent 120px),
      radial-gradient(circle at 90% 90%, rgba(255, 182, 193, 0.2) 0px, transparent 140px),
      linear-gradient(180deg, #f8fff7 0%, #fff4f7 100%)
    `,
    minHeight: "100vh",
    padding: 16,
    color: "#16351f",
  },
  wrap: { maxWidth: 1500, margin: "0 auto" },
  card: {
    background: "#ffffff",
    border: "1px solid #d9ead7",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    boxShadow: "0 8px 24px rgba(22, 53, 31, 0.06)",
  },
  row: { display: "flex", gap: 12, flexWrap: "wrap" },
  button: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #2f6b3d",
    background: "#2f6b3d",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
  buttonAlt: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #e9b7c7",
    background: "#fff5f8",
    color: "#8d3453",
    cursor: "pointer",
    fontWeight: 700,
  },
  input: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #d8c4cb",
    minWidth: 220,
    background: "#fffdfd",
  },
  smallInput: {
    width: 54,
    padding: 6,
    textAlign: "center",
    borderRadius: 8,
    border: "1px solid #d8c4cb",
    background: "#fffdfd",
  },
  tableWrap: {
    overflowX: "auto",
    border: "1px solid #e6d8dd",
    borderRadius: 16,
    background: "#fff",
  },
  table: { borderCollapse: "collapse", width: "100%", minWidth: 1150 },
  stickyCol1: { position: "sticky", left: 0, background: "#fff", zIndex: 2 },
  stickyCol2: { position: "sticky", left: 60, background: "#fff", zIndex: 2 },
  stickyCol3: { position: "sticky", left: 120, background: "#fff", zIndex: 2 },
  th: {
    padding: 8,
    borderBottom: "1px solid #e6d8dd",
    background: "#f7e7ed",
    textAlign: "center",
    whiteSpace: "nowrap",
    fontSize: 13,
    color: "#7b2d4b",
  },
  td: {
    padding: 8,
    borderBottom: "1px solid #eef2ea",
    textAlign: "center",
    fontSize: 13,
  },
  tab: (active) => ({
    padding: "10px 14px",
    borderRadius: 12,
    border: active ? "1px solid #2f6b3d" : "1px solid #e3c5cf",
    background: active ? "#2f6b3d" : "#fff7fa",
    color: active ? "#fff" : "#8d3453",
    cursor: "pointer",
    fontWeight: 700,
  }),
  scoreBox: {
    border: "1px solid #e6d8dd",
    borderRadius: 12,
    padding: 12,
    background: "linear-gradient(180deg, #f8fff7 0%, #fff7fa 100%)",
    minWidth: 220,
  },
  bigValue: { fontSize: 24, fontWeight: 700, marginTop: 6 },
};

export default function App() {
  const [scores, setScores] = useState(createInitialScores);
  const [activeTab, setActiveTab] = useState(matches[0].id);
  const [view, setView] = useState("match");
  const [confirmResetMatchId, setConfirmResetMatchId] = useState(null);
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
      } catch {
        // ignore bad cache
      }
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
          {
            session_id: sessionId,
            scores: createInitialScores(),
            updated_at: new Date().toISOString(),
          },
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

  const sideBet = useMemo(() => computeSideBet(scores), [scores]);
  const results = useMemo(() => computeResults(scores), [scores]);
  const payouts = useMemo(() => computePayouts(summaries, sideBet), [summaries, sideBet]);

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
    setConfirmResetMatchId(null);
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
        <div style={styles.card}>
          <h1 style={{ marginTop: 0, color: "#1f5c32" }}>Shangri-La Match Tracker</h1>
          <p style={{ color: "#7b2d4b" }}>
            Masters weekend edition — enter scores hole-by-hole and share the same session link with the group.
          </p>
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
              style={styles.tab(view === "match" && activeTab === match.id)}
              onClick={() => {
                setActiveTab(match.id);
                setView("match");
              }}
            >
              {match.title}
            </button>
          ))}
          <button style={styles.tab(view === "sideBet")} onClick={() => setView("sideBet")}>Side Bet</button>
          <button style={styles.tab(view === "results")} onClick={() => setView("results")}>Results</button>
          <button style={styles.tab(view === "money")} onClick={() => setView("money")}>Money</button>
        </div>

        {view === "sideBet" && (
          <div style={styles.card}>
            <h2 style={{ marginTop: 0 }}>{SIDE_BET.name}</h2>
            <div style={{ ...styles.row, marginBottom: 16 }}>
              <div style={styles.scoreBox}>
                <div style={{ fontWeight: 700 }}>{SIDE_BET.teamAName}</div>
                <div>Total best-ball score: <strong>{sideBet.teamATotal}</strong></div>
                <div>Holes won: <strong>{sideBet.teamAHolesWon}</strong></div>
              </div>
              <div style={styles.scoreBox}>
                <div style={{ fontWeight: 700 }}>{SIDE_BET.teamBName}</div>
                <div>Total best-ball score: <strong>{sideBet.teamBTotal}</strong></div>
                <div>Holes won: <strong>{sideBet.teamBHolesWon}</strong></div>
              </div>
              <div style={styles.scoreBox}>
                <div style={{ fontWeight: 700 }}>Tied holes</div>
                <div style={styles.bigValue}><strong>{sideBet.ties}</strong></div>
              </div>
            </div>

            <div style={styles.tableWrap}>
              <table style={{ ...styles.table, minWidth: 800 }}>
                <thead>
                  <tr>
                    <th style={styles.th}>Match</th>
                    <th style={styles.th}>Hole</th>
                    <th style={styles.th}>{SIDE_BET.teamAName}</th>
                    <th style={styles.th}>{SIDE_BET.teamBName}</th>
                    <th style={styles.th}>Winner</th>
                  </tr>
                </thead>
                <tbody>
                  {sideBet.holes.map((item) => (
                    <tr key={item.key}>
                      <td style={styles.td}>{item.matchTitle}</td>
                      <td style={styles.td}>{item.holeLabel}</td>
                      <td style={styles.td}>{item.teamAScore ?? "-"}</td>
                      <td style={styles.td}>{item.teamBScore ?? "-"}</td>
                      <td style={styles.td}>{item.winner || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === "results" && (
          <div style={styles.card}>
            <h2 style={{ marginTop: 0 }}>Results</h2>
            <div style={{ ...styles.row, marginBottom: 16 }}>
              <div style={styles.scoreBox}>
                <div style={{ fontWeight: 700 }}>Highest score on a hole</div>
                {results.highestHole ? (
                  <>
                    <div>{results.highestHole.player} • {results.highestHole.matchTitle}</div>
                    <div>{results.highestHole.course} {results.highestHole.hole}</div>
                    <div style={styles.bigValue}>{results.highestHole.score}</div>
                  </>
                ) : <div>No scores yet</div>}
              </div>
              <div style={styles.scoreBox}>
                <div style={{ fontWeight: 700 }}>Lowest hole vs par</div>
                {results.lowestHoleToPar ? (
                  <>
                    <div>{results.lowestHoleToPar.player} • {results.lowestHoleToPar.matchTitle}</div>
                    <div>{results.lowestHoleToPar.course} {results.lowestHoleToPar.hole}</div>
                    <div style={styles.bigValue}>{formatToPar(results.lowestHoleToPar.toPar)}</div>
                  </>
                ) : <div>No scores yet</div>}
              </div>
              <div style={styles.scoreBox}>
                <div style={{ fontWeight: 700 }}>Highest round vs par</div>
                {results.highestRoundToPar ? (
                  <>
                    <div>{results.highestRoundToPar.player} • {results.highestRoundToPar.matchTitle}</div>
                    <div style={styles.bigValue}>{formatToPar(results.highestRoundToPar.toPar)}</div>
                    <div>Total {results.highestRoundToPar.total}</div>
                  </>
                ) : <div>No completed rounds yet</div>}
              </div>
              <div style={styles.scoreBox}>
                <div style={{ fontWeight: 700 }}>Lowest round vs par</div>
                {results.lowestRoundToPar ? (
                  <>
                    <div>{results.lowestRoundToPar.player} • {results.lowestRoundToPar.matchTitle}</div>
                    <div style={styles.bigValue}>{formatToPar(results.lowestRoundToPar.toPar)}</div>
                    <div>Total {results.lowestRoundToPar.total}</div>
                  </>
                ) : <div>No completed rounds yet</div>}
              </div>
            </div>

            <div style={styles.tableWrap}>
              <table style={{ ...styles.table, minWidth: 700 }}>
                <thead>
                  <tr>
                    <th style={styles.th}>Match</th>
                    <th style={styles.th}>Player</th>
                    <th style={styles.th}>Total</th>
                    <th style={styles.th}>Par</th>
                    <th style={styles.th}>To Par</th>
                  </tr>
                </thead>
                <tbody>
                  {results.roundResults.map((round, index) => (
                    <tr key={`${round.matchTitle}-${round.player}-${index}`}>
                      <td style={styles.td}>{round.matchTitle}</td>
                      <td style={styles.td}>{round.player}</td>
                      <td style={styles.td}>{round.total}</td>
                      <td style={styles.td}>{round.parTotal}</td>
                      <td style={styles.td}>{formatToPar(round.toPar)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === "money" && (
          <div style={styles.card}>
            <h2 style={{ marginTop: 0 }}>Money</h2>
            <div style={{ marginBottom: 12, color: "#7b2d4b" }}>
              Match stake: ${MATCH_STAKE_PER_PERSON} per person per match • Side bet: ${SIDE_BET_STAKE_PER_PERSON} per person
            </div>
            <div style={{ ...styles.row, marginBottom: 16 }}>
              {payouts.netPayouts.length ? payouts.netPayouts.map((item) => (
                <div key={item.player} style={styles.scoreBox}>
                  <div style={{ fontWeight: 700 }}>{item.player}</div>
                  <div>{item.amount > 0 ? "Should receive" : "Should pay"}</div>
                  <div style={styles.bigValue}>{formatMoney(item.amount)}</div>
                </div>
              )) : (
                <div style={styles.scoreBox}>No completed payouts yet</div>
              )}
            </div>

            <div style={styles.tableWrap}>
              <table style={{ ...styles.table, minWidth: 850 }}>
                <thead>
                  <tr>
                    <th style={styles.th}>Bet</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Winners</th>
                    <th style={styles.th}>Losers</th>
                    <th style={styles.th}>Amount per person</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.matchSettlements.map((item, index) => (
                    <tr key={`${item.matchTitle}-${index}`}>
                      <td style={styles.td}>{item.matchTitle}</td>
                      <td style={styles.td}>{item.status}</td>
                      <td style={styles.td}>{item.winners ? item.winners.join(", ") : "-"}</td>
                      <td style={styles.td}>{item.losers ? item.losers.join(", ") : "-"}</td>
                      <td style={styles.td}>{item.amountPerPerson ? `$${item.amountPerPerson}` : "-"}</td>
                    </tr>
                  ))}
                  <tr>
                    <td style={styles.td}>Side Bet</td>
                    <td style={styles.td}>{payouts.sideBetSettlement.status}</td>
                    <td style={styles.td}>{payouts.sideBetSettlement.winners ? payouts.sideBetSettlement.winners.join(", ") : "-"}</td>
                    <td style={styles.td}>{payouts.sideBetSettlement.losers ? payouts.sideBetSettlement.losers.join(", ") : "-"}</td>
                    <td style={styles.td}>{payouts.sideBetSettlement.amountPerPerson ? `$${payouts.sideBetSettlement.amountPerPerson}` : "-"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === "match" && (
          <div style={styles.card}>
            <h2 style={{ marginTop: 0 }}>{activeMatch.title}</h2>
            <div style={{ marginBottom: 12 }}>{activeMatch.subtitle}</div>
            <div style={{ ...styles.row, marginBottom: 16 }}>
              {sortedTeams.map((team) => (
                <div key={team.name} style={styles.scoreBox}>
                  <div style={{ fontWeight: 700 }}>{team.name}</div>
                  <div>{team.players.join(" • ")}</div>
                  <div style={{ marginTop: 6 }}>Total: <strong>{team.total}</strong></div>
                  <div>To par: <strong>{formatToPar(team.toPar)}</strong></div>
                  <div>Completed holes: {team.completedHoles}/{activeMatch.holes.length}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 12 }}>
              {confirmResetMatchId === activeMatch.id ? (
                <div style={{ ...styles.row, alignItems: "center" }}>
                  <div style={{ color: "#8d3453", fontWeight: 700 }}>
                    Confirm reset? This clears all scores for this match.
                  </div>
                  <button style={styles.button} onClick={() => resetMatch(activeMatch.id)}>
                    Yes, reset match
                  </button>
                  <button style={styles.buttonAlt} onClick={() => setConfirmResetMatchId(null)}>
                    Cancel
                  </button>
                </div>
              ) : (
                <button style={styles.buttonAlt} onClick={() => setConfirmResetMatchId(activeMatch.id)}>
                  Reset this match
                </button>
              )}
            </div>

            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={{ ...styles.th, ...styles.stickyCol1 }}>Hole</th>
                    <th style={{ ...styles.th, ...styles.stickyCol2 }}>Par</th>
                    <th style={{ ...styles.th, ...styles.stickyCol3 }}>Course</th>
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
                    const teamScores = activeMatch.teams.map((team) => scoreTeamForHole(activeMatch, team, holeScores));

                    return (
                      <tr key={`${activeMatch.id}-${holeIndex}`}>
                        <td style={{ ...styles.td, ...styles.stickyCol1 }}>{hole.hole}</td>
                        <td style={{ ...styles.td, ...styles.stickyCol2 }}>{hole.par}</td>
                        <td style={{ ...styles.td, ...styles.stickyCol3 }}>{hole.course}</td>
                        {activeMatch.players.map((player) => (
                          <td key={`${holeIndex}-${player}`} style={styles.td}>
                            <input
                              style={styles.smallInput}
                              inputMode="numeric"
                              value={holeScores[player] ?? ""}
                              onChange={(e) => updateScore(activeMatch.id, holeIndex, player, e.target.value)}
                            />
                          </td>
                        ))}
                        {activeMatch.teams.map((team, i) => (
                          <td key={`${holeIndex}-${team.name}`} style={styles.td}>{teamScores[i] ?? "-"}</td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td style={{ ...styles.td, ...styles.stickyCol1, fontWeight: 700 }}>Totals</td>
                    <td style={{ ...styles.td, ...styles.stickyCol2, fontWeight: 700 }}>
                      {activeMatch.holes.reduce((sum, hole) => sum + hole.par, 0)}
                    </td>
                    <td style={{ ...styles.td, ...styles.stickyCol3, fontWeight: 700 }}>-</td>
                    {activeSummary.playerTotals.map((item) => (
                      <td key={item.player} style={{ ...styles.td, fontWeight: 700 }}>
                        {item.entered ? `${item.total} (${formatToPar(item.toPar)})` : "-"}
                      </td>
                    ))}
                    {activeSummary.teamTotals.map((team) => (
                      <td key={team.name} style={{ ...styles.td, fontWeight: 700 }}>
                        {team.completedHoles ? `${team.total} (${formatToPar(team.toPar)})` : "-"}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
