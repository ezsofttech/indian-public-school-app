"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Link as LinkIcon, X, CheckCircle2, Trash2, Check, Globe, Building2, ShieldCheck, AlertTriangle } from "lucide-react";
import http from "@/lib/http";
import { API_URL } from "@/lib/api-client";
import { formatHref } from "@/lib/utils";

export interface LinkStudioModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingAnchorEl: HTMLAnchorElement | null;
    selectedAnchorEl: HTMLAnchorElement | null;
    linkText: string;
    setLinkText: (val: string) => void;
    linkUrl: string;
    setLinkUrl: (val: string) => void;
    linkTarget: string;
    setLinkTarget: (val: any) => void;
    linkStyle: "text" | "gold-button" | "navy-button" | "outline-button" | "pill-badge";
    setLinkStyle: (style: "text" | "gold-button" | "navy-button" | "outline-button" | "pill-badge") => void;
    applyHyperlink: () => void;
    removeHyperlink: () => void;
    menuItems?: Array<any>;
}

// Recursive parser helper for nested menu items from https://api-ips.ezsoftapp.in/api/v1/menu-items API
function parseMenuItemsRecursively(items: any[], parentTitle = ""): Array<{ title: string; rawTitle: string; url: string }> {
    let result: Array<{ title: string; rawTitle: string; url: string }> = [];
    if (!Array.isArray(items)) return result;

    items.forEach((item) => {
        const isPublished = item.isPublished !== false && String(item.isPublished) !== "false";
        if (!isPublished) return;

        const rawUrl = String(item.targetUrl || item.linkUrl || item.url || item.href || (item.slug ? `/${item.slug}` : "")).trim();
        const url = formatHref(rawUrl);
        const rawTitle = String(item.title || "").trim();
        const displayTitle = parentTitle ? `${parentTitle} ➔ ${rawTitle}` : rawTitle;

        if (url && rawTitle && url !== "#") {
            result.push({ title: displayTitle, rawTitle, url });
        }

        if (Array.isArray(item.subItems) && item.subItems.length > 0) {
            const subParsed = parseMenuItemsRecursively(item.subItems, parentTitle ? `${parentTitle} ➔ ${rawTitle}` : rawTitle);
            result = result.concat(subParsed);
        }
    });

    return result;
}

export const LinkStudioModal: React.FC<LinkStudioModalProps> = ({
    isOpen,
    onClose,
    editingAnchorEl,
    selectedAnchorEl,
    linkText,
    setLinkText,
    linkUrl,
    setLinkUrl,
    linkTarget,
    setLinkTarget,
    linkStyle,
    setLinkStyle,
    applyHyperlink,
    removeHyperlink,
    menuItems: propMenuItems,
}) => {
    const [linkMode, setLinkMode] = useState<"internal" | "external">("internal");
    const [rawApiItems, setRawApiItems] = useState<any[]>([]);
    const [loadingMenu, setLoadingMenu] = useState<boolean>(false);
    const [securityNotice, setSecurityNotice] = useState<string>("");

    // Determine link mode when modal opens or linkUrl changes initially
    useEffect(() => {
        if (!isOpen) return;
        const clean = (linkUrl || "").trim().toLowerCase();
        if (clean.startsWith("http://") || clean.startsWith("https://") || clean.startsWith("//") || clean.startsWith("mailto:") || clean.startsWith("tel:")) {
            setLinkMode("external");
        } else {
            setLinkMode("internal");
        }
    }, [isOpen]);

    // Fetch dynamic menu items from https://api-ips.ezsoftapp.in/api/v1/menu-items?publishedOnly=true
    useEffect(() => {
        if (!isOpen) return;
        let isMounted = true;

        const fetchDynamicMenu = async () => {
            setLoadingMenu(true);
            try {
                const res = await http.get(`${API_URL}/menu-items?publishedOnly=true`);
                const items = res.data?.data ?? res.data ?? [];
                if (isMounted && Array.isArray(items) && items.length > 0) {
                    setRawApiItems(items);
                }
            } catch (e) {
                // Ignore API error gracefully
            } finally {
                if (isMounted) setLoadingMenu(false);
            }
        };

        fetchDynamicMenu();
        return () => {
            isMounted = false;
        };
    }, [isOpen]);

    // Combine and recursively parse menuItems from API response & props
    const dynamicMenuItems = useMemo(() => {
        const rawList = propMenuItems && propMenuItems.length > 0 ? propMenuItems : rawApiItems;
        const parsed = parseMenuItemsRecursively(rawList);

        // Deduplicate by URL
        const unique: Array<{ title: string; rawTitle: string; url: string }> = [];
        const seenUrls = new Set<string>();

        parsed.forEach((item) => {
            if (!seenUrls.has(item.url)) {
                seenUrls.add(item.url);
                unique.push(item);
            }
        });

        return unique;
    }, [propMenuItems, rawApiItems]);

    // Security sanitizer for external URLs
    const sanitizeExternalUrl = (raw: string): string => {
        let trimmed = raw.trim();
        if (!trimmed) return "";

        // Strip accidental leading slashes before domain or protocol
        trimmed = trimmed.replace(/^\/+(?=(?:https?:|\/\/|www\.|\w+\.\w+))/i, "");
        trimmed = trimmed.replace(/^https?:\/+(?!\/)/i, (m) => (m.toLowerCase().startsWith("https") ? "https://" : "http://"));

        // Block dangerous script protocols
        const lower = trimmed.toLowerCase();
        if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("vbscript:") || lower.startsWith("blob:")) {
            setSecurityNotice("Security blocked dangerous script protocol");
            return "";
        }

        // Auto-fix domain to https://
        if (
            !lower.startsWith("http://") &&
            !lower.startsWith("https://") &&
            !lower.startsWith("//") &&
            !lower.startsWith("mailto:") &&
            !lower.startsWith("tel:") &&
            !lower.startsWith("#")
        ) {
            trimmed = `https://${trimmed.replace(/^\/+/, "")}`;
        }

        setSecurityNotice("");
        return trimmed;
    };

    const handleApply = () => {
        if (linkMode === "external") {
            const cleanUrl = sanitizeExternalUrl(linkUrl);
            if (!cleanUrl && linkUrl) {
                return; // Block submission if security error
            }
            setLinkUrl(cleanUrl);
            if (!linkTarget || linkTarget === "_self") {
                setLinkTarget("_blank");
            }
        }
        applyHyperlink();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex items-center justify-between bg-gradient-to-r from-[#102a4c] to-[#1a5d9c] px-6 py-4 text-white">
                    <div className="flex items-center gap-2.5">
                        <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 backdrop-blur-md text-amber-400">
                            <LinkIcon size={18} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white">
                                {editingAnchorEl ? "Edit Hyperlink & Redirect Target" : "Create Hyperlink & Redirect Target"}
                            </h3>
                            <p className="text-xs text-blue-200 font-medium">Configure text, destination link & button presentation</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl p-1.5 text-blue-200 hover:bg-white/10 hover:text-white transition cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="max-h-[75vh] overflow-y-auto p-6 space-y-4 text-slate-700">
                    {/* Link Text Field */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            Display Link Text <span className="text-slate-400 font-normal">(Anchor Text)</span>
                        </label>
                        <input
                            type="text"
                            value={linkText}
                            onChange={(e) => setLinkText(e.target.value)}
                            placeholder="e.g. Click Here to Apply, Read Admissions Criteria..."
                            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-[#1a5d9c] focus:bg-white focus:ring-2 focus:ring-blue-100 transition"
                        />
                    </div>

                    {/* URL Type Selector: Internal vs External */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Destination Link Type
                        </label>
                        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl border border-slate-200 bg-slate-100">
                            <button
                                type="button"
                                onClick={() => setLinkMode("internal")}
                                className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                                    linkMode === "internal"
                                        ? "bg-[#1a5d9c] text-white shadow-md"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                                }`}
                            >
                                <Building2 size={14} />
                                <span>Internal Site Page</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setLinkMode("external");
                                    if (!linkTarget || linkTarget === "_self") {
                                        setLinkTarget("_blank");
                                    }
                                }}
                                className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                                    linkMode === "external"
                                        ? "bg-[#1a5d9c] text-white shadow-md"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                                }`}
                            >
                                <Globe size={14} />
                                <span>External Web URL</span>
                            </button>
                        </div>
                    </div>

                    {/* Dynamic URL Inputs */}
                    {linkMode === "internal" ? (
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700">
                                Select Internal Page <span className="text-slate-400 font-normal">(Live menu-items API response)</span>
                            </label>

                            {/* Dropdown from API menuItems including nested subItems */}
                            <select
                                value={dynamicMenuItems.some((m) => m.url === linkUrl) ? linkUrl : ""}
                                onChange={(e) => {
                                    const selectedUrl = e.target.value;
                                    setLinkUrl(selectedUrl);
                                    const selectedItem = dynamicMenuItems.find((m) => m.url === selectedUrl);
                                    if (selectedItem && (!linkText || linkText === "https://")) {
                                        setLinkText(selectedItem.rawTitle);
                                    }
                                }}
                                className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#1a5d9c] focus:ring-2 focus:ring-blue-100 shadow-2xs cursor-pointer"
                            >
                                <option value="" disabled>
                                    {loadingMenu ? "-- Loading menuItems from API... --" : "-- Select Internal Page / Menu Item --"}
                                </option>
                                {dynamicMenuItems.map((item) => (
                                    <option key={`${item.url}-${item.title}`} value={item.url}>
                                        {item.title} ({item.url})
                                    </option>
                                ))}
                            </select>

                            {/* Disabled Input field for Internal Link Path */}
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                                    Internal URL Path (Disabled)
                                </label>
                                <input
                                    type="text"
                                    readOnly
                                    disabled
                                    value={linkUrl}
                                    placeholder="Select an internal page route from dropdown above..."
                                    className="w-full rounded-xl border border-slate-300 bg-slate-100 px-3.5 py-2 text-xs font-mono font-semibold text-slate-500 outline-none cursor-not-allowed select-none"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700">
                                External Destination URL <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={linkUrl}
                                    onChange={(e) => {
                                        setLinkUrl(e.target.value);
                                        setSecurityNotice("");
                                    }}
                                    onBlur={() => {
                                        if (linkUrl) {
                                            const cleaned = sanitizeExternalUrl(linkUrl);
                                            setLinkUrl(cleaned);
                                        }
                                    }}
                                    placeholder="e.g. https://www.example.com, mailto:info@school.edu.in, or tel:+919876543210"
                                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs font-mono font-semibold text-slate-800 outline-none focus:border-[#1a5d9c] focus:bg-white focus:ring-2 focus:ring-blue-100 transition"
                                />
                            </div>

                            {/* Security Sanitation & Status Indicator */}
                            <div className="flex items-center justify-between px-1 text-[11px]">
                                {securityNotice ? (
                                    <span className="flex items-center gap-1 font-bold text-red-600">
                                        <AlertTriangle size={13} /> {securityNotice}
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                                        <ShieldCheck size={13} className="text-emerald-600" />
                                        Secure Link Validation Enabled (Auto https:// & noopener)
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Link Target Toggle */}
                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <div>
                            <p className="text-xs font-bold text-slate-800">Open in New Tab Window</p>
                            <p className="text-[11px] text-slate-500 font-medium">Adds target="_blank" rel="noopener noreferrer"</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setLinkTarget(linkTarget === "_blank" ? "_self" : "_blank")}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                linkTarget === "_blank" ? "bg-[#1a5d9c]" : "bg-slate-300"
                            }`}
                        >
                            <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                    linkTarget === "_blank" ? "translate-x-5" : "translate-x-0"
                                }`}
                            />
                        </button>
                    </div>

                    {/* Link Presentation Style */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Link Presentation & Button Style
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {[
                                {
                                    id: "text",
                                    name: "Standard Text Link",
                                    sub: "School blue text link with underline",
                                },
                                {
                                    id: "gold-button",
                                    name: "Gold CTA Button",
                                    sub: "Amber gold background button with arrow",
                                },
                                {
                                    id: "navy-button",
                                    name: "Navy Action Button",
                                    sub: "Navy blue background button with white text",
                                },
                                {
                                    id: "outline-button",
                                    name: "Outline Border Button",
                                    sub: "Blue outlined button with arrow",
                                },
                                {
                                    id: "pill-badge",
                                    name: "Pill Link Badge",
                                    sub: "Soft sky blue pill badge link",
                                },
                            ].map((st) => (
                                <button
                                    key={st.id}
                                    type="button"
                                    onClick={() => setLinkStyle(st.id as any)}
                                    className={`flex flex-col text-left p-2.5 rounded-2xl border transition-all cursor-pointer ${
                                        linkStyle === st.id
                                            ? "border-[#1a5d9c] bg-blue-50/70 ring-2 ring-blue-500/20 shadow-xs"
                                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full mb-0.5">
                                        <span className="text-xs font-bold text-slate-800">{st.name}</span>
                                        {linkStyle === st.id && <CheckCircle2 size={14} className="text-[#1a5d9c]" />}
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-medium">{st.sub}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Live Preview Box */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-100 p-3">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Live Element Preview</p>
                        <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-center min-h-[48px]">
                            {linkStyle === "gold-button" ? (
                                <a
                                    href="#"
                                    onClick={(e) => e.preventDefault()}
                                    style={{
                                        backgroundColor: "#f4bd4f",
                                        color: "#102a4c",
                                        fontWeight: 700,
                                        padding: "0.65rem 1.35rem",
                                        borderRadius: "0.75rem",
                                        textDecoration: "none",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "0.5rem",
                                        boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                                    }}
                                >
                                    {linkText || "Gold Button Text"} &rarr;
                                </a>
                            ) : linkStyle === "navy-button" ? (
                                <a
                                    href="#"
                                    onClick={(e) => e.preventDefault()}
                                    style={{
                                        backgroundColor: "#102a4c",
                                        color: "#ffffff",
                                        fontWeight: 700,
                                        padding: "0.65rem 1.35rem",
                                        borderRadius: "0.75rem",
                                        textDecoration: "none",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "0.5rem",
                                        boxShadow: "0 2px 5px rgba(16,42,76,0.2)",
                                    }}
                                >
                                    {linkText || "Navy Button Text"} &rarr;
                                </a>
                            ) : linkStyle === "outline-button" ? (
                                <a
                                    href="#"
                                    onClick={(e) => e.preventDefault()}
                                    style={{
                                        border: "2px solid #1a5d9c",
                                        color: "#1a5d9c",
                                        backgroundColor: "#ffffff",
                                        fontWeight: 700,
                                        padding: "0.6rem 1.25rem",
                                        borderRadius: "0.75rem",
                                        textDecoration: "none",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "0.5rem",
                                    }}
                                >
                                    {linkText || "Outline Button Text"} &rarr;
                                </a>
                            ) : linkStyle === "pill-badge" ? (
                                <a
                                    href="#"
                                    onClick={(e) => e.preventDefault()}
                                    style={{
                                        backgroundColor: "#e0f2fe",
                                        color: "#0369a1",
                                        border: "1px solid #bae6fd",
                                        fontWeight: 700,
                                        padding: "0.35rem 0.9rem",
                                        borderRadius: "9999px",
                                        fontSize: "0.85rem",
                                        textDecoration: "none",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "0.35rem",
                                    }}
                                >
                                    <i className="bi bi-link-45deg me-1" /> {linkText || "Pill Badge Text"}
                                </a>
                            ) : (
                                <a
                                    href="#"
                                    onClick={(e) => e.preventDefault()}
                                    style={{ color: "#1a5d9c", textDecoration: "underline", fontWeight: 600 }}
                                >
                                    {linkText || "Standard Text Hyperlink"}
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-between bg-slate-50 border-t border-slate-200 px-6 py-3.5">
                    {editingAnchorEl || selectedAnchorEl ? (
                        <button
                            type="button"
                            onClick={removeHyperlink}
                            className="flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-100 transition cursor-pointer"
                        >
                            <Trash2 size={13} />
                            <span>Remove Link</span>
                        </button>
                    ) : (
                        <div />
                    )}

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleApply}
                            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:brightness-110 transition cursor-pointer"
                        >
                            <Check size={14} />
                            <span>{editingAnchorEl ? "Update Link" : "Insert Hyperlink"}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
