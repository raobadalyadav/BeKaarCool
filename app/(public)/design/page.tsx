"use client"

import { useState, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import {
  Type,
  Square,
  Circle,
  Triangle,
  Save,
  ShoppingCart,
  Undo,
  Redo,
  Trash2,
  ZoomIn,
  ZoomOut,
  Layers,
  Eye,
  EyeOff,
  Copy,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DesignElement {
  id: string
  type: "text" | "shape" | "image"
  x: number
  y: number
  width: number
  height: number
  rotation: number
  content?: string
  fontSize?: number
  fontFamily?: string
  color?: string
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  src?: string
  visible: boolean
  locked: boolean
}

interface Product {
  id: string
  name: string
  type: "tshirt" | "hoodie" | "mug" | "mobile-cover" | "tote-bag"
  basePrice: number
  image: string
  canvasWidth: number
  canvasHeight: number
}

const products: Product[] = [
  {
    id: "tshirt",
    name: "Custom T-Shirt",
    type: "tshirt",
    basePrice: 599,
    image: "/placeholder.svg?height=300&width=300&text=T-Shirt",
    canvasWidth: 300,
    canvasHeight: 400,
  },
  {
    id: "hoodie",
    name: "Custom Hoodie",
    type: "hoodie",
    basePrice: 1299,
    image: "/placeholder.svg?height=300&width=300&text=Hoodie",
    canvasWidth: 300,
    canvasHeight: 400,
  },
  {
    id: "mug",
    name: "Custom Mug",
    type: "mug",
    basePrice: 299,
    image: "/placeholder.svg?height=300&width=300&text=Mug",
    canvasWidth: 250,
    canvasHeight: 200,
  },
  {
    id: "mobile-cover",
    name: "Mobile Cover",
    type: "mobile-cover",
    basePrice: 399,
    image: "/placeholder.svg?height=300&width=150&text=Mobile+Cover",
    canvasWidth: 150,
    canvasHeight: 300,
  },
  {
    id: "tote-bag",
    name: "Tote Bag",
    type: "tote-bag",
    basePrice: 499,
    image: "/placeholder.svg?height=300&width=300&text=Tote+Bag",
    canvasWidth: 300,
    canvasHeight: 350,
  },
]

const templates = [
  {
    id: "1",
    name: "Motivational Quote",
    category: "text",
    thumbnail: "/placeholder.svg?height=100&width=100&text=Quote",
    elements: [
      {
        id: "text1",
        type: "text" as const,
        x: 50,
        y: 100,
        width: 200,
        height: 50,
        rotation: 0,
        content: "NEVER GIVE UP",
        fontSize: 24,
        fontFamily: "Arial",
        color: "#000000",
        visible: true,
        locked: false,
      },
    ],
  },
  {
    id: "2",
    name: "Geometric Design",
    category: "shapes",
    thumbnail: "/placeholder.svg?height=100&width=100&text=Geometric",
    elements: [
      {
        id: "shape1",
        type: "shape" as const,
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        rotation: 45,
        backgroundColor: "#3B82F6",
        visible: true,
        locked: false,
      },
    ],
  },
]

const fonts = ["Arial", "Helvetica", "Times New Roman", "Georgia", "Verdana", "Impact", "Comic Sans MS"]

export default function DesignStudioPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const canvasRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const [selectedProduct, setSelectedProduct] = useState<Product>(products[0])
  const [productFromUrl, setProductFromUrl] = useState<string | null>(null)

  useEffect(() => {
    // Check if product ID is in URL params
    const urlParams = new URLSearchParams(window.location.search)
    const productId = urlParams.get('product')
    if (productId) {
      setProductFromUrl(productId)
    }
  }, [])
  const [elements, setElements] = useState<DesignElement[]>([])
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [tool, setTool] = useState<"select" | "text" | "shape" | "image">("select")
  const [zoom, setZoom] = useState(100)
  const [history, setHistory] = useState<DesignElement[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [saving, setSaving] = useState(false)

  // Text properties
  const [textContent, setTextContent] = useState("")
  const [fontSize, setFontSize] = useState(24)
  const [fontFamily, setFontFamily] = useState("Arial")
  const [textColor, setTextColor] = useState("#000000")

  // Shape properties
  const [shapeType, setShapeType] = useState<"rectangle" | "circle" | "triangle">("rectangle")
  const [backgroundColor, setBackgroundColor] = useState("#3B82F6")
  const [borderColor, setBorderColor] = useState("#000000")
  const [borderWidth, setBorderWidth] = useState(0)

  useEffect(() => {
    saveToHistory()
  }, [elements])

  const saveToHistory = () => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push([...elements])
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setElements([...history[historyIndex - 1]])
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setElements([...history[historyIndex + 1]])
    }
  }

  const addTextElement = () => {
    if (!textContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text",
        variant: "destructive",
      })
      return
    }

    const newElement: DesignElement = {
      id: `text-${Date.now()}`,
      type: "text",
      x: 50,
      y: 50,
      width: 200,
      height: 50,
      rotation: 0,
      content: textContent,
      fontSize,
      fontFamily,
      color: textColor,
      visible: true,
      locked: false,
    }

    setElements([...elements, newElement])
    setTextContent("")
    setTool("select")
  }

  const addShapeElement = () => {
    const newElement: DesignElement = {
      id: `shape-${Date.now()}`,
      type: "shape",
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      rotation: 0,
      backgroundColor,
      borderColor,
      borderWidth,
      visible: true,
      locked: false,
    }

    setElements([...elements, newElement])
    setTool("select")
  }

  const updateElement = (id: string, updates: Partial<DesignElement>) => {
    setElements(elements.map((el) => (el.id === id ? { ...el, ...updates } : el)))
  }

  const deleteElement = (id: string) => {
    setElements(elements.filter((el) => el.id !== id))
    setSelectedElement(null)
  }

  const duplicateElement = (id: string) => {
    const element = elements.find((el) => el.id === id)
    if (element) {
      const newElement = {
        ...element,
        id: `${element.type}-${Date.now()}`,
        x: element.x + 20,
        y: element.y + 20,
      }
      setElements([...elements, newElement])
    }
  }

  const applyTemplate = (template: any) => {
    setElements(template.elements.map((el: any) => ({ ...el, id: `${el.type}-${Date.now()}` })))
    toast({
      title: "Template Applied",
      description: "Template has been applied to your design",
    })
  }

  const saveDesign = async () => {
    if (!session) {
      toast({
        title: "Login Required",
        description: "Please login to save your design",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${selectedProduct.name} Design`,
          productType: selectedProduct.type,
          elements,
          canvasWidth: selectedProduct.canvasWidth,
          canvasHeight: selectedProduct.canvasHeight,
        }),
      })

      if (response.ok) {
        toast({
          title: "Design Saved",
          description: "Your design has been saved successfully",
        })
      } else {
        throw new Error("Failed to save design")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save design",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const addToCart = async () => {
    if (!session) {
      toast({
        title: "Login Required",
        description: "Please login to add items to cart",
        variant: "destructive",
      })
      return
    }

    if (elements.length === 0) {
      toast({
        title: "No Design",
        description: "Please add some elements to your design first",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productType: selectedProduct.type,
          productName: selectedProduct.name,
          basePrice: selectedProduct.basePrice,
          customization: {
            elements,
            canvasWidth: selectedProduct.canvasWidth,
            canvasHeight: selectedProduct.canvasHeight,
          },
        }),
      })

      if (response.ok) {
        toast({
          title: "Added to Cart",
          description: "Your custom design has been added to cart",
        })
      } else {
        throw new Error("Failed to add to cart")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add to cart",
        variant: "destructive",
      })
    }
  }

  const selectedEl = elements.find((el) => el.id === selectedElement)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Left Sidebar - Tools */}
        <div className="w-80 bg-white border-r overflow-y-auto">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold text-gray-900">Design Studio</h2>
            <p className="text-sm text-gray-600">Create your custom design</p>
          </div>

          <Tabs defaultValue="products" className="w-full">
            <TabsList className="grid w-full grid-cols-4 m-4">
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="tools">Tools</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="layers">Layers</TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="p-4 space-y-4">
              <div className="grid grid-cols-1 gap-3">
                {products.map((product) => (
                  <Card
                    key={product.id}
                    className={`cursor-pointer transition-all ${
                      selectedProduct.id === product.id ? "ring-2 ring-blue-500" : ""
                    }`}
                    onClick={() => setSelectedProduct(product)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-3">
                        <img
                          src={product.image || "/placeholder.svg"}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div>
                          <h3 className="font-medium text-sm">{product.name}</h3>
                          <p className="text-sm text-gray-600">₹{product.basePrice}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="tools" className="p-4 space-y-6">
              {/* Text Tool */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center">
                    <Type className="mr-2 h-4 w-4" />
                    Add Text
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    placeholder="Enter your text"
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    rows={2}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Font</Label>
                      <Select value={fontFamily} onValueChange={setFontFamily}>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fonts.map((font) => (
                            <SelectItem key={font} value={font}>
                              {font}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Size</Label>
                      <Input
                        type="number"
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        className="h-8"
                        min="8"
                        max="72"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Color</Label>
                    <Input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="h-8 w-full"
                    />
                  </div>
                  <Button onClick={addTextElement} className="w-full" size="sm">
                    Add Text
                  </Button>
                </CardContent>
              </Card>

              {/* Shape Tool */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center">
                    <Square className="mr-2 h-4 w-4" />
                    Add Shape
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={shapeType === "rectangle" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShapeType("rectangle")}
                    >
                      <Square className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={shapeType === "circle" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShapeType("circle")}
                    >
                      <Circle className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={shapeType === "triangle" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShapeType("triangle")}
                    >
                      <Triangle className="h-4 w-4" />
                    </Button>
                  </div>
                  <div>
                    <Label className="text-xs">Fill Color</Label>
                    <Input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="h-8 w-full"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Border</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="color"
                        value={borderColor}
                        onChange={(e) => setBorderColor(e.target.value)}
                        className="h-8"
                      />
                      <Input
                        type="number"
                        value={borderWidth}
                        onChange={(e) => setBorderWidth(Number(e.target.value))}
                        className="h-8"
                        min="0"
                        max="10"
                        placeholder="Width"
                      />
                    </div>
                  </div>
                  <Button onClick={addShapeElement} className="w-full" size="sm">
                    Add Shape
                  </Button>
                </CardContent>
              </Card>

              {/* Element Properties */}
              {selectedEl && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Element Properties</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">X Position</Label>
                        <Input
                          type="number"
                          value={selectedEl.x}
                          onChange={(e) => updateElement(selectedEl.id, { x: Number(e.target.value) })}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Y Position</Label>
                        <Input
                          type="number"
                          value={selectedEl.y}
                          onChange={(e) => updateElement(selectedEl.id, { y: Number(e.target.value) })}
                          className="h-8"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Width</Label>
                        <Input
                          type="number"
                          value={selectedEl.width}
                          onChange={(e) => updateElement(selectedEl.id, { width: Number(e.target.value) })}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Height</Label>
                        <Input
                          type="number"
                          value={selectedEl.height}
                          onChange={(e) => updateElement(selectedEl.id, { height: Number(e.target.value) })}
                          className="h-8"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Rotation</Label>
                      <Slider
                        value={[selectedEl.rotation]}
                        onValueChange={([value]) => updateElement(selectedEl.id, { rotation: value })}
                        max={360}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                    {selectedEl.type === "text" && (
                      <>
                        <div>
                          <Label className="text-xs">Content</Label>
                          <Textarea
                            value={selectedEl.content || ""}
                            onChange={(e) => updateElement(selectedEl.id, { content: e.target.value })}
                            rows={2}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Font Size</Label>
                          <Input
                            type="number"
                            value={selectedEl.fontSize || 24}
                            onChange={(e) => updateElement(selectedEl.id, { fontSize: Number(e.target.value) })}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Color</Label>
                          <Input
                            type="color"
                            value={selectedEl.color || "#000000"}
                            onChange={(e) => updateElement(selectedEl.id, { color: e.target.value })}
                            className="h-8"
                          />
                        </div>
                      </>
                    )}
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => duplicateElement(selectedEl.id)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateElement(selectedEl.id, { visible: !selectedEl.visible })}
                      >
                        {selectedEl.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteElement(selectedEl.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="templates" className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {templates.map((template) => (
                  <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-3" onClick={() => applyTemplate(template)}>
                      <img
                        src={template.thumbnail || "/placeholder.svg"}
                        alt={template.name}
                        className="w-full h-20 object-cover rounded mb-2"
                      />
                      <h3 className="font-medium text-xs">{template.name}</h3>
                      <Badge variant="outline" className="text-xs mt-1">
                        {template.category}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="layers" className="p-4 space-y-2">
              {elements.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No elements added yet</p>
              ) : (
                elements.map((element, index) => (
                  <Card
                    key={element.id}
                    className={`cursor-pointer transition-all ${
                      selectedElement === element.id ? "ring-2 ring-blue-500" : ""
                    }`}
                    onClick={() => setSelectedElement(element.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Layers className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            {element.type === "text" ? element.content?.slice(0, 20) : `${element.type} ${index + 1}`}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              updateElement(element.id, { visible: !element.visible })
                            }}
                          >
                            {element.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteElement(element.id)
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Top Toolbar */}
          <div className="bg-white border-b p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-semibold">{selectedProduct.name}</h1>
              <Badge>₹{selectedProduct.basePrice}</Badge>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0}>
                <Undo className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}>
                <Redo className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button variant="outline" size="sm" onClick={() => setZoom(Math.max(50, zoom - 10))}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium w-12 text-center">{zoom}%</span>
              <Button variant="outline" size="sm" onClick={() => setZoom(Math.min(200, zoom + 10))}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button variant="outline" size="sm" onClick={saveDesign} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button onClick={addToCart} disabled={elements.length === 0}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 bg-gray-100 p-8 overflow-auto">
            <div className="flex items-center justify-center min-h-full">
              <div className="relative bg-white rounded-lg shadow-lg p-8">
                <div
                  ref={canvasRef}
                  className="relative border-2 border-dashed border-gray-300 bg-gray-50"
                  style={{
                    width: (selectedProduct.canvasWidth * zoom) / 100,
                    height: (selectedProduct.canvasHeight * zoom) / 100,
                    backgroundImage: `url(${selectedProduct.image})`,
                    backgroundSize: "contain",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                  }}
                >
                  {elements.map((element) => (
                    <div
                      key={element.id}
                      className={`absolute cursor-pointer transition-all ${
                        selectedElement === element.id ? "ring-2 ring-blue-500" : ""
                      } ${!element.visible ? "opacity-50" : ""}`}
                      style={{
                        left: (element.x * zoom) / 100,
                        top: (element.y * zoom) / 100,
                        width: (element.width * zoom) / 100,
                        height: (element.height * zoom) / 100,
                        transform: `rotate(${element.rotation}deg)`,
                        zIndex: elements.indexOf(element) + 1,
                      }}
                      onClick={() => setSelectedElement(element.id)}
                    >
                      {element.type === "text" && (
                        <div
                          style={{
                            fontSize: (element.fontSize! * zoom) / 100,
                            fontFamily: element.fontFamily,
                            color: element.color,
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            textAlign: "center",
                            wordWrap: "break-word",
                          }}
                        >
                          {element.content}
                        </div>
                      )}
                      {element.type === "shape" && (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            backgroundColor: element.backgroundColor,
                            border: `${element.borderWidth}px solid ${element.borderColor}`,
                            borderRadius: shapeType === "circle" ? "50%" : "0",
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
