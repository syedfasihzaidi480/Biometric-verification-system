import { jsx as _jsx } from "react/jsx-runtime";
import { Image } from 'react-native';
// Placeholder for secure image handling (signed URLs, cache policy)
export const SecureImage = (props) => {
    return _jsx(Image, { ...props });
};
export default SecureImage;
