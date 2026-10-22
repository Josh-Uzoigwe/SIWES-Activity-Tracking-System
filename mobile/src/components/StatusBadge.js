import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const StatusBadge = ({ status }) => {
  const norm = (status || '').toLowerCase();

  let bg = '#f1f5f9';
  let text = '#475569';
  let label = status || 'Unknown';

  if (norm === 'approved' || norm === 'cleared') {
    bg = '#dcfce7';
    text = '#15803d';
    label = norm === 'cleared' ? 'Cleared' : 'Approved';
  } else if (norm === 'rejected') {
    bg = '#fee2e2';
    text = '#b91c1c';
    label = 'Rejected';
  } else if (norm === 'pending') {
    bg = '#fef3c7';
    text = '#b45309';
    label = 'Pending Review';
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});

export default StatusBadge;
