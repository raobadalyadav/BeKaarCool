import type { ReactNode } from "react"

interface LogoProps {
  className?: string
  textColor?: string
  width?: number
  height?: number
}

export function Logo({ className = "", textColor = "#111111", width = 140, height = 35 }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 160 40"
      width={width}
      height={height}
      className={className}
      aria-label="Baefikra"
      role="img"
    >
      <rect x="1" y="4" width="32" height="32" rx="7" fill="#FACC15" />
      <text
        x="9"
        y="28"
        fontFamily="'Georgia', 'Times New Roman', serif"
        fontSize="23"
        fontWeight="900"
        fill="#111111"
      >
        B
      </text>
      <text
        x="40"
        y="29"
        fontFamily="'Helvetica Neue', 'Arial', sans-serif"
        fontSize="21"
        fontWeight="800"
        letterSpacing="-0.3"
        fill={textColor}
      >
        aefikra
      </text>
    </svg>
  )
}

/* ── Payment method icon chips ──────────────────────────────────── */

function PaymentChip({ children, bg = "#1a1a2e" }: { children: ReactNode; bg?: string }) {
  return (
    <span
      style={{ background: bg }}
      className="inline-flex items-center justify-center rounded px-2 py-1 h-7 min-w-[48px]"
    >
      {children}
    </span>
  )
}

export function VisaIcon() {
  return (
    <PaymentChip bg="#1A1F71">
      <svg viewBox="0 0 48 16" width="38" height="12" aria-label="Visa">
        <text
          x="0"
          y="13"
          fontFamily="'Helvetica Neue', Arial, sans-serif"
          fontSize="14"
          fontStyle="italic"
          fontWeight="900"
          fill="#FFFFFF"
          letterSpacing="1"
        >
          VISA
        </text>
      </svg>
    </PaymentChip>
  )
}

export function MastercardIcon() {
  return (
    <PaymentChip bg="#252525">
      <svg viewBox="0 0 38 24" width="38" height="22" aria-label="Mastercard">
        <circle cx="13" cy="12" r="10" fill="#EB001B" />
        <circle cx="25" cy="12" r="10" fill="#F79E1B" />
        <path d="M19 4.8a10 10 0 0 1 0 14.4A10 10 0 0 1 19 4.8Z" fill="#FF5F00" />
      </svg>
    </PaymentChip>
  )
}

export function UpiIcon() {
  return (
    <PaymentChip bg="#097939">
      <svg viewBox="0 0 38 20" width="38" height="18" aria-label="UPI">
        <text
          x="19"
          y="15"
          textAnchor="middle"
          fontFamily="'Helvetica Neue', Arial, sans-serif"
          fontSize="13"
          fontWeight="900"
          fill="#FFFFFF"
          letterSpacing="1"
        >
          UPI
        </text>
      </svg>
    </PaymentChip>
  )
}

export function RazorpayIcon() {
  return (
    <PaymentChip bg="#072654">
      <svg viewBox="0 0 60 20" width="52" height="16" aria-label="Razorpay">
        <polygon points="4,2 10,2 6,9 11,9 3,18 6,10 2,10" fill="#3395FF" />
        <text
          x="14"
          y="14"
          fontFamily="'Helvetica Neue', Arial, sans-serif"
          fontSize="9.5"
          fontWeight="700"
          fill="#FFFFFF"
          letterSpacing="0.3"
        >
          RAZORPAY
        </text>
      </svg>
    </PaymentChip>
  )
}

export function CodIcon() {
  return (
    <PaymentChip bg="#374151">
      <svg viewBox="0 0 44 22" width="44" height="20" aria-label="Cash on Delivery">
        <text
          x="22"
          y="12"
          textAnchor="middle"
          fontFamily="'Helvetica Neue', Arial, sans-serif"
          fontSize="9"
          fontWeight="700"
          fill="#D1FAE5"
          letterSpacing="0.3"
        >
          CASH
        </text>
        <text
          x="22"
          y="20"
          textAnchor="middle"
          fontFamily="'Helvetica Neue', Arial, sans-serif"
          fontSize="6"
          fontWeight="600"
          fill="#9CA3AF"
          letterSpacing="0.5"
        >
          ON DELIVERY
        </text>
      </svg>
    </PaymentChip>
  )
}
