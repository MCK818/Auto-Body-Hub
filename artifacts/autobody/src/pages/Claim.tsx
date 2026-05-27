import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, Upload, X, Loader2, Camera, ChevronRight, ChevronLeft } from "lucide-react";

type PhotoPreview = { url: string; caption: string; name: string };

const STEPS = ["Your Info", "Vehicle Details", "Damage Photos", "Review & Submit"];

export default function Claim() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [claimId, setClaimId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [client, setClient] = useState({ name: "", phone: "", email: "", address: "" });
  const [vehicle, setVehicle] = useState({ make: "", model: "", year: "", licensePlate: "", vin: "", color: "", mileage: "" });
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      if (file.size > 10 * 1024 * 1024) { setError("Photos must be under 10MB each"); return; }
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotos((prev) => [...prev, { url: e.target?.result as string, caption: "Damage photo", name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (idx: number) => setPhotos((p) => p.filter((_, i) => i !== idx));

  const canNext = () => {
    if (step === 0) return client.name.trim() && client.phone.trim();
    if (step === 1) return vehicle.make.trim() && vehicle.model.trim() && vehicle.year.trim();
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client, vehicle, description, photos }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Submission failed");
      }
      const data = await res.json();
      setClaimId(data.checkinId);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (claimId) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 rounded-full p-5">
            <CheckCircle2 className="h-14 w-14 text-green-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-3">Claim Submitted!</h1>
        <p className="text-muted-foreground mb-6">
          Your claim has been received. Use the ID below to track your repair status.
        </p>
        <div className="bg-muted rounded-xl p-6 mb-8">
          <p className="text-sm text-muted-foreground mb-1">Your Repair / Claim ID</p>
          <p className="text-5xl font-bold text-primary tracking-wider">#{claimId}</p>
          <p className="text-sm text-muted-foreground mt-2">Save this number — you'll need it to track progress.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => setLocation(`/track?q=${claimId}`)} className="h-11 px-8">
            Track My Repair
          </Button>
          <Button variant="outline" onClick={() => setLocation("/")} className="h-11 px-8">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Submit a Damage Claim</h1>
        <p className="text-muted-foreground">Tell us about your vehicle and damage. We'll get back to you within 24 hours.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className={`flex items-center gap-2 ${i <= step ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                i < step ? "bg-primary border-primary text-primary-foreground" :
                i === step ? "border-primary text-primary" : "border-muted-foreground/30"
              }`}>
                {i < step ? "✓" : i + 1}
              </div>
              <span className="text-xs font-medium hidden sm:block">{label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${i < step ? "bg-primary" : "bg-muted-foreground/20"}`} />}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[step]}</CardTitle>
          <CardDescription>
            {step === 0 && "We need your contact info to follow up on the claim."}
            {step === 1 && "Provide your vehicle's details so we can prepare the right repair plan."}
            {step === 2 && "Upload photos of the damage — the more the better."}
            {step === 3 && "Review everything before submitting."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Step 0: Client Info */}
          {step === 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input placeholder="John Smith" value={client.name} onChange={e => setClient(c => ({ ...c, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number *</Label>
                  <Input placeholder="555-0100" value={client.phone} onChange={e => setClient(c => ({ ...c, phone: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input type="email" placeholder="john@email.com" value={client.email} onChange={e => setClient(c => ({ ...c, email: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Address (Optional)</Label>
                <Input placeholder="123 Main St, City, State" value={client.address} onChange={e => setClient(c => ({ ...c, address: e.target.value }))} />
              </div>
            </>
          )}

          {/* Step 1: Vehicle Info */}
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Make *</Label>
                  <Input placeholder="Toyota" value={vehicle.make} onChange={e => setVehicle(v => ({ ...v, make: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Model *</Label>
                  <Input placeholder="Camry" value={vehicle.model} onChange={e => setVehicle(v => ({ ...v, model: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Year *</Label>
                  <Input type="number" placeholder="2020" min="1900" max="2100" value={vehicle.year} onChange={e => setVehicle(v => ({ ...v, year: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Input placeholder="Silver" value={vehicle.color} onChange={e => setVehicle(v => ({ ...v, color: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>License Plate</Label>
                  <Input placeholder="ABC-1234" value={vehicle.licensePlate} onChange={e => setVehicle(v => ({ ...v, licensePlate: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Mileage</Label>
                  <Input type="number" placeholder="45000" value={vehicle.mileage} onChange={e => setVehicle(v => ({ ...v, mileage: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>VIN (Optional)</Label>
                <Input placeholder="1HGBH41JXMN109186" value={vehicle.vin} onChange={e => setVehicle(v => ({ ...v, vin: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Damage Description *</Label>
                <Textarea
                  placeholder="Describe what happened and where the damage is located on the vehicle..."
                  rows={4}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
            </>
          )}

          {/* Step 2: Photos */}
          {step === 2 && (
            <>
              <div
                className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
              >
                <Camera className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="font-medium mb-1">Drop photos here or click to upload</p>
                <p className="text-sm text-muted-foreground">JPG, PNG up to 10MB each · Up to 10 photos</p>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
              </div>

              {photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                  {photos.map((photo, i) => (
                    <div key={i} className="relative group rounded-lg overflow-hidden aspect-square bg-muted">
                      <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removePhoto(i)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-xs px-2 py-1 truncate">
                        {photo.name}
                      </div>
                    </div>
                  ))}
                  {photos.length < 10 && (
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="aspect-square rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                    >
                      <Upload className="h-6 w-6" />
                    </button>
                  )}
                </div>
              )}
              <p className="text-sm text-muted-foreground">Photos are optional but help us prepare a faster estimate.</p>
            </>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Contact</p>
                <p className="font-medium">{client.name}</p>
                <p className="text-sm text-muted-foreground">{client.phone}{client.email ? ` · ${client.email}` : ""}</p>
                {client.address && <p className="text-sm text-muted-foreground">{client.address}</p>}
              </div>
              <div className="rounded-lg bg-muted/50 p-4 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Vehicle</p>
                <p className="font-medium">{vehicle.year} {vehicle.make} {vehicle.model}{vehicle.color ? ` · ${vehicle.color}` : ""}</p>
                {vehicle.licensePlate && <p className="text-sm text-muted-foreground">Plate: {vehicle.licensePlate}</p>}
                {vehicle.vin && <p className="text-sm text-muted-foreground font-mono">VIN: {vehicle.vin}</p>}
                {vehicle.mileage && <p className="text-sm text-muted-foreground">{parseInt(vehicle.mileage).toLocaleString()} miles</p>}
              </div>
              {description && (
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Damage Description</p>
                  <p className="text-sm">{description}</p>
                </div>
              )}
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Photos</p>
                <p className="text-sm">{photos.length} photo{photos.length !== 1 ? "s" : ""} attached</p>
              </div>
              {error && <p className="text-sm text-destructive font-medium">{error}</p>}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => step === 0 ? setLocation("/") : setStep(s => s - 1)} className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              {step === 0 ? "Cancel" : "Back"}
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()} className="gap-2">
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting} className="gap-2 min-w-32">
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</> : "Submit Claim"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
