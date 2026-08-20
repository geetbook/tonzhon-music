const NCM_API = 'https://api-enhanced-sooty-six.vercel.app'

async function handler(req, res) {
  const { id, limit = 20, offset = 0 } = req.query

  if (!id) {
    return res.status(400).json({ success: false, message: 'Song ID is required' })
  }

  try {
    const upstream = await fetch(
      `${NCM_API}/comment/music?id=${id}&limit=${limit}&offset=${offset}`,
    )
    const json = await upstream.json()

    if (json.code !== 200) {
      return res.json({ success: false, message: 'Failed to fetch comments' })
    }

    const comments = (json.comments || []).map((c) => ({
      commentId: c.commentId,
      content: c.content,
      time: c.time,
      likedCount: c.likedCount || 0,
      user: {
        nickname: c.user?.nickname || '',
        avatarUrl: c.user?.avatarUrl || '',
        userId: c.user?.userId,
      },
      beReplied: c.beReplied?.map((r) => ({
        content: r.content,
        userNickname: r.user?.nickname || '',
      })) || [],
    }))

    return res.json({
      success: true,
      data: {
        comments,
        totalCount: json.totalCount || 0,
        hasMore: json.hasMore || false,
      },
    })
  } catch (err) {
    console.error('Comments API error:', err)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
}

module.exports = handler
module.exports.default = handler
