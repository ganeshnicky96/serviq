import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

@Injectable()
export class InvoicePdfService {
  generateInvoicePdf(invoice: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => {
        chunks.push(chunk);
      });

      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      doc.on('error', reject);

      /*
       * HEADER
       */
      doc
        .fontSize(26)
        .font('Helvetica-Bold')
        .text('SERVIQ');

      doc
        .fontSize(10)
        .font('Helvetica')
        .text('Professional Home Services');

      doc.moveDown();

      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('INVOICE', {
          align: 'right',
        });

      doc.moveDown(2);

      /*
       * INVOICE DETAILS
       */
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(
          `Invoice Number: ${invoice.invoiceNumber}`,
        );

      doc.text(
        `Invoice Date: ${
          invoice.issuedAt
            ? new Date(
                invoice.issuedAt.toString(),
              ).toLocaleDateString('en-IN')
            : 'N/A'
        }`,
      );

      doc.text(
        `Status: ${invoice.status}`,
      );

      doc.moveDown(2);

      /*
       * CUSTOMER
       */
      doc
        .fontSize(13)
        .font('Helvetica-Bold')
        .text('Bill To');

      doc.moveDown(0.5);

      doc
        .fontSize(10)
        .font('Helvetica');

      const customerName =
        [
           invoice.user?.firstName,
           invoice.user?.lastName,
        ]
          .filter(Boolean)
          .join(' ') || 'SERVIQ Customer';

      doc.text(customerName);

      if (invoice.address) {
        doc.text(
          invoice.address.addressLine1,
        );

        if (invoice.address.addressLine2) {
          doc.text(
            invoice.address.addressLine2,
          );
        }

        doc.text(
          `${invoice.address.city}, ${invoice.address.state} - ${invoice.address.postalCode}`,
        );
      }

      doc.moveDown(2);

      /*
       * BOOKING DETAILS
       */
      doc
        .fontSize(13)
        .font('Helvetica-Bold')
        .text('Booking Details');

      doc.moveDown(0.5);

      doc
        .fontSize(10)
        .font('Helvetica');

      doc.text(
        `Booking Number: ${
          invoice.booking?.bookingCode ?? 'N/A'
        }`,
      );

      doc.text(
        `Service: ${
          invoice.service?.name ?? 'SERVIQ Service'
        }`,
      );

      doc.text(
        `Quantity: ${
          invoice.booking?.quantity ?? 1
        }`,
      );

      doc.moveDown(2);

      /*
       * AMOUNT SECTION
       */
      doc
        .fontSize(13)
        .font('Helvetica-Bold')
        .text('Payment Summary');

      doc.moveDown(0.5);

      doc
        .fontSize(10)
        .font('Helvetica');

      doc.text(
        `Subtotal: ${invoice.currency} ${invoice.subtotal}`,
      );

      doc.text(
        `Tax: ${invoice.currency} ${
          invoice.tax ?? 0
        }`,
      );

      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(
          `Total Paid: ${invoice.currency} ${invoice.total}`,
        );

      doc.moveDown(1.5);

      /*
       * PAYMENT DETAILS
       */
      doc
        .fontSize(13)
        .font('Helvetica-Bold')
        .text('Payment Details');

      doc.moveDown(0.5);

      doc
        .fontSize(10)
        .font('Helvetica');

      doc.text(
        `Payment Method: ${
          invoice.paymentMethod ?? 'N/A'
        }`,
      );

      doc.text(
        `Payment Reference: ${
          invoice.paymentReference ?? 'N/A'
        }`,
      );

      doc.text(
        `Payment Status: ${invoice.status}`,
      );

      doc.moveDown(3);

      /*
       * FOOTER
       */
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(
          'Thank you for choosing SERVIQ.',
          {
            align: 'center',
          },
        );

      doc
        .fontSize(8)
        .text(
          'This is a computer-generated invoice.',
          {
            align: 'center',
          },
        );

      doc.end();
    });
  }
}