import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Track Order | Baefikra",
  robots: {
    index: false,
    follow: false,
  },
}

export default function TrackOrderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
