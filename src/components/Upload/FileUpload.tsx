import { useState, useRef } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { UploadCloud } from 'lucide-react';
import styles from './FileUpload.module.css'; // Import the CSS we just created

interface FileUploadProps {
    onFileSelect: (file: File) => void;
}

export function FileUpload({ onFileSelect }: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Drag handlers
    const onDragEnter = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const onDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragging) setIsDragging(true);
    };

    const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const onDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            // Basic validation for .csv
            if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
                onFileSelect(file);
            } else {
                alert('Please upload a valid CSV file.');
            }
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            onFileSelect(e.target.files[0]);
        }
    };

    const handleContainerClick = () => {
        inputRef.current?.click();
    };

    return (
        <div
            className={`${styles.container} ${isDragging ? styles.dragging : ''}`}
            onDragEnter={onDragEnter}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={handleContainerClick}
        >
            <input
                ref={inputRef}
                type="file"
                accept=".csv"
                className={styles.hiddenInput} // Ensure this class is actually hiding the input
                onChange={handleChange}
                style={{ display: 'none' }} // Inline style backup
            />
            <UploadCloud className={styles.icon} />
            <p className={styles.text}>Click or drag file here to upload</p>
            <p className={styles.subtext}>Supports CSV files</p>
        </div>
    );
}
