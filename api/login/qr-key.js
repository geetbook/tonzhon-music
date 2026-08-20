const NCM_API = 'https://api-enhanced-sooty-six.vercel.app'

async function handler(req, res) {
  try {
    const upstream = await fetch(`${NCM_API}/login/qr/key`)
    const json = await upstream.json()

    if (json.code === 200) {
      return res.json({ success: true, key: json.data.unikey })
    }

    return res.json({ success: false, message: 'Failed to generate QR key' })
  } catch (err) {
    console.error('QR key API error:', err)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
}

module.exports = handler
module.exports.default = handler
