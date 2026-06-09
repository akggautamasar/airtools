"use client";

import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    question: "Is AirTools completely free to use?",
    answer: "Yes! AirTools offers 60+ tools completely free with no registration required. We believe in providing accessible tools for everyone. Premium features for power users are coming soon.",
  },
  {
    question: "Are my files safe and private?",
    answer: "Absolutely. All file processing happens directly in your browser using client-side technology. We never upload your files to our servers, and no data is stored or shared with third parties.",
  },
  {
    question: "Do I need to install anything?",
    answer: "No installation required! AirTools is a web-based application that runs entirely in your browser. Simply visit the site and start using any tool instantly.",
  },
  {
    question: "What file formats are supported?",
    answer: "AirTools supports a wide range of formats including PDF, DOCX, DOC, PPTX, XLSX, JPG, JPEG, PNG, WEBP, BMP, GIF, EPUB, MOBI, AZW, AZW3, ZIP, and many more.",
  },
  {
    question: "Is there a file size limit?",
    answer: "For client-side processing, the file size is limited by your device's available memory. For optimal performance, we recommend files under 100MB. Large file support is on our roadmap.",
  },
  {
    question: "Can I process multiple files at once?",
    answer: "Yes! Many tools support batch processing, allowing you to upload and process multiple files simultaneously. Simply drag and drop multiple files into the upload area.",
  },
  {
    question: "Does AirTools work on mobile devices?",
    answer: "Absolutely! AirTools is fully responsive and works great on smartphones and tablets. The mobile-first design ensures a seamless experience on all devices.",
  },
  {
    question: "Will there be a premium/paid plan?",
    answer: "We're planning to introduce optional premium plans with advanced features like unlimited file sizes, priority processing, cloud storage, and API access. Core tools will always remain free.",
  },
];

export function FAQ() {
  return (
    <section className="py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Frequently Asked
            <span className="gradient-text"> Questions</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Everything you need to know about AirTools.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border border-border bg-card rounded-xl px-6 data-[state=open]:shadow-md transition-shadow"
              >
                <AccordionTrigger className="text-left font-medium hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
