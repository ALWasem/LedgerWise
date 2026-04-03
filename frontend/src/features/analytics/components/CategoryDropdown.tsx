import { useCallback, useRef, useState } from 'react';
import { Dimensions, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../contexts/ThemeContext';
import { useThemeStyles } from '../../../hooks/useThemeStyles';
import { createAnalyticsStyles } from '../styles/analytics.styles';
import { getCategoryColor } from '../../../utils/categoryColors';
import { isHovered } from '../../../utils/pressable';
import { isNarrow } from '../../../utils/responsive';

const MENU_WIDTH = isNarrow ? 220 : 260;

interface Props {
  categories: string[];
  selected: string | null;
  onSelect: (category: string | null) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function CategoryDropdown({ categories, selected, onSelect, isOpen, onToggle }: Props) {
  const colors = useColors();
  const styles = useThemeStyles(createAnalyticsStyles);
  const triggerRef = useRef<View>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  const displayLabel = selected ?? 'All categories';

  const handleOpen = useCallback(() => {
    if (triggerRef.current) {
      triggerRef.current.measureInWindow((x, y, width, height) => {
        // Right-align menu to the trigger's right edge, with screen padding
        const screenWidth = Dimensions.get('window').width;
        const menuLeft = x + width - MENU_WIDTH;
        const maxLeft = screenWidth - MENU_WIDTH - 16;
        setMenuPos({
          top: y + height + 6,
          left: Math.max(8, Math.min(menuLeft, maxLeft)),
        });
        onToggle();
      });
    } else {
      onToggle();
    }
  }, [onToggle]);

  const handleSelect = useCallback((value: string | null) => {
    onSelect(value);
    onToggle();
  }, [onSelect, onToggle]);

  return (
    <>
      <Pressable
        ref={triggerRef}
        onPress={isOpen ? onToggle : handleOpen}
        style={(state) => [
          styles.dropdownTrigger,
          isOpen && styles.dropdownTriggerOpen,
          !isOpen && isHovered(state) && styles.dropdownTriggerHovered,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Category: ${displayLabel}`}
        accessibilityState={{ expanded: isOpen }}
      >
        {selected && (
          <View style={[styles.dropdownCategoryDot, { backgroundColor: getCategoryColor(selected) }]} />
        )}
        <Text style={styles.dropdownTriggerText}>{displayLabel}</Text>
        <View style={[styles.dropdownChevron, isOpen && styles.dropdownChevronOpen]}>
          <Ionicons
            name="chevron-down"
            size={16}
            color={colors.text.tertiary}
          />
        </View>
      </Pressable>

      <Modal visible={isOpen} transparent animationType="none">
        <Pressable
          style={styles.dropdownBackdrop}
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityLabel="Close dropdown"
        />
        <View
          style={[styles.dropdownMenu, { top: menuPos.top, left: menuPos.left, width: MENU_WIDTH }]}
          pointerEvents="box-none"
        >
          <ScrollView bounces={false} style={styles.dropdownScroll}>
            {/* All Categories option */}
            <Pressable
              onPress={() => handleSelect(null)}
              style={(state) => [
                styles.dropdownItem,
                selected === null && styles.dropdownItemSelected,
                selected !== null && isHovered(state) && styles.dropdownItemHovered,
              ]}
              accessibilityRole="menuitem"
              accessibilityLabel="All Categories"
              accessibilityState={{ selected: selected === null }}
            >
              {selected === null && <View style={styles.dropdownItemActiveBorder} />}
              <Text style={[
                styles.dropdownCategoryItemLabel,
                selected === null && styles.dropdownItemLabelSelected,
              ]}>
                All Categories
              </Text>
            </Pressable>

            {categories.map((name) => {
              const isSelected = selected === name;
              const color = getCategoryColor(name);
              return (
                <Pressable
                  key={name}
                  onPress={() => handleSelect(name)}
                  style={(state) => [
                    styles.dropdownItem,
                    isSelected && styles.dropdownItemSelected,
                    !isSelected && isHovered(state) && styles.dropdownItemHovered,
                  ]}
                  accessibilityRole="menuitem"
                  accessibilityLabel={name}
                  accessibilityState={{ selected: isSelected }}
                >
                  {isSelected && <View style={styles.dropdownItemActiveBorder} />}
                  <View style={[styles.dropdownCategoryDot, { backgroundColor: color }]} />
                  <Text style={[
                    styles.dropdownCategoryItemLabel,
                    isSelected && styles.dropdownItemLabelSelected,
                  ]}>
                    {name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}
