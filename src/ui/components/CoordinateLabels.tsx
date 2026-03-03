import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface CoordinateLabelsProps {
  boardSize: number;
  fontSize: number;
}

export const RankLabels: React.FC<CoordinateLabelsProps> = ({
  boardSize,
  fontSize,
}) => (
  <View style={[styles.rankLabels, { height: boardSize }]}>
    {['8', '7', '6', '5', '4', '3', '2', '1'].map((rank) => (
      <View key={`rank-${rank}`} style={styles.rankLabel}>
        <Text style={[styles.coordinateText, { fontSize }]}>{rank}</Text>
      </View>
    ))}
  </View>
);

export const FileLabels: React.FC<
  CoordinateLabelsProps & { marginLeft: number }
> = ({ boardSize, fontSize, marginLeft }) => (
  <View style={[styles.fileLabels, { width: boardSize, marginLeft }]}>
    {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((file) => (
      <View key={`file-${file}`} style={styles.fileLabel}>
        <Text style={[styles.coordinateText, { fontSize }]}>{file}</Text>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  rankLabels: {
    flexDirection: 'column',
    width: 40,
    marginRight: 4,
    justifyContent: 'space-around',
  },
  rankLabel: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
  },
  fileLabels: {
    flexDirection: 'row',
    marginTop: 4,
  },
  fileLabel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 20,
  },
  coordinateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
});
