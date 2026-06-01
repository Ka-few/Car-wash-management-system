import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { FinanceReport, CommissionReport, JobSummary } from '../types';

const fmt = (n: number) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(n);

export const pdfGen = {
    generateReceipt: (job: JobSummary, method: string) => {
        console.log('Generating Receipt for job:', job.id);
        try {
            const doc = new jsPDF({ format: [80, 150], unit: 'mm' }); // Receipt size

            // Header
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('SAFIAUTO WASH', 40, 15, { align: 'center' });

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text('Clean. Professional. Fast.', 40, 20, { align: 'center' });
            doc.line(10, 25, 70, 25);

            // Job Info
            doc.text(`Receipt #: ${job.id}`, 10, 32);
            doc.text(`Date: ${new Date().toLocaleString()}`, 10, 37);
            doc.text(`Vehicle: ${job.vehicle_plate}`, 10, 42);
            doc.text(`Method: ${method}`, 10, 47);
            doc.line(10, 52, 70, 52);

            // Services
            doc.setFont('helvetica', 'bold');
            doc.text('Services:', 10, 58);
            doc.setFont('helvetica', 'normal');
            let y = 64;
            job.services.forEach(s => {
                doc.text(s, 12, y);
                y += 5;
            });

            // Total
            doc.line(10, y + 2, 70, y + 2);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(`TOTAL: ${fmt(job.total_price)}`, 10, y + 10);

            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.text('Thank you for choosing SafiAuto!', 40, y + 18, { align: 'center' });

            doc.save(`Receipt_${job.vehicle_plate}_${job.id}.pdf`);
        } catch (error: any) {
            console.error('Failed to generate Receipt PDF:', error);
            alert(`Failed to generate Receipt PDF: ${error?.message || error}`);
        }
    },

    generateFinanceReport: (data: FinanceReport, startDate: string, endDate: string) => {
        console.log('Generating Finance Report PDF...');
        try {
            const doc = new jsPDF();

            doc.setFontSize(22);
            doc.text('Financial Performance Report', 14, 20);
            doc.setFontSize(12);
            doc.text(`Period: ${startDate} to ${endDate}`, 14, 30);

            doc.setFontSize(14);
            doc.text(`Total Revenue: ${fmt(data.total_revenue)}`, 14, 45);

            // Daily Breakdown Table
            autoTable(doc, {
                startY: 55,
                head: [['Date', 'Revenue (KES)']],
                body: data.daily_revenue.map(d => [d.date, fmt(d.amount)]),
                theme: 'striped',
                headStyles: { fillColor: [241, 245, 249], textColor: 0, fontStyle: 'bold' }
            });

            doc.save(`Finance_Report_${startDate}_${endDate}.pdf`);
        } catch (error: any) {
            console.error('Failed to generate Finance PDF:', error);
            alert(`Failed to generate Finance PDF: ${error?.message || error}`);
        }
    },

    generateCommissionReport: (data: CommissionReport, startDate: string, endDate: string) => {
        console.log('Generating Commission Report PDF...');
        try {
            const doc = new jsPDF();

            doc.setFontSize(22);
            doc.text('Commission Payout Report', 14, 20);
            doc.setFontSize(12);
            doc.text(`Period: ${startDate} to ${endDate}`, 14, 30);

            doc.setFontSize(14);
            doc.text(`Total Commissions: ${fmt(data.total_commission)}`, 14, 45);

            autoTable(doc, {
                startY: 55,
                head: [['Employee', 'Jobs', 'Earned (KES)']],
                body: data.staff_breakdown.map(s => [s.employee_name, s.job_count.toString(), fmt(s.amount)]),
                theme: 'grid'
            });

            doc.save(`Commission_Report_${startDate}_${endDate}.pdf`);
        } catch (error: any) {
            console.error('Failed to generate Commission PDF:', error);
            alert(`Failed to generate Commission PDF: ${error?.message || error}`);
        }
    }
};
