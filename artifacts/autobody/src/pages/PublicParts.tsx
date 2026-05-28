import { useState, useMemo } from "react";
import { useListParts } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import {
  Search, Package, Loader2, SlidersHorizontal, X, CheckCircle2,
  Car, Paintbrush, Layers, Lightbulb, Sparkles, Droplets,
  ArrowUpDown, ChevronDown, ChevronUp,
} from "lucide-react";

// ── Category config ──────────────────────────────────────────────────────────

type CatConfig = { gradient: string; icon: React.ElementType; badge: string };
const CAT_CONFIG: Record<string, CatConfig> = {
  "Body Panels":      { gradient: "from-blue-500 to-blue-700",    icon: Car,        badge: "bg-blue-100 text-blue-700"   },
  "Paint & Supplies": { gradient: "from-rose-500 to-pink-600",    icon: Paintbrush, badge: "bg-pink-100 text-pink-700"   },
  "Adhesives":        { gradient: "from-amber-500 to-orange-600", icon: Droplets,   badge: "bg-amber-100 text-amber-700" },
  "Glass":            { gradient: "from-cyan-400 to-teal-600",    icon: Layers,     badge: "bg-cyan-100 text-cyan-700"   },
  "Lighting":         { gradient: "from-yellow-400 to-amber-500", icon: Lightbulb,  badge: "bg-yellow-100 text-yellow-700"},
  "Detailing":        { gradient: "from-emerald-500 to-green-600",icon: Sparkles,   badge: "bg-emerald-100 text-emerald-700"},
};
function getCat(cat: string): CatConfig {
  return CAT_CONFIG[cat] ?? { gradient: "from-slate-500 to-slate-700", icon: Package, badge: "bg-muted text-muted-foreground" };
}

// ── Sort options ─────────────────────────────────────────────────────────────
type SortKey = "name-asc" | "name-desc" | "price-asc" | "price-desc" | "stock-desc";
const SORT_LABELS: Record<SortKey, string> = {
  "name-asc":   "Name A→Z",
  "name-desc":  "Name Z→A",
  "price-asc":  "Price: Low to High",
  "price-desc": "Price: High to Low",
  "stock-desc": "In Stock First",
};

// ── Request Part Dialog ───────────────────────────────────────────────────────
type Part = { id: number; name: string; partNumber: string; category: string; price: number; quantity: number; description: string | null; supplier: string | null };

function RequestDialog({ part, open, onClose }: { part: Part | null; open: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const reset = () => { setName(""); setPhone(""); setNotes(""); setDone(false); setError(""); };

  const handleClose = () => { onClose(); setTimeout(reset, 300); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!part) return;
    setSubmitting(true); setError("");
    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: { name, phone },
          vehicle: { make: "Unknown", model: "Unknown", year: new Date().getFullYear() },
          description: `Part request: ${part.name} (Part #${part.partNumber})${notes ? `\n\nNotes: ${notes}` : ""}`,
          photos: [],
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!part) return null;
  const cfg = getCat(part.category);
  const Icon = cfg.icon;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        {done ? (
          <div className="text-center py-6">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 rounded-full p-4">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-xl mb-2">Request Sent!</DialogTitle>
            <p className="text-muted-foreground text-sm mb-6">
              We've received your request for <strong>{part.name}</strong>. Our team will reach out to <strong>{phone}</strong> to confirm availability and pricing.
            </p>
            <Button onClick={handleClose} className="w-full">Done</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Request This Part</DialogTitle>
              <DialogDescription>We'll confirm availability and pricing and get back to you.</DialogDescription>
            </DialogHeader>

            {/* Part summary */}
            <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-3 mb-2">
              <div className={`bg-gradient-to-br ${cfg.gradient} rounded-lg p-2.5 shrink-0`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{part.name}</p>
                <p className="text-xs font-mono text-muted-foreground">#{part.partNumber}</p>
              </div>
              <span className="ml-auto font-bold text-primary shrink-0">${part.price.toFixed(2)}</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input placeholder="John Smith" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Phone Number *</Label>
                <Input placeholder="555-0100" value={phone} onChange={e => setPhone(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Input placeholder="Vehicle make/model, quantity needed..." value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>Cancel</Button>
                <Button type="submit" className="flex-1" disabled={submitting || !name.trim() || !phone.trim()}>
                  {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Sending…</> : "Send Request"}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Part Card ────────────────────────────────────────────────────────────────
function PartCard({ part, onRequest }: { part: Part; onRequest: (p: Part) => void }) {
  const cfg = getCat(part.category);
  const Icon = cfg.icon;
  const inStock = part.quantity > 0;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 group flex flex-col">
      {/* Gradient header */}
      <div className={`bg-gradient-to-br ${cfg.gradient} p-5 flex items-center justify-between`}>
        <div className="bg-white/20 rounded-xl p-3">
          <Icon className="h-6 w-6 text-white" />
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
          inStock ? "bg-green-400/90 text-white" : "bg-black/30 text-white/80"
        }`}>
          {inStock ? `${part.quantity} in stock` : "Out of stock"}
        </span>
      </div>

      <CardContent className="p-4 flex flex-col flex-1 gap-2">
        {/* Name & part number */}
        <div>
          <h3 className="font-semibold text-base leading-snug">{part.name}</h3>
          <p className="text-xs font-mono text-muted-foreground mt-0.5">#{part.partNumber}</p>
        </div>

        {/* Category badge */}
        <Badge variant="secondary" className={`w-fit text-xs ${cfg.badge}`}>{part.category}</Badge>

        {/* Description */}
        {part.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{part.description}</p>
        )}

        <Separator className="my-1" />

        {/* Price + action */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xl font-bold text-primary">${part.price.toFixed(2)}</span>
          <Button
            size="sm"
            variant={inStock ? "default" : "outline"}
            className="h-8 text-xs"
            onClick={() => onRequest(part)}
          >
            {inStock ? "Request Part" : "Notify Me"}
          </Button>
        </div>

        {part.supplier && (
          <p className="text-[11px] text-muted-foreground">Supplier: {part.supplier}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function PublicParts() {
  const [search, setSearch] = useState("");
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set());
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [stockFilter, setStockFilter] = useState<"all" | "in-stock" | "out-of-stock">("all");
  const [sort, setSort] = useState<SortKey>("name-asc");
  const [showFilters, setShowFilters] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [requestPart, setRequestPart] = useState<Part | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: rawParts, isLoading } = useListParts({});

  const allParts: Part[] = (rawParts ?? []) as Part[];

  const maxPrice = useMemo(() => {
    if (!allParts.length) return 10000;
    return Math.ceil(Math.max(...allParts.map(p => p.price)) / 100) * 100;
  }, [allParts]);

  const categories = useMemo(() => Array.from(new Set(allParts.map(p => p.category))).sort(), [allParts]);

  const toggleCategory = (cat: string) => {
    setActiveCategories(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const filtered = useMemo(() => {
    let list = allParts;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.partNumber.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }

    if (activeCategories.size > 0) {
      list = list.filter(p => activeCategories.has(p.category));
    }

    list = list.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    if (stockFilter === "in-stock")     list = list.filter(p => p.quantity > 0);
    if (stockFilter === "out-of-stock") list = list.filter(p => p.quantity === 0);

    return [...list].sort((a, b) => {
      if (sort === "name-asc")   return a.name.localeCompare(b.name);
      if (sort === "name-desc")  return b.name.localeCompare(a.name);
      if (sort === "price-asc")  return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "stock-desc") return b.quantity - a.quantity;
      return 0;
    });
  }, [allParts, search, activeCategories, priceRange, stockFilter, sort]);

  const hasActiveFilters = activeCategories.size > 0 || stockFilter !== "all" || priceRange[0] > 0 || priceRange[1] < maxPrice;

  const clearFilters = () => {
    setActiveCategories(new Set());
    setStockFilter("all");
    setPriceRange([0, maxPrice]);
  };

  const openRequest = (part: Part) => { setRequestPart(part); setDialogOpen(true); };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-700 text-white py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Parts Catalog</h1>
          <p className="text-slate-300 max-w-xl">
            Quality OEM and aftermarket parts. Browse our inventory, request any part, and we'll handle the rest.
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Search + Sort + Filter toggle row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, part number, or category…"
              className="pl-9 h-10"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <Button variant="outline" className="h-10 gap-2 whitespace-nowrap" onClick={() => setSortOpen(o => !o)}>
              <ArrowUpDown className="h-4 w-4" />
              {SORT_LABELS[sort]}
              {sortOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
            {sortOpen && (
              <div className="absolute right-0 top-full mt-1 z-20 bg-background border rounded-xl shadow-lg min-w-48 py-1">
                {(Object.entries(SORT_LABELS) as [SortKey, string][]).map(([k, label]) => (
                  <button
                    key={k}
                    className={`w-full text-left text-sm px-4 py-2 hover:bg-muted transition-colors ${sort === k ? "font-semibold text-primary" : ""}`}
                    onClick={() => { setSort(k); setSortOpen(false); }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter toggle */}
          <Button
            variant={hasActiveFilters ? "default" : "outline"}
            className="h-10 gap-2"
            onClick={() => setShowFilters(f => !f)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {hasActiveFilters && <span className="bg-white text-primary text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
              {activeCategories.size + (stockFilter !== "all" ? 1 : 0)}
            </span>}
          </Button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="bg-muted/40 border rounded-xl p-5 mb-6 grid sm:grid-cols-3 gap-6">
            {/* Categories */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Category</p>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => {
                  const active = activeCategories.has(cat);
                  const cfg = getCat(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-all ${
                        active ? `bg-gradient-to-r ${cfg.gradient} text-white border-transparent shadow-sm` : "border-border bg-background hover:bg-muted"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price range */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Price Range: <span className="text-foreground font-bold">${priceRange[0]} – ${priceRange[1] >= maxPrice ? "Any" : priceRange[1]}</span>
              </p>
              <Slider
                min={0}
                max={maxPrice}
                step={10}
                value={priceRange}
                onValueChange={v => setPriceRange(v as [number, number])}
                className="mt-4"
              />
            </div>

            {/* Stock status */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Availability</p>
              <div className="flex flex-col gap-2">
                {([["all","All Parts"],["in-stock","In Stock Only"],["out-of-stock","Out of Stock"]] as const).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setStockFilter(val)}
                    className={`text-sm text-left px-3 py-2 rounded-lg border transition-all ${
                      stockFilter === val ? "border-primary bg-primary/10 text-primary font-medium" : "border-border hover:bg-muted"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {hasActiveFilters && (
              <div className="sm:col-span-3 flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground hover:text-destructive">
                  <X className="h-3.5 w-3.5" /> Clear all filters
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Results bar */}
        {!isLoading && (
          <div className="flex items-center gap-3 mb-5">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{filtered.length}</span> part{filtered.length !== 1 ? "s" : ""}
              {search ? ` for "${search}"` : ""}
            </p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs text-primary hover:underline flex items-center gap-1">
                <X className="h-3 w-3" /> Clear filters
              </button>
            )}
          </div>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading parts…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <Package className="h-14 w-14 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-xl font-semibold mb-1">No parts found</p>
            <p className="text-muted-foreground text-sm mb-4">Try adjusting your search or filters.</p>
            {hasActiveFilters && <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(part => (
              <PartCard key={part.id} part={part} onRequest={openRequest} />
            ))}
          </div>
        )}

        {/* CTA footer */}
        <div className="mt-16 bg-gradient-to-r from-slate-900 to-slate-700 text-white rounded-2xl p-8 text-center">
          <Package className="h-8 w-8 mx-auto mb-3 opacity-60" />
          <h2 className="text-xl font-bold mb-2">Don't see what you need?</h2>
          <p className="text-slate-300 mb-5 max-w-md mx-auto">
            We source parts on demand. Click "Request Part" on any item, or contact us directly and we'll find it for you.
          </p>
          <Button size="lg" variant="secondary">Call the Shop</Button>
        </div>
      </div>

      <RequestDialog part={requestPart} open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
