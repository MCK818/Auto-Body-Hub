import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useListCheckins } from "@workspace/api-client-react";
import { Search, Loader2 } from "lucide-react";

export default function Track() {
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");

  const { data: checkins, isLoading } = useListCheckins(
    {},
    { query: { enabled: !!submittedSearch, queryKey: [...["api", "checkins"], submittedSearch] } }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      setSubmittedSearch(search.trim());
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 md:py-24 max-w-2xl">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Track Your Repair</h1>
        <p className="text-muted-foreground">Enter your phone number or repair ID to check the real-time status of your vehicle.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Look up status</CardTitle>
          <CardDescription>We update statuses as soon as they change in the shop.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input 
              placeholder="Phone number or Repair ID" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={!search.trim() || isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
              {isLoading ? "Searching" : "Search"}
            </Button>
          </form>

          {submittedSearch && (
            <div className="mt-8">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : checkins && checkins.length > 0 ? (
                <div className="space-y-4">
                  {checkins.map(checkin => (
                    <div key={checkin.id} className="p-4 border rounded-lg bg-muted/50">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold">Repair #{checkin.id}</span>
                        <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full font-medium uppercase tracking-wider">
                          {checkin.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{checkin.description}</p>
                      {checkin.estimatedCompletionDate && (
                        <p className="text-sm mt-2 font-medium">Est. Completion: {new Date(checkin.estimatedCompletionDate).toLocaleDateString()}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No active repairs found for "{submittedSearch}".
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
