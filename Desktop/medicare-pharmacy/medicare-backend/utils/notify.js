import Notification from '../models/Notification.js'
import mongoose from 'mongoose'

const statusMessages = {
  Pending: { title: 'Order Placed', message: (n) => `Your order ${n} has been placed and is awaiting confirmation.`, type: 'order_placed' },
  Confirmed: { title: 'Order Confirmed', message: (n) => `Your order ${n} has been confirmed by the pharmacy.`, type: 'order_status' },
  Preparing: { title: 'Order Preparing', message: (n) => `Your order ${n} is being prepared.`, type: 'order_status' },
  'Out for Delivery': {
    title: 'Out for Delivery',
    message: (n, order) => `Your order ${n} is out for delivery.${order?.deliveryOtp ? ` Share this OTP with the rider only when your order arrives: ${order.deliveryOtp}` : ''}`,
    type: 'order_status',
  },
  Delivered: { title: 'Order Delivered', message: (n) => `Your order ${n} has been delivered. Enjoy your day!`, type: 'order_status' },
  Cancelled: { title: 'Order Cancelled', message: (n) => `Your order ${n} has been cancelled.`, type: 'order_cancelled' },
}

export async function notifyOrderStatus(userId, order) {
  const entry = statusMessages[order.status]
  if (!entry) return
  await Notification.create({
    user: userId,
    title: entry.title,
    message: entry.message(order.orderNumber, order),
    type: entry.type,
    relatedOrder: order._id,
  })
}

export async function notifyPayment(userId, order, success) {
  await Notification.create({
    user: userId,
    title: success ? 'Payment Successful' : 'Payment Failed',
    message: success
      ? `Payment of ₹${order.total} for order ${order.orderNumber} was successful.`
      : `Payment for order ${order.orderNumber} failed. Please try again or choose Cash on Delivery.`,
    type: success ? 'payment_success' : 'payment_failed',
    relatedOrder: order._id,
  })
}

// Alerts every owner account the moment a new order comes in — this is what
// powers the "new order" sound/badge on the Owner Dashboard.
export async function notifyNewOrderToOwners(order) {
  const User = mongoose.model('User')
  const owners = await User.find({ role: 'owner' }).select('_id')
  await Notification.insertMany(
    owners.map((o) => ({
      user: o._id,
      title: 'New Order Received',
      message: `${order.orderNumber} — ₹${order.total} (${order.items?.length || 0} item${order.items?.length === 1 ? '' : 's'})`,
      type: 'order_placed',
      relatedOrder: order._id,
    }))
  )
}

// Alerts a delivery staff member the moment the owner assigns an order to them —
// this is what powers the sound/badge on the Delivery Dashboard.
export async function notifyDeliveryAssignment(deliveryStaffId, order) {
  await Notification.create({
    user: deliveryStaffId,
    title: 'New Delivery Assigned',
    message: `${order.orderNumber} has been assigned to you — ${order.address?.area || order.address?.city || 'check the address'}.`,
    type: 'order_status',
    relatedOrder: order._id,
  })
}
