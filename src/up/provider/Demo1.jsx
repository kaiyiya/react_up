import React from 'react'
const ThemeProvider = ThemeContext.Provider  //提供者
export default function ProviderDemo() {
    const [contextValue, setContextValue] = React.useState({ color: '#ccc', background: 'pink' })
    return <div>
        <ThemeProvider value={contextValue} >
            <Son />
        </ThemeProvider>
    </div>
}
