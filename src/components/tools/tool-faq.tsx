import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tool } from "@/types";

interface ToolFAQProps {
  tool: Tool;
}

function generateFAQs(tool: Tool) {
  const external = tool.slug === "upscale-image" || tool.slug === "remove-background";
  return [
    {
      q: "What types of files or inputs does " + tool.name + " support?",
      a: "Accepted formats and limits are shown in the tool's upload area or instructions. Capabilities vary by processor, and corrupted or protected files may be unsupported.",
    },
    {
      q: "How does " + tool.name + " handle my files?",
      a: external
        ? "This tool uses an image-processing model or service. Check its on-page information before processing sensitive images. External services may receive file contents."
        : "Many AirTools processors work locally in your browser. This page does not guarantee that every third-party integration is local; review the specific processing notice.",
    },
    {
      q: "Will " + tool.name + " preserve everything exactly?",
      a: "Not always. Conversion, compression, OCR and editing may change formatting, image quality or metadata. Check output files before using them for important work.",
    },
    {
      q: "How long will processing take?",
      a: "Processing depends on the file size, selected settings, available device memory, and any external service required.",
    },
  ];
}

export function ToolFAQ({ tool }: ToolFAQProps) {
  const faqs = generateFAQs(tool);

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
      <Accordion type="single" collapsible className="space-y-2">
        {faqs.map((faq, i) => (
          <AccordionItem
            key={i}
            value={`item-${i}`}
            className="border border-border bg-card rounded-xl px-6"
          >
            <AccordionTrigger className="text-left font-medium hover:no-underline">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
