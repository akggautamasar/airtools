"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const stats = [
  { value: 60, suffix: "+", label: "Free Tools", color: "from-primary to-primary/70" },
  { value: 2, suffix: "M+", label: "Files Processed", color: "from-secondary to-secondary/70" },
  { value: 100, suffix: "%", label: "Browser-Based", color: "from-accent to-accent/70" },
  { value: 0, suffix: " sec", label: "Registration", prefix: "", extra: "Required", color: "from-green-500 to-green-500/70" },
];

function AnimatedNumber({ value, suffix, prefix }: { value: number; suffix: string; prefix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 2000;
          const start = performance.now();
          const animate = (time: number) => {
            const elapsed = time - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(eased * value));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref}>
      {prefix}{display}{suffix}
    </span>
  );
}

export function Stats() {
  return (
    <section className="py-20 bg-card border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <div className={`text-4xl sm:text-5xl font-bold mb-2 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.label === "Registration" ? (
                  <span>No</span>
                ) : (
                  <AnimatedNumber value={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
                )}
              </div>
              <p className="text-muted-foreground font-medium">
                {stat.extra ? `${stat.label} ${stat.extra}` : stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
