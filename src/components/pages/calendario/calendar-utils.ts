import { CALENDAR_TIME_SLOTS } from "@/lib/calendario/constants";
import { parseHorarioToSlots } from "@/lib/calendario/utils";
import type { ClassWithRoom } from "./types";

export type MergedSlot = {
  timeSlotIndex: number;
  classes: ClassWithRoom[];
  rowSpan: number;
  isStartOfMerge: boolean;
};

/**
 * Process classes for a day to identify consecutive slots that can be merged
 */
export function processDaySlots(
  day: number,
  selectedClasses: ClassWithRoom[]
): Map<number, MergedSlot> {
  // First, get all classes for each time slot
  const slotMap = new Map<number, ClassWithRoom[]>();

  selectedClasses.forEach(classItem => {
    const slots = parseHorarioToSlots(classItem.horario);
    slots.forEach(slot => {
      if (slot.day === day) {
        const timeSlotIndex = slot.timeSlot;
        if (!slotMap.has(timeSlotIndex)) {
          slotMap.set(timeSlotIndex, []);
        }
        // Only add if not already present (avoid duplicates)
        const existing = slotMap.get(timeSlotIndex);
        if (existing && !existing.find(c => c.id === classItem.id)) {
          existing.push(classItem);
        }
      }
    });
  });

  // Now identify consecutive slots for the same class(es)
  const result = new Map<number, MergedSlot>();
  const processedSlots = new Set<number>();

  // Sort time slots
  const sortedSlots = Array.from(slotMap.keys()).sort((a, b) => a - b);

  for (let i = 0; i < sortedSlots.length; i++) {
    const currentSlot = sortedSlots[i];
    if (processedSlots.has(currentSlot)) {
      continue;
    }

    const currentClasses = slotMap.get(currentSlot);
    if (!currentClasses) {
      result.set(currentSlot, {
        timeSlotIndex: currentSlot,
        classes: [],
        rowSpan: 1,
        isStartOfMerge: true,
      });
      processedSlots.add(currentSlot);
      continue;
    }

    const hasConflict = currentClasses.length > 1;

    // If there's a conflict, we can't merge - just use single slot
    if (hasConflict) {
      result.set(currentSlot, {
        timeSlotIndex: currentSlot,
        classes: currentClasses,
        rowSpan: 1,
        isStartOfMerge: true,
      });
      processedSlots.add(currentSlot);
      continue;
    }

    // If no conflict, check for consecutive slots with the same single class
    if (currentClasses.length === 1) {
      const classItem = currentClasses[0];
      let consecutiveCount = 1;
      let nextSlot = currentSlot + 1;

      // Check if next slot has the same single class
      while (nextSlot <= CALENDAR_TIME_SLOTS.length && slotMap.has(nextSlot)) {
        const nextSlotClasses = slotMap.get(nextSlot);
        if (
          nextSlotClasses &&
          nextSlotClasses.length === 1 &&
          nextSlotClasses[0].id === classItem.id &&
          !processedSlots.has(nextSlot)
        ) {
          consecutiveCount++;
          processedSlots.add(nextSlot);
          nextSlot++;
        } else {
          break;
        }
      }

      // Mark all consecutive slots as processed
      for (let j = 0; j < consecutiveCount; j++) {
        processedSlots.add(currentSlot + j);
      }

      result.set(currentSlot, {
        timeSlotIndex: currentSlot,
        classes: [classItem],
        rowSpan: consecutiveCount,
        isStartOfMerge: true,
      });

      // For subsequent slots in the merge, mark them but don't add to result
      // (they'll be skipped during rendering)
      for (let j = 1; j < consecutiveCount; j++) {
        result.set(currentSlot + j, {
          timeSlotIndex: currentSlot + j,
          classes: [classItem],
          rowSpan: consecutiveCount,
          isStartOfMerge: false,
        });
      }
    } else {
      // No classes in this slot
      result.set(currentSlot, {
        timeSlotIndex: currentSlot,
        classes: [],
        rowSpan: 1,
        isStartOfMerge: true,
      });
      processedSlots.add(currentSlot);
    }
  }

  // Fill in any missing slots (slots with no classes)
  for (let slotIndex = 1; slotIndex <= CALENDAR_TIME_SLOTS.length; slotIndex++) {
    if (!result.has(slotIndex)) {
      result.set(slotIndex, {
        timeSlotIndex: slotIndex,
        classes: [],
        rowSpan: 1,
        isStartOfMerge: true,
      });
    }
  }

  return result;
}
