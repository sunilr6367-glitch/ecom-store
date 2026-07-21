import PDFDocument from 'pdfkit';

// Type definitions for invoice data
export interface InvoiceLineItem {
  product_title?: string;
  variant_title?: string;
  unit_price: number;
  quantity: number;
  total: number;
}

export interface InvoiceOrderData {
  id: string;
  order_number: string | number;
  created_at: Date | string;
  total: number;
  subtotal: number;
  shipping_total?: number;
  tax_total?: number;
  email: string;
  customer_first_name?: string;
  customer_last_name?: string;
  billing_address?: string | Record<string, unknown>;
}

export const generateInvoice = async (
  order: InvoiceOrderData,
  items: InvoiceLineItem[]
): Promise<Buffer> => {
  const doc = new PDFDocument({ margin: 50 });

  const buffers: Buffer[] = [];
  doc.on('data', buffers.push.bind(buffers));

  // -- Header --
  doc
    .fillColor('#000000')
    .font('Times-Bold')
    .fontSize(24)
    .text('ODHVICA', 50, 55)
    .font('Times-Roman')
    .fontSize(10)
    .fillColor('#666666')
    .text('support@odhvica.com', 50, 82)
    .font('Times-Bold')
    .fontSize(14)
    .fillColor('#111111')
    .text('INVOICE', 200, 60, { align: 'right' })
    .moveDown();

  // Thin separator rule
  doc
    .moveTo(50, 105)
    .lineTo(550, 105)
    .strokeColor('#E5E5E5')
    .lineWidth(0.5)
    .stroke();

  // -- Details Layout (Bill To & Order Details) --
  // Let's use clean y positions and column grid
  const detailsY = 125;
  doc
    .fillColor('#000000')
    .font('Times-Bold')
    .fontSize(10)
    .text('BILL TO:', 50, detailsY)
    .font('Times-Roman')
    .fontSize(10)
    .text(
      `${order.customer_first_name || ''} ${order.customer_last_name || ''}`,
      50,
      detailsY + 15
    )
    .text(order.email, 50, detailsY + 30);

  // Try to parse billing address
  let addressOffset = 45;
  try {
    if (order.billing_address) {
      const addr =
        typeof order.billing_address === 'string'
          ? JSON.parse(order.billing_address)
          : order.billing_address;

      if (addr.street) {
        doc.text(addr.street, 50, detailsY + addressOffset);
        addressOffset += 15;
      }
      if (addr.city && addr.country) {
        doc.text(`${addr.city}, ${addr.country}`, 50, detailsY + addressOffset);
      }
    }
  } catch (error: unknown) {
    console.warn(
      `[PDF Service] Failed to parse billing address for order ${order.id}:`,
      error
    );
  }

  // Right column: Invoice Info
  const rightColX = 350;
  doc
    .font('Times-Bold')
    .text('INVOICE DETAILS:', rightColX, detailsY)
    .font('Times-Roman')
    .text(`Invoice No: #${order.order_number}`, rightColX, detailsY + 15)
    .text(
      `Date: ${new Date(order.created_at).toLocaleDateString()}`,
      rightColX,
      detailsY + 30
    )
    .text(`Balance Due: $${(order.total / 100).toFixed(2)}`, rightColX, detailsY + 45);

  // -- Table Header --
  let y = 230;
  doc
    .moveTo(50, y - 5)
    .lineTo(550, y - 5)
    .strokeColor('#E5E5E5')
    .lineWidth(0.5)
    .stroke();

  doc
    .fontSize(9)
    .font('Times-Bold')
    .fillColor('#111111')
    .text('ITEM', 50, y, { width: 250 })
    .text('UNIT PRICE', 300, y, { width: 90, align: 'right' })
    .text('QTY', 400, y, { width: 50, align: 'right' })
    .text('TOTAL', 450, y, { width: 90, align: 'right' });

  doc
    .moveTo(50, y + 15)
    .lineTo(550, y + 15)
    .strokeColor('#111111')
    .lineWidth(0.75)
    .stroke();
  y += 25;

  // -- Items --
  doc.font('Times-Roman').fontSize(9.5).fillColor('#333333');
  for (const item of items) {
    const title = item.product_title || 'Unknown Product';
    const variant = item.variant_title ? ` (${item.variant_title})` : '';
    const name = title + variant;
    const price = (item.unit_price / 100).toFixed(2);
    const total = (item.total / 100).toFixed(2);

    const nameHeight = doc.heightOfString(name, { width: 250 });

    doc
      .text(name, 50, y, { width: 250 })
      .text(`$${price}`, 300, y, { width: 90, align: 'right' })
      .text(item.quantity.toString(), 400, y, { width: 50, align: 'right' })
      .text(`$${total}`, 450, y, { width: 90, align: 'right' });

    y += Math.max(20, nameHeight + 6);

    // Page break check (simplified)
    if (y > 700) {
      doc.addPage();
      y = 50;
    }
  }

  doc
    .moveTo(50, y + 5)
    .lineTo(550, y + 5)
    .strokeColor('#E5E5E5')
    .lineWidth(0.5)
    .stroke();
  y += 20;

  // -- Totals --
  const rightAlign = 450;

  doc.fontSize(9.5).fillColor('#555555');
  doc.text('Subtotal:', 350, y, { width: 90, align: 'right' });
  doc.text(`$${(order.subtotal / 100).toFixed(2)}`, rightAlign, y, {
    width: 90,
    align: 'right',
  });
  y += 18;

  const shippingTotal = order.shipping_total ?? 0;
  if (shippingTotal > 0) {
    doc.text('Shipping:', 350, y, { width: 90, align: 'right' });
    doc.text(`$${(shippingTotal / 100).toFixed(2)}`, rightAlign, y, {
      width: 90,
      align: 'right',
    });
    y += 18;
  }

  const taxTotal = order.tax_total ?? 0;
  if (taxTotal > 0) {
    doc.text('Tax:', 350, y, { width: 90, align: 'right' });
    doc.text(`$${(taxTotal / 100).toFixed(2)}`, rightAlign, y, {
      width: 90,
      align: 'right',
    });
    y += 18;
  }

  doc
    .moveTo(350, y + 2)
    .lineTo(540, y + 2)
    .strokeColor('#E5E5E5')
    .lineWidth(0.5)
    .stroke();
  y += 10;

  doc
    .font('Times-Bold')
    .fontSize(11)
    .fillColor('#000000')
    .text('Total:', 350, y, { width: 90, align: 'right' });
  doc.text(`$${(order.total / 100).toFixed(2)}`, rightAlign, y, {
    width: 90,
    align: 'right',
  });

  doc.end();

  return new Promise<Buffer>((resolve) => {
    doc.on('end', () => {
      resolve(Buffer.concat(buffers));
    });
  });
};
