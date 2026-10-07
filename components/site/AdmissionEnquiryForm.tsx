"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  fullName: z.string().min(2, "Please enter your full name"),
  phone: z.string().regex(/^[0-9+\-\s]{8,15}$/, "Enter a valid phone number"),
  inquiryType: z.string().min(1, "Select enquiry type"),
  email: z.string().email("Enter a valid email address"),
});

export type AdmissionEnquiryFormValues = z.infer<typeof schema>;

export const ENQUIRY_TYPES = ["Admission", "Career", "Information"] as const;

interface AdmissionEnquiryFormProps {
  defaultInquiryType?: string;
  defaultGrade?: string;
  onSuccess?: () => void;
  onClose?: () => void;
  className?: string;
}

export function AdmissionEnquiryForm({
  defaultInquiryType,
  defaultGrade,
  onSuccess,
  onClose,
  className = "",
}: AdmissionEnquiryFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [inquiryId, setInquiryId] = useState("");

  const form = useForm<AdmissionEnquiryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      phone: "",
      inquiryType: defaultInquiryType || "Admission",
      email: "",
    },
  });

  useEffect(() => {
    if (defaultInquiryType) {
      form.setValue("inquiryType", defaultInquiryType);
    } else if (defaultGrade) {
      form.setValue("inquiryType", "Admission");
    }
  }, [defaultInquiryType, defaultGrade, form]);

  const generateInquiryId = () => {
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `IPS-ENQ-${year}-${rand}`;
  };

  const onSubmit = async (values: AdmissionEnquiryFormValues) => {
    setSubmitting(true);
    const refId = generateInquiryId();
    setInquiryId(refId);

    try {
      const baseUrl = (
        process.env.NEXT_PUBLIC_BASE_URL ||
        process.env.API_BASE_URL ||
        "http://localhost:5000/api/v1"
      ).replace(/\/$/, "");

      await axios.post(`${baseUrl}/inquiries`, {
        name: values.fullName,
        contact: values.phone,
        email: values.email,
        inquiryType: values.inquiryType,
        message: `${values.inquiryType} inquiry from website form (Ref: ${refId})`,
      });
    } catch (err) {
      console.error("Enquiry submission error:", err);
    } finally {
      setSubmitting(false);
      setSubmitted(true);
      if (onSuccess) onSuccess();
    }
  };

  return (
    <AnimatePresence mode="wait">
      {submitted ? (
        <motion.div
          key="done"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="py-8 text-center space-y-4"
        >
          <div className="space-y-2">
            <h3 className="text-2xl font-extrabold text-foreground font-[var(--font-display)]">
              Enquiry Received Successfully
            </h3>
            <p className="mx-auto max-w-md text-sm font-medium leading-relaxed text-muted-foreground">
              Thank you! Your inquiry has been logged with our admissions desk. Our team will reach out to you shortly.
            </p>
          </div>

          {inquiryId && (
            <div
              className="mx-auto max-w-xs border border-[var(--primary)]/20 bg-[var(--primary)]/5 p-3 space-y-0.5"
              style={{ borderRadius: "var(--card-radius, 1rem)" }}
            >
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[var(--primary)]">
                Reference ID
              </span>
              <span className="font-mono text-base font-bold text-foreground">
                {inquiryId}
              </span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-center gap-3">
            <Button
              variant="outline"
              className="border-border font-bold text-[var(--primary)] hover:bg-[var(--primary)]/10"
              style={{ borderRadius: "var(--btn-radius, 0.75rem)" }}
              onClick={() => {
                form.reset();
                setSubmitted(false);
              }}
            >
              Submit Another Enquiry
            </Button>
            {onClose && (
              <Button
                onClick={onClose}
                className="bg-[var(--primary)] px-6 font-bold text-[var(--primary-foreground)] hover:bg-[var(--navy)]"
                style={{ borderRadius: "var(--btn-radius, 0.75rem)" }}
              >
                Done
              </Button>
            )}
          </div>
        </motion.div>
      ) : (
        <motion.div key="form" exit={{ opacity: 0 }} className={className}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                {/* Field 1: Full Name */}
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-foreground">
                        Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Rahul Sharma"
                          className="h-11 border-border bg-secondary/40 text-sm font-medium text-foreground focus:bg-card focus:border-[var(--primary)]"
                          style={{ borderRadius: "var(--btn-radius, 0.75rem)" }}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                {/* Field 2: Phone */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-foreground">
                        Contact Number
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          inputMode="tel"
                          placeholder="e.g. +91 9876543210"
                          className="h-11 border-border bg-secondary/40 text-sm font-medium text-foreground focus:bg-card focus:border-[var(--primary)]"
                          style={{ borderRadius: "var(--btn-radius, 0.75rem)" }}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                {/* Field 3: Enquiry Type */}
                <FormField
                  control={form.control}
                  name="inquiryType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-foreground">
                        Enquiry Type
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "Admission"}>
                        <FormControl>
                          <SelectTrigger
                            className="h-11 border-border bg-secondary/40 text-sm font-medium text-foreground focus:bg-card focus:border-[var(--primary)] cursor-pointer"
                            style={{ borderRadius: "var(--btn-radius, 0.75rem)" }}
                          >
                            <SelectValue placeholder="Select enquiry type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="z-[10001] bg-card text-card-foreground border border-border shadow-2xl">
                          {ENQUIRY_TYPES.map((type) => (
                            <SelectItem key={type} value={type} className="cursor-pointer font-medium py-2.5 hover:bg-secondary focus:bg-secondary">
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                {/* Field 4: Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-foreground">
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          className="h-11 border-border bg-secondary/40 text-sm font-medium text-foreground focus:bg-card focus:border-[var(--primary)]"
                          style={{ borderRadius: "var(--btn-radius, 0.75rem)" }}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="mt-2 h-12 w-full cursor-pointer bg-[var(--primary)] text-sm font-extrabold text-[var(--primary-foreground)] shadow-md transition-all hover:bg-[var(--navy)]"
                style={{ borderRadius: "var(--btn-radius, 1rem)" }}
              >
                {submitting ? "Submitting..." : "Submit Admission Enquiry"}
              </Button>
            </form>
          </Form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

