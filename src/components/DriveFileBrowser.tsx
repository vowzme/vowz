import { useState, useEffect, useCallback } from "react";
import { useGoogleDrive } from "@/hooks/use-google-drive";
import { Loader2, Trash2, ExternalLink, RefreshCw, Image, Film, FileText, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime: string;
  thumbnailLink?: string;
  webViewLink?: string;
  webContentLink?: string;
}

function formatSize(bytes?: string) {
  if (!bytes) return "";
  const b = parseInt(bytes);
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith("image/")) return <Image className="w-4 h-4 text-emerald-500" />;
  if (mimeType.startsWith("video/")) return <Film className="w-4 h-4 text-blue-500" />;
  return <FileText className="w-4 h-4 text-muted-foreground" />;
}

export default function DriveFileBrowser() {
  const { linked, listFiles, deleteFile, email } = useGoogleDrive();
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!linked) return;
    setLoading(true);
    try {
      const result = await listFiles();
      setFiles(result);
    } catch {
      toast({ title: "Failed to load files", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [linked, listFiles]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleDelete = async (fileId: string, fileName: string) => {
    setDeletingId(fileId);
    try {
      const result = await deleteFile(fileId);
      if (result.success) {
        setFiles(f => f.filter(file => file.id !== fileId));
        toast({ title: `Deleted "${fileName}"` });
      } else {
        toast({ title: "Delete failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  if (!linked) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <HardDrive className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm">Google Drive not linked.</p>
        <p className="text-xs mt-1">Link your Drive from the dashboard to manage media here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
            <HardDrive className="w-4 h-4" /> Drive Media
          </h3>
          {email && <p className="text-xs text-muted-foreground truncate max-w-[180px]">{email}</p>}
        </div>
        <Button variant="ghost" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {loading && files.length === 0 ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : files.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">No files uploaded yet. Upload media in the editor sections above.</p>
      ) : (
        <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
          {files.map(file => (
            <div key={file.id} className="flex items-center gap-2 p-2 rounded-lg border border-border/50 bg-background hover:bg-muted/50 transition-colors group">
              {file.thumbnailLink && file.mimeType.startsWith("image/") ? (
                <img
                  src={file.thumbnailLink}
                  alt={file.name}
                  className="w-10 h-10 rounded object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                  <FileIcon mimeType={file.mimeType} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {formatSize(file.size)} · {new Date(file.createdTime).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                {file.webViewLink && (
                  <a href={file.webViewLink} target="_blank" rel="noopener noreferrer"
                    className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                      {deletingId === file.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete "{file.name}"?</AlertDialogTitle>
                      <AlertDialogDescription>This will permanently remove the file from your Google Drive.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(file.id, file.name)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-[10px] text-muted-foreground text-center">{files.length} file{files.length !== 1 ? "s" : ""} in Vowz Wedding Media</p>
    </div>
  );
}
