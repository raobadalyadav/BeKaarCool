import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify?token=${token}`

  const mailOptions = {
    from: process.env.FROM_EMAIL,
    to: email,
    subject: "Verify your BeKaarCool account",
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h1 style="color: #333; text-align: center;">Welcome to BeKaarCool!</h1>
        <p>Hi ${name},</p>
        <p>Thank you for signing up for BeKaarCool. Please click the button below to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #007bff;">${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account with BeKaarCool, you can safely ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px; text-align: center;">
          This email was sent by BeKaarCool. If you have any questions, please contact us at ${process.env.SUPPORT_EMAIL}
        </p>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
}

export async function sendPasswordResetEmail(email: string, name: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`

  const mailOptions = {
    from: process.env.FROM_EMAIL,
    to: email,
    subject: "Reset your BeKaarCool password",
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h1 style="color: #333; text-align: center;">Password Reset Request</h1>
        <p>Hi ${name},</p>
        <p>We received a request to reset your password for your BeKaarCool account. Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #dc3545;">${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px; text-align: center;">
          This email was sent by BeKaarCool. If you have any questions, please contact us at ${process.env.SUPPORT_EMAIL}
        </p>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
}

export async function sendOrderConfirmationEmail(email: string, name: string, order: any) {
  const orderUrl = `${process.env.NEXTAUTH_URL}/orders/${order._id}`

  const itemsHtml = order.items
    .map(
      (item: any) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        ${item.product?.name || item.name}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
        ₹${item.price}
      </td>
    </tr>
  `,
    )
    .join("")

  const mailOptions = {
    from: process.env.FROM_EMAIL,
    to: email,
    subject: `Order Confirmation - ${order.orderNumber}`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h1 style="color: #333; text-align: center;">Order Confirmed!</h1>
        <p>Hi ${name},</p>
        <p>Thank you for your order! We've received your order and it's being processed.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Order Details</h2>
          <p><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
          <p><strong>Total Amount:</strong> ₹${order.total}</p>
        </div>

        <h3>Items Ordered:</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Item</th>
              <th style="padding: 10px; text-align: center; border-bottom: 2px solid #dee2e6;">Quantity</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #dee2e6;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${orderUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Order Details
          </a>
        </div>

        <p>We'll send you another email when your order ships with tracking information.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px; text-align: center;">
          This email was sent by BeKaarCool. If you have any questions, please contact us at ${process.env.SUPPORT_EMAIL}
        </p>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
}

export async function sendOrderStatusUpdateEmail(email: string, name: string, order: any, newStatus: string) {
  const orderUrl = `${process.env.NEXTAUTH_URL}/orders/${order._id}`

  const statusMessages = {
    confirmed: "Your order has been confirmed and is being prepared.",
    processing: "Your order is currently being processed.",
    shipped: "Great news! Your order has been shipped.",
    delivered: "Your order has been delivered successfully.",
    cancelled: "Your order has been cancelled.",
    refunded: "Your order has been refunded.",
  }

  const message = statusMessages[newStatus as keyof typeof statusMessages] || "Your order status has been updated."

  const mailOptions = {
    from: process.env.FROM_EMAIL,
    to: email,
    subject: `Order Update - ${order.orderNumber}`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h1 style="color: #333; text-align: center;">Order Update</h1>
        <p>Hi ${name},</p>
        <p>${message}</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Order Details</h2>
          <p><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p><strong>Status:</strong> <span style="text-transform: capitalize; color: #007bff;">${newStatus}</span></p>
          ${order.trackingNumber ? `<p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>` : ""}
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${orderUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Order Details
          </a>
        </div>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px; text-align: center;">
          This email was sent by BeKaarCool. If you have any questions, please contact us at ${process.env.SUPPORT_EMAIL}
        </p>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
}

export async function sendSupportTicketEmail(ticket: any) {
  const ticketUrl = `${process.env.NEXTAUTH_URL}/support/tickets/${ticket._id}`
  
  const priorityColors = {
    low: "#28a745",
    medium: "#ffc107", 
    high: "#fd7e14",
    urgent: "#dc3545"
  }

  const categoryLabels = {
    order: "Order Issue",
    product: "Product Issue", 
    payment: "Payment Issue",
    shipping: "Shipping Issue",
    account: "Account Issue",
    technical: "Technical Issue",
    other: "Other"
  }

  // Send email to support team
  const supportMailOptions = {
    from: process.env.FROM_EMAIL,
    to: process.env.SUPPORT_EMAIL,
    subject: `New Support Ticket - ${ticket.ticketNumber}`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h1 style="color: #333; text-align: center;">New Support Ticket</h1>
        <p>A new support ticket has been created and requires attention.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Ticket Details</h2>
          <p><strong>Ticket Number:</strong> ${ticket.ticketNumber}</p>
          <p><strong>Customer:</strong> ${ticket.user?.name} (${ticket.user?.email})</p>
          <p><strong>Subject:</strong> ${ticket.subject}</p>
          <p><strong>Category:</strong> ${categoryLabels[ticket.category as keyof typeof categoryLabels] || ticket.category}</p>
          <p><strong>Priority:</strong> <span style="color: ${priorityColors[ticket.priority as keyof typeof priorityColors]}; text-transform: capitalize; font-weight: bold;">${ticket.priority}</span></p>
          <p><strong>Status:</strong> <span style="text-transform: capitalize;">${ticket.status}</span></p>
          <p><strong>Created:</strong> ${new Date(ticket.createdAt).toLocaleString()}</p>
        </div>

        <div style="background-color: #fff; border: 1px solid #dee2e6; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Description:</h3>
          <p style="white-space: pre-wrap;">${ticket.description}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${ticketUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Ticket
          </a>
        </div>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px; text-align: center;">
          This email was sent by BeKaarCool Support System.
        </p>
      </div>
    `,
  }

  // Send confirmation email to customer
  const customerMailOptions = {
    from: process.env.FROM_EMAIL,
    to: ticket.user?.email,
    subject: `Support Ticket Created - ${ticket.ticketNumber}`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h1 style="color: #333; text-align: center;">Support Ticket Created</h1>
        <p>Hi ${ticket.user?.name},</p>
        <p>Thank you for contacting BeKaarCool support. We've received your support ticket and our team will review it shortly.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Your Ticket Details</h2>
          <p><strong>Ticket Number:</strong> ${ticket.ticketNumber}</p>
          <p><strong>Subject:</strong> ${ticket.subject}</p>
          <p><strong>Category:</strong> ${categoryLabels[ticket.category as keyof typeof categoryLabels] || ticket.category}</p>
          <p><strong>Priority:</strong> <span style="text-transform: capitalize;">${ticket.priority}</span></p>
          <p><strong>Status:</strong> <span style="text-transform: capitalize;">${ticket.status}</span></p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${ticketUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Ticket
          </a>
        </div>

        <p>We aim to respond to all tickets within 24 hours. You'll receive an email notification when there's an update on your ticket.</p>
        <p>Please keep your ticket number <strong>${ticket.ticketNumber}</strong> for reference.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px; text-align: center;">
          This email was sent by BeKaarCool. If you have any questions, please contact us at ${process.env.SUPPORT_EMAIL}
        </p>
      </div>
    `,
  }

  // Send both emails
  await Promise.all([
    transporter.sendMail(supportMailOptions),
    transporter.sendMail(customerMailOptions)
  ])
}
