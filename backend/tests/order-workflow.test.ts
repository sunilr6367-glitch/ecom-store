import { describe, expect, it } from 'vitest';
import {
  buildWorkflowSummary,
  mergeWorkflowMetadata,
} from '../src/utils/order-workflow';

describe('order workflow metadata', () => {
  it('hydrates workflow dates and notes from order metadata', () => {
    const summary = buildWorkflowSummary({
      status: 'processing',
      created_at: '2026-05-01T10:00:00.000Z',
      metadata: {
        workflow_status: 'processing',
        ship_by_date: '2026-05-09',
        estimated_delivery_start: '2026-05-11',
        estimated_delivery_end: '2026-05-14',
        customer_note: 'Packed with care.',
        internal_note: 'Add care card.',
      },
    });

    expect(summary.status).toBe('processing');
    expect(summary.ship_by_date).toBe('2026-05-09');
    expect(summary.estimated_delivery_start).toBe('2026-05-11');
    expect(summary.estimated_delivery_end).toBe('2026-05-14');
    expect(summary.customer_note).toBe('Packed with care.');
    expect(summary.internal_note).toBe('Add care card.');
  });

  it('clears workflow fields when nullable updates are sent', () => {
    const metadata = mergeWorkflowMetadata(
      {
        ship_by_date: '2026-05-09',
        estimated_delivery_start: '2026-05-11',
        estimated_delivery_end: '2026-05-14',
        customer_note: 'Buyer-facing note',
        internal_note: 'Admin-only note',
      },
      {
        ship_by_date: null,
        estimated_delivery_start: null,
        estimated_delivery_end: null,
        customer_note: null,
        internal_note: null,
      }
    );

    expect(metadata.ship_by_date).toBeNull();
    expect(metadata.estimated_delivery_start).toBeNull();
    expect(metadata.estimated_delivery_end).toBeNull();
    expect(metadata.customer_note).toBeNull();
    expect(metadata.internal_note).toBeNull();
  });

  it('keeps existing workflow fields when omitted from updates', () => {
    const metadata = mergeWorkflowMetadata(
      {
        ship_by_date: '2026-05-09',
        customer_note: 'Buyer-facing note',
      },
      {
        internal_note: 'Updated internal note',
      }
    );

    expect(metadata.ship_by_date).toBe('2026-05-09');
    expect(metadata.customer_note).toBe('Buyer-facing note');
    expect(metadata.internal_note).toBe('Updated internal note');
  });

  it('hydrates manual label metadata into the workflow summary', () => {
    const summary = buildWorkflowSummary({
      status: 'processing',
      created_at: '2026-05-01T10:00:00.000Z',
      metadata: {
        workflow_status: 'processing',
        label_status: 'created',
        label_url: 'https://cdn.example.com/label.pdf',
        label_file_name: 'label-1001.pdf',
        label_cost: 12500,
        label_currency: 'INR',
        package_weight_grams: 450,
        package_length_cm: 28,
        package_width_cm: 20,
        package_height_cm: 6,
        carrier_service: 'Delhivery Surface',
        label_created_at: '2026-05-07T07:00:00.000Z',
      },
    });

    expect(summary.label.status).toBe('created');
    expect(summary.label.status_label).toBe('Label created');
    expect(summary.label.url).toBe('https://cdn.example.com/label.pdf');
    expect(summary.label.file_name).toBe('label-1001.pdf');
    expect(summary.label.cost).toBe(12500);
    expect(summary.label.currency).toBe('INR');
    expect(summary.label.package_weight_grams).toBe(450);
    expect(summary.label.package_length_cm).toBe(28);
    expect(summary.label.package_width_cm).toBe(20);
    expect(summary.label.package_height_cm).toBe(6);
    expect(summary.label.carrier_service).toBe('Delhivery Surface');
    expect(summary.label.created_at).toBe('2026-05-07T07:00:00.000Z');
  });

  it('clears nullable label fields when label updates are sent', () => {
    const metadata = mergeWorkflowMetadata(
      {
        label_status: 'created',
        label_url: 'https://cdn.example.com/label.pdf',
        label_file_name: 'label-1001.pdf',
        label_cost: 12500,
        label_currency: 'INR',
        package_weight_grams: 450,
        package_length_cm: 28,
        package_width_cm: 20,
        package_height_cm: 6,
        carrier_service: 'Delhivery Surface',
      },
      {
        label_status: 'draft',
        label_url: null,
        label_file_name: null,
        label_cost: null,
        label_currency: null,
        package_weight_grams: null,
        package_length_cm: null,
        package_width_cm: null,
        package_height_cm: null,
        carrier_service: null,
      }
    );

    expect(metadata.label_status).toBe('draft');
    expect(metadata.label_url).toBeNull();
    expect(metadata.label_file_name).toBeNull();
    expect(metadata.label_cost).toBeNull();
    expect(metadata.label_currency).toBeNull();
    expect(metadata.package_weight_grams).toBeNull();
    expect(metadata.package_length_cm).toBeNull();
    expect(metadata.package_width_cm).toBeNull();
    expect(metadata.package_height_cm).toBeNull();
    expect(metadata.carrier_service).toBeNull();
  });

  it('hydrates buyer communication events into workflow summary', () => {
    const summary = buildWorkflowSummary({
      status: 'processing',
      created_at: '2026-05-01T10:00:00.000Z',
      metadata: {
        communication_events: [
          {
            template: 'packed_with_care',
            subject: 'Your order has been packed',
            message: 'Packed with care.',
            sent_at: '2026-05-07T09:00:00.000Z',
            channel: 'email',
            status: 'sent',
          },
          {
            template: 123,
            subject: null,
            sent_at: '2026-05-07T10:00:00.000Z',
          },
        ],
      },
    });

    expect(summary.communication_events).toHaveLength(2);
    expect(summary.communication_events[0]).toEqual({
      template: 'packed_with_care',
      subject: 'Your order has been packed',
      message: 'Packed with care.',
      sent_at: '2026-05-07T09:00:00.000Z',
      channel: 'email',
      status: 'sent',
    });
    expect(summary.communication_events[1]).toEqual({
      template: undefined,
      subject: undefined,
      message: undefined,
      sent_at: '2026-05-07T10:00:00.000Z',
      channel: undefined,
      status: undefined,
    });
  });

  it('hydrates packaging checklist into workflow summary', () => {
    const summary = buildWorkflowSummary({
      status: 'processing',
      created_at: '2026-05-01T10:00:00.000Z',
      metadata: {
        packaging_checklist: {
          product_quality_checked: true,
          size_color_verified: true,
          care_card_included: true,
          thank_you_note_included: false,
          gift_wrap_applied: true,
          invoice_included: false,
          checked_at: '2026-05-07T11:00:00.000Z',
          checked_by: 'Asha',
        },
      },
    });

    expect(summary.packaging_checklist).toEqual({
      product_quality_checked: true,
      size_color_verified: true,
      care_card_included: true,
      thank_you_note_included: false,
      gift_wrap_applied: true,
      invoice_included: false,
      checked_at: '2026-05-07T11:00:00.000Z',
      checked_by: 'Asha',
    });
  });

  it('keeps package-level provider references and label metadata on the selected primary package', () => {
    const summary = buildWorkflowSummary({
      status: 'shipped',
      created_at: '2026-05-01T10:00:00.000Z',
      metadata: {
        workflow_status: 'shipped',
        packages: [
          {
            id: 'pkg_1',
            sequence: 1,
            ship_date: '2026-05-07T09:00:00.000Z',
            carrier: 'Shiprocket',
            tracking_number: 'AWB-1001',
            tracking_url: 'https://www.shiprocket.in/shipment-tracking/',
            label_provider: 'shiprocket',
            provider_order_id: 'sr-order-1',
            provider_shipment_id: 'sr-shipment-1',
            provider_courier_id: '42',
            pickup_reference: 'pickup-99',
            label_url: 'https://cdn.example.com/shiprocket-label.pdf',
            label_state: 'purchased',
          },
        ],
      },
    });

    expect(summary.primary_package?.label_provider).toBe('shiprocket');
    expect(summary.primary_package?.provider_order_id).toBe('sr-order-1');
    expect(summary.primary_package?.provider_shipment_id).toBe('sr-shipment-1');
    expect(summary.primary_package?.provider_courier_id).toBe('42');
    expect(summary.primary_package?.pickup_reference).toBe('pickup-99');
    expect(summary.label.provider).toBe('shiprocket');
    expect(summary.label.provider_shipment_id).toBe('sr-shipment-1');
    expect(summary.label.pickup_reference).toBe('pickup-99');
    expect(summary.label.url).toBe('https://cdn.example.com/shiprocket-label.pdf');
  });

  it('does not flag intentional no-tracking shipments as overdue tracking issues', () => {
    const summary = buildWorkflowSummary({
      status: 'processing',
      created_at: '2026-05-01T10:00:00.000Z',
      metadata: {
        workflow_status: 'processing',
        ship_by_date: '2026-05-01',
        packages: [
          {
            id: 'pkg_1',
            sequence: 1,
            ship_date: '2026-05-01T12:00:00.000Z',
            no_tracking: true,
            no_tracking_reason: 'Local hand delivery',
          },
        ],
      },
    });

    expect(summary.has_tracking).toBe(false);
    expect(summary.primary_package?.no_tracking).toBe(true);
    expect(summary.overdue_tracking).toBe(false);
  });
});
