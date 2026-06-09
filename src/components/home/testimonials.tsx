"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Content Manager",
    company: "TechCorp Inc.",
    avatar: "SJ",
    avatarColor: "bg-blue-500",
    content: "AirTools has transformed how I handle documents at work. Compressing PDFs and converting files takes seconds now. Absolutely love it!",
    rating: 5,
  },
  {
    name: "Michael Chen",
    role: "Graphic Designer",
    company: "Creative Studio",
    avatar: "MC",
    avatarColor: "bg-purple-500",
    content: "The image compression tool is incredible. I've used many tools but none match the quality output from AirTools. My go-to for all image needs.",
    rating: 5,
  },
  {
    name: "Emily Rodriguez",
    role: "HR Manager",
    company: "Global Corp",
    avatar: "ER",
    avatarColor: "bg-green-500",
    content: "Converting Word documents to PDF for HR forms used to be tedious. AirTools made it effortless. The whole team now uses it daily.",
    rating: 5,
  },
  {
    name: "David Park",
    role: "Developer",
    company: "StartupXYZ",
    avatar: "DP",
    avatarColor: "bg-red-500",
    content: "Fast, clean, and private. I appreciate that files aren't stored on servers. The password generator and ZIP tools are excellent too.",
    rating: 5,
  },
  {
    name: "Lisa Thompson",
    role: "Educator",
    company: "University Press",
    avatar: "LT",
    avatarColor: "bg-yellow-500",
    content: "I use the PDF tools daily for creating educational materials. The merge and split features work flawlessly. Highly recommend!",
    rating: 5,
  },
  {
    name: "James Wilson",
    role: "Entrepreneur",
    company: "Wilson Ventures",
    avatar: "JW",
    avatarColor: "bg-cyan-500",
    content: "AirTools replaced 5 different websites I used to visit. Having everything in one place with this quality is a game changer.",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section className="py-24 bg-muted/30 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 text-amber-400 fill-current" />
            ))}
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Loved by <span className="gradient-text">Thousands</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join over 2 million users who trust AirTools for their daily file processing needs.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-amber-400 fill-current" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                &ldquo;{testimonial.content}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${testimonial.avatarColor} rounded-full flex items-center justify-center text-white text-sm font-bold`}>
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.role}, {testimonial.company}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
