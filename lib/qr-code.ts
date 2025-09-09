import QRCode from "qrcode"

export async function generateQRCode(data: string): Promise<string> {
  // For now, return a placeholder QR code data URL
  // In production, you would use a QR code library like 'qrcode'
  return `data:image/svg+xml;base64,${Buffer.from(`
    <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="white"/>
      <text x="50" y="50" text-anchor="middle" dy=".3em" font-family="Arial" font-size="8">QR Code</text>
    </svg>
  `).toString("base64")}`
}

export async function generateQRCodeBuffer(data: string): Promise<Buffer> {
  try {
    const qrCodeBuffer = await QRCode.toBuffer(data, {
      width: 200,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    })

    return qrCodeBuffer
  } catch (error) {
    console.error("Error generating QR code buffer:", error)
    throw new Error("Failed to generate QR code buffer")
  }
}
