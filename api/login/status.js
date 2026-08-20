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
  try {
    const ncmCookie = req.headers['x-ncm-cookie'] || ''
    const rawCookie = ncmCookie || req.headers.cookie || ''
    const cookie = cleanCookie(rawCookie)

    const upstream = await fetch(`${NCM_API}/login/status`, {
      headers: cookie ? { Cookie: cookie } : {},
    })
    const json = await upstream.json()

    if (json.code === 200 && json.data.account) {
      return res.json({
        success: true,
        isSignedIn: true,
        user: {
          userId: json.data.account.id,
          username: json.data.account.nickname,
          avatar: json.data.account.avatarUrl,
        },
      })
    }

    return res.json({
      success: true,
      isSignedIn: false,
      user: null,
    })
  } catch (err) {
    console.error('Login status API error:', err)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
}

module.exports = handler
module.exports.default = handler
