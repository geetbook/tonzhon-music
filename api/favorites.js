const NCM_API = 'https://api-enhanced-sooty-six.vercel.app'

async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { song } = req.body || {}
      if (!song?.newId) {
        return res.status(400).json({ success: false, message: '缺少歌曲ID' })
      }

      const upstream = await fetch(
        `${NCM_API}/like?id=${song.newId}&like=true`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
      )
      const json = await upstream.json()

      if (json.code === 200) {
        return res.json({ success: true })
      }

      if (json.code === 301) {
        return res.json({ success: false, message: '需要登录网易云账号' })
      }

      return res.json({ success: false, message: json.message || '收藏失败' })
    } catch (err) {
      console.error('Favorites API error:', err)
      return res.status(500).json({ success: false, message: '服务器错误' })
    }
  }

  if (req.method === 'GET') {
    try {
      const upstream = await fetch(`${NCM_API}/like/list?uid=0`)
      const json = await upstream.json()

      if (json.code === 200) {
        const favorites = (json.ids || []).map(String)
        return res.json({ success: true, favorites })
      }

      return res.json({ success: false, favorites: [] })
    } catch (err) {
      console.error('Favorites list API error:', err)
      return res.status(500).json({ success: false, favorites: [] })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

module.exports = handler
module.exports.default = handler
