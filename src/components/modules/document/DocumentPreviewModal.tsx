import React from 'react'
import { Modal } from '../../common/Modal'
import { Button } from '../../common/Button'
import { StatusBadge } from '../../common/Badge'
import { ProjectDocument } from '../../../types/capex'
import { formatDate } from '../../../utils/formatters'
import { FileText, Download, CheckCircle, ShieldCheck, HardDrive, Calendar } from 'lucide-react'

interface DocumentPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  doc: ProjectDocument | null
  onDownload: (doc: ProjectDocument) => void
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  doc,
  onDownload
}) => {
  if (!doc) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Document Preview & Verification"
      subtitle={`Verified Corporate Repository Item — ${doc.fileType} Format`}
      maxWidth="xl"
    >
      <div className="space-y-5">
        {/* Document Header Preview Box */}
        <div className="p-4 bg-slate-50 rounded-[8px] border border-[#CBD5E1] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-200">
              {doc.fileType}
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#0F172A]">{doc.name}</h4>
              <p className="text-xs text-[#64748B] mt-0.5">
                Category: <strong>{doc.category}</strong> • Size: {doc.fileSize}
              </p>
            </div>
          </div>

          <StatusBadge status={doc.status} />
        </div>

        {/* Visual Document Mock Content / Viewer Canvas */}
        <div className="border border-[#E2E8F0] rounded-[8px] bg-white p-6 shadow-xs min-h-[220px] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold text-[#0F172A]">
                CAPEX Engineering Document Vault
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#64748B]">
              SHA256: 8f4a21...c91e
            </span>
          </div>

          <div className="py-6 text-center space-y-2">
            <FileText className="w-12 h-12 mx-auto text-[#94A3B8]" />
            <p className="text-xs font-semibold text-[#0F172A]">
              Preview rendering active for {doc.name}
            </p>
            <p className="text-[11px] text-[#64748B] max-w-md mx-auto">
              This technical document has been checked for compliance against approved CAPEX authorization and design codes.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-[#F1F5F9] text-[11px] text-[#64748B]">
            <div>
              <span>Uploaded By:</span>
              <p className="font-semibold text-[#0F172A]">{doc.uploadedBy}</p>
            </div>
            <div>
              <span>Upload Date:</span>
              <p className="font-semibold text-[#0F172A]">{formatDate(doc.uploadDate)}</p>
            </div>
            <div>
              <span>WBS Association:</span>
              <p className="font-semibold text-[#0F172A]">{doc.wbsType} Level</p>
            </div>
            <div>
              <span>File Size:</span>
              <p className="font-semibold text-[#0F172A]">{doc.fileSize}</p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-between items-center pt-3 border-t border-[#F1F5F9]">
          <span className="text-xs text-[#64748B]">
            Secure TLS 1.3 encrypted access
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onDownload(doc)}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Download File
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
