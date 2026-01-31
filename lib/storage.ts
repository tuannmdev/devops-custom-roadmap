import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/database";

/**
 * Upload a file to Supabase Storage
 *
 * @param file - File to upload
 * @param bucket - Storage bucket name
 * @param folder - Optional folder path
 * @param onProgress - Optional progress callback
 * @returns Public URL of uploaded file
 */
export async function uploadFile(
  file: File,
  bucket: string,
  folder?: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string; path: string }> {
  const supabase = createClientComponentClient<Database>();

  // Validate file
  if (!file) {
    throw new Error("No file provided");
  }

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("User not authenticated");
  }

  // Generate unique file path
  const fileExt = file.name.split(".").pop();
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(7);
  const fileName = `${file.name.split(".")[0]}_${timestamp}_${randomString}.${fileExt}`;
  const filePath = folder
    ? `${folder}/${user.id}/${fileName}`
    : `${user.id}/${fileName}`;

  // Upload file
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(filePath);

  // Simulate progress (Supabase doesn't provide real-time upload progress)
  if (onProgress) {
    onProgress(100);
  }

  return {
    url: publicUrl,
    path: filePath,
  };
}

/**
 * Delete a file from Supabase Storage
 *
 * @param bucket - Storage bucket name
 * @param path - File path
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  const supabase = createClientComponentClient<Database>();

  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}

/**
 * Validate file before upload
 *
 * @param file - File to validate
 * @param options - Validation options
 */
export function validateFile(
  file: File,
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = [],
    allowedExtensions = [],
  } = options;

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${(maxSize / 1024 / 1024).toFixed(0)}MB limit`,
    };
  }

  // Check file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} not allowed`,
    };
  }

  // Check file extension
  if (allowedExtensions.length > 0) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !allowedExtensions.includes(ext)) {
      return {
        valid: false,
        error: `File extension .${ext} not allowed`,
      };
    }
  }

  return { valid: true };
}

/**
 * Format file size for display
 *
 * @param bytes - File size in bytes
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

/**
 * Get file extension icon/color
 *
 * @param filename - File name
 */
export function getFileExtensionInfo(filename: string): {
  extension: string;
  color: string;
  icon: string;
} {
  const ext = filename.split(".").pop()?.toLowerCase() || "";

  const extMap: Record<string, { color: string; icon: string }> = {
    // Documents
    pdf: { color: "text-red-600", icon: "📄" },
    doc: { color: "text-blue-600", icon: "📝" },
    docx: { color: "text-blue-600", icon: "📝" },
    txt: { color: "text-gray-600", icon: "📃" },
    md: { color: "text-gray-600", icon: "📋" },

    // Images
    jpg: { color: "text-green-600", icon: "🖼️" },
    jpeg: { color: "text-green-600", icon: "🖼️" },
    png: { color: "text-green-600", icon: "🖼️" },
    gif: { color: "text-green-600", icon: "🖼️" },
    svg: { color: "text-purple-600", icon: "🎨" },

    // Code
    js: { color: "text-yellow-600", icon: "📜" },
    ts: { color: "text-blue-600", icon: "📜" },
    py: { color: "text-blue-600", icon: "🐍" },
    go: { color: "text-cyan-600", icon: "📜" },
    java: { color: "text-orange-600", icon: "☕" },
    cpp: { color: "text-blue-600", icon: "📜" },
    c: { color: "text-blue-600", icon: "📜" },

    // Archives
    zip: { color: "text-purple-600", icon: "📦" },
    tar: { color: "text-purple-600", icon: "📦" },
    gz: { color: "text-purple-600", icon: "📦" },

    // Config
    json: { color: "text-yellow-600", icon: "⚙️" },
    yaml: { color: "text-red-600", icon: "⚙️" },
    yml: { color: "text-red-600", icon: "⚙️" },
    xml: { color: "text-orange-600", icon: "⚙️" },
  };

  return {
    extension: ext,
    color: extMap[ext]?.color || "text-gray-600",
    icon: extMap[ext]?.icon || "📎",
  };
}
