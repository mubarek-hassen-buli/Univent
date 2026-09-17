"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Users,
  Volume2,
  VolumeX,
  Keyboard,
  Clock,
  Search,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { QrScanner } from "@/components/scanner/qr-scanner";
import {
  useAttendanceStats,
  useEventRoster,
  useScanTicket,
  type ScanResultResponse,
} from "@/lib/query/attendance.query";
import { feedback } from "@/lib/utils/sound";
import { getPusherClient } from "@/lib/pusher/pusher-client";

interface ScannerPageProps {
  params: Promise<{
    id: string;
  }>;
}

interface ScanNotification {
  type: "success" | "error";
  studentName?: string;
  studentId?: string | null;
  department?: string | null;
  registrationCode?: string;
  scannedAt?: string;
  message: string;
}

export default function EventScannerPage({ params }: ScannerPageProps) {
  const { id: eventId } = use(params);

  // Queries & Mutations
  const { data: stats, isLoading: isStatsLoading, refetch: refetchStats } =
    useAttendanceStats(eventId);
  const { data: roster = [], isLoading: isRosterLoading, refetch: refetchRoster } =
    useEventRoster(eventId);
  const scanMutation = useScanTicket();

  // Local state
  const [manualCode, setManualCode] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastNotification, setLastNotification] = useState<ScanNotification | null>(null);
  const [activeTab, setActiveTab] = useState<"feed" | "roster">("feed");
  const [rosterSearch, setRosterSearch] = useState("");
  const [rosterFilter, setRosterFilter] = useState<"all" | "pending" | "attended">("all");

  // Real-time Pusher subscription
  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return;

    const channelName = `event-${eventId}`;
    const channel = pusher.subscribe(channelName);

    channel.bind("attendance:checked-in", (data: ScanResultResponse) => {
      // Re-fetch stats and roster to update live counters
      refetchStats();
      refetchRoster();

      if (soundEnabled) {
        feedback.playSuccessTone();
        feedback.triggerHaptic(true);
      }
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
    };
  }, [eventId, refetchStats, refetchRoster, soundEnabled]);

  // Handle QR Scan
  const handleQrScan = async (qrHash: string) => {
    if (scanMutation.isPending) return;

    try {
      const result = await scanMutation.mutateAsync({
        eventId,
        qrHash,
      });

      if (soundEnabled) {
        feedback.playSuccessTone();
        feedback.triggerHaptic(true);
      }

      setLastNotification({
        type: "success",
        studentName: result.student.name,
        studentId: result.student.studentId,
        department: result.student.department,
        registrationCode: result.attendance.registrationCode,
        scannedAt: result.attendance.scannedAt,
        message: `Verified entrance for ${result.student.name}`,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (soundEnabled) {
        feedback.playErrorTone();
        feedback.triggerHaptic(false);
      }

      const errorMessage =
        err.response?.data?.message ||
        "Ticket verification failed. Please check registration status.";

      setLastNotification({
        type: "error",
        message: errorMessage,
      });
    }
  };

  // Handle Manual Code Check-In
  const handleManualCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim() || scanMutation.isPending) return;

    try {
      const result = await scanMutation.mutateAsync({
        eventId,
        registrationCode: manualCode.trim().toUpperCase(),
      });

      if (soundEnabled) {
        feedback.playSuccessTone();
        feedback.triggerHaptic(true);
      }

      setLastNotification({
        type: "success",
        studentName: result.student.name,
        studentId: result.student.studentId,
        department: result.student.department,
        registrationCode: result.attendance.registrationCode,
        scannedAt: result.attendance.scannedAt,
        message: `Verified entrance for ${result.student.name}`,
      });
      setManualCode("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (soundEnabled) {
        feedback.playErrorTone();
        feedback.triggerHaptic(false);
      }

      const errorMessage =
        err.response?.data?.message ||
        "Code check-in failed. Please verify the registration code.";

      setLastNotification({
        type: "error",
        message: errorMessage,
      });
    }
  };

  // Direct manual check-in from roster table
  const handleRosterRowCheckIn = async (code: string) => {
    try {
      const result = await scanMutation.mutateAsync({
        eventId,
        registrationCode: code,
      });

      if (soundEnabled) {
        feedback.playSuccessTone();
        feedback.triggerHaptic(true);
      }

      setLastNotification({
        type: "success",
        studentName: result.student.name,
        studentId: result.student.studentId,
        department: result.student.department,
        registrationCode: result.attendance.registrationCode,
        scannedAt: result.attendance.scannedAt,
        message: `Verified entrance for ${result.student.name}`,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (soundEnabled) {
        feedback.playErrorTone();
        feedback.triggerHaptic(false);
      }

      const errorMessage =
        err.response?.data?.message || "Check-in failed for this attendee.";
      setLastNotification({
        type: "error",
        message: errorMessage,
      });
    }
  };

  // Filter roster
  const filteredRoster = roster.filter((item) => {
    if (rosterFilter === "pending" && item.hasAttended) return false;
    if (rosterFilter === "attended" && !item.hasAttended) return false;

    if (rosterSearch.trim()) {
      const q = rosterSearch.toLowerCase();
      const nameMatch = item.student.name.toLowerCase().includes(q);
      const codeMatch = item.registrationCode.toLowerCase().includes(q);
      const studentIdMatch = (item.student.studentId || "").toLowerCase().includes(q);
      return nameMatch || codeMatch || studentIdMatch;
    }
    return true;
  });

  const checkedInCount = stats?.checkedInCount ?? 0;
  const registeredCount = stats?.registeredCount ?? 0;
  const attendanceRate = stats?.attendanceRate ?? 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/organizer/events"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Events
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <Radio className="h-3 w-3 animate-pulse" />
              Live Check-In Gate
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            {stats?.eventTitle || "Event Attendance Scanner"}
          </h1>
        </div>

        {/* Audio Toggle */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={soundEnabled ? "secondary" : "outline"}
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="gap-1.5 text-xs"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="h-3.5 w-3.5 text-primary" />
                Sound Enabled
              </>
            ) : (
              <>
                <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />
                Muted
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Grid: Scanner (Left) vs Real-Time Telemetry (Right) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Live Camera Scanner & Manual Input (5 Cols) */}
        <div className="space-y-6 lg:col-span-5">
          {/* Camera Card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Optical QR Scanner
              </h2>
              <span className="text-xs text-muted-foreground">Aim at student pass</span>
            </div>

            <QrScanner
              onScan={handleQrScan}
              isProcessing={scanMutation.isPending}
            />

            {/* Manual Code Fallback */}
            <div className="mt-6 border-t border-border pt-4">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Keyboard className="h-3.5 w-3.5" />
                <span>Manual Code Check-In</span>
              </div>
              <form onSubmit={handleManualCheckIn} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. UNIV-A1B2C3D4"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="h-9 flex-1 rounded-md border border-input bg-background px-3 font-mono text-xs uppercase placeholder:normal-case placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!manualCode.trim() || scanMutation.isPending}
                  className="gap-1.5 text-xs"
                >
                  {scanMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "Check In"
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Real-time Scan Result Toast/Card */}
          {lastNotification && (
            <div
              className={`animate-in fade-in slide-in-from-top-3 rounded-2xl border p-5 shadow-md ${
                lastNotification.type === "success"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100"
                  : "border-destructive/30 bg-destructive/10 text-destructive"
              }`}
            >
              <div className="flex items-start gap-3">
                {lastNotification.type === "success" ? (
                  <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <XCircle className="h-6 w-6 shrink-0 text-destructive" />
                )}

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {lastNotification.type === "success"
                        ? "Check-In Approved"
                        : "Check-In Rejected"}
                    </span>
                    <button
                      onClick={() => setLastNotification(null)}
                      className="text-xs opacity-60 hover:opacity-100"
                    >
                      Dismiss
                    </button>
                  </div>

                  <p className="text-sm font-semibold">{lastNotification.message}</p>

                  {lastNotification.type === "success" && (
                    <div className="mt-2 grid grid-cols-2 gap-2 border-t border-emerald-500/20 pt-2 text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase">
                          Student ID
                        </span>
                        <p className="font-mono font-semibold">
                          {lastNotification.studentId || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase">
                          Department
                        </span>
                        <p className="truncate font-semibold">
                          {lastNotification.department || "General"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Telemetry, Feed & Roster (7 Cols) */}
        <div className="space-y-6 lg:col-span-7">
          {/* Key Metrics Bar */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4">
              <span className="text-xs text-muted-foreground uppercase">
                Checked In
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">
                  {isStatsLoading ? "..." : checkedInCount}
                </span>
                <span className="text-xs text-muted-foreground">
                  of {registeredCount} registered
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <span className="text-xs text-muted-foreground uppercase">
                Turnout Rate
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-primary">
                  {isStatsLoading ? "..." : `${attendanceRate}%`}
                </span>
              </div>
              {/* Turnout Progress Bar */}
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${Math.min(attendanceRate, 100)}%` }}
                />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <span className="text-xs text-muted-foreground uppercase">
                Awaiting Arrival
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">
                  {isStatsLoading
                    ? "..."
                    : Math.max(registeredCount - checkedInCount, 0)}
                </span>
                <span className="text-xs text-muted-foreground">remaining</span>
              </div>
            </div>
          </div>

          {/* Feed / Roster Switcher Container */}
          <div className="rounded-2xl border border-border bg-card shadow-sm">
            {/* Tab Headers */}
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <div className="flex items-center gap-2">
                <Button
                  size="xs"
                  variant={activeTab === "feed" ? "secondary" : "ghost"}
                  onClick={() => setActiveTab("feed")}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Live Activity Feed
                </Button>
                <Button
                  size="xs"
                  variant={activeTab === "roster" ? "secondary" : "ghost"}
                  onClick={() => setActiveTab("roster")}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <Users className="h-3.5 w-3.5" />
                  Attendee Roster ({roster.length})
                </Button>
              </div>

              {activeTab === "feed" && (
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  Pusher Connected
                </span>
              )}
            </div>

            {/* Content: Activity Feed Tab */}
            {activeTab === "feed" && (
              <div className="p-5">
                <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Recent Entrance Scans</span>
                  <span>Auto-updated</span>
                </div>

                {isStatsLoading ? (
                  <div className="space-y-3 py-6">
                    {[1, 2, 3].map((n) => (
                      <div
                        key={n}
                        className="h-12 animate-pulse rounded-lg bg-muted/60"
                      />
                    ))}
                  </div>
                ) : !stats?.recentCheckIns || stats.recentCheckIns.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <Clock className="mx-auto h-8 w-8 opacity-40" />
                    <p className="mt-2 text-sm font-medium">
                      No check-ins recorded yet
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Scanned passes will appear here in real-time.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/60">
                    {stats.recentCheckIns.map((item) => (
                      <div
                        key={item.attendanceId}
                        className="flex items-center justify-between py-3 transition hover:bg-muted/20 px-2 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 font-bold text-emerald-600 text-xs">
                            {item.student.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {item.student.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.student.studentId
                                ? `ID: ${item.student.studentId} • `
                                : ""}
                              {item.student.department || "Attendee"}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-mono text-xs font-semibold text-primary">
                            {item.registrationCode}
                          </span>
                          <p className="text-[11px] text-muted-foreground">
                            {new Date(item.scannedAt).toLocaleTimeString([], {
                              hour: "numeric",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Content: Attendee Roster Tab */}
            {activeTab === "roster" && (
              <div className="p-5 space-y-4">
                {/* Search and Filters */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search roster..."
                      value={rosterSearch}
                      onChange={(e) => setRosterSearch(e.target.value)}
                      className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-3 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="xs"
                      variant={rosterFilter === "all" ? "secondary" : "ghost"}
                      onClick={() => setRosterFilter("all")}
                      className="text-xs"
                    >
                      All ({roster.length})
                    </Button>
                    <Button
                      size="xs"
                      variant={rosterFilter === "pending" ? "secondary" : "ghost"}
                      onClick={() => setRosterFilter("pending")}
                      className="text-xs"
                    >
                      Pending ({roster.filter((r) => !r.hasAttended).length})
                    </Button>
                    <Button
                      size="xs"
                      variant={rosterFilter === "attended" ? "secondary" : "ghost"}
                      onClick={() => setRosterFilter("attended")}
                      className="text-xs"
                    >
                      Attended ({roster.filter((r) => r.hasAttended).length})
                    </Button>
                  </div>
                </div>

                {/* Roster Table */}
                {isRosterLoading ? (
                  <div className="py-8 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : filteredRoster.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    No attendees match the criteria.
                  </div>
                ) : (
                  <div className="max-h-[380px] overflow-y-auto divide-y divide-border/60">
                    {filteredRoster.map((attendee) => (
                      <div
                        key={attendee.registrationId}
                        className="flex items-center justify-between py-2.5 px-2 hover:bg-muted/20 rounded-md"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-foreground">
                              {attendee.student.name}
                            </p>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {attendee.registrationCode}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {attendee.student.studentId
                              ? `ID: ${attendee.student.studentId} • `
                              : ""}
                            {attendee.student.department || attendee.student.email}
                          </p>
                        </div>

                        <div>
                          {attendee.hasAttended ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                              <CheckCircle2 className="h-3 w-3" />
                              Checked In
                            </span>
                          ) : (
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() =>
                                handleRosterRowCheckIn(attendee.registrationCode)
                              }
                              disabled={scanMutation.isPending}
                              className="gap-1 text-[11px]"
                            >
                              <ShieldCheck className="h-3 w-3" />
                              Manual Check-in
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
