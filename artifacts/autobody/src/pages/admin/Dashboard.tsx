import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, CarFront, DollarSign, Users, Wrench } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Shop Overview</h1>
        <p className="text-muted-foreground mt-2">Real-time metrics and recent activity.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Wrench className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+2 from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">245</div>
            <p className="text-xs text-muted-foreground">+12 this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vehicles Serviced</CardTitle>
            <CarFront className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">310</div>
            <p className="text-xs text-muted-foreground">Lifetime</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue (MTD)</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231</div>
            <p className="text-xs text-muted-foreground">+$8,000 pending</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {/* Dummy data for now */}
              <div className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">Check-in created: 2018 Ford F-150</p>
                  <p className="text-sm text-muted-foreground">John Doe dropped off for collision repair</p>
                </div>
                <div className="ml-auto font-medium text-sm text-muted-foreground">2 hrs ago</div>
              </div>
              <div className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">Payment received: $1,250</p>
                  <p className="text-sm text-muted-foreground">Jane Smith paid for Check-in #104</p>
                </div>
                <div className="ml-auto font-medium text-sm text-muted-foreground">5 hrs ago</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <button className="w-full flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-left">
              <div className="bg-primary/20 p-2 rounded-md">
                <CarFront className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold">New Check-in</div>
                <div className="text-sm text-muted-foreground">Receive a vehicle</div>
              </div>
            </button>
            <button className="w-full flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-left">
              <div className="bg-primary/20 p-2 rounded-md">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold">Add Client</div>
                <div className="text-sm text-muted-foreground">Register new customer</div>
              </div>
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
