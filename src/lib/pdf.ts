import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { invoke } from '@tauri-apps/api/core';
import { openPath } from '@tauri-apps/plugin-opener';
import type { FinanceReport, CommissionReport, JobSummary } from '../types';

const fmt = (n: number) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(n);

async function saveAndOpenPdf(doc: jsPDF, filename: string) {
    const buffer = doc.output('arraybuffer');
    const bytes = Array.from(new Uint8Array(buffer));
    const savedPath = await invoke<string>('save_pdf_file', { filename, bytes });

    try {
        await openPath(savedPath);
    } catch (error) {
        console.warn('PDF saved, but could not be opened automatically:', error);
        alert(`PDF saved to:\n${savedPath}`);
    }
}

export const pdfGen = {
    generateReceipt: async (job: JobSummary, method: string) => {
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
            doc.text(`Attendant: ${job.attendants.join(', ') || 'N/A'}`, 10, 52);
            doc.line(10, 57, 70, 57);

            // Services
            doc.setFont('helvetica', 'bold');
            doc.text('Services:', 10, 63);
            doc.setFont('helvetica', 'normal');
            let y = 69;
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

            await saveAndOpenPdf(doc, `Receipt_${job.vehicle_plate}_${job.id}.pdf`);
        } catch (error: any) {
            console.error('Failed to generate Receipt PDF:', error);
            alert(`Failed to generate Receipt PDF: ${error?.message || error}`);
        }
    },

    generateFinanceReport: async (data: FinanceReport, startDate: string, endDate: string) => {
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

            await saveAndOpenPdf(doc, `Finance_Report_${startDate}_${endDate}.pdf`);
        } catch (error: any) {
            console.error('Failed to generate Finance PDF:', error);
            alert(`Failed to generate Finance PDF: ${error?.message || error}`);
        }
    },

    generateCommissionReport: async (data: CommissionReport, startDate: string, endDate: string) => {
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
                head: [['Attendant', 'Date', 'Job', 'Vehicle', 'Services', 'Earned (KES)']],
                body: data.staff_breakdown.flatMap(s =>
                    s.jobs.length > 0
                        ? s.jobs.map(job => [s.employee_name, job.date, `#${job.job_id}`, job.vehicle_plate, job.services, fmt(job.amount)])
                        : [[s.employee_name, '-', `${s.job_count} jobs`, '-', '-', fmt(s.amount)]]
                ),
                theme: 'grid'
            });

            await saveAndOpenPdf(doc, `Commission_Report_${startDate}_${endDate}.pdf`);
        } catch (error: any) {
            console.error('Failed to generate Commission PDF:', error);
            alert(`Failed to generate Commission PDF: ${error?.message || error}`);
        }
    }
};
