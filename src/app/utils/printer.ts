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

interface PrinterDevice {
  deviceId: string;
  name: string;
}

interface SearchResult {
  success: boolean;
  devices?: PrinterDevice[];
  error?: string;
}

interface BluetoothDevice {
  id: string;
  name?: string;
  address: string;
  rssi: number;
  services?: string[];
}

// Store the last printed receipt data
let lastReceiptData: PrintReceiptParams | null = null;

// Helper function to create a timeout promise
const createTimeoutPromise = (ms: number) => 
  new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Request timed out')), ms)
  );

// Helper function to make a fetch request with timeout
async function fetchWithTimeout(url: string, options: RequestInit, timeout: number = 30000): Promise<Response> {
  try {
    const response = await Promise.race([
      fetch(url, options),
      createTimeoutPromise(timeout)
    ]) as Response;
    return response;
  } catch (error) {
    if (error instanceof Error && error.message === 'Request timed out') {
      throw new Error('Printer server request timed out. Please try again.');
    }
    throw error;
  }
}

export async function searchBluetoothPrinters(): Promise<SearchResult> {
  try {
    const response = await fetchWithTimeout('http://pos.local:3000/devices', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      mode: 'cors',
      credentials: 'omit',
    }, 30000); // 30 second timeout for device discovery

    if (!response.ok) {
      const errorData = await response.json() as { error: string };
      throw new Error(errorData.error || 'Failed to fetch devices');
    }

    const devices = await response.json() as BluetoothDevice[];
    
    // Filter for devices that have a name and sort by signal strength (RSSI)
    const printerDevices = devices
      .filter(device => device.name) // Only include devices with names
      .sort((a, b) => b.rssi - a.rssi) // Sort by signal strength (higher RSSI = stronger signal)
      .map(device => ({
        deviceId: device.id,
        name: device.name || 'Unknown Printer'
      }));

    if (printerDevices.length === 0) {
      return {
        success: false,
        error: 'No printers found. Make sure your printer is turned on and in pairing mode.'
      };
    }

    return {
      success: true,
      devices: printerDevices
    };
  } catch (error) {
    console.error('Printer search error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search for printers'
    };
  }
}

export async function printReceipt({
  deviceId,
  schoolName,
  title,
  items,
  total,
  footer,
  saleDate
}: PrintReceiptParams): Promise<PrintReceiptResponse> {
  try {
    // Store the receipt data for potential reprint
    lastReceiptData = { deviceId, schoolName, title, items, total, footer, saleDate };

    const response = await fetchWithTimeout('http://pos.local:3000/print/receipt', {
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