import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateReceiptPDF = (payment) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // ── Header background ──
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 45, 'F');

  // ── Logo / Title ──
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('HOSTEL MANAGEMENT SYSTEM', pageWidth / 2, 18, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Official Payment Receipt', pageWidth / 2, 30, { align: 'center' });

  doc.setFontSize(9);
  doc.text('123 University Road, City - 500001 | +91 98765 43210', pageWidth / 2, 40, { align: 'center' });

  // ── Receipt Number badge ──
  doc.setFillColor(99, 102, 241); // indigo-500
  doc.roundedRect(14, 52, 80, 12, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Receipt #: ${payment.receiptNumber}`, 54, 60, { align: 'center' });

  // ── Date ──
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const paidDate = payment.paidAt
    ? new Date(payment.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.text(`Date: ${paidDate}`, pageWidth - 14, 60, { align: 'right' });

  // ── Divider ──
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 68, pageWidth - 14, 68);

  // ── Student Details Section ──
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('STUDENT INFORMATION', 14, 78);

  doc.setLineWidth(0.3);
  doc.setDrawColor(99, 102, 241);
  doc.line(14, 80, 60, 80);

  const student = payment.student || {};
  const room = payment.room || {};

  const studentDetails = [
    ['Student Name', student.name || 'N/A'],
    ['Email Address', student.email || 'N/A'],
    ['Phone Number', student.phone || 'N/A'],
    ['Aadhaar Number', student.aadhaar ? `XXXX XXXX ${student.aadhaar.slice(-4)}` : 'N/A'],
  ];

  doc.autoTable({
    startY: 84,
    head: [],
    body: studentDetails,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [100, 116, 139], cellWidth: 55 },
      1: { textColor: [15, 23, 42] },
    },
    margin: { left: 14, right: pageWidth / 2 + 5 },
  });

  // ── Room Details Section ──
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('ROOM INFORMATION', pageWidth / 2 + 5, 78);

  doc.setDrawColor(99, 102, 241);
  doc.line(pageWidth / 2 + 5, 80, pageWidth / 2 + 53, 80);

  const roomDetails = [
    ['Room Number', room.roomNumber || 'N/A'],
    ['Room Type', room.type || 'N/A'],
    ['Sharing Type', room.sharing || 'N/A'],
    ['Floor', room.floor !== undefined ? `Floor ${room.floor}` : 'N/A'],
  ];

  doc.autoTable({
    startY: 84,
    head: [],
    body: roomDetails,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [100, 116, 139], cellWidth: 40 },
      1: { textColor: [15, 23, 42] },
    },
    margin: { left: pageWidth / 2 + 5, right: 14 },
  });

  // ── Payment Details Table ──
  const afterStudentY = doc.lastAutoTable.finalY + 10;

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT DETAILS', 14, afterStudentY);

  doc.setDrawColor(99, 102, 241);
  doc.line(14, afterStudentY + 2, 60, afterStudentY + 2);

  const paymentMonth = payment.paymentMonth
    ? new Date(payment.paymentMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : 'N/A';

  doc.autoTable({
    startY: afterStudentY + 6,
    head: [['Description', 'Payment Month', 'Method', 'Status', 'Amount']],
    body: [
      [
        payment.description || 'Hostel Fee',
        paymentMonth,
        'Online (Stripe)',
        { content: payment.status?.toUpperCase() || 'COMPLETED', styles: { textColor: [34, 197, 94], fontStyle: 'bold' } },
        { content: `₹ ${payment.amount?.toLocaleString('en-IN') || '0'}`, styles: { fontStyle: 'bold' } },
      ],
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: 10 },
    bodyStyles: { fontSize: 10, cellPadding: 5 },
    margin: { left: 14, right: 14 },
  });

  // ── Total Box ──
  const totalY = doc.lastAutoTable.finalY + 8;
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(34, 197, 94);
  doc.setLineWidth(0.5);
  doc.roundedRect(pageWidth - 90, totalY, 76, 20, 3, 3, 'FD');

  doc.setTextColor(22, 101, 52);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL PAID:', pageWidth - 85, totalY + 9);
  doc.setFontSize(13);
  doc.text(`₹ ${payment.amount?.toLocaleString('en-IN') || '0'}`, pageWidth - 17, totalY + 9, { align: 'right' });

  // ── Payment ID ──
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Transaction ID: ${payment.stripePaymentIntentId || payment._id || 'N/A'}`, 14, totalY + 14);

  // ── Footer ──
  const footerY = doc.internal.pageSize.getHeight() - 25;
  doc.setFillColor(248, 250, 252);
  doc.rect(0, footerY - 5, pageWidth, 35, 'F');

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(14, footerY - 5, pageWidth - 14, footerY - 5);

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.text('This is a computer-generated receipt and does not require a physical signature.', pageWidth / 2, footerY + 2, { align: 'center' });
  doc.text('For any queries, contact: admin@hostel.com | +91 98765 43210', pageWidth / 2, footerY + 8, { align: 'center' });

  doc.setTextColor(99, 102, 241);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Thank you for your payment!', pageWidth / 2, footerY + 16, { align: 'center' });

  // ── Save ──
  doc.save(`receipt-${payment.receiptNumber || payment._id}.pdf`);
};
