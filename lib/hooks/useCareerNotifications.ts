"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import http from "@/lib/http";

export interface CareerNotificationRecord extends Record<string, unknown> {
  id?: string;
  publicId?: string;
  _id?: string;
  applicationNo?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  postTitle?: string;
  isRead?: boolean;
  status?: string;
  createdAt?: string;
}

export interface CareerNotificationState {
  unreadCount: number;
  unreadNotifications: CareerNotificationRecord[];
  isNotificationOpen: boolean;
  setIsNotificationOpen: React.Dispatch<React.SetStateAction<boolean>>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

export function useCareerNotifications(
  apiUrl: string,
  token?: string,
  applicationsData?: Record<string, unknown>[],
  onApplicationsUpdated?: () => void
): CareerNotificationState {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [unreadNotifications, setUnreadNotifications] = useState<CareerNotificationRecord[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);

  const tokenRef = useRef(token);

  const refreshNotifications = useCallback(async () => {
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
      const res = await http.get(`${apiUrl}/notifications/unread-count?type=CAREER_APPLICATION`, { headers });
      const body = res.data;
      let count = 0;
      let itemsList: CareerNotificationRecord[] = [];

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
            fullName: meta.fullName || meta.name || item.title,
            email: meta.email || "",
            phone: meta.phone || meta.contact || "",
            postTitle: meta.postTitle || item.title,
            applicationNo: meta.applicationNo || "APP-REF",
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

  const markAsRead = useCallback(
    async (id: string) => {
      if (!id) return;
      try {
        const headers = tokenRef.current ? { Authorization: `Bearer ${tokenRef.current}` } : {};
        await http.patch(`${apiUrl}/notifications/${id}/read`, {}, { headers });

        setUnreadNotifications((prev) =>
          prev.filter((item) => String(item.id || item._id || item.publicId) !== id)
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));

        if (onApplicationsUpdated) onApplicationsUpdated();
      } catch (err) {
        console.error("Failed to mark application notification as read:", err);
      }
    },
    [apiUrl, onApplicationsUpdated]
  );

  const markAllAsRead = useCallback(async () => {
    try {
      const headers = tokenRef.current ? { Authorization: `Bearer ${tokenRef.current}` } : {};
      await http.patch(`${apiUrl}/notifications/mark-all-read?type=CAREER_APPLICATION`, {}, { headers });

      setUnreadNotifications([]);
      setUnreadCount(0);

      if (onApplicationsUpdated) onApplicationsUpdated();
    } catch (err) {
      console.error("Failed to mark all application notifications as read:", err);
    }
  }, [apiUrl, onApplicationsUpdated]);

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
