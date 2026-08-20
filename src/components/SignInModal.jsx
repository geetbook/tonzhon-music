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
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')
  
  const pollingRef = useRef(null)
  const autoRefreshRef = useRef(null)
  const generateRef = useRef(null)
  const fetchUserInfoRef = useRef(null)
  const confirmedCookieRef = useRef(null)
  const statusRef = useRef('idle')

  useEffect(() => {
    statusRef.current = status
  }, [status])

  const cleanCookie = useCallback((cookieStr) => {
    if (!cookieStr) return ''
    return cookieStr
      .split(';')
      .map(part => part.trim())
      .filter(part => part && !part.startsWith('Max-Age=') && !part.startsWith('Expires=') && !part.startsWith('Path=') && !part.startsWith('Domain=') && !part.startsWith('Secure') && !part.startsWith('HttpOnly') && part.includes('='))
      .join('; ')
  }, [])

  const fetchWithCookie = useCallback(async (url, options = {}) => {
    const cookie = getNcmCookie()
    const headers = { ...(options.headers || {}) }
    if (cookie) {
      headers['X-NCM-Cookie'] = cookie
    }
    return fetch(url, { ...options, headers })
  }, [])

  const fetchUserInfo = useCallback(async (cookie) => {
    try {
      let cleanC = ''
      if (cookie) {
        cleanC = cleanCookie(cookie)
        setNcmCookie(cleanC)
      }

      const res = await fetchWithCookie('/api/login/status')
      const data = await res.json()

      if (data.success && data.isSignedIn) {
        const finalCookie = getNcmCookie()
        signIn({
          username: data.user.username,
          email: '',
          playlists: [],
          collectedPlaylists: [],
          ncmCookie: finalCookie || cleanC,
        })
        message.success('登录成功！')
        confirmedCookieRef.current = null
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
        }
        if (autoRefreshRef.current) {
          clearTimeout(autoRefreshRef.current)
          autoRefreshRef.current = null
        }
        setIsOpen(false)
      } else {
        throw new Error('登录验证失败，请重试')
      }
    } catch (err) {
      console.error('Fetch user info error:', err)
      setErrorMsg(err.message || '登录验证失败')
      setStatus('error')
    }
  }, [signIn, fetchWithCookie, cleanCookie, setIsOpen])

  fetchUserInfoRef.current = fetchUserInfo

  const generateQRCode = useCallback(async () => {
    setStatus('loading')
    setErrorMsg('')
    setQrImg('')
    confirmedCookieRef.current = null

    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
    if (autoRefreshRef.current) {
      clearTimeout(autoRefreshRef.current)
      autoRefreshRef.current = null
    }

    try {
      const keyRes = await fetch('/api/login/qr-key')
      const keyData = await keyRes.json()

      if (!keyData.success) {
        throw new Error('获取二维码密钥失败')
      }

      const key = keyData.key
      setQrKey(key)

      const createRes = await fetch(`/api/login/qr-create?key=${key}`)
      const createData = await createRes.json()

      if (!createData.success) {
        throw new Error('生成二维码失败')
      }

      setQrUrl(createData.qrurl)
      if (createData.qrimg) {
        setQrImg(createData.qrimg)
      }
      setStatus('waiting')
      startPolling(key)
    } catch (err) {
      console.error('Generate QR error:', err)
      setErrorMsg(err.message || '生成二维码失败')
      setStatus('error')
    }
  }, [])

  generateRef.current = generateQRCode

  const startPolling = useCallback((key) => {
    let count = 0
    const maxAttempts = 100

    pollingRef.current = setInterval(async () => {
      count++
      if (count > maxAttempts) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
        setStatus('expired')
        setErrorMsg('二维码已过期，请点击重新生成')
        return
      }

      try {
        const res = await fetch(`/api/login/qr-check?key=${key}`)
        const data = await res.json()

        if (!data.success) {
          throw new Error('检查二维码状态失败')
        }

        if (data.status === 'scanned') {
          setStatus('scanned')
        } else if (data.status === 'confirmed') {
          if (pollingRef.current) {
            clearInterval(pollingRef.current)
            pollingRef.current = null
          }
          if (autoRefreshRef.current) {
            clearTimeout(autoRefreshRef.current)
            autoRefreshRef.current = null
          }
          setStatus('confirmed')

          const cookie = data.cookie || data.rawCookie || ''
          if (cookie) {
            confirmedCookieRef.current = cookie
          }

          fetchUserInfoRef.current?.(cookie)
        } else if (data.status === 'expired') {
          if (pollingRef.current) {
            clearInterval(pollingRef.current)
            pollingRef.current = null
          }
          if (autoRefreshRef.current) {
            clearTimeout(autoRefreshRef.current)
            autoRefreshRef.current = null
          }
          setStatus('expired')
          setErrorMsg('二维码已过期，请点击重新生成')
        }
      } catch (err) {
        console.error('QR check error:', err)
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
        }
        setStatus('error')
        setErrorMsg('检查二维码状态失败')
      }
    }, 3000)

    autoRefreshRef.current = setTimeout(() => {
      if (statusRef.current !== 'confirmed') {
        generateRef.current?.()
      }
    }, 120000)
  }, [])

  useEffect(() => {
    if (isOpen) {
      generateQRCode()
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
      if (autoRefreshRef.current) {
        clearTimeout(autoRefreshRef.current)
        autoRefreshRef.current = null
      }
      setQrKey('')
      setQrUrl('')
      setQrImg('')
      setStatus('idle')
      setErrorMsg('')
      confirmedCookieRef.current = null
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
      if (autoRefreshRef.current) {
        clearTimeout(autoRefreshRef.current)
        autoRefreshRef.current = null
      }
    }
  }, [isOpen, generateQRCode])

  const handleClose = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
    if (autoRefreshRef.current) {
      clearTimeout(autoRefreshRef.current)
      autoRefreshRef.current = null
    }
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
