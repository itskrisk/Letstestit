import { Product } from '../types/schema';

// Simulates parsing a CSV file for a Supermarket
// Expected Columns: SKU, Name, Price, Stock, Category

export interface CSVParseResult {
    success: boolean;
    products: Partial<Product>[];
    errors: string[];
    summary: {
        totalRows: number;
        validRows: number;
    };
}

export const parseInventoryCSV = async (file: File): Promise<CSVParseResult> => {
    return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            const text = event.target?.result as string;
            if (!text) {
                resolve({ success: false, products: [], errors: ['Empty file'], summary: { totalRows: 0, validRows: 0 } });
                return;
            }

            const lines = text.split('\n');
            const products: Partial<Product>[] = [];
            const errors: string[] = [];

            // Skip header (Row 0)
            const dataLines = lines.slice(1).filter(line => line.trim().length > 0);

            dataLines.forEach((line, index) => {
                // Simple CSV split (note: doesn't handle quoted commas, but good for prototype)
                const cols = line.split(',').map(c => c.trim());

                // MAPPING STRATEGY (Resilient)
                // We assume order: SKU, Name, Price, Stock, Category
                // In a real app, we'd have a UI to map columns.

                if (cols.length < 3) {
                    errors.push(`Row ${index + 2}: Insufficient data`);
                    return;
                }

                const [sku, name, priceRaw, stockRaw, category] = cols;

                const price = parseFloat(priceRaw);
                const stock = parseInt(stockRaw) || 0;

                if (isNaN(price)) {
                    errors.push(`Row ${index + 2}: Invalid price for "${name}"`);
                    return;
                }

                products.push({
                    sku: sku || `GEN-${Date.now()}-${index}`,
                    name: name || 'Unknown Item',
                    price: price,
                    stockLevel: stock,
                    categoryId: category || 'General',
                    isAvailable: true,
                    merchantId: 'temp-id' // Placeholder
                });
            });

            // Simulate "Thinking" time for UX
            setTimeout(() => {
                resolve({
                    success: errors.length === 0 || products.length > 0,
                    products,
                    errors,
                    summary: {
                        totalRows: dataLines.length,
                        validRows: products.length
                    }
                });
            }, 1500);
        };

        reader.readAsText(file);
    });
};
