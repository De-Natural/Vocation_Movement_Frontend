"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Spinner } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { GridIcon, LogOutIcon, UploadIcon } from "@/components/ui/icons";
import { apiClient } from "@/lib/api-client";
import { apiErrorMessage } from "@/lib/use-api";
import { useSession } from "@/lib/store";
import { cn } from "@/lib/utils";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // matches the backend's photo limit

/**
 * Signed-in user's avatar in the public navbar: opens a menu with their
 * dashboard, a "change photo" upload (students and sponsors), and sign out.
 */
export function UserMenu({ onNavigate }: { onNavigate?: () => void }) {
  const role = useSession((s) => s.role);
  const name = useSession((s) => s.name);
  const email = useSession((s) => s.email);
  const photo = useSession((s) => s.photo);
  const status = useSession((s) => s.status);
  const setProfile = useSession((s) => s.setProfile);
  const clearSession = useSession((s) => s.clearSession);
  const router = useRouter();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // Sign-in doesn't return the photo: load it once.
  useEffect(() => {
    if (status !== "authenticated" || photo !== undefined) return;
    apiClient.auth
      .me()
      .then((me) => setProfile({ name: me.name, photo: me.photo ?? null }))
      .catch(() => setProfile({ photo: null }));
  }, [status, photo, setProfile]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!role) return null;
  const canUploadPhoto = role === "student" || role === "sponsor";
  const displayName = name || email || "My account";

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast("Please choose a JPG, PNG or WebP image.", "warning");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      toast("That image is larger than 5 MB. Please choose a smaller one.", "warning");
      return;
    }
    const form = new FormData();
    form.append("file", file);
    setUploading(true);
    try {
      const path = role === "student" ? "/api/religious/photo" : "/api/sponsors/photo";
      const updated = await apiClient.post<{ photo?: string }>(path, form);
      setProfile({ photo: updated.photo ?? null });
      toast("Profile photo updated.", "success");
    } catch (err) {
      toast(apiErrorMessage(err, "Couldn't upload the photo."), "error");
    } finally {
      setUploading(false);
    }
  }

  async function signOut() {
    setOpen(false);
    onNavigate?.();
    try {
      await apiClient.auth.logout();
    } catch {
      // still sign out locally
    }
    clearSession();
    router.push("/");
  }

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-pill p-0.5 pr-3 transition-colors hover:bg-navy/5"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open account menu"
      >
        <span className="relative">
          <Avatar name={displayName} src={photo ?? undefined} size="sm" />
          {uploading && (
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-white/70 text-gold-dark">
              <Spinner />
            </span>
          )}
        </span>
        <span className="max-w-[10rem] truncate text-caption font-semibold text-navy">{displayName}</span>
      </button>

      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onPick} />

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-card border border-inputborder/40 bg-white shadow-cardhover"
        >
          <div className="flex items-center gap-3 border-b border-inputborder/30 p-4">
            <Avatar name={displayName} src={photo ?? undefined} size="md" />
            <div className="min-w-0">
              <p className="truncate text-body font-semibold text-navy">{displayName}</p>
              {email && <p className="truncate text-label text-muted">{email}</p>}
            </div>
          </div>
          <div className="p-2">
            <Link
              href={`/dashboard/${role}`}
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onNavigate?.();
              }}
              className={itemClass}
            >
              <GridIcon size={16} /> My dashboard
            </Link>
            {canUploadPhoto && (
              <button
                type="button"
                role="menuitem"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className={cn(itemClass, "w-full")}
              >
                {uploading ? <Spinner /> : <UploadIcon size={16} />}
                {photo ? "Change profile photo" : "Add profile photo"}
              </button>
            )}
            <button type="button" role="menuitem" onClick={() => void signOut()} className={cn(itemClass, "w-full hover:text-alert")}>
              <LogOutIcon size={16} /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const itemClass =
  "flex items-center gap-2 rounded-input px-3 py-2 text-left text-caption font-medium text-navy transition-colors hover:bg-warm disabled:opacity-60";
