// src/lib/receipt-pdf.ts
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ReceiptData {
  _id: string;
  amount: number;
  name: string;
  phone: string;
  type: string;
  district: string;
  panchayat: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  instituteId?: string;
  createdAt: string;
}

export const generatePDF = async (receipt: ReceiptData) => {
  // Create a hidden container for the HTML receipt
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px"; // Off-screen
  container.style.width = "210mm"; // A4 width
  container.style.padding = "5mm"; // Reduced from 20mm to 5mm
  container.style.backgroundColor = "#fff";
  document.body.appendChild(container);

  // Enhanced HTML receipt template with modern design
  container.innerHTML = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2c3e50; max-width: 100%; margin: 0; background: white;">
      
      <!-- Header Section with Gradient -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 25px; text-align: center; position: relative; overflow: hidden;">
        <div style="position: absolute; top: -50px; right: -50px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
        <div style="position: absolute; bottom: -30px; left: -30px; width: 60px; height: 60px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
        <div style="position: relative; z-index: 2;">
          <h1 style="font-size: 28px; font-weight: 700; margin: 0 0 5px 0; letter-spacing: -0.5px;">DONATION RECEIPT</h1>
          <div style="width: 70px; height: 3px; background: rgba(255,255,255,0.8); margin: 0 auto 8px auto; border-radius: 2px;"></div>
          <p style="font-size: 16px; margin: 0; opacity: 0.95; font-weight: 600;">AIC Amal App</p>
          <p style="font-size: 14px; margin: 2px 0 0 0; opacity: 0.85; font-weight: 300;">Akode Islamic Centre</p>
        </div>
      </div>

      <!-- Receipt Info Bar -->
      <div style="background: #f8f9fc; padding: 12px 25px; border-bottom: 1px solid #e9ecef; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center;">
          <div style="width: 8px; height: 8px; background: #28a745; border-radius: 50%; margin-right: 8px;"></div>
          <span style="font-size: 13px; color: #6c757d; font-weight: 500;">DATE: </span>
          <span style="font-size: 13px; color: #495057; font-weight: 600; margin-left: 5px;">${new Date(receipt.createdAt).toLocaleDateString('en-GB')}</span>
        </div>
        <div style="display: flex; align-items: center;">
          <span style="font-size: 13px; color: #6c757d; font-weight: 500;">RECEIPT NO: </span>
          <span style="font-size: 13px; color: #495057; font-weight: 600; margin-left: 5px; background: #e9ecef; padding: 3px 6px; border-radius: 4px; font-family: monospace;">${receipt._id}</span>
        </div>
      </div>

      <!-- Main Content -->
      <div style="padding: 18px;">
        
        <!-- Donor Information Card -->
        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 16px; margin-bottom: 16px; border: 1px solid #dee2e6; position: relative;">
          <div style="position: absolute; top: -2px; left: -2px; right: -2px; bottom: -2px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 14px; z-index: -1; opacity: 0.1;"></div>
          <div style="display: flex; align-items: center; margin-bottom: 12px;">
            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0;">
              <span style="color: white; font-size: 16px; line-height: 1; display: flex; align-items: center; justify-content: center;">👤</span>
            </div>
            <h2 style="font-size: 20px; color: #2c3e50; margin: 0; font-weight: 600; line-height: 1.2;">Donor Information</h2>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <p style="font-size: 12px; color: #6c757d; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Full Name</p>
              <p style="font-size: 16px; color: #2c3e50; margin: 0; font-weight: 600;">${receipt.name}</p>
            </div>
            <div>
              <p style="font-size: 12px; color: #6c757d; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Phone Number</p>
              <p style="font-size: 16px; color: #2c3e50; margin: 0; font-weight: 600;">${receipt.phone}</p>
            </div>
          </div>
          
          <div style="margin-top: 12px;">
            <p style="font-size: 12px; color: #6c757d; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Location</p>
            <p style="font-size: 16px; color: #2c3e50; margin: 0; font-weight: 600;">${
              receipt.panchayat ? `${receipt.panchayat}, ${receipt.district}` : receipt.district
            }</p>
          </div>
        </div>

        <!-- Donation Details Card -->
        <div style="background: white; border-radius: 12px; padding: 16px; border: 2px solid #e9ecef; position: relative; overflow: hidden; margin-bottom: 16px;">
          <div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #667eea, #764ba2);"></div>
          
          <div style="display: flex; align-items: center; margin-bottom: 12px;">
            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #28a745, #20c997); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0;">
              <span style="color: white; font-size: 16px; line-height: 1; display: flex; align-items: center; justify-content: center;">💰</span>
            </div>
            <h2 style="font-size: 20px; color: #2c3e50; margin: 0; font-weight: 600; line-height: 1.2;">Donation Details</h2>
          </div>

          <!-- Amount Highlight -->
          <div style="background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 16px; border-radius: 10px; text-align: center; margin-bottom: 12px;">
            <p style="font-size: 14px; margin: 0 0 6px 0; opacity: 0.9; font-weight: 500;">Donation Amount</p>
            <p style="font-size: 32px; margin: 0; font-weight: 700; letter-spacing: -1px;">₹${receipt.amount.toLocaleString('en-IN')}</p>
          </div>

          <!-- Details Table -->
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 8px;">
            <tr style="border-bottom: 1px solid #f8f9fa;">
              <td style="padding: 8px 0; color: #6c757d; font-weight: 500; width: 40%;">Donation Type</td>
              <td style="padding: 8px 0; color: #2c3e50; font-weight: 600;">${receipt.type}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f8f9fa;">
              <td style="padding: 8px 0; color: #6c757d; font-weight: 500;">Payment ID</td>
              <td style="padding: 8px 0; color: #2c3e50; font-weight: 600; font-family: monospace; font-size: 12px;">${receipt.razorpayPaymentId}</td>
            </tr>
            ${
              receipt.instituteId && receipt.instituteId !== "null"
                ? `<tr style="border-bottom: 1px solid #f8f9fa;">
                    <td style="padding: 8px 0; color: #6c757d; font-weight: 500;">Date & Time</td>
                    <td style="padding: 8px 0; color: #2c3e50; font-weight: 600;">${new Date(receipt.createdAt).toLocaleString('en-GB', { 
                      day: '2-digit', 
                      month: '2-digit', 
                      year: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: true
                    })}</td>
                  </tr>`
                : `<tr style="border-bottom: 1px solid #f8f9fa;">
                    <td style="padding: 8px 0; color: #6c757d; font-weight: 500;">Date & Time</td>
                    <td style="padding: 8px 0; color: #2c3e50; font-weight: 600;">${new Date(receipt.createdAt).toLocaleString('en-GB', { 
                      day: '2-digit', 
                      month: '2-digit', 
                      year: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: true
                    })}</td>
                  </tr>`
            }
          </table>
        </div>

        <!-- Thank You Section -->
        <div style="text-align: center; padding: 16px; background: linear-gradient(135deg, #f8f9fc 0%, #e9ecef 100%); border-radius: 12px; border: 1px solid #dee2e6;">
          <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #1e3a8a, #3b82f6); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px auto;">
            <span style="color: white; font-size: 16px; line-height: 1; display: flex; align-items: center; justify-content: center;">🤲</span>
          </div>
          <h3 style="font-size: 20px; color: #2c3e50; margin: 0 0 8px 0; font-weight: 600;">Thank You for Your Generosity!</h3>
          <p style="font-size: 14px; color: #6c757d; margin: 0 0 12px 0; line-height: 1.5;">Your contribution makes a meaningful difference in our community.</p>
          
          <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #dee2e6;">
            <p style="font-size: 12px; color: #6c757d; margin: 0 0 4px 0;">This is an auto-generated receipt.</p>
            <p style="font-size: 12px; color: #495057; margin: 0; font-weight: 500;">For queries, contact: <span style="color: #667eea; font-weight: 600;">hello@aicamal.app</span></p>
          </div>
        </div>
      </div>
    </div>
  `;

  // Convert HTML to canvas and then to PDF
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  try {
    const canvas = await html2canvas(container, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
    });
    const imgData = canvas.toDataURL("image/png");
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    // Add first page
    doc.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Handle multi-page if content exceeds one page
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      doc.addPage();
      doc.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    doc.save(`receipt_${receipt._id}.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  } finally {
    // Clean up
    document.body.removeChild(container);
  }
};