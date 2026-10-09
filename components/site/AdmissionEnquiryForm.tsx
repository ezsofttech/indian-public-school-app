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
  phone: z.string().regex(/^\d{10}$/, "Contact number must be 10 digits (numbers only)"),
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
            <h3 className="text-2xl font-extrabold text-white dark:text-white font-[var(--font-display)] drop-shadow-sm">
              Enquiry Received Successfully
            </h3>
            <p className="mx-auto max-w-md text-sm font-semibold leading-relaxed text-blue-100 dark:text-blue-100">
              Thank you! Your inquiry has been logged with our admissions desk. Our team will reach out to you shortly.
            </p>
          </div>

          {inquiryId && (
            <div
              className="mx-auto max-w-xs border border-blue-400/40 bg-slate-900/90 p-4 space-y-1 shadow-2xl backdrop-blur-md"
              style={{ borderRadius: "var(--card-radius, 1rem)" }}
            >
              <span className="block text-[11px] font-extrabold uppercase tracking-widest text-amber-300">
                Reference ID
              </span>
              <span className="font-mono text-lg font-black text-white tracking-wider block">
                {inquiryId}
              </span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-center gap-3">
            <Button
              variant="outline"
              className="border-slate-300 bg-white font-extrabold text-slate-900 hover:bg-slate-100 shadow-md cursor-pointer"
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
                className="bg-[#1a5d9c] hover:bg-blue-600 px-6 font-extrabold text-white shadow-md cursor-pointer border border-blue-400/30"
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
                          inputMode="numeric"
                          maxLength={10}
                          placeholder="e.g. 9876543210"
                          className="h-11 border-border bg-secondary/40 text-sm font-medium text-foreground focus:bg-card focus:border-[var(--primary)]"
                          style={{ borderRadius: "var(--btn-radius, 0.75rem)" }}
                          {...field}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            field.onChange(val);
                          }}
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

              {onClose ? (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="h-12 cursor-pointer bg-[#1a5d9c] hover:bg-blue-600 text-xs sm:text-sm font-extrabold text-white shadow-lg border border-blue-400/30 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                    style={{ borderRadius: "var(--btn-radius, 0.75rem)" }}
                  >
                    <i className="bi bi-pencil-square text-xs" />
                    <span>{submitting ? "Submitting..." : "ENQUIRE NOW"}</span>
                  </Button>
                  <Button
                    type="button"
                    onClick={onClose}
                    className="h-12 cursor-pointer bg-[#942b3b] hover:bg-rose-700 text-xs sm:text-sm font-extrabold text-white shadow-lg border border-rose-500/30 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                    style={{ borderRadius: "var(--btn-radius, 0.75rem)" }}
                  >
                    <i className="bi bi-x-circle text-xs" />
                    <span>CLOSE</span>
                  </Button>
                </div>
              ) : (
                <Button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 h-12 w-full cursor-pointer bg-[var(--primary)] text-sm font-extrabold text-[var(--primary-foreground)] shadow-md transition-all hover:bg-[var(--navy)]"
                  style={{ borderRadius: "var(--btn-radius, 1rem)" }}
                >
                  {submitting ? "Submitting..." : "Submit Admission Enquiry"}
                </Button>
              )}
            </form>
          </Form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

