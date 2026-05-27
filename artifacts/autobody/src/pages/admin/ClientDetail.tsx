import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { 
  useGetClient, 
  useUpdateClient, 
  useDeleteClient,
  useListVehicles,
  useListCheckins,
  useListPayments
} from "@workspace/api-client-react";
import { getGetClientQueryKey, getListClientsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, CarFront, Wrench, CreditCard, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

export default function ClientDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const [, setLocation] = useLocation();
  
  const { data: client, isLoading: clientLoading } = useGetClient(id, {
    query: { enabled: !!id, queryKey: getGetClientQueryKey(id) }
  });
  
  const { data: vehicles } = useListVehicles({ clientId: id });
  const { data: checkins } = useListCheckins({ clientId: id });
  const { data: payments } = useListPayments({ clientId: id });

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateClient.mutate(
      { 
        id, 
        data: { 
          name: formData.get("name") as string,
          email: formData.get("email") as string,
          phone: formData.get("phone") as string,
          address: formData.get("address") as string,
        } 
      },
      {
        onSuccess: (data) => {
          queryClient.setQueryData(getGetClientQueryKey(id), data);
          setIsEditOpen(false);
          toast({ title: "Client updated successfully" });
        },
        onError: () => toast({ title: "Failed to update client", variant: "destructive" })
      }
    );
  };

  const handleDelete = () => {
    deleteClient.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
          toast({ title: "Client deleted" });
          setLocation("/admin/clients");
        },
        onError: () => toast({ title: "Failed to delete client", variant: "destructive" })
      }
    );
  };

  if (clientLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!client) {
    return <div>Client not found</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/clients" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
        
        <div className="ml-auto flex gap-2">
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Client</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" defaultValue={client.name} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" defaultValue={client.email} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" defaultValue={client.phone} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" name="address" defaultValue={client.address || ""} />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={updateClient.isPending}>
                    {updateClient.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Client</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete this client? This action cannot be undone.
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete} disabled={deleteClient.isPending}>
                  {deleteClient.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Delete Client
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Contact Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Email</div>
              <div>{client.email}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Phone</div>
              <div>{client.phone}</div>
            </div>
            {client.address && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Address</div>
                <div>{client.address}</div>
              </div>
            )}
            <div>
              <div className="text-sm font-medium text-muted-foreground">Customer Since</div>
              <div>{new Date(client.createdAt).toLocaleDateString()}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 p-0 overflow-hidden">
          <Tabs defaultValue="vehicles" className="w-full">
            <div className="border-b px-4 py-2 bg-muted/20">
              <TabsList className="bg-transparent space-x-2">
                <TabsTrigger value="vehicles" className="data-[state=active]:bg-background">
                  <CarFront className="h-4 w-4 mr-2" /> Vehicles
                </TabsTrigger>
                <TabsTrigger value="checkins" className="data-[state=active]:bg-background">
                  <Wrench className="h-4 w-4 mr-2" /> Repair History
                </TabsTrigger>
                <TabsTrigger value="payments" className="data-[state=active]:bg-background">
                  <CreditCard className="h-4 w-4 mr-2" /> Payments
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="vehicles" className="p-0 m-0">
              <div className="divide-y">
                {!vehicles?.length ? (
                  <div className="p-8 text-center text-muted-foreground">No vehicles registered.</div>
                ) : (
                  vehicles.map(v => (
                    <div key={v.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div>
                        <div className="font-semibold">{v.year} {v.make} {v.model}</div>
                        <div className="text-sm text-muted-foreground flex gap-2">
                          <span>VIN: {v.vin || '-'}</span>
                          <span>&bull;</span>
                          <span className="uppercase">{v.licensePlate}</span>
                        </div>
                      </div>
                      <Link href={`/admin/vehicles/${v.id}`} className="text-primary hover:underline text-sm font-medium">
                        View
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="checkins" className="p-0 m-0">
              <div className="divide-y">
                {!checkins?.length ? (
                  <div className="p-8 text-center text-muted-foreground">No repair history.</div>
                ) : (
                  checkins.map(c => (
                    <div key={c.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          Repair #{c.id}
                          <Badge variant="outline" className="uppercase text-[10px] tracking-wider">{c.status.replace("_", " ")}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1 line-clamp-1">{c.description}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Dropped off: {new Date(c.droppedOffAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Link href={`/admin/checkins/${c.id}`} className="text-primary hover:underline text-sm font-medium ml-4 shrink-0">
                        View
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="payments" className="p-0 m-0">
              <div className="divide-y">
                {!payments?.length ? (
                  <div className="p-8 text-center text-muted-foreground">No payments found.</div>
                ) : (
                  payments.map(p => (
                    <div key={p.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div>
                        <div className="font-semibold">${p.amount.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <span>Repair #{p.checkinId}</span>
                          <span>&bull;</span>
                          <span className="uppercase">{p.status}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">{new Date(p.createdAt).toLocaleDateString()}</div>
                        {p.method && <div className="text-xs text-muted-foreground uppercase">{p.method}</div>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

          </Tabs>
        </Card>
      </div>
    </div>
  );
}
