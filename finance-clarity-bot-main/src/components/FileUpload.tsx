import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isUploading?: boolean;
}

const FileUpload = ({ onFileUpload, isUploading = false }: FileUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.includes('spreadsheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.csv')) {
        setUploadedFile(file);
        onFileUpload(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setUploadedFile(file);
      onFileUpload(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="p-8 bg-gradient-card shadow-card border-2 border-dashed border-border hover:border-primary/50 transition-all duration-300">
      <div
        className={`text-center transition-all duration-300 ${
          isDragOver ? 'scale-105' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.csv"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="mb-6">
          {uploadedFile ? (
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-success animate-pulse" />
            </div>
          ) : (
            <div className="flex items-center justify-center mb-4">
              {isUploading ? (
                <div className="animate-spin">
                  <FileSpreadsheet className="h-16 w-16 text-primary" />
                </div>
              ) : (
                <Upload className="h-16 w-16 text-muted-foreground" />
              )}
            </div>
          )}
        </div>

        <h3 className="text-xl font-semibold mb-2">
          {uploadedFile ? 'Arquivo Carregado!' : 'Envie sua Planilha'}
        </h3>
        
        <p className="text-muted-foreground mb-6">
          {uploadedFile 
            ? `${uploadedFile.name} (${(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)`
            : 'Arraste e solte seu arquivo Excel ou CSV aqui, ou clique para selecionar'
          }
        </p>

        <div className="space-y-2">
          <Button 
            onClick={handleUploadClick}
            variant={uploadedFile ? "secondary" : "default"}
            size="lg"
            className="w-full sm:w-auto bg-gradient-primary hover:shadow-glow"
            disabled={isUploading}
          >
            {isUploading ? 'Processando...' : uploadedFile ? 'Escolher Outro Arquivo' : 'Selecionar Arquivo'}
          </Button>
          
          <p className="text-sm text-muted-foreground">
            Suporte para arquivos .xlsx e .csv
          </p>
        </div>
      </div>
    </Card>
  );
};

export default FileUpload;