import { Component, Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { Html, OrbitControls, useGLTF } from '@react-three/drei'
import { Box3, Sphere } from 'three'

class ModelBoundary extends Component<{ message: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? <p role="alert">{this.props.message}</p> : this.props.children
  }
}

function Model({ url,onReady }: { url: string;onReady?:()=>void }) {
  const { scene } = useGLTF(url)
  const model = useMemo(() => {
    const object = scene.clone(true)
    const bounds = new Box3().setFromObject(object)
    if (bounds.isEmpty()) throw new Error('The artifact model has no visible geometry')
    return { object, sphere: bounds.getBoundingSphere(new Sphere()) }
  }, [scene])

  useEffect(()=>{onReady?.()},[onReady])
  return <group scale={1 / Math.max(model.sphere.radius, 0.0001)}>
    <group position={model.sphere.center.clone().negate()}>
      <primitive object={model.object} />
    </group>
  </group>
}

export default function ArtifactModelViewer({ url, label, error, loading, inline=false }: {
  url: string
  label: string
  error: string
  loading: string
  inline?: boolean
}) {
  const [readyUrl,setReadyUrl]=useState<string|null>(null)
  const handleReady=useCallback(()=>setReadyUrl(url),[url])
  const camera=useMemo(()=>({
    position:(inline?[2.1,1.1,2.8]:[2.6,1.3,3.4]) as [number,number,number],
    fov:inline?36:42,near:.1,far:25,
  }),[inline])
  return <div className="artifact-model-viewer" role="region" aria-label={label} data-ready={readyUrl===url}>
    <ModelBoundary key={url} message={error}>
      <Canvas
        frameloop="demand"
        dpr={[1, 1.5]}
        camera={camera}
        fallback={<p role="alert">{error}</p>}
      >
        <color attach="background" args={['#362c20']} />
        <hemisphereLight args={['#fff4dc', '#92795d', 2]} />
        <directionalLight position={[3, 4, 4]} intensity={2.4} />
        <Suspense fallback={inline?null:<Html center><span className="artifact-model-loading" role="status">{loading}</span></Html>}>
          <Model url={url} onReady={inline?handleReady:undefined} />
        </Suspense>
        <OrbitControls enableZoom={!inline} enablePan={false} minDistance={1.5} maxDistance={8} />
      </Canvas>
    </ModelBoundary>
  </div>
}

