// src/components/cases/PastSessionsList.tsx

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Calendar, 
  Clock, 
  FileText, 
  ChevronRight, 
  History,
  CheckCircle,
  PauseCircle,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { fetchPastSessions } from "@/services/sessionFinalizationService";

interface PastSessionsListProps {
  caseId: string;
  onSessionClick: (session: SessionItem) => void;
  refreshTrigger?: number; // Trigger to refresh the list
}

export interface SessionItem {
  id: string;
  started_at: string;
  ended_at: string | null;
  status: string;
  finalization_cid: string | null;
  transcript_cid: string | null;
  judge_verdict_cid: string | null;
  notes: string | null;
}

export const PastSessionsList = ({ caseId, onSessionClick, refreshTrigger }: PastSessionsListProps) => {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSessions = async () => {
      setIsLoading(true);
      try {
        const data = await fetchPastSessions(caseId);
        setSessions(data);
      } catch (error) {
        console.error("Error loading past sessions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (caseId) {
      loadSessions();
    }
  }, [caseId, refreshTrigger]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ended":
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case "paused":
        return <PauseCircle className="w-5 h-5 text-amber-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ended":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            Completed
          </Badge>
        );
      case "paused":
        return (
          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">
            Pending Signatures
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/20">
            {status}
          </Badge>
        );
    }
  };

  const calculateDuration = (startedAt: string, endedAt: string | null) => {
    if (!endedAt) return "N/A";
    
    const start = new Date(startedAt).getTime();
    const end = new Date(endedAt).getTime();
    const durationMs = end - start;
    
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="w-5 h-5" />
            Past Sessions
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <LoadingSpinner size={32} />
        </CardContent>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="w-5 h-5" />
            Past Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No past sessions recorded for this case.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="w-5 h-5" />
          Past Sessions
          <span className="text-sm font-normal text-muted-foreground ml-2">
            ({sessions.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sessions.map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group"
            >
              <div
                onClick={() => onSessionClick(session)}
                className="flex items-center gap-4 p-4 rounded-lg border border-border/50 bg-card hover:bg-accent/50 hover:border-accent/50 cursor-pointer transition-all"
              >
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {getStatusIcon(session.status)}
                </div>

                {/* Session Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-medium text-sm truncate">
                      Session #{sessions.length - index}
                    </h4>
                    {getStatusBadge(session.status)}
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(session.started_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(session.started_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Duration: {calculateDuration(session.started_at, session.ended_at)}
                    </span>
                  </div>
                </div>

                {/* Has Finalization Indicator */}
                <div className="flex items-center gap-3">
                  {session.finalization_cid && (
                    <div className="flex items-center gap-1 text-xs text-emerald-400">
                      <CheckCircle className="w-3 h-3" />
                      <span>Finalized</span>
                    </div>
                  )}
                  {session.transcript_cid && (
                    <div className="flex items-center gap-1 text-xs text-blue-400">
                      <FileText className="w-3 h-3" />
                      <span>Transcript</span>
                    </div>
                  )}
                  {session.judge_verdict_cid && (
                    <div className="flex items-center gap-1 text-xs text-purple-400">
                      <FileText className="w-3 h-3" />
                      <span>Verdict</span>
                    </div>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
