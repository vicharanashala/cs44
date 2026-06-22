import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { useFlags } from '@/hooks/useFlags';
import { useToast } from './Toast';
import { AlertTriangle, CheckCircle } from 'lucide-react';

const reasons = [
  { value: 'spam', label: 'Spam' },
  { value: 'offensive', label: 'Offensive' },
  { value: 'off-topic', label: 'Off-Topic' },
  { value: 'duplicate', label: 'Duplicate' },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'other', label: 'Other' },
];

export default function ReportModal({ isOpen, onClose, contentType, contentId }) {
  const { flagQuestion, flagAnswer, loading } = useFlags();
  const { showToast } = useToast();
  const [reason, setReason] = useState('spam');
  const [description, setDescription] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) {
      showToast('Please select a reason', 'error');
      return;
    }

    try {
      if (contentType === 'question') {
        await flagQuestion(contentId, reason, description);
      } else {
        await flagAnswer(contentId, reason, description);
      }
      setSuccess(true);
      showToast('Report submitted successfully', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to submit report', 'error');
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setReason('spam');
    setDescription('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={success ? "" : "Report Content"} size="sm">
      {success ? (
        <div className="flex flex-col items-center text-center py-6 space-y-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-full">
            <CheckCircle className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Report Submitted
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Thank you for helping keep our community safe.<br />
              Your report has been submitted.
            </p>
          </div>
          <Button variant="primary" onClick={handleClose} className="w-full mt-2">
            Close
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 rounded-xl text-xs border border-amber-200/50 dark:border-amber-900/30">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Reports are reviewed by moderators to ensure content standards. Abuse of flagging may lead to account penalties.</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Reason for Report
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-300"
            >
              {reasons.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail..."
              rows={4}
              required={reason === 'other'}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-300 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              Submit Report
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
