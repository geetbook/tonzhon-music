const NCM_API = 'https://api-enhanced-sooty-six.vercel.app'

async function handler(req, res) {
  const { key } = req.query

  if (!key) {
    return res.status(400).json({ success: false, message: 'Key is required' })
  }

  try {
    const upstream = await fetch(`${NCM_API}/login/qr/check?key=${key}`)
    const json = await upstream.json()

    if (json.code === 200) {
      const cookie = json.cookie
      if (cookie) {
        // Store the cookie in serverless function response for future use
        return res.json({
          success: true,
          status: 'confirmed',
          cookie,
        })
      }
      return res.json({
        success: true,
        status: 'expired',
      })
    } else if (json.code === 801) {
      return res.json({
        success: true,
        status: 'waiting',
      })
    } else if (json.code === 802) {
      return res.json({
        success: true,
        status: 'scanned',
      })
    } else if (json.code === 803) {
      return res.json({
        success: true,
        status: 'expired',
      })
    }

    return res.json({
      success: true,
      status: 'unknown',
      code: json.code,
    })
  } catch (err) {
    console.error('QR check API error:', err)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
}

module.exports = handler
module.exports.default = handler
