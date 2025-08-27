
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { Dashboard } from './components/Dashboard';
import { parseCSV } from './services/csvParser';
import { workerString } from './workers/analysis.worker';
import type { MegaAnalysisBundle, AnalysisState, WorkerMessage } from './types';

const App: React.FC = () => {
    const [analysisState, setAnalysisState] = useState<AnalysisState>({ status: 'idle' });
    const [fileName, setFileName] = useState<string>('');
    const workerRef = useRef<Worker | null>(null);
    const workerUrlRef = useRef<string | null>(null);

    const cleanupWorker = useCallback(() => {
        if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
        }
        if (workerUrlRef.current) {
            URL.revokeObjectURL(workerUrlRef.current);
            workerUrlRef.current = null;
        }
    }, []);

    useEffect(() => {
        // This effect will run when the component unmounts, ensuring the worker is terminated.
        return () => {
            cleanupWorker();
        };
    }, [cleanupWorker]);

    const handleFileUpload = useCallback(async (file: File) => {
        cleanupWorker(); // Terminate any existing worker and revoke its URL

        setAnalysisState({ status: 'loading', progress: { stage: 'Initializing...', percentage: 0 } });
        setFileName(file.name);

        try {
            const text = await file.text();
            if (!text) throw new Error("File is empty or could not be read.");

            const updateParsingProgress = (p: number) => {
                const percentage = p * 5; // Parsing is a small part of the total
                const stage = `Parsing CSV... ${Math.round(p * 100)}%`;
                setAnalysisState(s => s.status === 'loading' ? { ...s, progress: { stage, percentage } } : s);
            };

            const { draws, totalRows } = await parseCSV(text, updateParsingProgress);
            if (draws.length === 0) throw new Error("No valid data found in CSV.");
            
            // The Blob worker: robust, self-contained, and path-independent.
            const blob = new Blob([workerString], { type: 'application/javascript' });
            const workerUrl = URL.createObjectURL(blob);
            workerUrlRef.current = workerUrl;
            
            const worker = new Worker(workerUrl);
            workerRef.current = worker;

            worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
                 const { type, payload } = event.data;
                 switch (type) {
                     case 'progress':
                         setAnalysisState({ status: 'loading', progress: { stage: payload.stage, percentage: 5 + payload.percentage * 0.95 } });
                         break;
                     case 'completed':
                         const bundle: MegaAnalysisBundle = payload;
                         // Deserialize dates for all three bundles
                         if (bundle.total.predictedNextDrawDate) {
                            bundle.total.predictedNextDrawDate = new Date(bundle.total.predictedNextDrawDate as any);
                         }
                         if (bundle.tuesday.predictedNextDrawDate) {
                            bundle.tuesday.predictedNextDrawDate = new Date(bundle.tuesday.predictedNextDrawDate as any);
                         }
                         if (bundle.friday.predictedNextDrawDate) {
                            bundle.friday.predictedNextDrawDate = new Date(bundle.friday.predictedNextDrawDate as any);
                         }
                         setAnalysisState({ status: 'completed', data: bundle });
                         cleanupWorker();
                         break;
                     case 'error':
                         setAnalysisState({ status: 'error', message: payload.message });
                         cleanupWorker();
                         break;
                 }
            };

            worker.onerror = (e) => {
                console.error("Worker error:", e);
                setAnalysisState({ status: 'error', message: `Worker error: ${e.message}` });
                cleanupWorker();
            };

            worker.postMessage({ draws, totalRowsInFile: totalRows });

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during setup.';
            setAnalysisState({ status: 'error', message: errorMessage });
            cleanupWorker();
        }
    }, [cleanupWorker]);

    const handleReset = useCallback(() => {
        cleanupWorker();
        setAnalysisState({ status: 'idle' });
        setFileName('');
    }, [cleanupWorker]);

    const showDashboard = analysisState.status !== 'idle';
    const isLoadingForFileUpload = analysisState.status === 'loading';
    const errorForFileUpload = analysisState.status === 'error' ? analysisState.message : null;
    const progressForFileUpload = analysisState.status === 'loading' 
        ? analysisState.progress 
        : { stage: 'Initializing...', percentage: 0 };

    return (
        <div className="min-h-screen bg-brand-bg font-sans">
            <Header />
            <main className="container mx-auto px-4 py-8 md:px-8 md:py-12">
                {showDashboard ? (
                    <Dashboard
                        analysisState={analysisState}
                        fileName={fileName}
                        onReset={handleReset}
                    />
                ) : (
                    <FileUpload onFileUpload={handleFileUpload} isLoading={isLoadingForFileUpload} error={errorForFileUpload} progress={progressForFileUpload} />
                )}
            </main>
        </div>
    );
};

export default App;