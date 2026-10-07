"use client";

import { motion } from "motion/react";
import { SectionHeading } from "@/components/site/Reveal";
import { EASE } from "@/lib/motion-presets";
import { AdmissionEnquiryForm } from "@/components/site/AdmissionEnquiryForm";
import { firstSection, homeData, text, textList } from "@/lib/site-data";
import { useSiteData } from "@/components/site/SiteDataProvider";

export function EnquiryForm() {
  const section = firstSection(homeData(useSiteData()), "section-10");

  return (
    <section id="enquiry" className="bg-secondary/30 py-16 lg:py-24 border-t border-border">
      <div className="container-page">
        <SectionHeading
          eyebrow={text(section.heading, "Admission Enquiry")}
          title={text(section.subHeading, "Start Your Child's Journey")}
          description={
            textList(section.description)[0] ||
            "Fill out the 4 quick details below and the Indian Public School admissions desk will get in touch with you shortly."
          }
        />

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mx-auto mt-10 max-w-2xl border border-border bg-card text-card-foreground p-6 shadow-xl sm:p-10"
          style={{ borderRadius: "var(--card-radius, 1.5rem)" }}
        >
          <AdmissionEnquiryForm />
        </motion.div>
      </div>
    </section>
  );
}


