import { Link } from 'react-router-dom'
import { Button, Avatar, Dropdown } from 'antd'
import { User, LogOut } from 'lucide-react'
import SearchBar from './SearchBar'
import { useSignInModalStore } from '@/stores/useSignInModalStore'
import { useUserStore } from '@/stores/useUserStore'

export default function Header() {
  const setIsSignInModalOpen = useSignInModalStore((s) => s.setIsSignInModalOpen)
  const isSignedIn = useUserStore((s) => s.isSignedIn)
  const username = useUserStore((s) => s.username)
  const signOut = useUserStore((s) => s.signOut)

  const handleLoginClick = () => {
    setIsSignInModalOpen(true)
  }

  const handleLogout = () => {
    signOut()
  }

  const items = [
    {
      key: 'logout',
      icon: <LogOut size={14} />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  return (
    <header
      style={{
        position: 'fixed',
        width: '100%',
        zIndex: 1040,
        padding: '8px 0',
        boxShadow: '0 1px 3px rgba(26,26,26,.1)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
        }}
      >
        <div style={{ flex: '0 0 auto' }}>
          <Link to="/">
            <h1
              style={{
                margin: 0,
              }}
            >
              铜钟 Tonzhon
            </h1>
          </Link>
        </div>
        <div style={{ flex: '1' }}>
          <SearchBar />
        </div>
        <div style={{ flex: '0 0 auto' }}>
          {isSignedIn ? (
            <Dropdown menu={{ items }} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar icon={<User size={16} />} />
                <span>{username}</span>
              </div>
            </Dropdown>
          ) : (
            <Button type="primary" onClick={handleLoginClick}>
              登录
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
