// api/recordings/index.js - Main API route for fetching all recordings and creating new ones

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

// Constants
const RECORDINGS_DIR = path.join(process.cwd(), 'public', 'recordings');
const DB_PATH = path.join(process.cwd(), 'data', 'recordings.json');

// Ensure directories exist
const ensureDirectoriesExist = async () => {
    try {
        // Ensure data directory exists
        if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
            await mkdir(path.join(process.cwd(), 'data'), { recursive: true });
        }

        // Ensure recordings directory exists in public folder
        if (!fs.existsSync(RECORDINGS_DIR)) {
            await mkdir(RECORDINGS_DIR, { recursive: true });
        }
    } catch (error) {
        console.error('Error creating directories:', error);
        throw error;
    }
};

// Read recordings database
const getRecordings = async () => {
    try {
        await ensureDirectoriesExist();

        if (!fs.existsSync(DB_PATH)) {
            // Create empty recordings DB if it doesn't exist
            await writeFile(DB_PATH, JSON.stringify({ recordings: [] }));
            return { recordings: [] };
        }

        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading recordings database:', error);
        return { recordings: [] };
    }
};

// Write recordings to database
const saveRecordingsData = async (data) => {
    try {
        await ensureDirectoriesExist();
        await writeFile(DB_PATH, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error writing to recordings database:', error);
        throw error;
    }
};

// Generate thumbnail from video (simplified - in a real app you'd use ffmpeg)
const generateThumbnail = () => {
    // In a real app, you'd generate an actual thumbnail
    // Here we'll just return a placeholder path
    return `/api/placeholder/400/225`;
};

// GET handler - fetch all recordings
export async function GET() {
    try {
        const data = await getRecordings();

        return NextResponse.json({
            recordings: data.recordings,
            success: true
        });
    } catch (error) {
        console.error('Error fetching recordings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch recordings', success: false },
            { status: 500 }
        );
    }
}

// POST handler - create a new recording
export async function POST(request) {
    try {
        await ensureDirectoriesExist();

        // Parse the multipart form data
        const formData = await request.formData();
        const recordingFile = formData.get('recording');
        const duration = parseInt(formData.get('duration') || '0');
        const timestamp = formData.get('timestamp') || new Date().toISOString();
        const fileSize = parseInt(formData.get('fileSize') || '0');

        if (!recordingFile) {
            return NextResponse.json(
                { error: 'No recording file provided', success: false },
                { status: 400 }
            );
        }

        // Generate a unique ID for the recording
        const recordingId = uuidv4();

        // Get the file extension
        const fileType = recordingFile.type;
        const fileExtension = fileType === 'video/webm' ? '.webm' : '.mp4';

        // Create a filename
        const fileName = `${recordingId}${fileExtension}`;
        const filePath = path.join(RECORDINGS_DIR, fileName);

        // Convert the file to a buffer and save it
        const arrayBuffer = await recordingFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await writeFile(filePath, buffer);

        // Generate thumbnail - removed unused parameter
        const thumbnailUrl = generateThumbnail();

        // Create a recording object
        const newRecording = {
            id: recordingId,
            fileName,
            url: `/recordings/${fileName}`,
            thumbnailUrl,
            duration,
            timestamp,
            fileSize,
            createdAt: new Date().toISOString()
        };

        // Read current recordings
        const data = await getRecordings();

        // Add new recording
        data.recordings.unshift(newRecording); // Add to beginning of array

        // Save updated recordings
        await saveRecordingsData(data);

        return NextResponse.json({
            recording: newRecording,
            success: true
        });
    } catch (error) {
        console.error('Error saving recording:', error);
        return NextResponse.json(
            { error: 'Failed to save recording', success: false },
            { status: 500 }
        );
    }
}

// api/recordings/[id].js - API route for handling individual recordings
export async function DELETE(request, { params }) {
    try {
        const { id } = params;

        if (!id) {
            return NextResponse.json(
                { error: 'Recording ID is required', success: false },
                { status: 400 }
            );
        }

        // Read current recordings
        const data = await getRecordings();

        // Find the recording to delete
        const recordingIndex = data.recordings.findIndex(rec => rec.id === id);

        if (recordingIndex === -1) {
            return NextResponse.json(
                { error: 'Recording not found', success: false },
                { status: 404 }
            );
        }

        const recording = data.recordings[recordingIndex];

        // Delete the file from the filesystem
        const filePath = path.join(RECORDINGS_DIR, recording.fileName);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Remove the recording from the database
        data.recordings.splice(recordingIndex, 1);

        // Save updated recordings
        await saveRecordingsData(data);

        return NextResponse.json({
            message: 'Recording deleted successfully',
            success: true
        });
    } catch (error) {
        console.error('Error deleting recording:', error);
        return NextResponse.json(
            { error: 'Failed to delete recording', success: false },
            { status: 500 }
        );
    }
}