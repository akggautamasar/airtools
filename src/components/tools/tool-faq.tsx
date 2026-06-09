import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tool } from "@/types";

interface ToolFAQProps {
  tool: Tool;
}

function generateFAQs(tool: Tool) {
  return [
    {
      q: `Is ${tool.name} free to use?`,
      a: `Yes, ${tool.name} is completely free with no registration required. You can use it as many times as you need.`,
    },
    {
      q: `Are my files safe when using ${tool.name}?`,
      a: `Your files are processed directly in your browser. We never upload or store your files on our servers, ensuring complete privacy and security.`,
    },
    {
      q: `How long does ${tool.name} take to process files?`,
      a: `Processing is nearly instant for most files. The time depends on the file size and your device's performance. Typically completes in seconds.`,
    },
    {
      q: `What is the maximum file size for ${tool.name}?`,
      a: `The file size limit depends on your device's available memory. For best results, we recommend files under 100MB. Larger file support is planned.`,
    },
    {
      q: `Can I use ${tool.name} on my mobile device?`,
      a: `Yes! AirTools is fully responsive and optimized for mobile devices. You can use all tools on any smartphone or tablet.`,
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
