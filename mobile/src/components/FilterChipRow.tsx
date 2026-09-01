import { Text, Pressable, View } from 'react-native';
import { MotiView } from 'moti';

interface FilterOption {
  label: string;
  value: string | undefined;
}

interface FilterChipRowProps {
  options: FilterOption[];
  selectedValue: string | undefined;
  onSelect: (value: string | undefined) => void;
}

export const FilterChipRow = ({ options, selectedValue, onSelect }: FilterChipRowProps) => {
  return (
    <View className="flex-row items-center gap-2">
      {options.map((opt, idx) => {
        const isActive = selectedValue === opt.value;
        return (
          <MotiView
            key={idx}
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 50 }}
          >
            <Pressable
              className={`px-4 py-1.5 rounded-full border shadow-sm items-center justify-center ${
                isActive ? 'border-signal' : 'border-line'
              }`}
              onPress={() => onSelect(opt.value)}
            >
              <Text className={`text-[13px] text-muted font-bodyMedium`}>
                {opt.label}
              </Text>
            </Pressable>
          </MotiView>
        );
      })}
    </View>
  );
};
