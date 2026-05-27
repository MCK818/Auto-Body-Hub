import { useState, useMemo } from "react";
import { useListParts } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Package, Loader2, Filter } from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  Brakes: "bg-red-100 text-red-700",
  Body: "bg-blue-100 text-blue-700",
  Engine: "bg-orange-100 text-orange-700",
  Electrical: "bg-yellow-100 text-yellow-700",
  Suspension: "bg-purple-100 text-purple-700",
  Paint: "bg-pink-100 text-pink-700",
  Tires: "bg-green-100 text-green-700",
};

function categoryColor(cat: string) {
  return CATEGORY_COLORS[cat] ?? "bg-muted text-muted-foreground";
}

export default function PublicParts() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { data: parts, isLoading } = useListParts({ search });

  const categories = useMemo(() => {
    if (!parts) return [];
    return Array.from(new Set(parts.map((p) => p.category))).sort();
  }, [parts]);

  const filtered = useMemo(() => {
    if (!parts) return [];
    if (!activeCategory) return parts;
    return parts.filter((p) => p.category === activeCategory);
  }, [parts, activeCategory]);

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Parts Catalog</h1>
        <p className="text-muted-foreground max-w-xl">
          Browse our inventory of quality auto parts. Ask your service advisor about availability and installation.
        </p>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search parts by name or number..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {categories.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <Button
              size="sm"
              variant={activeCategory === null ? "default" : "outline"}
              onClick={() => setActiveCategory(null)}
            >
              All
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                size="sm"
                variant={activeCategory === cat ? "default" : "outline"}
                onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Results count */}
      {!isLoading && (
        <p className="text-sm text-muted-foreground mb-6">
          {filtered.length} part{filtered.length !== 1 ? "s" : ""} {activeCategory ? `in ${activeCategory}` : "in catalog"}
          {search ? ` matching "${search}"` : ""}
        </p>
      )}

      {/* Parts Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
          <p className="text-lg font-medium">No parts found</p>
          <p className="text-muted-foreground text-sm mt-1">Try a different search or category.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((part) => (
            <Card key={part.id} className="hover:shadow-md transition-shadow group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="bg-primary/10 rounded-lg p-2.5 group-hover:bg-primary/20 transition-colors">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${part.quantity > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {part.quantity > 0 ? `${part.quantity} in stock` : "Out of stock"}
                  </span>
                </div>

                <h3 className="font-semibold text-base leading-tight mb-1">{part.name}</h3>
                <p className="text-xs font-mono text-muted-foreground mb-2">#{part.partNumber}</p>

                <Badge variant="secondary" className={`text-xs mb-3 ${categoryColor(part.category)}`}>
                  {part.category}
                </Badge>

                {part.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{part.description}</p>
                )}

                <div className="flex items-center justify-between mt-auto pt-3 border-t">
                  <span className="text-lg font-bold text-primary">${part.price.toFixed(2)}</span>
                  {part.supplier && (
                    <span className="text-xs text-muted-foreground">{part.supplier}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="mt-16 bg-muted/50 rounded-2xl p-8 text-center">
        <h2 className="text-xl font-bold mb-2">Need a specific part?</h2>
        <p className="text-muted-foreground mb-4">
          Don't see what you're looking for? Contact us and we'll source it for you.
        </p>
        <Button size="lg" variant="outline">Contact the Shop</Button>
      </div>
    </div>
  );
}
