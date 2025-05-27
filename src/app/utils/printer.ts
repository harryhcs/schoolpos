interface ReceiptItem {
  name: string;
  price: string;
}

export interface PrintReceiptParams {
  deviceId: string;
  schoolName: string;
  title: string;
  items: ReceiptItem[];
  total: number;
  footer: string;
  saleDate?: Date;
}

interface PrintReceiptResponse {
  success: boolean;
  error?: string;
}

// Store the last printed receipt data
let lastReceiptData: PrintReceiptParams | null = null;

// Helper function to create a timeout promise
const createTimeoutPromise = (ms: number) => 
  new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Request timed out')), ms)
  );

// Helper function to make a fetch request with timeout
async function fetchWithTimeout(url: string, options: RequestInit, timeout: number = 5000): Promise<Response> {
  try {
    const response = await Promise.race([
      fetch(url, options),
      createTimeoutPromise(timeout)
    ]) as Response;
    return response;
  } catch (error) {
    if (error instanceof Error && error.message === 'Request timed out') {
      throw new Error('Printer server request timed out');
    }
    throw error;
  }
}

export async function printReceipt({ deviceId, schoolName, title, items, total, footer, saleDate }: PrintReceiptParams): Promise<PrintReceiptResponse> {
  try {
    // Store the receipt data for potential reprint
    lastReceiptData = { deviceId, schoolName, title, items, total, footer, saleDate };

    const response = await fetchWithTimeout('http://192.168.110.6:3000/print/receipt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      mode: 'cors',
      credentials: 'omit',
      body: JSON.stringify({
        deviceId,
        schoolName,
        title,
        items,
        total,
        footer,
        saleDate: saleDate ? new Date(saleDate).toISOString().slice(0, 16).replace('T', ' ') : undefined
      }),
    });

    if (!response.ok) {
      const errorData = await response.json() as { error: string };
      throw new Error(errorData.error || 'Failed to print receipt');
    }

    const result = await response.json() as { success: boolean };
    return { success: result.success };
  } catch (error) {
    console.error('Print error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to print receipt' 
    };
  }
}

export async function reprintLastReceipt(): Promise<PrintReceiptResponse> {
  if (!lastReceiptData) {
    return {
      success: false,
      error: 'No receipt data available for reprint'
    };
  }

  return printReceipt(lastReceiptData);
} 