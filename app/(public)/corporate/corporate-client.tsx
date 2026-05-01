"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  Sparkles,
  Truck,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as corporateApi from "@/lib/api/corporate";

const initial = {
  companyName: "",
  gstin: "",
  contactName: "",
  email: "",
  phone: "",
  expectedVolume: "",
  requirements: "",
};

export default function CorporateClient() {
  const { toast } = useToast();
  const [form, setForm] = useState(initial);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.companyName.trim() ||
      !form.contactName.trim() ||
      !form.email.trim() ||
      !form.phone.trim()
    ) {
      toast({
        title: "Please fill in the required fields",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      await corporateApi.submitCorporateInquiry({
        companyName: form.companyName.trim(),
        gstin: form.gstin.trim() || undefined,
        contactName: form.contactName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        expectedVolume: form.expectedVolume.trim() || undefined,
        requirements: form.requirements.trim() || undefined,
      });
      setSubmitted(true);
      setForm(initial);
    } catch (e) {
      toast({
        title: "Submission failed",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-xl">
        <Card>
          <CardContent className="p-10 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold">Thanks — we&apos;ll be in touch</h2>
            <p className="text-gray-600">
              A sales agent will reach out within 1 business day with a quote.
            </p>
            <Button
              onClick={() => setSubmitted(false)}
              variant="outline"
              className="mt-4"
            >
              Submit another inquiry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 order-2 lg:order-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" /> Bulk & Corporate Orders
              </CardTitle>
              <CardDescription>
                Tell us about your order. We&apos;ll send you a quote with pricing,
                lead time, and customization options.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Company name *</Label>
                    <Input
                      value={form.companyName}
                      onChange={(e) =>
                        setForm({ ...form, companyName: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label>GSTIN (optional)</Label>
                    <Input
                      value={form.gstin}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          gstin: e.target.value.toUpperCase(),
                        })
                      }
                      maxLength={15}
                    />
                  </div>
                  <div>
                    <Label>Your name *</Label>
                    <Input
                      value={form.contactName}
                      onChange={(e) =>
                        setForm({ ...form, contactName: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label>Phone *</Label>
                    <Input
                      value={form.phone}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          phone: e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 10),
                        })
                      }
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label>Expected order size</Label>
                    <Input
                      placeholder="e.g. 200 t-shirts"
                      value={form.expectedVolume}
                      onChange={(e) =>
                        setForm({ ...form, expectedVolume: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label>What are you looking for?</Label>
                  <Textarea
                    rows={4}
                    placeholder="Custom logo printing, sizes, deadline, delivery location, etc."
                    value={form.requirements}
                    onChange={(e) =>
                      setForm({ ...form, requirements: e.target.value })
                    }
                  />
                </div>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold"
                  size="lg"
                >
                  {submitting && (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  )}
                  Get a quote
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 order-1 lg:order-2 space-y-4">
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-5 space-y-3">
              <Feature
                icon={Sparkles}
                title="Custom branding"
                desc="Your logo, your colors, your design."
              />
              <Feature
                icon={Truck}
                title="Pan-India delivery"
                desc="Bulk shipping to anywhere in India."
              />
              <Feature
                icon={Building2}
                title="GST invoice"
                desc="Get an ITC-eligible invoice with your GSTIN."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-yellow-600" />
      </div>
      <div>
        <p className="text-sm font-bold">{title}</p>
        <p className="text-xs text-gray-600">{desc}</p>
      </div>
    </div>
  );
}
