import { create } from "zustand";
import { Song } from "@/types";
import { useChatStore } from "./useChatStore";

interface PlayerStore {
  currentSong: Song | null;
  isPlaying: boolean;
  queue: Song[];
  currentIndex: number;
  shuffle: boolean;
  repeat: "off" | "all" | "one";

  initializeQueue: (songs: Song[]) => void;
  playAlbum: (songs: Song[], startIndex?: number) => void;
  setCurrentSong: (song: Song | null) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrevious: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentSong: null,
  isPlaying: false,
  queue: [],
  currentIndex: -1,
  shuffle: false,
  repeat: "off",

  initializeQueue: (songs: Song[]) => {
    set({
      queue: songs,
      currentSong: get().currentSong || songs[0],
      currentIndex: get().currentIndex === -1 ? 0 : get().currentIndex,
    });
  },

  playAlbum: (songs: Song[], startIndex = 0) => {
    if (songs.length === 0) return;

    const song = songs[startIndex];

    const socket = useChatStore.getState().socket;
    if (socket.auth) {
      socket.emit("update_activity", {
        userId: socket.auth.userId,
        activity: `Playing ${song.title} by ${song.artist}`,
      });
    }
    set({
      queue: songs,
      currentSong: song,
      currentIndex: startIndex,
      isPlaying: true,
    });
  },

  setCurrentSong: (song: Song | null) => {
    if (!song) return;

    const socket = useChatStore.getState().socket;
    if (socket.auth) {
      socket.emit("update_activity", {
        userId: socket.auth.userId,
        activity: `Playing ${song.title} by ${song.artist}`,
      });
    }

    const songIndex = get().queue.findIndex((s) => s._id === song._id);
    set({
      currentSong: song,
      isPlaying: true,
      currentIndex: songIndex !== -1 ? songIndex : get().currentIndex,
    });
  },

  togglePlay: () => {
    const willStartPlaying = !get().isPlaying;

    const currentSong = get().currentSong;
    const socket = useChatStore.getState().socket;
    if (socket.auth) {
      socket.emit("update_activity", {
        userId: socket.auth.userId,
        activity:
          willStartPlaying && currentSong
            ? `Playing ${currentSong.title} by ${currentSong.artist}`
            : "Idle",
      });
    }

    set({
      isPlaying: willStartPlaying,
    });
  },

  toggleShuffle: () => {
    set({ shuffle: !get().shuffle });
  },

  toggleRepeat: () => {
    const current = get().repeat;
    const next = current === "off" ? "all" : current === "all" ? "one" : "off";
    set({ repeat: next });
  },

  playNext: () => {
    const { currentIndex, queue, shuffle, repeat } = get();
    let nextIndex = currentIndex + 1;
    let nextSong;
    if (shuffle) {
      // pick a random song that is not the current one
      if (queue.length > 1) {
        let randomIndex;
        do {
          randomIndex = Math.floor(Math.random() * queue.length);
        } while (randomIndex === currentIndex);
        nextIndex = randomIndex;
      }
    }
    if (nextIndex < queue.length) {
      nextSong = queue[nextIndex];
    } else if (repeat === "all") {
      nextIndex = 0;
      nextSong = queue[0];
    } else if (repeat === "one") {
      nextIndex = currentIndex;
      nextSong = queue[currentIndex];
    }
    if (nextSong) {
      const socket = useChatStore.getState().socket;
      if (socket.auth) {
        socket.emit("update_activity", {
          userId: socket.auth.userId,
          activity: `Playing ${nextSong.title} by ${nextSong.artist}`,
        });
      }
      set({
        currentSong: nextSong,
        currentIndex: nextIndex,
        isPlaying: true,
      });
    } else {
      set({ isPlaying: false });
      const socket = useChatStore.getState().socket;
      if (socket.auth) {
        socket.emit("update_activity", {
          userId: socket.auth.userId,
          activity: `Idle`,
        });
      }
    }
  },
  playPrevious: () => {
    const { currentIndex, queue, shuffle, repeat } = get();
    let prevIndex = currentIndex - 1;
    let prevSong;
    if (shuffle) {
      if (queue.length > 1) {
        let randomIndex;
        do {
          randomIndex = Math.floor(Math.random() * queue.length);
        } while (randomIndex === currentIndex);
        prevIndex = randomIndex;
      }
    }
    if (prevIndex >= 0) {
      prevSong = queue[prevIndex];
    } else if (repeat === "all") {
      prevIndex = queue.length - 1;
      prevSong = queue[prevIndex];
    } else if (repeat === "one") {
      prevIndex = currentIndex;
      prevSong = queue[currentIndex];
    }
    if (prevSong) {
      const socket = useChatStore.getState().socket;
      if (socket.auth) {
        socket.emit("update_activity", {
          userId: socket.auth.userId,
          activity: `Playing ${prevSong.title} by ${prevSong.artist}`,
        });
      }
      set({
        currentSong: prevSong,
        currentIndex: prevIndex,
        isPlaying: true,
      });
    } else {
      set({ isPlaying: false });
      const socket = useChatStore.getState().socket;
      if (socket.auth) {
        socket.emit("update_activity", {
          userId: socket.auth.userId,
          activity: `Idle`,
        });
      }
    }
  },
}));
