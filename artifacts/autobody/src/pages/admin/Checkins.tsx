import { useState } from "react";
import { Link } from "wouter";
import { useListCheckins, useCreateCheckin, useListVehicles, useListClients } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListCheckinsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, Calendar } from "lucide-react";
const CHECKIN_STATUSES = ["pending", "in_progress", "waiting_parts", "ready", "completed", "cancelled"];

const statusColors: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  in_progress: "bg-blue-500/20 text-blue-500",
  waiting_parts: "bg-orange-500/20 text-orange-500",
  ready: "bg-green-500/20 text-green-500",
  completed: "bg-zinc-500/20 text-zinc-500",
  cancelled: "bg-red-500/20 text-red-500"
};

export default function Checkins() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { data: checkins, isLoading } = useListCheckins({ status: statusFilter === "all" ? undefined : statusFilter });
  const { data: clients } = useListClients();
  const { data: vehicles } = useListVehicles();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>("");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createCheckin = useCreateCheckin();

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const clientIdStr = selectedClient;
    const vehicleIdStr = formData.get("vehicleId") as string;
    
    if (!clientIdStr || !vehicleIdStr) {
      toast({ title: "Please select client and vehicle", variant: "destructive" });
      return;
    }

    createCheckin.mutate(
      { 
        data: { 
          clientId: parseInt(clientIdStr, 10),
          vehicleId: parseInt(vehicleIdStr, 10),
          description: formData.get("description") as string,
          droppedOffAt: new Date().toISOString(),
          estimatedCost: parseInt(formData.get("estimatedCost") as string, 10) || undefined,
        } 
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCheckinsQueryKey() });
          setIsAddOpen(false);
          toast({ title: "Check-in created successfully" });
        },
        onError: () => {
          toast({ title: "Failed to create check-in", variant: "destructive" });
        }
      }
    );
  };

  const filteredVehicles = vehicles?.filter(v => v.clientId.toString() === selectedClient);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Active Check-ins</h1>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Check-in
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Check-in</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clientId">Client</Label>
                <Select value={selectedClient} onValueChange={setSelectedClient} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map(client => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleId">Vehicle</Label>
                <Select name="vehicleId" required disabled={!selectedClient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredVehicles?.map(vehicle => (
                      <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                        {vehicle.year} {vehicle.make} {vehicle.model} ({vehicle.licensePlate})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Initial Description / Issues</Label>
                <Textarea id="description" name="description" rows={3} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedCost">Estimated Cost ($)</Label>
                <Input id="estimatedCost" name="estimatedCost" type="number" min="0" step="0.01" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createCheckin.isPending}>
                  {createCheckin.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Check-in
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 pb-2 overflow-x-auto">
        {["all", ...CHECKIN_STATUSES].map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(status)}
            className="capitalize"
          >
            {status.replace("_", " ")}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full py-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : checkins?.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground border rounded-lg border-dashed">
            No check-ins found.
          </div>
        ) : (
          checkins?.map(checkin => {
            const vehicle = vehicles?.find(v => v.id === checkin.vehicleId);
            const client = clients?.find(c => c.id === checkin.clientId);
            
            return (
              <Card key={checkin.id} className="flex flex-col hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">#{checkin.id}</CardTitle>
                    <Badge variant="outline" className={`${statusColors[checkin.status]} uppercase`}>
                      {checkin.status.replace("_", " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 pb-4">
                  <div className="font-semibold mb-1">
                    {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : `Vehicle #${checkin.vehicleId}`}
                  </div>
                  <div className="text-sm text-muted-foreground mb-4">
                    {client?.name || `Client #${checkin.clientId}`}
                  </div>
                  <p className="text-sm line-clamp-2">{checkin.description}</p>
                </CardContent>
                <div className="px-6 py-3 border-t bg-muted/20 flex items-center justify-between mt-auto">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(checkin.droppedOffAt).toLocaleDateString()}
                  </div>
                  <Link href={`/admin/checkins/${checkin.id}`} className="text-sm font-medium text-primary hover:underline">
                    Manage
                  </Link>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
