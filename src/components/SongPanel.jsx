import { Modal, Tabs, Avatar, List, Empty, Spin, message } from 'antd'
import { useEffect, useState } from 'react'
import { Music2, MessageCircle } from 'lucide-react'

const { TabPane } = Tabs

function SongPanel({ open, onClose, songId, songName }) {
  const [detail, setDetail] = useState(null)
  const [comments, setComments] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [detailLoading, setDetailLoading] = useState(false)
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('detail')

  useEffect(() => {
    if (open && songId) {
      fetchDetail()
      fetchComments()
    }
    return () => {
      setDetail(null)
      setComments([])
      setTotalCount(0)
    }
  }, [open, songId])

  const fetchDetail = async () => {
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/song-detail?id=${songId}`)
      const data = await res.json()
      if (data.success) {
        setDetail(data.data)
      } else {
        message.error(data.message || '获取歌曲详情失败')
      }
    } catch (err) {
      console.error('Fetch detail error:', err)
      message.error('获取歌曲详情失败')
    } finally {
      setDetailLoading(false)
    }
  }

  const fetchComments = async () => {
    setCommentsLoading(true)
    try {
      const res = await fetch(`/api/song-comments?id=${songId}&limit=20`)
      const data = await res.json()
      if (data.success) {
        setComments(data.data.comments)
        setTotalCount(data.data.totalCount)
      } else {
        message.error(data.message || '获取评论失败')
      }
    } catch (err) {
      console.error('Fetch comments error:', err)
      message.error('获取评论失败')
    } finally {
      setCommentsLoading(false)
    }
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  return (
    <Modal
      title={songName || '歌曲信息'}
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
      centered
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane
          tab={
            <span>
              <Music2 size={14} /> 详情
            </span>
          }
          key="detail"
        >
          {detailLoading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Spin />
            </div>
          ) : detail ? (
            <div style={{ padding: '16px 0' }}>
              <h3 style={{ marginTop: 0, marginBottom: 16 }}>{detail.name}</h3>
              <List
                itemLayout="horizontal"
                dataSource={[
                  {
                    key: 'artists',
                    title: '歌手',
                    content: detail.artists.map((a) => a.name).join(' / '),
                  },
                  {
                    key: 'album',
                    title: '专辑',
                    content: detail.album.name,
                  },
                  {
                    key: 'duration',
                    title: '时长',
                    content: `${Math.floor(detail.duration / 1000 / 60)}:${String(Math.floor((detail.duration / 1000) % 60)).padStart(2, '0')}`,
                  },
                  {
                    key: 'publishTime',
                    title: '发行时间',
                    content: formatDate(detail.publishTime),
                  },
                ]}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={<span style={{ color: '#999' }}>{item.title}</span>}
                      description={<strong>{item.content}</strong>}
                    />
                  </List.Item>
                )}
              />
            </div>
          ) : (
            <Empty description="暂无歌曲详情" />
          )}
        </TabPane>
        <TabPane
          tab={
            <span>
              <MessageCircle size={14} /> 评论 ({totalCount})
            </span>
          }
          key="comments"
        >
          {commentsLoading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Spin />
            </div>
          ) : comments.length > 0 ? (
            <List
              dataSource={comments}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        src={item.user.avatarUrl}
                        alt={item.user.nickname}
                      />
                    }
                    title={
                      <span>
                        <strong>{item.user.nickname}</strong>
                        {item.likedCount > 0 && (
                          <span style={{ color: '#999', marginLeft: 8, fontSize: 12 }}>
                            ❤ {item.likedCount}
                          </span>
                        )}
                      </span>
                    }
                    description={
                      <div>
                        <div style={{ marginBottom: 4 }}>{item.content}</div>
                        {item.beReplied?.length > 0 && (
                          <div
                            style={{
                              background: 'rgba(255,255,255,0.05)',
                              padding: '8px 12px',
                              borderRadius: 4,
                              marginTop: 8,
                            }}
                          >
                            {item.beReplied.map((reply, idx) => (
                              <div key={idx} style={{ fontSize: 13 }}>
                                <strong>@{reply.userNickname}：</strong>
                                {reply.content}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="暂无评论" />
          )}
        </TabPane>
      </Tabs>
    </Modal>
  )
}

export default SongPanel
