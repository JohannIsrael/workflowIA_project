import { useEffect, useState } from 'react'
import reactLogo from "@src/assets/react.svg";
import '@src/App.css'
import { Button } from '@mui/material'
import Layout from '@src/components/core/layout/Layout'  // importamos el layout
import type { AxiosResponse } from 'axios';
import { getHelloAPI } from '@src/apis/public';

export default function Home() {
  const [count, setCount] = useState(0)
  const [hello, setHello] = useState('')

  useEffect(() => {
    console.log('getHelloAPI');
    getHelloAPI()
    .then(data => {
      console.log("Datos recibidos:", data);
      setHello(data.message);
    })
      .catch((err: any) => console.error(err))
  }, [])


  return (
    <Layout center={true}>
      <div style={{ textAlign: 'center', maxWidth: '600px' }}>
        <div style={{ marginBottom: '2rem' }}>
          <a href="https://vite.dev" target="_blank"></a>
          <a href="https://react.dev" target="_blank">
            <img src={reactLogo} className="logo react" alt="React logo" />
          </a>
        </div>
        
        <h1 style={{ marginBottom: '2rem' }}>Asiste de IA</h1>
        
        <p>{hello}</p>

        <div className="card" style={{ marginBottom: '2rem' }}>
          <Button variant="outlined" onClick={() => setCount((count) => count + 1)}>
            count is {count}
          </Button>
          <p>
            Edit <code>src/App.tsx</code> and save to test HMR
          </p>
        </div>
        
        <p className="read-the-docs">
          Click on the Vite and React logos to learn more
        </p>
      </div>
    </Layout>
  )
}
