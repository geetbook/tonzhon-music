const NCM_API = 'https://api-enhanced-sooty-six.vercel.app'

export default async function handler(req, res) {
  // Handle song playback URL requests
  const { id } = req.query

  if (!id) {
    return res.status(400).json({ success: false })
  }

  try {
    const upstream = await fetch(`${NCM_API}/song/url?id=${id}`)
    const json = await upstream.json()

    if (json.code !== 200 || !json.data?.length) {
      return res.json({ success: false })
    }

    const songData = json.data[0]

    if (!songData.url || songData.code !== 200) {
      return res.json({ success: false })
    }

    const url = songData.url.replace(/^http:\/\//, 'https://')

    return res.json({
      success: true,
      data: url,
    })
  } catch (err) {
    console.error('Song URL API error:', err)
    return res.status(500).json({ success: false })
  }
}
