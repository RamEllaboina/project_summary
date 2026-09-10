import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileCode, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { useAnalysis } from '@/context/AnalysisContext';
import { api } from '@/services/api';
import JSZip from 'jszip';

const MAX_FILES = Infinity; // No limit - support unlimited files

// Intelligent filtering configuration
const IGNORED_DIRECTORIES = [
    'node_modules', 'venv', '.venv', '__pycache__', '.git', 'dist', 'build',
    '.next', 'out', 'target', 'coverage', '.vscode', '.idea', 'vendor',
    '.nyc_output', '.pytest_cache', '.mypy_cache', '.tox', 'site-packages',
    'bower_components', '.npm', '.cache', 'tmp', 'temp'
];

const IGNORED_EXTENSIONS = [
    '.log', '.tmp', '.lock', '.cache', '.DS_Store', '.env', '.env.local',
    '.env.development', '.env.test', '.env.production', '.pid', '.seed',
    '.pid.lock', '.swp', '.swo', '.bak', '.backup', '.old', '.orig',
    '.rej', '~', '.lprof', '.pyc', '.pyo', '.pyd', '.pyi', '.jar',
    '.war', '.ear', '.zip', '.tar', '.tar.gz', '.tgz', '.rar', '.7z',
    '.exe', '.dll', '.so', '.dylib', '.bin', '.dat', '.db', '.sqlite', '.sqlite3'
];

const ALLOWED_EXTENSIONS = [
    '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.py', '.pyx', '.pyi',
    '.java', '.kt', '.scala', '.groovy', '.cpp', '.c', '.h', '.hpp',
    '.cc', '.cxx', '.cs', '.vb', '.php', '.phtml', '.rb', '.rbw', '.go',
    '.mod', '.sum', '.rs', '.swift', '.m', '.mm', '.dart', '.lua',
    '.r', '.R', '.sql', '.sh', '.bash', '.zsh', '.fish', '.html',
    '.htm', '.xhtml', '.css', '.scss', '.sass', '.less', '.json',
    '.jsonc', '.json5', '.xml', '.yaml', '.yml', '.toml', '.ini',
    '.md', '.mdx', '.txt', '.rst', '.dockerfile', '.graphql', '.gql',
    '.proto', '.vue', '.svelte'
];

const shouldIgnoreFile = (filePath, fileName) => {
    // Check ignored directories
    const pathParts = filePath.split('/');
    for (const part of pathParts) {
        if (IGNORED_DIRECTORIES.includes(part)) {
            return { ignored: true, reason: 'ignored_directory' };
        }
    }

    // Check ignored file extensions
    const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    if (IGNORED_EXTENSIONS.includes(ext)) {
        return { ignored: true, reason: 'ignored_file_type' };
    }

    // Check hidden files (starting with .)
    if (fileName.startsWith('.') && !fileName.startsWith('.env') && fileName !== '.gitignore') {
        return { ignored: true, reason: 'hidden_file' };
    }

    // Check lock files
    if (fileName.toLowerCase().includes('package-lock') ||
        fileName.toLowerCase().includes('yarn.lock') ||
        fileName.toLowerCase().includes('pipfile.lock')) {
        return { ignored: true, reason: 'lock_file' };
    }

    return { ignored: false, reason: null };
};

const isSourceCodeFile = (fileName) => {
    const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    return ALLOWED_EXTENSIONS.includes(ext);
};

export default function ProjectDropzone({ onUploadComplete }) {
    const { setFiles, setProjectMetadata, setCurrentProjectId } = useAnalysis();
    const [scanning, setScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [scanStatus, setScanStatus] = useState("Ready to upload");
    const [detectedStack, setDetectedStack] = useState(null);
    const [ignoredCount, setIgnoredCount] = useState(0);
    const [ignoredReasons, setIgnoredReasons] = useState({});
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [error, setError] = useState(null);
    const [uploadComplete, setUploadComplete] = useState(false);
    const [projectId, setProjectId] = useState(null);

    const onDrop = useCallback(async (acceptedFiles) => {
        if (acceptedFiles.length === 0) return;

        setScanning(true);
        setScanProgress(0);
        setError(null);
        setIgnoredCount(0);
        setIgnoredReasons({});
        setUploadComplete(false);
        setProjectId(null);
        setScanStatus("Analyzing files...");

        try {
            let zipFileToUpload = null;
            let filesToUpload = null;
            let filteredFiles = [];
            const singleZip = acceptedFiles.find(f => f.name.endsWith('.zip'));

            // CASE 1: Single Zip File
            if (singleZip && acceptedFiles.length === 1) {
                zipFileToUpload = singleZip;
                filesToUpload = zipFileToUpload;
                setScanStatus("Checking zip file...");
                setScanProgress(10);
            }
            // CASE 2: Folder/Multiple Files (Filter them on client, then upload individually)
            else {
                setScanStatus("Intelligent filtering...");
                setScanProgress(5);

                const zip = new JSZip();
                let fileCount = 0;
                let ignoredCount = 0;
                const reasons = {};

                // Process files in chunks to avoid UI freezing
                const CHUNK_SIZE = 100;
                for (let i = 0; i < acceptedFiles.length; i += CHUNK_SIZE) {
                    const chunk = acceptedFiles.slice(i, i + CHUNK_SIZE);

                    // Apply intelligent filtering
                    chunk.forEach(file => {
                        const path = file.path || file.webkitRelativePath || file.name;
                        const filterResult = shouldIgnoreFile(path, file.name);

                        if (filterResult.ignored) {
                            ignoredCount++;
                            reasons[filterResult.reason] = (reasons[filterResult.reason] || 0) + 1;
                            return;
                        }

                        // Add to filtered files array for individual upload
                        filteredFiles.push(file);

                        // Also add to zip for backup
                        zip.file(path, file);
                        fileCount++;
                    });

                    // Update progress for each chunk
                    const progress = 5 + (i / acceptedFiles.length) * 10;
                    setScanProgress(progress);
                    setScanStatus(`Analyzing files... ${Math.min(i + CHUNK_SIZE, acceptedFiles.length)}/${acceptedFiles.length}`);

                    // Allow UI to update
                    await new Promise(resolve => setTimeout(resolve, 0));
                }

                setIgnoredCount(ignoredCount);
                setIgnoredReasons(reasons);

                if (fileCount === 0) {
                    throw new Error(`No valid source files found. ${ignoredCount} files were ignored by intelligent filtering.`);
                }

                setScanStatus(`Preparing ${fileCount} source files for upload...`);
                setScanProgress(15);

                // Zip files for significantly faster upload
                const blob = await zip.generateAsync({ type: "blob" });
                zipFileToUpload = new File([blob], "project_bundle.zip", { type: "application/zip" });

                // Send single zip file instead of individual files
                filesToUpload = [zipFileToUpload];
                // Update UI state with original filtered files so the user sees individual files in UI
                setUploadedFiles(filteredFiles);
                setFiles(filteredFiles);
            }

            setScanStatus("Uploading project...");
            setScanProgress(30);

            // Upload with progress tracking for large file sets
            const response = await api.uploadProject(filesToUpload, (progress) => {
                setScanProgress(30 + progress * 0.7); // 30-100% range
                setScanStatus(`Uploading... ${Math.round(progress)}%`);
            });

            console.log('📦 Upload response received:', response);

            // Extract project ID from response
            const projectIdFromResponse = response.projectId || response.data?.projectId;

            if (!projectIdFromResponse) {
                throw new Error('No project ID returned from server');
            }

            setProjectId(projectIdFromResponse);
            setCurrentProjectId(projectIdFromResponse);

            setScanProgress(100);
            setScanStatus("Upload complete!");
            setUploadComplete(true);

            // Detect stack from file extensions
            const extensions = new Set();
            filteredFiles.forEach(file => {
                const ext = file.name.split('.').pop().toLowerCase();
                if (ext) extensions.add(ext);
            });

            let stack = "Unknown";
            if (extensions.has('js') || extensions.has('jsx') || extensions.has('ts') || extensions.has('tsx')) {
                stack = "JavaScript/TypeScript";
                if (extensions.has('html')) stack += " + HTML";
                if (extensions.has('css') || extensions.has('scss')) stack += " + CSS";
            } else if (extensions.has('py')) {
                stack = "Python";
            } else if (extensions.has('java')) {
                stack = "Java";
            } else if (extensions.has('html')) {
                stack = "HTML/CSS";
            }

            setDetectedStack(stack);

            setProjectMetadata({
                name: zipFileToUpload.name,
                filesCount: filteredFiles.length || 1,
                stack: stack,
                projectId: projectIdFromResponse
            });

            // Call the onUploadComplete callback with the project ID
            if (onUploadComplete) {
                console.log('📤 Calling onUploadComplete with projectId:', projectIdFromResponse);
                onUploadComplete(projectIdFromResponse);
            }

        } catch (err) {
            console.error("Upload failed", err);
            setError(err.message || "Upload failed. Please ensure the backend is running.");
            setScanning(false);
            setScanProgress(0);
            setUploadComplete(false);
        } finally {
            setScanning(false);
        }

    }, [setFiles, setProjectMetadata, setCurrentProjectId, onUploadComplete]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: true,
        noClick: false,
        noKeyboard: false,
    });

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">

            <div
                {...getRootProps()}
                className={`
          relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ease-out group
          ${isDragActive ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border hover:border-primary/50 hover:bg-muted/30'}
          ${scanning ? 'pointer-events-none opacity-80' : ''}
        `}
            >
                {/* Enhanced input to support both files and folders */}
                <input
                    {...getInputProps()}
                    webkitdirectory=""
                    directory=""
                    multiple
                />

                <AnimatePresence mode="wait">
                    {!scanning && !uploadComplete && uploadedFiles.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col items-center gap-4"
                        >
                            <div className="p-4 rounded-full bg-primary/5 text-primary group-hover:scale-110 transition-transform duration-300">
                                <Upload className="w-8 h-8" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-semibold tracking-tight">
                                    Upload Project Files or Folders
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Drag & drop files, folders, or click to browse. You can select entire folders!
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    🤖 Intelligent filtering will automatically ignore node_modules, .git, and other unnecessary files
                                </p>
                            </div>
                            <div className="flex gap-2 text-xs text-muted-foreground mt-2">
                                <span className="bg-muted px-2 py-1 rounded">📁 Folders</span>
                                <span className="bg-muted px-2 py-1 rounded">📄 Files</span>
                                <span className="bg-muted px-2 py-1 rounded">📦 ZIP</span>
                                <span className="bg-muted px-2 py-1 rounded">🤖 Smart Filter</span>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="w-full space-y-4"
                        >
                            <div className="flex items-center justify-between text-sm font-medium">
                                <span className="flex items-center gap-2">
                                    {scanning ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> :
                                        uploadComplete ? <CheckCircle2 className="w-4 h-4 text-green-500" /> :
                                            <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                    {scanStatus}
                                </span>
                                <span>{Math.round(scanProgress)}%</span>
                            </div>

                            <Progress value={scanProgress} className="h-2" />

                            {/* Show Project ID when upload is complete */}
                            {uploadComplete && projectId && (
                                <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                    <p className="text-xs text-green-700 dark:text-green-300">
                                        ✅ Project uploaded successfully!
                                    </p>
                                    <p className="text-xs text-green-600 dark:text-green-400 font-mono mt-1">
                                        ID: {projectId.substring(0, 8)}...{projectId.substring(projectId.length - 4)}
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 mt-4 text-left">
                                {ignoredCount > 0 && (
                                    <Card className="p-3 bg-muted/50 border-none">
                                        <div className="text-xs text-muted-foreground uppercase font-semibold">Filtered Out</div>
                                        <div className="text-sm font-medium flex items-center gap-2">
                                            <X className="w-3 h-3 text-muted-foreground" />
                                            {ignoredCount} unnecessary files
                                        </div>
                                        {Object.keys(ignoredReasons).length > 0 && (
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {Object.entries(ignoredReasons).map(([reason, count]) => (
                                                    <span key={reason} className="mr-2">
                                                        {reason}: {count}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </Card>
                                )}

                                {detectedStack && (
                                    <Card className="p-3 bg-primary/5 border-primary/20">
                                        <div className="text-xs text-primary uppercase font-semibold">Detected Stack</div>
                                        <div className="text-sm font-medium text-foreground">
                                            {detectedStack}
                                        </div>
                                    </Card>
                                )}
                            </div>

                            {!scanning && uploadedFiles.length > 0 && !uploadComplete && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="pt-4"
                                >
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Processing {uploadedFiles.length} core files...
                                    </p>
                                </motion.div>
                            )}

                            {uploadComplete && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="pt-2"
                                >
                                    <p className="text-sm text-green-600 dark:text-green-400">
                                        ✅ Ready to analyze {uploadedFiles.length} files
                                    </p>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Error Display */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg"
                    >
                        <div className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="w-4 h-4" />
                            <span className="font-medium">Upload Error</span>
                        </div>
                        <p className="text-sm text-destructive/80 mt-1">{error}</p>
                        <button
                            onClick={() => setError(null)}
                            className="mt-2 text-xs text-destructive/60 hover:text-destructive underline"
                        >
                            Dismiss
                        </button>
                    </motion.div>
                )}
            </div>

        </div>
    );
}