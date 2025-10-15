// lib/recordingService.js - Fixed with correct privacy status format
const recordingService = new class RecordingService {
  constructor() {
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
  }

  // Upload to YouTube without playlist assignment
  async uploadToYouTube(blob, metadata = {}, onProgress = null) {
    if (!blob || !(blob instanceof Blob)) {
      return {
        success: false,
        error: { message: 'Invalid video blob provided' }
      };
    }

    if (blob.size === 0) {
      return {
        success: false,
        error: { message: 'Empty video blob provided' }
      };
    }

    try {
      console.log('Uploading to YouTube via API...');

      // FIXED: Normalize privacy status to lowercase
      const privacyStatus = (metadata.privacy || 'unlisted').toLowerCase();

      // Create form data with simplified metadata (no playlist)
      const formData = new FormData();
      formData.append('video', blob, `recording_${Date.now()}.webm`);
      formData.append('metadata', JSON.stringify({
        title: metadata.title || `Recording - ${new Date().toLocaleDateString()}`,
        description: metadata.description || 'Screen recording from QA testing',
        tags: metadata.tags || ['qa-testing', 'screen-recording'],
        privacy: privacyStatus, // FIXED: Use lowercase privacy status
        categoryId: metadata.categoryId || '28',
        suiteId: metadata.suiteId,
        suiteName: metadata.suiteName
      }));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minute timeout

      const response = await fetch(`${this.apiBaseUrl}/recordings/upload`, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        console.log('YouTube upload successful with video ID:', result.data.videoId);
        if (onProgress) {
          onProgress(100);
        }

        return {
          success: true,
          data: {
            videoId: result.data.videoId,
            youtubeId: result.data.videoId,
            url: result.data.url,
            videoUrl: result.data.url,
            embedUrl: result.data.embedUrl,
            thumbnailUrl: result.data.thumbnailUrl,
            privacyStatus: result.data.privacyStatus,
            provider: 'youtube',
            uploadedAt: result.data.uploadedAt || new Date().toISOString()
          }
        };
      } else {
        console.error('YouTube upload failed:', result.error);
        return {
          success: false,
          error: result.error || { message: 'Upload failed' }
        };
      }
    } catch (error) {
      console.error('YouTube upload error:', error);
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: { message: 'Upload timeout - please try again with a smaller file' }
        };
      }
      return {
        success: false,
        error: { message: error.message || 'Failed to upload to YouTube' }
      };
    }
  }

  // Get video duration properly
  async getVideoDuration(blob) {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        const duration = video.duration;
        URL.revokeObjectURL(video.src);
        resolve(isFinite(duration) ? duration : 0);
      };
      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        resolve(0);
      };
      video.src = URL.createObjectURL(blob);
    });
  }

  // Enhanced upload with retry and better error handling
  async uploadToYouTubeWithRetry(blob, metadata = {}, onProgress = null, maxRetries = 3) {
    let lastError = null;

    // FIXED: Normalize privacy status to lowercase
    if (metadata.privacy) {
      metadata.privacy = metadata.privacy.toLowerCase();
    }

    // Get actual video duration
    const videoDuration = await this.getVideoDuration(blob);
    metadata.duration = videoDuration;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Upload attempt ${attempt}/${maxRetries} - File size: ${blob.size} bytes, Duration: ${videoDuration}s, Privacy: ${metadata.privacy || 'unlisted'}`);

        const result = await this.uploadToYouTube(blob, metadata, (progress) => {
          if (onProgress) {
            const attemptProgress = progress / maxRetries;
            const totalProgress = ((attempt - 1) / maxRetries) * 100 + attemptProgress;
            onProgress(Math.min(totalProgress, 100));
          }
        });

        if (result.success) {
          if (onProgress) onProgress(100);
          return result;
        }

        lastError = result.error;
        if (attempt < maxRetries) {
          console.log(`Upload attempt ${attempt} failed, retrying in ${Math.pow(2, attempt - 1)}s...`);
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
        }
      } catch (error) {
        lastError = { message: error.message };
        console.error(`Upload attempt ${attempt} error:`, error);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
        }
      }
    }

    return {
      success: false,
      error: {
        message: `All ${maxRetries} upload attempts failed`,
        lastError: lastError
      }
    };
  }

  // Alias for compatibility with AssetService
  async uploadRecordingWithRetry(blob, metadata = {}, onProgress = null, maxRetries = 3) {
    return this.uploadToYouTubeWithRetry(blob, metadata, onProgress, maxRetries);
  }

  // Get recordings for suite (API call - no playlist logic)
  async getRecordingsForSuite(suiteId) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/recordings?suiteId=${suiteId}`, {
        method: 'GET'
      });

      if (!response.ok) {
        return { success: false, error: { message: 'Failed to get recordings' } };
      }

      const result = await response.json();
      return result;
    } catch (error) {
      return { success: false, error: { message: error.message } };
    }
  }

  // Delete recording (no playlist cleanup needed)
  async deleteRecording(recordingData) {
    if (!recordingData) {
      return { success: false, error: { message: 'No recording data provided' } };
    }

    try {
      const videoId = recordingData.youtubeId || recordingData.videoId;
      if (!videoId) {
        return {
          success: false,
          error: { message: 'No YouTube video ID found' }
        };
      }

      console.log(`Deleting YouTube video: ${videoId}`);

      const response = await fetch(`${this.apiBaseUrl}/recordings/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId,
          recordingData
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Delete failed: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error deleting recording:', error);
      return {
        success: false,
        error: { message: error.message || 'Failed to delete recording' }
      };
    }
  }

  // Update video metadata (for privacy changes, etc.)
  async updateVideoMetadata(recordingData, updates) {
    if (!recordingData || !updates) {
      return { success: false, error: { message: 'Invalid parameters' } };
    }

    const videoId = recordingData.youtubeId || recordingData.videoId;
    if (!videoId) {
      return { success: false, error: { message: 'No video ID found' } };
    }

    try {
      // FIXED: Normalize privacy status if provided
      if (updates.privacy) {
        updates.privacy = updates.privacy.toLowerCase();
      }

      const response = await fetch(`${this.apiBaseUrl}/recordings/update-metadata`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId,
          updates: {
            title: updates.title,
            description: updates.description,
            privacy: updates.privacy
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Metadata update failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating video metadata:', error);
      return {
        success: false,
        error: { message: error.message || 'Failed to update metadata' }
      };
    }
  }

  // Format duration properly
  formatDuration(seconds) {
    if (!isFinite(seconds) || seconds < 0) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // Validate video blob
  async validateVideoBlob(blob) {
    const errors = [];

    if (!blob) {
      errors.push('No video blob provided');
      return { valid: false, errors };
    }

    if (!(blob instanceof Blob)) {
      errors.push('Invalid blob object');
      return { valid: false, errors };
    }

    if (blob.size === 0) {
      errors.push('Empty video file');
      return { valid: false, errors };
    }

    if (blob.size > 128 * 1024 * 1024) { // 128MB limit
      errors.push('Video file too large (>128MB)');
      return { valid: false, errors };
    }

    // Get duration
    const duration = await this.getVideoDuration(blob);
    if (duration === 0) {
      // Don't fail validation for duration issues - just warn
      console.warn('Could not determine video duration, but proceeding with upload');
    }

    return {
      valid: errors.length === 0,
      errors,
      duration,
      size: blob.size,
      type: blob.type
    };
  }

  // Service status
  getServiceStatus() {
    return Promise.resolve({
      youtube: { available: true }
    });
  }

  // Helper methods for URL generation
  getPlaybackUrl(recordingData) {
    return recordingData.videoUrl || recordingData.url;
  }

  getVideoUrl(recordingData) {
    return recordingData.videoUrl || recordingData.url;
  }

  getRecordingInfo(recordingData) {
    return {
      id: recordingData.youtubeId || recordingData.videoId,
      title: recordingData.title,
      duration: recordingData.duration || recordingData.durationSeconds,
      provider: recordingData.provider || 'youtube',
      status: recordingData.status || 'active'
    };
  }

  validateRecordingData(recordingData) {
    const errors = [];

    if (!recordingData) {
      errors.push('No recording data provided');
      return { valid: false, errors };
    }

    if (!recordingData.title) {
      errors.push('Recording title is required');
    }

    // Check for required URL
    if (!recordingData.videoUrl && !recordingData.url) {
      errors.push('Video URL is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Helper to normalize privacy status across the application
  normalizePrivacyStatus(privacy) {
    if (!privacy) return 'unlisted';
    const normalized = privacy.toLowerCase().trim();
    const validStatuses = ['public', 'unlisted', 'private'];
    return validStatuses.includes(normalized) ? normalized : 'unlisted';
  }
}();

export default recordingService;