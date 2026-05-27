import { useState } from "react";
import { useListPayments, useCreatePayment, useListClients, useListCheckins } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListPaymentsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Plus, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
const PAYMENT_STATUSES = ["pending", "paid", "partial", "refunded"];
const PAYMENT_METHODS = ["cash", "card", "check", "financing"];

export default function Payments() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { data: payments, isLoading } = useListPayments({ status: statusFilter === "all" ? undefined : statusFilter });
  const { data: clients } = useListClients();
  const { data: checkins } = useListCheckins();
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createPayment = useCreatePayment();

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createPayment.mutate(
      { 
        data: { 
          clientId: parseInt(formData.get("clientId") as string, 10),
          checkinId: parseInt(formData.get("checkinId") as string, 10),
          amount: parseFloat(formData.get("amount") as string),
          status: formData.get("status") as any,
          method: (formData.get("method") as any) || undefined,
          notes: formData.get("notes") as string,
        } 
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPaymentsQueryKey() });
          setIsAddOpen(false);
          toast({ title: "Payment recorded" });
        },
        onError: () => {
          toast({ title: "Failed to record payment", variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clientId">Client</Label>
                <Select name="clientId" required>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>
                    {clients?.map(client => (
                      <SelectItem key={client.id} value={client.id.toString()}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkinId">Check-in / Invoice</Label>
                <Select name="checkinId" required>
                  <SelectTrigger><SelectValue placeholder="Select check-in" /></SelectTrigger>
                  <SelectContent>
                    {checkins?.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>#{c.id} - {c.status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input id="amount" name="amount" type="number" step="0.01" min="0" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue="paid" required>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAYMENT_STATUSES.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="method">Method</Label>
                  <Select name="method" required>
                    <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" name="notes" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createPayment.isPending}>
                  {createPayment.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Payment
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 pb-2 overflow-x-auto">
        {["all", ...PAYMENT_STATUSES].map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(status)}
            className="capitalize"
          >
            {status}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="border-t">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-muted-foreground">
                  <th className="h-10 px-4 text-left font-medium">Invoice</th>
                  <th className="h-10 px-4 text-left font-medium">Client</th>
                  <th className="h-10 px-4 text-left font-medium">Date</th>
                  <th className="h-10 px-4 text-right font-medium">Amount</th>
                  <th className="h-10 px-4 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    </td>
                  </tr>
                ) : payments?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="h-24 text-center text-muted-foreground">
                      No payments found.
                    </td>
                  </tr>
                ) : (
                  payments?.map(payment => {
                    const client = clients?.find(c => c.id === payment.clientId);
                    return (
                      <tr key={payment.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-4 font-medium">#{payment.checkinId}</td>
                        <td className="p-4">{client?.name || `Client #${payment.clientId}`}</td>
                        <td className="p-4 text-muted-foreground">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right font-medium">
                          ${payment.amount.toFixed(2)}
                        </td>
                        <td className="p-4 text-right">
                          <Badge variant={payment.status === "paid" ? "default" : "outline"} className="uppercase">
                            {payment.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
