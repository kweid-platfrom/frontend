// app/api/docs/list/route.js - List Google Docs
import { NextResponse } from 'next/server';
import googleDocsService from '../../../../lib/goggleDocsService';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        
        // Get query parameters
        const query = searchParams.get('query');
        const orderBy = searchParams.get('orderBy');
        const pageSize = searchParams.get('pageSize');

        // Build options object
        const options = {};
        if (query) options.query = query;
        if (orderBy) options.orderBy = orderBy;
        if (pageSize) options.pageSize = parseInt(pageSize, 10);

        // List documents
        const documents = await googleDocsService.listDocuments(options);

        return NextResponse.json({
            success: true,
            documents,
            count: documents.length
        });

    } catch (error) {
        console.error('Error listing Google Docs:', error);
        return NextResponse.json(
            { error: 'Failed to list documents', message: error.message },
            { status: 500 }
        );
    }
}