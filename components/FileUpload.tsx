
import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface FileUploadProps {
    onFileUpload: (file: File) => void;
    isLoading: boolean;
    error: string | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, isLoading, error }) => {
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement | HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onFileUpload(e.dataTransfer.files[0]);
        }
    }, [onFileUpload]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            onFileUpload(e.target.files[0]);
        }
    };

    return (
        <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-brand-text-primary mb-4">Upload Your Dataset</h2>
            <p className="text-lg text-brand-text-secondary mb-8">
                Upload a CSV file with historical lottery data to generate a statistical analysis.
                The expected format is `DrawDate,Main1,Main2,Main3,Main4,Main5,Star1,Star2`.
            </p>

            <div 
                className="relative flex flex-col items-center justify-center w-full"
                onDragEnter={handleDrag} 
                onDragOver={handleDrag} 
                onDragLeave={handleDrag} 
                onDrop={handleDrop}
            >
                <label 
                    htmlFor="dropzone-file" 
                    className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors
                    ${dragActive ? 'border-brand-primary bg-brand-surface' : 'border-brand-border bg-brand-bg hover:bg-brand-surface hover:border-brand-text-secondary'}`}
                >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadIcon className="w-10 h-10 mb-3 text-brand-text-secondary" />
                        <p className="mb-2 text-sm text-brand-text-secondary">
                            <span className="font-semibold text-brand-primary">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-brand-text-secondary">CSV files only</p>
                    </div>
                    <input id="dropzone-file" type="file" accept=".csv" className="hidden" onChange={handleChange} disabled={isLoading} />
                </label>

                {isLoading && (
                    <div className="mt-6 flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-brand-text-primary">Processing dataset...</span>
                    </div>
                )}

                {error && (
                    <div className="mt-6 p-4 w-full bg-red-900/20 border border-red-500/50 text-red-300 rounded-lg text-left">
                        <p className="font-semibold">Analysis Failed</p>
                        <p className="text-sm">{error}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
