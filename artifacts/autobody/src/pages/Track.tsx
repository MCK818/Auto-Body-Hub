import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Search, Loader2, CheckCircle2, Clock, Wrench, Package, Car, Flag, XCircle } from "lucide-react";

type RepairUpdate = { id: number; checkinId: number; status: string | null; message: string; createdAt: string };
type VehicleInfo = { id: number; make: string; model: string; year: number; color: string | null; licensePlate: string | null };
type CheckinWithDetails = {
  id: number; status: string; description: string;
  droppedOffAt: string; estimatedCompletionDate: string | null;
  completedAt: string | null; estimatedCost: number | null;
  vehicle: VehicleInfo | null; updates: RepairUpdate[];
};

const STATUS_STAGES = [
  { key: "pending",       label: "Received",        icon: Car,          desc: "Your vehicle has been received by the shop." },
  { key: "in_progress",  label: "In Progress",      icon: Wrench,       desc: "Our technicians are actively working on your vehicle." },
  { key: "waiting_parts",label: "Parts Ordered",    icon: Package,      desc: "Waiting for parts to arrive before continuing." },
  { key: "ready",        label: "Ready for Pickup", icon: Flag,         desc: "Your vehicle is repaired and ready to pick up!" },
  { key: "completed",    label: "Completed",        icon: CheckCircle2, desc: "Repair complete. Thank you for choosing us!" },
];

const CANCELLED_STAGE = { key: "cancelled", label: "Cancelled", icon: XCircle, desc: "This repair was cancelled." };

function getStageIndex(status: string) {
  return STATUS_STAGES.findIndex((s) => s.key === status);
}

function StatusTimeline({ status }: { status: string }) {
  if (status === "cancelled") {
    const S = CANCELLED_STAGE;
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 text-destructive">
        <S.icon className="h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold">{S.label}</p>
          <p className="text-sm opacity-80">{S.desc}</p>
        </div>
      </div>
    );
  }

  const currentIdx = getStageIndex(status);

  return (
    <div className="space-y-0">
      {STATUS_STAGES.map((stage, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        const Icon = stage.icon;

        return (
          <div key={stage.key} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                done ? "bg-primary border-primary text-primary-foreground" :
                active ? "border-primary bg-primary/10 text-primary" :
                "border-muted-foreground/30 text-muted-foreground/40 bg-background"
              }`}>
                <Icon className="h-4 w-4" />
              </div>
              {i < STATUS_STAGES.length - 1 && (
                <div className={`w-0.5 flex-1 my-1 min-h-[24px] ${done ? "bg-primary" : "bg-muted-foreground/20"}`} />
              )}
            </div>
            <div className={`pb-5 ${active ? "text-foreground" : done ? "text-foreground/70" : "text-muted-foreground/50"}`}>
              <p className={`font-semibold text-sm ${active ? "text-primary" : ""}`}>{stage.label}</p>
              {(active || done) && <p className="text-xs mt-0.5">{stage.desc}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Track() {
  const [location] = useLocation();
  const [search, setSearch] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [results, setResults] = useState<CheckinWithDetails[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1] || "");
    const q = params.get("q");
    if (q) { setSearch(q); doSearch(q); }
  }, []);

  const doSearch = async (q: string) => {
    setLoading(true);
    setError("");
    setResults(null);
    setSubmitted(q);
    try {
      const res = await fetch(`/api/track?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setResults(data);
    } catch {
      setError("Could not look up repairs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) doSearch(search.trim());
  };

  return (
    <div className="container mx-auto px-4 py-12 md:py-20 max-w-2xl">
      <div className="text-center space-y-3 mb-12">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Track Your Repair</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Enter your <strong>Repair ID</strong> or <strong>phone number</strong> to see real-time status updates from the shop.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Look Up Your Repair</CardTitle>
          <CardDescription>We update statuses in real-time as work progresses.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Repair ID (e.g. 42) or phone number"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={!search.trim() || loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">{loading ? "Searching" : "Search"}</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <div className="text-center py-6 text-destructive font-medium">{error}</div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!loading && results !== null && results.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Car className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium text-lg">No repairs found</p>
          <p className="text-sm mt-1">No active repairs for "{submitted}". Double-check your ID or phone number.</p>
        </div>
      )}

      {!loading && results && results.length > 0 && (
        <div className="space-y-6">
          {results.map((checkin) => (
            <Card key={checkin.id} className="overflow-hidden">
              {/* Header */}
              <div className="bg-primary/5 border-b px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg">Repair #{checkin.id}</p>
                  {checkin.vehicle && (
                    <p className="text-sm text-muted-foreground">
                      {checkin.vehicle.year} {checkin.vehicle.make} {checkin.vehicle.model}
                      {checkin.vehicle.color ? ` · ${checkin.vehicle.color}` : ""}
                      {checkin.vehicle.licensePlate ? ` · ${checkin.vehicle.licensePlate}` : ""}
                    </p>
                  )}
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                  checkin.status === "completed" ? "bg-green-100 text-green-700" :
                  checkin.status === "cancelled" ? "bg-red-100 text-red-700" :
                  checkin.status === "ready" ? "bg-blue-100 text-blue-700" :
                  "bg-primary/15 text-primary"
                }`}>
                  {checkin.status.replace("_", " ")}
                </span>
              </div>

              <CardContent className="p-6 space-y-6">
                {/* Description */}
                {checkin.description && (
                  <p className="text-sm text-muted-foreground border-l-2 border-primary/30 pl-3">
                    {checkin.description}
                  </p>
                )}

                {/* Key dates */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4 shrink-0" />
                    <div>
                      <p className="text-xs">Dropped Off</p>
                      <p className="font-medium text-foreground">{new Date(checkin.droppedOffAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {checkin.estimatedCompletionDate && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Flag className="h-4 w-4 shrink-0" />
                      <div>
                        <p className="text-xs">Est. Completion</p>
                        <p className="font-medium text-foreground">{new Date(checkin.estimatedCompletionDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                  {checkin.estimatedCost && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="h-4 w-4 shrink-0 flex items-center justify-center font-bold text-xs">$</div>
                      <div>
                        <p className="text-xs">Estimated Cost</p>
                        <p className="font-medium text-foreground">${checkin.estimatedCost.toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Timeline */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Repair Progress</p>
                  <StatusTimeline status={checkin.status} />
                </div>

                {/* Repair updates */}
                {checkin.updates.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Shop Updates</p>
                    <div className="space-y-3">
                      {[...checkin.updates].reverse().map((u) => (
                        <div key={u.id} className="flex gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                          <div>
                            <p className="text-sm">{u.message}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {new Date(u.createdAt).toLocaleDateString()} at {new Date(u.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              {u.status && <span className="ml-2 font-medium uppercase">{u.status.replace("_", " ")}</span>}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
