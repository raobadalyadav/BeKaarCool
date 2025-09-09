import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { FileText, Calendar, AlertCircle } from "lucide-react"

export default function TermsPage() {
  const lastUpdated = "January 15, 2024"

  const sections = [
    {
      title: "1. Acceptance of Terms",
      content: [
        "By accessing and using BeKaarCool's website and services, you accept and agree to be bound by the terms and provision of this agreement.",
        "If you do not agree to abide by the above, please do not use this service.",
        "These terms apply to all visitors, users, and others who access or use the service.",
      ],
    },
    {
      title: "2. Use License",
      content: [
        "Permission is granted to temporarily download one copy of the materials on BeKaarCool's website for personal, non-commercial transitory viewing only.",
        "This is the grant of a license, not a transfer of title, and under this license you may not:",
        "• Modify or copy the materials",
        "• Use the materials for any commercial purpose or for any public display",
        "• Attempt to reverse engineer any software contained on the website",
        "• Remove any copyright or other proprietary notations from the materials",
      ],
    },
    {
      title: "3. User Accounts",
      content: [
        "When you create an account with us, you must provide information that is accurate, complete, and current at all times.",
        "You are responsible for safeguarding the password and for all activities that occur under your account.",
        "You agree not to disclose your password to any third party and to take sole responsibility for activities under your account.",
        "You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.",
      ],
    },
    {
      title: "4. Products and Services",
      content: [
        "All products and services are subject to availability. We reserve the right to discontinue any product at any time.",
        "Prices for our products are subject to change without notice.",
        "We reserve the right to modify or discontinue the service (or any part or content thereof) without notice at any time.",
        "Product descriptions and pricing are subject to change without notice and we reserve the right to correct any errors.",
      ],
    },
    {
      title: "5. Orders and Payment",
      content: [
        "By placing an order, you are making an offer to purchase the product(s) subject to these terms.",
        "All orders are subject to acceptance by us, and we may refuse any order at our discretion.",
        "Payment must be received by us before we dispatch your order.",
        "We accept various payment methods as displayed during checkout.",
        "All prices are in Indian Rupees (INR) and include applicable taxes unless otherwise stated.",
      ],
    },
    {
      title: "6. Shipping and Delivery",
      content: [
        "We will arrange for shipment of the products to you according to the shipping method you select during checkout.",
        "Delivery times are estimates and not guaranteed. We are not liable for any delays in delivery.",
        "Risk of loss and title for products pass to you upon delivery to the carrier.",
        "You are responsible for providing accurate shipping information.",
      ],
    },
    {
      title: "7. Returns and Refunds",
      content: [
        "Our return policy allows returns within 30 days of delivery for most items.",
        "Items must be in original condition with all tags and packaging.",
        "Certain items may not be eligible for return due to hygiene or safety reasons.",
        "Refunds will be processed to the original payment method within 5-7 business days.",
        "Return shipping costs may be deducted from refunds unless the return is due to our error.",
      ],
    },
    {
      title: "8. Privacy Policy",
      content: [
        "Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your information.",
        "By using our service, you agree to the collection and use of information in accordance with our Privacy Policy.",
        "We may update our Privacy Policy from time to time and will notify you of any changes.",
      ],
    },
    {
      title: "9. Prohibited Uses",
      content: [
        "You may not use our service:",
        "• For any unlawful purpose or to solicit others to perform unlawful acts",
        "• To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances",
        "• To infringe upon or violate our intellectual property rights or the intellectual property rights of others",
        "• To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate",
        "• To submit false or misleading information",
        "• To upload or transmit viruses or any other type of malicious code",
      ],
    },
    {
      title: "10. Intellectual Property",
      content: [
        "The service and its original content, features, and functionality are and will remain the exclusive property of BeKaarCool and its licensors.",
        "The service is protected by copyright, trademark, and other laws.",
        "Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent.",
      ],
    },
    {
      title: "11. Limitation of Liability",
      content: [
        "In no event shall BeKaarCool, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages.",
        "This includes without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the service.",
        "Our total liability to you for all claims arising from or relating to the service shall not exceed the amount you paid us in the 12 months preceding the claim.",
      ],
    },
    {
      title: "12. Governing Law",
      content: [
        "These terms shall be interpreted and governed by the laws of India.",
        "Any disputes arising from these terms or your use of the service shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra.",
        "If any provision of these terms is found to be unenforceable, the remaining provisions will remain in full force and effect.",
      ],
    },
    {
      title: "13. Changes to Terms",
      content: [
        "We reserve the right, at our sole discretion, to modify or replace these terms at any time.",
        "If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.",
        "What constitutes a material change will be determined at our sole discretion.",
        "By continuing to access or use our service after those revisions become effective, you agree to be bound by the revised terms.",
      ],
    },
    {
      title: "14. Contact Information",
      content: [
        "If you have any questions about these Terms of Service, please contact us:",
        "• Email: legal@bekaarcool.com",
        "• Phone: +91 98765 43210",
        "• Address: 123 Business District, Mumbai, Maharashtra 400001, India",
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <FileText className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-xl text-gray-600 mb-6">Please read these terms carefully before using our services</p>
          <div className="flex items-center justify-center space-x-4">
            <Badge variant="outline" className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              Last updated: {lastUpdated}
            </Badge>
            <Badge variant="secondary">Version 2.1</Badge>
          </div>
        </div>

        {/* Important Notice */}
        <Card className="mb-8 border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-orange-900 mb-2">Important Notice</h3>
                <p className="text-orange-800 text-sm">
                  These terms constitute a legally binding agreement between you and BeKaarCool. By using our services, you
                  acknowledge that you have read, understood, and agree to be bound by these terms.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms Content */}
        <Card>
          <CardHeader>
            <CardTitle>Terms and Conditions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {sections.map((section, index) => (
              <div key={index}>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{section.title}</h2>
                <div className="space-y-3">
                  {section.content.map((paragraph, pIndex) => (
                    <p key={pIndex} className="text-gray-700 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
                {index < sections.length - 1 && <Separator className="mt-8" />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-12 text-center">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Questions about our Terms?</h3>
              <p className="text-gray-600 mb-4">
                If you have any questions about these Terms of Service, please don't hesitate to contact us.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <a href="/contact" className="text-blue-600 hover:text-blue-800 font-medium">
                  Contact Support
                </a>
                <span className="hidden sm:inline text-gray-400">•</span>
                <a href="mailto:legal@bekaarcool.com" className="text-blue-600 hover:text-blue-800 font-medium">
                  legal@bekaarcool.com
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
