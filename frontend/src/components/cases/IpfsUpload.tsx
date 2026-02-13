import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client'; 
import { 
  uploadToPinata, 
  validateFile, 
  getEvidenceType 
} from '../../utils/storage/ipfsUploadUtils';
import { EvidenceUploadType } from '@/services/caseEvidenceService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Loader2, Check, AlertCircle, Shield } from 'lucide-react';

interface IpfsUploadProps {
  caseId?: string | null;
  userProfileId: string;
  evidenceType?: EvidenceUploadType;
  onUploadSuccess?: (cid: string, fileName: string) => void;
  triggerUpload?: boolean;
}

export const IpfsUpload = ({ 
  caseId, 
  userProfileId, 
  evidenceType = 'general_evidence',
  onUploadSuccess,
  triggerUpload
}: IpfsUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cid, setCid] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSelectedFile(file);
    setError(null);
    setSuccessMsg(null);
    setCid(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      validateFile(selectedFile);

      const ipfsResult = await uploadToPinata(selectedFile, caseId as string);
      setCid(ipfsResult.cid);

      const category = getEvidenceType(selectedFile);

      if (caseId) {
        const { error: dbError } = await supabase
          .from('case_evidence')
          .insert({
            case_id: caseId,
            cid: ipfsResult.cid,
            file_name: ipfsResult.fileName,
            category: category,
            uploaded_by: userProfileId
          });

        if (dbError) throw dbError;
      }

      setSuccessMsg('File uploaded successfully');
      if (onUploadSuccess) onUploadSuccess(ipfsResult.cid, ipfsResult.fileName);
      
      setSelectedFile(null);

    } catch (err: any) {
      console.error("Upload failed:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (triggerUpload && selectedFile) {
      handleUpload();
    }
  }, [triggerUpload, selectedFile]);

  const getEvidenceTypeLabel = (type: EvidenceUploadType): string => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">
            Upload {getEvidenceTypeLabel(evidenceType)}
          </h3>
          <p className="text-slate-400 text-sm">
            Securely store evidence on IPFS
          </p>
        </div>
      </div>
      
      <div className="space-y-4">
        {/* File Input */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-300">Select File</span>
          </div>
          <input 
            type="file" 
            onChange={handleFileChange}
            disabled={uploading}
            className="flex-1 h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-white text-sm 
              file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium 
              file:bg-blue-600 file:text-white hover:file:bg-blue-700
              disabled:opacity-50 disabled:cursor-not-allowed w-full"
          />
        </div>

        {/* Selected File Info */}
        {selectedFile && !uploading && !successMsg && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <FileText className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-slate-300 truncate flex-1">
              {selectedFile.name}
            </span>
            <span className="text-xs text-slate-500">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
        )}

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={uploading || !selectedFile}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading to IPFS...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload to IPFS
            </>
          )}
        </Button>
        
        {/* Loading State */}
        {uploading && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            <span>Uploading to IPFS... Please wait.</span>
          </div>
        )}
        
        {/* Error State */}
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
        
        {/* Success State */}
        {successMsg && cid && (
          <div className="space-y-3">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Check className="w-4 h-4 text-emerald-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-emerald-400 font-medium">{successMsg}</p>
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-slate-500 mb-1">IPFS CID</p>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono text-indigo-400 truncate flex-1">
                  {cid}
                </code>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                  <Check className="w-3 h-3 mr-1" /> Stored
                </Badge>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};