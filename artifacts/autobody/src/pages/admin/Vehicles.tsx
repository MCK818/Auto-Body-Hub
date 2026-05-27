import { useState } from "react";
import { Link } from "wouter";
import { useListVehicles, useCreateVehicle, useListClients } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListVehiclesQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Vehicles() {
  const [search, setSearch] = useState("");
  const { data: vehicles, isLoading } = useListVehicles({ search });
  const { data: clients } = useListClients();
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createVehicle = useCreateVehicle();

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const clientIdStr = formData.get("clientId") as string;
    
    if (!clientIdStr) {
      toast({ title: "Please select a client", variant: "destructive" });
      return;
    }

    createVehicle.mutate(
      { 
        data: { 
          clientId: parseInt(clientIdStr, 10),
          make: formData.get("make") as string,
          model: formData.get("model") as string,
          year: parseInt(formData.get("year") as string, 10),
          licensePlate: formData.get("licensePlate") as string,
          vin: formData.get("vin") as string,
          color: formData.get("color") as string,
          mileage: parseInt(formData.get("mileage") as string, 10) || undefined,
        } 
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListVehiclesQueryKey() });
          setIsAddOpen(false);
          toast({ title: "Vehicle added successfully" });
        },
        onError: () => {
          toast({ title: "Failed to add vehicle", variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Vehicles</h1>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Vehicle</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clientId">Client</Label>
                <Select name="clientId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map(client => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.name} ({client.phone})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="make">Make</Label>
                  <Input id="make" name="make" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input id="model" name="model" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input id="year" name="year" type="number" min="1900" max="2100" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licensePlate">License Plate</Label>
                  <Input id="licensePlate" name="licensePlate" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vin">VIN (Optional)</Label>
                  <Input id="vin" name="vin" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color (Optional)</Label>
                  <Input id="color" name="color" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createVehicle.isPending}>
                  {createVehicle.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Vehicle
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="py-4">
          <div className="flex items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by plate or make/model..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-muted-foreground">
                  <th className="h-10 px-4 text-left font-medium">Vehicle</th>
                  <th className="h-10 px-4 text-left font-medium">Plate</th>
                  <th className="h-10 px-4 text-left font-medium">VIN</th>
                  <th className="h-10 px-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    </td>
                  </tr>
                ) : vehicles?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="h-24 text-center text-muted-foreground">
                      No vehicles found.
                    </td>
                  </tr>
                ) : (
                  vehicles?.map(vehicle => (
                    <tr key={vehicle.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4 font-medium">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </td>
                      <td className="p-4 uppercase tracking-wider">{vehicle.licensePlate}</td>
                      <td className="p-4 text-muted-foreground font-mono text-xs">{vehicle.vin || '-'}</td>
                      <td className="p-4 text-right">
                        <Link href={`/admin/vehicles/${vehicle.id}`} className="text-primary hover:underline font-medium">
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
