"use client";

import { useState, useEffect, useCallback, useId } from "react";
import http from "@/lib/http";
import {
  FileCheck,
  Plus,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  FileText,
  ExternalLink,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  LoaderCircle,
  Save,
  X,
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Link as LinkIcon,
  HelpCircle,
  ShieldCheck,
  Settings,
  FolderOpen,
} from "lucide-react";
import { FileViewerModal } from "@/components/ui/FileViewerModal";
import { CloudinaryGalleryModal } from "@/components/admin/CloudinaryGalleryModal";
import { toCleanRelativeAssetPath } from "@/lib/utils";
import {
  serializeItemsSrNo,
  getNextSerial,
  getSectionBadge,
} from "@/lib/sequence-serializer";

export interface DisclosureView {
  label?: string;
  type?: "PDF" | "LINK";
  url: string;
  openInNewTab?: boolean;
}

export interface DisclosureRow {
  rowId?: string;
  srNo: number | string;
  title: string;
  detail?: string;
  view?: DisclosureView | null;
  order?: number;
}

export interface DisclosureSection {
  _id?: string;
  id?: string;
  publicId?: string;
  sectionKey: string;
  sectionTitle: string;
  order: number;
  isPublished: boolean;
  items: DisclosureRow[];
  createdAt?: string;
  updatedAt?: string;
}

interface PublicDisclosureAdminProps {
  apiUrl: string;
  token?: string;
}

export function PublicDisclosureAdmin({ apiUrl, token }: PublicDisclosureAdminProps) {
  const [sections, setSections] = useState<DisclosureSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Statutory / Affiliation Config Modal state
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [configAffiliationNo, setConfigAffiliationNo] = useState("330833");
  const [configSchoolCode, setConfigSchoolCode] = useState("65830");
  const [configShowNotice, setConfigShowNotice] = useState(true);
  const [configComplianceNote, setConfigComplianceNote] = useState(
    "Fields marked [Enter details] and document links are awaiting the school's verified information."
  );
  const [configSaving, setConfigSaving] = useState(false);

  // Section modal state
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<DisclosureSection | null>(null);
  const [sectionFormTitle, setSectionFormTitle] = useState("");
  const [sectionSaving, setSectionSaving] = useState(false);

  // Row editor modal state
  const [rowModalOpen, setRowModalOpen] = useState(false);
  const [targetSection, setTargetSection] = useState<DisclosureSection | null>(null);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [rowSrNo, setRowSrNo] = useState<number | string>(1);
  const [rowTitle, setRowTitle] = useState("");
  const [rowMode, setRowMode] = useState<"detail_only" | "doc_only" | "both">("both");
  const [rowDetail, setRowDetail] = useState("");
  const [rowDocType, setRowDocType] = useState<"PDF" | "LINK">("PDF");
  const [rowDocLabel, setRowDocLabel] = useState("VIEW");
  const [rowDocUrl, setRowDocUrl] = useState("");

  // Stored media gallery modal state
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // Preview file modal state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");

  // Confirmation dialogs
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "section" | "row"; sectionId: string; rowIndex?: number; title: string } | null>(null);

  const fetchSections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await http.get(`${apiUrl}/public-disclosure/sections`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = res.data?.data ?? res.data;
      const list = Array.isArray(data) ? data : (data?.items || []);
      setSections(list);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load disclosure sections");
    } finally {
      setLoading(false);
    }
  }, [apiUrl, token]);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await http.get(`${apiUrl}/public-disclosure/config`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = res.data?.data ?? res.data;
      if (data) {
        if (data.affiliationNo !== undefined) setConfigAffiliationNo(data.affiliationNo);
        if (data.schoolCode !== undefined) setConfigSchoolCode(data.schoolCode);
        if (data.showNotice !== undefined) setConfigShowNotice(data.showNotice);
        if (data.complianceNote !== undefined) setConfigComplianceNote(data.complianceNote);
      }
    } catch (err: any) {
      console.warn("Could not load statutory config:", err);
    }
  }, [apiUrl, token]);

  useEffect(() => {
    fetchSections();
    fetchConfig();
  }, [fetchSections, fetchConfig]);

  // Save Statutory & Compliance Notice configuration
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigSaving(true);
    setError(null);
    try {
      await http.patch(
        `${apiUrl}/public-disclosure/config`,
        {
          affiliationNo: configAffiliationNo.trim(),
          schoolCode: configSchoolCode.trim(),
          showNotice: configShowNotice,
          complianceNote: configComplianceNote.trim(),
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined },
      );
      setSuccess("Statutory affiliation details and compliance notice updated successfully!");
      setConfigModalOpen(false);
      await fetchConfig();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to update configuration");
    } finally {
      setConfigSaving(false);
    }
  };

  // Seed default CBSE template
  const handleSeedDefaults = async () => {
    if (!confirm("This will seed the standard CBSE Mandatory Disclosure sections. Proceed?")) return;
    setLoading(true);
    setError(null);
    try {
      await http.post(
        `${apiUrl}/public-disclosure/seed-defaults`,
        {},
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined },
      );
      setSuccess("Standard CBSE Mandatory Disclosure sections created successfully!");
      await fetchSections();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to seed default sections");
    } finally {
      setLoading(false);
    }
  };

  // Open section modal (create or edit)
  const openSectionModal = (sec?: DisclosureSection) => {
    if (sec) {
      setEditingSection(sec);
      setSectionFormTitle(sec.sectionTitle);
    } else {
      setEditingSection(null);
      setSectionFormTitle("");
    }
    setSectionModalOpen(true);
  };

  // Save section metadata
  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionFormTitle.trim()) {
      setError("Section title is required.");
      return;
    }

    setSectionSaving(true);
    setError(null);

    const payload: { sectionTitle: string; isPublished?: boolean } = {
      sectionTitle: sectionFormTitle.trim(),
    };
    if (!editingSection) {
      payload.isPublished = true;
    }

    try {
      if (editingSection) {
        const id = editingSection._id || editingSection.id || editingSection.publicId;
        await http.patch(`${apiUrl}/public-disclosure/sections/${id}`, payload, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        setSuccess(`Section "${sectionFormTitle}" updated successfully.`);
      } else {
        await http.post(`${apiUrl}/public-disclosure/sections`, payload, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        setSuccess(`Section "${sectionFormTitle}" created successfully.`);
      }
      setSectionModalOpen(false);
      await fetchSections();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to save section");
    } finally {
      setSectionSaving(false);
    }
  };

  // Reorder sections
  const handleMoveSection = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const newSections = [...sections];
    const [moved] = newSections.splice(index, 1);
    newSections.splice(targetIndex, 0, moved);

    // Optimistic update
    setSections(newSections);

    const payload = {
      sections: newSections.map((s, idx) => ({
        id: String(s._id || s.id || s.publicId),
        order: idx + 1,
      })),
    };

    try {
      await http.put(`${apiUrl}/public-disclosure/reorder`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
    } catch (err: any) {
      setError("Failed to update section order");
      await fetchSections();
    }
  };

  // Toggle publish status
  const handleTogglePublish = async (sec: DisclosureSection) => {
    const id = sec._id || sec.id || sec.publicId;
    try {
      await http.patch(
        `${apiUrl}/public-disclosure/sections/${id}`,
        { isPublished: !sec.isPublished },
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined },
      );
      setSections((prev) =>
        prev.map((s) => (s === sec ? { ...s, isPublished: !s.isPublished } : s)),
      );
    } catch (err: any) {
      setError("Failed to update publication status");
    }
  };

  // Delete section
  const handleDeleteSection = async (sectionId: string) => {
    try {
      await http.delete(`${apiUrl}/public-disclosure/sections/${sectionId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setSuccess("Section deleted successfully.");
      setDeleteConfirm(null);
      await fetchSections();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to delete section");
    }
  };

  // Open Row Modal
  const openRowModal = (sec: DisclosureSection, rowIndex?: number) => {
    setTargetSection(sec);

    if (rowIndex !== undefined && sec.items[rowIndex]) {
      const row = sec.items[rowIndex];
      setEditingRowIndex(rowIndex);
      setRowSrNo(row.srNo ?? rowIndex + 1);
      setRowTitle(row.title);
      setRowDetail(row.detail || "");

      const hasDoc = Boolean(row.view?.url);
      const hasDetail = Boolean(row.detail && row.detail.trim().length > 0);

      if (hasDetail && hasDoc) setRowMode("both");
      else if (hasDoc) setRowMode("doc_only");
      else setRowMode("detail_only");

      if (row.view) {
        setRowDocType(row.view.type || "PDF");
        setRowDocLabel(row.view.label || "VIEW");
        setRowDocUrl(row.view.url || "");
      } else {
        setRowDocType("PDF");
        setRowDocLabel("VIEW");
        setRowDocUrl("");
      }
    } else {
      setEditingRowIndex(null);
      setRowSrNo(getNextSerial(sec.items));
      setRowTitle("");
      setRowDetail("");
      setRowMode("doc_only");
      setRowDocType("PDF");
      setRowDocLabel("VIEW");
      setRowDocUrl("");
    }

    setRowModalOpen(true);
  };

  // Close row modal
  const handleCancelRowModal = () => {
    setRowModalOpen(false);
  };

  // Save Row
  const handleSaveRow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSection) return;

    if (!rowTitle.trim()) {
      setError("Row title is required.");
      return;
    }

    const isDetailMode = rowMode === "detail_only" || rowMode === "both";
    const isDocMode = rowMode === "doc_only" || rowMode === "both";

    if (isDetailMode && !rowDetail.trim()) {
      setError("Please enter the text detail, or switch to Document Only.");
      return;
    }

    if (isDocMode && !rowDocUrl.trim()) {
      setError("Please upload a PDF or enter a valid URL, or switch to Text Only.");
      return;
    }

    const rawSr = typeof rowSrNo === "string" && rowSrNo.trim() !== ""
      ? (!isNaN(Number(rowSrNo)) ? Number(rowSrNo) : rowSrNo.trim())
      : (rowSrNo || 1);

    const updatedRow: DisclosureRow = {
      srNo: rawSr,
      title: rowTitle.trim(),
      detail: isDetailMode ? rowDetail.trim() : "",
      view: isDocMode
        ? {
            label: rowDocLabel.trim() || "VIEW",
            type: rowDocType,
            url: rowDocUrl.trim(),
            openInNewTab: true,
          }
        : null,
    };

    const currentItems = [...targetSection.items];
    if (editingRowIndex !== null && editingRowIndex >= 0) {
      updatedRow.rowId = currentItems[editingRowIndex].rowId;
      currentItems[editingRowIndex] = updatedRow;
    } else {
      currentItems.push(updatedRow);
    }

    const cleanItems = (raw: DisclosureRow[]) =>
      serializeItemsSrNo(raw).map((item) => ({
        ...item,
        view:
          item.view?.url && typeof item.view.url === "string" && item.view.url.trim().length > 0
            ? {
                label: item.view.label?.trim() || "VIEW",
                type: item.view.type || "PDF",
                url: item.view.url.trim(),
                openInNewTab: item.view.openInNewTab !== false,
              }
            : null,
      }));

    const sanitizedItems = cleanItems(currentItems);

    const secId = String(targetSection._id || targetSection.id || targetSection.publicId);

    setSectionSaving(true);
    setError(null);

    try {
      await http.patch(
        `${apiUrl}/public-disclosure/sections/${secId}`,
        {
          items: sanitizedItems,
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined },
      );

      setSuccess(`Disclosure row "${rowTitle}" saved successfully.`);
      setRowModalOpen(false);
      await fetchSections();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to save disclosure row");
    } finally {
      setSectionSaving(false);
    }
  };

  // Delete row inside section
  const handleDeleteRow = async (section: DisclosureSection, rowIndex: number) => {
    const updatedItems = [...section.items];
    updatedItems.splice(rowIndex, 1);
    const sanitizedItems = serializeItemsSrNo(updatedItems).map((item) => ({
      ...item,
      view:
        item.view?.url && typeof item.view.url === "string" && item.view.url.trim().length > 0
          ? {
              label: item.view.label?.trim() || "VIEW",
              type: item.view.type || "PDF",
              url: item.view.url.trim(),
              openInNewTab: item.view.openInNewTab !== false,
            }
          : null,
    }));

    const secId = String(section._id || section.id || section.publicId);
    try {
      await http.patch(
        `${apiUrl}/public-disclosure/sections/${secId}`,
        { items: sanitizedItems },
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined },
      );
      setSuccess("Row deleted successfully.");
      setDeleteConfirm(null);
      await fetchSections();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to delete row");
    }
  };

  // Move row up or down inside section
  const handleMoveRow = async (section: DisclosureSection, rowIndex: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? rowIndex - 1 : rowIndex + 1;
    if (targetIdx < 0 || targetIdx >= section.items.length) return;

    const newItems = [...section.items];
    const [moved] = newItems.splice(rowIndex, 1);
    newItems.splice(targetIdx, 0, moved);

    const reindexedItems = serializeItemsSrNo(newItems).map((item) => ({
      ...item,
      view:
        item.view?.url && typeof item.view.url === "string" && item.view.url.trim().length > 0
          ? {
              label: item.view.label?.trim() || "VIEW",
              type: item.view.type || "PDF",
              url: item.view.url.trim(),
              openInNewTab: item.view.openInNewTab !== false,
            }
          : null,
    }));

    const secId = String(section._id || section.id || section.publicId);
    try {
      await http.patch(
        `${apiUrl}/public-disclosure/sections/${secId}`,
        { items: reindexedItems },
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined },
      );
      await fetchSections();
    } catch (err: any) {
      setError("Failed to update row order");
    }
  };


  // Filter sections by search term
  const filteredSections = sections.filter((sec) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const titleMatch = sec.sectionTitle.toLowerCase().includes(q) || sec.sectionKey.toLowerCase().includes(q);
    const itemMatch = sec.items.some(
      (it) => it.title.toLowerCase().includes(q) || (it.detail && it.detail.toLowerCase().includes(q)),
    );
    return titleMatch || itemMatch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="grid size-10 place-items-center rounded-xl bg-blue-50 text-[#1a5d9c]">
              <FileCheck className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Mandatory Disclosure
              </h1>
              <p className="text-xs text-slate-500">
                Manage compliance sections, official certificates, affiliations, staff details, and disclosure links
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchSections}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            onClick={() => setConfigModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ShieldCheck size={14} className="text-[#1a5d9c]" />
            <span>Affiliation & Notice</span>
          </button>

          {sections.length === 0 && (
            <button
              onClick={handleSeedDefaults}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/80 px-3.5 py-2 text-xs font-bold text-blue-900 hover:bg-blue-100 transition-colors shadow-2xs"
            >
              <Sparkles size={14} className="text-[#1a5d9c]" />
              Seed CBSE Template
            </button>
          )}

          <button
            onClick={() => openSectionModal()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#102a4c] hover:bg-[#1a5d9c] px-4 py-2 text-xs font-bold text-white transition-all shadow-sm"
          >
            <Plus size={15} />
            Add Section
          </button>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-500 hover:text-emerald-700">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Statutory Affiliation & Compliance Notice Bar Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-blue-200/80 bg-gradient-to-r from-blue-50/80 via-white to-sky-50/50 p-4 shadow-2xs">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="grid size-8 place-items-center rounded-xl bg-blue-600/10 text-[#1a5d9c] shrink-0">
            <ShieldCheck className="size-4.5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-bold text-slate-800">
              <span>CBSE Affiliation: <span className="font-extrabold text-[#102a4c]">{configAffiliationNo || "330833"}</span></span>
              <span className="text-blue-500 font-bold">·</span>
              <span>School Code: <span className="font-extrabold text-[#102a4c]">{configSchoolCode || "65830"}</span></span>
              <span className={`inline-flex items-center ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                configShowNotice ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
              }`}>
                {configShowNotice ? "Notice Active on Portal" : "Notice Hidden"}
              </span>
            </div>
            {configComplianceNote && (
              <p className="mt-0.5 text-xs text-slate-500 truncate max-w-2xl font-medium">
                {configComplianceNote}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setConfigModalOpen(true)}
          className="inline-flex items-center gap-1.5 self-start sm:self-center shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
        >
          <Pencil size={13} className="text-[#1a5d9c]" />
          Edit Notice
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search across sections, certificates, or disclosure details…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1a5d9c] focus:outline-hidden focus:ring-1 focus:ring-[#1a5d9c]"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>



        <div className="text-xs font-semibold text-slate-500 shrink-0 self-center hidden lg:block">
          {sections.length} {sections.length === 1 ? "Section" : "Sections"}
        </div>
      </div>

      {/* Sections List */}
      {loading && sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-xs">
          <LoaderCircle className="size-8 animate-spin text-[#1a5d9c]" />
          <p className="mt-3 text-xs font-semibold text-slate-600">Loading disclosure sections…</p>
        </div>
      ) : filteredSections.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center">
          <div className="grid size-12 place-items-center rounded-2xl bg-blue-50 text-[#1a5d9c]">
            <FileCheck className="size-6" />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-900">No Disclosure Sections Found</h3>
          <p className="mt-1 max-w-md text-xs text-slate-500">
            {search ? "No sections match your search query." : "Initialize default CBSE mandatory sections or create a new section."}
          </p>
          <div className="mt-5 flex gap-3">
            <button
              onClick={handleSeedDefaults}
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-900 hover:bg-blue-100"
            >
              <Sparkles size={14} className="text-[#1a5d9c]" />
              Seed CBSE Template
            </button>
            <button
              onClick={() => openSectionModal()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#102a4c] px-4 py-2 text-xs font-bold text-white hover:bg-[#1a5d9c]"
            >
              <Plus size={14} />
              Create Section
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredSections.map((sec, secIdx) => {
            const secId = String(sec._id || sec.id || sec.publicId);
            return (
              <div
                key={secId}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition-all hover:border-slate-300"
              >
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/70 p-4 sm:p-5">
                  <div className="flex items-center gap-3">
                    <span className="grid size-8 place-items-center rounded-lg bg-[#102a4c] font-mono text-xs font-bold text-white shrink-0">
                      {getSectionBadge(sec.sectionTitle, secIdx)}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-sm font-bold text-slate-900">{sec.sectionTitle}</h2>
                        {!sec.isPublished && (
                          <span className="rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                            Draft (Hidden)
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                        {sec.items.length} {sec.items.length === 1 ? "disclosure row" : "disclosure rows"}
                      </p>
                    </div>
                  </div>

                  {/* Section Controls */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      onClick={() => handleMoveSection(secIdx, "up")}
                      disabled={secIdx === 0}
                      title="Move Section Up"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-700 disabled:opacity-30"
                    >
                      <ArrowUp size={15} />
                    </button>
                    <button
                      onClick={() => handleMoveSection(secIdx, "down")}
                      disabled={secIdx === filteredSections.length - 1}
                      title="Move Section Down"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-700 disabled:opacity-30"
                    >
                      <ArrowDown size={15} />
                    </button>

                    <button
                      onClick={() => handleTogglePublish(sec)}
                      title={sec.isPublished ? "Published (click to hide)" : "Draft (click to publish)"}
                      className={`rounded-lg p-1.5 transition-colors ${
                        sec.isPublished ? "text-emerald-600 hover:bg-emerald-50" : "text-slate-400 hover:bg-slate-200"
                      }`}
                    >
                      {sec.isPublished ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>

                    <button
                      onClick={() => openSectionModal(sec)}
                      title="Edit Section Metadata"
                      className="rounded-lg p-1.5 text-slate-600 hover:bg-white hover:text-[#1a5d9c]"
                    >
                      <Pencil size={15} />
                    </button>

                    <button
                      onClick={() => setDeleteConfirm({ type: "section", sectionId: secId, title: sec.sectionTitle })}
                      title="Delete Section"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>

                    <button
                      onClick={() => openRowModal(sec)}
                      className="ml-2 inline-flex items-center gap-1 rounded-xl bg-[#1a5d9c] hover:bg-[#102a4c] px-3 py-1.5 text-[11px] font-bold text-white transition-colors shadow-2xs"
                    >
                      <Plus size={13} />
                      Add Row
                    </button>
                  </div>
                </div>

                {/* Rows Table */}
                {sec.items.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No disclosure rows added in this section yet. Click{" "}
                    <button onClick={() => openRowModal(sec)} className="font-bold text-[#1a5d9c] hover:underline">
                      Add Row
                    </button>{" "}
                    to create one.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-100 bg-slate-50/40 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="py-2.5 pl-5 pr-2 w-16">Sr.</th>
                          <th className="py-2.5 px-3">Information / Row Heading</th>
                          <th className="py-2.5 px-3">Details / Content</th>
                          <th className="py-2.5 px-3">Document / View Link</th>
                          <th className="py-2.5 pl-2 pr-5 text-right w-28">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sec.items.map((row, rowIdx) => {
                          const hasDetail = Boolean(row.detail && row.detail.trim());
                          const hasDoc = Boolean(row.view && row.view.url);

                          return (
                            <tr key={row.rowId || rowIdx} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-3 pl-5 pr-2 font-mono font-bold text-slate-500">
                                {row.srNo ?? rowIdx + 1}
                              </td>

                              <td className="py-3 px-3 font-semibold text-slate-900 max-w-xs">
                                <span>{row.title}</span>
                              </td>

                              <td className="py-3 px-3 text-slate-600 max-w-sm">
                                {hasDetail ? (
                                  <span className="whitespace-pre-line line-clamp-2">{row.detail}</span>
                                ) : (
                                  <span className="italic text-slate-400">—</span>
                                )}
                              </td>

                              <td className="py-3 px-3">
                                {hasDoc ? (
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => {
                                        setPreviewUrl(row.view!.url);
                                        setPreviewTitle(row.title);
                                      }}
                                      className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/70 hover:bg-blue-100 px-2.5 py-1 text-[11px] font-bold text-[#1a5d9c] transition-colors"
                                    >
                                      {row.view?.type === "LINK" ? <LinkIcon size={12} /> : <FileText size={12} />}
                                      {row.view?.label || "VIEW"}
                                    </button>
                                    <span className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                                      {toCleanRelativeAssetPath(row.view!.url)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="italic text-slate-400">—</span>
                                )}
                              </td>

                              <td className="py-3 pl-2 pr-5 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => handleMoveRow(sec, rowIdx, "up")}
                                    disabled={rowIdx === 0}
                                    title="Move Row Up"
                                    className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-20"
                                  >
                                    <ArrowUp size={13} />
                                  </button>
                                  <button
                                    onClick={() => handleMoveRow(sec, rowIdx, "down")}
                                    disabled={rowIdx === sec.items.length - 1}
                                    title="Move Row Down"
                                    className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-20"
                                  >
                                    <ArrowDown size={13} />
                                  </button>
                                  <button
                                    onClick={() => openRowModal(sec, rowIdx)}
                                    title="Edit Row"
                                    className="rounded p-1 text-slate-600 hover:bg-slate-100 hover:text-[#1a5d9c]"
                                  >
                                    <Pencil size={13} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      setDeleteConfirm({
                                        type: "row",
                                        sectionId: secId,
                                        rowIndex: rowIdx,
                                        title: row.title,
                                      })
                                    }
                                    title="Delete Row"
                                    className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* SECTION CREATE / EDIT MODAL */}
      {sectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingSection ? "Edit Disclosure Section" : "Create New Section"}
              </h3>
              <button
                onClick={() => setSectionModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSection} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700">Section Title *</label>
                <input
                  type="text"
                  required
                  value={sectionFormTitle}
                  onChange={(e) => setSectionFormTitle(e.target.value)}
                  placeholder="e.g. A. GENERAL INFORMATION"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-[#1a5d9c] focus:outline-hidden"
                />
              </div>


              <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setSectionModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sectionSaving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#102a4c] hover:bg-[#1a5d9c] px-4 py-2 text-xs font-bold text-white transition-colors"
                >
                  {sectionSaving ? <LoaderCircle size={14} className="animate-spin" /> : <Save size={14} />}
                  Save Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ROW CREATE / EDIT MODAL */}
      {rowModalOpen && targetSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl border border-slate-200 my-8 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingRowIndex !== null ? "Edit Disclosure Row" : "Add Disclosure Row"}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  In section: <span className="font-bold text-slate-700">{targetSection.sectionTitle}</span>
                </p>
              </div>
              <button
                onClick={handleCancelRowModal}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRow} className="mt-4 space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-700">Sr. No. *</label>
                  <input
                    type="text"
                    required
                    value={rowSrNo}
                    onChange={(e) => setRowSrNo(e.target.value)}
                    placeholder="1, A, I..."
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs font-semibold text-slate-900 focus:border-[#1a5d9c] focus:outline-hidden"
                  />
                </div>

                <div className="col-span-3">
                  <label className="block text-xs font-bold text-slate-700">Information / Heading *</label>
                  <input
                    type="text"
                    required
                    value={rowTitle}
                    onChange={(e) => setRowTitle(e.target.value)}
                    placeholder="e.g. COPIES OF AFFILIATION LETTER"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-[#1a5d9c] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Content Mode Switcher */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Row Content Format</label>
                <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-1 text-center">
                  <button
                    type="button"
                    onClick={() => setRowMode("detail_only")}
                    className={`rounded-lg py-1.5 text-xs font-bold transition-all ${
                      rowMode === "detail_only" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Text Detail Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setRowMode("doc_only")}
                    className={`rounded-lg py-1.5 text-xs font-bold transition-all ${
                      rowMode === "doc_only" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Document Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setRowMode("both")}
                    className={`rounded-lg py-1.5 text-xs font-bold transition-all ${
                      rowMode === "both" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Text & Document
                  </button>
                </div>
              </div>

              {/* Text Detail field */}
              {(rowMode === "detail_only" || rowMode === "both") && (
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Text Detail {rowMode === "detail_only" ? "*" : "(Optional if document attached)"}
                  </label>
                  <textarea
                    rows={3}
                    value={rowDetail}
                    onChange={(e) => setRowDetail(e.target.value)}
                    placeholder="Enter multiline text details or description…"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-900 focus:border-[#1a5d9c] focus:outline-hidden"
                  />
                </div>
              )}

              {/* Document / Link Configuration */}
              {(rowMode === "doc_only" || rowMode === "both") && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <FileText className="size-4 text-[#1a5d9c]" /> Attached Document / Link
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setRowDocType("PDF")}
                        className={`rounded-md px-2 py-1 text-[11px] font-bold ${
                          rowDocType === "PDF" ? "bg-[#102a4c] text-white" : "bg-white text-slate-600 border border-slate-200"
                        }`}
                      >
                        PDF Document
                      </button>
                      <button
                        type="button"
                        onClick={() => setRowDocType("LINK")}
                        className={`rounded-md px-2 py-1 text-[11px] font-bold ${
                          rowDocType === "LINK" ? "bg-[#102a4c] text-white" : "bg-white text-slate-600 border border-slate-200"
                        }`}
                      >
                        External Link
                      </button>
                    </div>
                  </div>

                  {rowDocType === "PDF" ? (
                    <div className="space-y-2.5">
                      {rowDocUrl ? (
                        <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50/70 to-indigo-50/40 p-3.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-100 text-[#1a5d9c] shadow-2xs">
                                <FileText className="size-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-bold text-slate-900" title={rowDocUrl}>
                                  {toCleanRelativeAssetPath(rowDocUrl)}
                                </p>
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                                  <CheckCircle2 size={11} /> Stored in Gallery &middot; Attached
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewUrl(rowDocUrl);
                                  setPreviewTitle(rowTitle || "Document Preview");
                                }}
                                className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-[#1a5d9c] border border-blue-200 hover:bg-blue-50 cursor-pointer shadow-2xs transition-colors"
                              >
                                Preview
                              </button>
                              <button
                                type="button"
                                onClick={() => setIsGalleryOpen(true)}
                                className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 border border-slate-200 hover:bg-slate-50 cursor-pointer shadow-2xs transition-colors"
                                title="Change document from gallery"
                              >
                                <FolderOpen size={12} className="text-[#1a5d9c]" />
                                Change
                              </button>
                              <button
                                type="button"
                                onClick={() => setRowDocUrl("")}
                                className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 cursor-pointer transition-colors"
                                title="Remove document attachment"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => setIsGalleryOpen(true)}
                          className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-200 bg-gradient-to-b from-blue-50/40 via-white to-blue-50/20 p-6 text-center cursor-pointer transition-all hover:border-[#1a5d9c] hover:bg-blue-50/60 group"
                        >
                          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-100/90 text-[#1a5d9c] shadow-xs group-hover:scale-105 transition-transform">
                            <FolderOpen className="size-6" />
                          </div>
                          <span className="mt-2.5 text-xs font-bold text-slate-900 group-hover:text-[#1a5d9c] transition-colors">
                            Select Stored Document from Media Gallery
                          </span>
                          <p className="mt-0.5 text-[11px] text-slate-500 max-w-sm">
                            Choose from stored affiliation certificates, inspection reports, audit compliance PDFs, or upload into the gallery.
                          </p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsGalleryOpen(true);
                            }}
                            className="mt-3.5 inline-flex items-center gap-2 rounded-xl bg-[#102a4c] hover:bg-[#1a5d9c] px-4 py-2 text-xs font-bold text-white shadow-xs transition-all cursor-pointer"
                          >
                            <FolderOpen size={14} />
                            Browse Stored Files
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600">External URL *</label>
                      <input
                        type="url"
                        value={rowDocUrl}
                        onChange={(e) => setRowDocUrl(e.target.value)}
                        placeholder="https://example.com/document.pdf or youtube.com/..."
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-[#1a5d9c] focus:outline-hidden"
                      />
                    </div>
                  )}

                  <div className="pt-1">
                    <label className="block text-[11px] font-bold text-slate-600">Button Label</label>
                    <input
                      type="text"
                      value={rowDocLabel}
                      onChange={(e) => setRowDocLabel(e.target.value)}
                      placeholder="VIEW"
                      className="mt-1 w-full max-w-xs rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 focus:border-[#1a5d9c] focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={handleCancelRowModal}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sectionSaving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#102a4c] hover:bg-[#1a5d9c] px-4 py-2 text-xs font-bold text-white transition-colors"
                >
                  {sectionSaving ? <LoaderCircle size={14} className="animate-spin" /> : <Save size={14} />}
                  Save Row
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-slate-200 animate-in zoom-in-95">
            <div className="grid size-10 place-items-center rounded-xl bg-red-50 text-red-600">
              <Trash2 className="size-5" />
            </div>
            <h4 className="mt-3 text-sm font-bold text-slate-900">
              Confirm Delete {deleteConfirm.type === "section" ? "Section" : "Row"}
            </h4>
            <p className="mt-1 text-xs text-slate-500">
              Are you sure you want to delete <span className="font-bold text-slate-700">"{deleteConfirm.title}"</span>?
              {deleteConfirm.type === "section" && " All disclosure rows in this section will also be removed."}
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteConfirm.type === "section") {
                    handleDeleteSection(deleteConfirm.sectionId);
                  } else if (deleteConfirm.type === "row" && deleteConfirm.rowIndex !== undefined) {
                    const sec = sections.find(
                      (s) => String(s._id || s.id || s.publicId) === deleteConfirm.sectionId,
                    );
                    if (sec) handleDeleteRow(sec, deleteConfirm.rowIndex);
                  }
                }}
                className="rounded-xl bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATUTORY & NOTICE CONFIG MODAL */}
      {configModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200 my-8 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="grid size-9 place-items-center rounded-xl bg-blue-600/10 text-[#1a5d9c]">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Statutory & Compliance Notice
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Update CBSE affiliation, school code, and public compliance disclaimer
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConfigModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    CBSE Affiliation No. *
                  </label>
                  <input
                    type="text"
                    required
                    value={configAffiliationNo}
                    onChange={(e) => setConfigAffiliationNo(e.target.value)}
                    placeholder="e.g. 330833"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-mono text-xs font-bold text-slate-900 focus:border-[#1a5d9c] focus:outline-hidden focus:ring-2 focus:ring-[#1a5d9c]/10"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    School Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={configSchoolCode}
                    onChange={(e) => setConfigSchoolCode(e.target.value)}
                    placeholder="e.g. 65830"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-mono text-xs font-bold text-slate-900 focus:border-[#1a5d9c] focus:outline-hidden focus:ring-2 focus:ring-[#1a5d9c]/10"
                  />
                </div>
              </div>

              {/* Show Notice Switch */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                <div>
                  <span className="text-xs font-bold text-slate-800">
                    Display Notice on Web Portal
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Show the compliance notice bar at the top of the Mandatory Disclosure page
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={configShowNotice}
                    onChange={(e) => setConfigShowNotice(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#102a4c]"></div>
                </label>
              </div>

              {/* Compliance Note Text */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Compliance Remarks / Disclaimer Text
                </label>
                <textarea
                  rows={3}
                  value={configComplianceNote}
                  onChange={(e) => setConfigComplianceNote(e.target.value)}
                  placeholder="Fields marked [Enter details] and document links are awaiting the school's verified information."
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-900 focus:border-[#1a5d9c] focus:outline-hidden focus:ring-2 focus:ring-[#1a5d9c]/10"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  This text will be appended to the Affiliation No and School Code on the web portal.
                </p>
              </div>

              {/* Portal Live Preview */}
              <div className="space-y-1 pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Portal Live Preview
                </span>
                <div className="relative overflow-hidden rounded-xl border border-blue-200/90 border-l-4 border-l-[#1a5d9c] bg-gradient-to-r from-blue-50/80 via-slate-50/60 to-sky-50/50 p-3 shadow-2xs">
                  <div className="flex items-start gap-2.5">
                    <div className="grid size-6 place-items-center rounded-md bg-blue-600/10 text-[#1a5d9c] shrink-0 mt-0.5">
                      <ShieldCheck className="size-3.5" />
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-700">
                      <span className="font-semibold text-slate-800">
                        CBSE Affiliation No. <span className="font-bold text-[#102a4c]">{configAffiliationNo || "—"}</span>
                      </span>
                      <span className="text-blue-500 font-bold mx-1.5">·</span>
                      <span className="font-semibold text-slate-800">
                        School Code <span className="font-bold text-[#102a4c]">{configSchoolCode || "—"}</span>
                      </span>
                      {configComplianceNote && (
                        <>
                          <span className="text-slate-400 mx-1.5">·</span>
                          <span className="text-slate-600 font-normal">{configComplianceNote}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setConfigModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={configSaving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#102a4c] hover:bg-[#1a5d9c] px-4 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  {configSaving ? <LoaderCircle size={14} className="animate-spin" /> : <Save size={14} />}
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLOUDINARY MEDIA GALLERY MODAL */}
      {isGalleryOpen && (
        <CloudinaryGalleryModal
          isOpen={isGalleryOpen}
          onClose={() => setIsGalleryOpen(false)}
          onSelectImage={(url: string) => {
            setRowDocUrl(url);
            setIsGalleryOpen(false);
          }}
          title="Select Mandatory Disclosure Document from Gallery"
        />
      )}

      {/* INLINE PREVIEW MODAL */}
      {previewUrl && (
        <FileViewerModal
          isOpen={Boolean(previewUrl)}
          onClose={() => setPreviewUrl(null)}
          url={previewUrl}
          title={previewTitle || "Document Preview"}
        />
      )}
    </div>
  );
}
