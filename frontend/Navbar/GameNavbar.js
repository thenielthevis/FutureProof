import React from 'react';
import { FaUser, FaBatteryHalf, FaShoppingCart, FaHome, FaCoins, FaChartLine, FaTasks } from 'react-icons/fa';
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
        padding: '25px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '1.1rem',
        zIndex: 10,
      }}
    >
 
 <div style={{ display: 'flex', gap: '20px', marginLeft: '16px' }}>
         <FaCoins />
         <FaChartLine />
      </div>

      {/* Centered Navbar Icons */}
      <ul
        style={{
          display: 'flex',
          gap: '20px',
          listStyle: 'none',
          margin: 0,
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
        }}
      >
    
        <li style={{ cursor: 'pointer', fontSize: '1.8rem' }}>
          <FaBatteryHalf />
        </li>
     
      </ul>

      {/* Right side: User & Settings Icon */}
      <div style={{ display: 'flex', gap: '25px', marginRight: '60px' }}>
        <FaUser />
        <FaTasks />
      </div>
    </nav>
  );
};

export default GameNavbar;
