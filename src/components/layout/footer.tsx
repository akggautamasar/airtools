import Link from "next/link";
import { Zap, GitFork, Link2, Globe, Mail } from "lucide-react";

const footerLinks = {
  "PDF Tools": [
    { label: "Compress PDF", href: "/tools/compress-pdf" },
    { label: "Merge PDF", href: "/tools/merge-pdf" },
    { label: "Split PDF", href: "/tools/split-pdf" },
    { label: "PDF to Word", href: "/tools/pdf-to-word" },
    { label: "Word to PDF", href: "/tools/word-to-pdf" },
    { label: "Protect PDF", href: "/tools/protect-pdf" },
  ],
  "Image Tools": [
    { label: "Compress Image", href: "/tools/compress-image" },
    { label: "Resize Image", href: "/tools/resize-image" },
    { label: "Crop Image", href: "/tools/crop-image" },
    { label: "Image to JPG", href: "/tools/image-to-jpg" },
    { label: "Image to PNG", href: "/tools/image-to-png" },
    { label: "GIF Maker", href: "/tools/gif-maker" },
  ],
  "Utility Tools": [
    { label: "ZIP Maker", href: "/tools/zip-maker" },
    { label: "ZIP Extractor", href: "/tools/zip-extractor" },
    { label: "Barcode Generator", href: "/tools/barcode-generator" },
    { label: "Password Generator", href: "/tools/password-generator" },
    { label: "Color Extractor", href: "/tools/color-extractor" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Pricing", href: "/pricing" },
    { label: "Contact", href: "/contact" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">AirTools</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs leading-relaxed">
              All Your PDF, Image & Utility Tools in One Place. Fast, free, and secure file processing in your browser.
            </p>
            <div className="flex items-center gap-3">
              {[
                { icon: Link2, href: "#", label: "Twitter" },
                { icon: GitFork, href: "#", label: "GitHub" },
                { icon: Globe, href: "#", label: "LinkedIn" },
                { icon: Mail, href: "mailto:hello@airtools.app", label: "Email" },
              ].map(({ icon: Icon, href, label }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </Link>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold mb-4">{category}</h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} AirTools. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              All systems operational
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Made with ❤️ for productivity
          </p>
        </div>
      </div>
    </footer>
  );
}
