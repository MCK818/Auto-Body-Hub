import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { 
  useGetVehicle, 
  useUpdateVehicle, 
  useDeleteVehicle,
  useListVehiclePhotos,
  useAddVehiclePhoto,
  useListCheckins,
  useGetClient
} from "@workspace/api-client-react";
import { getGetVehicleQueryKey, getListVehiclesQueryKey, getListVehiclePhotosQueryKey, getListCheckinsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Pencil, Trash2, Camera, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

export default function VehicleDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const [, setLocation] = useLocation();
  
  const { data: vehicle, isLoading: vehicleLoading } = useGetVehicle(id, {
    query: { enabled: !!id, queryKey: getGetVehicleQueryKey(id) }
  });
  
  const { data: client } = useGetClient(vehicle?.clientId || 0, {
    query: { enabled: !!vehicle?.clientId, queryKey: getGetVehicleQueryKey(vehicle?.clientId || 0) }
  });

  const { data: photos, isLoading: photosLoading } = useListVehiclePhotos(id, {
    query: { enabled: !!id, queryKey: getListVehiclePhotosQueryKey(id) }
  });

  const { data: checkins } = useListCheckins({ vehicleId: id }, {
    query: { enabled: !!id, queryKey: getListCheckinsQueryKey({ vehicleId: id }) }
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const updateVehicle = useUpdateVehicle();
  const deleteVehicle = useDeleteVehicle();
  const addPhoto = useAddVehiclePhoto();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateVehicle.mutate(
      { 
        id, 
        data: { 
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
        onSuccess: (data) => {
          queryClient.setQueryData(getGetVehicleQueryKey(id), data);
          setIsEditOpen(false);
          toast({ title: "Vehicle updated successfully" });
        },
        onError: () => toast({ title: "Failed to update vehicle", variant: "destructive" })
      }
    );
  };

  const handleDelete = () => {
    deleteVehicle.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListVehiclesQueryKey() });
          toast({ title: "Vehicle deleted" });
          setLocation("/admin/vehicles");
        },
        onError: () => toast({ title: "Failed to delete vehicle", variant: "destructive" })
      }
    );
  };

  const handleAddPhoto = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addPhoto.mutate(
      {
        id,
        data: {
          url: formData.get("url") as string,
          caption: formData.get("caption") as string,
        }
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListVehiclePhotosQueryKey(id) });
          setIsPhotoOpen(false);
          toast({ title: "Photo added" });
        },
        onError: () => toast({ title: "Failed to add photo", variant: "destructive" })
      }
    );
  };

  if (vehicleLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!vehicle) return <div>Vehicle not found</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/vehicles" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{vehicle.year} {vehicle.make} {vehicle.model}</h1>
          <p className="text-muted-foreground text-sm uppercase tracking-wider">{vehicle.licensePlate}</p>
        </div>
        
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
                <DialogTitle>Edit Vehicle</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="make">Make</Label>
                    <Input id="make" name="make" defaultValue={vehicle.make} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input id="model" name="model" defaultValue={vehicle.model} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input id="year" name="year" type="number" defaultValue={vehicle.year} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="licensePlate">License Plate</Label>
                    <Input id="licensePlate" name="licensePlate" defaultValue={vehicle.licensePlate} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vin">VIN</Label>
                    <Input id="vin" name="vin" defaultValue={vehicle.vin || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <Input id="color" name="color" defaultValue={vehicle.color || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mileage">Mileage</Label>
                    <Input id="mileage" name="mileage" type="number" defaultValue={vehicle.mileage || ""} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={updateVehicle.isPending}>
                    {updateVehicle.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
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
                <DialogTitle>Delete Vehicle</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete this vehicle? This action cannot be undone.
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete} disabled={deleteVehicle.isPending}>
                  {deleteVehicle.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Delete Vehicle
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Owner</div>
                {client ? (
                  <Link href={`/admin/clients/${client.id}`} className="font-medium text-primary hover:underline">
                    {client.name}
                  </Link>
                ) : (
                  <div>Client #{vehicle.clientId}</div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">VIN</div>
                  <div className="font-mono text-sm">{vehicle.vin || '-'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Color</div>
                  <div className="capitalize">{vehicle.color || '-'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Mileage</div>
                  <div>{vehicle.mileage ? `${vehicle.mileage.toLocaleString()} mi` : '-'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Repair History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {!checkins?.length ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">No previous check-ins.</div>
                ) : (
                  checkins.map(c => (
                    <Link key={c.id} href={`/admin/checkins/${c.id}`} className="block p-4 hover:bg-muted/30 transition-colors">
                      <div className="font-semibold flex items-center justify-between">
                        <span>Repair #{c.id}</span>
                        <span className="text-xs uppercase px-2 py-0.5 bg-muted rounded text-muted-foreground">
                          {c.status.replace("_", " ")}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(c.droppedOffAt).toLocaleDateString()}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Photo Gallery
            </CardTitle>
            <Dialog open={isPhotoOpen} onOpenChange={setIsPhotoOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Upload className="h-4 w-4 mr-2" /> Add Photo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Vehicle Photo</DialogTitle>
                  <DialogDescription>Add a URL to a photo (e.g. damages, before/after)</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddPhoto} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="url">Photo URL</Label>
                    <Input id="url" name="url" required placeholder="https://..." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="caption">Caption (optional)</Label>
                    <Input id="caption" name="caption" />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsPhotoOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={addPhoto.isPending}>
                      {addPhoto.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Add Photo
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {photosLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : !photos?.length ? (
              <div className="text-center py-12 border border-dashed rounded-lg text-muted-foreground">
                <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No photos available for this vehicle.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map(photo => (
                  <div key={photo.id} className="relative group rounded-lg overflow-hidden border aspect-video bg-muted">
                    <img src={photo.url} alt={photo.caption || "Vehicle photo"} className="w-full h-full object-cover" />
                    {photo.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-2 text-xs">
                        {photo.caption}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
