import React from 'react';
import Icon from 'react-native-vector-icons/FontAwesome';
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
        <Icon name="money" size={24} color="#F5F5F5" />
        <Icon name="line-chart" size={24} color="#F5F5F5" />
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
          <Icon name="battery-half" size={24} color="#F5F5F5" />
        </li>
      </ul>

      {/* Right side: User & Settings Icon */}
      <div style={{ display: 'flex', gap: '25px', marginRight: '60px' }}>
        <Icon name="user" size={24} color="#F5F5F5" />
        <Icon name="tasks" size={24} color="#F5F5F5" />
      </div>
    </nav>
  );
};

export default GameNavbar;
