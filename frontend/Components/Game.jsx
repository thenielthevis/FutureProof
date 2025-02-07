import React, { useState, Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import GameNavbar from './GameNavbar';  // Updated to the correct file name and path


function Model({ path, scale }) {
  const { scene } = useGLTF(path);
  scene.scale.set(scale.x, scale.y, scale.z);
  return <primitive object={scene} />;
}

export default function Game() {
  const [heightCm, setHeightCm] = useState(170);
  const [weight, setWeight] = useState(70);
  const [bmi, setBmi] = useState(0);
  const [bmiCategory, setBmiCategory] = useState('');

  const calculateBmi = () => {
    const heightMeters = heightCm / 100;
    const bmiValue = (weight / (heightMeters * heightMeters)).toFixed(2);
    setBmi(bmiValue);
    setBmiCategory(getBmiCategory(bmiValue));
  };

  const getBmiCategory = (bmi) => {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 24.9) return 'Normal';
    if (bmi < 29.9) return 'Overweight';
    return 'Obese';
  };

  const getScaleByBMI = (bmi) => {
    if (bmi < 18.5) return { x: 0.9, y: 1.1, z: 0.9 };
    if (bmi < 24.9) return { x: 1, y: 1, z: 1 };
    if (bmi < 29.9) return { x: 1.1, y: 0.95, z: 1.1 };
    return { x: 1.2, y: 0.9, z: 1.2 };
  };

  const scale = getScaleByBMI(bmi);

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        background: 'linear-gradient(160deg, #b0eacd, #f0f9f7)',
      }}
    >
      <GameNavbar />  {/* Use the new GameNavbar component */}
      
      {/* 3D Model and BMI Section */}
      <div style={{ flex: 1, marginTop: '50px' }}>
        <Canvas camera={{ position: [0, 1, 5] }} style={{ width: '100%', height: '100%' }}>
          <ambientLight intensity={0.7} />
          <pointLight position={[10, 10, 10]} />
          <Suspense fallback={null}>
            <Model path="/assets/tao.glb" scale={scale} />
          </Suspense>
          <OrbitControls enableDamping maxPolarAngle={Math.PI / 2} minDistance={2} maxDistance={8} />
        </Canvas>
      </div>

      <div
        style={{
          width: '350px',
          padding: '30px',
          backgroundColor: '#ffffff',
          margin: '10px',
          borderRadius: '10px',
          boxShadow: '0px 5px 10px rgba(0, 0, 0, 0.15)',
        }}
      >
        <h2 style={{ fontSize: '1.6rem', fontWeight: 'bold', marginBottom: '15px' }}>
          Character Information
        </h2>
        <form onSubmit={(e) => e.preventDefault()} style={{ display: 'grid', gap: '10px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>
              Height (cm)
            </label>
            <input
              type="number"
              step="1"
              value={heightCm}
              onChange={(e) => setHeightCm(parseFloat(e.target.value))}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '5px',
                border: '1px solid #ddd',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>
              Weight (kg)
            </label>
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(parseFloat(e.target.value))}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '5px',
                border: '1px solid #ddd',
              }}
            />
          </div>
          <button
            type="button"
            onClick={calculateBmi}
            style={{
              width: '100%',
              backgroundColor: '#27ae60',
              color: '#fff',
              padding: '10px',
              borderRadius: '5px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Calculate BMI
          </button>
        </form>
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ fontSize: '1.4rem' }}>BMI: {bmi}</h3>
          <h3 style={{ fontSize: '1.4rem', color: '#27ae60' }}>Category: {bmiCategory}</h3>
        </div>
      </div>
    </div>
  );
}
