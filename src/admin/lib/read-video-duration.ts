export function secondsToDurationMs(seconds: number): number {
  return Math.round(seconds * 1000);
}

export function readVideoDurationMs(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";

    const cleanup = () => {
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
    };

    video.addEventListener("loadedmetadata", () => {
      const durationMs = secondsToDurationMs(video.duration);
      cleanup();
      if (!Number.isFinite(durationMs) || durationMs <= 0) {
        reject(new Error("Could not read video duration"));
        return;
      }
      resolve(durationMs);
    });

    video.addEventListener("error", () => {
      cleanup();
      reject(new Error("Could not read video duration"));
    });

    video.src = url;
  });
}
