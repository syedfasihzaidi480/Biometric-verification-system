import React, { PropsWithChildren } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

export const Card: React.FC<PropsWithChildren<{ style?: ViewStyle | ViewStyle[] }>> = ({
  children,
  style
}) => {
  return <View style={[styles.card, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  }
});

export default Card;
