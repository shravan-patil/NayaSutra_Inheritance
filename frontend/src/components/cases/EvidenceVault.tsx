import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from '@/integrations/supabase/client'; // Make sure this path is correct
import {
  FileText,
  Video,
  Image as ImageIcon,
  Music,
  File,
  Shield,
  Lock,
  Play,
  History,
  Clock,
   Presentation,
  PenTool,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";


// --- Types ---
// This matches your Supabase 'Staging_Evidence' table structure
interface StagingEvidenceItem {
  id: string;
  case_id: string;
  file_url: string;
  file_type: 'DOCUMENT' | 'AUDIO' | 'VIDEO' | 'IMAGE' | 'OTHER';
  evidence_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  uploader_uuid: string;
  upload_timestamp: string; // Database timestamp
  // Optional fields if you add them later:
  title?: string;
  file_size?: number;
}

interface EvidenceVaultProps {
  caseId: string;
  currentUserId: string;
  onPreview?: (evidence: any) => void; // Made optional for now
} 

// --- Helpers ---
const getFileIcon = (fileType: string) => {
  if (!fileType) return File;
  const type = fileType.toUpperCase();
  if (type === "DOCUMENT") return FileText;
  if (type === "VIDEO") return Video;
  if (type === "IMAGE") return ImageIcon;
  if (type === "AUDIO") return Music;
  return File;
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case "APPROVED":
      return {
        label: "Sealed",
        icon: Lock,
        className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      };
    case "PENDING":
      return {
        label: "Pending Review",
        icon: Clock,
        className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      };
    case "REJECTED":
      return {
        label: "Rejected",
        icon: File,
        className: "bg-destructive/10 text-destructive border-destructive/20",
      };
    default:
      return {
        label: "Draft",
        icon: FileText,
        className: "bg-muted/50 text-muted-foreground border-muted",
      };
  }
};

export const EvidenceVault = ({
  caseId,
  currentUserId,
  onPreview,
}: EvidenceVaultProps) => {
  const [evidenceList, setEvidenceList] = useState<StagingEvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);

  // History Modal State
  const [historyModal, setHistoryModal] = useState<{ isOpen: boolean; evidenceId: string; title: string }>({
    isOpen: false,
    evidenceId: "",
    title: "",
  });

  // --- Fetch Data from Supabase ---
  useEffect(() => {
    const fetchMyEvidence = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('staging_evidence' as any) // 'as any' bypasses the DB typings for now
          .select('*')
          .eq('case_id', caseId)
          .eq('uploader_uuid', currentUserId) // Filter: Show ONLY my uploads
          .order('upload_timestamp', { ascending: false });

        if (error) throw error;
        setEvidenceList((data || []) as unknown as StagingEvidenceItem[]);
      } catch (err) {
        console.error("Error fetching vault:", err);
      } finally {
        setLoading(false);
      }
    };

    if (caseId && currentUserId) {
      fetchMyEvidence();
    }
  }, [caseId, currentUserId]);

  // --- Filtering ---
  const approvedEvidence = evidenceList.filter((e) => e.evidence_status === "APPROVED");
  const pendingEvidence = evidenceList.filter((e) => e.evidence_status === "PENDING");

  // --- Render Single Card ---
  const renderEvidenceCard = (ev: StagingEvidenceItem, index: number) => {
    const FileIcon = getFileIcon(ev.file_type);
    const status = getStatusConfig(ev.evidence_status);
    const StatusIcon = status.icon;
    const isSealed = ev.evidence_status === "APPROVED";
    const isPending = ev.evidence_status === "PENDING";
    const isVideo = ev.file_type === "VIDEO";
    const isImage = ev.file_type === "IMAGE";
    const isAudio = ev.file_type === "AUDIO";

    // Use a truncated ID as the title since we don't have a title column yet
    const displayTitle = ev.title || `Evidence #${ev.id.slice(0, 8)}`;

    return (
      <motion.div
        key={ev.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className={cn(
          "glass-card overflow-hidden border-2 transition-all bg-white shadow-sm rounded-xl",
          isSealed
            ? "border-emerald-500/30 shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]"
            : isPending
            ? "border-amber-500/30 border-dashed"
            : "border-gray-100"
        )}
      >
        {/* Preview Area */}
        <div
          onClick={() => onPreview && onPreview(ev)}
          className="relative aspect-video bg-gray-100 cursor-pointer group overflow-hidden"
        >
          {/* Media preview */}
          {(isImage || isVideo) && ev.file_url ? (
            <img
              src={isImage ? ev.file_url : "https://via.placeholder.com/300?text=Video+Preview"} // Placeholder for video thumb if not generated
              alt="Evidence Preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="p-4 rounded-full bg-white shadow-sm">
                <FileIcon className="w-8 h-8 text-gray-400" />
              </div>
            </div>
          )}

          {/* Video play overlay */}
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="p-3 rounded-full bg-white/90 shadow-lg">
                <Play className="w-6 h-6 text-black fill-current" />
              </div>
            </div>
          )}

          {/* Audio indicator */}
          {isAudio && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="p-4 rounded-full bg-blue-50">
                <Music className="w-8 h-8 text-blue-500" />
              </div>
            </div>
          )}

          {/* Status badge */}
          <div className="absolute top-2 right-2">
            <Badge variant="outline" className={cn("text-xs bg-white/90 backdrop-blur-sm", status.className)}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {status.label}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <h4 className="font-medium text-sm truncate text-gray-800" title={displayTitle}>
            {displayTitle}
          </h4>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {/* We don't have file_size in DB yet, so we hide or placeholder */}
            <span>ID: {ev.id.slice(0,6)}...</span> 
            <span>
              {new Date(ev.upload_timestamp).toLocaleDateString()}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHistoryModal({ isOpen: true, evidenceId: ev.id, title: displayTitle })}
              className="flex-1 text-xs h-8"
            >
              <History className="w-3.5 h-3.5 mr-1" />
              History
            </Button>
            
            <a 
              href={ev.file_url} 
              target="_blank" 
              rel="noreferrer" 
              className="flex-1"
            >
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs h-8 border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                <FileText className="w-3.5 h-3.5 mr-1" />
                View
              </Button>
            </a>
          </div>
        </div>
      </motion.div>
    );
  };

  // --- Loading State ---
  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2"/>
            <p className="text-sm text-gray-400">Loading your evidence vault...</p>
        </div>
    );
  }

  return (
    <div className="space-y-8 mt-8">
        {/* Header */}
        <div>
            <h2 className="text-xl font-bold text-gray-800">Evidence Vault</h2>
            <p className="text-sm text-gray-500">Secure storage for your staged uploads.</p>
        </div>

      {/* Sealed Evidence Section */}
      {approvedEvidence.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Shield className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Sealed Evidence</h3>
              <p className="text-xs text-muted-foreground">
                {approvedEvidence.length} item(s) with judicial finality
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {approvedEvidence.map((ev, index) => renderEvidenceCard(ev, index))}
          </div>
        </div>
      )}

      {/* Pending Evidence Section */}
      {pendingEvidence.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Pending Review</h3>
              <p className="text-xs text-muted-foreground">
                {pendingEvidence.length} item(s) awaiting judicial seal
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingEvidence.map((ev, index) => renderEvidenceCard(ev, index))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {evidenceList.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
          <Shield className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Vault is Empty</h3>
          <p className="text-gray-500 max-w-sm mx-auto mt-1">
            You haven't uploaded any evidence for this case yet. Use the uploader above to add files.
          </p>
        </div>
      )}

      {/* History Modal (simple placeholder until ChainOfCustodyModal is implemented) */}
      {historyModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="font-semibold text-lg mb-2">{historyModal.title}</h3>
            <p className="text-sm text-muted-foreground">Detailed history for evidence <span className="font-mono">{historyModal.evidenceId}</span> is not implemented yet.</p>
            <div className="mt-4 text-right">
              <Button onClick={() => setHistoryModal({ isOpen: false, evidenceId: '', title: '' })}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};