import { useState } from "react";
import { useListParts, useCreatePart } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListPartsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Search, Plus, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function Parts() {
  const [search, setSearch] = useState("");
  const { data: parts, isLoading } = useListParts({ search });
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createPart = useCreatePart();

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createPart.mutate(
      { 
        data: { 
          name: formData.get("name") as string,
          partNumber: formData.get("partNumber") as string,
          category: formData.get("category") as string,
          description: formData.get("description") as string,
          supplier: formData.get("supplier") as string,
          price: parseFloat(formData.get("price") as string),
          quantity: parseInt(formData.get("quantity") as string, 10),
        } 
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPartsQueryKey() });
          setIsAddOpen(false);
          toast({ title: "Part added to inventory" });
        },
        onError: () => {
          toast({ title: "Failed to add part", variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Parts Catalog</h1>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Part
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Part</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="partNumber">Part Number</Label>
                  <Input id="partNumber" name="partNumber" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" name="category" required placeholder="e.g. Brakes, Body, Engine..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input id="price" name="price" type="number" min="0" step="0.01" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity in Stock</Label>
                  <Input id="quantity" name="quantity" type="number" min="0" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input id="supplier" name="supplier" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createPart.isPending}>
                  {createPart.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Part
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
                placeholder="Search by name, number, or category..."
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
                  <th className="h-10 px-4 text-left font-medium">Part Number</th>
                  <th className="h-10 px-4 text-left font-medium">Name & Category</th>
                  <th className="h-10 px-4 text-left font-medium">Supplier</th>
                  <th className="h-10 px-4 text-right font-medium">Price</th>
                  <th className="h-10 px-4 text-right font-medium">Stock</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    </td>
                  </tr>
                ) : parts?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="h-24 text-center text-muted-foreground">
                      No parts found.
                    </td>
                  </tr>
                ) : (
                  parts?.map(part => (
                    <tr key={part.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4 font-mono font-medium">{part.partNumber}</td>
                      <td className="p-4">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{part.name}</span>
                          <Badge variant="secondary" className="mt-1 font-normal text-xs">{part.category}</Badge>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">{part.supplier || '-'}</td>
                      <td className="p-4 text-right font-medium">${part.price.toFixed(2)}</td>
                      <td className="p-4 text-right">
                        <span className={part.quantity < 5 ? "text-destructive font-bold" : ""}>
                          {part.quantity}
                        </span>
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
