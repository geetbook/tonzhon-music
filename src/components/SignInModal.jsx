import { Modal, Button, Spin, message } from 'antd'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useSignInModalStore } from '@/stores/useSignInModalStore'
import { useUserStore, getNcmCookie, setNcmCookie } from '@/stores/useUserStore'

function SignInModal() {
  const isOpen = useSignInModalStore((s) => s.isSignInModalOpen)
  const setIsOpen = useSignInModalStore((s) => s.setIsSignInModalOpen)
  const signIn = useUserStore((s) => s.signIn)

  const [qrKey, setQrKey] = useState('')
  const [qrUrl, setQrUrl] = useState('')
  const [qrImg, setQrImg] = useState('')
  const [status, setStatus] = useState('idle') // idle, loading, waiting, scanned, expired, confirmed, error
  const [errorMsg, setErrorMsg] = useState('')
  const pollingRef = useRef(null)
  const autoRefreshRef = useRef(null)
  const generateRef = useRef(null)
  const fetchUserInfoRef = useRef(null)

  // Helper to make API request with NCM cookie
  const fetchWithCookie = useCallback(async (url, options = {}) => {
    const cookie = getNcmCookie()
    const headers = { ...options.headers }
    if (cookie) {
      headers['X-NCM-Cookie'] = cookie
    }
    return fetch(url, { ...options, headers })
  }, [])

  const generateQRCode = useCallback(async () => {
    setStatus('loading')
    setErrorMsg('')
    setQrImg('')

    try {
      // Step 1: Get QR key
      const keyRes = await fetch('/api/login/qr-key')
      const keyData = await keyRes.json()

      if (!keyData.success) {
        throw new Error('Failed to generate QR key')
      }

      const key = keyData.key
      setQrKey(key)

      // Step 2: Create QR code
      const createRes = await fetch(`/api/login/qr-create?key=${key}`)
      const createData = await createRes.json()

      if (!createData.success) {
        throw new Error('Failed to create QR code')
      }

      setQrUrl(createData.qrurl)
      if (createData.qrimg) {
        setQrImg(createData.qrimg)
      }
      setStatus('waiting')

      // Start polling
      startPolling(key)
    } catch (err) {
      console.error('Generate QR error:', err)
      setErrorMsg(err.message || '生成二维码失败')
      setStatus('error')
    }
  }, [])

  // Keep generateQRCode in ref for use in polling
  generateRef.current = generateQRCode

  const fetchUserInfo = useCallback(async (cookie) => {
    try {
      // Store the cookie
      if (cookie) {
        setNcmCookie(cookie)
      }

      // Fetch user info with the cookie
      const res = await fetchWithCookie('/api/login/status')
      const data = await res.json()

      if (data.success && data.isSignedIn) {
        signIn({
          username: data.user.username,
          email: '',
          playlists: [],
          collectedPlaylists: [],
          ncmCookie: cookie || getNcmCookie(),
        })
        message.success('登录成功！')
        handleClose()
      } else {
        throw new Error('获取用户信息失败')
      }
    } catch (err) {
      console.error('Fetch user info error:', err)
      setErrorMsg(err.message || '登录验证失败')
      setStatus('error')
    }
  }, [signIn, fetchWithCookie])

  // Keep fetchUserInfo in ref for use in polling
  fetchUserInfoRef.current = fetchUserInfo

  const startPolling = useCallback((key) => {
    // Clear previous polling
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
    }

    // Clear auto refresh timer
    if (autoRefreshRef.current) {
      clearTimeout(autoRefreshRef.current)
    }

    let count = 0
    const maxAttempts = 100 // 100 * 3 = 300 seconds max (5 minutes)

    pollingRef.current = setInterval(async () => {
      count++
      if (count > maxAttempts) {
        clearInterval(pollingRef.current)
        setStatus('expired')
        setErrorMsg('二维码已过期，请点击重新生成')
        return
      }

      try {
        const res = await fetch(`/api/login/qr-check?key=${key}`)
        const data = await res.json()

        if (!data.success) {
          throw new Error('Failed to check QR status')
        }

        if (data.status === 'scanned') {
          setStatus('scanned')
        } else if (data.status === 'confirmed') {
          clearInterval(pollingRef.current)
          setStatus('confirmed')
          // Store the cookie from response
          if (data.cookie) {
            setNcmCookie(data.cookie)
          }
          // Login successful, fetch user info
          fetchUserInfoRef.current?.(data.cookie)
        } else if (data.status === 'expired') {
          clearInterval(pollingRef.current)
          setStatus('expired')
          setErrorMsg('二维码已过期，请点击重新生成')
        }
        // waiting: continue polling
      } catch (err) {
        console.error('QR check error:', err)
        clearInterval(pollingRef.current)
        setStatus('error')
        setErrorMsg('检查二维码状态失败')
      }
    }, 3000)

    // Auto refresh QR code every 2 minutes if not scanned
    autoRefreshRef.current = setTimeout(() => {
      generateRef.current?.()
    }, 120000) // 2 minutes
  }, [])

  useEffect(() => {
    if (isOpen) {
      generateQRCode()
    } else {
      // Cleanup
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
      if (autoRefreshRef.current) {
        clearTimeout(autoRefreshRef.current)
      }
      setQrKey('')
      setQrUrl('')
      setQrImg('')
      setStatus('idle')
      setErrorMsg('')
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
      if (autoRefreshRef.current) {
        clearTimeout(autoRefreshRef.current)
      }
    }
  }, [isOpen, generateQRCode])

  const handleClose = () => {
    setIsOpen(false)
  }

  const handleRegenerate = () => {
    generateQRCode()
  }

  return (
    <Modal
      title="登录网易云音乐"
      open={isOpen}
      onCancel={handleClose}
      footer={null}
      width={400}
      centered
    >
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        {status === 'loading' && (
          <div>
            <Spin size="large" />
            <p style={{ marginTop: 16 }}>正在生成二维码...</p>
          </div>
        )}

        {(status === 'waiting' || status === 'scanned') && qrImg && (
          <div>
            <img
              src={qrImg}
              alt="登录二维码"
              style={{ width: 200, height: 200, margin: '0 auto', display: 'block' }}
            />
            {status === 'waiting' && (
              <>
                <p style={{ marginTop: 16, color: '#666' }}>
                  请使用网易云音乐 App 扫码登录
                </p>
                <p style={{ color: '#999', fontSize: 12 }}>
                  二维码将在 2 分钟后自动刷新
                </p>
              </>
            )}
            {status === 'scanned' && (
              <p style={{ marginTop: 16, color: '#52c41a' }}>
                扫码成功，请在手机上确认登录
              </p>
            )}
          </div>
        )}

        {status === 'expired' && (
          <div>
            <p style={{ marginBottom: 16, color: '#faad14' }}>{errorMsg}</p>
            <Button type="primary" onClick={handleRegenerate}>
              重新生成二维码
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div>
            <p style={{ marginBottom: 16, color: '#ff4d4f' }}>{errorMsg}</p>
            <Button type="primary" onClick={handleRegenerate}>
              重试
            </Button>
          </div>
        )}

        {status === 'confirmed' && (
          <div>
            <Spin size="large" />
            <p style={{ marginTop: 16 }}>登录成功，正在加载...</p>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default SignInModal
