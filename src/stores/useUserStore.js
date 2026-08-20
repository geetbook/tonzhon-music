import { create } from 'zustand'

const initialState = {
  isSignedIn: false,
  username: '',
  email: '',
  playlists: [],
  collectedPlaylists: [],
  ncmCookie: '',
}

export const useUserStore = create((set, get) => ({
  ...initialState,

  signIn: (data) => {
    set({
      isSignedIn: true,
      username: data.username ?? '',
      email: data.email ?? '',
      playlists: data.playlists ?? [],
      collectedPlaylists: data.collectedPlaylists ?? [],
      ncmCookie: data.ncmCookie ?? '',
    })
  },

  signOut: () => {
    // Clear cookie from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ncmCookie')
    }
    set(initialState)
  },

  setNcmCookie: (cookie) => {
    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('ncmCookie', cookie)
    }
    set({ ncmCookie: cookie })
  },

  getNcmCookie: () => {
    // Get from store or localStorage
    const storeCookie = get().ncmCookie
    if (storeCookie) return storeCookie
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ncmCookie') || ''
    }
    return ''
  },

  newPlaylist: (playlist) => {
    set({
      playlists: [...get().playlists, playlist],
      isSignedIn: true,
    })
  },

  deletePlaylist: (playlistId) => {
    set({
      playlists: get().playlists.filter((p) => p.id !== playlistId),
      isSignedIn: true,
    })
  },

  collectPlaylist: (playlist) => {
    set({
      collectedPlaylists: [...get().collectedPlaylists, playlist],
      isSignedIn: true,
    })
  },

  uncollectPlaylist: (playlistId) => {
    set({
      collectedPlaylists: get().collectedPlaylists.filter((p) => p.id !== playlistId),
      isSignedIn: true,
    })
  },
}))

export function signInUser(data) {
  useUserStore.getState().signIn(data)
}

export function signOutUser() {
  useUserStore.getState().signOut()
}

export function getNcmCookie() {
  return useUserStore.getState().getNcmCookie()
}

export function setNcmCookie(cookie) {
  useUserStore.getState().setNcmCookie(cookie)
}
