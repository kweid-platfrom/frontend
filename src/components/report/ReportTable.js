import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, Eye, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import FirestoreService from '../../services';
import { handleFirebaseOperation } from '../../utils/firebaseErrorHandler';
import { toast } from 'sonner';

const ReportTable = ({ reports, loading, onView, onDelete }) => {
    const downloadReport = async (report) => {
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
        <div className="bg-white shadow rounded-lg p-6">
            {loading ? (
                <p>Loading reports...</p>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Report Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Created By</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created Date</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reports.map((report) => (
                            <TableRow key={report.id}>
                                <TableCell>{report.name}</TableCell>
                                <TableCell>{report.type}</TableCell>
                                <TableCell>{report.created_by}</TableCell>
                                <TableCell>{report.status}</TableCell>
                                <TableCell>
                                    {format(new Date(report.created_at), 'PP')}
                                </TableCell>
                                <TableCell>
                                    <div className="flex space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onView(report)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => downloadReport(report)}
                                        >
                                            <Download className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onDelete(report.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </div>
    );
};

export default ReportTable;