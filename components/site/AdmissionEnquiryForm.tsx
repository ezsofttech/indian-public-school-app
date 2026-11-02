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
import { formatPhoneNumber, handlePhoneKeyDown } from "@/lib/utils";

const schema = z.object({
  fullName: z.string().min(2, "Please enter your full name"),
  phone: z.string().regex(/^\+?\d{10,12}$/, "Contact number must be 10 to 12 digits (with optional +)"),
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
  showCloseButton?: boolean;
  submitButtonText?: string;
  className?: string;
}

export function AdmissionEnquiryForm({
  defaultInquiryType,
  defaultGrade,
  onSuccess,
  onClose,
  showCloseButton = true,
  submitButtonText,
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
    const timestamp = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
    return `INQ-${timestamp}-${rand}`;
  };

  const onSubmit = async (values: AdmissionEnquiryFormValues) => {
    setSubmitting(true);
    const clientRefId = generateInquiryId();
    setInquiryId(clientRefId);

    try {
      const baseUrl = (
        process.env.NEXT_PUBLIC_BASE_URL ||
        process.env.API_BASE_URL ||
        "http://localhost:5000/api/v1"
      ).replace(/\/$/, "");

      const res = await axios.post(`${baseUrl}/inquiries`, {
        name: values.fullName,
        contact: values.phone,
        email: values.email,
        inquiryType: values.inquiryType,
        message: `${values.inquiryType} inquiry from website form (Ref: ${clientRefId})`,
      });

      const data = res.data?.data || res.data;
      if (data?.publicId && typeof data.publicId === "string" && data.publicId.trim()) {
        setInquiryId(data.publicId.trim());
      } else if (data?.id && !/^[0-9a-fA-F]{24}$/.test(String(data.id))) {
        setInquiryId(String(data.id));
      }
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
          className="py-6 sm:py-8 text-center space-y-4"
        >
          {/* Success Check Badge */}
          <div className="mx-auto size-14 rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-xs">
            <i className="bi bi-check-circle-fill text-2xl" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xl sm:text-2xl font-extrabold text-current font-[var(--font-display)] tracking-tight">
              Enquiry Received Successfully
            </h3>
            <p className="mx-auto max-w-md text-xs sm:text-sm font-medium leading-relaxed text-muted-foreground">
              Thank you! Your inquiry has been logged with our admissions desk. Our team will reach out to you shortly.
            </p>
          </div>

          {inquiryId && (
            <div
              className="mx-auto max-w-xs border border-border bg-secondary/60 dark:bg-card/80 p-4 space-y-1 shadow-xs"
              style={{ borderRadius: "var(--card-radius, 1rem)" }}
            >
              <span className="block text-[11px] font-extrabold uppercase tracking-widest text-[var(--primary)] dark:text-amber-400">
                Reference ID
              </span>
              <span className="font-mono text-lg sm:text-xl font-black text-foreground tracking-wider block">
                {inquiryId}
              </span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="border-border bg-card text-foreground hover:bg-secondary font-bold shadow-xs cursor-pointer"
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
                type="button"
                onClick={onClose}
                className="bg-[#1a5d9c] hover:bg-blue-600 px-6 font-bold text-white shadow-md cursor-pointer border border-blue-400/30 transition-all active:scale-95"
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
                        Name <span className="text-red-500 font-bold">*</span>
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
                        Contact Number <span className="text-red-500 font-bold">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          maxLength={13}
                          placeholder="+91 Mobile number"
                          className="h-11 border-border bg-secondary/40 text-sm font-medium text-foreground focus:bg-card focus:border-[var(--primary)]"
                          style={{ borderRadius: "var(--btn-radius, 0.75rem)" }}
                          {...field}
                          onKeyDown={handlePhoneKeyDown}
                          onChange={(e) => {
                            field.onChange(formatPhoneNumber(e.target.value));
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
                        Enquiry Type <span className="text-red-500 font-bold">*</span>
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

              {onClose && showCloseButton ? (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="h-12 cursor-pointer bg-[#1a5d9c] hover:bg-blue-600 text-xs sm:text-sm font-extrabold text-white shadow-lg border border-blue-400/30 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                    style={{ borderRadius: "var(--btn-radius, 0.75rem)" }}
                  >
                    <i className="bi bi-pencil-square text-xs" />
                    <span>{submitting ? "Submitting..." : (submitButtonText || "ENQUIRE NOW")}</span>
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
                  className={`mt-2 h-12 w-full cursor-pointer text-sm font-extrabold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${onClose
                    ? "bg-[#1a5d9c] hover:bg-blue-600 text-white border border-blue-400/30"
                    : "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--navy)] dark:bg-[#1a5d9c] dark:text-white dark:hover:bg-blue-600 dark:border dark:border-blue-400/30"
                    }`}
                  style={{
                    borderRadius: onClose
                      ? "var(--btn-radius, 0.75rem)"
                      : "var(--btn-radius, 1rem)",
                  }}
                >
                  {onClose && <i className="bi bi-pencil-square text-sm" />}
                  <span>
                    {submitting
                      ? "Submitting..."
                      : submitButtonText || (onClose ? "ENQUIRE NOW" : "Submit Admission Enquiry")}
                  </span>
                </Button>
              )}
            </form>
          </Form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

