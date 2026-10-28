import { motion } from "motion/react";
import type { ReactNode } from "react";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion-presets";
import { cn } from "@/lib/utils";

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerGroup({
  children,
  className,
  amount = 0.12,
}: {
  children: ReactNode;
  className?: string;
  amount?: number;
}) {
  return (
    <motion.div
      className={className}
      variants={stagger(amount)}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  tone = "light",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  align?: "center" | "left";
  tone?: "light" | "dark";
}) {
  return (
    <Reveal
      className={cn(
        "max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left",
      )}
    >
      {eyebrow ? (
        <span
          className={cn(
            "eyebrow",
            tone === "dark" ? "text-[var(--gold)]" : "text-[var(--primary)]",
          )}
        >
          <span className="h-px w-8 bg-[var(--gold)]" aria-hidden />
          {eyebrow}
        </span>
      ) : null}
      <h2
        className={cn(
          eyebrow ? "mt-4" : "",
          "text-3xl leading-[1.1] sm:text-4xl lg:text-5xl font-[var(--font-display)]",
          tone === "dark" ? "text-navy-foreground" : "text-foreground",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-4 text-base leading-relaxed sm:text-lg",
            tone === "dark" ? "text-navy-foreground/70" : "text-muted-foreground",
          )}
        >
          {description}
        </p>
      ) : null}
    </Reveal>
  );
}
