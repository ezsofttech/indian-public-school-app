import { motion } from "motion/react";
import { Download, MessageSquare, PenLine } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EASE } from "@/lib/motion-presets";
import {
  firstSection,
  homeData,
  text,
  textList,
} from "@/lib/site-data";
import { useSiteData } from "@/components/site/SiteDataProvider";
import { openAdmissionModal } from "@/components/site/AdmissionApplicationModal";

export function AdmissionsCTA() {
  const section = firstSection(homeData(useSiteData()), "section-9");
  return (
    <section id="admissions" className="relative isolate overflow-hidden bg-navy-deep">

      <div className="container-page py-20 text-center lg:py-32">
        <motion.span
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="inline-flex items-center gap-2 rounded-full border border-gold/40 px-4 py-1.5 text-xs font-bold tracking-[0.18em] text-gold uppercase"
        >
          {text(section.heading, "Admissions Open")}
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
          className="mx-auto mt-6 max-w-3xl text-3xl leading-[1.1] text-navy-foreground sm:text-5xl lg:text-6xl"
        >
          {text(section.subHeading, "Give Your Child a Stronger Start")}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
          className="mx-auto mt-5 max-w-xl text-base text-navy-foreground/80 sm:text-lg"
        >
          {textList(section.description)[0]}
        </motion.p>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          variants={{
            show: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } },
          }}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 18 },
              show: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.5, ease: EASE },
              },
            }}
            className="w-full sm:w-auto"
          >
            <button
              type="button"
              onClick={() => openAdmissionModal()}
              className="inline-flex items-center justify-center h-11 px-8 rounded-full w-full sm:w-auto cursor-pointer font-bold bg-gold text-gold-foreground hover:bg-gold/90 transition-transform hover:scale-105"
            >
              <PenLine className="mr-1 size-4" />
              Enquiry
            </button>
          </motion.div>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 18 },
              show: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.5, ease: EASE },
              },
            }}
            className="w-full sm:w-auto"
          >
            <Button
              asChild
              size="lg"
              variant="glass"
              className="w-full rounded-full sm:w-auto"
            >
              <a href="#enquiry">
                <Download className="mr-1 size-4" />
                Download Prospectus
              </a>
            </Button>
          </motion.div>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 18 },
              show: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.5, ease: EASE },
              },
            }}
            className="w-full sm:w-auto"
          >
            <Button
              asChild
              size="lg"
              variant="glass"
              className="w-full rounded-full sm:w-auto"
            >
              <a href="#contact">
                <MessageSquare className="mr-1 size-4" />
                Contact Admission Office
              </a>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
