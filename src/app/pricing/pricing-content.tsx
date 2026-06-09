"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Zap, Star, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Free",
    price: { monthly: 0, yearly: 0 },
    description: "Perfect for personal use",
    icon: Zap,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    features: [
      "60+ tools unlimited access",
      "Browser-based processing",
      "No registration required",
      "Up to 100MB per file",
      "Standard processing speed",
      "Community support",
    ],
    cta: "Get Started Free",
    variant: "outline" as const,
  },
  {
    name: "Pro",
    price: { monthly: 9, yearly: 7 },
    description: "For power users and professionals",
    icon: Star,
    color: "text-primary",
    bg: "bg-primary/10",
    highlighted: true,
    features: [
      "Everything in Free",
      "Up to 500MB per file",
      "Priority processing",
      "Batch processing (100 files)",
      "Ad-free experience",
      "Cloud storage (10GB)",
      "Email support",
      "API access (1000 calls/mo)",
    ],
    cta: "Start Pro Trial",
    variant: "gradient" as const,
  },
  {
    name: "Business",
    price: { monthly: 29, yearly: 24 },
    description: "For teams and organizations",
    icon: Building2,
    color: "text-purple-500",
    bg: "bg-purple-50 dark:bg-purple-950/20",
    features: [
      "Everything in Pro",
      "Unlimited file sizes",
      "Unlimited batch processing",
      "Cloud storage (100GB)",
      "Team collaboration",
      "API access (unlimited)",
      "Custom branding",
      "Priority phone support",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    variant: "outline" as const,
  },
];

export function PricingContent() {
  const [yearly, setYearly] = useState(false);

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="default" className="mb-6 bg-primary/10 text-primary border border-primary/20 text-sm px-4 py-1.5">
            Simple Pricing
          </Badge>
          <h1 className="text-5xl sm:text-6xl font-bold mb-6">
            Plans for Every
            <span className="gradient-text"> Need</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Start free. Upgrade when you need more. No hidden fees, no surprises.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-4 bg-muted rounded-xl p-1.5">
            <button
              onClick={() => setYearly(false)}
              className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", !yearly && "bg-background shadow-sm")}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2", yearly && "bg-background shadow-sm")}
            >
              Yearly
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">Save 20%</Badge>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "relative rounded-2xl border p-8 flex flex-col",
                plan.highlighted
                  ? "border-primary shadow-xl shadow-primary/10 bg-card"
                  : "border-border bg-card"
              )}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}

              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-5", plan.bg)}>
                <plan.icon className={cn("w-7 h-7", plan.color)} />
              </div>

              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <p className="text-muted-foreground text-sm mb-6">{plan.description}</p>

              <div className="mb-8">
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-bold">
                    ${yearly ? plan.price.yearly : plan.price.monthly}
                  </span>
                  {plan.price.monthly > 0 && (
                    <span className="text-muted-foreground mb-2">/month</span>
                  )}
                </div>
                {yearly && plan.price.monthly > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Billed ${plan.price.yearly * 12}/year
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <div className={cn("w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5", plan.highlighted ? "bg-primary/10" : "bg-muted")}>
                      <Check className={cn("w-3 h-3", plan.highlighted ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button variant={plan.variant} size="lg" className="w-full">
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-24 text-center">
          <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-10 text-left max-w-4xl mx-auto">
            {[
              { q: "Can I cancel anytime?", a: "Yes, you can cancel your subscription at any time. No questions asked." },
              { q: "Is the free plan really free?", a: "Yes! The free plan is completely free with no credit card required." },
              { q: "What payment methods do you accept?", a: "We accept all major credit cards, PayPal, and bank transfers for Business plans." },
              { q: "Do you offer refunds?", a: "Yes, we offer a 30-day money-back guarantee for all paid plans." },
            ].map((faq) => (
              <div key={faq.q} className="p-6 bg-card border border-border rounded-2xl">
                <h4 className="font-semibold mb-2">{faq.q}</h4>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
