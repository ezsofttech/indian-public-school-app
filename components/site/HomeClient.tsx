"use client";

import { motion } from "motion/react";
import { Hero } from "@/components/site/Hero";
import { QuickActions } from "@/components/site/QuickActions";
import { About } from "@/components/site/About";
import { Stats } from "@/components/site/Stats";
import { WhyChoose } from "@/components/site/WhyChoose";
import { Academics } from "@/components/site/Academics";
import { IntroVideo } from "@/components/site/IntroVideo";
import { SchoolIntroduction } from "@/components/site/SchoolIntroduction";
import { BeyondClassroom } from "@/components/site/BeyondClassroom";
import { Infrastructure } from "@/components/site/Infrastructure";
import { StudentLife } from "@/components/site/StudentLife";
import { Achievements } from "@/components/site/Achievements";
import { Testimonials } from "@/components/site/Testimonials";
import { NewsEvents } from "@/components/site/NewsEvents";
import { Gallery } from "@/components/site/Gallery";
import { AdmissionsCTA } from "@/components/site/AdmissionsCTA";
import { processHtmlAssetUrls } from "@/lib/site-data";
import { EnquiryForm } from "@/components/site/EnquiryForm";
import { Contact } from "@/components/site/Contact";

export function HomeClient({ textContent }: { textContent?: string | null }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
      <main>
        <Hero />
        <QuickActions />
        {textContent && textContent.trim().length > 0 && (
          <section className="bg-slate-50 py-8 border-y border-slate-100">
            <div className="container-page mx-auto max-w-6xl px-4 sm:px-6">
              <div
                className="prose max-w-none space-y-6 text-slate-800 leading-relaxed font-sans dynamic-page-content"
                dangerouslySetInnerHTML={{ __html: processHtmlAssetUrls(textContent) }}
              />
            </div>
          </section>
        )}
        <About />
        <Stats />
        <WhyChoose />
        <Academics />
        <BeyondClassroom />
        <Infrastructure />
        <StudentLife />
        <Achievements />
        <SchoolIntroduction />
        <Testimonials />
        <NewsEvents />
        <Gallery />
        <AdmissionsCTA />
        <EnquiryForm />
        <Contact />
      </main>
    </motion.div>
  );
}
