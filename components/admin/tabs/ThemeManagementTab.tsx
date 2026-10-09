"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useTheme, ThemeConfig, DEFAULT_THEME } from "@/components/providers/ThemeProvider";
import { API_URL } from "../config/admin.config";

interface ThemeManagementTabProps {
  token: string;
}

export function ThemeManagementTab({ token }: ThemeManagementTabProps) {
  const { activeTheme, previewTheme, setPreviewTheme, refreshTheme } = useTheme();

  const [themes, setThemes] = useState<ThemeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"gallery" | "customizer">("gallery");

  // Customizer state
  const [editingTheme, setEditingTheme] = useState<ThemeConfig>(DEFAULT_THEME);
  const [originalTheme, setOriginalTheme] = useState<ThemeConfig | null>(null);
  const [customizerMode, setCustomizerMode] = useState<"edit" | "create">("create");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");

  const authHeader = useCallback(() => {
    return { headers: { Authorization: `Bearer ${token}` } };
  }, [token]);

  const fetchThemes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_URL}/theme`);
      const rawList: ThemeConfig[] = res.data.data || res.data || [];
      const seenPresetSlugs = new Set<string>();
      const list = rawList.filter((theme) => {
        if (theme.isPreset && theme.slug) {
          if (seenPresetSlugs.has(theme.slug)) return false;
          seenPresetSlugs.add(theme.slug);
        }
        return true;
      });
      setThemes(list);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load themes from server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchThemes();
  }, [fetchThemes]);

  const handleActivateTheme = async (theme: ThemeConfig, targetPortal?: string) => {
    if (!theme._id) return;
    setSaving(true);
    setError(null);
    try {
      const selectedPortal = targetPortal || theme.portal || "web";
      await axios.patch(`${API_URL}/theme/${theme._id}`, { portal: selectedPortal }, authHeader());
      await axios.post(`${API_URL}/theme/${theme._id}/activate`, {}, authHeader());
      setSuccessMessage(`Activated theme "${theme.name}" for portal: ${selectedPortal.toUpperCase()}`);
      await refreshTheme();
      await fetchThemes();
      setPreviewTheme(null);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to activate theme");
    } finally {
      setSaving(false);
    }
  };

  const handleStartCustomizing = (themeToEdit?: ThemeConfig) => {
    if (themeToEdit) {
      setOriginalTheme(JSON.parse(JSON.stringify(themeToEdit)));
      if (themeToEdit.isPreset) {
        const copy: ThemeConfig = JSON.parse(JSON.stringify(themeToEdit));
        delete (copy as any)._id;
        if (!copy.name.includes("(Customized)")) {
          copy.name = `${themeToEdit.name} (Customized)`;
        }
        copy.slug = `${themeToEdit.slug}-custom-${Date.now().toString().slice(-4)}`;
        copy.isPreset = false;
        copy.isActive = false;
        setEditingTheme(copy);
        setCustomizerMode("create");
        setPreviewTheme(copy);
      } else {
        setEditingTheme(JSON.parse(JSON.stringify(themeToEdit)));
        setCustomizerMode("edit");
        setPreviewTheme(themeToEdit);
      }
    } else {
      setOriginalTheme(null);
      const newCustom: ThemeConfig = {
        name: `Custom Theme ${themes.length + 1} (Customized)`,
        slug: `custom-theme-${Date.now()}`,
        description: "Custom site theme configuration",
        portal: "web",
        isPreset: false,
        isActive: false,
        colors: { ...activeTheme.colors },
        typography: { ...activeTheme.typography },
        layout: { ...activeTheme.layout },
        customCss: activeTheme.customCss || "",
      };
      setEditingTheme(newCustom);
      setCustomizerMode("create");
      setPreviewTheme(newCustom);
    }
    setActiveTab("customizer");
  };

  const handleColorChange = (key: keyof ThemeConfig["colors"], value: string) => {
    const updated = {
      ...editingTheme,
      colors: {
        ...editingTheme.colors,
        [key]: value,
      },
    };
    setEditingTheme(updated);
    setPreviewTheme(updated);
  };

  const handleTypographyChange = (key: keyof ThemeConfig["typography"], value: string) => {
    const updated = {
      ...editingTheme,
      typography: {
        ...editingTheme.typography,
        [key]: value,
      },
    };
    setEditingTheme(updated);
    setPreviewTheme(updated);
  };

  const handleLayoutChange = (key: keyof ThemeConfig["layout"], value: string) => {
    const updated = {
      ...editingTheme,
      layout: {
        ...editingTheme.layout,
        [key]: value,
      },
    };
    setEditingTheme(updated);
    setPreviewTheme(updated);
  };

  const handleSaveTheme = async (andActivate: boolean = true) => {
    if (!editingTheme.name) {
      setError("Theme name is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let savedTheme: ThemeConfig;
      const isCreateMode = customizerMode === "create" || !editingTheme._id;

      if (isCreateMode) {
        // CREATE CASE: Always POST to create a brand new theme entry in DB
        const { _id, ...payload } = editingTheme as any;
        const res = await axios.post(
          `${API_URL}/theme`,
          { ...payload, isPreset: false, isActive: andActivate },
          authHeader()
        );
        savedTheme = res.data.data || res.data;
      } else {
        // MODIFY CASE: Always PATCH to update the existing custom theme entry in DB
        const res = await axios.patch(
          `${API_URL}/theme/${editingTheme._id}`,
          { ...editingTheme, isActive: andActivate ? true : editingTheme.isActive },
          authHeader()
        );
        savedTheme = res.data.data || res.data;
      }

      if (andActivate && savedTheme._id) {
        await axios.post(`${API_URL}/theme/${savedTheme._id}/activate`, {}, authHeader());
      }

      setSuccessMessage(
        isCreateMode
          ? `Created new theme "${savedTheme.name}" successfully!`
          : `Updated theme "${savedTheme.name}" successfully!`
      );
      await refreshTheme();
      await fetchThemes();
      setPreviewTheme(null);
      setActiveTab("gallery");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save theme");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTheme = async (theme: ThemeConfig) => {
    if (!theme._id) return;
    if (theme.isActive) {
      setError("Cannot delete the currently active theme.");
      return;
    }
    if (!confirm(`Are you sure you want to delete theme "${theme.name}"?`)) return;

    setSaving(true);
    setError(null);
    try {
      await axios.delete(`${API_URL}/theme/${theme._id}`, authHeader());
      setSuccessMessage(`Deleted theme "${theme.name}"`);
      await fetchThemes();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete theme");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPresets = async () => {
    if (!confirm("Are you sure you want to reset built-in themes to default presets?")) return;
    setSaving(true);
    setError(null);
    try {
      await axios.post(`${API_URL}/theme/reset-presets`, {}, authHeader());
      setSuccessMessage("Preset themes restored to defaults!");
      await refreshTheme();
      await fetchThemes();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reset presets");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner - Matching Site Navy & Gold Palette */}
      <div className="relative overflow-hidden rounded-3xl bg-[#102a4c] p-6 sm:p-8 text-white shadow-xl border border-[#1a3d6a]">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-[#f4bd4f]/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#f4bd4f]/20 px-3.5 py-1 text-xs font-bold text-[#f4bd4f] backdrop-blur-md border border-[#f4bd4f]/30">
              <i className="bi bi-palette-fill"></i> Site Appearance & Theme Studio
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">Public Web Theme Controller</h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Technical theme controller to <strong>Pick</strong> color swatches, <strong>Apply</strong> live themes, and carry out <strong>Modification</strong> settings across the public website interface.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => handleStartCustomizing()}
              className="inline-flex items-center justify-center gap-2 px-4.5 py-2.5 rounded-xl font-bold bg-[#f4bd4f] text-[#102a4c] hover:bg-[#e2a838] transition-all shadow-lg text-sm whitespace-nowrap shrink-0"
            >
              <i className="bi bi-plus-circle-fill"></i>
              <span>Pick & Create Theme</span>
            </button>
            <button
              onClick={handleResetPresets}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all text-sm border border-white/20 whitespace-nowrap shrink-0"
              title="Reset built-in preset themes"
            >
              <i className="bi bi-arrow-counterclockwise"></i>
              <span>Reset Presets</span>
            </button>
          </div>
        </div>

        {/* Active Theme Bar */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-300 font-medium">Currently Active Live Theme:</span>
            <span className="inline-flex items-center gap-1.5 font-extrabold text-[#f4bd4f] bg-[#f4bd4f]/10 px-3 py-1 rounded-full border border-[#f4bd4f]/30">
              <i className="bi bi-check-circle-fill text-emerald-400"></i>
              {activeTheme.name}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-300">Active Primary:</span>
            <span
              className="h-4 w-6 rounded border border-white/40 shadow-inner"
              style={{ background: activeTheme.colors?.primary || "#102a4c" }}
            />
            <span className="text-slate-300">Active Gold:</span>
            <span
              className="h-4 w-6 rounded border border-white/40 shadow-inner"
              style={{ background: activeTheme.colors?.gold || "#f4bd4f" }}
            />
          </div>
        </div>
      </div>

      {/* Feedback Notifications */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <i className="bi bi-exclamation-triangle-fill text-red-500"></i>
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-xs font-semibold hover:underline">Dismiss</button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center gap-3 text-sm">
          <i className="bi bi-check-circle-fill text-emerald-500"></i>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Controller Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto">
        <button
          onClick={() => {
            setActiveTab("gallery");
            setPreviewTheme(null);
          }}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all whitespace-nowrap shrink-0 ${activeTab === "gallery"
            ? "bg-[#102a4c] text-white shadow-md"
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
        >
          <i className="bi bi-grid-fill"></i>
          <span>Theme Presets Gallery ({themes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("customizer")}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all whitespace-nowrap shrink-0 ${activeTab === "customizer"
            ? "bg-[#102a4c] text-white shadow-md"
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
        >
          <i className="bi bi-sliders"></i>
          <span>Pick & Modification Studio {previewTheme && "(Live Preview Active)"}</span>
        </button>
      </div>

      {/* TAB 1: PRESETS GALLERY */}
      {activeTab === "gallery" && (
        <div className="space-y-6">
          {loading ? (
            <div className="py-20 text-center text-slate-500">
              <i className="bi bi-arrow-repeat text-2xl animate-spin mx-auto mb-3 block text-[#102a4c]"></i>
              Loading themes from database...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {themes.map((theme) => {
                const isActive = Boolean(theme.isActive);
                const isCurrentPreview = previewTheme?.slug === theme.slug;

                return (
                  <div
                    key={theme._id || theme.slug}
                    className={`group relative flex flex-col justify-between rounded-3xl border transition-all duration-300 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-xl ${isActive
                      ? "ring-2 ring-emerald-500 border-emerald-500/50"
                      : isCurrentPreview
                        ? "ring-2 ring-amber-500 border-amber-500/50"
                        : "border-slate-200 dark:border-slate-800 hover:border-[#102a4c]/40"
                      }`}
                  >
                    {/* Theme Card Banner */}
                    <div
                      className="h-28 p-4 flex flex-col justify-between relative"
                      style={{
                        background: theme.colors?.gradientNavy || theme.colors?.primary || "#102a4c",
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-black/20 text-white backdrop-blur-md">
                          <i className="bi bi-tag-fill text-amber-300"></i>
                          {theme.isPreset ? "Built-in Preset" : "Custom Theme"}
                        </span>

                        {isActive ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500 text-white shadow">
                            <i className="bi bi-check-circle-fill"></i> Active Live
                          </span>
                        ) : isCurrentPreview ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500 text-white shadow">
                            <i className="bi bi-eye-fill"></i> Live Previewing
                          </span>
                        ) : null}
                      </div>

                      <div className="text-white">
                        <h3 className="font-extrabold text-lg leading-snug drop-shadow-sm">{theme.name}</h3>
                        <p className="text-xs text-white/80 line-clamp-1">{theme.description || "School Theme Palette"}</p>
                      </div>
                    </div>

                    {/* Color Swatches */}
                    <div className="p-5 space-y-4">
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Palette Swatches</span>
                        <div className="grid grid-cols-5 gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                          <div className="space-y-1 text-center">
                            <div className="h-8 rounded-lg border border-black/10 shadow-inner" style={{ background: theme.colors?.primary }} title={`Primary: ${theme.colors?.primary}`} />
                            <span className="text-[9px] font-bold text-slate-500">Primary</span>
                          </div>
                          <div className="space-y-1 text-center">
                            <div className="h-8 rounded-lg border border-black/10 shadow-inner" style={{ background: theme.colors?.gold }} title={`Gold: ${theme.colors?.gold}`} />
                            <span className="text-[9px] font-bold text-slate-500">Gold</span>
                          </div>
                          <div className="space-y-1 text-center">
                            <div className="h-8 rounded-lg border border-black/10 shadow-inner" style={{ background: theme.colors?.navy }} title={`Navy: ${theme.colors?.navy}`} />
                            <span className="text-[9px] font-bold text-slate-500">Navy</span>
                          </div>
                          <div className="space-y-1 text-center">
                            <div className="h-8 rounded-lg border border-black/10 shadow-inner" style={{ background: theme.colors?.background }} title={`BG: ${theme.colors?.background}`} />
                            <span className="text-[9px] font-bold text-slate-500">BG</span>
                          </div>
                          <div className="space-y-1 text-center">
                            <div className="h-8 rounded-lg border border-black/10 shadow-inner" style={{ background: theme.colors?.card }} title={`Card: ${theme.colors?.card}`} />
                            <span className="text-[9px] font-bold text-slate-500">Card</span>
                          </div>
                        </div>
                      </div>

                      {/* Technical Meta Details & Target Portal Badge */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px]">
                            Radius: {theme.layout?.radius || "0.9rem"}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px]">
                            Font: {(theme.typography?.fontDisplay || "Display").split(",")[0].replace(/"/g, "")}
                          </span>
                        </div>

                        {/* Portal Badge */}
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${theme.portal === "admin"
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800"
                          : theme.portal === "both"
                            ? "bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-300 dark:border-teal-800"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800"
                          }`}>
                          <i className={`bi bi-${theme.portal === "admin" ? "sliders" : theme.portal === "both" ? "layers-fill" : "globe"}`}></i>
                          <span>{theme.portal === "admin" ? "Admin Console" : theme.portal === "both" ? "Web & Admin" : "Public Web"}</span>
                        </span>
                      </div>
                    </div>

                    {/* Controller Action Footer */}
                    <div className="p-3.5 bg-slate-50/90 dark:bg-slate-900/90 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                      {/* Row 1: Target Portal Choice & Live Activation Button */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5 shrink-0 min-w-0">
                          <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 shrink-0">Portal:</span>
                          <select
                            value={theme.portal || "web"}
                            onChange={async (e) => {
                              const newPortal = e.target.value;
                              setThemes(prev => prev.map(t => t._id === theme._id || t.slug === theme.slug ? { ...t, portal: newPortal } : t));
                              if (theme._id) {
                                try {
                                  await axios.patch(`${API_URL}/theme/${theme._id}`, { portal: newPortal }, authHeader());
                                } catch (err) {
                                  console.error("Failed to update portal", err);
                                }
                              }
                            }}
                            className="px-2 py-1 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 outline-none cursor-pointer focus:ring-2 focus:ring-[#102a4c] shrink-0"
                            title="Choose Target Portal before applying"
                          >
                            <option value="web">Web Only</option>
                            {/* <option value="admin">Admin Only</option>
                            <option value="both">Web & Admin</option> */}
                          </select>
                        </div>

                        {!isActive ? (
                          <button
                            onClick={() => handleActivateTheme(theme, theme.portal)}
                            disabled={saving}
                            className="px-3 py-1 rounded-lg text-[11px] font-extrabold bg-[#102a4c] hover:bg-[#1a3d6a] text-white shadow-xs transition-all flex items-center gap-1 shrink-0 whitespace-nowrap"
                          >
                            <i className="bi bi-check2-circle"></i>
                            <span>Apply Live</span>
                          </button>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1 shrink-0 whitespace-nowrap">
                            <i className="bi bi-check-circle-fill text-emerald-500"></i> Active Live
                          </span>
                        )}
                      </div>

                      {/* Row 2: Secondary Tool Actions (Preview, Modify, Delete) */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                        <div className="flex items-center gap-1.5">
                          <a
                            href={theme._id ? `/?preview_theme_id=${theme._id}` : "/"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-all flex items-center gap-1 cursor-pointer"
                            title="Redirect to Public Web Portal to preview theme"
                          >
                            <i className="bi bi-box-arrow-up-right"></i>
                            <span>Preview</span>
                          </a>

                          <button
                            onClick={() => handleStartCustomizing(theme)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-all flex items-center gap-1"
                            title="Modify Theme Settings"
                          >
                            <i className="bi bi-pencil-square"></i>
                            <span>Modify</span>
                          </button>
                        </div>

                        {!theme.isPreset && theme._id && (
                          <button
                            onClick={() => handleDeleteTheme(theme)}
                            disabled={isActive || saving}
                            className="px-2 py-1 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 border border-slate-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all disabled:opacity-40"
                            title="Delete Theme"
                          >
                            <i className="bi bi-trash-fill"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PICK & MODIFICATION STUDIO */}
      {activeTab === "customizer" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Technical Customization Controls (7 Columns) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
              {/* Clean Single-Line Header Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="space-y-0.5">
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <i className="bi bi-palette-fill text-[#102a4c]"></i>
                    <span>{customizerMode === "edit" ? `Modifying "${editingTheme.name}"` : "Create & Pick Theme Colors"}</span>
                  </h2>
                  <p className="text-xs text-slate-500">Pick swatches and modify parameters. Live preview updates on the right.</p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-stretch sm:self-auto justify-end">
                  <button
                    onClick={() => handleStartCustomizing()}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm whitespace-nowrap shrink-0 border border-slate-200 dark:border-slate-700"
                  >
                    <i className="bi bi-plus-circle-fill text-[#102a4c] dark:text-amber-400"></i>
                    <span>New Theme</span>
                  </button>

                  <button
                    onClick={() => handleSaveTheme(true)}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-1.5 px-4.5 py-2.5 rounded-xl text-xs font-extrabold bg-[#102a4c] hover:bg-[#1a3d6a] text-white transition-all shadow-md whitespace-nowrap shrink-0"
                  >
                    <i className="bi bi-floppy-fill text-[#f4bd4f]"></i>
                    <span>{customizerMode === "create" ? "Create & Save Theme" : "Update Theme"}</span>
                  </button>
                </div>
              </div>

              {/* Theme Identification & Portal Scope */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Theme Title</label>
                  <input
                    type="text"
                    value={editingTheme.name}
                    onChange={(e) => setEditingTheme({ ...editingTheme, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#102a4c] outline-none font-semibold"
                    placeholder="e.g. Royal Sapphire"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Target Portal</label>
                  <select
                    value={editingTheme.portal || "web"}
                    onChange={(e) => setEditingTheme({ ...editingTheme, portal: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                  >
                    <option value="web">Public Website Only (web)</option>
                    <option value="admin">Admin Console Only (admin)</option>
                    <option value="both">Both Website & Admin (both)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                  <input
                    type="text"
                    value={editingTheme.description || ""}
                    onChange={(e) => setEditingTheme({ ...editingTheme, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#102a4c] outline-none"
                    placeholder="Theme description"
                  />
                </div>
              </div>

              {/* COLOR PICKERS & SWATCHES */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-extrabold text-[#102a4c] dark:text-[#f4bd4f] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <i className="bi bi-paint-bucket"></i> Pick Swatch & Brand Variables
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Primary Color Picker */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">Primary Color</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="h-6 w-8 rounded-md border border-slate-300 shadow-inner" style={{ background: editingTheme.colors.primary }} />
                        <input
                          type="color"
                          value={editingTheme.colors.primary.startsWith("#") ? editingTheme.colors.primary : "#102a4c"}
                          onChange={(e) => handleColorChange("primary", e.target.value)}
                          className="h-7 w-7 rounded-lg border border-slate-300 cursor-pointer bg-transparent p-0 overflow-hidden"
                          title="Click to pick primary color"
                        />
                      </div>
                    </div>
                    <input
                      type="text"
                      value={editingTheme.colors.primary}
                      onChange={(e) => handleColorChange("primary", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-semibold"
                    />
                  </div>

                  {/* Gold Color Picker */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">Gold / Accent Color</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="h-6 w-8 rounded-md border border-slate-300 shadow-inner" style={{ background: editingTheme.colors.gold }} />
                        <input
                          type="color"
                          value={editingTheme.colors.gold.startsWith("#") ? editingTheme.colors.gold : "#f4bd4f"}
                          onChange={(e) => handleColorChange("gold", e.target.value)}
                          className="h-7 w-7 rounded-lg border border-slate-300 cursor-pointer bg-transparent p-0 overflow-hidden"
                          title="Click to pick gold color"
                        />
                      </div>
                    </div>
                    <input
                      type="text"
                      value={editingTheme.colors.gold}
                      onChange={(e) => handleColorChange("gold", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-semibold"
                    />
                  </div>

                  {/* Navy Color Picker */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">Navy / Brand Deep</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="h-6 w-8 rounded-md border border-slate-300 shadow-inner" style={{ background: editingTheme.colors.navy }} />
                        <input
                          type="color"
                          value={editingTheme.colors.navy.startsWith("#") ? editingTheme.colors.navy : "#102a4c"}
                          onChange={(e) => handleColorChange("navy", e.target.value)}
                          className="h-7 w-7 rounded-lg border border-slate-300 cursor-pointer bg-transparent p-0 overflow-hidden"
                          title="Click to pick navy color"
                        />
                      </div>
                    </div>
                    <input
                      type="text"
                      value={editingTheme.colors.navy}
                      onChange={(e) => handleColorChange("navy", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-semibold"
                    />
                  </div>

                  {/* Page Background Picker */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">Page Background</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="h-6 w-8 rounded-md border border-slate-300 shadow-inner" style={{ background: editingTheme.colors.background }} />
                        <input
                          type="color"
                          value={editingTheme.colors.background.startsWith("#") ? editingTheme.colors.background : "#f8fafc"}
                          onChange={(e) => handleColorChange("background", e.target.value)}
                          className="h-7 w-7 rounded-lg border border-slate-300 cursor-pointer bg-transparent p-0 overflow-hidden"
                          title="Click to pick background color"
                        />
                      </div>
                    </div>
                    <input
                      type="text"
                      value={editingTheme.colors.background}
                      onChange={(e) => handleColorChange("background", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-semibold"
                    />
                  </div>

                  {/* Card Surface Picker */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">Card Surface</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="h-6 w-8 rounded-md border border-slate-300 shadow-inner" style={{ background: editingTheme.colors.card }} />
                        <input
                          type="color"
                          value={editingTheme.colors.card.startsWith("#") ? editingTheme.colors.card : "#ffffff"}
                          onChange={(e) => handleColorChange("card", e.target.value)}
                          className="h-7 w-7 rounded-lg border border-slate-300 cursor-pointer bg-transparent p-0 overflow-hidden"
                          title="Click to pick card color"
                        />
                      </div>
                    </div>
                    <input
                      type="text"
                      value={editingTheme.colors.card}
                      onChange={(e) => handleColorChange("card", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-semibold"
                    />
                  </div>

                  {/* Gradient Navy */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5 sm:col-span-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">Hero Gradient CSS</span>
                      <span className="h-6 w-12 rounded-md border border-slate-300 shadow-inner shrink-0" style={{ background: editingTheme.colors.gradientNavy }} />
                    </div>
                    <input
                      type="text"
                      value={editingTheme.colors.gradientNavy}
                      onChange={(e) => handleColorChange("gradientNavy", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-semibold"
                      placeholder="linear-gradient(140deg, ...)"
                    />
                  </div>
                </div>
              </div>

              {/* ELEMENT SHAPE CONTROLLERS */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-extrabold text-[#102a4c] dark:text-[#f4bd4f] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <i className="bi bi-[#102a4c] bi-aspect-ratio-fill"></i> Element Shapes & Geometry
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Logo Shape */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      <i className="bi bi-shield-square me-1"></i> Logo Shape
                    </label>
                    <select
                      value={editingTheme.layout.logoShape || "circle"}
                      onChange={(e) => {
                        const val = e.target.value;
                        const rad = val === "circle" ? "50%" : val === "rounded" ? "0.75rem" : val === "square" ? "0px" : "9999px 0px 9999px 0px";
                        const updated = {
                          ...editingTheme,
                          layout: { ...editingTheme.layout, logoShape: val, logoRadius: rad },
                        };
                        setEditingTheme(updated);
                        setPreviewTheme(updated);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                    >
                      <option value="circle">Circle Badge (50%)</option>
                      <option value="rounded">Rounded Box (12px)</option>
                      <option value="square">Square Sharp (0px)</option>
                      <option value="leaf">Leaf Crest (Diagonal Curve)</option>
                    </select>
                  </div>

                  {/* Button Shape */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      <i className="bi bi-menu-button-wide me-1"></i> Button Shape
                    </label>
                    <select
                      value={editingTheme.layout.btnShape || "pill"}
                      onChange={(e) => {
                        const val = e.target.value;
                        const rad = val === "pill" ? "9999px" : val === "rounded" ? "0.75rem" : val === "soft" ? "0.375rem" : "0px";
                        const updated = {
                          ...editingTheme,
                          layout: { ...editingTheme.layout, btnShape: val, btnRadius: rad },
                        };
                        setEditingTheme(updated);
                        setPreviewTheme(updated);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                    >
                      <option value="pill">Full Capsule / Pill (9999px)</option>
                      <option value="rounded">Modern Rounded (12px)</option>
                      <option value="soft">Soft Curved (6px)</option>
                      <option value="sharp">Sharp Rectangle (0px)</option>
                    </select>
                  </div>

                  {/* Card Shape */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      <i className="bi bi-card-heading me-1"></i> Card & Container Shape
                    </label>
                    <select
                      value={editingTheme.layout.cardShape || "rounded"}
                      onChange={(e) => {
                        const val = e.target.value;
                        const rad = val === "extra-rounded" ? "1.5rem" : val === "rounded" ? "1rem" : val === "soft" ? "0.5rem" : "0px";
                        const updated = {
                          ...editingTheme,
                          layout: { ...editingTheme.layout, cardShape: val, cardRadius: rad },
                        };
                        setEditingTheme(updated);
                        setPreviewTheme(updated);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                    >
                      <option value="extra-rounded">Extra Rounded (24px)</option>
                      <option value="rounded">Standard Rounded (16px)</option>
                      <option value="soft">Soft Subtle (8px)</option>
                      <option value="sharp">Sharp Flat (0px)</option>
                    </select>
                  </div>

                  {/* Badge Shape */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      <i className="bi bi-tag me-1"></i> Badge & Tag Shape
                    </label>
                    <select
                      value={editingTheme.layout.badgeShape || "pill"}
                      onChange={(e) => {
                        const val = e.target.value;
                        const rad = val === "pill" ? "9999px" : val === "soft" ? "0.375rem" : "0px";
                        const updated = {
                          ...editingTheme,
                          layout: { ...editingTheme.layout, badgeShape: val, badgeRadius: rad },
                        };
                        setEditingTheme(updated);
                        setPreviewTheme(updated);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                    >
                      <option value="pill">Pill Capsule (9999px)</option>
                      <option value="soft">Soft Badge (6px)</option>
                      <option value="sharp">Sharp Tag (0px)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* TYPOGRAPHY & LAYOUT RADIUS MODIFICATION */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-extrabold text-[#102a4c] dark:text-[#f4bd4f] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <i className="bi bi-fonts"></i> Typography Settings
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Heading Font */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Display Heading Font</label>
                    <select
                      value={editingTheme.typography.fontDisplay}
                      onChange={(e) => handleTypographyChange("fontDisplay", e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                    >
                      <option value='"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif'>Plus Jakarta Sans (Clean & Pretty - Recommended)</option>
                      <option value='"Outfit", sans-serif'>Outfit Sans (Modern Bold)</option>
                      <option value='"Inter", sans-serif'>Inter (Minimalist Standard)</option>
                      <option value='"Poppins", sans-serif'>Poppins (Friendly Rounded)</option>
                      <option value='"Fraunces", ui-serif, Georgia, serif'>Fraunces Serif (Classic Academic)</option>
                      <option value='"Playfair Display", serif'>Playfair Display (Luxury Serif)</option>
                    </select>
                  </div>

                  {/* Body Font */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Body Text Font</label>
                    <select
                      value={editingTheme.typography.fontSans}
                      onChange={(e) => handleTypographyChange("fontSans", e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                    >
                      <option value='"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif'>Plus Jakarta Sans (Clean & Pretty - Recommended)</option>
                      <option value='"Inter", sans-serif'>Inter (Minimalist Standard)</option>
                      <option value='"Outfit", sans-serif'>Outfit Sans (Modern UI)</option>
                      <option value='"Poppins", sans-serif'>Poppins (Friendly Rounded)</option>
                      <option value='"Roboto", sans-serif'>Roboto (Standard Clean)</option>
                      <option value='"Fraunces", ui-serif, Georgia, serif'>Fraunces Serif (Classic Academic)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: REAL-TIME PUBLIC WEB UI LIVE PREVIEW MOCKUP (5 Columns, Sticky) */}
          <div className="lg:col-span-5 sticky top-6 space-y-4">
            <div className="flex flex-col gap-2.5 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#102a4c] dark:text-white">
                  <i className="bi bi-display"></i> Preview
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-[#f4bd4f] text-[#102a4c] hover:bg-[#e2a838] transition-all whitespace-nowrap shadow-2xs"
                    title="Open live website in a new tab"
                  >
                    <i className="bi bi-[#102a4c] bi-box-arrow-up-right"></i>
                    <span>Open Live Site</span>
                  </a>

                  <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => setPreviewDevice("desktop")}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 whitespace-nowrap ${previewDevice === "desktop" ? "bg-[#102a4c] text-white shadow-2xs" : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60"
                        }`}
                      title="Desktop View"
                    >
                      <i className="bi bi-pc-display"></i>
                      <span>Desktop</span>
                    </button>
                    <button
                      onClick={() => setPreviewDevice("mobile")}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 whitespace-nowrap ${previewDevice === "mobile" ? "bg-[#102a4c] text-white shadow-2xs" : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60"
                        }`}
                      title="Mobile View"
                    >
                      <i className="bi bi-phone"></i>
                      <span>Mobile</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Simulated Live Public Website Frame */}
            <div
              className={`mx-auto rounded-3xl border border-slate-300 dark:border-slate-700 shadow-2xl overflow-hidden transition-all duration-300 max-h-[750px] overflow-y-auto ${previewDevice === "mobile" ? "max-w-[340px]" : "w-full"
                }`}
              style={{
                background: editingTheme.colors.background || "#f8fafc",
                color: editingTheme.colors.foreground || "#0f172a",
                fontFamily: editingTheme.typography.fontSans,
              }}
            >
              {/* Fake Browser Top Bar */}
              <div className="bg-[#0a1c36] px-4 py-2 flex items-center justify-between text-white text-[11px] sticky top-0 z-20 shadow-xs">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </div>
                <span className="text-slate-300 text-[10px] font-mono">indianpublicschool.edu.in</span>
                <i className="bi bi-shield-check text-[#f4bd4f]"></i>
              </div>

              {/* Website Header Bar with Logo & Enquiry Now Button */}
              <div
                className="px-4 py-3 flex items-center justify-between border-b border-black/10 sticky top-[31px] z-10 shadow-xs"
                style={{ background: editingTheme.colors.card || "#ffffff" }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-7 w-7 flex items-center justify-center font-black text-white text-xs shadow-sm transition-all"
                    style={{
                      background: editingTheme.colors.primary || "#102a4c",
                      borderRadius: editingTheme.layout.logoRadius || (editingTheme.layout.logoShape === "circle" ? "50%" : editingTheme.layout.logoShape === "rounded" ? "0.75rem" : editingTheme.layout.logoShape === "square" ? "0px" : "50%"),
                    }}
                  >
                    IPS
                  </div>
                  <span
                    className="font-extrabold text-xs tracking-tight"
                    style={{ fontFamily: editingTheme.typography.fontDisplay }}
                  >
                    Indian Public School
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="hidden md:inline text-[10px] font-semibold text-slate-500">Home</span>
                  <span className="hidden md:inline text-[10px] font-semibold text-slate-500">About</span>
                  <button
                    className="px-3 py-1 text-[11px] font-extrabold shadow-sm transition-all text-white"
                    style={{
                      background: editingTheme.colors.primary || "#102a4c",
                      borderRadius: editingTheme.layout.btnRadius || (editingTheme.layout.btnShape === "pill" ? "9999px" : editingTheme.layout.btnShape === "rounded" ? "0.75rem" : editingTheme.layout.btnShape === "soft" ? "0.375rem" : "0px"),
                    }}
                  >
                    Enquiry Now
                  </button>
                </div>
              </div>

              {/* Website Hero Banner Section */}
              <div
                className="p-6 text-white text-center space-y-3 relative overflow-hidden"
                style={{
                  background: editingTheme.colors.gradientNavy || editingTheme.colors.primary || "#102a4c",
                }}
              >
                <span
                  className="inline-block px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-white/10 text-[#f4bd4f] border border-white/20 transition-all"
                  style={{
                    borderRadius: editingTheme.layout.badgeRadius || (editingTheme.layout.badgeShape === "pill" ? "9999px" : editingTheme.layout.badgeShape === "soft" ? "0.375rem" : "0px"),
                  }}
                >
                  Admissions Open 2026-27
                </span>

                <h4
                  className="text-lg font-bold leading-snug"
                  style={{ fontFamily: editingTheme.typography.fontDisplay }}
                >
                  Nurturing Excellence & Academic Leadership
                </h4>

                <p className="text-[11px] text-white/80 max-w-xs mx-auto leading-relaxed">
                  Empowering tomorrow's leaders with holistic education and world-class campus facilities.
                </p>

                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    className="px-4 py-1.5 text-xs font-bold shadow-md transition-all text-white"
                    style={{
                      background: editingTheme.colors.primary || "#102a4c",
                      borderRadius: editingTheme.layout.btnRadius || (editingTheme.layout.btnShape === "pill" ? "9999px" : editingTheme.layout.btnShape === "rounded" ? "0.75rem" : editingTheme.layout.btnShape === "soft" ? "0.375rem" : "0px"),
                    }}
                  >
                    Explore Programs
                  </button>

                  <button
                    className="px-3 py-1.5 text-xs font-bold border border-white/40 bg-white/10 text-white backdrop-blur-sm transition-all"
                    style={{
                      borderRadius: editingTheme.layout.btnRadius || (editingTheme.layout.btnShape === "pill" ? "9999px" : editingTheme.layout.btnShape === "rounded" ? "0.75rem" : editingTheme.layout.btnShape === "soft" ? "0.375rem" : "0px"),
                    }}
                  >
                    Contact Us
                  </button>
                </div>
              </div>

              {/* Homepage Content Blocks */}
              <div className="p-4 space-y-4">
                {/* Notice Ticker Card */}
                <div
                  className="p-3.5 border shadow-sm space-y-2 transition-all"
                  style={{
                    background: editingTheme.colors.card || "#ffffff",
                    borderColor: editingTheme.colors.border || "#e2e8f0",
                    borderRadius: editingTheme.layout.cardRadius || (editingTheme.layout.cardShape === "extra-rounded" ? "1.5rem" : editingTheme.layout.cardShape === "rounded" ? "1rem" : editingTheme.layout.cardShape === "soft" ? "0.5rem" : "0px"),
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-bold"
                      style={{
                        color: editingTheme.colors.foreground || "#0f172a",
                        fontFamily: editingTheme.typography.fontDisplay,
                      }}
                    >
                      Latest Notice Board
                    </span>
                    <span
                      className="text-[9px] font-extrabold px-2 py-0.5 transition-all"
                      style={{
                        background: editingTheme.colors.accent || "#fef08a",
                        color: editingTheme.colors.accentForeground || "#854d0e",
                        borderRadius: editingTheme.layout.badgeRadius || (editingTheme.layout.badgeShape === "pill" ? "9999px" : editingTheme.layout.badgeShape === "soft" ? "0.375rem" : "0px"),
                      }}
                    >
                      NEW
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    Annual Sports & Academic Excellence events schedule published.
                  </p>
                </div>

                {/* Admission Enquiry Blue Form Box */}
                <div
                  className="p-4 text-white space-y-3 transition-all shadow-md"
                  style={{
                    background: editingTheme.colors.navy || "#102a4c",
                    borderRadius: editingTheme.layout.cardRadius || "1rem",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-[#f4bd4f]">
                      <i className="bi bi-pen me-1"></i> Quick Admission Enquiry Box
                    </span>
                    <span
                      className="text-[9px] font-extrabold px-2 py-0.5 bg-white/10 text-white border border-white/20"
                      style={{
                        borderRadius: editingTheme.layout.badgeRadius || "9999px",
                      }}
                    >
                      Instant Response
                    </span>
                  </div>

                  <div className="space-y-1.5 text-slate-800">
                    <input
                      type="text"
                      readOnly
                      value="Student Name"
                      className="w-full px-3 py-1.5 rounded-lg text-[10px] bg-white border-0 outline-none"
                    />
                    <input
                      type="text"
                      readOnly
                      value="Parent Contact / Phone"
                      className="w-full px-3 py-1.5 rounded-lg text-[10px] bg-white border-0 outline-none"
                    />
                  </div>

                  <button
                    className="w-full py-2 text-xs font-extrabold text-[#102a4c] shadow-sm transition-all"
                    style={{
                      background: editingTheme.colors.gold || "#f4bd4f",
                      borderRadius: editingTheme.layout.btnRadius || "9999px",
                    }}
                  >
                    Submit Admission Enquiry
                  </button>
                </div>

                {/* Principal Message Card Preview */}
                <div
                  className="p-3.5 border shadow-sm flex items-center gap-3 transition-all"
                  style={{
                    background: editingTheme.colors.card || "#ffffff",
                    borderColor: editingTheme.colors.border || "#e2e8f0",
                    borderRadius: editingTheme.layout.cardRadius || "1rem",
                  }}
                >
                  <div
                    className="h-10 w-10 shrink-0 bg-slate-300 flex items-center justify-center font-bold text-slate-600 text-xs shadow-inner"
                    style={{
                      borderRadius: editingTheme.layout.logoRadius || "50%",
                    }}
                  >
                    <i className="bi bi-person-fill text-lg"></i>
                  </div>

                  <div className="space-y-0.5 text-left min-w-0">
                    <h5 className="font-extrabold text-xs truncate">Principal's Welcome Address</h5>
                    <p className="text-[10px] text-slate-500 line-clamp-1">Providing quality education & values since 2005.</p>
                  </div>
                </div>
              </div>

              {/* Full Public Website Footer Preview */}
              <div
                className="p-5 border-t text-[11px] space-y-4 transition-all"
                style={{
                  background: editingTheme.colors.navyDeep || editingTheme.colors.navy || "#0a1c36",
                  color: "#94a3b8",
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  {/* Brand & Motto */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-6 w-6 flex items-center justify-center font-black text-white text-[10px] shadow-sm"
                        style={{
                          background: editingTheme.colors.gold || "#f4bd4f",
                          color: editingTheme.colors.navyDeep || "#102a4c",
                          borderRadius: editingTheme.layout.logoRadius || "50%",
                        }}
                      >
                        IPS
                      </div>
                      <span className="font-extrabold text-white text-xs">Indian Public School</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Empowering students through academic excellence, innovation, and character building.
                    </p>
                  </div>

                  {/* Quick Links & Footer CTA Button */}
                  <div className="space-y-2">
                    <h6 className="font-bold text-white text-[10px] uppercase tracking-wider text-[#f4bd4f]">Quick Portal Navigation</h6>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-300">
                      <span>Home</span> &bull;
                      <span>About Us</span> &bull;
                      <span>Academics</span> &bull;
                      <span>Gallery</span> &bull;
                      <span>Contact</span>
                    </div>
                    <button
                      className="mt-1 px-3 py-1.5 text-[10px] font-extrabold text-[#102a4c] shadow-sm transition-all"
                      style={{
                        background: editingTheme.colors.gold || "#f4bd4f",
                        borderRadius: editingTheme.layout.btnRadius || "9999px",
                      }}
                    >
                      Enquiry & Contact Us
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 text-center text-[10px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-1">
                  <span>Indian Public School &copy; 2026 &bull; All Rights Reserved</span>
                  <span className="text-[#f4bd4f] font-semibold">CBSE Affiliation Portal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
