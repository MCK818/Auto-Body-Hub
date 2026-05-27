import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { 
  useGetCheckin,
  useUpdateCheckin,
  useGetVehicle,
  useGetClient,
  useListRepairUpdates,
  useAddRepairUpdate,
  useListPayments
} from "@workspace/api-client-react";
import { 
  getGetCheckinQueryKey, 
  getListCheckinsQueryKey,
  getListRepairUpdatesQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, PenTool, Calendar, DollarSign, Activity, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
const CHECKIN_STATUSES = ["pending", "in_progress", "waiting_parts", "ready", "completed", "cancelled"] as const;

export default function CheckinDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  
  const { data: checkin, isLoading: checkinLoading } = useGetCheckin(id, {
    query: { enabled: !!id, queryKey: getGetCheckinQueryKey(id) }
  });
  
  const { data: vehicle } = useGetVehicle(checkin?.vehicleId || 0, {
    query: { enabled: !!checkin?.vehicleId, queryKey: getGetCheckinQueryKey(checkin?.vehicleId || 0) }
  });

  const { data: client } = useGetClient(checkin?.clientId || 0, {
    query: { enabled: !!checkin?.clientId, queryKey: getGetCheckinQueryKey(checkin?.clientId || 0) }
  });

  const { data: updates } = useListRepairUpdates(id, {
    query: { enabled: !!id, queryKey: getListRepairUpdatesQueryKey(id) }
  });

  const { data: payments } = useListPayments({ checkinId: id });

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const updateCheckin = useUpdateCheckin();
  const addUpdate = useAddRepairUpdate();

  const [newUpdateMessage, setNewUpdateMessage] = useState("");
  const [newUpdateStatus, setNewUpdateStatus] = useState<string>("in_progress");

  const handleStatusChange = (newStatus: string) => {
    updateCheckin.mutate(
      { 
        id, 
        data: { 
          status: newStatus as any,
          completedAt: newStatus === "completed" ? new Date().toISOString() : undefined 
        } 
      },
      {
        onSuccess: (data) => {
          queryClient.setQueryData(getGetCheckinQueryKey(id), data);
          toast({ title: "Status updated" });
        }
      }
    );
  };

  const handleDetailsUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateCheckin.mutate(
      {
        id,
        data: {
          estimatedCost: parseFloat(formData.get("estimatedCost") as string) || undefined,
          estimatedCompletionDate: formData.get("estimatedCompletionDate") as string || undefined,
          description: formData.get("description") as string,
        }
      },
      {
        onSuccess: (data) => {
          queryClient.setQueryData(getGetCheckinQueryKey(id), data);
          toast({ title: "Check-in details updated" });
        }
      }
    );
  };

  const handleAddUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUpdateMessage.trim()) return;

    addUpdate.mutate(
      {
        id,
        data: {
          message: newUpdateMessage,
          status: newUpdateStatus as any
        }
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListRepairUpdatesQueryKey(id) });
          setNewUpdateMessage("");
          toast({ title: "Update added to timeline" });
        }
      }
    );
  };

  if (checkinLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!checkin) return <div>Check-in not found</div>;

  const totalPaid = payments?.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0) || 0;
  const balance = (checkin.estimatedCost || 0) - totalPaid;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/checkins" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Repair #{checkin.id}</h1>
            <Select value={checkin.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[180px] h-8 bg-muted/50 border-none font-semibold uppercase text-xs tracking-wider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHECKIN_STATUSES.map(s => (
                  <SelectItem key={s} value={s} className="uppercase text-xs font-semibold">{s.replace("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-muted-foreground text-sm">
            Started {new Date(checkin.droppedOffAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Repair Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="bg-muted/30 p-4 rounded-lg border border-dashed">
                <form onSubmit={handleAddUpdate} className="space-y-3">
                  <div className="flex gap-2">
                    <Select value={newUpdateStatus} onValueChange={setNewUpdateStatus}>
                      <SelectTrigger className="w-[160px] bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CHECKIN_STATUSES.map(s => (
                          <SelectItem key={s} value={s} className="uppercase text-xs">{s.replace("_", " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input 
                      placeholder="Add an update for the customer..." 
                      value={newUpdateMessage}
                      onChange={e => setNewUpdateMessage(e.target.value)}
                      className="bg-background flex-1"
                    />
                    <Button type="submit" disabled={!newUpdateMessage.trim() || addUpdate.isPending}>
                      Add
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground px-1">This update will be visible to the customer on the tracking page.</p>
                </form>
              </div>

              <div className="relative border-l-2 border-muted ml-4 pl-6 space-y-8 mt-8">
                {updates?.map(update => (
                  <div key={update.id} className="relative">
                    <div className="absolute -left-[35px] top-1 h-4 w-4 rounded-full border-2 border-background bg-primary" />
                    <div className="flex items-baseline justify-between mb-1">
                      <Badge variant="outline" className="uppercase text-[10px] bg-muted/50">{update.status?.replace("_", " ")}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(update.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm font-medium">{update.message}</p>
                  </div>
                ))}
                
                <div className="relative">
                  <div className="absolute -left-[35px] top-1 h-4 w-4 rounded-full border-2 border-background bg-muted-foreground" />
                  <div className="flex items-baseline justify-between mb-1">
                    <Badge variant="outline" className="uppercase text-[10px] bg-muted/50">Initial Drop-off</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(checkin.droppedOffAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Vehicle checked into the shop.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Vehicle & Client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {vehicle ? (
                <div>
                  <div className="font-semibold">{vehicle.year} {vehicle.make} {vehicle.model}</div>
                  <div className="text-sm text-muted-foreground uppercase">{vehicle.licensePlate}</div>
                  <Link href={`/admin/vehicles/${vehicle.id}`} className="text-primary hover:underline text-xs mt-1 inline-block">View Vehicle Profile</Link>
                </div>
              ) : <div>Loading vehicle...</div>}
              
              <div className="h-px bg-border my-2" />
              
              {client ? (
                <div>
                  <div className="font-semibold">{client.name}</div>
                  <div className="text-sm text-muted-foreground">{client.phone}</div>
                  <Link href={`/admin/clients/${client.id}`} className="text-primary hover:underline text-xs mt-1 inline-block">View Client Profile</Link>
                </div>
              ) : <div>Loading client...</div>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                Repair Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDetailsUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="estimatedCompletionDate" className="text-xs">Est. Completion</Label>
                  <Input 
                    id="estimatedCompletionDate" 
                    name="estimatedCompletionDate" 
                    type="date" 
                    defaultValue={checkin.estimatedCompletionDate ? checkin.estimatedCompletionDate.split('T')[0] : ""} 
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-xs">Initial Issues</Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    defaultValue={checkin.description} 
                    className="min-h-[80px] text-sm resize-none"
                  />
                </div>
                <div className="pt-2 border-t mt-4 flex items-center justify-between">
                  <div className="space-y-1 w-2/3">
                    <Label htmlFor="estimatedCost" className="text-xs">Estimate ($)</Label>
                    <Input 
                      id="estimatedCost" 
                      name="estimatedCost" 
                      type="number" 
                      defaultValue={checkin.estimatedCost || ""} 
                      className="h-8 text-sm font-medium"
                    />
                  </div>
                  <Button type="submit" size="sm" className="mt-5" disabled={updateCheckin.isPending}>
                    Save
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-muted/10 border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Financials</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Estimate:</span>
                  <span className="font-medium">${(checkin.estimatedCost || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Paid:</span>
                  <span>-${totalPaid.toFixed(2)}</span>
                </div>
                <div className="h-px bg-border my-1" />
                <div className="flex justify-between font-semibold">
                  <span>Balance Due:</span>
                  <span className={balance > 0 ? "text-primary" : "text-green-500"}>
                    ${Math.max(0, balance).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
