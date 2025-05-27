import { PrintReceiptParams } from "@/app/utils/printer";

export async function POST(request: Request) {
  try {
    const data: PrintReceiptParams = await request.json();
    const { deviceId, schoolName, title, items, total, footer, saleDate } = data;

    // Format the date and time
    const formattedDateTime = saleDate 
      ? new Date(saleDate).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
      : new Date().toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });

    // Create receipt content
    const receiptContent = [
      schoolName,
      title,
      "------------------------",
      formattedDateTime,
      "------------------------",
      ...items.map(item => `${item.name}\n${item.price}`),
      "------------------------",
      `Total: $${total.toFixed(2)}`,
      "------------------------",
      footer
    ].join("\n");

    // Send to printer
    const response = await fetch(`http://localhost:3001/print`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deviceId,
        content: receiptContent,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to print receipt');
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to print receipt' 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
} 