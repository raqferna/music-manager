"use client";

import { forwardRef } from "react";
import type { KaraokeVideo } from "@/lib/karaoke";
import { Film } from "./icons";

type Props = {
  video: KaraokeVideo | null;
};

const KaraokePlayer = forwardRef<HTMLVideoElement, Props>(function KaraokePlayer(
  { video },
  ref,
) {
  if (!video) {
    return (
      <div className="grid h-full min-h-[46vh] place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-white/50 lg:min-h-[70vh]">
        <div>
          <Film className="mx-auto mb-3 h-10 w-10 text-white/30" />
          <p className="text-base text-white/85">Elige un karaoke para cantar.</p>
          <p className="mt-1 text-sm">El vídeo se verá aquí, a pantalla grande.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[46vh] flex-col gap-3 lg:min-h-[70vh]">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="song-title truncate text-white">{video.title}</p>
          <p className="truncate text-xs text-white/50">
            {video.source === "youtube"
              ? "Karaoke de YouTube · puedes ponerlo a pantalla completa"
              : "Vídeo guardado · usa los controles para cantar a pantalla completa"}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wide ${
            video.source === "youtube"
              ? "bg-red-400/15 text-red-200"
              : "bg-amber-400/15 text-amber-200"
          }`}
        >
          {video.source === "youtube" ? "YouTube" : "Vídeo"}
        </span>
      </div>

      {video.source === "youtube" && video.youtubeId ? (
        <div className="relative min-h-[40vh] flex-1 overflow-hidden rounded-2xl bg-black lg:min-h-0">
          <iframe
            key={video.youtubeId}
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.youtubeId)}?rel=0&modestbranding=1&playsinline=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          />
        </div>
      ) : (
        <video
          ref={ref}
          key={video.fileName}
          className="min-h-[40vh] w-full flex-1 rounded-2xl bg-black object-contain lg:min-h-0"
          src={`/api/karaoke/file/${encodeURIComponent(video.fileName)}`}
          controls
          playsInline
          preload="metadata"
          controlsList="nodownload"
        />
      )}
    </div>
  );
});

export default KaraokePlayer;
