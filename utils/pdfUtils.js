const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs');

async function modifyPdf(templatePath, studentData, signatureData) {
  // Load the PDF template
  const existingPdfBytes = fs.readFileSync(templatePath);

  // Load a PDFDocument from the existing PDF bytes
  const pdfDoc = await PDFDocument.load(existingPdfBytes);

  // Get the first page of the document
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];

  // Define the student data
  const { studentName, parentName, address } = studentData;

  // Draw student information on the PDF
  firstPage.drawText(`Student Name: ${studentName}`, {
    x: 50,
    y: 700,
    size: 12,
    color: rgb(0, 0, 0),
  });

  firstPage.drawText(`Address: ${address}`, {
    x: 50,
    y: 680,
    size: 12,
    color: rgb(0, 0, 0),
  });

  // Draw signature on the PDF (assuming signature is base64 encoded)
  const signatureImageBytes = Buffer.from(signatureData, 'base64');
  const signatureImage = await pdfDoc.embedPng(signatureImageBytes);

  firstPage.drawImage(signatureImage, {
    x: 50,
    y: 600,
    width: 200,
    height: 100,
  });

  // Serialize the PDFDocument to bytes (a Uint8Array)
  const pdfBytes = await pdfDoc.save();

  // Save the modified PDF
  const outputPath = 'signed_waiver.pdf';
  fs.writeFileSync(outputPath, pdfBytes);

  return outputPath;
}

module.exports = {
  modifyPdf,
};
