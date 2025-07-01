import { Outlet, Navigate } from 'react-router-dom';
import { decoder64 } from './Components/Base64Encoder/Base64Encoder';
import { getToken }  from './Components/GetToken/GetToken';

const PrivateRoutes = ({ requiredRole }) => {
  const token = getToken('token');

  console.log('Token before decoding:', token); // Log token để check

  if (!token) return <Navigate to="/" />;

  // Giải mã token
  const decodedToken = decoder64(token);
  console.log('Decoded token:', decodedToken); // Log Token

  if (!decodedToken) {
    console.error('Invalid or corrupted token:', decodedToken);
    return <Navigate to="/" />;
  }

  // Phân tích token
  let parsedToken;
  try {
    parsedToken = JSON.parse(decodedToken);
  } catch (error) {
    console.error('Failed to parse token:', error);
    return <Navigate to="/" />;
  }

  console.log('Parsed Token:', parsedToken); // Log token

  // check điều kiện role_id
  if (parsedToken.role_id === requiredRole) {
    return <Outlet />;
  } else {
    console.error('Access denied. User role is not authorized.'); // Log ra để check
    return <Navigate to="/" />;
  }
};

export default PrivateRoutes;
