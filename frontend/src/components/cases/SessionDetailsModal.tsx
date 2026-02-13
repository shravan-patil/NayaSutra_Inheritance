// src/components/cases/SessionDetailsModal.tsx

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileText,
  Gavel,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  ExternalLink,
  File,
  Shield,
  PenTool,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EvidenceViewer } from "@/components/evidence/EvidenceViewer";
import { resolveIpfsUrl } from "@/utils/storage/ipfsUploadUtils";
import {
  fetchFinalizationData,
  SessionFinalizationData,
  PartySignature,
} from "@/services/sessionFinalizationService";

interface SessionDetailsModalProps {
  session: {
    id: string;
    started_at: string;
    ended_at: string | null;
    status: string;
    finalization_cid: string | null;
    transcript_cid: string | null;
    judge_verdict_cid: string | null;
    notes: string | null;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  caseNumber?: string;
}

interface EvidenceItem {
  cid: string;
  file_name: string;
  category: string;
  uploaded_by: string;
  uploaded_at: string;
}

export const SessionDetailsModal = ({
  session,
  isOpen,
  onClose,
  caseNumber,
}: SessionDetailsModalProps) => {
  const [finalizationData, setFinalizationData] = useState<SessionFinalizationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    const loadFinalizationData = async () => {
      if (!session?.finalization_cid) {
        setFinalizationData(null);
        return;
      }

      setIsLoading(true);
      try {
        const data = await fetchFinalizationData(session.finalization_cid);
        setFinalizationData(data);
      } catch (error) {
        console.error("Error loading finalization data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && session) {
      loadFinalizationData();
    }
  }, [isOpen, session?.finalization_cid]);

  const handleViewEvidence = (item: EvidenceItem) => {
    setSelectedEvidence(item);
    setIsViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
    setSelectedEvidence(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ended":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "paused":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "active":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ended":
        return <CheckCircle className="w-4 h-4" />;
      case "paused":
        return <AlertCircle className="w-4 h-4" />;
      case "active":
        return <Clock className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const renderSignatureCard = (signature: PartySignature | null, title: string) => {
    if (!signature) {
      return (
        <div className="p-4 border border-white/10 rounded-lg bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">{title}</p>
              <p className="text-xs text-slate-500">Not signed</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-4 border border-white/10 rounded-lg bg-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600/30 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{signature.userName}</p>
              <p className="text-xs text-slate-400">{signature.role}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Signed
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {formatDate(signature.signedAt)} at {formatTime(signature.signedAt)}
            </p>
          </div>
        </div>
        <div className="mt-3 p-2 bg-slate-900/50 rounded border border-white/5">
          <p className="text-xs text-slate-500 mb-1">Signature Hash</p>
          <code className="text-xs font-mono text-slate-400 break-all">
            {signature.signature.slice(0, 20)}...{signature.signature.slice(-20)}
          </code>
        </div>
      </div>
    );
  };

  if (!isOpen || !session) return null;

  // Use finalization data if available, otherwise fall back to session data
  const verdictCid = finalizationData?.judge_verdict_cid || session.judge_verdict_cid;
  const transcriptCid = finalizationData?.session_transcript_cid || session.transcript_cid;
  const evidenceList = finalizationData?.evidence_finalized || [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-5xl max-h-[95vh] bg-gradient-to-br from-slate-900/98 to-slate-800/98 backdrop-blur-xl border border-white/10 shadow-2xl rounded-xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <CardHeader className="border-b border-white/10 flex-shrink-0 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getStatusColor(session.status)}`}>
                  {getStatusIcon(session.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-xl text-white truncate">
                    Session Details
                  </CardTitle>
                  <CardDescription className="text-slate-400 truncate">
                    {caseNumber && `Case: ${caseNumber}`}
                    {` • Session ID: ${session.id.slice(0, 8)}...${session.id.slice(-8)}`}
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-slate-400 hover:text-white hover:bg-white/10 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          {/* Content */}
          <CardContent className="flex-1 overflow-hidden p-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                <span className="ml-3 text-slate-400">Loading session data...</span>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-5 bg-white/5 border border-white/10 mx-6 mt-4 mb-2">
                  <TabsTrigger
                    value="details"
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300 text-xs px-2 py-2"
                  >
                    Session Details
                  </TabsTrigger>
                  <TabsTrigger
                    value="verdict"
                    className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-300 text-xs px-2 py-2"
                  >
                    Judge&apos;s Verdict
                  </TabsTrigger>
                  <TabsTrigger
                    value="evidence"
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300 text-xs px-2 py-2"
                  >
                    Evidence
                  </TabsTrigger>
                  <TabsTrigger
                    value="transcript"
                    className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-slate-300 text-xs px-2 py-2"
                  >
                    Transcript
                  </TabsTrigger>
                  <TabsTrigger
                    value="signatures"
                    className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-300 text-xs px-2 py-2"
                  >
                    Signatures
                  </TabsTrigger>
                </TabsList>

                {/* Session Details Tab */}
                <TabsContent value="details" className="flex-1 overflow-y-auto px-6 py-4 mt-0">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-sm text-slate-400">Session ID</h4>
                        <p className="text-sm text-slate-200 font-mono">{session.id}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-slate-400">Status</h4>
                        <Badge className={getStatusColor(session.status)}>
                          {session.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-slate-400">Started At</h4>
                        <p className="text-sm text-slate-200">
                          {formatDate(session.started_at)} at {formatTime(session.started_at)}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-slate-400">Ended At</h4>
                        <p className="text-sm text-slate-200">
                          {session.ended_at
                            ? `${formatDate(session.ended_at)} at ${formatTime(session.ended_at)}`
                            : "N/A"}
                        </p>
                      </div>
                    </div>

                    {session.notes && (
                      <div>
                        <h4 className="font-semibold text-sm text-slate-400 mb-2">Session Notes</h4>
                        <p className="text-sm text-slate-300 bg-white/5 p-3 rounded-lg border border-white/10">
                          {session.notes}
                        </p>
                      </div>
                    )}

                    {finalizationData && (
                      <div>
                        <h4 className="font-semibold text-sm text-slate-400 mb-2">
                          Finalization Details
                        </h4>
                        <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4">
                          <div className="flex items-center gap-2 text-emerald-400 mb-2">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Session Finalized</span>
                          </div>
                          <p className="text-xs text-slate-400">
                            Finalized on {formatDate(finalizationData.finalized_at)} at{" "}
                            {formatTime(finalizationData.finalized_at)}
                          </p>
                          {session.finalization_cid && (
                            <div className="mt-2 p-2 bg-slate-900/50 rounded">
                              <p className="text-xs text-slate-500 mb-1">Finalization CID</p>
                              <code className="text-xs font-mono text-emerald-400">
                                {session.finalization_cid.slice(0, 20)}...
                                {session.finalization_cid.slice(-8)}
                              </code>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Verdict Tab */}
                <TabsContent value="verdict" className="flex-1 overflow-y-auto px-6 py-4 mt-0">
                  <div className="space-y-4">
                    {verdictCid ? (
                      <div className="space-y-4">
                        <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-purple-600/30 flex items-center justify-center">
                                <Gavel className="w-5 h-5 text-purple-400" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">
                                  Judge&apos;s Verdict Document
                                </p>
                                <p className="text-xs text-slate-400">
                                  CID: {verdictCid.slice(0, 20)}...{verdictCid.slice(-8)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <a
                                href={resolveIpfsUrl(verdictCid)}
                                download
                                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
                              >
                                <Download className="w-4 h-4" />
                                Download
                              </a>
                              <a
                                href={resolveIpfsUrl(verdictCid)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
                              >
                                <ExternalLink className="w-4 h-4" />
                                Open in New Tab
                              </a>
                            </div>
                          </div>
                        </div>

                        <div className="border border-white/10 rounded-lg overflow-hidden bg-white/5 h-96">
                          <div className="px-4 py-2 bg-white/5 border-b border-white/10 flex items-center justify-between">
                            <span className="text-sm text-slate-300">Document Preview</span>
                            <span className="text-xs text-slate-500">PDF Viewer</span>
                          </div>
                          <iframe
                            src={resolveIpfsUrl(verdictCid)}
                            className="w-full h-[calc(100%-40px)]"
                            title="Judge's Verdict"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-500">
                        <Gavel className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-lg font-medium">Verdict not available</p>
                        <p className="text-sm mt-1">
                          The judge&apos;s verdict document has not been uploaded for this session.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Evidence Tab */}
                <TabsContent value="evidence" className="flex-1 overflow-y-auto px-6 py-4 mt-0">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-4 border-b border-white/10">
                      <Shield className="w-5 h-5 text-blue-400" />
                      <h3 className="text-lg font-semibold text-white">
                        Evidence Submitted ({evidenceList.length})
                      </h3>
                    </div>

                    {evidenceList.length > 0 ? (
                      <div className="grid gap-3">
                        {evidenceList.map((item, index) => (
                          <div
                            key={index}
                            onClick={() => handleViewEvidence(item)}
                            className="border border-white/10 rounded-lg p-4 bg-white/5 hover:bg-white/10 cursor-pointer transition-colors group"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center group-hover:bg-blue-600/30 transition-colors">
                                  <File className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-sm text-white truncate max-w-xs">
                                    {item.file_name}
                                  </h4>
                                  <p className="text-xs text-slate-400">
                                    CID: {item.cid.slice(0, 16)}...{item.cid.slice(-8)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="border-blue-500/50 text-blue-400 text-xs"
                                >
                                  {item.category?.toUpperCase() || "FILE"}
                                </Badge>
                                <span className="text-xs text-slate-500">
                                  {formatDate(item.uploaded_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-lg font-medium">No evidence submitted</p>
                        <p className="text-sm mt-1">
                          No evidence has been recorded for this session.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Transcript Tab */}
                <TabsContent value="transcript" className="flex-1 overflow-y-auto px-6 py-4 mt-0">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-4 border-b border-white/10">
                      <FileText className="w-5 h-5 text-green-400" />
                      <h3 className="text-lg font-semibold text-white">Session Transcript</h3>
                    </div>

                    {transcriptCid ? (
                      <div className="space-y-4">
                        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-green-600/30 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-green-400" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">Session Transcript</p>
                                <p className="text-xs text-slate-400">
                                  CID: {transcriptCid.slice(0, 20)}...{transcriptCid.slice(-8)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <a
                                href={resolveIpfsUrl(transcriptCid)}
                                download
                                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
                              >
                                <Download className="w-4 h-4" />
                                Download
                              </a>
                              <a
                                href={resolveIpfsUrl(transcriptCid)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                              >
                                <ExternalLink className="w-4 h-4" />
                                View Full
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-lg font-medium">Transcript not available</p>
                        <p className="text-sm mt-1">
                          The session transcript has not been uploaded yet.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Signatures Tab */}
                <TabsContent value="signatures" className="flex-1 overflow-y-auto px-6 py-4 mt-0">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <PenTool className="w-5 h-5 text-emerald-400" />
                        <h3 className="text-lg font-semibold text-white">Party Signatures</h3>
                      </div>
                      {finalizationData && (
                        <Badge className="bg-emerald-600 text-white">
                          All Parties Signed
                        </Badge>
                      )}
                    </div>

                    {finalizationData ? (
                      <div className="grid gap-3">
                        {renderSignatureCard(
                          finalizationData.judge_signature,
                          "Judge Signature"
                        )}
                        {renderSignatureCard(
                          finalizationData.clerk_signature,
                          "Clerk Signature"
                        )}
                        {renderSignatureCard(
                          finalizationData.lawyer_prosecution_signature,
                          "Prosecution Lawyer Signature"
                        )}
                        {renderSignatureCard(
                          finalizationData.lawyer_defendant_signature,
                          "Defense Lawyer Signature"
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-500">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-lg font-medium">No signature data available</p>
                        <p className="text-sm mt-1">
                          Signature information is only available for finalized sessions.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>

          {/* Footer */}
          <div className="border-t border-white/10 px-6 py-4 flex-shrink-0">
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-white/20 text-slate-300 hover:bg-white/10 hover:text-white"
              >
                Close
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Evidence Viewer Modal */}
        <EvidenceViewer
          evidence={
            selectedEvidence
              ? {
                  id: selectedEvidence.cid,
                  case_id: "",
                  cid: selectedEvidence.cid,
                  file_name: selectedEvidence.file_name,
                  category: selectedEvidence.category,
                  uploaded_by: selectedEvidence.uploaded_by,
                  created_at: selectedEvidence.uploaded_at,
                }
              : null
          }
          isOpen={isViewerOpen}
          onClose={handleCloseViewer}
        />
      </div>
    </AnimatePresence>
  );
};
