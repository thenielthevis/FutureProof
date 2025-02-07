import React from 'react';
import { FaUser, FaBatteryHalf, FaShoppingCart, FaTasks, FaClipboardCheck, FaHome } from 'react-icons/fa';

const GameNavbar = () => (
  <nav
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      background: 'linear-gradient(180deg, rgba(15, 65, 67, 0) 0%, #0f4143 100%)',
      color: '#ffffff',
      padding: '8px 20px',
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
        color: '#ffffff',
      }}
    >
      <FaHome />
    </button>

    {/* Navbar Icons */}
    <ul style={{ display: 'flex', gap: '15px', listStyle: 'none', margin: 0 }}>
      <li style={{ cursor: 'pointer' }}>
        <FaUser />
      </li>
      <li style={{ cursor: 'pointer' }}>
        <FaBatteryHalf />
      </li>
      <li style={{ cursor: 'pointer' }}>
        <FaShoppingCart />
      </li>
      <li style={{ cursor: 'pointer' }}>
        <FaTasks />
      </li>
      <li style={{ cursor: 'pointer' }}>
        <FaClipboardCheck />
      </li>
    </ul>
  </nav>
);

export default GameNavbar;
