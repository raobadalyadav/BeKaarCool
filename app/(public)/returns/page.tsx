import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  RotateCcw,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  CreditCard,
  AlertTriangle,
  FileText,
  ArrowRight,
  Shield,
} from "lucide-react"

export default function ReturnsPage() {
  const returnReasons = [
    "Product damaged during shipping",
    "Wrong item received",
    "Product doesn't match description",
    "Size/fit issues",
    "Quality not as expected",
    "Changed mind",
    "Found better price elsewhere",
    "Defective product",
  ]

  const returnProcess = [
    {
      step: 1,
      title: "Initiate Return",
      description: "Log into your account and select the item you want to return",
      icon: FileText,
    },
    {
      step: 2,
      title: "Package Item",
      description: "Pack the item in original packaging with all accessories",
      icon: Package,
    },
    {
      step: 3,
      title: "Schedule Pickup",
      description: "We'll arrange free pickup from your location",
      icon: RotateCcw,
    },
    {
      step: 4,
      title: "Quality Check",
      description: "We'll inspect the returned item within 2-3 business days",
      icon: CheckCircle,
    },
    {
      step: 5,
      title: "Refund Processing",
      description: "Refund will be processed to your original payment method",
      icon: CreditCard,
    },
  ]

  const eligibleItems = [
    { category: "Clothing & Fashion", eligible: true, note: "Must have tags attached" },
    { category: "Electronics", eligible: true, note: "Original packaging required" },
    { category: "Home & Kitchen", eligible: true, note: "Unused condition only" },
    { category: "Books", eligible: true, note: "No writing or damage" },
    { category: "Beauty Products", eligible: false, note: "Hygiene reasons" },
    { category: "Undergarments", eligible: false, note: "Hygiene reasons" },
    { category: "Perishable Items", eligible: false, note: "Cannot be returned" },
    { category: "Custom/Personalized", eligible: false, note: "Made to order" },
  ]

  const refundTimeline = [
    { method: "Credit/Debit Card", time: "5-7 business days", note: "After quality check" },
    { method: "Net Banking", time: "5-7 business days", note: "After quality check" },
    { method: "UPI", time: "3-5 business days", note: "After quality check" },
    { method: "Wallet", time: "1-2 business days", note: "After quality check" },
    { method: "Cash on Delivery", time: "7-10 business days", note: "Bank transfer" },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <RotateCcw className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Returns & Refunds</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Easy returns within 30 days. We want you to be completely satisfied with your purchase.
          </p>
        </div>

        {/* Return Policy Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">30-Day Returns</h3>
              <p className="text-gray-600">Return most items within 30 days of delivery for a full refund</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Free Pickup</h3>
              <p className="text-gray-600">We'll arrange free pickup from your location - no hassle</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Quick Refunds</h3>
              <p className="text-gray-600">Refunds processed within 5-7 business days after quality check</p>
            </CardContent>
          </Card>
        </div>

        {/* Return Process */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">How to Return an Item</h2>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-8">
                {returnProcess.map((step, index) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <step.icon className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center mb-2">
                        <Badge variant="secondary" className="mr-3">
                          Step {step.step}
                        </Badge>
                        <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                      </div>
                      <p className="text-gray-600">{step.description}</p>
                    </div>
                    {index < returnProcess.length - 1 && <ArrowRight className="h-5 w-5 text-gray-400 ml-4" />}
                  </div>
                ))}
              </div>
              <Separator className="my-6" />
              <div className="text-center">
                <Button size="lg" className="mr-4">
                  Start Return Process
                </Button>
                <Button size="lg" variant="outline">
                  Check Return Status
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Eligible Items */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Return Eligibility</h2>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Returnable
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Conditions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {eligibleItems.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{item.category}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.eligible ? (
                            <div className="flex items-center text-green-600">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              <span className="text-sm font-medium">Yes</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-red-600">
                              <XCircle className="h-4 w-4 mr-2" />
                              <span className="text-sm font-medium">No</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">{item.note}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Refund Timeline */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Refund Timeline</h2>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Refund Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Note
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {refundTimeline.map((refund, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{refund.method}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline">{refund.time}</Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">{refund.note}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Return Reasons */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Common Return Reasons</h2>
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {returnReasons.map((reason, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{reason}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Important Information */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-900">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Important Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-orange-800 text-sm">
              <li>• Items must be returned in original condition with all tags and packaging</li>
              <li>• Return window starts from the date of delivery, not the order date</li>
              <li>• Custom or personalized items cannot be returned unless defective</li>
              <li>• Return shipping is free for defective or wrong items, customer pays for other returns</li>
              <li>• Refunds will be processed only after quality inspection is completed</li>
              <li>• Items purchased during sale periods follow the same return policy</li>
              <li>• Gift cards and digital products are non-returnable</li>
            </ul>
          </CardContent>
        </Card>

        {/* Contact Support */}
        <div className="mt-12 text-center">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Need Help with Returns?</h3>
              <p className="text-gray-600 mb-6">
                Our customer support team is here to help you with any return-related questions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg">Contact Support</Button>
                <Button size="lg" variant="outline">
                  Live Chat
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
