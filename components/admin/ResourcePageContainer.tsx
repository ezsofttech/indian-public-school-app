"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import http from "@/lib/http";
import { LoaderCircle, Check } from "lucide-react";
import { AdminShell } from "@/components/admin/layout/admin-shell";
import { ResourceView } from "@/components/admin/tables/AdminResourceTable";
import { RecordDialog } from "@/components/admin/modals/RecordDialog";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import {
  RecordItem,
  ResourceKey,
  PaginationMeta,
  QueryParamsState,
  Resource,
} from "./types/admin.types";
import {
  API_URL,
  resourcePath,
  resources,
  DEFAULT_QUERY,
} from "./config/admin.config";
import {
  itemId,
  asPaginatedPayload,
  asItems,
  flattenMenuItems,
  isSuperAdminRole,
} from "./utils/admin.helpers";

export interface ResourcePageContainerProps {
  resourceKey: ResourceKey;
}

export function ResourcePageContainer({ resourceKey }: ResourcePageContainerProps) {
  const { token, canAccessResource, canUpdateResource, canDeleteResource, isSuperAdmin } = useAuth();
  const { showToast } = useToast();

  const currentResource = useMemo(
    () => resources.find((r) => r.key === resourceKey),
    [resourceKey],
  );

  const [items, setItems] = useState<RecordItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined);
  const [query, setQuery] = useState<QueryParamsState>(DEFAULT_QUERY);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RecordItem | null>(null);
  const [formError, setFormError] = useState("");

  // Additional context data for Pages and Menu Items
  const [allMenuItems, setAllMenuItems] = useState<RecordItem[]>([]);
  const [publishedPages, setPublishedPages] = useState<RecordItem[]>([]);
  const fetchSeqRef = useRef<number>(0);

  const fetchItems = useCallback(
    async (q: QueryParamsState = query) => {
      if (!currentResource) return;
      const seq = ++fetchSeqRef.current;
      setLoading(true);
      if (q.search) setIsSearching(true);

      try {
        const path = resourcePath[resourceKey];
        const params: Record<string, unknown> = {
          page: q.page,
          limit: q.limit,
          search: q.search || undefined,
          sortBy: q.sortBy || undefined,
          sortOrder: q.sortOrder || undefined,
        };

        if (q.filterKey && q.filterValue && q.filterValue !== "All") {
          params[q.filterKey] = q.filterValue;
        }

        const res = await http.get(`${API_URL}/${path}`, {
          params,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (seq !== fetchSeqRef.current) return;

        const paginated = asPaginatedPayload(res.data);
        if (paginated && paginated.items.length > 0) {
          setItems(paginated.items);
          setMeta(paginated.meta);
        } else {
          const list = asItems(res.data);
          setItems(list);
          setMeta({
            page: 1,
            limit: list.length || 10,
            total: list.length,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          });
        }
      } catch (err) {
        if (seq === fetchSeqRef.current) {
          console.error(`Failed to load ${resourceKey}:`, err);
          showToast(`Failed to load ${currentResource.label}.`, "error");
        }
      } finally {
        if (seq === fetchSeqRef.current) {
          setLoading(false);
          setIsSearching(false);
        }
      }
    },
    [currentResource, resourceKey, query, token, showToast],
  );

  const fetchExtraContext = useCallback(async () => {
    if (resourceKey === "pages" || resourceKey === "menu-items") {
      try {
        const [pagesRes, menuRes] = await Promise.all([
          http.get(`${API_URL}/pages`, { params: { isPublished: true, limit: 100 } }),
          http.get(`${API_URL}/menu-items`, { params: { limit: 200 } }),
        ]);
        setPublishedPages(asItems(pagesRes.data));
        setAllMenuItems(flattenMenuItems(asItems(menuRes.data)));
      } catch (err) {
        console.warn("Failed to fetch menu/page context:", err);
      }
    }
  }, [resourceKey]);

  useEffect(() => {
    void fetchItems(query);
    void fetchExtraContext();
  }, [fetchItems, fetchExtraContext, query]);

  const handleQueryChange = (patch: Partial<QueryParamsState>) => {
    const nextQuery = { ...query, ...patch };
    setQuery(nextQuery);
    void fetchItems(nextQuery);
  };

  const handleSave = async (
    values: Record<string, unknown>,
    options?: { keepOpen?: boolean },
  ) => {
    if (!currentResource) return;
    const isEditing = Boolean(editing);
    setSaving(true);
    setFormError("");

    try {
      if (resourceKey === "users") {
        const id = editing ? itemId(editing) : "";
        if (id) {
          const { _id, createdAt, updatedAt, __v, ...cleanValues } = values;
          await http.patch(`${API_URL}/auth/users/${id}`, cleanValues, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } else {
          await http.post(`${API_URL}/auth/register`, values, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      } else {
        const { _id, createdAt, updatedAt, __v, ...rawPayload } = values;
        const payload: Record<string, unknown> = { ...rawPayload };

        if (resourceKey === "menu-items") {
          const title = String(payload.title || "").trim();
          const slug =
            String(payload.slug || "").trim() ||
            title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") ||
            `menu-${Date.now()}`;
          payload.slug = slug;
          if (editing?.menuId) {
            payload.menuId = String(editing.menuId);
          } else {
            payload.menuId = slug;
          }
          if (!payload.menuId) delete payload.menuId;
          if (!editing && payload.isPublished === undefined) {
            payload.isPublished = true;
          }
        }

        if (resourceKey === "pages") {
          const title = String(payload.title || "").trim();
          const slug =
            String(payload.slug || "").trim() ||
            title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") ||
            `page-${Date.now()}`;
          payload.slug = slug;
          if (!payload.targetUrl || String(payload.targetUrl).trim() === "") {
            payload.targetUrl = `/pages/${slug}`;
          }
        }

        const id = editing ? itemId(editing) : "";
        const path =
          resourceKey === "menu-items" && id
            ? `menu-items/${id}`
            : editing
              ? `${resourcePath[resourceKey]}/${id}`
              : resourcePath[resourceKey];

        await http({
          method: editing ? "patch" : "post",
          url: `${API_URL}/${path}`,
          data: payload,
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      showToast(
        isEditing
          ? `${currentResource.label} record updated successfully.`
          : `New ${currentResource.label} record created.`,
        "success",
      );

      if (!options?.keepOpen) {
        setFormOpen(false);
        setEditing(null);
      }
      await fetchItems(query);
      if (resourceKey === "pages" || resourceKey === "menu-items") {
        void fetchExtraContext();
      }
    } catch (reason) {
      let msg = "Unable to save this record.";
      if (http.isAxiosError(reason)) {
        const respData = reason.response?.data as { message?: string | string[] } | undefined;
        msg = respData?.message
          ? Array.isArray(respData.message)
            ? respData.message.join(", ")
            : String(respData.message)
          : reason.message;
      } else if (reason instanceof Error) {
        msg = reason.message;
      }
      setFormError(msg);
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: RecordItem) => {
    if (!currentResource) return;
    if (resourceKey === "school-settings") return;
    if (resourceKey === "users" && isSuperAdminRole(item.role)) {
      alert("Super Admin accounts cannot be deleted directly.");
      return;
    }

    if (!window.confirm(`Delete this ${currentResource.label} item? Associated Cloudinary files will also be removed.`)) {
      return;
    }

    const id = itemId(item);
    setDeletingId(id);

    try {
      const path =
        resourceKey === "users"
          ? `auth/users/${id}`
          : `${resourcePath[resourceKey]}/${id}`;

      await http.delete(`${API_URL}/${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      showToast(`${currentResource.label} item deleted successfully.`, "success");
      await fetchItems(query);
      if (resourceKey === "pages" || resourceKey === "menu-items") {
        void fetchExtraContext();
      }
    } catch (reason) {
      let msg = "Unable to delete record.";
      if (http.isAxiosError(reason)) {
        const respData = reason.response?.data as { message?: string | string[] } | undefined;
        msg = respData?.message
          ? Array.isArray(respData.message)
            ? respData.message.join(", ")
            : String(respData.message)
          : reason.message;
      }
      showToast(msg, "error");
    } finally {
      setDeletingId(null);
    }
  };

  if (!currentResource) {
    return (
      <AdminShell title="Resource Not Found">
        <div className="p-8 text-center text-slate-500">
          Resource &ldquo;{resourceKey}&rdquo; was not recognized.
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title={currentResource.label}
      onRefresh={() => {
        void fetchItems(query);
        void fetchExtraContext();
      }}
    >
      <ResourceView
        resource={currentResource}
        items={items}
        loading={loading}
        isSearching={isSearching}
        deletingId={deletingId}
        query={query}
        meta={meta}
        onQueryChange={handleQueryChange}
        onCreate={() => {
          setEditing(null);
          setFormError("");
          setFormOpen(true);
        }}
        onEdit={(item) => {
          setEditing(item);
          setFormError("");
          setFormOpen(true);
        }}
        onDelete={handleDelete}
        canCreate={resourceKey !== "reviews" && canUpdateResource(resourceKey)}
        canEdit={canUpdateResource(resourceKey)}
        canDelete={canDeleteResource(resourceKey)}
        allMenuItems={allMenuItems}
        token={token}
      />

      {/* Floating Action Feedback */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none items-end">
        {saving && (
          <div className="flex items-center gap-2.5 rounded-2xl bg-[#102a4c] px-4 py-2.5 text-xs font-bold text-white shadow-2xl border border-blue-400/30 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
            <LoaderCircle size={15} className="animate-spin text-amber-400" />
            <span>{editing ? "Updating record in database…" : "Saving new record…"}</span>
          </div>
        )}
        {deletingId && (
          <div className="flex items-center gap-2.5 rounded-2xl bg-red-950 px-4 py-2.5 text-xs font-bold text-white shadow-2xl border border-red-700/50 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
            <LoaderCircle size={15} className="animate-spin text-red-400" />
            <span>Deleting record & linked assets…</span>
          </div>
        )}
      </div>

      {/* Record Dialog for Create / Edit */}
      {formOpen && (
        <RecordDialog
          token={token}
          resource={currentResource}
          record={editing}
          saving={saving}
          formError={formError}
          allSectionPages={publishedPages}
          allMenuItems={allMenuItems}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
            setFormError("");
          }}
          onClearError={() => setFormError("")}
          onSave={handleSave}
        />
      )}
    </AdminShell>
  );
}
