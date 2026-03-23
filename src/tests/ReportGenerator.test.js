import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateMonthlyReport } from '../utils/ReportGenerator';
import api from '../api/client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const mockDoc = {
  internal: { pageSize: { width: 210, height: 297 }, getNumberOfPages: vi.fn().mockReturnValue(1) },
  setFontSize: vi.fn(),
  setFont: vi.fn(),
  setTextColor: vi.fn(),
  text: vi.fn(),
  lastAutoTable: { finalY: 100 },
  setPage: vi.fn(),
  output: vi.fn().mockReturnValue(new ArrayBuffer(8)),
};

// Mock dependencies
vi.mock('jspdf', () => {
  return {
    default: vi.fn().mockImplementation(function() {
      return mockDoc;
    }),
  };
});
vi.mock('jspdf-autotable');
vi.mock('../api/client', () => ({
  default: {
    pdf: {
      save: vi.fn(),
    }
  }
}));

// Mock window.alert
const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('ReportGenerator', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateMonthlyReport', () => {
    
    it('should generate a report and call API to save it', async () => {
      // Arrange
      const mockSales = [
        { date: '2026-03-23T10:00:00Z', totalBill: 1000, paidAmount: 800, routeName: 'Route A' },
        { date: '2026-02-15T10:00:00Z', totalBill: 500, paidAmount: 500, routeName: 'Route B' } 
      ];
      
      const mockExpenses = [
        { date: '2026-03-23T10:00:00Z', amount: 200 },
        { createdAt: '2026-03-01T10:00:00Z', value: 300 } 
      ];
      
      const mockRoutes = ['Route A', 'Route B'];
      
      api.pdf.save.mockResolvedValue({ success: true, filePath: '/path/to/report.pdf' });

      // Act
      await generateMonthlyReport(mockSales, mockExpenses, mockRoutes, 'March', 2026);

      // Assert
      expect(jsPDF).toHaveBeenCalled();
      expect(autoTable).toHaveBeenCalledTimes(2);
      expect(api.pdf.save).toHaveBeenCalled();
      expect(alertMock).toHaveBeenCalledWith(expect.stringContaining('/path/to/report.pdf'));
    });
    
    it('should handle API failure gracefully', async () => {
      // Arrange
      api.pdf.save.mockResolvedValue({ success: false, error: 'Network error' });
      
      // Act
      await generateMonthlyReport([], [], [], 'April', 2026);
      
      // Assert
      expect(alertMock).toHaveBeenCalledWith('Failed to save report: Network error');
    });
    
    it('should handle thrown errors gracefully', async () => {
        // Arrange
        api.pdf.save.mockRejectedValue(new Error('Unexpected Exception'));
        
        // Act
        await generateMonthlyReport([], [], [], 'May', 2026);
        
        // Assert
        expect(consoleErrorMock).toHaveBeenCalled();
        expect(alertMock).toHaveBeenCalledWith('Error saving PDF. See console for details.');
      });
  });
});
