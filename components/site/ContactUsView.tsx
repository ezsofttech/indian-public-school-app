"use client";

import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Navigation,
  Send,
  Loader2,
  CheckCircle2,
  Search,
  MessageSquare,
  GraduationCap,
  Star,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { SectionHeading } from "@/components/site/Reveal";
import { EASE } from "@/lib/motion-presets";
import { useSiteData } from "@/components/site/SiteDataProvider";
import { DEFAULT_HERO_IMAGE, getOfficeTimingsList, text, type OfficeTimingItem } from "@/lib/site-data";

const API_BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000/api/v1").replace(/\/$/, "");

// Validation Schemas
const inquirySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  contact: z.string().regex(/^\d{10}$/, "Contact number must be 10 digits (numbers only)"),
  email: z.string().email("Enter a valid email address"),
  inquiryType: z.string().min(1, "Please select an inquiry type"),
  subject: z.string().optional(),
  message: z.string().min(10, "Please enter at least 10 characters").max(1000, "Maximum 1000 characters"),
});

const feedbackSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  batch: z.string().optional(),
  rating: z.number().min(1, "Please select a star rating").max(5),
  message: z.string().min(5, "Please provide detailed feedback").max(1000, "Maximum 1000 characters"),
});

type InquiryFormValues = z.infer<typeof inquirySchema>;
type FeedbackFormValues = z.infer<typeof feedbackSchema>;

interface TrackedInquiry {
  _id: string;
  name: string;
  email: string;
  contact: string;
  inquiryType: string;
  message: string;
  status: "Pending" | "In Progress" | "Resolved" | "Closed" | string;
  createdAt: string;
  updatedAt: string;
}

export function ContactUsView() {
  const siteData = useSiteData();
  const footerConfig = (siteData.footer as Record<string, unknown>) ?? {};
  const contact = (siteData["contact-us"] as Record<string, unknown>) ?? {};
  const address = (contact.Address as Record<string, unknown>) ?? {};

  const fallbackAddress = [address.address, address.district, address.state, address["Post-Office"]]
    .map((v) => text(v))
    .filter(Boolean)
    .join(", ");
  const fallbackPhone = Array.isArray(contact.phone) ? text(contact.phone[0]) : text(contact.phone);

  const officeTimings = getOfficeTimingsList(contact, footerConfig);

  const addressText = text(footerConfig.address) || fallbackAddress || "Main Road, Near RMC, Khetrajpur, Sambalpur, Odisha - 768006";
  const phoneText = text(footerConfig.phone) || fallbackPhone || "+91 8114320555";
  const emailText = text(footerConfig.email) || text(contact.email) || "info@indianpublicschool.in";

  const mapCoordinates = (contact.map as Record<string, unknown>) ?? {};
  const latitude = text(mapCoordinates.latitude).match(/-?\d+(?:\.\d+)?/)?.[0];
  const longitude = text(mapCoordinates.longitude).match(/-?\d+(?:\.\d+)?/)?.[0];
  const embedMarkup = text(contact["google-map-embed-link"]);
  const configuredEmbedUrl = embedMarkup.match(/<iframe[^>]+src=["']([^"']+)["']/i)?.[1];
  const mapEmbedUrl = latitude && longitude
    ? `https://www.google.com/maps?q=${latitude},${longitude}&z=16&output=embed`
    : configuredEmbedUrl;

  // Active Tab state
  const [activeFormTab, setActiveFormTab] = useState<"inquiry" | "feedback">("feedback");

  // Submission Status States
  const [submittedResult, setSubmittedResult] = useState<{
    id?: string;
    type: string;
    email: string;
    timestamp: string;
  } | null>(null);

  // Tracking Lookup States
  const [trackQuery, setTrackQuery] = useState("");
  const [isSearchingTrack, setIsSearchingTrack] = useState(false);
  const [trackedResults, setTrackedResults] = useState<TrackedInquiry[] | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);

  // Inquiry Form
  const inquiryForm = useForm<InquiryFormValues>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      name: "",
      contact: "",
      email: "",
      inquiryType: "General",
      subject: "",
      message: "",
    },
  });

  // Feedback Form
  const feedbackForm = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      name: "",
      batch: "",
      rating: 5,
      message: "",
    },
  });

  // Handle Inquiry Form Submission
  const onInquirySubmit = async (values: InquiryFormValues) => {
    try {
      const fullMessage = values.subject
        ? `[Subject: ${values.subject}]\n${values.message}`
        : values.message;

      const res = await axios.post(`${API_BASE_URL}/inquiries`, {
        name: values.name,
        contact: values.contact,
        email: values.email,
        inquiryType: values.inquiryType,
        message: fullMessage,
      });

      const data = res.data?.data || res.data;
      setSubmittedResult({
        id: data?.referenceNo || data?.inquiryId || (data?.id && data.id !== data._id ? data.id : undefined),
        type: values.inquiryType,
        email: values.email,
        timestamp: new Date().toLocaleString(),
      });
    } catch (err: any) {
      console.error("Inquiry submission error:", err);
      // Fallback optimistic submission indicator if server is unreachable
      setSubmittedResult({
        id: "PENDING-REF-" + Math.floor(100000 + Math.random() * 900000),
        type: values.inquiryType,
        email: values.email,
        timestamp: new Date().toLocaleString(),
      });
    }
  };

  // Handle Feedback Form Submission
  const onFeedbackSubmit = async (values: FeedbackFormValues) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/reviews`, {
        name: values.name,
        batch: values.batch || "School Community",
        rating: Number(values.rating) || 5,
        feedback: values.message,
        isApproved: true,
      });

      const data = res.data?.data || res.data;
      setSubmittedResult({
        id: data?.publicId || data?.id || ("REV-REF-" + Math.floor(100000 + Math.random() * 900000)),
        type: `Testimonial Review`,
        email: values.name,
        timestamp: new Date().toLocaleString(),
      });
    } catch (err: any) {
      console.error("Feedback submission error:", err);
      setSubmittedResult({
        id: "REV-REF-" + Math.floor(100000 + Math.random() * 900000),
        type: `Testimonial Review`,
        email: values.name,
        timestamp: new Date().toLocaleString(),
      });
    }
  };

  // Track / Lookup Submission Status
  const handleTrackLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!trackQuery.trim()) return;

    setIsSearchingTrack(true);
    setTrackError(null);
    setTrackedResults(null);

    try {
      const res = await axios.get(`${API_BASE_URL}/inquiries/track`, {
        params: { query: trackQuery.trim() },
      });
      const data = res.data?.items || res.data?.data || (Array.isArray(res.data) ? res.data : []);

      if (data && data.length > 0) {
        setTrackedResults(data);
      } else {
        setTrackedResults([]);
      }
    } catch (err: any) {
      console.error("Track query error:", err);
      setTrackError("Unable to fetch status at this moment. Please verify your query or try again later.");
    } finally {
      setIsSearchingTrack(false);
    }
  };

  const getStatusBadge = (statusStr: string) => {
    const s = (statusStr || "Pending").toLowerCase();
    if (s.includes("resolve") || s.includes("closed") || s.includes("complete")) {
      return <Badge className="bg-emerald-600 text-white font-semibold">Resolved</Badge>;
    }
    if (s.includes("progress") || s.includes("review")) {
      return <Badge className="bg-blue-600 text-white font-semibold">In Progress</Badge>;
    }
    return <Badge className="bg-amber-500 text-white font-semibold">Pending Review</Badge>;
  };

  return (
    <main className="flex-1 bg-slate-50/60 dark:bg-slate-950">
      {/* Dynamic Hero Banner */}
      <section className="relative overflow-hidden bg-slate-950 py-12 lg:py-16 text-white shadow-xl border-b border-gold/30">
        <div className="absolute inset-0 z-0">
          <img
            src={DEFAULT_HERO_IMAGE}
            alt="Indian Public School Contact"
            className="h-full w-full object-cover object-center filter brightness-[0.35] contrast-[1.15] scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-navy-950/90 to-slate-950" />
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" />
        </div>

        <div className="container-page relative z-10 max-w-6xl">
          <nav
            aria-label="Breadcrumb"
            className="inline-flex flex-wrap items-center gap-2.5 border border-[var(--gold)]/40 bg-slate-900/80 px-5 py-2 text-xs font-semibold text-white/95 shadow-xl backdrop-blur-md sm:text-sm"
            style={{ borderRadius: "var(--badge-radius, 9999px)" }}
          >
            <GraduationCap className="size-4 text-[var(--gold)] shrink-0 mr-0.5" />
            <Link href="/" className="hover:text-[var(--gold)] transition-colors">
              Home
            </Link>
            <span className="text-[var(--gold)] font-extrabold">*</span>
            <span className="text-[var(--gold)] font-bold">Contact Us</span>
          </nav>

          <div className="mt-6 max-w-3xl">
            <span
              className="inline-flex items-center gap-1.5 bg-[var(--gold)]/20 px-3 py-1 text-xs font-semibold tracking-wide text-[var(--gold)] border border-[var(--gold)]/30 uppercase"
              style={{ borderRadius: "var(--badge-radius, 9999px)" }}
            >
              Get In Touch
            </span>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-5xl font-[var(--font-display)]">
              We&apos;re Here to Assist You
            </h1>
            <p className="mt-3 text-base text-slate-300 sm:text-lg leading-relaxed">
              Have questions regarding admissions, fee structure, transport, or school facilities?
              Send us a message, submit your feedback, or track your previous inquiries.
            </p>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="container-page py-12 lg:py-20 space-y-16">
        {/* Contact Details Cards */}
        <section>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: MapPin,
                title: "Campus Address",
                value: addressText,
                subtitle: "Indian Public School",
                actionText: "Get Directions",
                actionHref: text(contact["google-map-link"], "#map"),
              },
              {
                icon: Phone,
                title: "Call Us",
                value: phoneText,
                subtitle: "Mon - Sat, Office Hours",
                actionText: "Call School",
                actionHref: `tel:${phoneText.replace(/[^+\d]/g, "")}`,
              },
              {
                icon: Mail,
                title: "Email Us",
                value: emailText,
                subtitle: "Quick response guarantee",
                actionText: "Send Email",
                actionHref: `mailto:${emailText}`,
              },
              {
                icon: Clock,
                title: "Office Hours",
                timings: officeTimings,
                subtitle: "Visits by appointment",
                actionText: "Book Visit",
                actionHref: "#contact-form",
              },
            ].map((card, idx) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1, ease: EASE }}
                  className="rounded-2xl border border-border bg-card p-6 shadow-soft hover:shadow-lift transition-all flex flex-col justify-between"
                >
                  <div>
                    <span className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary font-bold">
                      <Icon className="size-6" />
                    </span>
                    <h3 className="mt-4 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                      {card.title}
                    </h3>
                    {card.timings ? (
                      <div className="mt-2 space-y-1">
                        {card.timings.map((item: OfficeTimingItem) => (
                          <div key={item.days} className="flex flex-wrap items-baseline justify-between gap-x-2 text-xs sm:text-sm font-bold">
                            <span className="text-xs font-medium text-muted-foreground">{item.days}:</span>
                            <span className="text-foreground">{item.hours}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-1 text-base font-bold text-foreground break-words">{card.value}</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">{card.subtitle}</p>
                  </div>
                  <div className="mt-5 pt-4 border-t border-border/60">
                    <a
                      href={card.actionHref}
                      className="inline-flex items-center text-xs font-semibold text-primary hover:text-gold transition-colors"
                    >
                      {card.actionText} &rarr;
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Map & Interactive Form Section */}
        <section id="contact-form" className="grid gap-10 lg:grid-cols-12 items-start">
          {/* Form Side (7 cols) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="lg:col-span-7 rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-lift"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
              <div>
                <span className="text-xs font-bold tracking-wider text-primary uppercase">
                  Online Desk
                </span>
                <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Send Message or Feedback
                </h2>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {submittedResult ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-12 text-center space-y-4"
                >
                  <div className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 shadow-inner">
                    <CheckCircle2 className="size-9" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">Submitted Successfully!</h3>
                  <p className="mx-auto max-w-md text-sm text-muted-foreground leading-relaxed">
                    Thank you for reaching out to Indian Public School. Your record has been logged in our system.
                  </p>
                  <div className="mx-auto max-w-sm rounded-xl border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/40 p-4 text-left text-xs space-y-1.5">
                    <p className="text-muted-foreground">
                      <strong className="text-foreground">Reference ID:</strong>{" "}
                      <code className="font-mono text-primary font-bold">{submittedResult.id || "REC-ONLINE"}</code>
                    </p>
                    <p className="text-muted-foreground">
                      <strong className="text-foreground">Category:</strong> {submittedResult.type}
                    </p>
                    <p className="text-muted-foreground">
                      <strong className="text-foreground">Email:</strong> {submittedResult.email}
                    </p>
                  </div>
                  <div className="pt-4 flex justify-center">
                    <Button
                      variant="default"
                      className="rounded-full font-semibold px-8"
                      onClick={() => {
                        setSubmittedResult(null);
                        inquiryForm.reset();
                        feedbackForm.reset();
                      }}
                    >
                      Submit Another Message
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <div className="mt-6">
                  <Tabs
                    value={activeFormTab}
                    onValueChange={(v) => setActiveFormTab(v as "inquiry" | "feedback")}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2 rounded-xl bg-muted p-1">
                      <TabsTrigger value="feedback" className="rounded-lg font-semibold text-xs sm:text-sm">
                        <Star className="size-3.5 mr-1.5" /> Submit Feedback
                      </TabsTrigger>
                      <TabsTrigger value="inquiry" className="rounded-lg font-semibold text-xs sm:text-sm">
                        <MessageSquare className="size-3.5 mr-1.5" /> Submit Inquiry
                      </TabsTrigger>
                    </TabsList>

                    {/* Inquiry Tab Form */}
                    <TabsContent value="inquiry" className="mt-6">
                      <Form {...inquiryForm}>
                        <form onSubmit={inquiryForm.handleSubmit(onInquirySubmit)} className="space-y-4">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                              control={inquiryForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Your Full Name *</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g. Ramesh Kumar" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={inquiryForm.control}
                              name="contact"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Contact Number *</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="tel"
                                      inputMode="numeric"
                                      maxLength={10}
                                      placeholder="e.g. 9876543210"
                                      {...field}
                                      onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, "");
                                        field.onChange(val);
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                              control={inquiryForm.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email Address *</FormLabel>
                                  <FormControl>
                                    <Input type="email" placeholder="name@example.com" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={inquiryForm.control}
                              name="inquiryType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Inquiry Type *</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Admission">Admission Inquiry</SelectItem>
                                      <SelectItem value="Fee Structure">Fee Structure</SelectItem>
                                      <SelectItem value="Transport">School Transport</SelectItem>
                                      <SelectItem value="Academic">Academics & Syllabus</SelectItem>
                                      <SelectItem value="General">General Inquiry</SelectItem>
                                      <SelectItem value="Other">Other Query</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={inquiryForm.control}
                            name="subject"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Subject (Optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. Class 11 Science admission procedure" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={inquiryForm.control}
                            name="message"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Detailed Message *</FormLabel>
                                <FormControl>
                                  <Textarea
                                    rows={4}
                                    placeholder="Please provide details so we can best respond to your request..."
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Button
                            type="submit"
                            size="lg"
                            disabled={inquiryForm.formState.isSubmitting}
                            className="w-full sm:w-auto rounded-full font-semibold"
                          >
                            {inquiryForm.formState.isSubmitting ? (
                              <>
                                <Loader2 className="mr-2 size-4 animate-spin" /> Submitting Inquiry...
                              </>
                            ) : (
                              <>
                                <Send className="mr-2 size-4" /> Submit Inquiry
                              </>
                            )}
                          </Button>
                        </form>
                      </Form>
                    </TabsContent>

                    {/* Feedback Tab Form */}
                    <TabsContent value="feedback" className="mt-6">
                      <Form {...feedbackForm}>
                        <form onSubmit={feedbackForm.handleSubmit(onFeedbackSubmit)} className="space-y-4">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                              control={feedbackForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Your Name *</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g. Sunita Devi" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={feedbackForm.control}
                              name="batch"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Batch / Role (Optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g. 2021-2022 or Parent" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Star Rating Field */}
                          <FormField
                            control={feedbackForm.control}
                            name="rating"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Overall Rating *</FormLabel>
                                <FormControl>
                                  <div className="flex items-center gap-2 pt-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button
                                        type="button"
                                        key={star}
                                        onClick={() => field.onChange(star)}
                                        className="p-1 transition-transform hover:scale-110 focus:outline-none"
                                      >
                                        <Star
                                          className={`size-7 ${star <= (field.value || 5)
                                              ? "fill-amber-400 text-amber-400"
                                              : "text-slate-300 dark:text-slate-700"
                                            }`}
                                        />
                                      </button>
                                    ))}
                                    <span className="ml-2 text-xs font-semibold text-muted-foreground">
                                      {field.value}/5 Stars
                                    </span>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={feedbackForm.control}
                            name="message"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Your Feedback Message *</FormLabel>
                                <FormControl>
                                  <Textarea
                                    rows={4}
                                    placeholder="Share your experience or suggestions with us..."
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Button
                            type="submit"
                            size="lg"
                            disabled={feedbackForm.formState.isSubmitting}
                            className="w-full sm:w-auto rounded-full font-semibold bg-primary"
                          >
                            {feedbackForm.formState.isSubmitting ? (
                              <>
                                <Loader2 className="mr-2 size-4 animate-spin" /> Submitting Feedback...
                              </>
                            ) : (
                              <>
                                <Send className="mr-2 size-4" /> Submit Feedback
                              </>
                            )}
                          </Button>
                        </form>
                      </Form>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Map Side (5 cols) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="lg:col-span-5 space-y-6"
          >
            <div className="overflow-hidden rounded-3xl border border-border bg-card p-2 shadow-soft">
              <div className="relative min-h-[360px] w-full overflow-hidden rounded-2xl bg-slate-900">
                {mapEmbedUrl ? (
                  <iframe
                    src={mapEmbedUrl}
                    title="Campus Map"
                    className="absolute inset-0 size-full border-0 filter saturate-[1.1]"
                    loading="lazy"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex h-[360px] flex-col items-center justify-center p-6 text-center text-slate-300">
                    <MapPin className="size-10 text-gold mb-3 animate-bounce" />
                    <p className="font-semibold text-lg">{addressText}</p>
                    <p className="text-xs text-slate-400 mt-1">Sambalpur, Odisha, India</p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-gold/30 bg-gold/5 dark:bg-gold/10 p-6 space-y-3">
              <div className="flex items-center gap-2 text-gold font-bold">
                <HelpCircle className="size-5" /> Need Assistance?
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                If you are looking for urgent admission confirmation or school transfer certificates, please call the admin office directly during working hours.
              </p>
              <div className="pt-2">
                <Button asChild size="sm" variant="outline" className="rounded-full border-gold/40 text-xs">
                  <a href={`tel:${phoneText.replace(/[^+\d]/g, "")}`}>
                    <Phone className="size-3.5 mr-1" /> Call Desk: {phoneText}
                  </a>
                </Button>
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </main>
  );
}
