/**
 * FOOTER avec branding Nuvoya8
 * Discret mais présent sur toutes les pages
 */

import Link from 'next/link'
import { Nuvoya8Watermark } from './Nuvoya8Watermark'

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'App'
const CURRENT_YEAR = new Date().getFullYear()

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Colonne 1: À propos de l'app */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">{APP_NAME}</h4>
            <p className="text-sm text-muted-foreground">
              {process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Your productivity companion'}
            </p>
          </div>

          {/* Colonne 2: Links produit */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/features" className="hover:text-foreground transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-foreground transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/changelog" className="hover:text-foreground transition-colors">
                  Changelog
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 3: Links légaux */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/terms/privacy-notice" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms/terms-of-service" className="hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/terms/refund-policy" className="hover:text-foreground transition-colors">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 4: Support */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/docs" className="hover:text-foreground transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-foreground transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Ligne du bas: Copyright + Nuvoya8 */}
        <div className="mt-8 pt-8 border-t">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <p className="text-xs text-muted-foreground text-center sm:text-left">
              © {CURRENT_YEAR} {APP_NAME}. All rights reserved.
            </p>

            {/* Powered by Nuvoya8 - Discret mais visible */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Powered by</span>
              <Link
                href="https://nuvoya8.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground/80 hover:text-foreground transition-colors group"
              >
                <Nuvoya8Logo className="h-4 w-auto" />
                <span>Nuvoya8</span>
                <svg
                  className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Watermark fixe en bas à droite */}
      <Nuvoya8Watermark />
    </footer>
  )
}

/**
 * Logo Nuvoya8 simple (SVG inline)
 * Remplace par ton vrai logo
 */
function Nuvoya8Logo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Remplace par ton vrai logo SVG */}
      <text
        x="0"
        y="22"
        fontSize="24"
        fontWeight="bold"
        fill="currentColor"
        fontFamily="sans-serif"
      >
        N8
      </text>
    </svg>
  )
}