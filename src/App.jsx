import { Layout, ConfigProvider, theme } from 'antd'
import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Player from './components/player/player'
import ListenlistWindow from '@/components/listenlist-window/ListenlistWindow'
import SignInModal from './components/SignInModal'
import ErrorBoundary from './components/ErrorBoundary'
import Loading from '@/components/ui/loading'
import { SongSourceModalProvider } from '@/contexts/SongSourceModalContext'
import { useListenlistOpenStore } from '@/stores/useListenlistOpenStore'
import './App.css'

const Home = lazy(() => import('./pages/home/Home'))
const Search = lazy(() => import('./pages/Search'))
const { Content } = Layout

function App() {
  const isListenlistOpen = useListenlistOpenStore((s) => s.isListenlistOpen)

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <SongSourceModalProvider>
          <ConfigProvider
            theme={{
              algorithm: theme.darkAlgorithm,
              token: {
                colorPrimary: '#FFA500',
                colorLink: '#ffffff',
                colorLinkHover: 'orange',
              },
              components: {
                Menu: {
                  itemPaddingInline: 10,
                },
              },
            }}
          >
            <Layout>
              <Header />
              <Content
                className="container"
                style={{
                  marginTop: 59,
                  marginBottom: 74,
                }}
              >
                <Suspense fallback={<Loading />}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="search/:keyword" element={<Search />} />
                  </Routes>
                </Suspense>
              </Content>
              <Player />
              {isListenlistOpen && <ListenlistWindow />}
              <SignInModal />
            </Layout>
          </ConfigProvider>
        </SongSourceModalProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
