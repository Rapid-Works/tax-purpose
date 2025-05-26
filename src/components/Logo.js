import React from 'react';
import { Link } from 'react-router-dom';
import leilaLogo from '../images/leilalogo.png';

const Logo = () => {
  return (
    <Link to="/" className="flex items-center">
      <img src={leilaLogo} alt="tax & purpose logo, stylized olive branch and text" className="h-12 w-auto" />
    </Link>
  );
};

export default Logo; 