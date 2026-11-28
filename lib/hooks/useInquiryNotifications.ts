"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import http from "@/lib/http";

export interface NotificationRecord extends Record<string, unknown> {
  id?: string;
  publicId?: string;
  _id?: string;
  name?: string;
  inquiryType?: string;
  email?: string;
  contact?: string;
  message?: string;
  isRead?: boolean;
  createdAt?: string;
}

export interface InquiryNotificationState {
  unreadCount: number;
  unreadNotifications: NotificationRecord[];
  isNotificationOpen: boolean;
  setIsNotificationOpen: React.Dispatch<React.SetStateAction<boolean>>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

/**
 * Custom React hook following SOLID principles for Inquiry Notifications.
 *
 * Responsibilities:
 * 1. Single Responsibility: Manages notification state, HTTP sync, and optimistic UI updates.
 * 2. High Performance & Zero Extra Server Load:
 *    - Automatically pauses polling when browser tab is inactive (`document.hidden`).
 *    - Instantly triggers an update when tab regains focus (`window.onfocus`).
 *    - Uses a gentle 60s fallback interval while tab is actively focused.
 * 3. Dependable State Syncing: Fallback parsing for NestJS TransformInterceptor response format.
 */
export function useInquiryNotifications(
  apiUrl: string,
  token?: string,
  inquiriesData?: Record<string, unknown>[],
  onInquiriesUpdated?: () => void
): InquiryNotificationState {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [unreadNotifications, setUnreadNotifications] = useState<NotificationRecord[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);

  const tokenRef = useRef(token);

  const refreshNotifications = useCallback(async () => {
    // Zero Server Load: Skip HTTP requests completely if browser tab is hidden/inactive or no token
    if (typeof document !== "undefined" && document.hidden) {
      return;
    }
    if (!tokenRef.current) {
      setUnreadCount(0);
      setUnreadNotifications([]);
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${tokenRef.current}` };
      const res = await http.get(`${apiUrl}/notifications/unread-count?type=INQUIRY`, { headers });
      const body = res.data;
      let count = 0;
      let itemsList: NotificationRecord[] = [];

      if (body) {
        let rawItems: any[] = [];
        if (Array.isArray(body.data)) {
          rawItems = body.data;
        } else if (Array.isArray(body.items)) {
          rawItems = body.items;
        } else if (Array.isArray(body)) {
          rawItems = body;
        } else if (body.data && Array.isArray(body.data.items)) {
          rawItems = body.data.items;
        }

        if (body.meta && typeof body.meta.unreadCount === "number") {
          count = Number(body.meta.unreadCount);
        } else if (typeof body.unreadCount === "number") {
          count = Number(body.unreadCount);
        } else if (body.data && typeof body.data.unreadCount === "number") {
          count = Number(body.data.unreadCount);
        } else {
          count = rawItems.length;
        }

        itemsList = rawItems.map((item: any) => {
          const meta = item.metadata || {};
          return {
            ...item,
            id: item._id ? String(item._id) : item.id,
            name: meta.name || item.title,
            email: meta.email || "",
            contact: meta.contact || "",
            inquiryType: meta.inquiryType || "General",
            message: item.message || meta.message,
          };
        });
      }

      setUnreadCount(count);
      setUnreadNotifications(itemsList);
    } catch {
      setUnreadCount(0);
      setUnreadNotifications([]);
    }
  }, [apiUrl]);

  useEffect(() => {
    tokenRef.current = token;
    if (token) {
      void refreshNotifications();
    }
  }, [token, refreshNotifications]);

  useEffect(() => {
    if (isNotificationOpen && tokenRef.current) {
      void refreshNotifications();
    }
  }, [isNotificationOpen, refreshNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    if (!id) return;
    try {
      const headers = tokenRef.current ? { Authorization: `Bearer ${tokenRef.current}` } : {};
      await http.patch(`${apiUrl}/notifications/${id}/read`, {}, { headers });

      // Optimistic local state update (0 delay)
      setUnreadNotifications((prev) => prev.filter((item) => String(item.id || item._id || item.publicId) !== id));
      setUnreadCount((prev) => Math.max(0, prev - 1));

      if (onInquiriesUpdated) onInquiriesUpdated();
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  }, [apiUrl, onInquiriesUpdated]);

  const markAllAsRead = useCallback(async () => {
    try {
      const headers = tokenRef.current ? { Authorization: `Bearer ${tokenRef.current}` } : {};
      await http.patch(`${apiUrl}/notifications/mark-all-read?type=INQUIRY`, {}, { headers });

      // Optimistic local state update (0 delay)
      setUnreadNotifications([]);
      setUnreadCount(0);

      if (onInquiriesUpdated) onInquiriesUpdated();
    } catch (err) {
      console.error("Failed to mark all inquiry notifications as read:", err);
    }
  }, [apiUrl, onInquiriesUpdated]);

  // Smart Visibility-Aware Event Listeners & Gentle Polling
  useEffect(() => {
    void refreshNotifications();

    const handleFocus = () => {
      void refreshNotifications();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void refreshNotifications();
      }
    };

    // 60s polling interval ONLY when user is actively looking at tab
    const interval = setInterval(() => {
      if (!document.hidden) {
        void refreshNotifications();
      }
    }, 60000);

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshNotifications]);

  return {
    unreadCount,
    unreadNotifications,
    isNotificationOpen,
    setIsNotificationOpen,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  };
}
