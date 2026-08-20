const NCM_API = 'https://api-enhanced-sooty-six.vercel.app'

function toHttps(url) {
  return url ? url.replace(/^http:\/\//, 'https://') : ''
}

function mapSong(ncmSong) {
  return {
    newId: String(ncmSong.id),
    id: ncmSong.id,
    name: ncmSong.name,
    alias: ncmSong.alias?.[0] || '',
    cover: toHttps(ncmSong.album?.picUrl),
    artists: (ncmSong.artists || []).map((a) => ({
      id: a.id,
      name: a.name,
    })),
    duration: ncmSong.duration,
    searchSources: { netease: true },
  }
}

export default async function handler(req, res) {
  try {
    const upstream = await fetch(`${NCM_API}/top/song?type=0`)
    const json = await upstream.json()

    if (json.code !== 200 || !json.data) {
      return res.json({ success: true, songs: [] })
    }

    const songs = json.data.map(mapSong)

    return res.json({ success: true, songs })
  } catch (err) {
    console.error('Hot songs API error:', err)
    return res.status(500).json({ success: false, songs: [] })
  }
}
