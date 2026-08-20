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

async function handler(req, res) {
  const { keyword, provider = 'spotify', page = 1 } = req.query

  if (!keyword) {
    return res.status(400).json({
      searchSuccess: false,
      provider,
      keyword: '',
      page: 1,
      data: { songs: [] },
      totalCount: 0,
    })
  }

  const limit = 4
  const offset = (Number(page) - 1) * limit

  try {
    const upstream = await fetch(
      `${NCM_API}/search?keywords=${encodeURIComponent(keyword)}&offset=${offset}&limit=${limit}`,
    )
    const json = await upstream.json()

    if (json.code !== 200) {
      return res.json({
        searchSuccess: false,
        provider,
        keyword,
        page: Number(page),
        data: { songs: [] },
        totalCount: 0,
      })
    }

    const songs = (json.result?.songs || []).map(mapSong)
    const totalCount = json.result?.songCount || 0

    return res.json({
      searchSuccess: true,
      provider,
      keyword,
      page: Number(page),
      data: { songs },
      totalCount,
    })
  } catch (err) {
    console.error('Search API error:', err)
    return res.status(500).json({
      searchSuccess: false,
      provider,
      keyword,
      page: Number(page),
      data: { songs: [] },
      totalCount: 0,
    })
  }
}

module.exports = handler
module.exports.default = handler
