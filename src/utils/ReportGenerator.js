import api from '../api/client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateMonthlyReport = async (sales, expenses, routes, monthName, year) => {
    // 1. Filter Data for Selected Month/Year
    const isSameMonth = (dateStr) => {
        if (!dateStr) return false;
        const date = new Date(dateStr);
        const month = date.toLocaleString('default', { month: 'long' });
        return month === monthName && date.getFullYear() === year;
    };

    const monthlySales = sales.filter(s => isSameMonth(s.date));
    const monthlyExpenses = expenses.filter(e => isSameMonth(e.date || e.createdAt));

    // 2. Calculate Totals
    const totalSales = monthlySales.reduce((sum, s) => sum + s.totalBill, 0);
    const totalCollected = monthlySales.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
    // Note: Outstanding is based on the remaining amount of SALES made this month
    const totalOutstanding = monthlySales.reduce((sum, s) => sum + (s.totalBill - (s.paidAmount || 0)), 0);

    const totalExpenses = monthlyExpenses.reduce((sum, e) => sum + (parseFloat(e.amount || e.value) || 0), 0);
    const netProfit = totalCollected - totalExpenses;

    // 3. Setup PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // -- HEADER --
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 128, 185); // Blue
    doc.text("Samindu Inventory System", pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text(`Monthly Financial Report - ${monthName} ${year}`, pageWidth / 2, 30, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, 38, { align: 'center' });

    // -- SUMMARY TABLE --
    const summaryData = [
        ['Total Sales Value', `Rs. ${totalSales.toLocaleString()}`],
        ['Total Collected (Paid)', `Rs. ${totalCollected.toLocaleString()}`],
        ['Total Outstanding (Remaining)', `Rs. ${totalOutstanding.toLocaleString()}`],
        ['Total Expenses', `Rs. ${totalExpenses.toLocaleString()}`],
        ['NET PROFIT', `Rs. ${netProfit.toLocaleString()}`]
    ];

    autoTable(doc, {
        startY: 45,
        head: [['Metric', 'Amount']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 12, halign: 'center' },
        columnStyles: {
            0: { fontStyle: 'bold', halign: 'left' },
            1: { halign: 'right' }
        },
        // Highlight Net Profit Row
        didParseCell: (data) => {
            if (data.row.index === 4) { // Net Profit row
                data.cell.styles.fillColor = [240, 255, 240];
                data.cell.styles.textColor = [16, 124, 16]; // Green
                data.cell.styles.fontStyle = 'bold';
            }
        }
    });

    // -- ROUTE BREAKDOWN --
    const routeBreakdown = routes.map(route => {
        // Filter sales for this route AND this month
        const routeSales = monthlySales.filter(s => s.routeName === route);

        const rTotalBill = routeSales.reduce((sum, s) => sum + s.totalBill, 0);
        const rPaid = routeSales.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
        const rRemaining = rTotalBill - rPaid;

        return [
            route,
            routeSales.length,
            `Rs. ${rTotalBill.toLocaleString()}`,
            `Rs. ${rPaid.toLocaleString()}`,
            `Rs. ${rRemaining.toLocaleString()}`
        ];
    });

    // Add 'Unknown/Other' if any sales have no route match
    const otherSales = monthlySales.filter(s => !routes.includes(s.routeName));
    if (otherSales.length > 0) {
        const oTotal = otherSales.reduce((sum, s) => sum + s.totalBill, 0);
        const oPaid = otherSales.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
        const oRem = oTotal - oPaid;
        routeBreakdown.push(['Other / Unassigned', otherSales.length, `Rs. ${oTotal.toLocaleString()}`, `Rs. ${oPaid.toLocaleString()}`, `Rs. ${oRem.toLocaleString()}`]);
    }

    // Add Route Table
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Route Breakdown", 14, doc.lastAutoTable.finalY + 15);

    autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [['Route Name', 'Sales Count', 'Total Bill', 'Paid', 'Outstanding']],
        body: routeBreakdown,
        theme: 'striped',
        headStyles: { fillColor: [52, 73, 94], textColor: 255 },
        columnStyles: {
            0: { fontStyle: 'bold' },
            2: { halign: 'right' },
            3: { halign: 'right' },
            4: { halign: 'right', textColor: [196, 43, 28] } // Red for outstanding
        }
    });

    // -- FOOTER --
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(150);

        // Page Number
        doc.text('Page ' + i + ' of ' + pageCount, pageWidth / 2, doc.internal.pageSize.height - 15, { align: 'center' });

        // Brand Footer
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text('Powered by W2 Tech Solutions', pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    }

    // 4. Save File
    const pdfBuffer = doc.output('arraybuffer');
    const filename = `Monthly_Report_${monthName}_${year}.pdf`;

    try {
        const result = await api.pdf.save(pdfBuffer, filename);
        if (result.success) {
            alert(`Report saved successfully to:\n${result.filePath}`);
        } else if (result.error !== 'Cancelled') {
            alert('Failed to save report: ' + result.error);
        }
    } catch (err) {
        console.error('Error saving PDF:', err);
        alert('Error saving PDF. See console for details.');
    }
};
