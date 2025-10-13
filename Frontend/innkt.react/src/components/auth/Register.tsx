import React from 'react';
import { useTranslation } from 'react-i18next';
import EnhancedRegister from './EnhancedRegister';

const Register: React.FC = () => {
  const { t } = useTranslation();
  return <EnhancedRegister />;
};

export default Register;



