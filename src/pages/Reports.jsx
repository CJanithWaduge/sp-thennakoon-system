import api from '../api/client';
import React, { useState, useMemo } from 'react';
import { Download, Calendar, Filter, Package, Users, DollarSign, BarChart3 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import '../styles/Reports.css';

const Reports = ({ items = [], salesHistory = [], companyName = 'W2 Tech Solutions', expenses = [] }) => {
  const [reportType, setReportType] = useState('stock');
  // Default to 1st of current month
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return firstDay.toISOString().split('T')[0];
  });
  
  // Default to current date
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedColumns, setSelectedColumns] = useState({
    itemName: true,
    qtyLorry: true,
    qtyWhse: true,
    total: true,
    transactionDetails: false
  });

  // Extract stock transactions from sales history AND include all inventory items
  const stockTransactionsByItem = useMemo(() => {
    const itemMap = {};

    // First, initialize ALL items from inventory with their current quantities
    items.forEach(item => {
      itemMap[item.name] = {
        itemName: item.name,
        qtyLorry: item.lorryQty || 0,
        qtyWarehouse: item.whQty || 0,
        transactions: [],
        buyingPrice: item.buyingPrice || 0,
        sellingPrice: item.sellingPrice || 0
      };
    });

    // Then add transaction history from sales
    salesHistory.forEach(sale => {
      const saleDate = new Date(sale.date);
      const filterStartDate = new Date(startDate);
      const filterEndDate = new Date(endDate);
      
      // Add one day to endDate for inclusive filtering
      filterEndDate.setDate(filterEndDate.getDate() + 1);

      if (saleDate >= filterStartDate && saleDate < filterEndDate) {
        if (sale.itemsSold && Array.isArray(sale.itemsSold)) {
          sale.itemsSold.forEach(item => {
            const itemName = item.name || 'Unknown Item';
            
            // If item doesn't exist in map (shouldn't happen now), create it
            if (!itemMap[itemName]) {
              itemMap[itemName] = {
                itemName,
                qtyLorry: 0,
                qtyWarehouse: 0,
                transactions: [],
                buyingPrice: item.buyingPrice || 0,
                sellingPrice: item.sellingPrice || 0
              };
            }
            
            const qtyToAdd = item.qty || 0;
            const freeQtyToAdd = item.freeQty || 0;
            
            itemMap[itemName].transactions.push({
              date: sale.date,
              qty: qtyToAdd,
              freeQty: freeQtyToAdd,
              unitPrice: item.unitPrice || 0,
              value: item.subtotal || 0,
              shopName: sale.shopName,
              routeName: sale.routeName,
              isCredit: sale.isCredit,
              transactionDetails: `${sale.shopName} (Route: ${sale.routeName})${sale.isCredit ? ' [CREDIT]' : ''}`
            });
          });
        }
      }
    });

    return Object.values(itemMap).sort((a, b) => a.itemName.localeCompare(b.itemName));
  }, [items, salesHistory, startDate, endDate]);

  // Creditors summary for selected period
  const creditorsSummary = useMemo(() => {
    const map = {};
    const sDate = new Date(startDate);
    const eDate = new Date(endDate);
    eDate.setDate(eDate.getDate() + 1);

    salesHistory.forEach(sale => {
      const saleDate = new Date(sale.date);
      if (saleDate >= sDate && saleDate < eDate && sale.isCredit) {
        // Only consider credit sales
        const creditorName = sale.shopName || 'Unknown';
        if (!map[creditorName]) {
          map[creditorName] = { creditor: creditorName, route: sale.routeName || '', totalDue: 0, paid: 0 };
        }
        const totalBill = parseFloat(sale.totalBill || 0) || 0;
        const paidAmount = parseFloat(sale.paidAmount || 0) || 0;

        map[creditorName].totalDue += totalBill;
        map[creditorName].paid += paidAmount;
      }
    });

    return Object.values(map).map(c => ({
      ...c,
      balance: parseFloat((c.totalDue - c.paid).toFixed(2))
    })).sort((a,b) => b.totalDue - a.totalDue);
  }, [salesHistory, startDate, endDate]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    return {
      totalItems: stockTransactionsByItem.length,
      totalQtyLorry: stockTransactionsByItem.reduce((sum, t) => sum + t.qtyLorry, 0),
      totalQtyWarehouse: stockTransactionsByItem.reduce((sum, t) => sum + t.qtyWarehouse, 0),
      totalQty: stockTransactionsByItem.reduce((sum, t) => sum + t.qtyLorry + t.qtyWarehouse, 0)
    };
  }, [stockTransactionsByItem]);

  // Generate PDF Report


  // Generate Table-only PDF Download
  const downloadTablePDF = async () => {
    if (stockTransactionsByItem.length === 0) {
      alert('No items found for the selected period.');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // -- HEADER --
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 128, 185);
    doc.text(companyName, pageWidth / 2, 15, { align: 'center' });

    doc.setFontSize(13);
    doc.setTextColor(40, 40, 40);
    const dateText = startDate === endDate 
      ? `Stock Report - ${new Date(startDate).toLocaleDateString()}` 
      : `Stock Report - ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`;
    doc.text(dateText, pageWidth / 2, 23, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, pageWidth / 2, 29, { align: 'center' });

    // -- STOCK TABLE --
    const stockTableData = stockTransactionsByItem.map(item => [
      item.itemName,
      item.qtyLorry.toString(),
      item.qtyWarehouse.toString(),
      (item.qtyLorry + item.qtyWarehouse).toString()
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['Item Name', 'Qty (Lorry)', 'Qty (Whse)', 'Total']],
      body: stockTableData,
      theme: 'striped',
      headStyles: {
        fillColor: [52, 73, 94],
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 80 },
        1: { halign: 'center', cellWidth: 30 },
        2: { halign: 'center', cellWidth: 30 },
        3: { halign: 'center', cellWidth: 30 }
      },
      margin: { left: 14, right: 14 },
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index % 2 === 0) {
          data.cell.styles.fillColor = [240, 242, 245];
        }
      }
    });

    // -- FOOTER WITH TOTALS --
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'bold');
    
    const footerY = doc.lastAutoTable.finalY + 8;
    doc.text(`Total Items: ${summary.totalItems}`, 14, footerY);
    doc.text(`Qty (Lorry): ${summary.totalQtyLorry}  |  Qty (Whse): ${summary.totalQtyWarehouse}  |  Total: ${summary.totalQty}`, 14, footerY + 7);

    // -- PAGE FOOTER --
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text('Page ' + i + ' of ' + pageCount, pageWidth / 2, pageHeight - 8, { align: 'center' });
    }

    // -- SAVE PDF --
    const pdfBuffer = doc.output('arraybuffer');
    const filename = `Stock_Report_${startDate}.pdf`;

    try {
      const result = await api.pdf.save(pdfBuffer, filename);
      if (result.success) {
        alert(`Report downloaded successfully!`);
      } else if (result.error !== 'Cancelled') {
        alert('Failed to download report: ' + result.error);
      }
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Error downloading PDF. See console for details.');
    }
  };

  const formatCurrency = (value) => {
    return value.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  // Generate Excel Report
  const generateExcel = async () => {
    try {
      if (reportType === 'stock') {
        if (stockTransactionsByItem.length === 0) {
          alert('No stock transactions found for the selected period.');
          return;
        }

        const worksheetData = stockTransactionsByItem.map(item => ({
          'Item Name': item.itemName,
          'Qty (Lorry)': item.qtyLorry,
          'Qty (Whse)': item.qtyWarehouse,
          'Total': item.qtyLorry + item.qtyWarehouse
        }));

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Report');

        const filename = `Stock_Report_${startDate}_to_${endDate}.xlsx`;
        XLSX.writeFile(workbook, filename);
      } else if (reportType === 'creditors') {
        if (!creditorsSummary || creditorsSummary.length === 0) {
          alert('No creditors data for the selected period.');
          return;
        }

        const worksheetData = creditorsSummary.map(c => ({
          'Creditor': c.creditor,
          'Route': c.route || '',
          'Total Due': c.totalDue,
          'Paid': c.paid,
          'Bal. Due': c.balance
        }));

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Creditors Summary');

        const filename = `Creditors_Summary_${startDate}_to_${endDate}.xlsx`;
        XLSX.writeFile(workbook, filename);
       } else if (reportType === 'sales') {
         if (salesReportData.length === 0) {
           alert('No sales data for the selected period.');
           return;
         }

         const worksheetData = salesReportData.map(sale => ({
           'Date': new Date(sale.date).toLocaleDateString(),
           'Sales Type': sale.salesType,
           'Description': sale.description,
           'Value': sale.value
         }));

         const worksheet = XLSX.utils.json_to_sheet(worksheetData);
         const workbook = XLSX.utils.book_new();
         XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Report');

         const filename = `Sales_Report_${startDate}_to_${endDate}.xlsx`;
         XLSX.writeFile(workbook, filename);
       } else if (reportType === 'expenses') {
         if (expensesReportData.length === 0) {
           alert('No expenses data for the selected period.');
           return;
         }

         const worksheetData = expensesReportData.map(expense => ({
           'Date': new Date(expense.date).toLocaleDateString(),
           'Description': expense.description,
           'Value': expense.value
         }));

         const worksheet = XLSX.utils.json_to_sheet(worksheetData);
         const workbook = XLSX.utils.book_new();
         XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses Report');

         const filename = `Expenses_Report_${startDate}_to_${endDate}.xlsx`;
         XLSX.writeFile(workbook, filename);
       }
    } catch (err) {
      console.error('Error generating Excel report:', err);
      alert('Error generating Excel report. See console for details.');
    }
  };

  // Download Creditors PDF
  const downloadCreditorsPDF = async () => {
    if (!creditorsSummary || creditorsSummary.length === 0) {
      alert('No creditors data for the selected period.');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 128, 185);
    doc.text(companyName, pageWidth / 2, 16, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    const dateText = startDate === endDate
      ? `Creditors Summary - ${new Date(startDate).toLocaleDateString()}`
      : `Creditors Summary - ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`;
    doc.text(dateText, pageWidth / 2, 24, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, pageWidth / 2, 30, { align: 'center' });

    const rows = creditorsSummary.map(c => [c.creditor, c.route || '', formatCurrency(c.totalDue), formatCurrency(c.paid), formatCurrency(c.balance)]);

    autoTable(doc, {
      startY: 36,
      head: [['Creditor', 'Route', 'Total Due', 'Paid', 'Bal. Due']],
      body: rows,
      theme: 'striped',
      headStyles: { fillColor: [52, 73, 94], textColor: 255, fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { halign: 'left', cellWidth: 70 },
        1: { halign: 'left', cellWidth: 50 },
        2: { halign: 'right', cellWidth: 30 },
        3: { halign: 'right', cellWidth: 30 },
        4: { halign: 'right', cellWidth: 30 }
      },
      margin: { left: 14, right: 14 }
    });

    // Footer totals
    const footerY = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    const totalDue = creditorsSummary.reduce((s, c) => s + (parseFloat(c.totalDue) || 0), 0);
    const totalPaid = creditorsSummary.reduce((s, c) => s + (parseFloat(c.paid) || 0), 0);
    const totalBal = creditorsSummary.reduce((s, c) => s + (parseFloat(c.balance) || 0), 0);
    doc.text(`Total Due: ${formatCurrency(totalDue)}    Paid: ${formatCurrency(totalPaid)}    Balance: ${formatCurrency(totalBal)}`, 14, footerY);

    const pdfBuffer = doc.output('arraybuffer');
    const filename = `Creditors_Summary_${startDate}_to_${endDate}.pdf`;

    try {
      const result = await api.pdf.save(pdfBuffer, filename);
      if (result.success) {
        alert(`Creditors report saved to:\n${result.filePath}`);
      } else if (result.error !== 'Cancelled') {
        alert('Failed to save report: ' + result.error);
      }
    } catch (err) {
      console.error('Error saving creditors PDF:', err);
      alert('Error saving PDF. See console for details.');
    }
  };

  // Sales report data with filters
  const salesReportData = useMemo(() => {
    const sDate = new Date(startDate);
    const eDate = new Date(endDate);
    eDate.setDate(eDate.getDate() + 1);

    return salesHistory.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= sDate && saleDate < eDate;
    }).map(sale => ({
      date: sale.date,
      salesType: sale.isCredit ? 'Credit' : 'Cash/Check',
      description: sale.shopName || 'Cash Sale',
      value: parseFloat(sale.totalBill || 0)
    }));
  }, [salesHistory, startDate, endDate]);

  // Calculate sales totals
  const salesTotals = useMemo(() => {
    const cashCheckTotal = salesReportData
      .filter(sale => sale.salesType === 'Cash/Check')
      .reduce((sum, sale) => sum + sale.value, 0);
    const creditTotal = salesReportData
      .filter(sale => sale.salesType === 'Credit')
      .reduce((sum, sale) => sum + sale.value, 0);
    const totalSales = cashCheckTotal + creditTotal;

    return {
      cashCheckTotal,
      creditTotal,
      totalSales
    };
  }, [salesReportData]);

  // Expenses report data with filters
  const expensesReportData = useMemo(() => {
    const sDate = new Date(startDate);
    const eDate = new Date(endDate);
    eDate.setDate(eDate.getDate() + 1);

    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date || expense.createdAt);
      return expenseDate >= sDate && expenseDate < eDate;
    }).map(expense => ({
      date: expense.date || expense.createdAt,
      description: expense.description,
      value: parseFloat(expense.value || 0)
    }));
  }, [expenses, startDate, endDate]);

  // Calculate expenses total
  const expensesTotal = useMemo(() => {
    return expensesReportData.reduce((sum, expense) => sum + expense.value, 0);
  }, [expensesReportData]);

  // Download Sales PDF
  const downloadSalesPDF = async () => {
    if (salesReportData.length === 0) {
      alert('No sales data for the selected period.');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 128, 185);
    doc.text(companyName, pageWidth / 2, 16, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    const dateText = startDate === endDate
      ? `Sales Report - ${new Date(startDate).toLocaleDateString()}`
      : `Sales Report - ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`;
    doc.text(dateText, pageWidth / 2, 24, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, pageWidth / 2, 30, { align: 'center' });

    const rows = salesReportData.map(sale => [
      new Date(sale.date).toLocaleDateString(),
      sale.salesType,
      sale.description,
      formatCurrency(sale.value)
    ]);

    autoTable(doc, {
      startY: 36,
      head: [['Date', 'Sales Type', 'Description', 'Value']],
      body: rows,
      theme: 'striped',
      headStyles: { fillColor: [52, 73, 94], textColor: 255, fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { halign: 'left', cellWidth: 40 },
        1: { halign: 'left', cellWidth: 40 },
        2: { halign: 'left', cellWidth: 70 },
        3: { halign: 'right', cellWidth: 30 }
      },
      margin: { left: 14, right: 14 }
    });

    // Footer totals
    const footerY = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text(`Total Cash+Check: ${formatCurrency(salesTotals.cashCheckTotal)}`, 14, footerY);
    doc.text(`Total Credit: ${formatCurrency(salesTotals.creditTotal)}`, 14, footerY + 7);
    doc.text(`Total Sales: ${formatCurrency(salesTotals.totalSales)}`, 14, footerY + 14);

    const pdfBuffer = doc.output('arraybuffer');
    const filename = `Sales_Report_${startDate}_to_${endDate}.pdf`;

    try {
      const result = await api.pdf.save(pdfBuffer, filename);
      if (result.success) {
        alert(`Sales report saved to:\n${result.filePath}`);
      } else if (result.error !== 'Cancelled') {
        alert('Failed to save report: ' + result.error);
      }
    } catch (err) {
      console.error('Error saving sales PDF:', err);
      alert('Error saving PDF. See console for details.');
    }
  };

  // Download Expenses PDF
  const downloadExpensesPDF = async () => {
    if (expensesReportData.length === 0) {
      alert('No expenses data for the selected period.');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 128, 185);
    doc.text(companyName, pageWidth / 2, 16, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    const dateText = startDate === endDate
      ? `Expenses Report - ${new Date(startDate).toLocaleDateString()}`
      : `Expenses Report - ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`;
    doc.text(dateText, pageWidth / 2, 24, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, pageWidth / 2, 30, { align: 'center' });

    const rows = expensesReportData.map(expense => [
      new Date(expense.date).toLocaleDateString(),
      expense.description,
      formatCurrency(expense.value)
    ]);

    autoTable(doc, {
      startY: 36,
      head: [['Date', 'Description', 'Value']],
      body: rows,
      theme: 'striped',
      headStyles: { fillColor: [52, 73, 94], textColor: 255, fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { halign: 'left', cellWidth: 45 },
        1: { halign: 'left', cellWidth: 90 },
        2: { halign: 'right', cellWidth: 35 }
      },
      margin: { left: 14, right: 14 }
    });

    // Footer totals
    const footerY = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text(`Total Expenses: ${formatCurrency(expensesTotal)}`, 14, footerY);

    const pdfBuffer = doc.output('arraybuffer');
    const filename = `Expenses_Report_${startDate}_to_${endDate}.pdf`;

    try {
      const result = await api.pdf.save(pdfBuffer, filename);
      if (result.success) {
        alert(`Expenses report saved to:\n${result.filePath}`);
      } else if (result.error !== 'Cancelled') {
        alert('Failed to save report: ' + result.error);
      }
    } catch (err) {
      console.error('Error saving expenses PDF:', err);
      alert('Error saving PDF. See console for details.');
    }
  };



  return (
    <div className="reports-container">
      <div className="reports-header">
        <h1 className="centered">Reports</h1>
        <p className="centered">Generate and download detailed reports for your business</p>
      </div>

      {/* Report Type Selection */}
      <div className="report-type-selector">
        <div className={`report-type-option ${reportType === 'stock' ? 'active' : ''}`} onClick={() => setReportType('stock')}>
          <input
            type="radio"
            id="stock-report"
            name="reportType"
            value="stock"
            checked={reportType === 'stock'}
            onChange={(e) => setReportType(e.target.value)}
          />
          <label htmlFor="stock-report">
            <span className="report-icon"><Package size={18} /></span>
            Stock
          </label>
        </div>

        <div className={`report-type-option ${reportType === 'creditors' ? 'active' : ''}`} onClick={() => setReportType('creditors')}>
          <input
            type="radio"
            id="creditors-report"
            name="reportType"
            value="creditors"
            checked={reportType === 'creditors'}
            onChange={(e) => setReportType(e.target.value)}
          />
          <label htmlFor="creditors-report">
            <span className="report-icon"><Users size={18} /></span>
            Creditors
          </label>
        </div>

        <div className={`report-type-option ${reportType === 'sales' ? 'active' : ''}`} onClick={() => setReportType('sales')}>
          <input
            type="radio"
            id="sales-report"
            name="reportType"
            value="sales"
            checked={reportType === 'sales'}
            onChange={(e) => setReportType(e.target.value)}
          />
          <label htmlFor="sales-report">
            <span className="report-icon"><DollarSign size={18} /></span>
            Sales
          </label>
        </div>

        <div className={`report-type-option ${reportType === 'expenses' ? 'active' : ''}`} onClick={() => setReportType('expenses')}>
          <input
            type="radio"
            id="expenses-report"
            name="reportType"
            value="expenses"
            checked={reportType === 'expenses'}
            onChange={(e) => setReportType(e.target.value)}
          />
          <label htmlFor="expenses-report">
            <span className="report-icon"><BarChart3 size={18} /></span>
            Expenses
          </label>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filter-group">
          <label htmlFor="start-date">
            <Calendar size={16} /> Start Date
          </label>
          <input
            type="date"
            id="start-date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="end-date">
            <Calendar size={16} /> End Date
          </label>
          <input
            type="date"
            id="end-date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>



      {/* Column Selection (only for Stock view) */}
      {reportType === 'stock' && (
        <div className="column-selector">
          <h3>Select Columns to Display:</h3>
          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={selectedColumns.itemName}
                onChange={(e) => setSelectedColumns({...selectedColumns, itemName: e.target.checked})}
              />
              Item Name
            </label>
            <label>
              <input
                type="checkbox"
                checked={selectedColumns.qtyLorry}
                onChange={(e) => setSelectedColumns({...selectedColumns, qtyLorry: e.target.checked})}
              />
              Qty (Lorry)
            </label>
            <label>
              <input
                type="checkbox"
                checked={selectedColumns.qtyWhse}
                onChange={(e) => setSelectedColumns({...selectedColumns, qtyWhse: e.target.checked})}
              />
              Qty (Whse)
            </label>
            <label>
              <input
                type="checkbox"
                checked={selectedColumns.total}
                onChange={(e) => setSelectedColumns({...selectedColumns, total: e.target.checked})}
              />
              Total
            </label>
          </div>
        </div>
      )}

      {/* Stock Report Table */}
      <div className="report-table-section">
        <div className="table-header-section">
          {reportType === 'stock' && (
            <>
              <h2>Stock Report Details {startDate && endDate && `(${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()})`}</h2>
              <div className="download-section">
                <select id="download-format" className="download-format-select">
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                </select>
                <button 
                  className="download-btn download-btn-table" 
                  onClick={() => {
                    const format = document.getElementById('download-format').value;
                    if (format === 'pdf') {
                      downloadTablePDF();
                    } else {
                      generateExcel();
                    }
                  }} 
                  disabled={stockTransactionsByItem.length === 0}
                >
                  <Download size={18} /> Download Report
                </button>
              </div>
            </>
          )}

          {reportType === 'creditors' && (
            <>
              <h2>Creditors Summary {startDate && endDate && `(${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()})`}</h2>
              <div className="download-section">
                <select id="download-format" className="download-format-select">
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                </select>
                <button 
                  className="download-btn download-btn-table" 
                  onClick={() => {
                    const format = document.getElementById('download-format').value;
                    if (format === 'pdf') {
                      downloadCreditorsPDF();
                    } else {
                      generateExcel();
                    }
                  }} 
                  disabled={creditorsSummary.length === 0}
                >
                  <Download size={18} /> Download Report
                </button>
              </div>
            </>
          )}

           {reportType === 'sales' && (
             <>
               <h2>Sales Report {startDate && endDate && `(${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()})`}</h2>
               <div className="download-section">
                 <select id="download-format" className="download-format-select">
                   <option value="pdf">PDF</option>
                   <option value="excel">Excel</option>
                 </select>
                 <button 
                   className="download-btn download-btn-table" 
                   onClick={() => {
                     const format = document.getElementById('download-format').value;
                     if (format === 'pdf') {
                       downloadSalesPDF();
                     } else {
                       generateExcel();
                     }
                   }} 
                   disabled={salesReportData.length === 0}
                 >
                   <Download size={18} /> Download Report
                 </button>
               </div>
             </>
           )}

           {reportType === 'expenses' && (
             <>
               <h2>Expenses Report {startDate && endDate && `(${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()})`}</h2>
               <div className="download-section">
                 <select id="download-format" className="download-format-select">
                   <option value="pdf">PDF</option>
                   <option value="excel">Excel</option>
                 </select>
                 <button 
                   className="download-btn download-btn-table" 
                   onClick={() => {
                     const format = document.getElementById('download-format').value;
                     if (format === 'pdf') {
                       downloadExpensesPDF();
                     } else {
                       generateExcel();
                     }
                   }} 
                   disabled={expensesReportData.length === 0}
                 >
                   <Download size={18} /> Download Report
                 </button>
               </div>
             </>
           )}
        </div>

        {reportType === 'expenses' && (
          expensesReportData.length === 0 ? (
            <div className="no-data-message">
              No expenses found for the selected period.
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Value (Rs.)</th>
                  </tr>
                </thead>
                <tbody>
                  {expensesReportData.map(expense => (
                    <tr key={expense.date + expense.description}>
                      <td>{new Date(expense.date).toLocaleDateString()}</td>
                      <td>{expense.description}</td>
                      <td>Rs. {formatCurrency(expense.value)}</td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td colSpan={2} style={{ textAlign: 'right', fontWeight: 'bold' }}>Total Expenses:</td>
                    <td style={{ fontWeight: 'bold' }}>Rs. {formatCurrency(expensesTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )
        )}

        {reportType === 'stock' && (
          stockTransactionsByItem.length === 0 ? (
            <div className="no-data-message">
              <p>No stock transactions found for the selected period.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="report-table">
                <thead>
                  <tr>
                    {selectedColumns.itemName && <th className="col-item-name">Item Name</th>}
                    {selectedColumns.qtyLorry && <th className="col-qty">Qty (Lorry)</th>}
                    {selectedColumns.qtyWhse && <th className="col-qty">Qty (Whse)</th>}
                    {selectedColumns.total && <th className="col-qty">Total</th>}
                  </tr>
                </thead>
                <tbody>
                  {stockTransactionsByItem.map((item, index) => (
                    <tr key={index}>
                      {selectedColumns.itemName && <td className="col-item-name">{item.itemName}</td>}
                      {selectedColumns.qtyLorry && <td className="col-qty">{item.qtyLorry}</td>}
                      {selectedColumns.qtyWhse && <td className="col-qty">{item.qtyWarehouse}</td>}
                      {selectedColumns.total && <td className="col-qty"><strong>{item.qtyLorry + item.qtyWarehouse}</strong></td>}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Table Footer with Totals */}
              <div className="table-footer">
                <div className="footer-summary">
                  <span><strong>Total Items: {summary.totalItems}</strong></span>
                  {selectedColumns.qtyLorry && <span><strong>Lorry: {summary.totalQtyLorry}</strong></span>}
                  {selectedColumns.qtyWhse && <span><strong>Whse: {summary.totalQtyWarehouse}</strong></span>}
                  {selectedColumns.total && <span><strong>Total: {summary.totalQty}</strong></span>}
                </div>
              </div>
            </div>
          )
        )}

        {reportType === 'creditors' && (
          creditorsSummary.length === 0 ? (
            <div className="no-data-message">
              <p>No creditors data for the selected period.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="report-table">
                <thead>
                  <tr>
                    <th className="col-item-name">Creditor</th>
                    <th className="col-qty">Route</th>
                    <th className="col-qty">Total Due</th>
                    <th className="col-qty">Paid</th>
                    <th className="col-qty">Bal. Due</th>
                  </tr>
                </thead>
                <tbody>
                  {creditorsSummary.map((c, i) => (
                    <tr key={i}>
                      <td className="col-item-name">{c.creditor}</td>
                      <td className="col-qty">{c.route}</td>
                      <td className="col-qty">{formatCurrency(c.totalDue)}</td>
                      <td className="col-qty">{formatCurrency(c.paid)}</td>
                      <td className="col-qty">{formatCurrency(c.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="table-footer">
                <div className="footer-summary">
                  <span><strong>Creditors: {creditorsSummary.length}</strong></span>
                  <span><strong>Total Due: {formatCurrency(creditorsSummary.reduce((s, c) => s + c.totalDue, 0))}</strong></span>
                  <span><strong>Paid: {formatCurrency(creditorsSummary.reduce((s, c) => s + c.paid, 0))}</strong></span>
                  <span><strong>Balance: {formatCurrency(creditorsSummary.reduce((s, c) => s + c.balance, 0))}</strong></span>
                </div>
              </div>
            </div>
          )
        )}

        {reportType === 'sales' && (
          salesReportData.length === 0 ? (
            <div className="no-data-message">
              <p>No sales data for the selected period.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="report-table">
                <thead>
                  <tr>
                    <th className="col-item-name">Date</th>
                    <th className="col-qty">Sales Type</th>
                    <th className="col-qty">Description</th>
                    <th className="col-qty">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {salesReportData.map((sale, i) => (
                    <tr key={i}>
                      <td className="col-item-name">{new Date(sale.date).toLocaleDateString()}</td>
                      <td className="col-qty">{sale.salesType}</td>
                      <td className="col-qty">{sale.description}</td>
                      <td className="col-qty">{formatCurrency(sale.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="table-footer">
                <div className="footer-summary">
                  <span><strong>Total Cash+Check: {formatCurrency(salesTotals.cashCheckTotal)}</strong></span>
                  <span><strong>Total Credit: {formatCurrency(salesTotals.creditTotal)}</strong></span>
                  <span><strong>Total Sales: {formatCurrency(salesTotals.totalSales)}</strong></span>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Reports;
