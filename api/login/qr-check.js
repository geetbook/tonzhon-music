const NCM_API = 'https://api-enhanced-sooty-six.vercel.app'

function cleanCookie(cookieStr) {
  if (!cookieStr) return ''
  return cookieStr
    .split(';')
    .map(part => part.trim())
    .filter(part => part && !part.startsWith('Max-Age=') && !part.startsWith('Expires=') && !part.startsWith('Path=') && !part.startsWith('Domain=') && !part.startsWith('Secure') && !part.startsWith('HttpOnly') && part.includes('='))
    .join('; ')
}

async function handler(req, res) {
  const { key } = req.query

  if (!key) {
    return res.status(400).json({ success: false, message: 'Key is required' })
  }

  try {
    const upstream = await fetch(`${NCM_API}/login/qr/check?key=${key}`)
    const json = await upstream.json()

    if (json.code === 803 || json.code === 200) {
      const rawCookie = json.cookie || ''
      const cookie = cleanCookie(rawCookie)
      return res.json({
        success: true,
        status: 'confirmed',
        cookie: cookie,
        rawCookie: rawCookie,
      })
    } else if (json.code === 802) {
      return res.json({
        success: true,
        status: 'scanned',
      })
    } else if (json.code === 801) {
      return res.json({
        success: true,
        status: 'waiting',
      })
    } else if (json.code === 800) {
      return res.json({
        success: true,
        status: 'expired',
      })
    }

    return res.json({
      success: true,
      status: 'unknown',
      code: json.code,
      message: json.message || '未知状态',
    })
  } catch (err) {
    console.error('QR check API error:', err)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
}

module.exports = handler
module.exports.default = handler
