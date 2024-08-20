const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs');
const SignedDocument = require('../models/SignedDocument');
const User = require('../models/Users');

exports.uploadTemplate = async (req, res) => {
  try {
    const { title, category, description } = req.body;
    const organizationId = req.headers.organizationid;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const fileBuffer = req.file.buffer; // Get the file buffer directly from multer

    const newTemplate = new SignedDocument({
      organization: organizationId,
      documentName: title,
      documentType: 'Template',
      signature: '', // No signature at this point
      pdfDocument: '', // No signed document at this point
      template: {
        data: fileBuffer,
        contentType: req.file.mimetype,
      },
      additionalInfo: {}, // Empty for template
    });

    await newTemplate.save();

    res.status(201).json({ success: true, message: 'Template uploaded successfully', templateId: newTemplate._id });
  } catch (error) {
    console.error('Error uploading template:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

async function modifyPdf(templateBuffer, studentData, signatureData) {
  const pdfDoc = await PDFDocument.load(templateBuffer);
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];

  const { studentName, parentName, address } = studentData;

  // Decode the base64 PNG signature
  const signatureImageBytes = Buffer.from(signatureData.split(',')[1], 'base64');
  const signatureImage = await pdfDoc.embedPng(signatureImageBytes);

  // Add text and signature to the PDF
  firstPage.drawText(`Student Name: ${studentName}`, { x: 50, y: 700, size: 12, color: rgb(0, 0, 0) });
  firstPage.drawText(`Address: ${address}`, { x: 50, y: 680, size: 12, color: rgb(0, 0, 0) });
  firstPage.drawImage(signatureImage, { x: 50, y: 600, width: 200, height: 100 });

  const pdfBytes = await pdfDoc.save();

  return pdfBytes;
}

exports.createWaiver = async (req, res) => {
  try {
    const { documentName, studentId, studentName, parentName, address, signature, templateId } = req.body;
    const organizationId = req.headers.organizationid;

    // Fetch the template from the database using the templateId
    const templateDoc = await SignedDocument.findById(templateId);

    if (!templateDoc || !templateDoc.template || !templateDoc.template.data) {
      return res.status(404).json({ success: false, message: 'Template not found or invalid' });
    }

    const templateBuffer = templateDoc.template.data;

    // Modify the PDF using the template's binary data
    const signedPdfBytes = await modifyPdf(templateBuffer, { studentName, parentName, address }, signature);

    // Convert the signed PDF to base64
    const signedPdfBase64 = signedPdfBytes.toString('base64');

    // Save the document data to the database
    const signedDocument = new SignedDocument({
      documentName,
      documentType: 'Waiver',
      signedBy: studentId,
      organization: organizationId,
      signature, // Original signature image as base64
      pdfDocument: signedPdfBase64, // Store the signed PDF as base64
      template: templateDoc.template, // Store the template binary data as well
      additionalInfo: {
        studentName,
        parentName,
        address,
      },
    });

    await signedDocument.save();

    // Update user's signed documents for the organization
    await User.updateOne(
      { _id: studentId, 'organizations.org_id': organizationId },
      { $push: { 'organizations.$.signedDocuments': signedDocument._id } }
    );

    res.status(201).json({ success: true, message: 'Waiver form signed and saved successfully.' });
  } catch (error) {
    console.error('Error saving signed waiver form:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.getDocuments = async (req, res) => {
  try {
    const organizationId = req.headers.organizationid;
    const documents = await SignedDocument.find({ organization: organizationId });

    res.status(200).json({ success: true, documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
exports.getDocumentById = async (req, res) => {
  try {
    const docid = req.params.id;
    const document = await SignedDocument.findById(docid);

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Set headers to allow the PDF to be rendered in the browser
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="waiver.pdf"');
    res.send(Buffer.from(document.pdfDocument, 'base64'));
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.getTemplates = async (req, res) => {
  try {
    const organizationId = req.headers.organizationid;
    console.log(organizationId);

    const templates = await SignedDocument.find({ documentType: 'Template' });

    res.status(200).json({ success: true, templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
