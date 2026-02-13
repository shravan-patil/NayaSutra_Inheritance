import { X, FileText, Gavel, Users, CheckCircle, Clock, AlertCircle, PenTool, Download, ExternalLink, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWeb3 } from "@/contexts/Web3Context";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { EvidenceViewer } from "@/components/evidence/EvidenceViewer";

interface Evidence {
  id: string;
  case_id: string;
  cid: string;
  file_name: string;
  category: string;
  uploaded_by: string;
  created_at: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  session_id?: string;
  case_id?: string;
  confirmed_at?: string | null;
  confirmed_by?: string | null;
  requires_confirmation?: boolean;
  user_id: string;
  type?: string;
  metadata?: any;
  signature?: string | null;
}

interface NotificationDetailModalProps {
  notification: Notification | null;
  isOpen: boolean;
  onClose: () => void;
  onSign: (notification: Notification) => Promise<void>;
  onCloseSession?: (notification: Notification) => Promise<void>;
  onScheduleSession?: (notification: Notification) => Promise<void>;
  onEndCase?: (notification: Notification) => Promise<void>;
  isSigning: boolean;
  isClosingSession?: boolean;
  isSchedulingSession?: boolean;
  isEndingCase?: boolean;
  sessionStatus?: 'pending' | 'in_progress' | 'final_submission' | 'closed';
  signingStatus?: Array<{
    userId: string;
    userName: string;
    role: string;
    signed: boolean;
    signedAt?: string;
  }>;
  isJudge?: boolean; // New prop to identify if this is for judge
  allPartiesSigned?: boolean; // New prop to track if all parties have signed
}

export const NotificationDetailModal = ({
  notification,
  isOpen,
  onClose,
  onSign,
  onCloseSession,
  onScheduleSession,
  onEndCase,
  isSigning,
  isClosingSession = false,
  isSchedulingSession = false,
  isEndingCase = false,
  sessionStatus = 'pending',
  signingStatus = [],
  isJudge = false,
  allPartiesSigned = false
}: NotificationDetailModalProps) => {
  const { isConnected } = useWeb3();
  const [sessionDocs, setSessionDocs] = useState<{ transcript_cid: string | null; judge_verdict_cid: string | null } | null>(null);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [isLoadingEvidence, setIsLoadingEvidence] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Fetch session documents from session_logs
  useEffect(() => {
    const fetchSessionDocs = async () => {
      if (!notification?.session_id) {
        setSessionDocs(null);
        return;
      }

      setIsLoadingDocs(true);
      try {
        const { data, error } = await supabase
          .from('session_logs')
          .select('transcript_cid, judge_verdict_cid')
          .eq('id', notification.session_id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching session docs:', error);
          return;
        }

        setSessionDocs(data);
      } catch (err) {
        console.error('Error fetching session documents:', err);
      } finally {
        setIsLoadingDocs(false);
      }
    };

    fetchSessionDocs();
  }, [notification?.session_id]);

  // Fetch evidence from case_evidence table
  useEffect(() => {
    const fetchEvidence = async () => {
      if (!notification?.case_id || !notification?.session_id) {
        setEvidence([]);
        return;
      }

      setIsLoadingEvidence(true);
      try {
        // First, fetch the actual session start date from session_logs
        const { data: sessionData, error: sessionError } = await supabase
          .from('session_logs')
          .select('started_at')
          .eq('id', notification.session_id)
          .maybeSingle();

        if (sessionError) {
          console.error('Error fetching session data:', sessionError);
        }

        // Use the actual session start time, or fall back to metadata/notification created_at
        const sessionStartDate = sessionData?.started_at ||
          notification.metadata?.sessionStartDate ||
          notification.metadata?.started_at ||
          notification.created_at;

        const { data, error } = await supabase
          .from('case_evidence')
          .select('*')
          .eq('case_id', notification.case_id)
          .gte('created_at', sessionStartDate)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching evidence:', error);
          return;
        }

        setEvidence(data || []);
      } catch (err) {
        console.error('Error fetching evidence:', err);
      } finally {
        setIsLoadingEvidence(false);
      }
    };

    fetchEvidence();
  }, [notification?.case_id, notification?.session_id]);

  const handleViewEvidence = (item: Evidence) => {
    setSelectedEvidence(item);
    setIsViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
    setSelectedEvidence(null);
  };

  if (!notification || !isOpen) return null;

  const hasSigned = notification.is_read;
  const isCaseClosed = sessionStatus === 'closed';
  const showSignButton = !isCaseClosed && (!notification.is_read || notification.type === 'session_ended');
  const allFourSigned = !isCaseClosed && isJudge && allPartiesSigned && hasSigned;
  const showCloseSessionButton = allFourSigned && !!onCloseSession;
  const showScheduleSessionButton = allFourSigned && !!onScheduleSession;
  const showEndCaseButton = allFourSigned && !!onEndCase;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'final_submission': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <AlertCircle className="w-4 h-4" />;
      case 'final_submission': return <Gavel className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-hidden">
      <div className="w-full max-w-5xl max-h-[95vh] bg-gradient-to-br from-slate-900/98 to-slate-800/98 backdrop-blur-xl border border-white/10 shadow-2xl rounded-xl overflow-hidden flex flex-col">
        <CardHeader className="border-b border-white/10 flex-shrink-0 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${getStatusColor(sessionStatus)}`}>
                {getStatusIcon(sessionStatus)}
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xl text-white truncate">{notification.title}</CardTitle>
                <CardDescription className="text-slate-400 truncate">
                  {notification.metadata?.caseNumber && `Case: ${notification.metadata.caseNumber}`}
                  {notification.metadata?.sessionId && ` • Session: ${notification.metadata.sessionId}`}
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-400 hover:text-white hover:bg-white/10 flex-shrink-0">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0">
          <Tabs defaultValue="details" className="w-full h-full flex flex-col">
            <TabsList className={`grid w-full ${isJudge ? 'grid-cols-5' : 'grid-cols-4'} bg-white/5 border border-white/10 mx-6 mt-4 mb-2`}>
              <TabsTrigger value="details" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300 text-xs px-2 py-2">Session Details</TabsTrigger>
              <TabsTrigger value="verdict" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300 text-xs px-2 py-2">Judge's Verdict</TabsTrigger>
              <TabsTrigger value="proofs" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300 text-xs px-2 py-2">Evidence</TabsTrigger>
              <TabsTrigger value="transcript" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300 text-xs px-2 py-2">Transcript</TabsTrigger>
              {isJudge && (
                <TabsTrigger value="signing-status" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300 text-xs px-2 py-2">
                  Signing Status
                  {!allPartiesSigned && (
                    <span className="ml-2 w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                  )}
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="details" className="flex-1 overflow-y-auto px-6 py-4 mt-0">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-slate-400">Case ID</h4>
                    <p className="text-sm text-slate-200">{notification.metadata?.caseId || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-slate-400">Session ID</h4>
                    <p className="text-sm text-slate-200">{notification.metadata?.sessionId || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-slate-400">Session Date</h4>
                    <p className="text-sm text-slate-200">
                      {notification.created_at ? new Date(notification.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-slate-400">Status</h4>
                    <Badge className={getStatusColor(sessionStatus)}>
                      {sessionStatus.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sm text-slate-400 mb-2">Session Summary</h4>
                  <p className="text-sm text-slate-300">{notification.message}</p>
                </div>

                {notification.metadata?.notes && (
                  <div>
                    <h4 className="font-semibold text-sm text-slate-400 mb-2">Additional Notes</h4>
                    <p className="text-sm text-slate-300">{notification.metadata.notes}</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="verdict" className="flex-1 overflow-y-auto px-6 py-4 mt-0">
              <div className="space-y-4">

                {isLoadingDocs ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <span className="ml-3 text-slate-400">Loading verdict...</span>
                  </div>
                ) : sessionDocs?.judge_verdict_cid ? (
                  <div className="space-y-4">
                    <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-purple-600/30 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-purple-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">Judge's Verdict Document</p>
                            <p className="text-xs text-slate-400">CID: {sessionDocs.judge_verdict_cid.slice(0, 20)}...{sessionDocs.judge_verdict_cid.slice(-8)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={`https://gateway.pinata.cloud/ipfs/${sessionDocs.judge_verdict_cid}`}
                            download
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </a>
                          <a
                            href={`https://gateway.pinata.cloud/ipfs/${sessionDocs.judge_verdict_cid}`}
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

                    {/* Document Viewer - Fixed Height */}
                    <div className="border border-white/10 rounded-lg overflow-hidden bg-white/5 h-96">
                      <div className="px-4 py-2 bg-white/5 border-b border-white/10 flex items-center justify-between">
                        <span className="text-sm te xt-slate-300">Document Preview</span>
                        <span className="text-xs text-slate-500">PDF Viewer</span>
                      </div>
                      <iframe
                        src={`https://gateway.pinata.cloud/ipfs/${sessionDocs.judge_verdict_cid}`}
                        className="w-full h-[calc(100%-40px)]"
                        title="Judge's Verdict"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <Gavel className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium">Verdict not yet available</p>
                    <p className="text-sm mt-1">The judge's verdict document has not been uploaded for this session.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="proofs" className="flex-1 overflow-y-auto px-6 py-4 mt-0">
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-4 border-b border-white/10">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-semibold text-white">Evidence Submitted ({evidence.length})</h3>
                </div>

                {isLoadingEvidence ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="ml-3 text-slate-400">Loading evidence...</span>
                  </div>
                ) : evidence.length > 0 ? (
                  <div className="grid gap-3">
                    {evidence.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleViewEvidence(item)}
                        className="border border-white/10 rounded-lg p-4 bg-white/5 hover:bg-white/10 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center group-hover:bg-blue-600/30 transition-colors">
                              <File className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                              <h4 className="font-medium text-sm text-white truncate max-w-xs">{item.file_name}</h4>
                              <p className="text-xs text-slate-400">CID: {item.cid.slice(0, 16)}...{item.cid.slice(-8)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="border-blue-500/50 text-blue-400 text-xs">
                              {item.category?.toUpperCase() || 'FILE'}
                            </Badge>
                            <span className="text-xs text-slate-500">
                              {new Date(item.created_at).toLocaleDateString()}
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
                    <p className="text-sm mt-1">No evidence has been uploaded for this session.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="transcript" className="flex-1 overflow-y-auto px-6 py-4 mt-0">
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-4 border-b border-white/10">
                  <FileText className="w-5 h-5 text-green-400" />
                  <h3 className="text-lg font-semibold text-white">Session Transcript</h3>
                </div>

                {isLoadingDocs ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                    <span className="ml-3 text-slate-400">Loading transcript...</span>
                  </div>
                ) : sessionDocs?.transcript_cid ? (
                  <div className="space-y-4">
                    <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-green-600/30 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-green-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">Session Transcript</p>
                            <p className="text-xs text-slate-400">CID: {sessionDocs.transcript_cid.slice(0, 20)}...{sessionDocs.transcript_cid.slice(-8)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={`https://gateway.pinata.cloud/ipfs/${sessionDocs.transcript_cid}`}
                            download
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </a>
                          <a
                            href={`https://gateway.pinata.cloud/ipfs/${sessionDocs.transcript_cid}`}
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
                    <p className="text-lg font-medium">Transcript not yet available</p>
                    <p className="text-sm mt-1">The session transcript has not been uploaded yet.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Judge-specific Signing Status Tab */}
            {isJudge && (
              <TabsContent value="signing-status" className="flex-1 overflow-y-auto px-6 py-4 mt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-400" />
                      <h3 className="text-lg font-semibold text-white">Party Signing Status</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-400">Overall Status:</span>
                      <Badge className={allPartiesSigned ? 'bg-green-600 text-white' : 'bg-orange-600 text-white'}>
                        {allPartiesSigned ? 'All Signed' : `${signingStatus.filter(s => s.signed).length}/${signingStatus.length} Signed`}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {signingStatus.map((signer, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-white/10 rounded-lg bg-white/5">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${signer.signed ? 'bg-green-500' : 'bg-orange-500'} ${!signer.signed && 'animate-pulse'}`} />
                          <div>
                            <p className="font-medium text-sm text-white">{signer.userName}</p>
                            <p className="text-xs text-slate-400">{signer.role}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {signer.signed ? (
                            <div className="flex flex-col items-end">
                              <div className="flex items-center gap-1 text-green-400">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-xs font-medium">Signed</span>
                              </div>
                              {signer.signedAt && (
                                <span className="text-xs text-slate-500 mt-1">
                                  {new Date(signer.signedAt).toLocaleString()}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-orange-400">
                              <Clock className="w-4 h-4" />
                              <span className="text-xs font-medium">Pending</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {!allPartiesSigned && (
                    <div className="mt-6 p-4 bg-orange-900/20 border border-orange-500/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-orange-400" />
                        <p className="text-sm text-orange-300">
                          Waiting for all parties to sign before you can finalize the session.
                        </p>
                      </div>
                    </div>
                  )}

                  {allPartiesSigned && (
                    <div className="mt-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <p className="text-sm text-green-300">
                          All parties have signed. You can now sign to finalize the session.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>

        {/* Action Buttons */}
        <div className="border-t border-white/10 px-6 py-4 flex-shrink-0">
          <div className="flex justify-between">
            <div className="text-sm text-slate-400">
              {hasSigned && (
                <div className="flex items-center gap-1 text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span>Signed on {new Date(notification.confirmed_at || '').toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="border-white/20 text-slate-300 hover:bg-white/10 hover:text-white">
                Close
              </Button>

              {showScheduleSessionButton && (
                <Button
                  onClick={() => onScheduleSession?.(notification)}
                  disabled={isSchedulingSession}
                  className="font-semibold px-6 py-2 shadow-lg bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSchedulingSession ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 mr-2" />
                      Schedule Session
                    </>
                  )}
                </Button>
              )}

              {showEndCaseButton && (
                <Button
                  onClick={() => onEndCase?.(notification)}
                  disabled={isEndingCase}
                  className="font-semibold px-6 py-2 shadow-lg bg-red-600 hover:bg-red-700 text-white"
                >
                  {isEndingCase ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Ending...
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 mr-2" />
                      End Case
                    </>
                  )}
                </Button>
              )}

              {showCloseSessionButton && (
                <Button
                  onClick={() => onCloseSession?.(notification)}
                  disabled={isClosingSession}
                  className="font-semibold px-6 py-2 shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isClosingSession ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Closing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Close Session
                    </>
                  )}
                </Button>
              )}

              {showSignButton && !hasSigned && (
                <Button
                  onClick={() => onSign(notification)}
                  disabled={isCaseClosed || isSigning || !isConnected || (isJudge && !allPartiesSigned)}
                  className={`font-semibold px-6 py-2 shadow-lg ${isJudge && !allPartiesSigned
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                    }`}
                >
                  {isSigning ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Signing...
                    </>
                  ) : (
                    <>
                      <PenTool className="w-4 h-4 mr-2" />
                      {isJudge ? 'Finalize Session' : 'Sign with MetaMask'}
                    </>
                  )}
                </Button>
              )}

              {hasSigned && (
                <Button
                  disabled
                  className="bg-green-600 text-white font-semibold px-6 py-2 cursor-not-allowed"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {isJudge ? 'Session Finalized' : 'Already Signed'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Evidence Viewer Modal */}
      <EvidenceViewer
        evidence={selectedEvidence}
        isOpen={isViewerOpen}
        onClose={handleCloseViewer}
      />
    </div>
  );
};