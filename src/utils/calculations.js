/**
 * Calculate total asset value from inventory items
 * Total Asset Value = Sum of (Total Quantity × Buying Price) for all items
 * @param {Array} items - Inventory items array
 * @returns {number} Total asset value in rupees
 */
export const calculateTotalAssets = (items = []) => {
  if (!items || !Array.isArray(items)) return 0;
  return items.reduce((acc, item) => {
    // Support both naming conventions (whQty/warehouseQty and buyingPrice/price)
    const warehouseQty = item.warehouseQty || item.whQty || 0;
    const lorryQty = item.lorryQty || 0;
    const totalQty = warehouseQty + lorryQty;
    const buyingPrice = item.buyingPrice || item.price || 0;
    
    return acc + (totalQty * buyingPrice);
  }, 0);
};

/**
 * Format currency value for display
 * @param {number} value - Value to format
 * @param {string} currency - Currency code (default: 'PKR')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value || 0);
};

/**
 * Format timestamp to readable date and time
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date and time (e.g., '23/01/2026 09:45 PM')
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return 'Invalid Date';
  }
};

/**
 * Get current timestamp in ISO format
 * @returns {string} Current date/time in ISO format
 */
export const getCurrentTimestamp = () => {
  return new Date().toISOString();
};
