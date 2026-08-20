const NCM_API = 'https://api-enhanced-sooty-six.vercel.app'

async function handler(req, res) {
  const { key } = req.query

  if (!key) {
    return res.status(400).json({ success: false, message: 'Key is required' })
  }

  try {
    const upstream = await fetch(`${NCM_API}/login/qr/create?key=${key}&qrimg=1`)
    const json = await upstream.json()

    if (json.code === 200) {
      const qrimg = json.data.qrimg
      let imgUrl = ''

      if (qrimg) {
        imgUrl = qrimg
      }

      return res.json({
        success: true,
        qrurl: json.data.qrurl,
        qrimg: imgUrl,
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
