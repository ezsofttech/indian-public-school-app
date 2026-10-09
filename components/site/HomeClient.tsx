"use client";

import { motion } from "motion/react";
import { Hero } from "@/components/site/Hero";
import { QuickActions } from "@/components/site/QuickActions";
import { About } from "@/components/site/About";
import { Stats } from "@/components/site/Stats";
import { WhyChoose } from "@/components/site/WhyChoose";
import { Academics } from "@/components/site/Academics";
import { SchoolIntroduction } from "@/components/site/SchoolIntroduction";
import { Infrastructure } from "@/components/site/Infrastructure";
import { StudentLife } from "@/components/site/StudentLife";
import { Achievements } from "@/components/site/Achievements";
import { Testimonials } from "@/components/site/Testimonials";
import { NewsEvents } from "@/components/site/NewsEvents";
import { Gallery } from "@/components/site/Gallery";
import { EnquiryForm } from "@/components/site/EnquiryForm";
import { Contact } from "@/components/site/Contact";

export function HomeClient() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
      <main>
        <Hero />
        <QuickActions />
        <About />
        <Stats />
        <WhyChoose />
        <Academics />
        <Infrastructure />
        <StudentLife />
        <Achievements />
        <SchoolIntroduction />
        <Testimonials />
        <NewsEvents />
        <Gallery />
        <EnquiryForm />
        <Contact />
      </main>
    </motion.div>
  );
}
