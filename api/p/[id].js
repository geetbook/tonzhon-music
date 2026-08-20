const NCM_API = 'https://api-enhanced-sooty-six.vercel.app'

async function handler(req, res) {
  const { id } = req.query

  if (!id) {
    return res.status(400).json({ success: false, message: 'Song ID is required' })
  }

  try {
    const upstream = await fetch(`${NCM_API}/song/url?id=${id}`)
    const json = await upstream.json()

    if (json.code !== 200 || !json.data?.length) {
      return res.json({ success: false, message: 'Song not found' })
    }

    const songData = json.data[0]

    if (!songData.url || songData.code !== 200) {
      const reason = songData.freeTrialPrivilege?.cannotListenReason
      if (reason === 1) {
        return res.json({
          success: false,
          message: '这首歌需要登录后才能播放，请先扫码登录',
          needLogin: true,
        })
      }
      if (reason === 2) {
        return res.json({
          success: false,
          message: '这首歌需要付费或VIP才能播放',
          needLogin: true,
        })
      }
      return res.json({
        success: false,
        message: '无法播放此歌曲',
      })
    }

    const url = songData.url.replace(/^http:\/\//, 'https://')

    return res.json({
      success: true,
      data: url,
    })
  } catch (err) {
    console.error('Song URL API error:', err)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
}

module.exports = handler
module.exports.default = handler
