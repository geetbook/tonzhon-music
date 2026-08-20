const NCM_API = 'https://api-enhanced-sooty-six.vercel.app'

async function handler(req, res) {
  const { id } = req.query

  if (!id) {
    return res.status(400).json({ success: false, message: 'Song ID is required' })
  }

  try {
    const upstream = await fetch(`${NCM_API}/song/detail?ids=${id}`)
    const json = await upstream.json()

    if (json.code !== 200 || !json.songs?.length) {
      return res.json({ success: false, message: 'Song not found' })
    }

    const song = json.songs[0]
    const songData = {
      id: song.id,
      name: song.name,
      artists: (song.ar || []).map((a) => ({ id: a.id, name: a.name })),
      album: {
        id: song.al?.id,
        name: song.al?.name,
        picUrl: song.al?.picUrl || '',
      },
      duration: song.dt,
      mv: song.mv || 0,
      publishTime: song.publishTime || 0,
    }

    return res.json({ success: true, data: songData })
  } catch (err) {
    console.error('Song detail API error:', err)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
}

module.exports = handler
module.exports.default = handler
