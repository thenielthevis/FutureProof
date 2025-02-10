import React from 'react';
import { FaUser, FaBatteryHalf, FaShoppingCart, FaTasks, FaClipboardCheck, FaHome, FaChartLine } from 'react-icons/fa';
import { useNavigation } from '@react-navigation/native';

const GameNavbar = () => {
  const navigation = useNavigation();

  return (
    <nav
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        background: '#1A3B32',
        color: '#F5F5F5',
        padding: '20px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '1.1rem',
        zIndex: 10,
      }}
    >
      {/* Home Icon Button */}
      <button
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontSize: '1.5rem',
          color: '#F5F5F5',
          marginRight: '16px',
        }}
        onClick={() => navigation.navigate('Home')}
      >
        <FaHome />
      </button>

      {/* Navbar Icons */}
      <ul style={{ display: 'flex', gap: '15px', listStyle: 'none', margin: 0 }}>
        <li style={{ cursor: 'pointer', marginRight: '50px' }}>
          <FaUser />
        </li>
        <li style={{ cursor: 'pointer', marginRight: '50px' }}>
          <FaBatteryHalf />
        </li>
        <li style={{ cursor: 'pointer', marginRight: '50px' }}>
          <FaShoppingCart />
        </li>
        <li style={{ cursor: 'pointer', marginRight: '50px' }}>
          <FaTasks />
        </li>
        <li style={{ cursor: 'pointer', marginRight: '50px' }}>
          <FaClipboardCheck />
        </li>
        <li style={{ cursor: 'pointer', marginRight: '50px' }} onClick={() => navigation.navigate('Prediction')}>
          <FaChartLine />
        </li>
      </ul>
    </nav>
  );
};

export default GameNavbar;
