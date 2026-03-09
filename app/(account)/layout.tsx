import { Metadata } from "next"

export const metadata: Metadata = {
  title: "My Account | Baefikra",
  robots: {
    index: false,
    follow: false,
  },
}

export default function AccountRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
