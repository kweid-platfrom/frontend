// migration-script.js - Run this to help transition to API architecture
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting migration to API-based YouTube recording service...\n');

// 1. Check current environment setup
console.log('📋 Step 1: Checking current environment...');
const envLocalPath = path.join(process.cwd(), '.env.local');
const envPath = path.join(process.cwd(), '.env');

let currentEnvFile = null;
let currentEnvVars = {};

if (fs.existsSync(envLocalPath)) {
    currentEnvFile = envLocalPath;
    console.log('✅ Found .env.local file');
} else if (fs.existsSync(envPath)) {
    currentEnvFile = envPath;
    console.log('✅ Found .env file');
} else {
    console.log('⚠️  No environment file found');
}

if (currentEnvFile) {
    const envContent = fs.readFileSync(currentEnvFile, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            currentEnvVars[key.trim()] = value.trim();
        }
    });
    
    // Check for existing YouTube credentials
    const hasReactAppCreds = currentEnvVars['REACT_APP_YOUTUBE_CLIENT_ID'] && 
                             currentEnvVars['REACT_APP_YOUTUBE_CLIENT_SECRET'] && 
                             currentEnvVars['REACT_APP_YOUTUBE_REFRESH_TOKEN'];
    
    const hasServerCreds = currentEnvVars['YOUTUBE_CLIENT_ID'] && 
                          currentEnvVars['YOUTUBE_CLIENT_SECRET'] && 
                          currentEnvVars['YOUTUBE_REFRESH_TOKEN'];
    
    if (hasReactAppCreds) {
        console.log('✅ Found frontend YouTube credentials (REACT_APP_*)');
        
        if (!hasServerCreds) {
            console.log('🔄 Converting frontend credentials to server-side...');
            
            // Add server-side versions
            const newEnvLines = [
                '# YouTube API Credentials (Server-side)',
                `YOUTUBE_CLIENT_ID=${currentEnvVars['REACT_APP_YOUTUBE_CLIENT_ID']}`,
                `YOUTUBE_CLIENT_SECRET=${currentEnvVars['REACT_APP_YOUTUBE_CLIENT_SECRET']}`,
                `YOUTUBE_REFRESH_TOKEN=${currentEnvVars['REACT_APP_YOUTUBE_REFRESH_TOKEN']}`,
                ''
            ];
            
            // Read existing file and add new credentials
            let existingContent = fs.readFileSync(currentEnvFile, 'utf8');
            
            // Remove old REACT_APP_ credentials
            existingContent = existingContent
                .replace(/REACT_APP_YOUTUBE_CLIENT_ID=.*/g, '')
                .replace(/REACT_APP_YOUTUBE_CLIENT_SECRET=.*/g, '')
                .replace(/REACT_APP_YOUTUBE_REFRESH_TOKEN=.*/g, '')
                .replace(/\n\n+/g, '\n\n'); // Clean up extra newlines
            
            const updatedContent = newEnvLines.join('\n') + existingContent;
            
            // Create backup
            fs.writeFileSync(currentEnvFile + '.backup', fs.readFileSync(currentEnvFile));
            console.log('📦 Created backup at', currentEnvFile + '.backup');
            
            // Write updated file
            fs.writeFileSync(currentEnvFile, updatedContent);
            console.log('✅ Updated environment file with server-side credentials');
            
        } else {
            console.log('✅ Server-side credentials already exist');
        }
    } else if (hasServerCreds) {
        console.log('✅ Server-side YouTube credentials already configured');
    } else {
        console.log('❌ No YouTube credentials found. Please add them manually.');
    }
}

// 2. Check directory structure
console.log('\n📁 Step 2: Checking directory structure...');

const requiredDirs = [
    'app/api',
    'app/api/recordings',
    'app/api/recordings/upload',
    'app/api/recordings/delete'
];

requiredDirs.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log('📁 Created directory:', dir);
    } else {
        console.log('✅ Directory exists:', dir);
    }
});

// 3. Check for Next.js app directory structure
console.log('\n🔍 Step 3: Checking Next.js configuration...');

const packageJsonPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (packageJson.dependencies && packageJson.dependencies.next) {
        console.log('✅ Next.js detected:', packageJson.dependencies.next);
        
        // Check if using app directory
        const appDirExists = fs.existsSync(path.join(process.cwd(), 'app'));
        const pagesDirExists = fs.existsSync(path.join(process.cwd(), 'pages'));
        
        if (appDirExists) {
            console.log('✅ Using App Router (app directory)');
        } else if (pagesDirExists) {
            console.log('⚠️  Using Pages Router - you may need to adapt the API routes');
            console.log('   Consider migrating to App Router or adjust API paths');
        } else {
            console.log('❌ Cannot determine Next.js router type');
        }
    } else {
        console.log('❌ Next.js not found in dependencies');
    }
} else {
    console.log('❌ package.json not found');
}

// 4. Create API route files if they don't exist
console.log('\n📝 Step 4: Creating API route files...');

const uploadRoutePath = path.join(process.cwd(), 'app/api/recordings/upload/route.js');
const deleteRoutePath = path.join(process.cwd(), 'app/api/recordings/delete/route.js');

if (!fs.existsSync(uploadRoutePath)) {
    console.log('❌ Upload API route missing - you need to create:', uploadRoutePath);
    console.log('   Use the provided upload route code from the artifacts');
} else {
    console.log('✅ Upload API route exists');
}

if (!fs.existsSync(deleteRoutePath)) {
    console.log('❌ Delete API route missing - you need to create:', deleteRoutePath);
    console.log('   Use the provided delete route code from the artifacts');
} else {
    console.log('✅ Delete API route exists');
}

// 5. Check recordingService location
console.log('\n🔧 Step 5: Checking recording service...');

const possibleServicePaths = [
    'services/recordingService.js',
    'lib/recordingService.js',
    'src/services/recordingService.js',
    'src/lib/recordingService.js'
];

let serviceFound = false;
possibleServicePaths.forEach(servicePath => {
    const fullPath = path.join(process.cwd(), servicePath);
    if (fs.existsSync(fullPath)) {
        console.log('✅ Found recording service at:', servicePath);
        serviceFound = true;
        
        // Check if it's using the old frontend YouTube service
        const serviceContent = fs.readFileSync(fullPath, 'utf8');
        if (serviceContent.includes('import youTubeService') || serviceContent.includes('import YouTubeService')) {
            console.log('🔄 Service needs updating to use API endpoints');
        } else if (serviceContent.includes('/api/recordings/upload')) {
            console.log('✅ Service already configured for API endpoints');
        } else {
            console.log('⚠️  Cannot determine service configuration');
        }
    }
});

if (!serviceFound) {
    console.log('❌ Recording service not found in common locations');
    console.log('   You may need to update the import path in RecorderActions.jsx');
}

// 6. Summary and next steps
console.log('\n📋 Summary and Next Steps:');
console.log('================================');

if (currentEnvFile) {
    console.log('✅ Environment file configured');
} else {
    console.log('❌ Create environment file with YouTube credentials');
}

console.log('\n📝 Manual steps required:');
console.log('1. Copy the upload route code to app/api/recordings/upload/route.js');
console.log('2. Copy the delete route code to app/api/recordings/delete/route.js');
console.log('3. Update your recording service with the API client code');
console.log('4. Test the API endpoints: /api/recordings/upload (GET for status)');
console.log('5. Remove any direct YouTube service imports from frontend components');

console.log('\n🧪 Testing checklist:');
console.log('□ API endpoints return status when visited');
console.log('□ Upload works with small test video');
console.log('□ Recording appears in Firestore with correct metadata');
console.log('□ Video is accessible on YouTube');
console.log('□ Delete functionality works');
console.log('□ No YouTube credentials exposed in frontend');

console.log('\n✅ Migration preparation complete!');
console.log('Refer to the Environment Setup Guide for detailed instructions.');