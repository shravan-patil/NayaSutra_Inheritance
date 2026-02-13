import { X, Download, ExternalLink, FileText, Image, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Evidence {
  id: string;
  case_id: string;
  cid: string;
  file_name: string;
  category: string;
  uploaded_by: string;
  created_at: string;
}

interface EvidenceViewerProps {
  evidence: Evidence | null;
  isOpen: boolean;
  onClose: () => void;
}

const getFileIcon = (category: string) => {
  switch (category?.toLowerCase()) {
    case 'image':
    case 'jpg':
    case 'jpeg':
    case 'png':
      return <Image className="w-5 h-5 text-blue-400" />;
    case 'document':
    case 'pdf':
    case 'doc':
    case 'docx':
      return <FileText className="w-5 h-5 text-purple-400" />;
    default:
      return <File className="w-5 h-5 text-slate-400" />;
  }
};

const getFileTypeLabel = (category: string) => {
  return category?.toUpperCase() || 'FILE';
};

export const EvidenceViewer = ({ evidence, isOpen, onClose }: EvidenceViewerProps) => {
  if (!isOpen || !evidence) return null;

  const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${evidence.cid}`;
  const isImage = ['image', 'jpg', 'jpeg', 'png'].includes(evidence.category?.toLowerCase());
  const isPDF = evidence.category?.toLowerCase() === 'pdf' || evidence.file_name?.toLowerCase().endsWith('.pdf');

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
      <div className="w-full max-w-6xl h-[90vh] bg-gradient-to-br from-slate-900/98 to-slate-800/98 backdrop-blur-xl border border-white/10 shadow-2xl rounded-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
              {getFileIcon(evidence.category)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white truncate max-w-md">
                {evidence.file_name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Badge variant="outline" className="border-blue-500/50 text-blue-400 text-xs">
                  {getFileTypeLabel(evidence.category)}
                </Badge>
                <span>•</span>
                <span>CID: {evidence.cid.slice(0, 16)}...{evidence.cid.slice(-8)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={ipfsUrl}
              download={evidence.file_name}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
            <a
              href={ipfsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open in New Tab
            </a>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="ml-2 text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-slate-950/50">
          {isImage ? (
            <div className="w-full h-full flex items-center justify-center p-4">
              <img
                src={ipfsUrl}
                alt={evidence.file_name}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          ) : isPDF ? (
            <iframe
              src={ipfsUrl}
              className="w-full h-full"
              title={evidence.file_name}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-8">
              <div className="w-20 h-20 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
                {getFileIcon(evidence.category)}
              </div>
              <p className="text-lg font-medium text-white mb-2">{evidence.file_name}</p>
              <p className="text-sm text-slate-400 mb-6 text-center max-w-md">
                This file type cannot be previewed directly. Please download or open in a new tab to view.
              </p>
              <div className="flex items-center gap-3">
                <a
                  href={ipfsUrl}
                  download={evidence.file_name}
                  className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Download File
                </a>
                <a
                  href={ipfsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <ExternalLink className="w-5 h-5" />
                  Open in New Tab
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-6 py-3 bg-slate-900/50 flex items-center justify-between text-sm text-slate-400">
          <div className="flex items-center gap-4">
            <span>Uploaded: {new Date(evidence.created_at).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Evidence ID:</span>
            <code className="text-xs bg-slate-800 px-2 py-1 rounded">{evidence.id}</code>
          </div>
        </div>
      </div>
    </div>
  );
};
