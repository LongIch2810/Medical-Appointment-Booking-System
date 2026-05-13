import { create } from "zustand";

export interface Channel {
  channel_id: number;
  created_at: string;
  participants: {
    id: number;
    fullname: string | null;
    username?: string | null;
    picture: string | null;
  }[];
  updated_at: string;
}

interface ChannelState {
  channels: Channel[];
  chatBoxChannels: Channel[];
  setChannels: (channels: Channel[] | ((prev: Channel[]) => Channel[])) => void;
  setChatBoxChannels: (
    channels: Channel[] | ((prev: Channel[]) => Channel[])
  ) => void;
}

export const useChannelStore = create<ChannelState>((set) => ({
  channels: [],
  chatBoxChannels: [],
  setChannels: (updater) =>
    set((state) => ({
      channels:
        typeof updater === "function"
          ? (updater as (prev: Channel[]) => Channel[])(state.channels)
          : updater,
    })),
  setChatBoxChannels: (updater) =>
    set((state) => ({
      chatBoxChannels:
        typeof updater === "function"
          ? (updater as (prev: Channel[]) => Channel[])(state.chatBoxChannels)
          : updater,
    })),
}));
