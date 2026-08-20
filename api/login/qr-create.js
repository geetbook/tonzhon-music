const NCM_API = 'https://api-enhanced-sooty-six.vercel.app'

async function handler(req, res) {
  const { key } = req.query

  if (!key) {
    return res.status(400).json({ success: false, message: 'Key is required' })
  }

  try {
    const upstream = await fetch(`${NCM_API}/login/qr/create?key=${key}`)
    const json = await upstream.json()

    if (json.code === 200) {
      return res.json({
        success: true,
        qrurl: json.data.qrurl,
        qrimg: json.data.qrimg,
      })
    }

    return res.json({ success: false, message: 'Failed to create QR code' })
  } catch (err) {
    console.error('QR create API error:', err)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
}

module.exports = handler
module.exports.default = handler
