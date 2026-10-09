import type { Metadata } from "next";
import { GraduationCap, ShieldCheck, FileText, Calendar } from "lucide-react";
import { AdmissionForm } from "@/components/site/AdmissionApplicationModal";
import { getPageSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = getPageSeoMetadata("admission", "/admission");



export default function AdmissionPage() {
  return (
    <main className="flex-1 bg-background text-foreground min-h-screen">
      {/* Banner / Hero - Royal School Navy */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#102a4c] via-[#1a5d9c] to-[#102a4c] py-16 sm:py-24 text-white border-b border-amber-400/30">
        <div className="container-page relative z-10 max-w-5xl text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-400/20 px-4 py-1.5 text-xs font-bold tracking-wider text-amber-300 uppercase shadow-md">
            <GraduationCap className="size-4 text-amber-300" />
            Admissions Open — Session 2026–27
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-white drop-shadow-sm">
            Online Admission Portal
          </h1>
          <p className="mx-auto max-w-2xl text-sm sm:text-base text-slate-100 leading-relaxed">
            Welcome to Indian Public School online admission system. Complete the application form below to begin your child's journey toward academic excellence.
          </p>
        </div>
      </section>

      {/* Guidelines & Form Container */}
      <section className="container-page py-12 lg:py-20 max-w-6xl space-y-12">
        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-border bg-card text-card-foreground p-6 space-y-2 shadow-xs">
            <div className="grid size-12 place-items-center rounded-xl bg-amber-400/20 text-gold mb-4">
              <FileText className="size-6" />
            </div>
            <h3 className="font-bold text-lg text-foreground">1. Submit Form</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Provide student details, parent contact information, and class selection online.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card text-card-foreground p-6 space-y-2 shadow-xs">
            <div className="grid size-12 place-items-center rounded-xl bg-amber-400/20 text-gold mb-4">
              <Calendar className="size-6" />
            </div>
            <h3 className="font-bold text-lg text-foreground">2. Interaction Slot</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Our admissions team will contact you within 24 hours to schedule a campus visit and interaction.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card text-card-foreground p-6 space-y-2 shadow-xs">
            <div className="grid size-12 place-items-center rounded-xl bg-amber-400/20 text-gold mb-4">
              <ShieldCheck className="size-6" />
            </div>
            <h3 className="font-bold text-lg text-foreground">3. Final Enrollment</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Verify original documents, complete fee submission, and finalize admission enrollment.
            </p>
          </div>
        </div>

        {/* Embedded Form Card */}
        <div className="rounded-3xl border border-border bg-card text-card-foreground p-6 sm:p-10 shadow-lift">
          <div className="mb-8 border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-bold uppercase text-gold border border-amber-400/30 mb-2">
                Official Application Form
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Student Registration Form
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xs">
              Please fill out all mandatory fields marked with (*).
            </p>
          </div>

          <AdmissionForm />
        </div>
      </section>
    </main>
  );
}
