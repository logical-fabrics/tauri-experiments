import { useEffect } from 'react'
import ChatApp from './components/ChatApp'

function App() {
  useEffect(() => {
    // Enable developer tools in Tauri for debugging
    console.log('=================================')
    console.log('Tauri App Started')
    console.log('To open DevTools: ')
    console.log('  Mac: Cmd+Option+I or right-click')
    console.log('  Windows/Linux: Ctrl+Shift+I or F12')
    console.log('=================================')
  }, [])

  return <ChatApp />
}

export default App
