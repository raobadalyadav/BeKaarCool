import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Calendar, Lock, Eye, Database, UserCheck } from "lucide-react"

export default function PrivacyPage() {
  const lastUpdated = "January 15, 2024"

  const sections = [
    {
      title: "1. Information We Collect",
      icon: Database,
      content: [
        "We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support.",
        "Personal Information: Name, email address, phone number, shipping address, billing address, and payment information.",
        "Account Information: Username, password, and preferences.",
        "Transaction Information: Details about purchases, including products bought, prices, and payment methods.",
        "Communication Information: Records of your communications with us, including customer service interactions.",
      ],
    },
    {
      title: "2. Information We Collect Automatically",
      icon: Eye,
      content: [
        "When you use our services, we automatically collect certain information about your device and usage:",
        "Device Information: IP address, browser type, operating system, device identifiers, and mobile network information.",
        "Usage Information: Pages visited, time spent on pages, links clicked, and other usage statistics.",
        "Location Information: General location based on IP address (not precise location unless you explicitly consent).",
        "Cookies and Similar Technologies: We use cookies, web beacons, and similar technologies to collect information and improve our services.",
      ],
    },
    {
      title: "3. How We Use Your Information",
      icon: UserCheck,
      content: [
        "We use the information we collect for various purposes:",
        "• Provide, maintain, and improve our services",
        "• Process transactions and send related information",
        "• Send you technical notices, updates, security alerts, and support messages",
        "• Respond to your comments, questions, and customer service requests",
        "• Communicate with you about products, services, offers, and events",
        "• Monitor and analyze trends, usage, and activities in connection with our services",
        "• Detect, investigate, and prevent fraudulent transactions and other illegal activities",
        "• Personalize and improve your experience on our platform",
      ],
    },
    {
      title: "4. Information Sharing and Disclosure",
      icon: Lock,
      content: [
        "We do not sell, trade, or otherwise transfer your personal information to third parties except as described below:",
        "Service Providers: We may share information with third-party service providers who perform services on our behalf, such as payment processing, shipping, and customer support.",
        "Business Transfers: If we are involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.",
        "Legal Requirements: We may disclose information if required by law or in response to valid requests by public authorities.",
        "Protection of Rights: We may disclose information to protect our rights, property, or safety, or that of our users or others.",
        "Consent: We may share information with your consent or at your direction.",
      ],
    },
    {
      title: "5. Data Security",
      icon: Shield,
      content: [
        "We implement appropriate technical and organizational measures to protect your personal information:",
        "• Encryption of sensitive data during transmission and storage",
        "• Regular security assessments and updates to our systems",
        "• Access controls to limit who can access your information",
        "• Employee training on data protection and privacy practices",
        "• Secure payment processing through certified payment processors",
        "However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.",
      ],
    },
    {
      title: "6. Your Rights and Choices",
      icon: UserCheck,
      content: [
        "You have certain rights regarding your personal information:",
        "Access: You can request access to the personal information we hold about you.",
        "Correction: You can request that we correct any inaccurate or incomplete information.",
        "Deletion: You can request that we delete your personal information, subject to certain exceptions.",
        "Portability: You can request a copy of your personal information in a structured, machine-readable format.",
        "Objection: You can object to certain processing of your personal information.",
        "Marketing Communications: You can opt out of receiving marketing communications from us at any time.",
      ],
    },
    {
      title: "7. Cookies and Tracking Technologies",
      icon: Eye,
      content: [
        "We use cookies and similar tracking technologies to collect and use personal information about you:",
        "Essential Cookies: Necessary for the website to function properly.",
        "Performance Cookies: Help us understand how visitors interact with our website.",
        "Functional Cookies: Enable enhanced functionality and personalization.",
        "Targeting Cookies: Used to deliver relevant advertisements and track ad campaign effectiveness.",
        "You can control cookies through your browser settings, but disabling certain cookies may affect website functionality.",
      ],
    },
    {
      title: "8. Third-Party Services",
      icon: Database,
      content: [
        "Our service may contain links to third-party websites or integrate with third-party services:",
        "• Payment processors (Razorpay, PayPal, etc.)",
        "• Shipping providers (Blue Dart, FedEx, etc.)",
        "• Analytics services (Google Analytics)",
        "• Social media platforms",
        "These third parties have their own privacy policies, and we are not responsible for their practices.",
        "We encourage you to review the privacy policies of any third-party services you use.",
      ],
    },
    {
      title: "9. Children's Privacy",
      icon: Shield,
      content: [
        "Our services are not intended for children under the age of 13.",
        "We do not knowingly collect personal information from children under 13.",
        "If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information.",
        "If you are a parent or guardian and believe your child has provided us with personal information, please contact us.",
      ],
    },
    {
      title: "10. International Data Transfers",
      icon: Database,
      content: [
        "Your information may be transferred to and processed in countries other than your own.",
        "We ensure that such transfers are made in accordance with applicable data protection laws.",
        "We implement appropriate safeguards to protect your information during international transfers.",
        "By using our services, you consent to the transfer of your information to other countries.",
      ],
    },
    {
      title: "11. Data Retention",
      icon: Database,
      content: [
        "We retain your personal information for as long as necessary to fulfill the purposes outlined in this privacy policy.",
        "We may retain information for longer periods if required by law or for legitimate business purposes.",
        "When we no longer need your information, we will securely delete or anonymize it.",
        "You can request deletion of your account and associated data at any time, subject to legal requirements.",
      ],
    },
    {
      title: "12. Changes to This Privacy Policy",
      icon: Calendar,
      content: [
        "We may update this privacy policy from time to time to reflect changes in our practices or applicable laws.",
        "We will notify you of any material changes by posting the new privacy policy on this page and updating the 'Last Updated' date.",
        "For significant changes, we may provide additional notice, such as email notification.",
        "Your continued use of our services after any changes constitutes acceptance of the updated privacy policy.",
      ],
    },
    {
      title: "13. Contact Us",
      icon: UserCheck,
      content: [
        "If you have any questions, concerns, or requests regarding this privacy policy or our data practices, please contact us:",
        "• Email: privacy@bekaarcool.com",
        "• Phone: +91 98765 43210",
        "• Address: 123 Business District, Mumbai, Maharashtra 400001, India",
        "• Data Protection Officer: dpo@bekaarcool.com",
        "We will respond to your inquiries within 30 days.",
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-xl text-gray-600 mb-6">
            Your privacy is important to us. This policy explains how we collect, use, and protect your information.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Badge variant="outline" className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              Last updated: {lastUpdated}
            </Badge>
            <Badge variant="secondary">GDPR Compliant</Badge>
          </div>
        </div>

        {/* Introduction */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              BeKaarCool ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how
              we collect, use, disclose, and safeguard your information when you visit our website or use our services.
              Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy,
              please do not access the site or use our services.
            </p>
          </CardContent>
        </Card>

        {/* Privacy Content */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <section.icon className="h-4 w-4 text-blue-600" />
                  </div>
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {section.content.map((paragraph, pIndex) => (
                    <p key={pIndex} className="text-gray-700 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Questions about our Privacy Policy?</h3>
              <p className="text-gray-600 mb-4">
                If you have any questions about this Privacy Policy or our data practices, we're here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <a href="/contact" className="text-blue-600 hover:text-blue-800 font-medium">
                  Contact Support
                </a>
                <span className="hidden sm:inline text-gray-400">•</span>
                <a href="mailto:privacy@bekaarcool.com" className="text-blue-600 hover:text-blue-800 font-medium">
                  privacy@bekaarcool.com
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
