import { Component, Suspense, useMemo, type ReactNode } from 'react'
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

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  const model = useMemo(() => {
    const object = scene.clone(true)
    const bounds = new Box3().setFromObject(object)
    if (bounds.isEmpty()) throw new Error('The artifact model has no visible geometry')
    return { object, sphere: bounds.getBoundingSphere(new Sphere()) }
  }, [scene])

  return <group scale={1 / Math.max(model.sphere.radius, 0.0001)}>
    <group position={model.sphere.center.clone().negate()}>
      <primitive object={model.object} />
    </group>
  </group>
}

export default function ArtifactModelViewer({ url, label, error, loading }: {
  url: string
  label: string
  error: string
  loading: string
}) {
  return <div className="artifact-model-viewer" role="region" aria-label={label}>
    <ModelBoundary key={url} message={error}>
      <Canvas
        frameloop="demand"
        dpr={[1, 1.5]}
        camera={{ position: [2.6, 1.3, 3.4], fov: 42, near: 0.1, far: 25 }}
        fallback={<p role="alert">{error}</p>}
      >
        <color attach="background" args={['#362c20']} />
        <hemisphereLight args={['#fff4dc', '#92795d', 2]} />
        <directionalLight position={[3, 4, 4]} intensity={2.4} />
        <Suspense fallback={<Html center><span className="artifact-model-loading" role="status">{loading}</span></Html>}>
          <Model url={url} />
        </Suspense>
        <OrbitControls enablePan={false} minDistance={1.5} maxDistance={8} />
      </Canvas>
    </ModelBoundary>
  </div>
}
