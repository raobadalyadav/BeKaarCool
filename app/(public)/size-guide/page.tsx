import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Ruler, Shirt, Users, Info } from "lucide-react"

export default function SizeGuidePage() {
  const menSizes = [
    { size: "XS", chest: "34-36", waist: "28-30", length: "26" },
    { size: "S", chest: "36-38", waist: "30-32", length: "27" },
    { size: "M", chest: "38-40", waist: "32-34", length: "28" },
    { size: "L", chest: "40-42", waist: "34-36", length: "29" },
    { size: "XL", chest: "42-44", waist: "36-38", length: "30" },
    { size: "XXL", chest: "44-46", waist: "38-40", length: "31" }
  ]

  const womenSizes = [
    { size: "XS", chest: "32-34", waist: "24-26", length: "24" },
    { size: "S", chest: "34-36", waist: "26-28", length: "25" },
    { size: "M", chest: "36-38", waist: "28-30", length: "26" },
    { size: "L", chest: "38-40", waist: "30-32", length: "27" },
    { size: "XL", chest: "40-42", waist: "32-34", length: "28" },
    { size: "XXL", chest: "42-44", waist: "34-36", length: "29" }
  ]

  const kidsSizes = [
    { size: "2-3Y", chest: "20-21", waist: "19-20", length: "16" },
    { size: "4-5Y", chest: "22-23", waist: "20-21", length: "18" },
    { size: "6-7Y", chest: "24-25", waist: "21-22", length: "20" },
    { size: "8-9Y", chest: "26-27", waist: "22-23", length: "22" },
    { size: "10-11Y", chest: "28-29", waist: "23-24", length: "24" },
    { size: "12-13Y", chest: "30-31", waist: "24-25", length: "26" }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Ruler className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Size Guide</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Find your perfect fit with our comprehensive sizing charts and measurement guide.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Size Charts */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="men" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="men" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Men
                </TabsTrigger>
                <TabsTrigger value="women" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Women
                </TabsTrigger>
                <TabsTrigger value="kids" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Kids
                </TabsTrigger>
              </TabsList>

              <TabsContent value="men">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shirt className="h-5 w-5" />
                      Men's T-Shirt Sizes
                      <Badge variant="secondary">All measurements in inches</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3 font-semibold">Size</th>
                            <th className="text-left p-3 font-semibold">Chest</th>
                            <th className="text-left p-3 font-semibold">Waist</th>
                            <th className="text-left p-3 font-semibold">Length</th>
                          </tr>
                        </thead>
                        <tbody>
                          {menSizes.map((size, index) => (
                            <tr key={index} className="border-b hover:bg-gray-50">
                              <td className="p-3 font-medium">{size.size}</td>
                              <td className="p-3">{size.chest}</td>
                              <td className="p-3">{size.waist}</td>
                              <td className="p-3">{size.length}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="women">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shirt className="h-5 w-5" />
                      Women's T-Shirt Sizes
                      <Badge variant="secondary">All measurements in inches</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3 font-semibold">Size</th>
                            <th className="text-left p-3 font-semibold">Chest</th>
                            <th className="text-left p-3 font-semibold">Waist</th>
                            <th className="text-left p-3 font-semibold">Length</th>
                          </tr>
                        </thead>
                        <tbody>
                          {womenSizes.map((size, index) => (
                            <tr key={index} className="border-b hover:bg-gray-50">
                              <td className="p-3 font-medium">{size.size}</td>
                              <td className="p-3">{size.chest}</td>
                              <td className="p-3">{size.waist}</td>
                              <td className="p-3">{size.length}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="kids">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shirt className="h-5 w-5" />
                      Kids T-Shirt Sizes
                      <Badge variant="secondary">All measurements in inches</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3 font-semibold">Age</th>
                            <th className="text-left p-3 font-semibold">Chest</th>
                            <th className="text-left p-3 font-semibold">Waist</th>
                            <th className="text-left p-3 font-semibold">Length</th>
                          </tr>
                        </thead>
                        <tbody>
                          {kidsSizes.map((size, index) => (
                            <tr key={index} className="border-b hover:bg-gray-50">
                              <td className="p-3 font-medium">{size.size}</td>
                              <td className="p-3">{size.chest}</td>
                              <td className="p-3">{size.waist}</td>
                              <td className="p-3">{size.length}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Measurement Guide */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Info className="h-5 w-5" />
                  How to Measure
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm">Chest</h4>
                    <p className="text-xs text-gray-600">Measure around the fullest part of your chest, keeping the tape horizontal.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Waist</h4>
                    <p className="text-xs text-gray-600">Measure around your natural waistline, keeping the tape comfortably loose.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Length</h4>
                    <p className="text-xs text-gray-600">Measure from the highest point of the shoulder to the desired length.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fit Guide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="font-medium text-sm">Regular Fit</p>
                  <p className="text-xs text-gray-600">Comfortable, relaxed fit with room to move</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="font-medium text-sm">Slim Fit</p>
                  <p className="text-xs text-gray-600">Closer to body, modern tailored look</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="font-medium text-sm">Oversized</p>
                  <p className="text-xs text-gray-600">Loose, relaxed fit for casual wear</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}