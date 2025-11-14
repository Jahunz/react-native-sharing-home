import { Button, ButtonText } from '@/components/ui/button';
import { CalendarDaysIcon } from '@/components/ui/icon';
import { Input } from "@/components/ui/input";
import {
    Modal,
    ModalBackdrop,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
} from '@/components/ui/modal';
import { Heading, Text } from '@/components/ui/text';
import { formatDate } from '@/utils/format_date';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';

interface StyledDatePickerProps {
  label?: string;
  placeholder?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
}

export default function StyledDatePicker({
  label,
  placeholder = "Placeholder Text",
  value,
  onChange,
}: StyledDatePickerProps) {
  const [showModal, setShowModal] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(value || new Date());
  React.useEffect(() => {
    setTempDate(value || new Date());
  }, [value]);

  const handleConfirm = () => {
    onChange(tempDate);
    setShowModal(false);
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  // Calendar generation
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const generateCalendar = () => {
    const daysInMonth = getDaysInMonth(tempDate);
    const firstDay = getFirstDayOfMonth(tempDate);
    const days: (number | null)[] = [];

    // Add empty slots for days before the first day
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(tempDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setTempDate(newDate);
  };

  const selectDay = (day: number) => {
    const newDate = new Date(tempDate);
    newDate.setDate(day);
    setTempDate(newDate);
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <>
      {label && <Text size="sm" className="text-gray-600 my-2">{label}</Text>}
      
      <Pressable onPress={() => setShowModal(true)}>
        <Input variant="outline" className="mb-4 h-14" isDisabled>
          <View className="flex-1 flex-row items-center justify-between px-3">
            <Text size="md" className={value ? "text-typography-900" : "text-typography-500"}>
              {value ? formatDate(value) : placeholder}
            </Text>
            <CalendarDaysIcon className="text-typography-400 h-[18px] w-[18px]" />
          </View>
        </Input>
      </Pressable>

      <Modal isOpen={showModal} onClose={handleCancel} size="md">
        <ModalBackdrop />
        <ModalContent>
          <ModalHeader>
            <Heading size="md">Select Date</Heading>
          </ModalHeader>
          
          <ModalBody>
            {/* Month/Year navigation */}
            <View className="flex-row justify-between items-center mb-4">
              <Pressable onPress={() => changeMonth(-1)} className="p-2">
                <Text size="lg" weight="bold">←</Text>
              </Pressable>
              <Text size="md" weight="semibold">
                {monthNames[tempDate.getMonth()]} {tempDate.getFullYear()}
              </Text>
              <Pressable onPress={() => changeMonth(1)} className="p-2">
                <Text size="lg" weight="bold">→</Text>
              </Pressable>
            </View>

            {/* Day names */}
            <View className="flex-row mb-2">
              {dayNames.map((day) => (
                <View key={day} className="flex-1 items-center py-2">
                  <Text size="xs" weight="semibold" className="text-gray-600">
                    {day}
                  </Text>
                </View>
              ))}
            </View>

            {/* Calendar grid */}
            <View className="flex-row flex-wrap">
              {generateCalendar().map((day, index) => {
                const isSelected = day === tempDate.getDate();
                const isToday = 
                  day === new Date().getDate() &&
                  tempDate.getMonth() === new Date().getMonth() &&
                  tempDate.getFullYear() === new Date().getFullYear();

                return (
                  <View key={index} className="w-[14.28%] p-1">
                    {day ? (
                      <Pressable
                        onPress={() => selectDay(day)}
                        className={`aspect-square items-center justify-center rounded-lg ${
                          isSelected
                            ? 'bg-primary-500'
                            : isToday
                            ? 'bg-primary-100'
                            : ''
                        }`}
                      >
                        <Text
                          size="sm"
                          className={
                            isSelected
                              ? 'text-white font-semibold'
                              : isToday
                              ? 'text-primary-600 font-semibold'
                              : 'text-gray-800'
                          }
                        >
                          {day}
                        </Text>
                      </Pressable>
                    ) : (
                      <View className="aspect-square" />
                    )}
                  </View>
                );
              })}
            </View>
          </ModalBody>

          <ModalFooter>
            <Button variant="outline" onPress={handleCancel} className="mr-2">
              <ButtonText>Cancel</ButtonText>
            </Button>
            <Button onPress={handleConfirm}>
              <ButtonText>Confirm</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

