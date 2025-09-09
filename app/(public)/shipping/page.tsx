import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Truck, Clock, MapPin, Package, Shield, CreditCard, AlertCircle, CheckCircle, Plane, Home } from "lucide-react"

export default function ShippingPage() {
  const shippingMethods = [
    {
      icon: Truck,
      name: "Standard Shipping",
      time: "5-7 business days",
      cost: "₹99",
      description: "Reliable delivery for most locations across India",
      features: ["Free for orders above ₹999", "Tracking included", "Insurance up to ₹5,000"],
    },
    {
      icon: Plane,
      name: "Express Shipping",
      time: "2-3 business days",
      cost: "₹199",
      description: "Faster delivery for urgent orders",
      features: ["Priority handling", "Real-time tracking", "Insurance up to ₹10,000"],
    },
    {
      icon: Home,
      name: "Same Day Delivery",
      time: "Within 24 hours",
      cost: "₹299",
      description: "Available in select metro cities",
      features: ["Mumbai, Delhi, Bangalore", "Order before 2 PM", "Premium service"],
    },
  ]

  const deliveryZones = [
    {
      zone: "Zone 1 - Metro Cities",
      cities: ["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata", "Hyderabad"],
      time: "2-4 business days",
      cost: "₹99",
    },
    {
      zone: "Zone 2 - Major Cities",
      cities: ["Pune", "Ahmedabad", "Jaipur", "Lucknow", "Kanpur", "Nagpur"],
      time: "3-5 business days",
      cost: "₹149",
    },
    {
      zone: "Zone 3 - Other Cities",
      cities: ["Tier 2 and Tier 3 cities"],
      time: "5-7 business days",
      cost: "₹199",
    },
    {
      zone: "Zone 4 - Remote Areas",
      cities: ["Rural and remote locations"],
      time: "7-10 business days",
      cost: "₹299",
    },
  ]

  const policies = [
    {
      icon: Package,
      title: "Order Processing",
      content: [
        "Orders are processed within 1-2 business days",
        "Orders placed after 2 PM are processed the next business day",
        "Weekend orders are processed on Monday",
        "You'll receive a confirmation email once your order is shipped",
      ],
    },
    {
      icon: Shield,
      title: "Packaging & Safety",
      content: [
        "All items are carefully packaged to prevent damage",
        "Fragile items receive extra protective packaging",
        "Eco-friendly packaging materials used when possible",
        "Tamper-evident sealing for security",
      ],
    },
    {
      icon: MapPin,
      title: "Delivery Locations",
      content: [
        "We deliver to all serviceable PIN codes in India",
        "PO Box deliveries are not available",
        "Some remote locations may have extended delivery times",
        "Check PIN code serviceability during checkout",
      ],
    },
    {
      icon: CreditCard,
      title: "Shipping Charges",
      content: [
        "Shipping charges are calculated based on weight and distance",
        "Free shipping on orders above ₹999 (standard shipping)",
        "Express and same-day delivery charges apply separately",
        "No hidden charges - all costs shown at checkout",
      ],
    },
  ]

  const trackingSteps = [
    { status: "Order Confirmed", description: "Your order has been received and confirmed" },
    { status: "Processing", description: "Your order is being prepared for shipment" },
    { status: "Shipped", description: "Your order has been dispatched from our warehouse" },
    { status: "In Transit", description: "Your order is on the way to your location" },
    { status: "Out for Delivery", description: "Your order is out for delivery today" },
    { status: "Delivered", description: "Your order has been successfully delivered" },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Truck className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Shipping Information</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Fast, reliable, and secure delivery across India. Learn about our shipping options and policies.
          </p>
        </div>

        {/* Shipping Methods */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Shipping Methods</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {shippingMethods.map((method, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <method.icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{method.name}</CardTitle>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-3 w-3 mr-1" />
                          {method.time}
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-lg font-semibold">
                      {method.cost}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{method.description}</p>
                  <ul className="space-y-2">
                    {method.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Delivery Zones */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Delivery Zones</h2>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Zone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Coverage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Delivery Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Shipping Cost
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {deliveryZones.map((zone, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{zone.zone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">
                            {Array.isArray(zone.cities) ? zone.cities.join(", ") : zone.cities}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="h-4 w-4 mr-1" />
                            {zone.time}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline">{zone.cost}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Shipping Policies */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Shipping Policies</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {policies.map((policy, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <policy.icon className="h-4 w-4 text-blue-600" />
                    </div>
                    {policy.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {policy.content.map((item, iIndex) => (
                      <li key={iIndex} className="flex items-start text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Order Tracking */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Track Your Order</h2>
          <Card>
            <CardHeader>
              <CardTitle>Order Status Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trackingSteps.map((step, index) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="font-medium text-gray-900">{step.status}</h3>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Separator className="my-6" />
              <div className="text-center">
                <p className="text-gray-600 mb-4">Track your order using the tracking number sent to your email</p>
                <a
                  href="/track-order"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Track Order
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Important Notes */}
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-orange-900 mb-2">Important Notes</h3>
                <ul className="space-y-1 text-orange-800 text-sm">
                  <li>• Delivery times are estimates and may vary due to weather or other unforeseen circumstances</li>
                  <li>• Someone must be available to receive the package during delivery hours</li>
                  <li>• We may require signature confirmation for high-value orders</li>
                  <li>• Shipping to PO Boxes is not available for most products</li>
                  <li>• Additional charges may apply for remote or difficult-to-reach locations</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
