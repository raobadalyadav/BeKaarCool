import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact Us | Baefikra",
  description: "Get in touch with Baefikra's customer support. We're here to help you with your premium streetwear orders and inquiries.",
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
