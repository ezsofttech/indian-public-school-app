"use client";

import React, { useState, useMemo } from "react";
import axios from "axios";
import {
  LayoutDashboard,
  X,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  UploadCloud,
  ImageIcon,
  Loader2,
} from "lucide-react";
import fallbackSiteData from "@/public/cloud-datasource.json";
import fallbackMenuItemsList from "@/public/collections/menuitems.json";
import { RecordItem } from "../types/admin.types";
import { API_URL } from "../config/admin.config";
import { HomeHeroTab } from "./home-layout/HomeHeroTab";
import { HomeQuickCardsTab } from "./home-layout/HomeQuickCardsTab";
import { AnimatePresence } from "motion/react";
import { CloudinaryGalleryModal } from "@/components/admin/CloudinaryGalleryModal";
import { AdmissionEnquiryForm } from "@/components/site/AdmissionEnquiryForm";
import { FileUploadProgressLoader, FileUploadStatus } from "@/components/ui/FileUploadProgressLoader";
import { getAssetUrl } from "@/lib/utils";

const EDITOR_TABS = [
  { id: "header", label: "Header Config", icon: "bi-card-heading" },
  { id: "footer", label: "Footer Config", icon: "bi-layout-text-window" },
  { id: "whatsapp", label: "WhatsApp Widget", icon: "bi-whatsapp" },
  { id: "popupBanner", label: "Pop-Up Banner", icon: "bi-window-stack" },
  { id: "hero", label: "Hero Poster", icon: "bi-person-standing" },
  { id: "quickCards", label: "Quick Cards", icon: "bi-grid-3x3-gap" },
  { id: "video", label: "Intro Video Setup", icon: "bi-camera-video-fill" },
  { id: "sec1", label: "Sec 1: About", icon: "bi-building" },
  { id: "sec2", label: "Sec 2: Key Stats", icon: "bi-bar-chart-fill" },
  { id: "sec3", label: "Sec 3: Why Choose", icon: "bi-star-fill" },
  { id: "sec4", label: "Sec 4: Academics", icon: "bi-book-fill" },
  { id: "sec6", label: "Sec 5: Campus", icon: "bi-building-fill" },
  { id: "sec7", label: "Sec 6: Student Life", icon: "bi-people-fill" },
  { id: "sec8", label: "Sec 7: Courses", icon: "bi-mortarboard-fill" },
  { id: "sec9", label: "Sec 8: Director Message", icon: "bi-person-badge-fill" },
];

export function HomeLayoutEditorModal({
  token,
  record,
  saving,
  allMenuItems = [],
  allSectionPages = [],
  onClose,
  onSave,
}: {
  token: string;
  record: RecordItem | null;
  saving: boolean;
  allMenuItems?: RecordItem[];
  allSectionPages?: RecordItem[];
  onClose: () => void;
  onSave: (value: Record<string, unknown>, options?: { keepOpen?: boolean }) => void | Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState<
    | "header"
    | "footer"
    | "whatsapp"
    | "popupBanner"
    | "hero"
    | "quickCards"
    | "video"
    | "sec1"
    | "sec2"
    | "sec3"
    | "sec4"
    | "sec6"
    | "sec7"
    | "sec8"
    | "sec9"
  >("header");
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadingCard, setUploadingCard] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string>("");
  const [uploadStatus, setUploadStatus] = useState<FileUploadStatus>({
    isUploading: false,
    progress: 0,
    step: "preparing",
  });
  const [isGalleryOpen, setIsGalleryOpen] = useState<boolean>(false);
  const [galleryPickerTarget, setGalleryPickerTarget] = useState<"popupBanner" | "introVideo" | "videoPoster" | null>(null);
  const [galleryPickerCallback, setGalleryPickerCallback] = useState<((url: string) => void) | null>(null);
  const [galleryTitle, setGalleryTitle] = useState<string>("Cloudinary Media Gallery");

  const openGalleryPicker = (onSelect: (url: string) => void, customTitle?: string) => {
    setGalleryPickerCallback(() => onSelect);
    setGalleryTitle(customTitle || "Choose Media Asset from Gallery");
    setIsGalleryOpen(true);
  };
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showLivePopUpPreview, setShowLivePopUpPreview] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string>("");
  const [isSavingLocal, setIsSavingLocal] = useState<boolean>(false);

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => { });
      }
      setIsFullscreen(false);
    }
  };

  const handleCloseModal = () => {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => { });
    }
    onClose();
  };

  const initialValue = useMemo(() => {
    let val = record?.value;
    if (typeof val === "string") {
      try {
        val = JSON.parse(val);
      } catch {
        val = null;
      }
    }
    if (val && typeof val === "object" && "home" in val && Array.isArray((val as any).home)) {
      return val as any;
    }
    return fallbackSiteData as any;
  }, [record]);

  const [datasource, setDatasource] = useState<any>(initialValue);
  const [jsonText, setJsonText] = useState<string>(JSON.stringify(initialValue, null, 2));

  React.useEffect(() => {
    setDatasource(initialValue);
    setJsonText(JSON.stringify(initialValue, null, 2));

    let isMounted = true;
    const fetchLiveBackendDatasource = async () => {
      if (record && record.value && typeof record.value === "object" && "home" in (record.value as any)) {
        return;
      }
      try {
        const res = await axios.get(`${API_URL}/regarding/datasource`);
        const data = res.data?.data ?? res.data;
        const cleanData = data?.value ?? data;
        if (isMounted && cleanData && typeof cleanData === "object" && "home" in cleanData && Array.isArray(cleanData.home)) {
          setDatasource(cleanData);
          setJsonText(JSON.stringify(cleanData, null, 2));
        }
      } catch (err) {
        console.warn("Unable to fetch live backend datasource in HomeLayoutEditorModal:", err);
      }
    };

    fetchLiveBackendDatasource();
    return () => {
      isMounted = false;
    };
  }, [initialValue, record]);

  const [dbMenuItems, setDbMenuItems] = useState<RecordItem[]>(allMenuItems);
  const [dbSectionPages, setDbSectionPages] = useState<RecordItem[]>(allSectionPages);

  React.useEffect(() => {
    if (allMenuItems && allMenuItems.length > 0) {
      setDbMenuItems(allMenuItems);
    }
    if (allSectionPages && allSectionPages.length > 0) {
      setDbSectionPages(allSectionPages);
    }
  }, [allMenuItems, allSectionPages]);

  React.useEffect(() => {
    let isMounted = true;
    const fetchExtraData = async () => {
      try {
        if (dbMenuItems.length === 0) {
          const res = await axios.get(`${API_URL}/menu-items?publishedOnly=true`);
          const items = res.data?.data ?? res.data ?? [];
          if (isMounted && Array.isArray(items) && items.length > 0) {
            setDbMenuItems(items);
          }
        }
        if (dbSectionPages.length === 0) {
          const res = await axios.get(`${API_URL}/section-pages`);
          const pages = res.data?.data ?? res.data ?? [];
          if (isMounted && Array.isArray(pages) && pages.length > 0) {
            setDbSectionPages(pages);
          }
        }
      } catch (err) {
        // quiet catch
      }
    };
    fetchExtraData();
    return () => {
      isMounted = false;
    };
  }, []);

  const { defaultSitePages, menuOptions } = useMemo(() => {
    const defaults = [
      { title: "Home", url: "/" },
      { title: "About Us (Section)", url: "/#about" },
      { title: "About Us (Page)", url: "/about" },
      { title: "Academics (Section)", url: "/#academics" },
      { title: "Admissions (Page)", url: "/admission" },
      { title: "Contact Us (Section)", url: "/#contact" },
      { title: "Chairman's Message", url: "/about/chairman-message" },
      { title: "Principal's Desk", url: "/about/principal-message" },
      { title: "Campus Life", url: "/#campus-life" },
      { title: "Gallery (Section)", url: "/#gallery" },
      { title: "Gallery Album", url: "/gallery-album" },
      { title: "Enquiry (Section)", url: "/#enquiry" },
      { title: "Mandatory Disclosure", url: "/mandatory-disclosure" },
      { title: "Parent Portal", url: "/connectivity/parent-teacher-meeting" },
      { title: "Notice & News", url: "/news" },
      { title: "Press Release", url: "/press-release" },
      { title: "Brochures", url: "/brochures" },
    ];

    const rawMenu = dbMenuItems.length > 0 ? dbMenuItems : (fallbackMenuItemsList as RecordItem[]);
    const options: { title: string; url: string }[] = [];
    const addedUrls = new Set<string>();

    defaults.forEach((d) => addedUrls.add(d.url));

    rawMenu.forEach((item) => {
      const isPublished = item.isPublished !== false && String(item.isPublished) !== "false";
      if (!isPublished) return;
      const url = String(item.targetUrl || item.url || item.href || (item.slug ? `/${item.slug}` : "")).trim();
      const title = String(item.title || "").trim();
      if (url && title && !addedUrls.has(url)) {
        addedUrls.add(url);
        options.push({ title, url });
      }
    });

    dbSectionPages.forEach((p) => {
      const isPublished = p.isPublished !== false && String(p.isPublished) !== "false";
      if (!isPublished) return;
      const url = String(p.targetUrl || (p.slug ? `/pages/${p.slug}` : "")).trim();
      const title = String(p.title || "").trim();
      if (url && title && !addedUrls.has(url)) {
        addedUrls.add(url);
        options.push({ title, url });
      }
    });

    options.sort((a, b) => a.title.localeCompare(b.title));

    return { defaultSitePages: defaults, menuOptions: options };
  }, [dbMenuItems, dbSectionPages]);

  const currentPopupBanner = useMemo(() => {
    return {
      ...(datasource?.popupBanner || {}),
      ...(datasource?.home?.[0]?.identity?.popupBanner || {}),
    };
  }, [datasource]);

  const homeObj = useMemo(() => {
    return datasource?.home?.[0] || {};
  }, [datasource]);

  const updateHome = (updater: (prevHomeObj: any) => any) => {
    const updatedHomeObj = updater({ ...homeObj });
    const updatedDs = { ...datasource, home: [updatedHomeObj] };
    setDatasource(updatedDs);
    setJsonText(JSON.stringify(updatedDs, null, 2));
  };

  const uploadImage = async (file: File, album = "Home", folder?: string): Promise<string> => {
    setUploading(true);
    setUploadError("");

    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
    const formattedSize = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

    setUploadStatus({
      isUploading: true,
      fileName: file.name,
      fileSize: formattedSize,
      fileType: file.type,
      previewUrl,
      progress: 5,
      step: "preparing",
      stageMessage: "Step 1/3: Reading binary buffer & initializing Cloudinary payload…",
    });

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("album", album);
      if (folder) {
        formData.append("folder", folder);
      }

      setUploadStatus((prev) => ({
        ...prev,
        progress: 15,
        step: "uploading",
        stageMessage: "Step 2/3: Transmitting asset to server & Cloudinary CDN…",
      }));

      const res = await axios.post(`${API_URL}/uploads`, formData, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadStatus((prev) => ({
              ...prev,
              progress: Math.min(pct, 95),
              step: pct >= 95 ? "processing" : "uploading",
              stageMessage:
                pct >= 95
                  ? "Step 3/3: Optimizing asset & generating Cloudinary CDN links…"
                  : `Step 2/3: Transmitting asset to CDN server (${pct}%)…`,
            }));
          }
        },
      });

      setUploadStatus((prev) => ({
        ...prev,
        progress: 98,
        step: "processing",
        stageMessage: "Step 3/3: Processing asset & generating Cloudinary response URL…",
      }));

      const data = res.data?.data ?? res.data;
      const url = data?.url || (Array.isArray(data?.fileUrl) ? data.fileUrl[0] : data?.fileUrl);
      if (!url) throw new Error("No URL returned from upload");

      setUploadStatus((prev) => ({
        ...prev,
        progress: 100,
        step: "done",
        stageMessage: "Upload complete! Asset added to editor.",
      }));

      await new Promise((resolve) => setTimeout(resolve, 1000));
      return url;
    } catch (err) {
      const errMsg = axios.isAxiosError(err) ? String(err.response?.data?.message || err.message) : "Upload failed.";
      setUploadError(errMsg);
      setUploadStatus((prev) => ({
        ...prev,
        step: "error",
        errorMessage: errMsg,
        stageMessage: "Upload encountered an error.",
      }));
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return "";
    } finally {
      setUploading(false);
      setUploadStatus({ isUploading: false, progress: 0, step: "preparing" });
    }
  };

  const handleSave = async () => {
    setIsSavingLocal(true);
    setSaveSuccess("");
    setUploadError("");

    let finalVal = datasource;

    const homeList = Array.isArray(finalVal.home) ? [...finalVal.home] : [{}];
    const firstHome = { ...(homeList[0] || {}) };
    const currentIdentity = { ...(firstHome.identity || {}) };

    const logoObj = { ...(finalVal.site_logo || currentIdentity.site_logo || {}) };
    const headerObj = { ...(finalVal.header || currentIdentity.header || {}) };
    const footerObj = { ...(finalVal.footer || currentIdentity.footer || {}) };
    if (logoObj.logoUrl) {
      headerObj.logoUrl = logoObj.logoUrl;
      footerObj.logoUrl = logoObj.logoUrl;
    }
    if (logoObj.logoText) {
      headerObj.logoText = logoObj.logoText;
      footerObj.logoText = logoObj.logoText;
    }
    if (logoObj.logoSubText) {
      headerObj.logoSubText = logoObj.logoSubText;
      footerObj.logoSubText = logoObj.logoSubText;
    }
    const waObj = { ...(finalVal.whatsapp || currentIdentity.whatsapp || {}) };
    const popupObj = { ...(currentIdentity.popupBanner || {}), ...(finalVal.popupBanner || {}) };
    const certObj = { ...(finalVal.certified_board || currentIdentity.certified_board || {}) };
    const trustObj = { ...(finalVal.trust_board || currentIdentity.trust_board || {}) };
    const partnerObj = { ...(finalVal.academic_partner || currentIdentity.academic_partner || {}) };

    firstHome.identity = {
      ...currentIdentity,
      header: headerObj,
      footer: footerObj,
      whatsapp: waObj,
      popupBanner: popupObj,
      site_logo: logoObj,
      certified_board: certObj,
      trust_board: trustObj,
      academic_partner: partnerObj,
    };
    homeList[0] = firstHome;

    finalVal = {
      ...finalVal,
      header: headerObj,
      footer: footerObj,
      whatsapp: waObj,
      popupBanner: popupObj,
      site_logo: logoObj,
      certified_board: certObj,
      trust_board: trustObj,
      academic_partner: partnerObj,
      home: homeList,
    };

    try {
      await onSave(
        {
          key: record?.key || "site_datasource",
          category: record?.category || "Content",
          description: record?.description || "Full home page layout configuration datasource",
          status: "Active",
          value: finalVal,
          isPublic: true,
        },
        { keepOpen: true }
      );
      setSaveSuccess("Layout saved & published successfully!");
      setTimeout(() => {
        setSaveSuccess("");
      }, 5000);
    } catch (err: any) {
      console.error("Error saving home layout:", err);
      setUploadError(err?.message || "Failed to save & publish layout. Please try again.");
    } finally {
      setIsSavingLocal(false);
    }
  };

  const updateHeaderField = (field: string, val: string) => {
    setDatasource((prev: any) => {
      const homeList = Array.isArray(prev?.home) ? [...prev.home] : [{}];
      const firstHome = { ...(homeList[0] || {}) };
      const identityObj = { ...(firstHome.identity || {}) };
      const headerObj = { ...(identityObj.header || prev?.header || {}), [field]: val };

      identityObj.header = headerObj;
      firstHome.identity = identityObj;
      homeList[0] = firstHome;

      const next = {
        ...prev,
        header: headerObj,
        home: homeList,
      };
      setJsonText(JSON.stringify(next, null, 2));
      return next;
    });
  };

  const updateFooterField = (field: string, val: string) => {
    setDatasource((prev: any) => {
      const homeList = Array.isArray(prev?.home) ? [...prev.home] : [{}];
      const firstHome = { ...(homeList[0] || {}) };
      const identityObj = { ...(firstHome.identity || {}) };
      const footerObj = { ...(identityObj.footer || prev?.footer || {}), [field]: val };

      identityObj.footer = footerObj;
      firstHome.identity = identityObj;
      homeList[0] = firstHome;

      const next = {
        ...prev,
        footer: footerObj,
        home: homeList,
      };
      setJsonText(JSON.stringify(next, null, 2));
      return next;
    });
  };

  const updateFooterColumns = (updater: (cols: any[]) => any[]) => {
    setDatasource((prev: any) => {
      const homeList = Array.isArray(prev?.home) ? [...prev.home] : [{}];
      const firstHome = { ...(homeList[0] || {}) };
      const identityObj = { ...(firstHome.identity || {}) };
      const currentFooter = identityObj.footer || prev?.footer || {};
      const currentCols = Array.isArray(currentFooter.columns) && currentFooter.columns.length > 0
        ? currentFooter.columns
        : [
          {
            title: "Quick Links",
            links: [
              { title: "Home", href: "/" },
              { title: "About Us", href: "/#about" },
              { title: "Academics", href: "/#academics" },
              { title: "Admissions", href: "/admission" },
              { title: "Contact Us", href: "/#contact" },
            ],
          },
          {
            title: "Key Pages",
            links: [
              { title: "Chairman's Message", href: "/about/chairman-message" },
              { title: "Principal's Desk", href: "/about/principal-message" },
              { title: "Campus Life", href: "/#campus-life" },
              { title: "Gallery", href: "/#gallery" },
            ],
          },
          {
            title: "Important Links",
            links: [
              { title: "Enquiry", href: "/#enquiry" },
              { title: "Mandatory Disclosure", href: "/mandatory-disclosure" },
              { title: "Parent Portal", href: "/connectivity/parent-teacher-meeting" },
            ],
          },
        ];

      const newCols = updater(JSON.parse(JSON.stringify(currentCols)));
      const footerObj = { ...currentFooter, columns: newCols };

      identityObj.footer = footerObj;
      firstHome.identity = identityObj;
      homeList[0] = firstHome;

      const next = {
        ...prev,
        footer: footerObj,
        home: homeList,
      };
      setJsonText(JSON.stringify(next, null, 2));
      return next;
    });
  };

  const updateWhatsAppField = (field: string, val: any) => {
    setDatasource((prev: any) => {
      const homeList = Array.isArray(prev?.home) ? [...prev.home] : [{}];
      const firstHome = { ...(homeList[0] || {}) };
      const identityObj = { ...(firstHome.identity || {}) };
      const waObj = { ...(identityObj.whatsapp || prev?.whatsapp || {}), [field]: val };

      identityObj.whatsapp = waObj;
      firstHome.identity = identityObj;
      homeList[0] = firstHome;

      const next = {
        ...prev,
        whatsapp: waObj,
        home: homeList,
      };
      setJsonText(JSON.stringify(next, null, 2));
      return next;
    });
  };

  const updatePopupBannerField = (field: string, val: any) => {
    setDatasource((prev: any) => {
      const homeList = Array.isArray(prev?.home) ? [...prev.home] : [{}];
      const firstHome = { ...(homeList[0] || {}) };
      const identityObj = { ...(firstHome.identity || {}) };
      const pbObj = {
        ...(prev?.popupBanner || {}),
        ...(identityObj.popupBanner || {}),
        [field]: val,
      };

      identityObj.popupBanner = pbObj;
      firstHome.identity = identityObj;
      homeList[0] = firstHome;

      const next = {
        ...prev,
        popupBanner: pbObj,
        home: homeList,
      };
      setJsonText(JSON.stringify(next, null, 2));
      return next;
    });
  };

  const addItemToSection = (secKey: string, defaultObj: any) => {
    updateHome((prev) => {
      const secList = [...(prev[secKey] || [{}])];
      const listKey = secList[0]?.list ? "list" : "cardItem";
      const items = [...(secList[0]?.[listKey] || [])];
      items.push(defaultObj);
      secList[0] = { ...secList[0], [listKey]: items };
      return { ...prev, [secKey]: secList };
    });
  };

  const deleteItemFromSection = (secKey: string, index: number) => {
    updateHome((prev) => {
      const secList = [...(prev[secKey] || [{}])];
      const listKey = secList[0]?.list ? "list" : "cardItem";
      const items = (secList[0]?.[listKey] || []).filter((_: any, i: number) => i !== index);
      secList[0] = { ...secList[0], [listKey]: items };
      return { ...prev, [secKey]: secList };
    });
  };

  const moveItemInSection = (secKey: string, index: number, dir: "up" | "down") => {
    updateHome((prev) => {
      const secList = [...(prev[secKey] || [{}])];
      const listKey = secList[0]?.list ? "list" : "cardItem";
      const items = [...(secList[0]?.[listKey] || [])];
      const targetIdx = dir === "up" ? index - 1 : index + 1;
      if (targetIdx < 0 || targetIdx >= items.length) return prev;
      const temp = items[index];
      items[index] = items[targetIdx];
      items[targetIdx] = temp;
      secList[0] = { ...secList[0], [listKey]: items };
      return { ...prev, [secKey]: secList };
    });
  };

  const addTopArrayItem = (key: string, defaultObj: any) => {
    updateHome((prev) => {
      const list = [...(prev[key] || [])];
      list.push(defaultObj);
      return { ...prev, [key]: list };
    });
  };

  const deleteTopArrayItem = (key: string, index: number) => {
    updateHome((prev) => {
      const list = (prev[key] || []).filter((_: any, i: number) => i !== index);
      return { ...prev, [key]: list };
    });
  };

  const moveTopArrayItem = (key: string, index: number, dir: "up" | "down") => {
    updateHome((prev) => {
      const list = [...(prev[key] || [])];
      const targetIdx = dir === "up" ? index - 1 : index + 1;
      if (targetIdx < 0 || targetIdx >= list.length) return prev;
      const temp = list[index];
      list[index] = list[targetIdx];
      list[targetIdx] = temp;
      return { ...prev, [key]: list };
    });
  };

  return (
    <div className={`fixed inset-0 z-50 grid place-items-center bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200 ${isFullscreen ? "p-0" : "p-4"}`}>
      <div className={`w-full overflow-hidden bg-white flex flex-col transition-all duration-300 ${isFullscreen
        ? "h-screen w-screen max-w-none max-h-none rounded-none shadow-none border-0"
        : "max-h-[92vh] max-w-5xl rounded-3xl shadow-2xl border border-slate-100"
        }`}>
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4 shrink-0 rounded-t-3xl">
          <div>
            <h2 className="font-display text-xl font-bold text-[#102a4c] flex items-center gap-2">
              <LayoutDashboard className="text-[#1a5d9c]" size={20} />
              Home Page Complete Layout & Content Manager
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Dynamically add, remove, reorder, edit cards and upload images for any section.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.open(window.location.origin, "_blank")}
              title="Open site preview in new tab"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-[#1a5d9c] hover:text-white hover:border-[#1a5d9c] transition-all cursor-pointer shadow-2xs"
            >
              <i className="bi bi-box-arrow-up-right text-xs" />
              <span className="hidden sm:inline">Open in New Tab</span>
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit Device Full Screen Mode" : "Enter Device Full Screen Mode"}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-[#1a5d9c] hover:text-white hover:border-[#1a5d9c] transition-all cursor-pointer shadow-2xs"
            >
              <i className={`bi ${isFullscreen ? "bi-fullscreen-exit" : "bi-arrows-fullscreen"} text-xs`} />
              <span className="hidden sm:inline">{isFullscreen ? "Exit Full Screen" : "Full Screen"}</span>
            </button>
            <button
              type="button"
              onClick={handleCloseModal}
              title="Close Editor Modal"
              className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-50/90 p-3 overflow-x-auto scrollbar-thin shrink-0 whitespace-nowrap">
          {EDITOR_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition border whitespace-nowrap cursor-pointer ${activeTab === tab.id
                ? "border-[#1a5d9c] bg-[#1a5d9c] text-white shadow-xs"
                : "border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-300"
                }`}
            >
              <i className={`bi ${tab.icon}`} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {(uploadStatus.isUploading || uploadStatus.step === "done" || uploadStatus.step === "error") && (
          <div className="shrink-0 border-b border-blue-200 bg-blue-50/90 px-6 py-3 shadow-xs animate-in fade-in duration-200">
            <FileUploadProgressLoader status={uploadStatus} />
          </div>
        )}

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {uploadError && (
            <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700 flex items-center justify-between">
              <span>{uploadError}</span>
              <button type="button" onClick={() => setUploadError("")} className="text-red-500 hover:text-red-700">
                <X size={14} />
              </button>
            </div>
          )}

          {/* TAB: Header */}
          {activeTab === "header" && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
                <h3 className="text-sm font-bold text-[#102a4c] flex items-center gap-2">
                  <i className="bi bi-card-heading text-[#1a5d9c]" /> Website Header & Navigation Top Bar Configuration
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-500">Top Announcement / Notice Bar Text</label>
                    <input
                      type="text"
                      placeholder="e.g. Admissions Open for Session 2026-27 | Apply Online Today"
                      value={datasource?.home?.[0]?.identity?.header?.noticeText || datasource?.header?.noticeText || ""}
                      onChange={(e) => updateHeaderField("noticeText", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-[#1a5d9c]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Footer */}
          {activeTab === "footer" && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
                <h3 className="text-sm font-bold text-[#102a4c] flex items-center gap-2">
                  <i className="bi bi-layout-text-window text-[#1a5d9c]" /> Website Footer & Contact Info Configuration
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-500">Footer About Snippet</label>
                    <textarea
                      rows={2}
                      placeholder="Brief introduction displayed in website footer"
                      value={datasource?.home?.[0]?.identity?.footer?.aboutText || datasource?.footer?.aboutText || ""}
                      onChange={(e) => updateFooterField("aboutText", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none resize-y"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-500">Campus Address</label>
                    <input
                      type="text"
                      placeholder="e.g. IPS Main Campus, School Road, City Center"
                      value={datasource?.home?.[0]?.identity?.footer?.address || datasource?.footer?.address || ""}
                      onChange={(e) => updateFooterField("address", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500">Footer Phone</label>
                    <input
                      type="text"
                      placeholder="e.g. +91-9876543210"
                      value={datasource?.home?.[0]?.identity?.footer?.phone || datasource?.footer?.phone || ""}
                      onChange={(e) => updateFooterField("phone", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500">Footer Email</label>
                    <input
                      type="text"
                      placeholder="e.g. contact@indianpublicschool.in"
                      value={datasource?.home?.[0]?.identity?.footer?.email || datasource?.footer?.email || ""}
                      onChange={(e) => updateFooterField("email", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div>
                        <label className="text-xs font-bold text-[#102a4c] flex items-center gap-1.5">
                          <i className="bi bi-clock-history text-[#1a5d9c]"></i> School Office Timings Schedule
                        </label>
                        <p className="text-[11px] text-slate-500">Configure day-wise working hours for admissions and administration office</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setDatasource((prev: any) => {
                            const next = { ...prev };
                            const contactUs = { ...(next["contact-us"] || {}) };
                            const timings = { ...(contactUs["office-timings"] || {}) };
                            let newKey = "Sunday";
                            let counter = 1;
                            while (newKey in timings) {
                              newKey = `New Day ${counter++}`;
                            }
                            timings[newKey] = "8:00 AM - 2:00 PM";
                            contactUs["office-timings"] = timings;
                            next["contact-us"] = contactUs;
                            const summaryText = Object.entries(timings).map(([k, v]) => `${k}: ${v}`).join(" | ");
                            next.footer = { ...(next.footer || {}), officeHours: summaryText };
                            setJsonText(JSON.stringify(next, null, 2));
                            return next;
                          });
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-[#1a5d9c] hover:bg-blue-100 transition cursor-pointer"
                      >
                        <Plus size={14} /> Add Timing Slot
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(() => {
                        const contactUs = datasource?.["contact-us"] as Record<string, any> | undefined;
                        const officeTimings = (contactUs?.["office-timings"] as Record<string, string>) || {
                          "Monday-Friday": "7:30 AM - 5:00 PM",
                          "Saturday": "9:00 AM - 1:00 PM",
                          "Sunday": "8:00 AM - 2:00 PM",
                        };
                        const entries = Object.entries(officeTimings);

                        if (entries.length === 0) {
                          return <p className="text-xs text-slate-400 italic">No office timing slots added yet. Click &quot;Add Timing Slot&quot; above.</p>;
                        }

                        return entries.map(([dayKey, timeVal], idx) => (
                          <div key={idx} className="flex flex-col sm:flex-row items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/70 p-2.5">
                            <div className="w-full sm:w-1/3">
                              <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Days Range</label>
                              <input
                                type="text"
                                placeholder="e.g. Monday-Friday"
                                value={dayKey}
                                onChange={(e) => {
                                  const newDayKey = e.target.value;
                                  setDatasource((prev: any) => {
                                    const next = { ...prev };
                                    const cUs = { ...(next["contact-us"] || {}) };
                                    const oldTimings = { ...(cUs["office-timings"] || {}) };
                                    const newTimings: Record<string, string> = {};
                                    Object.entries(oldTimings).forEach(([k, v]) => {
                                      if (k === dayKey) {
                                        newTimings[newDayKey] = v as string;
                                      } else {
                                        newTimings[k] = v as string;
                                      }
                                    });
                                    cUs["office-timings"] = newTimings;
                                    next["contact-us"] = cUs;
                                    const summaryText = Object.entries(newTimings).map(([k, v]) => `${k}: ${v}`).join(" | ");
                                    next.footer = { ...(next.footer || {}), officeHours: summaryText };
                                    setJsonText(JSON.stringify(next, null, 2));
                                    return next;
                                  });
                                }}
                                className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold outline-none focus:border-[#1a5d9c]"
                              />
                            </div>
                            <div className="w-full sm:flex-1">
                              <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Operating Hours</label>
                              <input
                                type="text"
                                placeholder="e.g. 7:30 AM - 5:00 PM"
                                value={timeVal}
                                onChange={(e) => {
                                  const newTimeVal = e.target.value;
                                  setDatasource((prev: any) => {
                                    const next = { ...prev };
                                    const cUs = { ...(next["contact-us"] || {}) };
                                    const timings = { ...(cUs["office-timings"] || {}) };
                                    timings[dayKey] = newTimeVal;
                                    cUs["office-timings"] = timings;
                                    next["contact-us"] = cUs;
                                    const summaryText = Object.entries(timings).map(([k, v]) => `${k}: ${v}`).join(" | ");
                                    next.footer = { ...(next.footer || {}), officeHours: summaryText };
                                    setJsonText(JSON.stringify(next, null, 2));
                                    return next;
                                  });
                                }}
                                className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold outline-none focus:border-[#1a5d9c]"
                              />
                            </div>
                            <button
                              type="button"
                              title="Delete Timing Slot"
                              onClick={() => {
                                setDatasource((prev: any) => {
                                  const next = { ...prev };
                                  const cUs = { ...(next["contact-us"] || {}) };
                                  const timings = { ...(cUs["office-timings"] || {}) };
                                  delete timings[dayKey];
                                  cUs["office-timings"] = timings;
                                  next["contact-us"] = cUs;
                                  const summaryText = Object.entries(timings).map(([k, v]) => `${k}: ${v}`).join(" | ");
                                  next.footer = { ...(next.footer || {}), officeHours: summaryText };
                                  setJsonText(JSON.stringify(next, null, 2));
                                  return next;
                                });
                              }}
                              className="self-end sm:self-center p-1.5 text-slate-400 hover:text-red-600 transition cursor-pointer"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500">Copyright Notice</label>
                    <input
                      type="text"
                      placeholder="e.g. © 2026 Indian Public School. All Rights Reserved."
                      value={datasource?.footer?.copyright || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDatasource((prev: any) => {
                          const next = { ...prev, footer: { ...prev?.footer, copyright: val } };
                          setJsonText(JSON.stringify(next, null, 2));
                          return next;
                        });
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500">Affiliation / Board Registration Text</label>
                    <input
                      type="text"
                      placeholder="e.g. Affiliated to CBSE, New Delhi"
                      value={datasource?.footer?.affiliation || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDatasource((prev: any) => {
                          const next = { ...prev, footer: { ...prev?.footer, affiliation: val } };
                          setJsonText(JSON.stringify(next, null, 2));
                          return next;
                        });
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500">Facebook URL</label>
                    <input
                      type="text"
                      placeholder="https://facebook.com/..."
                      value={datasource?.footer?.facebook || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDatasource((prev: any) => {
                          const next = { ...prev, footer: { ...prev?.footer, facebook: val } };
                          setJsonText(JSON.stringify(next, null, 2));
                          return next;
                        });
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500">Instagram URL</label>
                    <input
                      type="text"
                      placeholder="https://instagram.com/..."
                      value={datasource?.footer?.instagram || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDatasource((prev: any) => {
                          const next = { ...prev, footer: { ...prev?.footer, instagram: val } };
                          setJsonText(JSON.stringify(next, null, 2));
                          return next;
                        });
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500">YouTube Channel URL</label>
                    <input
                      type="text"
                      placeholder="https://youtube.com/..."
                      value={datasource?.footer?.youtube || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDatasource((prev: any) => {
                          const next = { ...prev, footer: { ...prev?.footer, youtube: val } };
                          setJsonText(JSON.stringify(next, null, 2));
                          return next;
                        });
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500">Twitter / X URL</label>
                    <input
                      type="text"
                      placeholder="https://twitter.com/..."
                      value={datasource?.footer?.twitter || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDatasource((prev: any) => {
                          const next = { ...prev, footer: { ...prev?.footer, twitter: val } };
                          setJsonText(JSON.stringify(next, null, 2));
                          return next;
                        });
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Footer Links Manager */}
              {(() => {
                const footerObj = datasource?.home?.[0]?.identity?.footer || datasource?.footer || {};
                const currentCols = Array.isArray(footerObj.columns) && footerObj.columns.length > 0
                  ? footerObj.columns
                  : [
                    {
                      title: "Quick Links",
                      links: [
                        { title: "Home", href: "/" },
                        { title: "About Us", href: "/#about" },
                        { title: "Academics", href: "/#academics" },
                        { title: "Admissions", href: "/admission" },
                        { title: "Contact Us", href: "/#contact" },
                      ],
                    },
                    {
                      title: "Key Pages",
                      links: [
                        { title: "Chairman's Message", href: "/about/chairman-message" },
                        { title: "Principal's Desk", href: "/about/principal-message" },
                        { title: "Campus Life", href: "/#campus-life" },
                        { title: "Gallery", href: "/#gallery" },
                      ],
                    },
                    {
                      title: "Important Links",
                      links: [
                        { title: "Enquiry", href: "/#enquiry" },
                        { title: "Mandatory Disclosure", href: "/mandatory-disclosure" },
                        { title: "Parent Portal", href: "/connectivity/parent-teacher-meeting" },
                      ],
                    },
                  ];

                return (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                      <div>
                        <h3 className="text-sm font-bold text-[#102a4c] flex items-center gap-2">
                          <i className="bi bi-link-45deg text-[#1a5d9c] text-lg" /> Footer Link Columns (Quick Links Manager)
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">Customize the columns and links displayed in the website footer.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            updateFooterColumns(() => [
                              {
                                title: "Quick Links",
                                links: [
                                  { title: "Home", href: "/" },
                                  { title: "About Us", href: "/#about" },
                                  { title: "Academics", href: "/#academics" },
                                  { title: "Admissions", href: "/admission" },
                                  { title: "Contact Us", href: "/#contact" },
                                ],
                              },
                              {
                                title: "Key Pages",
                                links: [
                                  { title: "Chairman's Message", href: "/about/chairman-message" },
                                  { title: "Principal's Desk", href: "/about/principal-message" },
                                  { title: "Campus Life", href: "/#campus-life" },
                                  { title: "Gallery", href: "/#gallery" },
                                ],
                              },
                              {
                                title: "Important Links",
                                links: [
                                  { title: "Enquiry", href: "/#enquiry" },
                                  { title: "Mandatory Disclosure", href: "/mandatory-disclosure" },
                                  { title: "Parent Portal", href: "/connectivity/parent-teacher-meeting" },
                                ],
                              },
                            ]);
                          }}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <i className="bi bi-arrow-counterclockwise mr-1" /> Reset Defaults
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            updateFooterColumns((cols) => [
                              ...cols,
                              { title: "New Column", links: [{ title: "New Link", href: "/" }] }
                            ]);
                          }}
                          className="rounded-xl bg-[#1a5d9c] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#102a4c] transition-colors cursor-pointer"
                        >
                          <i className="bi bi-plus-lg mr-1" /> Add Column
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3">
                      {currentCols.map((col: any, colIdx: number) => (
                        <div key={colIdx} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs">
                          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                            <input
                              type="text"
                              value={col.title || ""}
                              placeholder="Column Title (e.g. Quick Links)"
                              onChange={(e) => {
                                const val = e.target.value;
                                updateFooterColumns((cols) => {
                                  cols[colIdx].title = val;
                                  return cols;
                                });
                              }}
                              className="w-full text-xs font-bold text-[#102a4c] border-b border-transparent hover:border-slate-300 focus:border-[#1a5d9c] outline-none px-1 py-0.5"
                            />
                            <button
                              type="button"
                              title="Delete Column"
                              onClick={() => {
                                updateFooterColumns((cols) => cols.filter((_, idx) => idx !== colIdx));
                              }}
                              className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                            >
                              <i className="bi bi-trash text-xs" />
                            </button>
                          </div>

                          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                            {Array.isArray(col.links) && col.links.map((link: any, linkIdx: number) => {
                              const isMatchedOption =
                                defaultSitePages.some((p) => p.url === link.href) ||
                                menuOptions.some((p) => p.url === link.href);

                              return (
                                <div key={linkIdx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 relative group hover:border-slate-300 transition-colors shadow-2xs">
                                  <div className="flex items-center justify-between gap-2">
                                    <input
                                      type="text"
                                      placeholder="Link Title (e.g. Academics)"
                                      value={link.title || ""}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        updateFooterColumns((cols) => {
                                          cols[colIdx].links[linkIdx].title = val;
                                          return cols;
                                        });
                                      }}
                                      className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1 outline-none focus:border-[#1a5d9c]"
                                    />
                                    <button
                                      type="button"
                                      title="Remove Link"
                                      onClick={() => {
                                        updateFooterColumns((cols) => {
                                          cols[colIdx].links = cols[colIdx].links.filter((_: any, idx: number) => idx !== linkIdx);
                                          return cols;
                                        });
                                      }}
                                      className="text-slate-400 hover:text-red-500 text-xs p-1 cursor-pointer shrink-0"
                                    >
                                      <i className="bi bi-x-lg" />
                                    </button>
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                      Target URL / Menu Item
                                    </label>
                                    <div className="relative">
                                      <select
                                        value={isMatchedOption ? link.href : "__custom__"}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          if (val !== "__custom__") {
                                            const allItems = [...defaultSitePages, ...menuOptions];
                                            const matched = allItems.find((p) => p.url === val);
                                            updateFooterColumns((cols) => {
                                              cols[colIdx].links[linkIdx].href = val;
                                              if (matched && (!cols[colIdx].links[linkIdx].title || cols[colIdx].links[linkIdx].title === "New Link")) {
                                                cols[colIdx].links[linkIdx].title = matched.title.replace(/\s*\((Section|Page)\)/, "");
                                              }
                                              return cols;
                                            });
                                          }
                                        }}
                                        className="w-full text-[11px] text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 pr-7 outline-none focus:border-[#1a5d9c] cursor-pointer appearance-none font-medium"
                                      >
                                        <option value="__custom__">Custom URL / Manual Input...</option>
                                        
                                        <optgroup label="Main Website Sections">
                                          {defaultSitePages.map((page) => (
                                            <option key={page.url} value={page.url}>
                                              {page.title} ({page.url})
                                            </option>
                                          ))}
                                        </optgroup>

                                        {menuOptions.length > 0 && (
                                          <optgroup label="Navigation Menu Items & Pages">
                                            {menuOptions.map((page) => (
                                              <option key={page.url} value={page.url}>
                                                {page.title} ({page.url})
                                              </option>
                                            ))}
                                          </optgroup>
                                        )}
                                      </select>
                                      <i className="bi bi-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] pointer-events-none" />
                                    </div>

                                    <input
                                      type="text"
                                      placeholder="Target URL (e.g. /#enquiry or /about)"
                                      value={link.href || ""}
                                      disabled={isMatchedOption}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        updateFooterColumns((cols) => {
                                          cols[colIdx].links[linkIdx].href = val;
                                          return cols;
                                        });
                                      }}
                                      className="w-full text-[11px] font-mono text-slate-600 bg-white border border-slate-200 rounded-lg px-2.5 py-1 outline-none focus:border-[#1a5d9c] disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              updateFooterColumns((cols) => {
                                cols[colIdx].links = Array.isArray(cols[colIdx].links) ? cols[colIdx].links : [];
                                cols[colIdx].links.push({ title: "New Link", href: "/" });
                                return cols;
                              });
                            }}
                            className="w-full py-1.5 border border-dashed border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <i className="bi bi-plus text-sm" /> Add Link
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB: WhatsApp */}
          {activeTab === "whatsapp" && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <h3 className="text-sm font-bold text-[#102a4c] flex items-center gap-2">
                    <i className="bi bi-whatsapp text-emerald-600 text-lg" /> Floating WhatsApp Chat Widget Configuration
                  </h3>

                  <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
                    <input
                      type="checkbox"
                      checked={(datasource?.home?.[0]?.identity?.whatsapp?.enabled ?? datasource?.whatsapp?.enabled) !== false}
                      onChange={(e) => updateWhatsAppField("enabled", e.target.checked)}
                      className="size-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-700">Enable Floating WhatsApp Widget</span>
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500">WhatsApp Contact Phone Number (Default: +91 97351 81684)</label>
                    <input
                      type="text"
                      placeholder="e.g. +91 97351 81684"
                      value={datasource?.home?.[0]?.identity?.whatsapp?.phone || datasource?.whatsapp?.phone || "+91 97351 81684"}
                      onChange={(e) => updateWhatsAppField("phone", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500">Helpdesk Agent / Desk Name</label>
                    <input
                      type="text"
                      placeholder="e.g. IPS Admissions & Support"
                      value={datasource?.home?.[0]?.identity?.whatsapp?.agentName || datasource?.whatsapp?.agentName || "IPS Admissions & Support"}
                      onChange={(e) => updateWhatsAppField("agentName", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500">Agent Role / Subtitle</label>
                    <input
                      type="text"
                      placeholder="e.g. Official Helpdesk"
                      value={datasource?.home?.[0]?.identity?.whatsapp?.agentRole || datasource?.whatsapp?.agentRole || "Official Helpdesk"}
                      onChange={(e) => updateWhatsAppField("agentRole", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500">Widget Position on Screen</label>
                    <select
                      value={datasource?.home?.[0]?.identity?.whatsapp?.position || datasource?.whatsapp?.position || "bottom-left"}
                      onChange={(e) => updateWhatsAppField("position", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-emerald-500"
                    >
                      <option value="bottom-left">Bottom Left (Recommended)</option>
                      <option value="bottom-right">Bottom Right (Stacked)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-500">Welcome Greeting Message</label>
                    <textarea
                      rows={2}
                      placeholder="Greeting text displayed when visitor opens chat box"
                      value={datasource?.home?.[0]?.identity?.whatsapp?.welcomeMessage || datasource?.whatsapp?.welcomeMessage || "Hello! Welcome to Indian Public School. How can we assist you with admissions or campus details today?"}
                      onChange={(e) => updateWhatsAppField("welcomeMessage", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none resize-y focus:border-emerald-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-500">Quick Inquiry Topic Options (Comma Separated)</label>
                    <input
                      type="text"
                      placeholder="Admission Inquiry, Fee Structure, Schedule Campus Visit, General Query"
                      value={
                        Array.isArray(datasource?.home?.[0]?.identity?.whatsapp?.presetMessages)
                          ? datasource.home[0].identity.whatsapp.presetMessages.join(", ")
                          : Array.isArray(datasource?.whatsapp?.presetMessages)
                            ? datasource.whatsapp.presetMessages.join(", ")
                            : "Admission Inquiry, Fee Structure, Schedule Campus Visit, General Query"
                      }
                      onChange={(e) => {
                        const items = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                        updateWhatsAppField("presetMessages", items);
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Pop-Up Banner Studio */}
          {activeTab === "popupBanner" && (
            <div className="space-y-6">
              {/* Settings Card */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div>
                    <h3 className="text-sm font-bold text-[#102a4c] flex items-center gap-2">
                      <i className="bi bi-window-stack text-[#1a5d9c] text-lg" /> Visitor Pop-Up Announcement Modal Studio
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Configure automated promotional pop-up modal displayed after visitor lands on the site.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowLivePopUpPreview(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-[#1a5d9c] hover:brightness-110 text-white font-black text-xs px-4 py-2 shadow-md border border-blue-400/40 cursor-pointer active:scale-95 transition-all"
                      title="See exactly how the popup will appear to website visitors before applying changes"
                    >
                      <i className="bi bi-eye-fill text-amber-300 text-sm" />
                      <span>Live Site Popup Preview</span>
                    </button>

                    <label className="flex items-center gap-2 cursor-pointer bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
                      <input
                        type="checkbox"
                        checked={currentPopupBanner.enabled !== false}
                        onChange={(e) => updatePopupBannerField("enabled", e.target.checked)}
                        className="size-4 rounded text-[#1a5d9c] focus:ring-[#1a5d9c] cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-800">Enable Pop-Up Banner (ON/OFF)</span>
                    </label>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Display Delay Timer (Seconds after page visit)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={60}
                        placeholder="e.g. 3"
                        value={currentPopupBanner.delaySeconds ?? 3}
                        onChange={(e) => updatePopupBannerField("delaySeconds", Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-[#1a5d9c]"
                      />
                      <span className="text-xs font-bold text-slate-500 shrink-0">Seconds</span>
                    </div>
                  </div>

                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2.5 cursor-pointer bg-white px-3 py-2 rounded-xl border border-slate-200 w-full shadow-2xs">
                      <input
                        type="checkbox"
                        checked={currentPopupBanner.onlyOncePerSession === true}
                        onChange={(e) => updatePopupBannerField("onlyOncePerSession", e.target.checked)}
                        className="size-4 rounded text-[#1a5d9c] focus:ring-[#1a5d9c] cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-700 block">Show Once Per Session</span>
                        <span className="text-[10px] text-slate-500 block">Don&apos;t re-open pop-up if visitor dismissed it in current browser session</span>
                      </div>
                    </label>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-600 block">Pop-Up Modal Title Headline</label>
                    <input
                      type="text"
                      placeholder="Type custom headline (e.g. Enquiry)"
                      value={currentPopupBanner.title ?? ""}
                      onChange={(e) => {
                        updatePopupBannerField("title", e.target.value);
                        updatePopupBannerField("showTitle", true);
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-[#1a5d9c]"
                    />
                  </div>

                </div>

                {/* Image Chooser & Gallery Modal */}
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <label className="text-xs font-bold text-[#102a4c] flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <ImageIcon size={15} className="text-[#1a5d9c]" /> Image Source (Upload File, Select from Gallery, or Paste URL)
                    </span>
                  </label>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <input
                      type="text"
                      disabled
                      placeholder="https://res.cloudinary.com/... or /assets/..."
                      value={
                        (currentPopupBanner.imageUrl && !currentPopupBanner.imageUrl.includes("Banner_8") && !currentPopupBanner.imageUrl.includes("file_"))
                          ? currentPopupBanner.imageUrl
                          : "/Settings/Home/POP_UP_IMAGE.jpeg"
                      }
                      onChange={(e) => updatePopupBannerField("imageUrl", e.target.value)}
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 px-3 py-2 text-xs font-semibold outline-none cursor-not-allowed select-all"
                    />

                    <label className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1a5d9c] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#102a4c] transition cursor-pointer shrink-0 shadow-2xs">
                      {uploading ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                      <span>{uploading ? "Uploading…" : "Upload"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const url = await uploadImage(file, "PopUpBanner");
                            if (url) updatePopupBannerField("imageUrl", url);
                          }
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => setIsGalleryOpen(true)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer shrink-0 shadow-2xs"
                    >
                      <ImageIcon size={14} className="text-amber-500" />
                      <span>Gallery</span>
                    </button>
                  </div>
                </div>

                {/* POP-UP BANNER STYLE CONCEPT SELECTOR */}
                <div className="rounded-2xl border border-blue-200/90 bg-blue-50/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#102a4c] flex items-center gap-2">
                      <i className="bi bi-palette-fill text-[#1a5d9c] text-sm" /> Choose Pop-Up Design Style Concept
                    </label>
                    <span className="text-[10px] font-bold text-[#1a5d9c] bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200">
                      5 Design Styles Available (Default + 4 Concepts)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {[
                      {
                        id: "card",
                        title: "Default Classic",
                        subtitle: "Standard Poster Card (80% Cover)",
                        desc: "Classic dark poster card with bottom action bar & enquiry button.",
                        badgeBg: "bg-slate-200 text-slate-800 border-slate-300 font-bold",
                        icon: "bi-card-image"
                      },
                      {
                        id: "concept1",
                        title: "Concept 1",
                        subtitle: "Neon Glassmorphic (80% Cover)",
                        desc: "Luminous blue neon border, dark navy backdrop, 100% full poster visible.",
                        badgeBg: "bg-blue-900 text-blue-200 border-blue-500/50",
                        icon: "bi-bounding-box-circles"
                      },
                      {
                        id: "concept2",
                        title: "Concept 2",
                        subtitle: "Dark Navy Side-by-Side (Picture Layout)",
                        desc: "Dark navy card, full poster on left, centered fields & blue/red action buttons.",
                        badgeBg: "bg-blue-900 text-blue-200 border-blue-500/50",
                        icon: "bi-layout-split"
                      },
                      {
                        id: "concept3",
                        title: "Concept 3",
                        subtitle: "Split Poster + Form (80% Cover)",
                        desc: "Poster on left, embedded quick enquiry form on right, 100% full poster visible.",
                        badgeBg: "bg-emerald-900 text-emerald-200 border-emerald-500/50",
                        icon: "bi-card-heading"
                      },
                      {
                        id: "concept4",
                        title: "Concept 4",
                        subtitle: "Golden Luxury Glass Showcase",
                        desc: "Ultra-pretty luxury dark glass card, glowing golden trophy badge & gold frame.",
                        badgeBg: "bg-amber-500/20 text-amber-800 border-amber-400 font-black",
                        icon: "bi-trophy-fill"
                      },
                    ].map((styleOption) => {
                      const currentStyle = datasource?.home?.[0]?.identity?.popupBanner?.bannerStyle ?? datasource?.popupBanner?.bannerStyle ?? "concept1";
                      const isSelected = currentStyle === styleOption.id;
                      return (
                        <button
                          key={styleOption.id}
                          type="button"
                          onClick={() => updatePopupBannerField("bannerStyle", styleOption.id)}
                          className={`relative p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 group ${
                            isSelected
                              ? "bg-white border-[#1a5d9c] ring-2 ring-[#1a5d9c]/30 shadow-md scale-[1.01]"
                              : "bg-white/80 border-slate-200 hover:border-blue-300 hover:bg-white shadow-2xs"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs font-black text-[#102a4c] flex items-center gap-1.5">
                              <i className={`bi ${styleOption.icon} text-[#1a5d9c]`} />
                              {styleOption.title}
                            </span>
                            {isSelected && (
                              <span className="size-5 rounded-full bg-[#1a5d9c] text-white flex items-center justify-center text-[10px] shrink-0 font-bold">
                                ✓
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="text-[11px] font-bold text-slate-800 block">{styleOption.subtitle}</span>
                            <span className="text-[10px] text-slate-500 leading-snug block mt-0.5">{styleOption.desc}</span>
                          </div>
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border w-fit ${styleOption.badgeBg}`}>
                            {styleOption.id.toUpperCase()}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Cloudinary Gallery Modal Integration */}
              <CloudinaryGalleryModal
                isOpen={isGalleryOpen}
                onClose={() => setIsGalleryOpen(false)}
                onSelectImage={(url) => {
                  updatePopupBannerField("imageUrl", url);
                  setIsGalleryOpen(false);
                }}
                title="Choose Pop-Up Announcement Image from Gallery"
              />
            </div>
          )}

          {/* TAB: Hero */}
          {activeTab === "hero" && (
            <HomeHeroTab homeObj={homeObj} updateHome={updateHome} uploadImage={uploadImage} />
          )}

          {/* TAB: Quick Cards */}
          {activeTab === "quickCards" && (
            <HomeQuickCardsTab
              homeObj={homeObj}
              updateHome={updateHome}
              moveTopArrayItem={moveTopArrayItem}
              uploadImage={uploadImage}
              menuOptions={menuOptions}
              onOpenGallery={openGalleryPicker}
            />
          )}

          {/* TAB: Section 1 */}
          {activeTab === "sec1" && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
                <h3 className="text-sm font-bold text-[#102a4c] flex items-center gap-2">
                  <i className="bi bi-building text-[#1a5d9c]" /> Section 1: About Our School
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500">Section Title</label>
                    <input
                      type="text"
                      value={homeObj["section-1"]?.[0]?.heading || ""}
                      onChange={(e) => {
                        const sec = [...(homeObj["section-1"] || [{}])];
                        sec[0] = { ...sec[0], heading: e.target.value };
                        updateHome((prev) => ({ ...prev, "section-1": sec }));
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500">Sub Heading</label>
                    <input
                      type="text"
                      value={homeObj["section-1"]?.[0]?.subHeading || ""}
                      onChange={(e) => {
                        const sec = [...(homeObj["section-1"] || [{}])];
                        sec[0] = { ...sec[0], subHeading: e.target.value };
                        updateHome((prev) => ({ ...prev, "section-1": sec }));
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500">Description Paragraph 1</label>
                    <textarea
                      rows={3}
                      value={homeObj["section-1"]?.[0]?.description?.[0] || ""}
                      onChange={(e) => {
                        const sec = [...(homeObj["section-1"] || [{}])];
                        const desc = [...(sec[0].description || ["", ""])];
                        desc[0] = e.target.value;
                        sec[0] = { ...sec[0], description: desc };
                        updateHome((prev) => ({ ...prev, "section-1": sec }));
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500">Description Paragraph 2</label>
                    <textarea
                      rows={3}
                      value={homeObj["section-1"]?.[0]?.description?.[1] || ""}
                      onChange={(e) => {
                        const sec = [...(homeObj["section-1"] || [{}])];
                        const desc = [...(sec[0].description || ["", ""])];
                        desc[1] = e.target.value;
                        sec[0] = { ...sec[0], description: desc };
                        updateHome((prev) => ({ ...prev, "section-1": sec }));
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none"
                    />
                  </div>
                </div>

                {/* Mission & Vision Cards */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-500">Mission & Vision Cards</label>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(Array.isArray(homeObj["section-1"]?.[0]?.cardItem) ? homeObj["section-1"][0].cardItem : []).map((card: any, idx: number) => (
                      <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-400">{idx === 0 ? "Our Mission (Card #1)" : idx === 1 ? "Our Vision (Card #2)" : `Card #${idx + 1}`}</span>
                        </div>
                        <input
                          type="text"
                          placeholder="Title (e.g. Our Mission)"
                          value={card.heading || ""}
                          onChange={(e) => {
                            const sec = [...(homeObj["section-1"] || [{}])];
                            const cards = [...(sec[0].cardItem || [])];
                            cards[idx] = { ...cards[idx], heading: e.target.value };
                            sec[0] = { ...sec[0], cardItem: cards };
                            updateHome((prev) => ({ ...prev, "section-1": sec }));
                          }}
                          className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-bold outline-none"
                        />
                        <textarea
                          rows={2}
                          placeholder="Description"
                          value={card.description || ""}
                          onChange={(e) => {
                            const sec = [...(homeObj["section-1"] || [{}])];
                            const cards = [...(sec[0].cardItem || [])];
                            cards[idx] = { ...cards[idx], description: e.target.value };
                            sec[0] = { ...sec[0], cardItem: cards };
                            updateHome((prev) => ({ ...prev, "section-1": sec }));
                          }}
                          className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs outline-none"
                        />

                        {/* Icon / Image Upload Controls (Gallery & Cloudinary) */}
                        <div className="flex items-center gap-1.5 pt-1">
                          <input
                            type="text"
                            readOnly
                            placeholder="Icon/Image URL (pick via Gallery or Upload)"
                            value={card.icoUrl || card.imageUrl || card.fileUrl || card.icon || ""}
                            className="flex-1 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1 text-xs text-slate-500 outline-none cursor-not-allowed"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              openGalleryPicker((url) => {
                                const sec = [...(homeObj["section-1"] || [{}])];
                                const cards = [...(sec[0].cardItem || [])];
                                cards[idx] = { ...cards[idx], icoUrl: url, imageUrl: url, fileUrl: url, icon: url };
                                sec[0] = { ...sec[0], cardItem: cards };
                                updateHome((prev) => ({ ...prev, "section-1": sec }));
                              }, "Choose Icon from Gallery");
                            }}
                            className="flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-800 hover:bg-amber-100 transition shadow-2xs"
                            title="Pick icon from Cloudinary Gallery"
                          >
                            <ImageIcon size={13} className="text-amber-600" />
                            <span>Gallery</span>
                          </button>
                          <label className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs">
                            <UploadCloud size={13} className="text-[#1a5d9c]" />
                            <span>{uploadingCard === `sec1-${idx}` ? "Uploading..." : "Upload"}</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploadingCard === `sec1-${idx}`}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setUploadingCard(`sec1-${idx}`);
                                  try {
                                    const url = await uploadImage(file);
                                    if (url) {
                                      const sec = [...(homeObj["section-1"] || [{}])];
                                      const cards = [...(sec[0].cardItem || [])];
                                      cards[idx] = { ...cards[idx], icoUrl: url, imageUrl: url, fileUrl: url, icon: url };
                                      sec[0] = { ...sec[0], cardItem: cards };
                                      updateHome((prev) => ({ ...prev, "section-1": sec }));
                                    }
                                  } catch (err) {
                                    console.error("Failed to upload icon:", err);
                                  } finally {
                                    setUploadingCard(null);
                                    e.target.value = "";
                                  }
                                }
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Section 2 */}
          {activeTab === "sec2" && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#102a4c] flex items-center gap-2">
                    <i className="bi bi-bar-chart-fill text-[#1a5d9c]" /> Section 2: Key Statistics Counters ({(homeObj["section-2"] || []).length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => addTopArrayItem("section-2", { count: "100+", heading: "New Stat", "sub-heading": "Stat description" })}
                    className="flex items-center gap-1 rounded-xl bg-[#1a5d9c] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#102a4c]"
                  >
                    <Plus size={14} /> Add Stat Counter
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {(Array.isArray(homeObj["section-2"]) ? homeObj["section-2"] : []).map((stat: any, idx: number) => (
                    <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                        <span className="text-[11px] font-bold text-slate-400">Stat #{idx + 1}</span>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => moveTopArrayItem("section-2", idx, "up")} disabled={idx === 0} className="text-slate-400 hover:text-slate-700 disabled:opacity-30">
                            <ArrowUp size={12} />
                          </button>
                          <button type="button" onClick={() => moveTopArrayItem("section-2", idx, "down")} disabled={idx === homeObj["section-2"].length - 1} className="text-slate-400 hover:text-slate-700 disabled:opacity-30">
                            <ArrowDown size={12} />
                          </button>
                          <button type="button" onClick={() => deleteTopArrayItem("section-2", idx)} className="text-red-500 hover:text-red-700">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        placeholder="Count (e.g. 1000+)"
                        value={stat.count || ""}
                        onChange={(e) => {
                          const stats = [...(homeObj["section-2"] || [])];
                          stats[idx] = { ...stats[idx], count: e.target.value };
                          updateHome((prev) => ({ ...prev, "section-2": stats }));
                        }}
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-bold text-[#1a5d9c] outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Heading"
                        value={stat.heading || ""}
                        onChange={(e) => {
                          const stats = [...(homeObj["section-2"] || [])];
                          stats[idx] = { ...stats[idx], heading: e.target.value };
                          updateHome((prev) => ({ ...prev, "section-2": stats }));
                        }}
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: Section 3 */}
          {activeTab === "sec3" && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-sm font-bold text-[#102a4c] flex items-center gap-2">
                    <i className="bi bi-star-fill text-[#1a5d9c]" /> Section 3: Why Choose IPS ({(homeObj["section-3"]?.[0]?.cardItem || []).length} Cards)
                  </h3>
                  <button
                    type="button"
                    onClick={() => addItemToSection("section-3", { heading: "New Commitment", description: "Commitment details", icoUrl: "BookOpenCheck" })}
                    className="flex items-center gap-1 rounded-xl bg-[#1a5d9c] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#102a4c]"
                  >
                    <Plus size={14} /> Add Commitment Card
                  </button>
                </div>

                {/* Section Header Controls */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500">Eyebrow / Section Title</label>
                    <input
                      type="text"
                      value={homeObj["section-3"]?.[0]?.heading || ""}
                      onChange={(e) => {
                        const sec3 = [...(homeObj["section-3"] || [{}])];
                        sec3[0] = { ...sec3[0], heading: e.target.value };
                        updateHome((prev) => ({ ...prev, "section-3": sec3 }));
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-[#1a5d9c]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500">Main Heading</label>
                    <input
                      type="text"
                      value={homeObj["section-3"]?.[0]?.mainHeading || ""}
                      onChange={(e) => {
                        const sec3 = [...(homeObj["section-3"] || [{}])];
                        sec3[0] = { ...sec3[0], mainHeading: e.target.value };
                        updateHome((prev) => ({ ...prev, "section-3": sec3 }));
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-[#1a5d9c]"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {(Array.isArray(homeObj["section-3"]?.[0]?.cardItem) ? homeObj["section-3"][0].cardItem : []).map((card: any, idx: number) => {
                    const currentIcon = card.icoUrl || card.icon || card.iconName || "";

                    return (
                      <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2.5 shadow-2xs">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                          <span className="text-[11px] font-bold text-slate-400">Card #{idx + 1}</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveItemInSection("section-3", idx, "up")}
                              disabled={idx === 0}
                              className="text-slate-400 hover:text-slate-700 disabled:opacity-30"
                            >
                              <ArrowUp size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveItemInSection("section-3", idx, "down")}
                              disabled={idx === (homeObj["section-3"]?.[0]?.cardItem || []).length - 1}
                              className="text-slate-400 hover:text-slate-700 disabled:opacity-30"
                            >
                              <ArrowDown size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteItemFromSection("section-3", idx)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Card Heading / Feature Title</label>
                          <input
                            type="text"
                            placeholder="Feature Title (e.g. CBSE Curriculum)"
                            value={card.heading || card.title || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              const sec3 = [...(homeObj["section-3"] || [{}])];
                              const cards = [...(sec3[0].cardItem || [])];
                              cards[idx] = { ...cards[idx], heading: val, title: val };
                              sec3[0] = { ...sec3[0], cardItem: cards };
                              updateHome((prev) => ({ ...prev, "section-3": sec3 }));
                            }}
                            className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold outline-none focus:border-[#1a5d9c]"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Card Description</label>
                          <textarea
                            rows={2}
                            placeholder="Feature Description"
                            value={card.description || ""}
                            onChange={(e) => {
                              const sec3 = [...(homeObj["section-3"] || [{}])];
                              const cards = [...(sec3[0].cardItem || [])];
                              cards[idx] = { ...cards[idx], description: e.target.value };
                              sec3[0] = { ...sec3[0], cardItem: cards };
                              updateHome((prev) => ({ ...prev, "section-3": sec3 }));
                            }}
                            className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-[#1a5d9c]"
                          />
                        </div>

                        {/* Card Icon (Image Upload) - Same as Quick Card */}
                        <div className="space-y-1.5 rounded-lg border border-slate-100 bg-slate-50/70 p-2.5">
                          <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <ImageIcon size={13} className="text-[#1a5d9c]" /> Icon Image
                            </span>
                            {currentIcon ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const sec3 = [...(homeObj["section-3"] || [{}])];
                                  const cards = [...(sec3[0].cardItem || [])];
                                  cards[idx] = { ...cards[idx], icoUrl: "", icon: "", imageUrl: "", fileUrl: "" };
                                  sec3[0] = { ...sec3[0], cardItem: cards };
                                  updateHome((prev) => ({ ...prev, "section-3": sec3 }));
                                }}
                                className="text-[10px] text-red-500 hover:text-red-700 flex items-center gap-0.5"
                              >
                                <X size={11} /> Clear Icon
                              </button>
                            ) : null}
                          </label>

                          <div className="flex items-center gap-2">
                            {/* Thumbnail Preview */}
                            <div className="size-9 shrink-0 overflow-hidden rounded-lg border border-slate-700 bg-[#123B70] grid place-items-center shadow-2xs">
                              {currentIcon ? (
                                <img
                                  src={getAssetUrl(currentIcon)}
                                  alt="Icon Preview"
                                  className="size-6 object-contain brightness-0 invert"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                <ImageIcon size={16} className="text-slate-300" />
                              )}
                            </div>

                            {/* Upload & Gallery Buttons */}
                            <div className="flex flex-1 items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  openGalleryPicker((url) => {
                                    const sec3 = [...(homeObj["section-3"] || [{}])];
                                    const cards = [...(sec3[0].cardItem || [])];
                                    cards[idx] = { ...cards[idx], icoUrl: url, icon: url, imageUrl: url, fileUrl: url };
                                    sec3[0] = { ...sec3[0], cardItem: cards };
                                    updateHome((prev) => ({ ...prev, "section-3": sec3 }));
                                  }, "Choose Card Icon from Gallery");
                                }}
                                className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition shadow-2xs cursor-pointer"
                                title="Pick icon from Cloudinary Gallery"
                              >
                                <ImageIcon size={13} className="text-amber-600" />
                                <span>Gallery</span>
                              </button>

                              <label className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition shadow-2xs">
                                <UploadCloud size={13} className="text-[#1a5d9c]" />
                                <span>{uploadingCard === `sec3-${idx}` ? "Uploading..." : "Upload"}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  disabled={uploadingCard === `sec3-${idx}`}
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      setUploadingCard(`sec3-${idx}`);
                                      try {
                                        const url = await uploadImage(file);
                                        if (url) {
                                          const sec3 = [...(homeObj["section-3"] || [{}])];
                                          const cards = [...(sec3[0].cardItem || [])];
                                          cards[idx] = { ...cards[idx], icoUrl: url, icon: url, imageUrl: url, fileUrl: url };
                                          sec3[0] = { ...sec3[0], cardItem: cards };
                                          updateHome((prev) => ({ ...prev, "section-3": sec3 }));
                                        }
                                      } catch (err) {
                                        console.error("Failed to upload icon:", err);
                                      } finally {
                                        setUploadingCard(null);
                                        e.target.value = "";
                                      }
                                    }
                                  }}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB: Section 4 */}
          {activeTab === "sec4" && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-sm font-bold text-[#102a4c] flex items-center gap-2">
                    <i className="bi bi-book-fill text-[#1a5d9c]" /> Section 4: Academic Journey Stages ({(homeObj["section-4"]?.[0]?.cardItem || []).length} Stages)
                  </h3>
                  <button
                    type="button"
                    onClick={() => addItemToSection("section-4", { heading: "Grade X – XII", mainHeading: "New Stage", description: "Stage curriculum details" })}
                    className="flex items-center gap-1 rounded-xl bg-[#1a5d9c] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#102a4c]"
                  >
                    <Plus size={14} /> Add Academic Stage
                  </button>
                </div>

                {/* Section Header Controls */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500">Eyebrow / Section Title</label>
                    <input
                      type="text"
                      value={homeObj["section-4"]?.[0]?.heading || ""}
                      onChange={(e) => {
                        const sec4 = [...(homeObj["section-4"] || [{}])];
                        sec4[0] = { ...sec4[0], heading: e.target.value };
                        updateHome((prev) => ({ ...prev, "section-4": sec4 }));
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-[#1a5d9c]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500">Main Heading</label>
                    <input
                      type="text"
                      value={homeObj["section-4"]?.[0]?.mainHeading || ""}
                      onChange={(e) => {
                        const sec4 = [...(homeObj["section-4"] || [{}])];
                        sec4[0] = { ...sec4[0], mainHeading: e.target.value };
                        updateHome((prev) => ({ ...prev, "section-4": sec4 }));
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-[#1a5d9c]"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {(Array.isArray(homeObj["section-4"]?.[0]?.cardItem) ? homeObj["section-4"][0].cardItem : []).map((stage: any, idx: number) => {
                    return (
                      <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2.5 shadow-2xs">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                          <span className="text-[11px] font-bold text-slate-400">Stage #{idx + 1}</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveItemInSection("section-4", idx, "up")}
                              disabled={idx === 0}
                              className="text-slate-400 hover:text-slate-700 disabled:opacity-30"
                            >
                              <ArrowUp size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveItemInSection("section-4", idx, "down")}
                              disabled={idx === (homeObj["section-4"]?.[0]?.cardItem || []).length - 1}
                              className="text-slate-400 hover:text-slate-700 disabled:opacity-30"
                            >
                              <ArrowDown size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteItemFromSection("section-4", idx)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Grade range"
                            value={stage.heading || ""}
                            onChange={(e) => {
                              const sec4 = [...(homeObj["section-4"] || [{}])];
                              const stages = [...(sec4[0].cardItem || [])];
                              stages[idx] = { ...stages[idx], heading: e.target.value };
                              sec4[0] = { ...sec4[0], cardItem: stages };
                              updateHome((prev) => ({ ...prev, "section-4": sec4 }));
                            }}
                            className="w-1/2 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold outline-none focus:border-[#1a5d9c]"
                          />
                          <input
                            type="text"
                            placeholder="Stage title"
                            value={stage.mainHeading || stage.title || ""}
                            onChange={(e) => {
                              const sec4 = [...(homeObj["section-4"] || [{}])];
                              const stages = [...(sec4[0].cardItem || [])];
                              stages[idx] = { ...stages[idx], mainHeading: e.target.value, title: e.target.value };
                              sec4[0] = { ...sec4[0], cardItem: stages };
                              updateHome((prev) => ({ ...prev, "section-4": sec4 }));
                            }}
                            className="w-1/2 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-[#1a5d9c] outline-none focus:border-[#1a5d9c]"
                          />
                        </div>
                        <textarea
                          rows={2}
                          placeholder="Curriculum & stage details"
                          value={stage.description || ""}
                          onChange={(e) => {
                            const sec4 = [...(homeObj["section-4"] || [{}])];
                            const stages = [...(sec4[0].cardItem || [])];
                            stages[idx] = { ...stages[idx], description: e.target.value };
                            sec4[0] = { ...sec4[0], cardItem: stages };
                            updateHome((prev) => ({ ...prev, "section-4": sec4 }));
                          }}
                          className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-[#1a5d9c]"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB: Section 6 */}
          {activeTab === "sec6" && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-sm font-bold text-[#102a4c] flex items-center gap-2">
                    <i className="bi bi-building-fill text-[#1a5d9c]" /> Section 5: Campus Infrastructure Cards ({(homeObj["section-6"]?.[0]?.cardItem || []).length} Cards)
                  </h3>
                  <button
                    type="button"
                    onClick={() => addItemToSection("section-6", { title: "New Facility", heading: "New Facility", "sub-title": "Facility features", description: "Facility features", fileUrl: "", imageUrl: "" })}
                    className="flex items-center gap-1 rounded-xl bg-[#1a5d9c] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#102a4c]"
                  >
                    <Plus size={14} /> Add Facility Card
                  </button>
                </div>

                {/* Section Header Controls */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500">Eyebrow / Section Title</label>
                    <input
                      type="text"
                      value={homeObj["section-6"]?.[0]?.heading || ""}
                      onChange={(e) => {
                        const sec6 = [...(homeObj["section-6"] || [{}])];
                        sec6[0] = { ...sec6[0], heading: e.target.value };
                        updateHome((prev) => ({ ...prev, "section-6": sec6 }));
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-[#1a5d9c]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500">Main Heading</label>
                    <input
                      type="text"
                      value={homeObj["section-6"]?.[0]?.mainHeading || ""}
                      onChange={(e) => {
                        const sec6 = [...(homeObj["section-6"] || [{}])];
                        sec6[0] = { ...sec6[0], mainHeading: e.target.value };
                        updateHome((prev) => ({ ...prev, "section-6": sec6 }));
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-[#1a5d9c]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500">Section Description</label>
                  <textarea
                    rows={2}
                    value={
                      Array.isArray(homeObj["section-6"]?.[0]?.description)
                        ? homeObj["section-6"][0].description[0] || ""
                        : homeObj["section-6"]?.[0]?.description || ""
                    }
                    onChange={(e) => {
                      const sec6 = [...(homeObj["section-6"] || [{}])];
                      sec6[0] = { ...sec6[0], description: [e.target.value] };
                      updateHome((prev) => ({ ...prev, "section-6": sec6 }));
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#1a5d9c]"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {(Array.isArray(homeObj["section-6"]?.[0]?.cardItem) ? homeObj["section-6"][0].cardItem : []).map((infra: any, idx: number) => {
                    const cardImgUrl = infra.fileUrl || infra.imageUrl || infra.icoUrl || "";
                    const displayImgUrl = cardImgUrl ? getAssetUrl(cardImgUrl) : "";
                    const isCardUploading = uploadingCard === `sec6-${idx}`;

                    return (
                      <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-3 shadow-2xs">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-[11px] font-bold text-slate-400">Facility #{idx + 1}</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveItemInSection("section-6", idx, "up")}
                              disabled={idx === 0}
                              className="text-slate-400 hover:text-slate-700 disabled:opacity-30 p-1"
                              title="Move up"
                            >
                              <ArrowUp size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveItemInSection("section-6", idx, "down")}
                              disabled={idx === (homeObj["section-6"]?.[0]?.cardItem || []).length - 1}
                              className="text-slate-400 hover:text-slate-700 disabled:opacity-30 p-1"
                              title="Move down"
                            >
                              <ArrowDown size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteItemFromSection("section-6", idx)}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Delete facility card"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Facility Title</label>
                          <input
                            type="text"
                            value={infra.title || infra.heading || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              const sec6 = [...(homeObj["section-6"] || [{}])];
                              const cards = [...(sec6[0].cardItem || [])];
                              cards[idx] = { ...cards[idx], title: val, heading: val };
                              sec6[0] = { ...sec6[0], cardItem: cards };
                              updateHome((prev) => ({ ...prev, "section-6": sec6 }));
                            }}
                            className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold outline-none focus:border-[#1a5d9c]"
                            placeholder="e.g. Science Labs"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Subtitle / Feature Description</label>
                          <input
                            type="text"
                            value={infra["sub-title"] || infra.description || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              const sec6 = [...(homeObj["section-6"] || [{}])];
                              const cards = [...(sec6[0].cardItem || [])];
                              cards[idx] = { ...cards[idx], "sub-title": val, description: val };
                              sec6[0] = { ...sec6[0], cardItem: cards };
                              updateHome((prev) => ({ ...prev, "section-6": sec6 }));
                            }}
                            className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-[#1a5d9c]"
                            placeholder="e.g. Physics, chemistry and biology labs."
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Image Path / URL (Disabled)</label>
                          <input
                            type="text"
                            value={cardImgUrl}
                            disabled
                            readOnly
                            placeholder="No image attached"
                            className="w-full rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-mono text-slate-500 cursor-not-allowed outline-none select-all"
                          />
                        </div>

                        {/* Linked Image Preview & Actions */}
                        <div className="space-y-2 pt-1">
                          <label className="text-[10px] font-bold text-slate-500 block">Attached Facility Image</label>
                          {cardImgUrl ? (
                            <div className="relative h-36 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-900 group shadow-2xs">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={displayImgUrl}
                                alt={infra.title || "Campus Facility"}
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = "/assets/Album/ClassRoom.webp";
                                }}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                              <div className="absolute top-2 left-2 rounded-md bg-black/65 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white flex items-center gap-1 shadow-sm">
                                <ImageIcon size={10} className="text-amber-400" /> Attached Image
                              </div>
                              <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    openGalleryPicker((url) => {
                                      const sec6 = [...(homeObj["section-6"] || [{}])];
                                      const cards = [...(sec6[0].cardItem || [])];
                                      cards[idx] = { ...cards[idx], fileUrl: url, imageUrl: url };
                                      sec6[0] = { ...sec6[0], cardItem: cards };
                                      updateHome((prev) => ({ ...prev, "section-6": sec6 }));
                                    }, `Choose Image for ${infra.title || "Facility"}`);
                                  }}
                                  className="rounded-md bg-amber-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-amber-700 flex items-center gap-1 shadow-sm cursor-pointer"
                                >
                                  <ImageIcon size={11} /> Gallery
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const sec6 = [...(homeObj["section-6"] || [{}])];
                                    const cards = [...(sec6[0].cardItem || [])];
                                    cards[idx] = { ...cards[idx], fileUrl: "", imageUrl: "", icoUrl: "" };
                                    sec6[0] = { ...sec6[0], cardItem: cards };
                                    updateHome((prev) => ({ ...prev, "section-6": sec6 }));
                                  }}
                                  className="rounded-md bg-rose-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-rose-700 flex items-center gap-1 shadow-sm cursor-pointer"
                                >
                                  <Trash2 size={11} /> Remove
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex h-24 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400">
                              <ImageIcon size={20} className="text-slate-300 mb-1" />
                              <span className="text-[11px] font-medium">No image attached</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                openGalleryPicker((url) => {
                                  const sec6 = [...(homeObj["section-6"] || [{}])];
                                  const cards = [...(sec6[0].cardItem || [])];
                                  cards[idx] = { ...cards[idx], fileUrl: url, imageUrl: url };
                                  sec6[0] = { ...sec6[0], cardItem: cards };
                                  updateHome((prev) => ({ ...prev, "section-6": sec6 }));
                                }, `Choose Image for ${infra.title || "Facility"}`);
                              }}
                              className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg border border-amber-300 bg-amber-50 py-1.5 text-[11px] font-bold text-amber-800 hover:bg-amber-100 transition-colors shadow-2xs"
                              title="Choose existing photo from Cloudinary Gallery"
                            >
                              <ImageIcon size={13} className="text-amber-600" /> Choose from Gallery
                            </button>

                            <label className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 bg-slate-50 py-1.5 text-[11px] font-bold text-[#1a5d9c] hover:bg-blue-50 transition-colors">
                              {isCardUploading ? (
                                <>
                                  <Loader2 size={13} className="animate-spin text-[#1a5d9c]" /> Uploading...
                                </>
                              ) : (
                                <>
                                  <UploadCloud size={13} /> {cardImgUrl ? "Change Upload" : "Upload Image"}
                                </>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                disabled={isCardUploading}
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setUploadingCard(`sec6-${idx}`);
                                    try {
                                      const url = await uploadImage(file);
                                      if (url) {
                                        const sec6 = [...(homeObj["section-6"] || [{}])];
                                        const cards = [...(sec6[0].cardItem || [])];
                                        cards[idx] = { ...cards[idx], fileUrl: url, imageUrl: url };
                                        sec6[0] = { ...sec6[0], cardItem: cards };
                                        updateHome((prev) => ({ ...prev, "section-6": sec6 }));
                                      }
                                    } finally {
                                      setUploadingCard(null);
                                      e.target.value = "";
                                    }
                                  }
                                }}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB: Section 7 */}
          {activeTab === "sec7" && (() => {
            const sec7Data = homeObj["section-7"]?.[0] || {};
            const cardsList: Array<{ title?: string; heading?: string; fileUrl: string }> = Array.isArray(sec7Data.cardItem)
              ? sec7Data.cardItem
              : [];
            const descText = Array.isArray(sec7Data.description)
              ? sec7Data.description[0] || ""
              : typeof sec7Data.description === "string"
                ? sec7Data.description
                : "";

            return (
              <div className="space-y-5">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="text-sm font-bold text-[#102a4c] flex items-center gap-2">
                      <i className="bi bi-people-fill text-[#1a5d9c]" /> Section 6: Student Life Showcase
                    </h3>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-[#1a5d9c] border border-blue-100">
                      {cardsList.length} {cardsList.length === 1 ? "Image" : "Images"} configured
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Eyebrow / Sub-Heading</label>
                      <input
                        type="text"
                        placeholder="e.g. Student Life"
                        value={sec7Data.heading || ""}
                        onChange={(e) => {
                          const sec7 = [...(homeObj["section-7"] || [{}])];
                          sec7[0] = { ...sec7[0], heading: e.target.value };
                          updateHome((prev) => ({ ...prev, "section-7": sec7 }));
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-[#1a5d9c]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Main Heading</label>
                      <input
                        type="text"
                        placeholder="e.g. A day here is never quiet"
                        value={sec7Data.mainHeading || ""}
                        onChange={(e) => {
                          const sec7 = [...(homeObj["section-7"] || [{}])];
                          sec7[0] = { ...sec7[0], mainHeading: e.target.value };
                          updateHome((prev) => ({ ...prev, "section-7": sec7 }));
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-[#1a5d9c]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Section Description</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Assemblies, house matches, rehearsals, science fairs and quiet reading corners..."
                      value={descText}
                      onChange={(e) => {
                        const sec7 = [...(homeObj["section-7"] || [{}])];
                        sec7[0] = { ...sec7[0], description: [e.target.value] };
                        updateHome((prev) => ({ ...prev, "section-7": sec7 }));
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium outline-none focus:border-[#1a5d9c] resize-none"
                    />
                  </div>
                </div>

                {/* Section 7 Images Grid Editor */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="text-xs font-bold text-[#102a4c]">Student Life Showcase Photos</h4>
                      <p className="text-[11px] text-slate-500">Upload multiple photos to display in the Student Life section masonry grid.</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          openGalleryPicker((url) => {
                            const currentCards = [...(homeObj["section-7"]?.[0]?.cardItem || [])];
                            const autoTitle = "Gallery Photo";
                            currentCards.push({ title: autoTitle, fileUrl: url });
                            const sec7 = [...(homeObj["section-7"] || [{}])];
                            sec7[0] = { ...sec7[0], cardItem: currentCards };
                            updateHome((prev) => ({ ...prev, "section-7": sec7 }));
                          }, "Select Photo for Student Life from Gallery");
                        }}
                        className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition shadow-2xs"
                      >
                        <ImageIcon size={15} className="text-amber-600" /> Choose from Gallery
                      </button>

                      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1a5d9c] px-4 py-2 text-xs font-bold text-white hover:bg-[#124272] transition-colors shadow-sm">
                        <Plus size={16} /> Add Image(s)
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={async (e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length === 0) return;
                            const currentCards = [...(homeObj["section-7"]?.[0]?.cardItem || [])];
                            for (const file of files) {
                              const url = await uploadImage(file);
                              if (url) {
                                const autoTitle = file.name
                                  .replace(/\.[^/.]+$/, "")
                                  .replace(/[-_]/g, " ")
                                  .trim();
                                currentCards.push({ title: autoTitle, fileUrl: url });
                              }
                            }
                            const sec7 = [...(homeObj["section-7"] || [{}])];
                            sec7[0] = { ...sec7[0], cardItem: currentCards };
                            updateHome((prev) => ({ ...prev, "section-7": sec7 }));
                            e.target.value = "";
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {cardsList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 text-center">
                      <ImageIcon className="h-10 w-10 text-slate-300 mb-2" />
                      <p className="text-xs font-bold text-slate-600">No Student Life images added yet</p>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-xs">Click &quot;Add Image(s)&quot; above to upload photos for this section.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {cardsList.map((card, cardIdx) => (
                        <div
                          key={`sec7-card-${cardIdx}`}
                          className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/50 p-3 hover:border-slate-300 transition-all shadow-xs"
                        >
                          <div className="space-y-3">
                            <div className="relative h-40 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
                              {card.fileUrl ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                  src={card.fileUrl}
                                  alt={card.title || card.heading || `Student Life ${cardIdx + 1}`}
                                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                                  No image
                                </div>
                              )}
                              <span className="absolute top-2 left-2 rounded-lg bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white">
                                #{cardIdx + 1}
                              </span>
                            </div>

                            <input
                              type="text"
                              placeholder="Image Caption / Title"
                              value={card.title || card.heading || ""}
                              onChange={(e) => {
                                const sec7 = [...(homeObj["section-7"] || [{}])];
                                const cards = [...(sec7[0].cardItem || [])];
                                cards[cardIdx] = { ...cards[cardIdx], title: e.target.value };
                                sec7[0] = { ...sec7[0], cardItem: cards };
                                updateHome((prev) => ({ ...prev, "section-7": sec7 }));
                              }}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-[#1a5d9c]"
                            />
                          </div>

                          <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-200/60">
                            <label className="flex cursor-pointer items-center gap-1.5 text-[11px] font-bold text-[#1a5d9c] hover:underline">
                              <UploadCloud size={14} /> Change Photo
                              <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const url = await uploadImage(file);
                                    if (url) {
                                      const sec7 = [...(homeObj["section-7"] || [{}])];
                                      const cards = [...(sec7[0].cardItem || [])];
                                      cards[cardIdx] = { ...cards[cardIdx], fileUrl: url };
                                      sec7[0] = { ...sec7[0], cardItem: cards };
                                      updateHome((prev) => ({ ...prev, "section-7": sec7 }));
                                    }
                                  }
                                }}
                                className="hidden"
                              />
                            </label>

                            <button
                              type="button"
                              onClick={() => {
                                const sec7 = [...(homeObj["section-7"] || [{}])];
                                const cards = (sec7[0].cardItem || []).filter((_: any, idx: number) => idx !== cardIdx);
                                sec7[0] = { ...sec7[0], cardItem: cards };
                                updateHome((prev) => ({ ...prev, "section-7": sec7 }));
                              }}
                              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete photo"
                            >
                              <Trash2 size={13} /> Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* TAB: Video Setup */}
          {activeTab === "video" && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-5 shadow-xs">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#102a4c] flex items-center gap-2">
                      <i className="bi bi-camera-video-fill text-[#1a5d9c]" /> Campus Introduction Video
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Automated video setup for home section. Select or upload your intro video.
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                    Automated Video Mode
                  </span>
                </div>

                {(() => {
                  const secVid = homeObj["section-video"]?.[0] || {};
                  const sec8 = homeObj["section-8"]?.[0] || {};
                  const DEFAULT_VIDEO = "/Videos/IPSIntroVideo.mp4";
                  let videoUrlVal = secVid.introFileUrl || secVid.videoUrl || sec8.introFileUrl || sec8.videoUrl;
                  if (!videoUrlVal || videoUrlVal === "/IPSIntroVideo.mp4") {
                    videoUrlVal = DEFAULT_VIDEO;
                  }

                  const updateVideoData = (updates: Record<string, any>) => {
                    updateHome((prev) => {
                      const prevVid = prev["section-video"]?.[0] || {};
                      const prevSec8 = prev["section-8"]?.[0] || {};
                      const newVid = { ...prevVid, ...updates };
                      const newSec8 = { ...prevSec8, ...updates };
                      return {
                        ...prev,
                        "section-video": [newVid],
                        "section-8": [newSec8],
                      };
                    });
                  };

                  const eyebrowVal = secVid.eyebrow || sec8.videoEyebrow || "Discover IPS";
                  const titleVal = secVid.title || secVid.heading || sec8.videoTitle || "Experience life at Indian Public School";
                  const descVal = secVid.description || sec8.videoDescription || "Take a look at the campus, learning spaces and student life.";
                  const autoPlayVal = secVid.autoPlay ?? sec8.autoPlay ?? true;
                  const loopVal = secVid.loop ?? sec8.loop ?? true;
                  const mutedVal = secVid.muted ?? sec8.muted ?? true;
                  const controlsVal = secVid.controls ?? sec8.controls ?? true;

                  return (
                    <div className="space-y-5">
                      {/* Video File Selection Box */}
                      <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          Active Intro Video File URL
                        </label>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                          <input
                            type="text"
                            disabled
                            readOnly
                            placeholder="e.g. https://res.cloudinary.com/.../IPSIntroVideo.mp4"
                            value={videoUrlVal}
                            onChange={(e) => updateVideoData({ introFileUrl: e.target.value, videoUrl: e.target.value })}
                            className="flex-1 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed px-3.5 py-2.5 text-xs font-mono outline-none shadow-2xs select-all"
                          />

                          <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            {/* Option 1: Choose from Gallery */}
                            <button
                              type="button"
                              onClick={() => setGalleryPickerTarget("introVideo")}
                              className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 text-xs font-bold transition shadow-xs cursor-pointer"
                            >
                              <ImageIcon size={16} /> Choose from Gallery
                            </button>

                            {/* Option 2: Upload from Local Device */}
                            <label className="flex items-center justify-center gap-1.5 rounded-xl bg-[#1a5d9c] hover:bg-[#102a4c] text-white px-4 py-2.5 text-xs font-bold transition shadow-xs cursor-pointer">
                              {uploadingCard === "video" ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                              <span>Upload from Local</span>
                              <input
                                type="file"
                                accept="video/mp4,video/webm,video/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setUploadingCard("video");
                                    try {
                                      const url = await uploadImage(file, "Videos", "indian-public-school/assets/Videos");
                                      if (url) {
                                        updateVideoData({ introFileUrl: url, videoUrl: url });
                                      }
                                    } catch (err) {
                                      console.error("Video upload failed:", err);
                                    } finally {
                                      setUploadingCard(null);
                                    }
                                  }
                                }}
                                className="hidden"
                              />
                            </label>

                            {/* Delete Button */}
                            {videoUrlVal && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm("Are you sure you want to remove the intro video?")) {
                                    updateVideoData({ introFileUrl: "", videoUrl: "" });
                                  }
                                }}
                                className="flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-bold text-red-600 hover:bg-red-100 transition cursor-pointer"
                                title="Remove Video"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Live Video Preview */}
                      {videoUrlVal && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                              Live Automated Video Preview
                            </label>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                              {videoUrlVal.includes("cloudinary.com") ? "Hosted on Cloudinary" : "Active Video Asset"}
                            </span>
                          </div>
                          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 aspect-video max-h-72 flex items-center justify-center shadow-md">
                            <video
                              key={videoUrlVal}
                              controls
                              autoPlay
                              muted
                              loop
                              playsInline
                              className="h-full w-full object-contain"
                            >
                              <source src={videoUrlVal} type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                          </div>
                        </div>
                      )}

                      {/* Collapsible Advanced Customizations */}
                      <details className="group rounded-2xl border border-slate-200 bg-slate-50/50 transition">
                        <summary className="flex items-center justify-between px-4 py-3 text-xs font-bold text-slate-600 cursor-pointer select-none">
                          <span>Advanced Customizations (Titles, Eyebrow &amp; Player Controls)</span>
                          <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                        </summary>
                        <div className="px-4 pb-4 pt-1 space-y-4 border-t border-slate-200/60">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-slate-600">Eyebrow Tagline</label>
                              <input
                                type="text"
                                value={eyebrowVal}
                                onChange={(e) => updateVideoData({ eyebrow: e.target.value, videoEyebrow: e.target.value })}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-[#1a5d9c]"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-slate-600">Main Title</label>
                              <input
                                type="text"
                                value={titleVal}
                                onChange={(e) => updateVideoData({ title: e.target.value, heading: e.target.value, videoTitle: e.target.value })}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-[#1a5d9c]"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-600">Description</label>
                            <textarea
                              rows={2}
                              value={descVal}
                              onChange={(e) => updateVideoData({ description: e.target.value, videoDescription: e.target.value })}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#1a5d9c]"
                            />
                          </div>

                          <div className="grid gap-2 sm:grid-cols-2">
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition">
                              <input
                                type="checkbox"
                                checked={autoPlayVal}
                                onChange={(e) => updateVideoData({ autoPlay: e.target.checked })}
                                className="rounded text-[#1a5d9c] focus:ring-[#1a5d9c]"
                              />
                              <span>AutoPlay Video on Load</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition">
                              <input
                                type="checkbox"
                                checked={loopVal}
                                onChange={(e) => updateVideoData({ loop: e.target.checked })}
                                className="rounded text-[#1a5d9c] focus:ring-[#1a5d9c]"
                              />
                              <span>Loop Video Continuously</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition">
                              <input
                                type="checkbox"
                                checked={mutedVal}
                                onChange={(e) => updateVideoData({ muted: e.target.checked })}
                                className="rounded text-[#1a5d9c] focus:ring-[#1a5d9c]"
                              />
                              <span>Mute Audio by Default</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition">
                              <input
                                type="checkbox"
                                checked={controlsVal}
                                onChange={(e) => updateVideoData({ controls: e.target.checked })}
                                className="rounded text-[#1a5d9c] focus:ring-[#1a5d9c]"
                              />
                              <span>Show Player Controls</span>
                            </label>
                          </div>
                        </div>
                      </details>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* TAB: Section 8 */}
          {activeTab === "sec8" && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-sm font-bold text-[#102a4c] flex items-center gap-2">
                    <i className="bi bi-mortarboard-fill text-[#1a5d9c]" /> Section 7: Our Courses ({(homeObj["section-8"]?.[0]?.cardItem || []).length} Level Cards)
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        openGalleryPicker((url) => {
                          const currentCards = [...(homeObj["section-8"]?.[0]?.cardItem || [])];
                          currentCards.push({ title: "New Level", heading: "New Level", description: "Course level details", fileUrl: url, imageUrl: url });
                          const sec8 = [...(homeObj["section-8"] || [{}])];
                          sec8[0] = { ...sec8[0], cardItem: currentCards };
                          updateHome((prev) => ({ ...prev, "section-8": sec8 }));
                        }, "Select Photo for Course Level from Gallery");
                      }}
                      className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition shadow-2xs"
                    >
                      <ImageIcon size={14} className="text-amber-600" /> Choose from Gallery
                    </button>
                    <button
                      type="button"
                      onClick={() => addItemToSection("section-8", { title: "New Level", heading: "New Level", description: "Course level details", fileUrl: "", imageUrl: "" })}
                      className="flex items-center gap-1 rounded-xl bg-[#1a5d9c] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#102a4c]"
                    >
                      <Plus size={14} /> Add Course Level
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {(Array.isArray(homeObj["section-8"]?.[0]?.cardItem) ? homeObj["section-8"][0].cardItem : []).map((course: any, idx: number) => {
                    const cardImgUrl = course.fileUrl || course.imageUrl || "";
                    const isCardUploading = uploadingCard === `sec8-${idx}`;

                    return (
                      <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2.5 shadow-2xs">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                          <span className="text-[11px] font-bold text-slate-400">Course Level #{idx + 1}</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveItemInSection("section-8", idx, "up")}
                              disabled={idx === 0}
                              className="text-slate-400 hover:text-slate-700 disabled:opacity-30"
                            >
                              <ArrowUp size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveItemInSection("section-8", idx, "down")}
                              disabled={idx === (homeObj["section-8"]?.[0]?.cardItem || []).length - 1}
                              className="text-slate-400 hover:text-slate-700 disabled:opacity-30"
                            >
                              <ArrowDown size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteItemFromSection("section-8", idx)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Course Level Title</label>
                          <input
                            type="text"
                            value={course.title || course.heading || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              const sec8 = [...(homeObj["section-8"] || [{}])];
                              const cards = [...(sec8[0].cardItem || [])];
                              cards[idx] = { ...cards[idx], title: val, heading: val };
                              sec8[0] = { ...sec8[0], cardItem: cards };
                              updateHome((prev) => ({ ...prev, "section-8": sec8 }));
                            }}
                            className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-bold outline-none focus:border-[#1a5d9c]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Course Description</label>
                          <textarea
                            rows={2}
                            value={course.description || ""}
                            onChange={(e) => {
                              const sec8 = [...(homeObj["section-8"] || [{}])];
                              const cards = [...(sec8[0].cardItem || [])];
                              cards[idx] = { ...cards[idx], description: e.target.value };
                              sec8[0] = { ...sec8[0], cardItem: cards };
                              updateHome((prev) => ({ ...prev, "section-8": sec8 }));
                            }}
                            className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs outline-none focus:border-[#1a5d9c]"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Image Path / URL (Disabled)</label>
                          <input
                            type="text"
                            value={cardImgUrl}
                            disabled
                            readOnly
                            placeholder="No image attached"
                            className="w-full rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-mono text-slate-500 cursor-not-allowed outline-none select-all"
                          />
                        </div>

                        {/* Image Preview & Upload */}
                        <div className="space-y-1.5 pt-1">
                          {cardImgUrl ? (
                            <div className="relative h-24 w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-900 group">
                              <img src={cardImgUrl} alt={course.title || "Course"} className="h-full w-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    openGalleryPicker((url) => {
                                      const sec8 = [...(homeObj["section-8"] || [{}])];
                                      const cards = [...(sec8[0].cardItem || [])];
                                      cards[idx] = { ...cards[idx], fileUrl: url, imageUrl: url };
                                      sec8[0] = { ...sec8[0], cardItem: cards };
                                      updateHome((prev) => ({ ...prev, "section-8": sec8 }));
                                    }, `Choose Image for ${course.title || "Course Level"}`);
                                  }}
                                  className="rounded-md bg-amber-500 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-amber-600 flex items-center gap-1 shadow-sm cursor-pointer"
                                >
                                  <ImageIcon size={11} /> Gallery
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const sec8 = [...(homeObj["section-8"] || [{}])];
                                    const cards = [...(sec8[0].cardItem || [])];
                                    cards[idx] = { ...cards[idx], fileUrl: "", imageUrl: "" };
                                    sec8[0] = { ...sec8[0], cardItem: cards };
                                    updateHome((prev) => ({ ...prev, "section-8": sec8 }));
                                  }}
                                  className="rounded-md bg-rose-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-rose-700 flex items-center gap-1 shadow-sm cursor-pointer"
                                >
                                  <Trash2 size={11} /> Remove
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex h-24 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400">
                              <ImageIcon size={20} className="text-slate-300 mb-1" />
                              <span className="text-[11px] font-medium">No image attached</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                openGalleryPicker((url) => {
                                  const sec8 = [...(homeObj["section-8"] || [{}])];
                                  const cards = [...(sec8[0].cardItem || [])];
                                  cards[idx] = { ...cards[idx], fileUrl: url, imageUrl: url };
                                  sec8[0] = { ...sec8[0], cardItem: cards };
                                  updateHome((prev) => ({ ...prev, "section-8": sec8 }));
                                }, `Choose Image for ${course.title || "Course Level"}`);
                              }}
                              className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg border border-amber-300 bg-amber-50 py-1.5 text-[11px] font-bold text-amber-800 hover:bg-amber-100 transition-colors shadow-2xs"
                              title="Choose existing photo from Cloudinary Gallery"
                            >
                              <ImageIcon size={13} className="text-amber-600" /> Choose from Gallery
                            </button>

                            <label className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 bg-slate-50 py-1.5 text-[11px] font-bold text-[#1a5d9c] hover:bg-blue-50 transition-colors">
                              {isCardUploading ? (
                                <>
                                  <Loader2 size={13} className="animate-spin text-[#1a5d9c]" /> Uploading...
                                </>
                              ) : (
                                <>
                                  <UploadCloud size={13} /> {cardImgUrl ? "Change Upload" : "Upload Image"}
                                </>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                disabled={isCardUploading}
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setUploadingCard(`sec8-${idx}`);
                                    try {
                                      const url = await uploadImage(file);
                                      if (url) {
                                        const sec8 = [...(homeObj["section-8"] || [{}])];
                                        const cards = [...(sec8[0].cardItem || [])];
                                        cards[idx] = { ...cards[idx], fileUrl: url, imageUrl: url };
                                        sec8[0] = { ...sec8[0], cardItem: cards };
                                        updateHome((prev) => ({ ...prev, "section-8": sec8 }));
                                      }
                                    } finally {
                                      setUploadingCard(null);
                                      e.target.value = "";
                                    }
                                  }
                                }}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB: Section 9 */}
          {activeTab === "sec9" && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
                <h3 className="text-sm font-bold text-[#102a4c] flex items-center gap-2">
                  <i className="bi bi-person-badge-fill text-[#1a5d9c]" /> Section 8: Best CBSE School / Director Message
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Heading"
                    value={homeObj["section-9"]?.[0]?.heading || ""}
                    onChange={(e) => {
                      const sec9 = [...(homeObj["section-9"] || [{}])];
                      sec9[0] = { ...sec9[0], heading: e.target.value };
                      updateHome((prev) => ({ ...prev, "section-9": sec9 }));
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none"
                  />
                  <input
                    type="text"
                    placeholder="SubHeading"
                    value={homeObj["section-9"]?.[0]?.subHeading || ""}
                    onChange={(e) => {
                      const sec9 = [...(homeObj["section-9"] || [{}])];
                      sec9[0] = { ...sec9[0], subHeading: e.target.value };
                      updateHome((prev) => ({ ...prev, "section-9": sec9 }));
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none"
                  />
                </div>
                <textarea
                  rows={4}
                  placeholder="Description"
                  value={homeObj["section-9"]?.[0]?.description || ""}
                  onChange={(e) => {
                    const sec9 = [...(homeObj["section-9"] || [{}])];
                    sec9[0] = { ...sec9[0], description: e.target.value };
                    updateHome((prev) => ({ ...prev, "section-9": sec9 }));
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none"
                />

                {/* Director Photo */}
                <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                  <span className="text-[11px] font-bold text-slate-700 block">Director / Intro Photo</span>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Image Path / URL (Disabled)</label>
                    <input
                      type="text"
                      value={homeObj["section-9"]?.[0]?.fileUrls?.[0] || ""}
                      disabled
                      readOnly
                      placeholder="No image attached"
                      className="w-full rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-mono text-slate-500 cursor-not-allowed outline-none select-all"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    {homeObj["section-9"]?.[0]?.fileUrls?.[0] && (
                      <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-slate-200 bg-slate-900 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={homeObj["section-9"][0].fileUrls[0]} alt="Director" className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          openGalleryPicker((url) => {
                            const sec9 = [...(homeObj["section-9"] || [{}])];
                            sec9[0] = { ...sec9[0], fileUrls: [url] };
                            updateHome((prev) => ({ ...prev, "section-9": sec9 }));
                          }, "Pick Director Photo from Gallery");
                        }}
                        className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition shadow-2xs"
                      >
                        <ImageIcon size={13} className="text-amber-600" /> Pick from Gallery
                      </button>
                      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-bold text-[#1a5d9c] hover:bg-blue-50">
                        <UploadCloud size={14} /> Upload Director Photo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const url = await uploadImage(file);
                              if (url) {
                                const sec9 = [...(homeObj["section-9"] || [{}])];
                                sec9[0] = { ...sec9[0], fileUrls: [url] };
                                updateHome((prev) => ({ ...prev, "section-9": sec9 }));
                              }
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium">
              Editing <strong className="text-[#1a5d9c]">{EDITOR_TABS.find((t) => t.id === activeTab)?.label || activeTab}</strong> — edits update the live datasource instantly.
            </span>
            {saveSuccess && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 animate-in fade-in duration-200">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {saveSuccess}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCloseModal}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || isSavingLocal || uploading}
              className={`flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold text-white shadow-md transition cursor-pointer ${
                saveSuccess
                  ? "bg-emerald-700 hover:bg-emerald-800"
                  : "bg-emerald-600 hover:bg-emerald-700"
              } disabled:opacity-50`}
            >
              {saving || isSavingLocal ? <span className="animate-spin">⏳</span> : null}
              <span>{saveSuccess ? "✓ Saved & Published" : "Save & Publish Layout"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* LIVE POPUP PREVIEW OVERLAY (shows exactly how it will appear on the live site after applying) */}
      <AnimatePresence>
        {showLivePopUpPreview && (
          <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
            {/* Top Toolbar notification */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1010] bg-slate-900 border border-blue-400/40 text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-3">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-extrabold text-blue-100">
                LIVE SITE PREVIEW MODE (How popup appears after apply)
              </span>
              <button
                type="button"
                onClick={() => setShowLivePopUpPreview(false)}
                className="bg-red-600 hover:bg-red-500 text-white font-black text-xs px-3 py-1 rounded-full border border-red-400/40 cursor-pointer shadow-md"
              >
                Close Preview
              </button>
            </div>

            {/* Backdrop mock web content */}
            <div
              className="fixed inset-0 pointer-events-none opacity-30 bg-cover bg-center filter blur-xs"
              style={{ backgroundImage: `url(${getAssetUrl(currentPopupBanner.imageUrl || "/assets/Settings/Home/POP_UP_IMAGE.jpeg")})` }}
            />

            {/* Live Popup Banner Preview Component using exact popup code */}
            <div className="relative z-[1005] w-full max-w-5xl flex items-center justify-center my-auto">
              {/* Concept 1 */}
              {(currentPopupBanner.bannerStyle === "concept1" || !currentPopupBanner.bannerStyle) && (
                <div className="relative w-[92vw] sm:w-[88vw] max-w-5xl h-[88vh] md:h-[80vh] max-h-[92vh] bg-[#070e24]/95 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border-2 border-blue-400/80 shadow-[0_0_45px_rgba(59,130,246,0.5),inset_0_0_20px_rgba(59,130,246,0.25)] backdrop-blur-xl flex flex-col md:flex-row items-stretch gap-4 sm:gap-6 overflow-y-auto md:overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowLivePopUpPreview(false)}
                    className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 size-8 sm:size-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition border border-white/20"
                  >
                    <i className="bi bi-x-lg text-xs" />
                  </button>
                  <div className="w-full md:w-1/2 h-[42vh] sm:h-[48vh] md:h-full shrink-0 rounded-xl sm:rounded-2xl overflow-hidden bg-slate-950/80 border border-blue-400/30 flex items-center justify-center p-2">
                    <img src={getAssetUrl(currentPopupBanner.imageUrl || "/assets/Settings/Home/POP_UP_IMAGE.jpeg")} alt="Preview" className="w-full h-full object-contain drop-shadow-xl" />
                  </div>
                  <div className="w-full md:w-1/2 flex flex-col justify-center space-y-3 sm:space-y-4 px-1 py-1 md:py-0 overflow-y-auto md:overflow-visible shrink-0 md:shrink">
                    <span className="text-[10px] sm:text-xs font-black tracking-[0.25em] text-blue-400">ENQUIRY</span>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight font-[var(--font-display)]">{currentPopupBanner.title || "Enquiry"}</h2>
                    <div className="w-12 sm:w-14 h-1.5 bg-amber-400 rounded-full" />
                    <p className="text-xs sm:text-sm text-blue-200/90 font-medium">{currentPopupBanner.subtitle || "Indian Public School, Sambalpur"}</p>
                    <button className="bg-amber-400 text-slate-950 font-black text-xs sm:text-sm px-6 py-3 rounded-full shadow-lg">{currentPopupBanner.enquiryButtonText || "Enquire Now"}</button>
                  </div>
                </div>
              )}

              {/* Concept 2 */}
              {currentPopupBanner.bannerStyle === "concept2" && (
                <div className="relative w-[92vw] sm:w-[88vw] max-w-5xl h-[88vh] md:h-[80vh] max-h-[92vh] bg-[#051326] text-white rounded-2xl sm:rounded-3xl border border-blue-400/30 shadow-2xl overflow-y-auto md:overflow-hidden flex flex-col md:flex-row items-stretch">
                  <div className="w-full md:w-1/2 h-[42vh] sm:h-[48vh] md:h-full bg-slate-950 flex items-center justify-center p-3 shrink-0 border-b md:border-b-0 md:border-r border-blue-900/50">
                    <img src={getAssetUrl(currentPopupBanner.imageUrl || "/assets/Settings/Home/POP_UP_IMAGE.jpeg")} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                  <div className="w-full md:w-1/2 p-5 sm:p-8 bg-[#07162c] flex flex-col justify-center items-center text-center space-y-4 overflow-y-auto flex-1">
                    <div className="space-y-1 max-w-sm sm:max-w-md mx-auto">
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight font-[var(--font-display)]">{currentPopupBanner.title || "Enquiry"}</h2>
                      <div className="w-12 h-1 bg-blue-500/80 rounded-full mx-auto my-1" />
                      {currentPopupBanner.subtitle && <p className="text-xs sm:text-sm text-blue-200/90 font-medium">{currentPopupBanner.subtitle}</p>}
                    </div>
                    <div className="w-full max-w-sm sm:max-w-md mx-auto text-left space-y-2.5 [&_form>div:first-child]:grid-cols-1 [&_form>div:first-child]:gap-3 [&_label]:text-blue-100 [&_label]:font-bold [&_label]:text-xs [&_input]:bg-white [&_input]:border-slate-300 [&_input]:text-slate-900 [&_input]:placeholder:text-slate-400 [&_input]:rounded-lg [&_input]:font-medium [&_input]:h-10 [&_textarea]:bg-white [&_textarea]:border-slate-300 [&_textarea]:text-slate-900 [&_textarea]:rounded-lg [&_button[role=combobox]]:bg-white [&_button[role=combobox]]:text-slate-900 [&_button[role=combobox]]:h-10 [&_button[role=combobox]]:rounded-lg">
                      <AdmissionEnquiryForm onClose={() => setShowLivePopUpPreview(false)} />
                      <p className="text-[11px] text-blue-200/70 text-center pt-1 font-medium">* Privacy: We respect your details & data privacy.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Concept 3 */}
              {currentPopupBanner.bannerStyle === "concept3" && (
                <div className="relative w-[92vw] sm:w-[88vw] max-w-5xl h-[90vh] md:h-[80vh] max-h-[92vh] bg-[#06142a] text-white rounded-2xl sm:rounded-3xl border border-blue-400/40 shadow-2xl overflow-y-auto md:overflow-hidden flex flex-col md:flex-row items-stretch">
                  <button onClick={() => setShowLivePopUpPreview(false)} className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 size-8 sm:size-9 rounded-full bg-slate-900 text-white flex items-center justify-center border border-white/20"><i className="bi bi-x-lg text-xs" /></button>
                  <div className="w-full md:w-1/2 h-[32vh] sm:h-[40vh] md:h-full bg-slate-950 flex items-center justify-center p-2 overflow-hidden border-b md:border-b-0 md:border-r border-blue-900/50 shrink-0">
                    <img src={getAssetUrl(currentPopupBanner.imageUrl || "/assets/Settings/Home/POP_UP_IMAGE.jpeg")} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                  <div className="w-full md:w-1/2 p-4 sm:p-6 md:p-8 bg-[#091b38] flex flex-col justify-start md:justify-center overflow-y-auto flex-1 h-auto md:h-full pb-6">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white leading-tight">{currentPopupBanner.title || "Enquiry"}</h2>
                    <p className="text-[11px] sm:text-xs text-blue-200/90 pb-3">{currentPopupBanner.subtitle || "Indian Public School, Sambalpur"}</p>
                    <div className="bg-[#0b1b36] p-4 sm:p-5 rounded-2xl border border-blue-400/30 shadow-2xl text-white space-y-2.5 sm:space-y-3 [&_label]:text-amber-300 [&_label]:font-extrabold [&_label]:text-xs [&_label]:tracking-wide [&_input]:bg-[#040b1a] [&_input]:border-blue-400/40 [&_input]:text-white [&_input]:placeholder:text-blue-300/40 [&_input]:rounded-xl [&_input]:focus:border-amber-400 [&_input]:focus:ring-2 [&_input]:focus:ring-amber-400/20 [&_textarea]:bg-[#040b1a] [&_textarea]:border-blue-400/40 [&_textarea]:text-white [&_textarea]:placeholder:text-blue-300/40 [&_textarea]:rounded-xl [&_button[role=combobox]]:bg-[#040b1a] [&_button[role=combobox]]:border-blue-400/40 [&_button[role=combobox]]:text-white [&_button[type=submit]]:bg-gradient-to-r [&_button[type=submit]]:from-amber-400 [&_button[type=submit]]:via-yellow-400 [&_button[type=submit]]:to-amber-500 [&_button[type=submit]]:text-slate-950 [&_button[type=submit]]:font-black [&_button[type=submit]]:shadow-lg [&_button[type=submit]]:shadow-amber-500/25 [&_button[type=submit]]:border-0 [&_button[type=submit]]:rounded-xl">
                      <AdmissionEnquiryForm onSuccess={() => setShowLivePopUpPreview(false)} onClose={() => setShowLivePopUpPreview(false)} />
                    </div>
                  </div>
                </div>
              )}

              {/* Concept 4 */}
              {currentPopupBanner.bannerStyle === "concept4" && (
                <div className="relative w-[92vw] sm:w-[88vw] max-w-5xl h-[88vh] md:h-[80vh] max-h-[92vh] bg-gradient-to-br from-[#060c22] via-[#091536] to-[#040817] text-white rounded-2xl sm:rounded-[32px] p-4 sm:p-6 md:p-9 border-2 border-amber-400/80 shadow-[0_0_55px_rgba(251,191,36,0.4)] backdrop-blur-2xl flex flex-col md:flex-row items-stretch gap-4 sm:gap-8 overflow-y-auto md:overflow-hidden">
                  <button onClick={() => setShowLivePopUpPreview(false)} className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 size-9 sm:size-10 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400 flex items-center justify-center"><i className="bi bi-x-lg text-xs sm:text-sm" /></button>
                  <div className="w-full md:w-1/2 h-[42vh] sm:h-[48vh] md:h-full rounded-xl sm:rounded-2xl border-2 border-amber-400/40 bg-slate-950 overflow-hidden flex items-center justify-center p-2 shadow-2xl shrink-0">
                    <img src={getAssetUrl(currentPopupBanner.imageUrl || "/assets/Settings/Home/POP_UP_IMAGE.jpeg")} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                  <div className="w-full md:w-1/2 flex flex-col justify-center space-y-3 sm:space-y-4 px-1 py-1 md:py-0 overflow-y-auto md:overflow-visible shrink-0 md:shrink">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <i className="bi bi-trophy-fill text-amber-400 text-2xl sm:text-3xl drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
                      <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-amber-300">ENQUIRY</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight font-[var(--font-display)]">{currentPopupBanner.title || "Enquiry"}</h2>
                    <div className="w-14 sm:w-16 h-1.5 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full" />
                    <p className="text-xs sm:text-sm font-semibold text-amber-100/80">{currentPopupBanner.subtitle || "Build Your Child's Brighter Future"}</p>
                    <button className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs sm:text-sm px-6 py-3 rounded-full shadow-lg shadow-amber-500/30">{currentPopupBanner.enquiryButtonText || "Enquire Now"}</button>
                  </div>
                </div>
              )}

              {/* Default Classic Poster Card (card, full-bleed, side-by-side) */}
              {(currentPopupBanner.bannerStyle === "card" || currentPopupBanner.bannerStyle === "full-bleed" || currentPopupBanner.bannerStyle === "side-by-side") && (
                <div className="relative w-[92vw] sm:w-[88vw] max-w-5xl h-[88vh] md:h-[80vh] max-h-[90vh] bg-slate-950 text-white rounded-2xl sm:rounded-3xl border border-white/20 shadow-2xl flex flex-col justify-between overflow-hidden">
                  <div className="w-full flex-1 min-h-0 bg-slate-950 flex items-center justify-center p-2 sm:p-3 overflow-hidden">
                    <img src={getAssetUrl(currentPopupBanner.imageUrl || "/assets/Settings/Home/POP_UP_IMAGE.jpeg")} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                  <div className="shrink-0 bg-slate-900/95 border-t border-slate-800 px-3.5 py-2.5 sm:px-5 sm:py-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
                    <div>
                      <h2 className="text-xs sm:text-sm font-extrabold text-white">{currentPopupBanner.title || "Enquiry"}</h2>
                      <p className="text-[10px] sm:text-[11px] font-bold text-amber-400">{currentPopupBanner.subtitle || "Indian Public School, Sambalpur"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="bg-blue-600 text-white font-extrabold text-xs px-4 py-2 rounded-full">{currentPopupBanner.enquiryButtonText || "Enquire Now"}</button>
                      <button onClick={() => setShowLivePopUpPreview(false)} className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs px-3.5 py-2 rounded-full border border-slate-700">{currentPopupBanner.closeButtonText || "Close"}</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>

      <CloudinaryGalleryModal
        isOpen={isGalleryOpen || Boolean(galleryPickerTarget) || Boolean(galleryPickerCallback)}
        onClose={() => {
          setIsGalleryOpen(false);
          setGalleryPickerTarget(null);
          setGalleryPickerCallback(null);
        }}
        onSelectImage={(url) => {
          if (url) {
            if (galleryPickerCallback) {
              galleryPickerCallback(url);
              setGalleryPickerCallback(null);
            } else if (galleryPickerTarget === "introVideo") {
              updateHome((prev: any) => {
                const prevVid = prev["section-video"]?.[0] || {};
                const prevSec8 = prev["section-8"]?.[0] || {};
                return {
                  ...prev,
                  "section-video": [{ ...prevVid, introFileUrl: url, videoUrl: url }],
                  "section-8": [{ ...prevSec8, introFileUrl: url, videoUrl: url }],
                };
              });
            } else if (galleryPickerTarget === "videoPoster") {
              updateHome((prev: any) => {
                const prevVid = prev["section-video"]?.[0] || {};
                const prevSec8 = prev["section-8"]?.[0] || {};
                return {
                  ...prev,
                  "section-video": [{ ...prevVid, poster: url, posterUrl: url }],
                  "section-8": [{ ...prevSec8, poster: url, posterUrl: url }],
                };
              });
            } else {
              updatePopupBannerField("imageUrl", url);
            }
          }
          setIsGalleryOpen(false);
          setGalleryPickerTarget(null);
        }}
        title={
          galleryPickerTarget === "introVideo"
            ? "Select Campus Intro Video from Gallery"
            : galleryPickerTarget === "videoPoster"
            ? "Select Video Poster Thumbnail from Gallery"
            : galleryTitle
        }
      />
    </div>
  );
}
