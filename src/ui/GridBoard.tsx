import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, typography } from './theme';

export interface GridCell {
  id: string;
  label: string;
  accent?: boolean;
  disabled?: boolean;
}

interface GridBoardProps {
  size: number;
  cells: GridCell[];
  onSelect?: (cell: GridCell) => void;
}

export function GridBoard({ size, cells, onSelect }: GridBoardProps): JSX.Element {
  const cellSize = `${100 / size}%`;
  return (
    <View style={styles.board}>
      {cells.map((cell) => (
        <Pressable
          key={cell.id}
          accessibilityLabel={cell.label}
          onPress={() => onSelect?.(cell)}
          disabled={cell.disabled}
          style={({ pressed }) => [
            styles.cell,
            { width: cellSize },
            cell.accent ? styles.cellAccent : null,
            pressed && !cell.disabled ? styles.cellPressed : null,
          ]}
        >
          <Text style={styles.cellLabel}>{cell.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cell: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  cellAccent: {
    backgroundColor: '#1d2838',
  },
  cellPressed: {
    backgroundColor: colors.primaryMuted,
  },
  cellLabel: {
    ...typography.label,
  },
});
