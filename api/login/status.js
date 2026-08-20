const NCM_API = 'https://api-enhanced-sooty-six.vercel.app'

async function handler(req, res) {
  try {
    // Get cookie from request headers
    const cookie = req.headers.cookie || ''

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
