import { Heading, Text } from '@/components/ui/text';
import React from 'react';
import { Pressable, View } from 'react-native';

interface RoomCardProps {
    roomName: string;
    homeName?: string | undefined;
    memberCount: number;
    invoiceStatus?: string | undefined;
    nextInvoiceDate: string;
    onPress?: () => void;
  };
  
export default function RoomCard({ roomName, homeName, memberCount, invoiceStatus, nextInvoiceDate, onPress }: RoomCardProps) {
    return (
      <Pressable 
        onPress={onPress}
        className="bg-white rounded-2xl p-5 mb-3 shadow-sm flex-row items-center justify-between"
      >
        <View className="flex-1">
            <Heading size="sm" className="mb-2 text-gray-800">
              {homeName ? `${homeName} - ${roomName}` : roomName}
            </Heading>
            <Text size="sm" className="text-gray-600 mb-1">
              {`${String(memberCount)} members ${invoiceStatus ? `• ${invoiceStatus}` : ''}`}
            </Text>
            <Text size="sm" className="text-gray-600">
              {`Next invoice date: ${nextInvoiceDate ?? "-"}`}
            </Text>
        </View>
      </Pressable>
    );
  }