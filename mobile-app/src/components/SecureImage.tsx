import React from 'react';
import { Image, ImageProps } from 'react-native';

// Placeholder for secure image handling (signed URLs, cache policy)
export const SecureImage: React.FC<ImageProps> = (props) => {
  return <Image {...props} />;
};

export default SecureImage;
