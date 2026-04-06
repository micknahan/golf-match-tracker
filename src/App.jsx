import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Trophy, Target, Users, RotateCcw, Wifi, WifiOff, Copy, Cloud, RefreshCw } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const STORAGE_KEY = "shangri-la-matches-app-v2";

/**
 * Multi-user setup
 *
 * To make this truly live across multiple phones, replace these two values with your
 * Supabase project URL and anon key. Once set, all users opening the same session ID
 * will see and update the same scorebook in real time.
 *
 * If these are left blank, the app gracefully falls back to local-only mode.
 */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const SCORE_TABLE = "golf_match_sessions";
const SCORE_CHANNEL = "golf-live-scores";

const hasSupabaseConfig = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
const supabase = hasSupabaseConfig ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const matches = [
  {
    id: "match1",
    title: "Day 1 Match",
    subtitle:
      "Heritage / Legends • 18 holes • 4-man teams • Best 2 scores count per hole • Tee times 12:30 and 12:40",
    scoreType: "best2of4",
    players: ["Jeff", "Cauley", "Dexter", "Cliff", "Cody", "Toal", "Mahan", "Wesley"],
    teams: [
      { name: "Team Assholes", players: ["Jeff", "Cauley", "Dexter", "Cliff"] },
      { name: "Team Dickheads", players: ["Cody", "Toal", "Mahan", "Wesley"] },
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
      "Battlefield • 18 holes • 2-man teams • Best 1 score counts per hole • Tee times 10:20 and 10:30",
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
    subtitle:
      "Champions • 9 holes • 4-man teams • Best 2 scores count per hole • Tee times 2:40 and 2:50",
    scoreType: "best2of4",
    players: ["Cody", "Cliff", "Mahan", "Dexter", "Jeff", "Toal", "Cauley", "Wesley"],
    teams: [
      { name: "Team SOBs", players: ["Cody", "Cliff", "Mahan", "Dexter"] },
      { name: "Team MF-ers", players: ["Jeff", "Toal", "Cauley", "Wesley"] },
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
      const holePar = getParForTeam(match, hole);
      parTotal += holePar;
      if (holeScore !== null) {
        total += holeScore;
        completedHoles += 1;
      }
    });

    return { ...team, total, completedHoles, parTotal, toPar: total - parTotal };
  });

  const playerTotals = match.players.map((player) => {
    let total = 0;
    let entered = 0;
    match.holes.forEach((_, index) => {
      const value = toNumber(scorebook[index]?.[player]);
      if (value !== null) {
        total += value;
        entered += 1;
      }
    });
    return { player, total, entered };
  });

  const completedByHole = match.holes.filter((_, index) => {
    const scores = scorebook[index] || {};
    return match.players.every((player) => toNumber(scores[player]) !== null);
  }).length;

  return { teamTotals, playerTotals, completedByHole };
}

function formatToPar(value) {
  if (value === 0) return "E";
  return value > 0 ? `+${value}` : `${value}`;
}

function leaderBadge(index) {
  if (index === 0) return <Badge className="rounded-full">Leader</Badge>;
  if (index === 1) return <Badge variant="secondary" className="rounded-full">2nd</Badge>;
  if (index === 2) return <Badge variant="outline" className="rounded-full">3rd</Badge>;
  return null;
}

function deepMergeScores(base, incoming) {
  const merged = structuredClone(base);
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
  if (typeof window === "undefined") return "";
  const url = new URL(window.location.href);
  url.searchParams.set("session", sessionId);
  return url.toString();
}

export default function ShangriLaMatchesApp() {
  const [scores, setScores] = useState(createInitialScores);
  const [activeTab, setActiveTab] = useState(matches[0].id);
  const [sessionId, setSessionId] = useState("shangri-la-2026");
  const [sessionInput, setSessionInput] = useState("shangri-la-2026");
  const [syncStatus, setSyncStatus] = useState(hasSupabaseConfig ? "Connecting…" : "Local only");
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

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
        // ignore invalid cache
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
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        sessionId,
        scores,
        lastSavedAt: Date.now(),
      }),
    );
  }, [scores, sessionId, isHydrated]);

  useEffect(() => {
    if (!isHydrated || !hasSupabaseConfig || !supabase || !sessionId) return;

    let isMounted = true;
    let channel;

    const loadSession = async () => {
      setSyncStatus("Loading shared session…");
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
        const payload = { session_id: sessionId, scores, updated_at: new Date().toISOString() };
        await supabase.from(SCORE_TABLE).upsert(payload, { onConflict: "session_id" });
      }

      setSyncStatus("Live sync connected");

      channel = supabase
        .channel(`${SCORE_CHANNEL}-${sessionId}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: SCORE_TABLE, filter: `session_id=eq.${sessionId}` },
          (payload) => {
            if (!isMounted) return;
            if (payload.new?.scores) {
              setScores((current) => deepMergeScores(current, payload.new.scores));
              setLastSavedAt(payload.new.updated_at || null);
              setSyncStatus("Live sync connected");
            }
          },
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: SCORE_TABLE, filter: `session_id=eq.${sessionId}` },
          (payload) => {
            if (!isMounted) return;
            if (payload.new?.scores) {
              setScores((current) => deepMergeScores(current, payload.new.scores));
              setLastSavedAt(payload.new.updated_at || null);
            }
          },
        )
        .subscribe((status) => {
          if (!isMounted) return;
          if (status === "SUBSCRIBED") setSyncStatus("Live sync connected");
        });
    };

    loadSession();

    return () => {
      isMounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [sessionId, isHydrated]);

  const pushSharedScores = async (nextScores) => {
    if (!hasSupabaseConfig || !supabase || !sessionId) return;

    setIsSyncing(true);
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
    setIsSyncing(false);
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
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 1600);
    } catch {
      setShareCopied(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Shangri-La Match Tracker</h1>
            <p className="mt-1 text-sm text-slate-600">
              Enter scores hole-by-hole and track all 3 matches live. Multiple scorekeepers are supported when a shared session is connected.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="w-fit rounded-full px-3 py-1 text-xs">
              {hasSupabaseConfig ? "Multi-user ready" : "Local mode fallback"}
            </Badge>
            <Badge variant="outline" className="w-fit rounded-full px-3 py-1 text-xs">
              {isSyncing ? <RefreshCw className="mr-1 h-3 w-3 animate-spin" /> : <Cloud className="mr-1 h-3 w-3" />}
              {syncStatus}
            </Badge>
          </div>
        </div>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Shared scoring session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[1fr,auto] lg:items-end">
              <div className="grid gap-2">
                <Label htmlFor="session-id">Session ID</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="session-id"
                    value={sessionInput}
                    onChange={(e) => setSessionInput(e.target.value)}
                    className="max-w-md rounded-xl"
                    placeholder="Enter a shared session name"
                  />
                  <Button onClick={applySession} className="rounded-xl">Join / create session</Button>
                  <Button variant="outline" onClick={copyShareLink} className="rounded-xl">
                    <Copy className="mr-2 h-4 w-4" /> {shareCopied ? "Copied" : "Copy share link"}
                  </Button>
                </div>
                <div className="text-xs text-slate-500">
                  Everyone should open the same session link or use the same session ID.
                  {lastSavedAt ? ` Last shared save: ${new Date(lastSavedAt).toLocaleString()}.` : ""}
                </div>
              </div>
              <div className="rounded-2xl border bg-slate-50 px-4 py-3 text-sm">
                <div className="font-medium">Current session</div>
                <div className="mt-1 text-slate-600">{sessionId}</div>
              </div>
            </div>

            {!hasSupabaseConfig && (
              <Alert className="rounded-2xl border-amber-300 bg-amber-50">
                <WifiOff className="h-4 w-4" />
                <AlertTitle>Multi-user sync needs one small setup step</AlertTitle>
                <AlertDescription className="space-y-2">
                  <div>
                    The app is now structured for shared live scoring, but it still needs a real-time backend connection to sync across multiple devices.
                  </div>
                  <div>
                    Fastest route: create a free Supabase project, create a table named <span className="font-mono">{SCORE_TABLE}</span> with columns <span className="font-mono">session_id</span> (text, unique), <span className="font-mono">scores</span> (jsonb), and <span className="font-mono">updated_at</span> (timestamptz), then paste your Supabase URL and anon key into the two constants at the top of this file.
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {hasSupabaseConfig && (
              <Alert className="rounded-2xl border-emerald-300 bg-emerald-50">
                <Wifi className="h-4 w-4" />
                <AlertTitle>Live sync enabled</AlertTitle>
                <AlertDescription>
                  Anyone using this same session will see updates as scores are entered.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          {matches.map((match) => {
            const summary = summaries[match.id];
            const sortedTeams = [...summary.teamTotals].sort((a, b) => a.total - b.total || b.completedHoles - a.completedHoles);
            return (
              <Card key={match.id} className="rounded-2xl shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{match.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="text-slate-600">{match.subtitle}</div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Target className="h-4 w-4" />
                    <span>
                      {summary.completedByHole} / {match.holes.length} holes fully entered
                    </span>
                  </div>
                  <div className="rounded-xl bg-slate-100 p-3">
                    <div className="mb-2 flex items-center gap-2 font-medium">
                      <Trophy className="h-4 w-4" /> Live standings
                    </div>
                    <div className="space-y-2">
                      {sortedTeams.map((team, index) => (
                        <div key={team.name} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-medium">{team.name}</span>
                              {leaderBadge(index)}
                            </div>
                            <div className="text-xs text-slate-500">{team.completedHoles} holes complete</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{team.total || 0}</div>
                            <div className="text-xs text-slate-500">{formatToPar(team.toPar)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid h-auto grid-cols-1 gap-2 rounded-2xl bg-transparent p-0 md:grid-cols-3">
            {matches.map((match) => (
              <TabsTrigger
                key={match.id}
                value={match.id}
                className="rounded-2xl border bg-white px-4 py-3 text-sm shadow-sm data-[state=active]:border-slate-900 data-[state=active]:bg-slate-900 data-[state=active]:text-white"
              >
                {match.title}
              </TabsTrigger>
            ))}
          </TabsList>

          {matches.map((match) => {
            const summary = summaries[match.id];
            const sortedTeams = [...summary.teamTotals].sort((a, b) => a.total - b.total || b.completedHoles - a.completedHoles);
            return (
              <TabsContent key={match.id} value={match.id} className="space-y-4">
                <Card className="rounded-2xl shadow-sm">
                  <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <CardTitle className="text-2xl">{match.title}</CardTitle>
                      <p className="mt-2 text-sm text-slate-600">{match.subtitle}</p>
                    </div>
                    <Button variant="outline" className="rounded-xl" onClick={() => resetMatch(match.id)}>
                      <RotateCcw className="mr-2 h-4 w-4" /> Reset this match
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
                      <div className="overflow-x-auto rounded-2xl border bg-white">
                        <table className="min-w-full text-sm">
                          <thead className="bg-slate-100">
                            <tr>
                              <th className="sticky left-0 z-10 border-b bg-slate-100 px-3 py-2 text-left">Hole</th>
                              <th className="border-b px-3 py-2 text-left">Par</th>
                              <th className="border-b px-3 py-2 text-left">Course</th>
                              {match.players.map((player) => (
                                <th key={player} className="border-b px-3 py-2 text-center whitespace-nowrap">{player}</th>
                              ))}
                              {match.teams.map((team) => (
                                <th key={team.name} className="border-b px-3 py-2 text-center whitespace-nowrap">{team.name}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {match.holes.map((hole, holeIndex) => {
                              const holeScores = scores[match.id]?.[holeIndex] || {};
                              const teamScores = match.teams.map((team) => scoreTeamForHole(match, team, holeScores));
                              const bestTeamScore = teamScores.filter((v) => v !== null).sort((a, b) => a - b)[0] ?? null;
                              return (
                                <tr key={`${match.id}-${holeIndex}`} className="odd:bg-white even:bg-slate-50">
                                  <td className="sticky left-0 z-10 border-b bg-inherit px-3 py-2 font-medium">{hole.hole}</td>
                                  <td className="border-b px-3 py-2">{hole.par}</td>
                                  <td className="border-b px-3 py-2">{hole.course}</td>
                                  {match.players.map((player) => (
                                    <td key={`${holeIndex}-${player}`} className="border-b px-2 py-1">
                                      <Input
                                        inputMode="numeric"
                                        className="h-9 w-16 rounded-lg text-center"
                                        value={holeScores[player] ?? ""}
                                        onChange={(e) => updateScore(match.id, holeIndex, player, e.target.value)}
                                      />
                                    </td>
                                  ))}
                                  {match.teams.map((team, teamIndex) => {
                                    const teamScore = teamScores[teamIndex];
                                    const isLeader = teamScore !== null && bestTeamScore !== null && teamScore === bestTeamScore;
                                    return (
                                      <td key={`${holeIndex}-${team.name}`} className="border-b px-3 py-2 text-center">
                                        <div className={`inline-flex min-w-12 items-center justify-center rounded-lg px-2 py-1 font-semibold ${
                                          isLeader ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"
                                        }`}>
                                          {teamScore ?? "—"}
                                        </div>
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="bg-slate-100 font-semibold">
                              <td className="sticky left-0 z-10 bg-slate-100 px-3 py-2">Total</td>
                              <td className="px-3 py-2">{match.holes.reduce((sum, hole) => sum + hole.par, 0)}</td>
                              <td className="px-3 py-2">—</td>
                              {summary.playerTotals.map((item) => (
                                <td key={`${match.id}-${item.player}-total`} className="px-3 py-2 text-center">
                                  {item.entered ? item.total : "—"}
                                </td>
                              ))}
                              {summary.teamTotals.map((team) => (
                                <td key={`${match.id}-${team.name}-total`} className="px-3 py-2 text-center">
                                  <div>{team.completedHoles ? team.total : "—"}</div>
                                  <div className="text-xs font-normal text-slate-500">{formatToPar(team.toPar)}</div>
                                </td>
                              ))}
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      <div className="space-y-4">
                        <Card className="rounded-2xl border shadow-none">
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <Users className="h-5 w-5" /> Team leaderboard
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {sortedTeams.map((team, index) => (
                              <div key={`${match.id}-${team.name}-leaderboard`} className="rounded-xl border p-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <div className="font-semibold">{team.name}</div>
                                      {leaderBadge(index)}
                                    </div>
                                    <div className="mt-1 text-xs text-slate-500">{team.players.join(" • ")}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xl font-bold">{team.total}</div>
                                    <div className="text-xs text-slate-500">{formatToPar(team.toPar)}</div>
                                  </div>
                                </div>
                                <Separator className="my-3" />
                                <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                                  <div>
                                    <div className="font-medium text-slate-800">Completed holes</div>
                                    <div>{team.completedHoles} / {match.holes.length}</div>
                                  </div>
                                  <div>
                                    <div className="font-medium text-slate-800">Team par</div>
                                    <div>{team.parTotal}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>

                        <Card className="rounded-2xl border shadow-none">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Player totals</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            {summary.playerTotals.map((item) => (
                              <div key={`${match.id}-${item.player}-player`} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                                <div>
                                  <div className="font-medium">{item.player}</div>
                                  <div className="text-xs text-slate-500">{item.entered} holes entered</div>
                                </div>
                                <div className="text-right font-semibold">{item.entered ? item.total : "—"}</div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
}
