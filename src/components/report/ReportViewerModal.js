import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import FirestoreService from '../../services';
import { handleFirebaseOperation } from '../../utils/firebaseErrorHandler';
import { toast } from 'sonner';

const ReportViewerModal = ({ open, onOpenChange, report }) => {
    const downloadReport = async () => {
        try {
            const result = await handleFirebaseOperation(
                () => FirestoreService.reports.generatePDF(report),
                'Report downloaded as PDF'
            );
            if (result.success) {
                const url = result.data.url;
                const link = document.createElement('a');
                link.href = url;
                link.download = `${report.name}.pdf`;
                link.click();
            }
        } catch (error) {
            toast.error('Error downloading report: ' + error.message);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{report?.name}</DialogTitle>
                </DialogHeader>
                {report && (
                    <div className="space-y-4">
                        <p><strong>Type:</strong> {report.type}</p>
                        <p><strong>Summary:</strong> {report.summary}</p>
                        <p><strong>Insights:</strong> {report.insights}</p>
                        <p><strong>Risk Scores:</strong> {JSON.stringify(report.riskScores)}</p>
                        <p>
                            <strong>Recommendations:</strong>{' '}
                            {report.recommendations.map((r) => r.action).join(', ')}
                        </p>
                        <Button onClick={downloadReport}>Download as PDF</Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default ReportViewerModal;