import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { HelpCircle, MessageCircle, Mail, Phone } from "lucide-react"

export default function FAQPage() {
  const faqs = [
    {
      category: "Orders & Shipping",
      questions: [
        {
          q: "How long does shipping take?",
          a: "Standard shipping takes 5-7 business days. Express shipping takes 2-3 business days. Custom products may take additional 2-3 days for production."
        },
        {
          q: "Can I track my order?",
          a: "Yes! Once your order ships, you'll receive a tracking number via email. You can also track your order in the 'My Orders' section of your account."
        },
        {
          q: "What if my order is damaged or incorrect?",
          a: "We offer free returns and exchanges within 30 days. Contact our support team with photos of the issue, and we'll resolve it quickly."
        }
      ]
    },
    {
      category: "Custom Design",
      questions: [
        {
          q: "What file formats do you accept for custom designs?",
          a: "We accept PNG, JPG, SVG, and PDF files. For best quality, use high-resolution images (300 DPI minimum)."
        },
        {
          q: "Can I edit my design after placing an order?",
          a: "Design changes can be made within 2 hours of placing your order. After production begins, changes aren't possible."
        },
        {
          q: "Do you offer design services?",
          a: "Yes! Our design team can create custom artwork for an additional fee. Contact us for a quote."
        }
      ]
    },
    {
      category: "Payments & Pricing",
      questions: [
        {
          q: "What payment methods do you accept?",
          a: "We accept all major credit/debit cards, Razorpay, PhonePe, UPI, and Cash on Delivery (COD) for eligible orders."
        },
        {
          q: "Are there any hidden fees?",
          a: "No hidden fees! All costs including taxes and shipping are clearly shown at checkout."
        },
        {
          q: "Do you offer bulk discounts?",
          a: "Yes! Orders of 10+ items qualify for bulk pricing. Contact us for custom quotes on large orders."
        }
      ]
    },
    {
      category: "Account & Returns",
      questions: [
        {
          q: "Do I need an account to place an order?",
          a: "You can checkout as a guest, but creating an account helps you track orders and save designs for future use."
        },
        {
          q: "What's your return policy?",
          a: "30-day return policy for unused items in original condition. Custom items can only be returned if there's a production error."
        },
        {
          q: "How do I become a seller?",
          a: "Visit our Seller Registration page to apply. We review applications within 2-3 business days."
        }
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <HelpCircle className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions about our products, services, and policies.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* FAQ Content */}
          <div className="lg:col-span-3">
            <div className="space-y-8">
              {faqs.map((category, categoryIndex) => (
                <Card key={categoryIndex}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Badge variant="secondary">{category.category}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {category.questions.map((faq, index) => (
                        <AccordionItem key={index} value={`${categoryIndex}-${index}`}>
                          <AccordionTrigger className="text-left">
                            {faq.q}
                          </AccordionTrigger>
                          <AccordionContent className="text-gray-600">
                            {faq.a}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Still Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <MessageCircle className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-sm">Live Chat</p>
                    <p className="text-xs text-gray-600">Available 24/7</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <Mail className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-sm">Email Support</p>
                    <p className="text-xs text-gray-600">support@bekaarcool.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <Phone className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-sm">Phone Support</p>
                    <p className="text-xs text-gray-600">+91 12345 67890</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}