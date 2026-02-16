import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Download, Clock, XCircle, CheckCircle } from 'lucide-react';

interface StagingEvidence {
  id: string;
  case_id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  evidence_status: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  upload_timestamp: string | null;
  uploader_role: 'POLICE' | 'LAWYER';
  uploader_uuid: string;
  profiles?: {
    full_name: string;
  };
  cases?: {
    case_number: string;
    title: string;
  };
}

export const PoliceReviewVault = () => {
  const { profile } = useAuth();
  const [pendingEvidence, setPendingEvidence] = useState<StagingEvidence[]>([]);
  const [rejectedEvidence, setRejectedEvidence] = useState<StagingEvidence[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPoliceEvidence = async () => {
    if (!profile?.id) return;

    setLoading(true);
    try {
      // Fetch only PENDING and REJECTED evidence uploaded by this police officer
      const { data, error } = await supabase
        .from('staging_evidence')
        .select(`
          *,
          profiles!staging_evidence_uploader_uuid_fkey (
            full_name
          ),
          cases!staging_evidence_case_id_fkey (
            case_number,
            title
          )
        `)
        .eq('uploader_uuid', profile.id)
        .eq('uploader_role', 'POLICE')
        .in('evidence_status', ['PENDING', 'REJECTED'])
        .order('upload_timestamp', { ascending: false });

      if (error) throw error;

      // Separate pending and rejected evidence
      const pending = data?.filter(item => item.evidence_status === 'PENDING') || [];
      const rejected = data?.filter(item => item.evidence_status === 'REJECTED') || [];

      setPendingEvidence(pending as StagingEvidence[]);
      setRejectedEvidence(rejected as StagingEvidence[]);
    } catch (error: any) {
      console.error('Error fetching police evidence:', error);
      toast.error('Failed to fetch evidence');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoliceEvidence();
  }, [profile?.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'REJECTED': return <XCircle className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  const EvidenceCard = ({ evidence, status }: { evidence: StagingEvidence; status: string }) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{evidence.file_name}</CardTitle>
            <div className="text-sm text-gray-600 mt-1">
              Case: {evidence.cases?.case_number} - {evidence.cases?.title}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(status)}>
              <div className="flex items-center gap-1">
                {getStatusIcon(status)}
                <span className="text-xs font-medium">{status}</span>
              </div>
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Uploaded: {evidence.upload_timestamp ? new Date(evidence.upload_timestamp).toLocaleDateString() : 'Unknown'}</span>
            <span>Type: {evidence.file_type}</span>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(evidence.file_url, '_blank')}
              className="flex items-center gap-1"
            >
              <Eye className="w-4 h-4" />
              View Proof
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const link = document.createElement('a');
                link.href = evidence.file_url;
                link.download = evidence.file_name;
                link.click();
              }}
              className="flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4 text-blue-600">Pending Evidence</h2>
        {pendingEvidence.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">No pending evidence found.</p>
              <p className="text-sm text-gray-400 mt-1">
                Evidence you upload will appear here for judge review.
              </p>
            </CardContent>
          </Card>
        ) : (
          pendingEvidence.map(evidence => (
            <EvidenceCard key={evidence.id} evidence={evidence} status="PENDING" />
          ))
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4 text-red-600">Rejected Evidence</h2>
        {rejectedEvidence.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">No rejected evidence found.</p>
              <p className="text-sm text-gray-400 mt-1">
                Evidence that requires changes will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          rejectedEvidence.map(evidence => (
            <EvidenceCard key={evidence.id} evidence={evidence} status="REJECTED" />
          ))
        )}
      </div>
    </div>
  );
};
