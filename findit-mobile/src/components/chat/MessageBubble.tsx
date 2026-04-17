import { useState } from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { Message } from '../../types/api.types';

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
}

const MAX_IMAGE_WIDTH = Dimensions.get('window').width * 0.8;

export function MessageBubble({ message, isMine }: MessageBubbleProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  return (
    <>
      <View style={[styles.wrapper, isMine ? styles.mineWrapper : styles.otherWrapper]}>
        <View style={[styles.bubble, isMine ? styles.mine : styles.other]}>
          {message.photo_url ? (
            <Pressable onPress={() => setIsPreviewOpen(true)}>
              <Image source={{ uri: message.photo_url }} style={styles.photo} contentFit="cover" />
            </Pressable>
          ) : null}

          {message.contenu ? (
            <Text style={[styles.content, isMine ? styles.mineText : styles.otherText]}>{message.contenu}</Text>
          ) : null}

          <Text style={[styles.time, isMine ? styles.mineTime : styles.otherTime]}>
            {new Date(message.created_at).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        {isMine && message.is_read ? <Text style={styles.readReceipt}>Lu ✓</Text> : null}
      </View>

      <Modal visible={isPreviewOpen} transparent animationType="fade" onRequestClose={() => setIsPreviewOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setIsPreviewOpen(false)}>
          {message.photo_url ? (
            <Image source={{ uri: message.photo_url }} style={styles.fullscreenPhoto} contentFit="contain" />
          ) : null}
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  mineWrapper: {
    alignItems: 'flex-end',
  },
  otherWrapper: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  mine: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: borderRadius.sm,
  },
  other: {
    backgroundColor: '#E5E7EB',
    borderBottomLeftRadius: borderRadius.sm,
  },
  content: {
    ...typography.body,
  },
  mineText: {
    color: colors.text.inverse,
  },
  otherText: {
    color: colors.text.primary,
  },
  time: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  mineTime: {
    color: '#DBEAFE',
    textAlign: 'right',
  },
  otherTime: {
    color: colors.text.secondary,
    textAlign: 'left',
  },
  readReceipt: {
    ...typography.caption,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  photo: {
    width: MAX_IMAGE_WIDTH,
    maxWidth: MAX_IMAGE_WIDTH,
    height: MAX_IMAGE_WIDTH * 0.75,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.background.secondary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  fullscreenPhoto: {
    width: '100%',
    height: '80%',
  },
});

