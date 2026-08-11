"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils/format";
import { requestEnterpriseService } from "@/features/billing/actions";
import type { EnterpriseService } from "@/features/billing/queries";

export function EnterpriseServicesGrid({ services, loggedIn }: { services: EnterpriseService[]; loggedIn: boolean }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {services.map((s) => (
        <ServiceCard key={s.id} service={s} loggedIn={loggedIn} />
      ))}
    </div>
  );
}

function ServiceCard({ service, loggedIn }: { service: EnterpriseService; loggedIn: boolean }) {
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(false);

  async function request() {
    setLoading(true);
    const res = await requestEnterpriseService(service.id);
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error ?? "Could not send request.");
      return;
    }
    setRequested(true);
    toast.success("Request sent — our team will reach out shortly.");
  }

  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col space-y-4 p-6">
        <div>
          <h3 className="font-bold">{service.name}</h3>
          {service.description ? <p className="mt-1 text-sm text-muted-foreground">{service.description}</p> : null}
        </div>
        <ul className="flex-1 space-y-2">
          {service.features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <p className="font-semibold">{service.priceInr !== null ? formatINR(service.priceInr) : "Contact us"}</p>
        {loggedIn ? (
          <Button variant="gradient" className="w-full" onClick={request} disabled={loading || requested}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {requested ? "Request sent" : "Request this service"}
          </Button>
        ) : (
          <a href="/login" className="block w-full rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-center text-sm font-medium text-white">
            Log in to request
          </a>
        )}
      </CardContent>
    </Card>
  );
}
