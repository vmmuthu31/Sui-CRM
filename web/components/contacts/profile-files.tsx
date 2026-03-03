"use client";

import { useState, useRef } from "react";
import {
  FileUp,
  Upload,
  FileText,
  Download,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useCurrentAccount, useSignPersonalMessage } from "@mysten/dapp-kit";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ACCESS_LEVEL_OPTIONS, type OrgRole } from "@/lib/types/crm";
import CONTRACT_CONFIG from "@/lib/config/contracts";
import {
  crmDecryptionService,
  type ResourceMetadata,
} from "@/lib/services/decryptionService";

interface ProfileFilesProps {
  profileId: string;
}

// Placeholder list; replace with API when /api/profiles/[id]/files exists
interface FileMeta {
  id: string;
  filename: string;
  accessLevel: number;
  resource?: ResourceMetadata;
}
const mockFiles: FileMeta[] = [];

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export function ProfileFiles({ profileId }: ProfileFilesProps) {
  const [file, setFile] = useState<File | null>(null);
  const [accessLevel, setAccessLevel] = useState<OrgRole>(2);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [downloadId, setDownloadId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentAccount = useCurrentAccount();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();

  const orgRegistryId = CONTRACT_CONFIG.SHARED_OBJECTS.EXAMPLE_ORG_REGISTRY;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !currentAccount) {
      if (!currentAccount) toast.error("Connect your wallet first");
      return;
    }
    setUploading(true);
    try {
      const { crmEncryptionService } = await import(
        "@/lib/services/encryptionService"
      );
      const MOCK_ORG_ID = CONTRACT_CONFIG.SHARED_OBJECTS.EXAMPLE_ORG_REGISTRY;
      const MOCK_ORG_REGISTRY_ID = CONTRACT_CONFIG.SHARED_OBJECTS.EXAMPLE_ORG_REGISTRY;

      const result = await crmEncryptionService.encryptAndUploadResource(
        file,
        profileId,
        MOCK_ORG_ID,
        MOCK_ORG_REGISTRY_ID,
        "file",
        accessLevel,
        currentAccount.address
      );

      if (!result.success) {
        throw new Error(result.error ?? "Upload failed");
      }

      setFile(null);
      toast.success("File uploaded", {
        description: "Encrypted and stored on Walrus.",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast.error("Upload failed", { description: msg });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (meta: FileMeta) => {
    if (!meta.resource || !currentAccount) {
      toast.error("Connect your wallet to download.");
      return;
    }
    setDownloadId(meta.id);
    try {
      const sessionKey = await crmDecryptionService.createSessionKey(
        currentAccount.address
      );
      const sig = await signPersonalMessage({
        message: sessionKey.getPersonalMessage(),
      });
      await sessionKey.setPersonalMessageSignature(sig.signature);

      const result = await crmDecryptionService.downloadAndDecryptResources(
        [meta.resource],
        orgRegistryId,
        sessionKey
      );

      if (result.success && result.decryptedFileUrls?.length) {
        const url = result.decryptedFileUrls[0];
        const a = document.createElement("a");
        a.href = url;
        a.download = meta.filename || "download";
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Download started");
      } else {
        toast.error("Download failed", {
          description: result.error ?? "Could not decrypt file",
        });
      }
    } catch (err) {
      toast.error("Download failed", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setDownloadId(null);
    }
  };

  return (
    <Card className="border-none shadow-xl shadow-emerald-900/5 bg-white rounded-[32px] overflow-hidden">
      <div className="h-1.5 w-full flex">
        <div className="h-full flex-1 bg-emerald-400 rounded-bl-full" />
        <div className="h-full flex-1 bg-teal-500" />
        <div className="h-full flex-1 bg-emerald-500 rounded-br-full" />
      </div>
      <CardHeader className="p-8 pb-4">
        <div className="flex items-center gap-4">
          <div className="size-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm">
            <FileUp className="size-7 stroke-[1.5]" />
          </div>
          <div>
            <Badge className="bg-emerald-50 text-emerald-600 border-none px-2.5 py-0.5 font-bold text-[10px] uppercase tracking-widest mb-1.5">
              Walrus
            </Badge>
            <CardTitle className="text-2xl font-black text-[#1a1a1a] tracking-tight">
              Files
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium mt-0.5">
              Encrypted attachments. Set access level for decryption.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 pt-2 space-y-8">
        <form onSubmit={handleUpload} className="space-y-4">
          <div
            className={`relative rounded-2xl border-2 border-dashed transition-all ${
              dragActive
                ? "border-emerald-400 bg-emerald-50/50"
                : "border-slate-200 bg-slate-50/30 hover:border-slate-300 hover:bg-slate-50/50"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              const f = e.dataTransfer.files?.[0];
              if (f) setFile(f);
            }}
          >
            <input
              ref={inputRef}
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              disabled={uploading}
            />
            <div className="p-10 flex flex-col items-center justify-center gap-3 pointer-events-none">
              <div className="size-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400">
                <Upload className="size-7" />
              </div>
              <p className="text-sm font-bold text-[#1a1a1a]">
                {file ? file.name : "Drop file or click to upload"}
              </p>
              <p className="text-xs text-slate-400">
                PDF, documents, images. Encrypted with Seal.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2 min-w-[200px]">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Access level
              </Label>
              <Select
                value={String(accessLevel)}
                onValueChange={(v) => setAccessLevel(Number(v) as OrgRole)}
                disabled={uploading}
              >
                <SelectTrigger className="rounded-xl border-slate-200 bg-white h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCESS_LEVEL_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={String(o.value)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              disabled={uploading || !file}
              className="h-12 px-6 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <ShieldCheck className="size-4" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </form>

        {mockFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/30 py-14 text-center">
            <div className="size-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-300 mb-3">
              <FileText className="size-7" />
            </div>
            <h3 className="font-bold text-[#1a1a1a]">No files yet</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-[240px]">
              Upload a file to store it encrypted. Only users with the right
              access can decrypt and download.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {mockFiles.map((f) => (
              <li
                key={f.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="size-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                    <FileText className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-[#1a1a1a] truncate">
                      {f.filename}
                    </p>
                    <Badge
                      variant="secondary"
                      className="mt-1 bg-slate-100 text-slate-600 border-0 text-[10px] font-bold uppercase tracking-wider"
                    >
                      {ACCESS_LEVEL_OPTIONS.find((o) => o.value === f.accessLevel)
                        ?.label ?? `Level ${f.accessLevel}`}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl font-bold border-slate-200 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 gap-2 shrink-0"
                  onClick={() => handleDownload(f)}
                  disabled={!currentAccount || downloadId === f.id}
                >
                  {downloadId === f.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Download className="size-4" />
                  )}
                  Download
                </Button>
              </li>
            ))}
          </ul>
        )}

        {!currentAccount && (
          <Alert className="rounded-xl bg-amber-50 border-amber-200 text-amber-800">
            <AlertDescription>
              Connect your Sui wallet to upload or download files.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
