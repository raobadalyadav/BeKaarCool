// PDF Invoice Generator using jsPDF
export const generateInvoicePDF = (invoice: any) => {
  // This will be imported dynamically to avoid SSR issues
  import('jspdf').then(({ default: jsPDF }) => {
    const doc = new jsPDF()
    
    // Company Header
    doc.setFontSize(20)
    doc.setTextColor(59, 130, 246) // Blue color
    doc.text('BeKaarCool', 20, 30)
    
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.text('Custom Clothing & Print-on-Demand', 20, 40)
    doc.text('Mumbai, Maharashtra, India', 20, 48)
    doc.text('Email: support@bekaar-cool.com', 20, 56)
    doc.text('Phone: +91 9876543210', 20, 64)
    
    // Invoice Title
    doc.setFontSize(16)
    doc.setTextColor(0, 0, 0)
    doc.text('INVOICE', 150, 30)
    
    // Invoice Details
    doc.setFontSize(10)
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, 150, 45)
    doc.text(`Order #: ${invoice.orderNumber}`, 150, 53)
    doc.text(`Date: ${new Date(invoice.date).toLocaleDateString()}`, 150, 61)
    doc.text(`Status: ${invoice.status.toUpperCase()}`, 150, 69)
    
    // Line separator
    doc.setDrawColor(200, 200, 200)
    doc.line(20, 80, 190, 80)
    
    // Customer Details
    doc.setFontSize(12)
    doc.text('Bill To:', 20, 95)
    doc.setFontSize(10)
    doc.text(invoice.customer.name, 20, 105)
    doc.text(invoice.customer.email, 20, 113)
    doc.text(invoice.customer.phone, 20, 121)
    doc.text(invoice.customer.address, 20, 129)
    doc.text(`${invoice.customer.city}, ${invoice.customer.state} ${invoice.customer.pincode}`, 20, 137)
    doc.text(invoice.customer.country, 20, 145)
    
    // Items Table Header
    let yPos = 165
    doc.setFillColor(59, 130, 246)
    doc.rect(20, yPos - 8, 170, 12, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.text('Item', 25, yPos)
    doc.text('Qty', 120, yPos)
    doc.text('Price', 140, yPos)
    doc.text('Total', 165, yPos)
    
    // Items
    doc.setTextColor(0, 0, 0)
    yPos += 15
    
    invoice.items.forEach((item: any) => {
      doc.text(item.name, 25, yPos)
      if (item.size || item.color) {
        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)
        doc.text(`${item.size ? `Size: ${item.size}` : ''} ${item.color ? `Color: ${item.color}` : ''}`, 25, yPos + 6)
        doc.setFontSize(10)
        doc.setTextColor(0, 0, 0)
      }
      
      doc.text(item.quantity.toString(), 125, yPos)
      doc.text(`₹${item.price}`, 145, yPos)
      doc.text(`₹${item.total}`, 170, yPos)
      
      yPos += item.size || item.color ? 18 : 12
    })
    
    // Totals
    yPos += 10
    doc.setDrawColor(200, 200, 200)
    doc.line(120, yPos, 190, yPos)
    
    yPos += 10
    doc.text('Subtotal:', 140, yPos)
    doc.text(`₹${invoice.subtotal}`, 170, yPos)
    
    yPos += 8
    doc.text('Shipping:', 140, yPos)
    doc.text(invoice.shipping > 0 ? `₹${invoice.shipping}` : 'Free', 170, yPos)
    
    yPos += 8
    doc.text('Tax (18% GST):', 140, yPos)
    doc.text(`₹${invoice.tax}`, 170, yPos)
    
    if (invoice.discount > 0) {
      yPos += 8
      doc.setTextColor(34, 197, 94) // Green
      doc.text('Discount:', 140, yPos)
      doc.text(`-₹${invoice.discount}`, 170, yPos)
      doc.setTextColor(0, 0, 0)
    }
    
    yPos += 12
    doc.setDrawColor(0, 0, 0)
    doc.line(120, yPos, 190, yPos)
    
    yPos += 10
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Total:', 140, yPos)
    doc.text(`₹${invoice.total}`, 170, yPos)
    
    // Payment Info
    yPos += 20
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Payment Information:', 20, yPos)
    yPos += 10
    doc.text(`Method: ${invoice.paymentMethod.toUpperCase()}`, 20, yPos)
    yPos += 8
    doc.text(`Status: ${invoice.paymentStatus.toUpperCase()}`, 20, yPos)
    if (invoice.paymentId) {
      yPos += 8
      doc.text(`Transaction ID: ${invoice.paymentId}`, 20, yPos)
    }
    
    // Footer
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text('Thank you for shopping with BeKaarCool!', 20, 280)
    doc.text('For support, contact us at support@bekaar-cool.com', 20, 288)
    
    // Save PDF
    doc.save(`invoice-${invoice.orderNumber}.pdf`)
  })
}

// Simple HTML to PDF converter for better styling
export const generateStyledInvoiceHTML = (invoice: any): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice ${invoice.invoiceNumber}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; color: #333; }
        .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 30px; border-bottom: 2px solid #3B82F6; padding-bottom: 20px; }
        .company { flex: 1; }
        .company h1 { color: #3B82F6; margin: 0; font-size: 28px; }
        .company p { margin: 5px 0; color: #666; }
        .invoice-info { text-align: right; }
        .invoice-info h2 { margin: 0; color: #333; }
        .invoice-info p { margin: 5px 0; }
        .customer { background: #F8FAFC; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .customer h3 { margin-top: 0; color: #3B82F6; }
        .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .items-table th { background: #3B82F6; color: white; padding: 12px; text-align: left; }
        .items-table td { padding: 12px; border-bottom: 1px solid #E5E7EB; }
        .items-table tr:nth-child(even) { background: #F9FAFB; }
        .totals { margin-left: auto; width: 300px; }
        .totals table { width: 100%; }
        .totals td { padding: 8px; }
        .total-row { font-weight: bold; font-size: 18px; border-top: 2px solid #3B82F6; }
        .payment-info { background: #F0F9FF; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; color: #666; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        .status-paid { background: #D1FAE5; color: #065F46; }
        .status-pending { background: #FEF3C7; color: #92400E; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company">
          <h1>BeKaarCool</h1>
          <p>Custom Clothing & Print-on-Demand</p>
          <p>Mumbai, Maharashtra, India</p>
          <p>Email: support@bekaar-cool.com</p>
          <p>Phone: +91 9876543210</p>
          <p>GST: 27ABCDE1234F1Z5</p>
        </div>
        <div class="invoice-info">
          <h2>INVOICE</h2>
          <p><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
          <p><strong>Order #:</strong> ${invoice.orderNumber}</p>
          <p><strong>Date:</strong> ${new Date(invoice.date).toLocaleDateString()}</p>
          <p><span class="status-badge status-${invoice.paymentStatus}">${invoice.paymentStatus.toUpperCase()}</span></p>
        </div>
      </div>

      <div class="customer">
        <h3>Bill To:</h3>
        <p><strong>${invoice.customer.name}</strong></p>
        <p>${invoice.customer.email}</p>
        <p>${invoice.customer.phone}</p>
        <p>${invoice.customer.address}</p>
        <p>${invoice.customer.city}, ${invoice.customer.state} ${invoice.customer.pincode}</p>
        <p>${invoice.customer.country}</p>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Item Description</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map((item: any) => `
            <tr>
              <td>
                <strong>${item.name}</strong>
                ${item.size || item.color ? `<br><small>Size: ${item.size || 'N/A'} | Color: ${item.color || 'N/A'}</small>` : ''}
              </td>
              <td>${item.quantity}</td>
              <td>₹${item.price}</td>
              <td>₹${item.total}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals">
        <table>
          <tr><td>Subtotal:</td><td>₹${invoice.subtotal}</td></tr>
          <tr><td>Shipping:</td><td>${invoice.shipping > 0 ? `₹${invoice.shipping}` : 'Free'}</td></tr>
          <tr><td>Tax (18% GST):</td><td>₹${invoice.tax}</td></tr>
          ${invoice.discount > 0 ? `<tr style="color: #059669;"><td>Discount:</td><td>-₹${invoice.discount}</td></tr>` : ''}
          <tr class="total-row"><td>Total:</td><td>₹${invoice.total}</td></tr>
        </table>
      </div>

      <div class="payment-info">
        <h3>Payment Information</h3>
        <p><strong>Method:</strong> ${invoice.paymentMethod.toUpperCase()}</p>
        <p><strong>Status:</strong> <span class="status-badge status-${invoice.paymentStatus}">${invoice.paymentStatus.toUpperCase()}</span></p>
        ${invoice.paymentId ? `<p><strong>Transaction ID:</strong> ${invoice.paymentId}</p>` : ''}
      </div>

      <div class="footer">
        <p><strong>Thank you for shopping with BeKaarCool!</strong></p>
        <p>For support or queries, contact us at support@bekaar-cool.com</p>
        <p>This is a computer-generated invoice and does not require a signature.</p>
      </div>
    </body>
    </html>
  `
}